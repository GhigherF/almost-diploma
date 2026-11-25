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
  const viewerId 
    ?(() => { try { return jwt.verify(authHeader.slice(7), process.env.JWT_SECRET).user_id; } catch { return null; } })()
    : null;

  console.log('[POSTS] Запрос постов, viewerId:', viewerId, 'includeViewed:', includeViewed, 'limit:', limit, 'offset:', offset);

  let followedIds = [];
  if (viewerId) {
    const { rows } = await pool.query(
      'SELECT followee_id FROM subscriptions WHERE follower_id = $1', [viewerId]
    );
    followedIds = rows.map(r => r.followee_id);
    console.log('[POSTS] Подписки пользователя:', followedIds);
  }

  let query = `SELECT p.*, u.nick AS username, u.avatar_url AS user_avatar
     FROM posts p JOIN users u ON p.user_id = u.id
     WHERE p.deleted = FALSE`;

  const params = [];

  if (viewerId && !includeViewed) {
    params.push(viewerId);
    query += ` AND p.user_id != $${params.length}`;

    params.push(viewerId);
    query += ` AND p.id NOT IN (SELECT post_id FROM post_views WHERE user_id = $${params.length})`;
  }

  params.push(limit);
  params.push(offset);
  query += ` ORDER BY p.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

  console.log('[POSTS] SQL query:', query);
  console.log('[POSTS] Params:', params);

  const { rows: posts } = await pool.query(query, params);
  console.log('[POSTS] Найдено постов после фильтрации:', posts.length);

  const enriched = await enrichPosts(pool, posts, viewerId);

  const sortByLikes = (arr) => arr.sort((a, b) => b.likes_count - a.likes_count);

  if (followedIds.length && !includeViewed) {
    const followed = sortByLikes(enriched.filter(p => followedIds.includes(p.user_id)));
    const others = sortByLikes(enriched.filter(p => !followedIds.includes(p.user_id)));
    console.log('[POSTS] Отправка: followed =', followed.length, ', others =', others.length);
    return { followed, others, hasMore: posts.length === limit };
  }

  console.log('[POSTS] Отправка: others =', enriched.length);
  return { followed: [], others: sortByLikes(enriched), hasMore: posts.length === limit };
}

async function getPostById(pool, postId, authHeader) {
  const viewerId = authHeader
    ? (() => { try { return jwt.verify(authHeader.slice(7), process.env.JWT_SECRET).user_id; } catch { return null; } })()
    : null;
  const { rows } = await pool.query(
    `SELECT p.*, u.nick AS username, u.avatar_url AS user_avatar
     FROM posts p JOIN users u ON p.user_id = u.id
     WHERE p.id = $1 AND p.deleted = FALSE`,
    [postId]
  );
  if (!rows.length) {
    throw { status: 404, message: 'Пост не найден' };
  }
  const [enriched] = await enrichPosts(pool, rows, viewerId);
  return enriched;
}

async function createPost(pool, userId, body, files, resolveFileType) {
  // Валидация текста поста
  const validation = validatePostBody(body);
  if (!validation.valid) {
    throw { status: 400, message: validation.message };
  }

  const { rows: userRows } = await pool.query('SELECT banned FROM users WHERE id = $1', [userId]);
  if (userRows[0]?.banned) {
    throw { status: 403, message: 'Ваш аккаунт заблокирован. Вы не можете публиковать посты.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO posts (user_id, body) VALUES ($1, $2) RETURNING *',
      [userId, body]
    );
    const post = rows[0];
    const savedFiles = [];
    for (const file of files || []) {
      const { rows: fr } = await client.query(
        `INSERT INTO post_files (post_id, file_url, file_type, original_name, mime_type, size_bytes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [post.id, `/uploads/${file.filename}`, resolveFileType(file.mimetype),
        decodeUploadOriginalName(file.originalname), file.mimetype, file.size]
      );
      savedFiles.push(fr[0]);
    }
    await client.query('COMMIT');
    return { ...post, files: savedFiles };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updatePost(pool, postId, userId, newBody, filesToDelete = []) {
  // Валидация текста поста
  const validation = validatePostBody(newBody);
  if (!validation.valid) {
    throw { status: 400, message: validation.message };
  }

  const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1 AND deleted = FALSE', [postId]);
  if (!rows.length) {
    throw { status: 404, message: 'Пост не найден' };
  }
  const post = rows[0];
  if (post.user_id !== userId) {
    throw { status: 403, message: 'Вы можете редактировать только свои посты' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Обновляем текст поста
    const { rows: updated } = await client.query(
      'UPDATE posts SET body = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newBody, postId]
    );

    // Удаляем файлы если указаны
    if (filesToDelete && filesToDelete.length > 0) {
      await client.query(
        'DELETE FROM post_files WHERE id = ANY($1) AND post_id = $2',
        [filesToDelete, postId]
      );
    }

    await client.query('COMMIT');
    return updated[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deletePost(pool, postId, userId, userRole) {
  const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);
  if (!rows.length) {
    throw { status: 404, message: 'Пост не найден' };
  }
  const post = rows[0];
  const byAdmin = userRole === 'admin' && post.user_id !== userId;
  if (userRole !== 'admin' && post.user_id !== userId) {
    throw { status: 403, message: 'Нет доступа' };
  }
  await pool.query('UPDATE posts SET deleted = TRUE, deleted_by_admin = $1 WHERE id = $2', [byAdmin, postId]);
  if (byAdmin) {
    await pool.query(
      `INSERT INTO notifications (user_id, type, message) VALUES ($1, 'post_deleted_by_admin', $2)`,
      [post.user_id, `Ваш пост «${post.body.slice(0, 60)}${post.body.length > 60 ? '...' : ''}» был удалён администратором.`]
    );
  }
  return { ok: true, deleted_by_admin: byAdmin };
}

module.exports = { enrichPosts, getPosts, getPostById, createPost, updatePost, deletePost };
