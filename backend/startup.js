require('dotenv').config();
const { execSync } = require('child_process');
const { createPool, waitForPostgres, ensureDemoDataOnStartup } = require('./ensure-demo-data.js');

async function maybeRunLegacySeed(pool) {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'user'");
  const usersCount = rows[0].count;
  console.log(`[STARTUP] Пользователей (user): ${usersCount}`);

  if (usersCount < 15) {
    console.log('[STARTUP] Запуск seed-data.js и seed-creative-user.js...');
    try {
      execSync('node seed-data.js', { stdio: 'inherit' });
      execSync('node seed-creative-user.js', { stdio: 'inherit' });
    } catch (e) {
      console.warn('[STARTUP] Legacy seed:', e.message);
    }
  }
}

async function main() {
  try {
    await ensureDemoDataOnStartup();

    const pool = createPool();
    await waitForPostgres(pool);
    await maybeRunLegacySeed(pool);
    await pool.end();
  } catch (err) {
    console.error('[STARTUP] Ошибка инициализации данных:', err.message);
    // Не падаем — API должно подняться даже если seed не прошёл
  }

  console.log('[STARTUP] Запуск API...');
  require('./index.js');
}

main();
