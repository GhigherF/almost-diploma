const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getNotifications, markNotificationsAsRead, deleteNotification } = require('../controllers/notificationsController');

module.exports = (pool) => {
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const notifications = await getNotifications(pool, req.user.id);
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/read', authMiddleware, async (req, res) => {
    try {
      const result = await markNotificationsAsRead(pool, req.user.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await deleteNotification(pool, req.params.id, req.user.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
