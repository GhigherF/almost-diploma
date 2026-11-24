const axios = require('axios');

/**
 * Параметры для EmailJS. В шаблоне в поле "To Email" должно быть: {{to_email}}
 * (не адрес Gmail-отправителя и не пустое {{new_email}} для сброса пароля).
 */
function buildRecipientParams(toEmail, userName, extra = {}) {
  const email = String(toEmail || '').trim().toLowerCase();
  const name = (userName || email.split('@')[0] || 'Пользователь').trim();
  return {
    to_email: email,
    email,
    user_email: email,
    recipient: email,
    to_name: name,
    user_name: name,
    reply_to: email,
    from_name: process.env.EMAILJS_FROM_NAME || 'Microblog',
    ...extra,
  };
}

async function sendViaEmailJS(templateId, templateParams) {
  const response = await axios.post(
    'https://api.emailjs.com/api/v1.0/email/send',
    {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: templateId,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: templateParams,
    },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    }
  );
  return response;
}

async function sendEmailChangeVerification(toEmail, token, newEmail, userName) {
  const normalizedNew = String(newEmail || toEmail).trim().toLowerCase();
  const templateParams = buildRecipientParams(normalizedNew, userName, {
    new_email: normalizedNew,
    verification_token: token,
    token,
    verification_link: `${process.env.FRONTEND_URL || 'http://localhost'}/verify-email?token=${token}`,
    subject: 'Подтверждение смены email',
    message: `Токен для смены email: ${token}`,
  });

  console.log('[EMAIL] Отправка смены email →', normalizedNew);

  try {
    await sendViaEmailJS(process.env.EMAILJS_TEMPLATE_ID, templateParams);
    console.log('[EMAIL] Смена email: OK');
    return true;
  } catch (error) {
    console.error('[EMAIL] Смена email:', error.message, error.response?.data);
    return false;
  }
}

async function sendTestEmail(toEmail, userName = 'Test User') {
  return sendEmailChangeVerification(
    toEmail,
    'TEST_TOKEN_123',
    toEmail,
    userName
  );
}

async function sendPasswordResetEmail(toEmail, token, userName) {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost'}/reset-password?token=${token}`;
  const templateParams = buildRecipientParams(toEmail, userName, {
    new_email: String(toEmail).trim().toLowerCase(),
    verification_token: token,
    token,
    reset_link: resetLink,
    verification_link: resetLink,
    subject: 'Сброс пароля',
    message: `Сброс пароля. Токен: ${token}. Ссылка: ${resetLink}`,
  });

  const templateId = process.env.EMAILJS_PASSWORD_RESET_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID;
  console.log('[EMAIL] Отправка сброса пароля →', templateParams.to_email);

  try {
    await sendViaEmailJS(templateId, templateParams);
    console.log('[EMAIL] Сброс пароля: OK');
    return true;
  } catch (error) {
    console.error('[EMAIL] Сброс пароля:', error.message, error.response?.data);
    return false;
  }
}

module.exports = {
  sendEmailChangeVerification,
  sendTestEmail,
  sendPasswordResetEmail,
  buildRecipientParams,
};
