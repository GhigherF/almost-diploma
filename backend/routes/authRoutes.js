const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { register, login, getMe, requestPasswordReset, resetPassword } = require('../controllers/authController');

module.exports = (pool) => {
  router.post('/register', async (req, res) => {
    const { nick, email, password } = req.body;
    if (!nick || !email || !password)
      return res.status(400).json({ error: 'nick, email и password обязательны' });
    
    try {
      const user = await register(pool, { nick, email, password });
      res.status(201).json(user);
    } catch (err) {
      if (err.code === '23505') {
        if (err.detail?.includes('nick')) {
          return res.status(409).json({ error: 'Этот никнейм уже занят. Выберите другой.' });
        }
        if (err.detail?.includes('email')) {
          return res.status(409).json({ error: 'Этот email уже зарегистрирован.' });
        }
        return res.status(409).json({ error: 'Такой пользователь уже существует.' });
      }
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email и password обязательны' });
    try {
      const result = await login(pool, { email, password });
      res.json(result);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email обязателен' });
    try {
      const result = await requestPasswordReset(pool, email);
      res.json(result);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'token и password обязательны' });
    }
    try {
      const result = await resetPassword(pool, token, password);
      res.json(result);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  router.get('/me', authMiddleware, async (req, res) => {
    try {
      const user = await getMe(pool, req.user.id);
      res.json(user);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  return router;
};
