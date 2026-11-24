const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { 
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
} = require('../controllers/usersController');

module.exports = (pool, upload, handleMulterError) => {
  router.get('/', async (req, res) => {
    try {
      const users = await getUsers(pool, req.headers['authorization']);
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:id/activity', async (req, res) => {
    try {
      const activity = await getUserActivity(pool, req.params.id);
      res.json(activity);
    } catch (err) {
      console.error('[ACTIVITY] Error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:id/comments', async (req, res) => {
    try {
      const comments = await getUserComments(pool, req.params.id);
      res.json(comments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:id/posts', async (req, res) => {
    try {
      const posts = await getUserPosts(pool, req.params.id, req.headers['authorization']);
      res.json(posts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const profile = await getUserProfile(pool, req.params.id, req.headers['authorization']);
      res.json(profile);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  router.patch('/me', authMiddleware, upload.single('avatar'), handleMulterError, async (req, res) => {
    try {
      const { nick, email } = req.body;
      let avatar_url;
      if (req.file) avatar_url = `/uploads/${req.file.filename}`;
      
      const user = await updateUserProfile(pool, req.user.id, nick, email, avatar_url);
      res.json(user);
    } catch (err) {
      if (err.code === '23505') {
        if (err.detail?.includes('nick')) {
          return res.status(409).json({ error: 'Этот никнейм уже занят. Выберите другой.' });
        }
        if (err.detail?.includes('email')) {
          return res.status(409).json({ error: 'Этот email уже используется.' });
        }
        return res.status(409).json({ error: 'Такие данные уже заняты.' });
      }
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:id/views', authMiddleware, async (req, res) => {
    try {
      const views = await getUserViews(pool, req.params.id, req.user.id, req.user.role);
      res.json(views);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:id/followers', async (req, res) => {
    try {
      const followers = await getUserFollowers(pool, req.params.id, req.headers['authorization']);
      res.json(followers);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:id/following', async (req, res) => {
    try {
      const following = await getUserFollowing(pool, req.params.id, req.headers['authorization']);
      res.json(following);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:id/subscribe', authMiddleware, async (req, res) => {
    try {
      const result = await toggleSubscription(pool, parseInt(req.params.id), req.user.id);
      res.json(result);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:id/ban', authMiddleware, async (req, res) => {
    try {
      const result = await toggleBan(pool, parseInt(req.params.id), req.user.id);
      res.json(result);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
