async function togglePostLike(pool, postId, userId, broadcast) {
  console.log('[LIKE] User', userId, 'toggling like on post', postId);
  const { rows } = await pool.query(
    'SELECT id FROM likes_posts WHERE post_id = $1 AND user_id = $2', [postId, userId]
  );
  let liked;
  if (rows.length) {
    await pool.query('DELETE FROM likes_posts WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    liked = false;
    console.log('[LIKE] Removed like');
  } else {
    await pool.query('INSERT INTO likes_posts (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
    liked = true;
    console.log('[LIKE] Added like');
  }
  const { rows: cnt } = await pool.query(
    'SELECT COUNT(*) AS cnt FROM likes_posts WHERE post_id = $1', [postId]
  );
  const likes_count = parseInt(cnt[0].cnt);
  console.log('[LIKE] Total likes for post', postId, ':', likes_count);
  broadcast(postId, { type: 'like', post_id: postId, likes_count });
  return { liked, likes_count };
}

async function toggleCommentLike(pool, commentId, userId, broadcast) {
  const { rows: commentRows } = await pool.query('SELECT post_id FROM comments WHERE id = $1', [commentId]);
  if (!commentRows.length) {
    throw { status: 404, message: 'Комментарий не найден' };
  }
  const post_id = commentRows[0].post_id;

  const { rows } = await pool.query(
    'SELECT id FROM likes_comments WHERE comment_id = $1 AND user_id = $2', [commentId, userId]
  );
  let liked;
  if (rows.length) {
    await pool.query('DELETE FROM likes_comments WHERE comment_id = $1 AND user_id = $2', [commentId, userId]);
    liked = false;
  } else {
    await pool.query('INSERT INTO likes_comments (comment_id, user_id) VALUES ($1, $2)', [commentId, userId]);
    liked = true;
  }
  const { rows: cnt } = await pool.query(
    'SELECT COUNT(*) AS cnt FROM likes_comments WHERE comment_id = $1', [commentId]
  );
  const likes_count = parseInt(cnt[0].cnt);
  broadcast(post_id, { type: 'comment_like', comment_id: commentId, likes_count });
  return { liked, likes_count };
}

module.exports = { togglePostLike, toggleCommentLike };
