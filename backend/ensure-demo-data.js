/**
 * Синхронизация файлов и демо-данных при старте (переживает docker compose build).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { syncSeedAssetsFromBundle, loadAttachmentPool, UPLOADS_SEED_DIR } = require('./lib/syncSeedAssets');

const DEMO_SEED_VERSION = '3';
const MARKER_PATH = path.join(__dirname, 'uploads', '.demo-seed-version');

const AUTHORS = [
  { nick: 'demo_author_anna', name: 'Анна', bio: 'UX-дизайнер, делюсь макетами и находками по интерфейсам.' },
  { nick: 'demo_author_ivan', name: 'Иван', bio: 'Backend-разработчик. Пишу о Node.js, PostgreSQL и архитектуре API.' },
  { nick: 'demo_author_maria', name: 'Мария', bio: 'Фотограф-любитель. Показываю кадры с прогулок и поездок.' },
  { nick: 'demo_author_dmitry', name: 'Дмитрий', bio: 'DevOps и Docker. Заметки про деплой и мониторинг.' },
  { nick: 'demo_author_elena', name: 'Елена', bio: 'Копирайтер. Тексты для лендингов и соцсетей.' },
  { nick: 'demo_author_sergey', name: 'Сергей', bio: 'Геймдев-хобби. Прототипы на React и идеи механик.' },
  { nick: 'demo_author_olga', name: 'Ольга', bio: 'Преподаватель математики. Разбор задач и лайфхаки учёбы.' },
  { nick: 'demo_author_pavel', name: 'Павел', bio: 'Музыкант. Демо-треки и настройка домашней студии.' },
  { nick: 'demo_author_nina', name: 'Нина', bio: 'Эколог. Простые привычки для сортировки и экономии ресурсов.' },
  { nick: 'demo_author_artem', name: 'Артём', bio: 'Студент ИТ. Дневник учёбы и pet-проекты на курсе.' },
];

const COMMENT_TEXTS = [
  'Согласен, очень полезно.',
  'Спасибо, сохранил в закладки.',
  'Интересный взгляд на тему.',
  'Жду продолжения.',
  'Классно расписано, всё по делу.',
  'Поддерживаю, актуально.',
  'Отличная работа.',
];

const POSTS_PER_USER = 10;

function createPool() {
  return new Pool({
    host: process.env.PGHOST || 'postgres',
    port: 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'microblog',
  });
}

async function waitForPostgres(pool, maxAttempts = 30) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (e) {
      if (i === maxAttempts) throw e;
      console.log(`[SEED] Ожидание PostgreSQL (${i}/${maxAttempts})...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9 + (n % 10), (n * 7) % 60, 0, 0);
  return d;
}

function buildPostBody(author, postIndex, day) {
  const topics = [
    'разбор текущего проекта и промежуточные итоги',
    'подборка инструментов и ссылок для команды',
    'черновик идеи и план на следующую неделю',
  ];
  const topic = topics[postIndex % topics.length];
  return (
    `${author.name}: ${topic} (заметка ${postIndex + 1})\n\n` +
    `${author.bio}\n\n` +
    `Публикую ${day} дн. назад. Во вложениях — фото, видео, PDF и текстовые файлы.\n\n` +
    `Вторая часть: на следующей неделе обновлю материал по обратной связи.`
  );
}

async function ensureDemoPasswords(pool) {
  const hash = await bcrypt.hash('Password123', 10);
  const { rowCount } = await pool.query(
    `UPDATE users SET hashed_password = $1 WHERE nick LIKE 'demo_author_%'`,
    [hash]
  );
  if (rowCount > 0) console.log(`[SEED] Пароль Password123 для ${rowCount} demo_author_*`);
}

async function needsDemoReseed(pool) {
  const marker = fs.existsSync(MARKER_PATH) ? fs.readFileSync(MARKER_PATH, 'utf8').trim() : '';
  if (marker !== DEMO_SEED_VERSION) return true;

  if (!fs.existsSync(path.join(UPLOADS_SEED_DIR, 'landscape_photo.jpg'))) return true;

  const { rows: ac } = await pool.query(
    "SELECT COUNT(*)::int AS c FROM users WHERE nick LIKE 'demo_author_%'"
  );
  if (ac[0].c < 10) return true;

  const { rows: fc } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM post_files pf
     JOIN posts p ON p.id = pf.post_id
     JOIN users u ON u.id = p.user_id
     WHERE u.nick LIKE 'demo_author_%' AND pf.file_url LIKE '/uploads/seed/%'`
  );
  return fc[0].c < 200;
}

async function purgeBrokenAttachments(client) {
  await client.query(
    `DELETE FROM post_files
     WHERE file_url LIKE '/files/%'
        OR file_url LIKE 'http%'
        OR file_url LIKE 'https%'`
  );
}

async function attachFiles(client, postId, postIndex, attachmentPool) {
  if (!attachmentPool.length) return;
  const count = Math.min(attachmentPool.length, 4 + (postIndex % 3));
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let idx = (postIndex * 3 + i) % attachmentPool.length;
    let guard = 0;
    while (used.has(idx) && guard++ < attachmentPool.length) idx = (idx + 1) % attachmentPool.length;
    used.add(idx);
    const file = attachmentPool[idx];
    const diskPath = path.join(UPLOADS_SEED_DIR, file.file);
    if (!fs.existsSync(diskPath)) continue;
    const size = fs.statSync(diskPath).size;
    await client.query(
      `INSERT INTO post_files (post_id, file_url, file_type, original_name, mime_type, size_bytes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [postId, file.url, file.type, file.name, file.mime, size]
    );
  }
}

async function seedEngagement(client, postIds, userIds) {
  for (const postId of postIds) {
    const shuffledLikes = [...userIds].sort(() => Math.random() - 0.5).slice(0, 8 + Math.floor(Math.random() * 8));
    for (const uid of shuffledLikes) {
      await client.query(
        `INSERT INTO likes_posts (post_id, user_id, created_at) VALUES ($1, $2, NOW() - interval '1 hour' * $3) ON CONFLICT DO NOTHING`,
        [postId, uid, Math.floor(Math.random() * 120)]
      );
    }
    const shuffledViews = [...userIds].sort(() => Math.random() - 0.5).slice(0, 12 + Math.floor(Math.random() * 10));
    for (const uid of shuffledViews) {
      await client.query(
        `INSERT INTO post_views (post_id, user_id, viewed_at) VALUES ($1, $2, NOW() - interval '1 hour' * $3) ON CONFLICT DO NOTHING`,
        [postId, uid, Math.floor(Math.random() * 168)]
      );
    }
    const commentN = 4 + Math.floor(Math.random() * 6);
    for (let c = 0; c < commentN; c++) {
      const uid = userIds[Math.floor(Math.random() * userIds.length)];
      const text = COMMENT_TEXTS[Math.floor(Math.random() * COMMENT_TEXTS.length)];
      await client.query(
        `INSERT INTO comments (post_id, user_id, body, created_at) VALUES ($1, $2, $3, NOW() - interval '1 hour' * $4)`,
        [postId, uid, text, Math.floor(Math.random() * 96)]
      );
    }
  }
}

async function runDemoSeed(pool, { forceReset = false } = {}) {
  const ok = syncSeedAssetsFromBundle();
  const attachmentPool = loadAttachmentPool();
  if (!ok || attachmentPool.length < 5) {
    throw new Error('Нет файлов в uploads/seed — проверьте seed-assets в образе');
  }

  const reseed = forceReset || (await needsDemoReseed(pool));
  await ensureDemoPasswords(pool);

  if (!reseed) {
    console.log('[SEED] Демо-данные актуальны, пропуск');
    return;
  }

  console.log('[SEED] Заполнение demo_author_* (посты + вложения)...');
  const password = await bcrypt.hash('Password123', 10);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await purgeBrokenAttachments(client);

    const { rows: existing } = await client.query(
      "SELECT COUNT(*)::int AS c FROM users WHERE nick LIKE 'demo_author_%'"
    );
    const hasAuthors = existing[0].c >= 10;
    let userIds = [];

    if (hasAuthors) {
      await client.query(
        `DELETE FROM posts WHERE user_id IN (SELECT id FROM users WHERE nick LIKE 'demo_author_%')`
      );
      const { rows } = await client.query(
        "SELECT id FROM users WHERE nick LIKE 'demo_author_%' ORDER BY nick"
      );
      userIds = rows.map((r) => r.id);
      await client.query(`UPDATE users SET hashed_password = $1 WHERE nick LIKE 'demo_author_%'`, [password]);
    } else {
      for (let i = 0; i < AUTHORS.length; i++) {
        const a = AUTHORS[i];
        const { rows } = await client.query(
          `INSERT INTO users (nick, email, hashed_password, role, avatar_url, created_at)
           VALUES ($1, $2, $3, 'user', $4, $5)
           ON CONFLICT (email) DO UPDATE SET
             nick = EXCLUDED.nick,
             avatar_url = EXCLUDED.avatar_url,
             hashed_password = EXCLUDED.hashed_password
           RETURNING id`,
          [
            a.nick,
            `${a.nick}@demo.local`,
            password,
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${a.nick}`,
            daysAgo(45 + i),
          ]
        );
        userIds.push(rows[0].id);
      }
      for (let i = 0; i < userIds.length; i++) {
        const next = userIds[(i + 1) % userIds.length];
        await client.query(
          `INSERT INTO subscriptions (follower_id, followee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userIds[i], next]
        );
      }
    }

    const postIds = [];
    for (let u = 0; u < userIds.length; u++) {
      const author = AUTHORS[u];
      for (let p = 0; p < POSTS_PER_USER; p++) {
        const day = 1 + u * 2 + p + Math.floor(Math.random() * 14);
        const { rows } = await client.query(
          `INSERT INTO posts (user_id, body, created_at) VALUES ($1, $2, $3) RETURNING id`,
          [userIds[u], buildPostBody(author, p, day), daysAgo(day)]
        );
        postIds.push(rows[0].id);
        await attachFiles(client, rows[0].id, p, attachmentPool);
      }
    }

    await seedEngagement(client, postIds, userIds);
    await client.query('COMMIT');

    fs.mkdirSync(path.dirname(MARKER_PATH), { recursive: true });
    fs.writeFileSync(MARKER_PATH, DEMO_SEED_VERSION, 'utf8');

    console.log(`[SEED] Готово: ${userIds.length} авторов, ${postIds.length} постов, файлов в пуле: ${attachmentPool.length}`);
    console.log('[SEED] Логин: demo_author_anna@demo.local / Password123');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function ensureDemoDataOnStartup() {
  const pool = createPool();
  try {
    await waitForPostgres(pool);
    if (!syncSeedAssetsFromBundle()) {
      console.warn('[SEED] Файлы seed неполные — демо-вложения могут отсутствовать');
    }
    await runDemoSeed(pool, { forceReset: false });
  } finally {
    await pool.end();
  }
}

module.exports = { ensureDemoDataOnStartup, runDemoSeed, waitForPostgres, createPool };

if (require.main === module) {
  ensureDemoDataOnStartup().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
