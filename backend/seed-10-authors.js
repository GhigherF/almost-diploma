/**
 * CLI для демо-данных (основная логика — ensure-demo-data.js, вызывается из startup.js).
 *
 * node seed-10-authors.js --reset  — принудительно пересоздать посты demo_author_*
 */
require('dotenv').config();
const { createPool, runDemoSeed } = require('./ensure-demo-data');

const forceReset = process.argv.includes('--reset') || process.argv.includes('--enrich');

async function main() {
  const pool = createPool();
  try {
    await runDemoSeed(pool, { forceReset });
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
