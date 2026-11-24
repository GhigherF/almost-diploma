// Тестовый скрипт для проверки отправки email с токеном
require('dotenv').config();
const { sendEmailChangeVerification } = require('./services/emailService');

async function testEmailWithToken() {
  console.log('\n========== ТЕСТ ОТПРАВКИ EMAIL С ТОКЕНОМ ==========\n');
  
  const testEmail = 'ghighersworld@gmail.com';
  const testToken = 'TEST_TOKEN_' + Math.random().toString(36).substring(2, 15);
  const testNewEmail = 'newemail@example.com';
  const testUserName = 'Test User';
  
  console.log('Параметры теста:');
  console.log('  Email получателя:', testEmail);
  console.log('  Токен:', testToken);
  console.log('  Новый email:', testNewEmail);
  console.log('  Имя пользователя:', testUserName);
  console.log('\nОтправка...\n');
  
  const result = await sendEmailChangeVerification(
    testEmail,
    testToken,
    testNewEmail,
    testUserName
  );
  
  console.log('\n========== РЕЗУЛЬТАТ ==========');
  console.log('Успех:', result ? '✅ ДА' : '❌ НЕТ');
  console.log('\nПроверьте почту:', testEmail);
  console.log('Токен должен быть:', testToken);
  console.log('===============================\n');
  
  process.exit(result ? 0 : 1);
}

testEmailWithToken().catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
