const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { togglePostLike, toggleCommentLike } = require('../controllers/likesController');

module.exports = (pool, broadcast) => {
  router.post('/posts/:id/like', authMiddleware, async (req, res) => {
    try {
      const result = await togglePostLike(pool, parseInt(req.params.id), req.user.id, broadcast);
      res.json(result);
    } catch (err) {
      console.error('[LIKE] Error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/comments/:id/like', authMiddleware, async (req, res) => {
    try {
      const result = await toggleCommentLike(pool, parseInt(req.params.id), req.user.id, broadcast);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
