const crypto = require('crypto');
const { sendEmailChangeVerification } = require('../services/emailService');

// Временное хранилище токенов: token -> { user_id, new_email, expires }
const emailTokens = new Map();

// Очистка истёкших токенов каждые 10 минут
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of emailTokens.entries()) {
    if (data.expires < now) {
      emailTokens.delete(token);
      console.log(`[EMAIL] Удалён истёкший токен для пользователя ${data.user_id}`);
    }
  }
}, 10 * 60 * 1000);

/**
 * Запрос на изменение email
 */
async function requestEmailChange(pool, userId, currentEmail, newEmail, userName) {
  console.log(`[EMAIL] Запрос на изменение email для пользователя ${userId}`);
  console.log(`[EMAIL] Имя пользователя: ${userName}`);
  console.log(`[EMAIL] Текущий email: ${currentEmail}`);
  console.log(`[EMAIL] Новый email: ${newEmail}`);
  
  // Проверяем, не занят ли новый email
  const { rows: existingUsers } = await pool.query(
    'SELECT id FROM users WHERE email = $1 AND id != $2',
    [newEmail, userId]
  );
  
  if (existingUsers.length > 0) {
    throw { status: 400, message: 'Этот email уже используется другим пользователем' };
  }
  
  // Генерируем токен
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 30 * 60 * 1000; // 30 минут
  
  // Сохраняем токен
  emailTokens.set(token, {
    user_id: userId,
    new_email: newEmail,
    expires
  });
  
  console.log(`[EMAIL] Токен создан: ${token.substring(0, 10)}...`);
  console.log(`[EMAIL] Полный токен: ${token}`);
  console.log(`[EMAIL] Истекает: ${new Date(expires).toLocaleString()}`);
  
  // Удаляем старые токены пользователя
  await pool.query('DELETE FROM email_change_tokens WHERE user_id = $1', [userId]);
  
  // Сохраняем новый токен в БД
  await pool.query(
    `INSERT INTO email_change_tokens (user_id, token, new_email, expires_at)
     VALUES ($1, $2, $3, to_timestamp($4 / 1000.0))`,
    [userId, token, newEmail, expires]
  );
  
  // Отправляем email
  const emailSent = await sendEmailChangeVerification(newEmail, token, newEmail, userName);
  
  if (!emailSent) {
    console.warn('[EMAIL] ⚠️ Email не был отправлен, но токен создан');
  }
  
  return { success: true, emailSent, token };
}

/**
 * Верификация токена и изменение email
 */
async function verifyEmailChange(pool, token) {
  console.log(`[EMAIL] Верификация токена: ${token.substring(0, 10)}...`);
  
  // Проверяем токен в памяти
  const tokenData = emailTokens.get(token);
  
  if (!tokenData) {
    // Проверяем в БД
    const { rows } = await pool.query(
      `SELECT user_id, new_email, EXTRACT(EPOCH FROM expires_at) * 1000 as expires
       FROM email_change_tokens
       WHERE token = $1`,
      [token]
    );
    
    if (rows.length === 0) {
      throw { status: 400, message: 'Неверный или истёкший токен' };
    }
    
    const dbToken = rows[0];
    
    if (dbToken.expires < Date.now()) {
      await pool.query('DELETE FROM email_change_tokens WHERE token = $1', [token]);
      throw { status: 400, message: 'Токен истёк' };
    }
    
    // Обновляем email
    await pool.query(
      'UPDATE users SET email = $1 WHERE id = $2',
      [dbToken.new_email, dbToken.user_id]
    );
    
    // Удаляем токен
    await pool.query('DELETE FROM email_change_tokens WHERE token = $1', [token]);
    
    console.log(`[EMAIL] ✅ Email успешно изменён для пользователя ${dbToken.user_id}`);
    
    return { success: true, newEmail: dbToken.new_email };
  }
  
  // Проверяем срок действия
  if (tokenData.expires < Date.now()) {
    emailTokens.delete(token);
    await pool.query('DELETE FROM email_change_tokens WHERE token = $1', [token]);
    throw { status: 400, message: 'Токен истёк' };
  }
  
  // Обновляем email
  await pool.query(
    'UPDATE users SET email = $1 WHERE id = $2',
    [tokenData.new_email, tokenData.user_id]
  );
  
  // Удаляем токен
  emailTokens.delete(token);
  await pool.query('DELETE FROM email_change_tokens WHERE token = $1', [token]);
  
  console.log(`[EMAIL] ✅ Email успешно изменён для пользователя ${tokenData.user_id}`);
  
  return { success: true, newEmail: tokenData.new_email };
}

module.exports = {
  requestEmailChange,
  verifyEmailChange
};
