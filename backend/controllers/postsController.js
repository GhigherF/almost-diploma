const jwt = require('jsonwebtoken');
const { validatePostBody } = require('../utils/validators');
const { decodeUploadOriginalName } = require('../utils/fileNames');

async function enrichPosts(pool, posts, viewerId) {
  if (!posts.length) return [];
  const postIds = posts.map(p => p.id);

  const { rows: files } = await pool.query(
    'SELECT * FROM post_files WHERE post_id = ANY($1)', [postIds]
  );
  const { rows: likesRows } = await pool.query(
    'SELECT post_id, COUNT(*) AS cnt FROM likes_posts WHERE post_id = ANY($1) GROUP BY post_id', [postIds]
  );
  const { rows: commentsRows } = await pool.query(
    'SELECT post_id, COUNT(*) AS cnt FROM comments WHERE post_id = ANY($1) AND deleted = FALSE GROUP BY post_id', [postIds]
  );
  const { rows: viewsRows } = await pool.query(
    'SELECT post_id, COUNT(*) AS cnt FROM post_views WHERE post_id = ANY($1) GROUP BY post_id', [postIds]
  );

  let myLikes = new Set();
  if (viewerId) {
    const { rows } = await pool.query(
      'SELECT post_id FROM likes_posts WHERE user_id = $1 AND post_id = ANY($2)', [viewerId, postIds]
    );
    myLikes = new Set(rows.map(r => r.post_id));
  }

  const filesMap = {}, likesMap = {}, commentsMap = {}, viewsMap = {};
  files.forEach(f => { if (!filesMap[f.post_id]) filesMap[f.post_id] = []; filesMap[f.post_id].push(f); });
  likesRows.forEach(r => { likesMap[r.post_id] = parseInt(r.cnt); });
  commentsRows.forEach(r => { commentsMap[r.post_id] = parseInt(r.cnt); });
  viewsRows.forEach(r => { viewsMap[r.post_id] = parseInt(r.cnt); });

  return posts.map(p => ({
    ...p,
    files: filesMap[p.id] || [],
    likes_count: likesMap[p.id] || 0,
    comments_count: commentsMap[p.id] || 0,
    views_count: viewsMap[p.id] || 0,
    liked_by_me: myLikes.has(p.id),
  }));
}

async function getPosts(pool, authHeader, includeViewed = false, limit = 20, offset = 0) {
  const viewerId = authHeader
    ? (() => { try { return jwt.verify(authHeader.slice(7), process.env.JWT_SECRET).user_id; } catch { return null; } })()
