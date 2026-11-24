async function markPostAsViewed(pool, postId, userId, broadcast) {
  console.log('[VIEW] User', userId, 'viewing post', postId);
  const { rowCount } = await pool.query(
    'INSERT INTO post_views (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [postId, userId]
  );
  console.log('[VIEW] Inserted:', rowCount > 0 ? 'yes' : 'already viewed');
  if (rowCount > 0) {
    const { rows } = await pool.query(
      'SELECT COUNT(*) AS cnt FROM post_views WHERE post_id = $1', [postId]
    );
    const viewsCount = parseInt(rows[0].cnt);
    console.log('[VIEW] Total views for post', postId, ':', viewsCount);
    broadcast(parseInt(postId), { type: 'view', post_id: parseInt(postId), views_count: viewsCount });
  }
  return { ok: true };
}

module.exports = { markPostAsViewed };
