const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateEmail, validatePassword, validateNickname } = require('../utils/validators');
const { sendPasswordResetEmail } = require('../services/emailService');

const passwordResetTokens = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [token, data] of passwordResetTokens.entries()) {
    if (data.expires < now) passwordResetTokens.delete(token);
  }
}, 10 * 60 * 1000);

async function register(pool, { nick, email, password }) {
  // Валидация
  if (!validateEmail(email)) {
    throw { status: 400, message: 'Некорректный email' };
  }
  const nickValidation = validateNickname(nick);
  if (!nickValidation.valid) {
    throw { status: 400, message: nickValidation.message };
  }
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw { status: 400, message: passwordValidation.message };
  }

  const hashed_password = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (nick, email, hashed_password, role)
     VALUES ($1, $2, $3, 'user') RETURNING id, nick, email, role, created_at`,
    [nick.trim(), email.trim().toLowerCase(), hashed_password]
  );
  return rows[0];
}

async function login(pool, { email, password }) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  const user = rows[0];
  if (!user) {
    throw { status: 401, message: 'Неверный email или пароль' };
  }
  const valid = await bcrypt.compare(password, user.hashed_password);
  if (!valid) {
    throw { status: 401, message: 'Неверный email или пароль' };
  }
  const token = jwt.sign(
    { user_id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  return { 
    token, 
    user: { 
      id: user.id, 
      nick: user.nick, 
      email: user.email, 
      role: user.role, 
      avatar_url: user.avatar_url, 
      banned: user.banned 
    } 
  };
}

async function getMe(pool, userId) {
  const { rows } = await pool.query(
    'SELECT id, nick, email, role, avatar_url, created_at, banned, banned_at FROM users WHERE id = $1',
    [userId]
  );
  if (!rows.length) {
    throw { status: 404, message: 'Пользователь не найден' };
  }
  return rows[0];
}

async function requestPasswordReset(pool, email) {
  if (!validateEmail(email)) {
    throw { status: 400, message: 'Некорректный email' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { rows } = await pool.query(
    'SELECT id, nick, email FROM users WHERE email = $1',
    [normalizedEmail]
  );

  if (rows.length > 0) {
    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 60 * 60 * 1000;

    passwordResetTokens.set(token, { user_id: user.id, expires });

    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, to_timestamp($3 / 1000.0))`,
      [user.id, token, expires]
    );

    await sendPasswordResetEmail(user.email, token, user.nick);
  }

  return { success: true, message: 'Если аккаунт с таким email существует, письмо с инструкциями отправлено' };
}

async function resetPassword(pool, token, password) {
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw { status: 400, message: passwordValidation.message };
  }

  let userId = null;
  const tokenData = passwordResetTokens.get(token);

  if (tokenData) {
    if (tokenData.expires < Date.now()) {
      passwordResetTokens.delete(token);
      await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
      throw { status: 400, message: 'Токен истёк' };
    }
    userId = tokenData.user_id;
  } else {
    const { rows } = await pool.query(
      `SELECT user_id, EXTRACT(EPOCH FROM expires_at) * 1000 as expires
       FROM password_reset_tokens WHERE token = $1`,
      [token]
    );
    if (rows.length === 0) {
      throw { status: 400, message: 'Неверный или истёкший токен' };
    }
    if (rows[0].expires < Date.now()) {
      await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
      throw { status: 400, message: 'Токен истёк' };
    }
    userId = rows[0].user_id;
  }

  const hashed_password = await bcrypt.hash(password, 10);
  await pool.query('UPDATE users SET hashed_password = $1 WHERE id = $2', [hashed_password, userId]);
  passwordResetTokens.delete(token);
  await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);

  return { success: true, message: 'Пароль успешно изменён' };
}

module.exports = { register, login, getMe, requestPasswordReset, resetPassword };
