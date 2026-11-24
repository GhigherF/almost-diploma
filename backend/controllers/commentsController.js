const jwt = require('jsonwebtoken');
const { validateComment } = require('../utils/validators');

async function getComments(pool, postId, authHeader) {
  const viewerId = authHeader
    ? (() => { try { return jwt.verify(authHeader.slice(7), process.env.JWT_SECRET).user_id; } catch { return null; } })()
    : null; 

  const { rows: comments } = await pool.query(
    `SELECT c.*, u.nick AS username, u.avatar_url AS user_avatar
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC`,
    [postId]
  );

  const ids = comments.map(c => c.id);
  let myLikes = new Set();
  const likesMap = {};
  if (ids.length) {
    const { rows: lc } = await pool.query(
      'SELECT comment_id, COUNT(*) AS cnt FROM likes_comments WHERE comment_id = ANY($1) GROUP BY comment_id', [ids]
    );
    lc.forEach(r => { likesMap[r.comment_id] = parseInt(r.cnt); });
    if (viewerId) {
      const { rows: ml } = await pool.query(
        'SELECT comment_id FROM likes_comments WHERE user_id = $1 AND comment_id = ANY($2)', [viewerId, ids]
      );
      myLikes = new Set(ml.map(r => r.comment_id));
    }
  }

  return comments.map(c => ({
    ...c,
    likes_count: likesMap[c.id] || 0,
    liked_by_me: myLikes.has(c.id),
  })).sort((a, b) => {
    if (a.parent_id === b.parent_id) return b.likes_count - a.likes_count;
    return 0;
  });
}

async function getCommentsCount(pool, postId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS cnt FROM comments WHERE post_id = $1 AND deleted = FALSE',
    [postId]
  );
  return rows[0].cnt;
}

async function createComment(pool, postId, userId, body, parentId, broadcast) {
  const validation = validateComment(body);
  if (!validation.valid) {
    throw { status: 400, message: validation.message };
  }

  const { rows: userRows } = await pool.query('SELECT banned FROM users WHERE id = $1', [userId]);
  if (userRows[0]?.banned) {
    throw { status: 403, message: 'Ваш аккаунт заблокирован. Вы не можете оставлять комментарии.' };
  }

  const { rows } = await pool.query(
    `INSERT INTO comments (post_id, user_id, body, parent_id) VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [postId, userId, body, parentId || null]
  );
  const comment = rows[0];
  const { rows: uRows } = await pool.query(
    'SELECT nick, avatar_url FROM users WHERE id = $1', [userId]
  );
  const full = { ...comment, username: uRows[0].nick, user_avatar: uRows[0].avatar_url, likes_count: 0, liked_by_me: false };
  const comments_count = await getCommentsCount(pool, postId);
  broadcast(postId, { type: 'comment', comment: full, comments_count });
  return full;
}

async function deleteComment(pool, commentId, userId, userRole, broadcast) {
  const { rows } = await pool.query('SELECT * FROM comments WHERE id = $1', [commentId]);
  if (!rows.length) {
    throw { status: 404, message: 'Комментарий не найден' };
  }
  const comment = rows[0];
  if (userRole === 'admin' && comment.user_id !== userId) {
    await pool.query('UPDATE comments SET deleted = TRUE, deleted_by_admin = TRUE WHERE id = $1', [commentId]);
    const comments_count = await getCommentsCount(pool, comment.post_id);
    broadcast(comment.post_id, { type: 'comment_deleted', comment_id: comment.id, deleted_by_admin: true, comments_count });
    await pool.query(
      `INSERT INTO notifications (user_id, type, message) VALUES ($1, 'comment_deleted_by_admin', $2)`,
      [comment.user_id, `Ваш комментарий «${comment.body.slice(0, 60)}${comment.body.length > 60 ? '...' : ''}» был удалён администратором.`]
    );
  } else if (comment.user_id === userId) {
    await pool.query('UPDATE comments SET deleted = TRUE WHERE id = $1', [commentId]);
    const comments_count = await getCommentsCount(pool, comment.post_id);
    broadcast(comment.post_id, { type: 'comment_deleted', comment_id: comment.id, deleted_by_admin: false, comments_count });
  } else {
    throw { status: 403, message: 'Нет доступа' };
  }
  return { ok: true };
}

module.exports = { getComments, createComment, deleteComment };
