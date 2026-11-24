async function getNotifications(pool, userId) {
  const { rows } = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [userId]
  );
  return rows;
}

async function markNotificationsAsRead(pool, userId) {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
  return { ok: true };
}

async function deleteNotification(pool, notificationId, userId) {
  await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [notificationId, userId]);
  return { ok: true };
}

module.exports = { getNotifications, markNotificationsAsRead, deleteNotification };
