const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getComments, createComment } = require('../controllers/commentsController');

module.exports = (pool, broadcast) => {
  router.get('/:postId/comments', async (req, res) => {
    try {
      const comments = await getComments(pool, req.params.postId, req.headers['authorization']);
      res.json(comments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:postId/comments', authMiddleware, async (req, res) => {
    const { body, parent_id } = req.body;
    if (!body) return res.status(400).json({ error: 'body обязателен' });
    
    try {
      const comment = await createComment(pool, parseInt(req.params.postId), req.user.id, body, parent_id, broadcast);
      res.status(201).json(comment);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
