/**
 * Validation utilities for user input
 */

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Пароль должен содержать минимум 8 символов' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Пароль должен содержать хотя бы одну строчную букву' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Пароль должен содержать хотя бы одну заглавную букву' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Пароль должен содержать хотя бы одну цифру' };
  }
  return { valid: true };
};

const validateNickname = (nick) => {
  if (!nick || nick.length < 2 || nick.length > 50) {
    return { valid: false, message: 'Никнейм должен быть от 2 до 50 символов' };
  }
  return { valid: true };
};

const validatePostBody = (body) => {
  if (!body || body.trim().length === 0) {
    return { valid: false, message: 'Пост не может быть пустым' };
  }
  if (body.length > 10000) {
    return { valid: false, message: 'Пост не может превышать 10000 символов' };
  }
  return { valid: true };
};

const validateComment = (body) => {
  if (!body || body.trim().length === 0) {
    return { valid: false, message: 'Комментарий не может быть пустым' };
  }
  if (body.length > 5000) {
    return { valid: false, message: 'Комментарий не может превышать 5000 символов' };
  }
  return { valid: true };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateNickname,
  validatePostBody,
  validateComment
};
