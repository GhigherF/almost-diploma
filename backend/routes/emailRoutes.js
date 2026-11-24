const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requestEmailChange, verifyEmailChange } = require('../controllers/emailController');

module.exports = (pool) => {
  /**
   * POST /email/change-request
   * Запрос на изменение email
   */
  router.post('/change-request', authMiddleware, async (req, res) => {
    const { new_email } = req.body;
    
    if (!new_email) {
      return res.status(400).json({ error: 'new_email обязателен' });
    }
    
    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(new_email)) {
      return res.status(400).json({ error: 'Неверный формат email' });
    }
    
    try {
      // Получаем текущий email и имя пользователя
      const { rows: userRows } = await pool.query(
        'SELECT email, nick FROM users WHERE id = $1',
        [req.user.id]
      );
      
      if (userRows.length === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }
      
      const currentEmail = userRows[0].email;
      const userName = userRows[0].nick;
      
      if (currentEmail === new_email) {
        return res.status(400).json({ error: 'Новый email совпадает с текущим' });
      }
      
      const result = await requestEmailChange(pool, req.user.id, currentEmail, new_email, userName);
      
      res.json({
        success: true,
        message: result.emailSent 
          ? 'Письмо с подтверждением отправлено на новый email'
          : 'Токен создан, но письмо не было отправлено. Проверьте настройки email.',
        emailSent: result.emailSent
      });
    } catch (err) {
      console.error('[EMAIL] Ошибка запроса изменения email:', err);
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });
  
  /**
   * POST /email/verify
   * Верификация токена и изменение email
   */
  router.post('/verify', async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'token обязателен' });
    }
    
    try {
      const result = await verifyEmailChange(pool, token);
      res.json({
        success: true,
        message: 'Email успешно изменён',
        newEmail: result.newEmail
      });
    } catch (err) {
      console.error('[EMAIL] Ошибка верификации:', err);
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });
  
  return router;
};
