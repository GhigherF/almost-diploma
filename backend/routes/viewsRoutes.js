const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { markPostAsViewed } = require('../controllers/viewsController');

module.exports = (pool, broadcast) => {
  router.post('/:id/view', authMiddleware, async (req, res) => {
    try {
      const result = await markPostAsViewed(pool, req.params.id, req.user.id, broadcast);
      res.json(result);
    } catch (err) {
      console.error('[VIEW] Error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
