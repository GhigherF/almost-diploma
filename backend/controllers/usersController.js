const jwt = require('jsonwebtoken');
const { enrichPosts } = require('./postsController');

async function getUsers(pool, authHeader) {
  const viewerId = authHeader
    ? (() => { try { return jwt.verify(authHeader.slice(7), process.env.JWT_SECRET).user_id; } catch { return null; } })()
    : null;

  const { rows } = await pool.query(
    'SELECT id, nick, role, avatar_url FROM users WHERE role != $1 ORDER BY created_at ASC',
    ['admin']
  );

  if (viewerId) {
    const { rows: subs } = await pool.query(
      'SELECT followee_id FROM subscriptions WHERE follower_id = $1', [viewerId]
    );
    const followingSet = new Set(subs.map(r => r.followee_id));
    return rows.map(u => ({ ...u, is_following: followingSet.has(u.id) }));
  }

  return rows.map(u => ({ ...u, is_following: false }));
}

async function getUserActivity(pool, userId) {
  const { rows: posts } = await pool.query(
    `SELECT DATE(created_at) AS day, COUNT(*) AS cnt 
     FROM posts 
     WHERE user_id=$1 AND deleted=FALSE AND created_at > NOW()-INTERVAL '30 days' 
     GROUP BY DATE(created_at)
     ORDER BY day`, 
    [userId]
  );
  const { rows: comments } = await pool.query(
    `SELECT DATE(created_at) AS day, COUNT(*) AS cnt 
     FROM comments 
     WHERE user_id=$1 AND deleted=FALSE AND created_at > NOW()-INTERVAL '30 days' 
     GROUP BY DATE(created_at)
     ORDER BY day`, 
    [userId]
  );
  const { rows: likes } = await pool.query(
    `SELECT DATE(lp.created_at) AS day, COUNT(*) AS cnt 
     FROM likes_posts lp 
     JOIN posts p ON lp.post_id=p.id 
     WHERE p.user_id=$1 AND lp.created_at > NOW()-INTERVAL '30 days' 
     GROUP BY DATE(lp.created_at)
     ORDER BY day`, 
    [userId]
  );
  const { rows: views } = await pool.query(
    `SELECT DATE(pv.viewed_at) AS day, COUNT(*) AS cnt 
     FROM post_views pv 
     JOIN posts p ON pv.post_id=p.id 
     WHERE p.user_id=$1 AND pv.viewed_at > NOW()-INTERVAL '30 days' 
     GROUP BY DATE(pv.viewed_at)
     ORDER BY day`, 
    [userId]
  );
  
  console.log('[ACTIVITY] User:', userId, 'Posts:', posts.length, 'Comments:', comments.length, 'Likes:', likes.length, 'Views:', views.length);
  
  return { posts, comments, likes, views };
}

async function getUserComments(pool, userId) {
  const { rows } = await pool.query(
    `SELECT c.*, p.body AS post_body
     FROM comments c JOIN posts p ON c.post_id = p.id
     WHERE c.user_id = $1 AND c.deleted = FALSE
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return rows;
}

async function getUserPosts(pool, userId, authHeader) {
  const viewerId = authHeader
    ? (() => { try { return jwt.verify(authHeader.slice(7), process.env.JWT_SECRET).user_id; } catch { return null; } })()
    : null;

  const { rows: posts } = await pool.query(
    `SELECT p.*, u.nick AS username, u.avatar_url AS user_avatar
     FROM posts p JOIN users u ON p.user_id = u.id
     WHERE p.user_id = $1 AND p.deleted = FALSE
     ORDER BY p.created_at DESC`,
    [userId]
  );

  return await enrichPosts(pool, posts, viewerId);
}

async function getUserProfile(pool, userId, authHeader) {
  const viewerId = authHeader
    ? (() => { try { return jwt.verify(authHeader.slice(7), process.env.JWT_SECRET).user_id; } catch { return null; } })()
    : null;

  const { rows } = await pool.query(
    'SELECT id, nick, email, role, avatar_url, created_at, banned, banned_at FROM users WHERE id = $1',
    [userId]
  );
  if (!rows.length) {
    throw { status: 404, message: 'Пользователь не найден' };
  }
  const user = rows[0];

  const { rows: s } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM posts WHERE user_id = $1 AND deleted = FALSE) AS posts_count,
      (SELECT COUNT(*) FROM comments WHERE user_id = $1 AND deleted = FALSE) AS comments_count,
      (SELECT COUNT(*) FROM likes_posts lp JOIN posts p ON lp.post_id = p.id WHERE p.user_id = $1) AS received_post_likes,
      (SELECT COUNT(*) FROM likes_comments lc JOIN comments c ON lc.comment_id = c.id WHERE c.user_id = $1) AS received_comment_likes,
      (SELECT COUNT(*) FROM post_views pv JOIN posts p ON pv.post_id = p.id WHERE p.user_id = $1) AS received_views,
      (SELECT COUNT(*) FROM subscriptions WHERE followee_id = $1) AS followers_count,
      (SELECT COUNT(*) FROM subscriptions WHERE follower_id = $1) AS following_count
  `, [userId]);

  let is_following = false;
  if (viewerId && viewerId !== parseInt(userId)) {
    const { rows: sub } = await pool.query(
      'SELECT id FROM subscriptions WHERE follower_id = $1 AND followee_id = $2', [viewerId, userId]
    );
    is_following = sub.length > 0;
  }

  return { ...user, ...s[0], is_following };
}

async function updateUserProfile(pool, userId, nick, email, avatar_url) {
  const fields = [];
  const vals = [];
  if (nick) { fields.push(`nick = $${fields.length + 1}`); vals.push(nick.trim()); }
  if (email) { fields.push(`email = $${fields.length + 1}`); vals.push(email.trim().toLowerCase()); }
  if (avatar_url) { fields.push(`avatar_url = $${fields.length + 1}`); vals.push(avatar_url); }
  if (!fields.length) {
    throw { status: 400, message: 'Нечего обновлять' };
  }

  vals.push(userId);
  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${vals.length} RETURNING id, nick, email, role, avatar_url, created_at`,
    vals
  );
  return rows[0];
}

async function getUserViews(pool, userId, requesterId, requesterRole) {
  if (requesterId !== parseInt(userId) && requesterRole !== 'admin') {
    throw { status: 403, message: 'Нет доступа' };
  }
  const { rows: viewRows } = await pool.query(
    `SELECT pv.viewed_at, p.*, u.nick AS username, u.avatar_url AS user_avatar
     FROM post_views pv
     JOIN posts p ON pv.post_id = p.id
     JOIN users u ON p.user_id = u.id
     WHERE pv.user_id = $1 AND p.deleted = FALSE
     ORDER BY pv.viewed_at DESC`,
    [userId]
  );
  const enriched = await enrichPosts(pool, viewRows, requesterId);
  return enriched.map((p, i) => ({ ...p, viewed_at: viewRows[i].viewed_at }));
}

async function getUserFollowers(pool, userId, authHeader) {
  const viewerId = authHeader
    ? (() => { try { return jwt.verify(authHeader.slice(7), process.env.JWT_SECRET).user_id; } catch { return null; } })()
    : null;

  const { rows: followers } = await pool.query(
    `SELECT u.id, u.nick, u.avatar_url, u.created_at
     FROM users u
     JOIN subscriptions s ON u.id = s.follower_id
     WHERE s.followee_id = $1
     ORDER BY s.created_at DESC`,
    [userId]
  );

  if (viewerId) {
    const followerIds = followers.map(f => f.id);
    if (followerIds.length > 0) {
      const { rows: subs } = await pool.query(
        'SELECT followee_id FROM subscriptions WHERE follower_id = $1 AND followee_id = ANY($2)',
        [viewerId, followerIds]
      );
      const followingSet = new Set(subs.map(r => r.followee_id));
      return followers.map(f => ({ ...f, is_following: followingSet.has(f.id) }));
    }
  }

  return followers.map(f => ({ ...f, is_following: false }));
}

async function getUserFollowing(pool, userId, authHeader) {
  const viewerId = authHeader
    ? (() => { try { return jwt.verify(authHeader.slice(7), process.env.JWT_SECRET).user_id; } catch { return null; } })()
    : null;

  const { rows: following } = await pool.query(
    `SELECT u.id, u.nick, u.avatar_url, u.created_at
     FROM users u
     JOIN subscriptions s ON u.id = s.followee_id
     WHERE s.follower_id = $1
     ORDER BY s.created_at DESC`,
    [userId]
  );

  if (viewerId) {
    const followingIds = following.map(f => f.id);
    if (followingIds.length > 0) {
      const { rows: subs } = await pool.query(
        'SELECT followee_id FROM subscriptions WHERE follower_id = $1 AND followee_id = ANY($2)',
        [viewerId, followingIds]
      );
      const followingSet = new Set(subs.map(r => r.followee_id));
      return following.map(f => ({ ...f, is_following: followingSet.has(f.id) }));
    }
  }

  return following.map(f => ({ ...f, is_following: false }));
}

async function toggleSubscription(pool, followeeId, followerId) {
  if (followeeId === followerId) {
    throw { status: 400, message: 'Нельзя подписаться на себя' };
  }
  const { rows } = await pool.query(
    'SELECT id FROM subscriptions WHERE follower_id = $1 AND followee_id = $2', [followerId, followeeId]
  );
  if (rows.length) {
    await pool.query('DELETE FROM subscriptions WHERE follower_id = $1 AND followee_id = $2', [followerId, followeeId]);
    return { subscribed: false };
  } else {
    await pool.query('INSERT INTO subscriptions (follower_id, followee_id) VALUES ($1, $2)', [followerId, followeeId]);
    return { subscribed: true };
  }
}

async function toggleBan(pool, targetId, adminId) {
  const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [adminId]);
  if (!adminCheck.rows[0] || adminCheck.rows[0].role !== 'admin') {
    throw { status: 403, message: 'Только администраторы могут банить' };
  }
  
  if (targetId === adminId) {
    throw { status: 400, message: 'Нельзя банить себя' };
  }
  
  const userRes = await pool.query('SELECT banned, nick FROM users WHERE id = $1', [targetId]);
  if (!userRes.rows[0]) {
    throw { status: 404, message: 'Пользователь не найден' };
  }
  
  const isBanned = userRes.rows[0].banned;
  const userName = userRes.rows[0].nick;
  const newBannedStatus = !isBanned;
  
  await pool.query(
    'UPDATE users SET banned = $1, banned_at = $2 WHERE id = $3',
    [newBannedStatus, newBannedStatus ? new Date() : null, targetId]
  );
  
  // Отправляем уведомление пользователю
  if (newBannedStatus) {
    await pool.query(
      `INSERT INTO notifications (user_id, type, message) VALUES ($1, 'user_banned', $2)`,
      [targetId, 'Ваш аккаунт был заблокирован администратором. Вы не можете публиковать посты и комментарии.']
    );
  } else {
    await pool.query(
      `INSERT INTO notifications (user_id, type, message) VALUES ($1, 'user_unbanned', $2)`,
      [targetId, 'Ваш аккаунт был разблокирован. Вы снова можете публиковать посты и комментарии.']
    );
  }
  
  return { 
    banned: newBannedStatus,
    message: newBannedStatus ? 'Пользователь заблокирован' : 'Пользователь разблокирован'
  };
}

module.exports = { 
  getUsers, 
  getUserActivity, 
  getUserComments, 
  getUserPosts, 
  getUserProfile, 
  updateUserProfile,
  getUserViews,
  getUserFollowers,
  getUserFollowing,
  toggleSubscription,
  toggleBan
};
