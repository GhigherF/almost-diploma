const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { deleteComment } = require('../controllers/commentsController');

module.exports = (pool, broadcast) => {
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await deleteComment(pool, req.params.id, req.user.id, req.user.role, broadcast);
      res.json(result);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
