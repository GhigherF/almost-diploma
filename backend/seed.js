#!/usr/bin/env node
/**
 * Seed script для заполнения БД тестовыми данными
 * Запуск: node seed.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  host: process.env.PGHOST || 'postgres',
  port: 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'microblog',
});

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const SEED_FILES_DIR = path.join(__dirname, '..', 'seed-files');

// Создать директории если их нет
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(SEED_FILES_DIR)) fs.mkdirSync(SEED_FILES_DIR, { recursive: true });

// Темы и контент для постов
const postThemes = [
  { title: 'Программирование', topics: ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Vue.js', 'Docker', 'Kubernetes'] },
  { title: 'Дизайн', topics: ['UI/UX', 'Figma', 'Web Design', 'Брендинг', 'Логотипы', 'Иллюстрации', 'Типография'] },
  { title: 'Маркетинг', topics: ['SMM', 'SEO', 'Копирайтинг', 'Аналитика', 'Реклама', 'Продажи', 'Бизнес'] },
  { title: 'Путешествия', topics: ['Туризм', 'Природа', 'Города', 'Путешествие', 'Приключения', 'Фотография'] },
  { title: 'Технологии', topics: ['AI', 'Machine Learning', 'Blockchain', 'Web3', 'Кибербезопасность', 'IoT'] },
  { title: 'Образование', topics: ['Обучение', 'Курсы', 'Школа', 'Университет', 'Навыки', 'Сертификация'] },
  { title: 'Здоровье', topics: ['Фитнес', 'Питание', 'Медицина', 'Здоровье', 'Спорт', 'Йога'] },
];

const postTemplates = [
  'Только что заканчиваю работу над интересным проектом! {topic} - это будущее. Скоро поделюсь результатами.',
  'Узнал что-то новое о {topic}. Это просто блоу-майнд! Обязательно нужно углубиться.',
  'Мой совет для начинающих в {topic}: начните с основ. Не спешите, качество важнее скорости.',
  'Кто ещё занимается {topic}? Давайте обсудим лучшие практики и инструменты.',
  'Вчера провел весь день за {topic}. Уже третий проект на этой неделе. Лайфхак: маленькие перерывы очень помогают.',
  'Топ-5 инструментов для {topic}, которые я использую в работе. Делаю список и выкладываю скоро.',
  'Нашел отличный туториал по {topic}. Если интересует - могу поделиться ссылкой в комментариях.',
  '{topic} требует постоянного обучения. Вот что я изучаю на этой неделе...',
  'Лучший способ выучить {topic} - это практика. Создал свой проект и вот результаты.',
  'Вебинар по {topic} был супер интересным! Рекомендую всем, кто хочет разбираться в этом.',
];

const comments = [
  'Очень интересная идея!',
  'Согласен с тобой на 100%',
  'Спасибо за полезную информацию',
  'А как это применить на практике?',
  'Вдохновляющий пост! 💪',
  'Могу подтвердить, я так же делаю',
  'Нужно обязательно попробовать',
  'Это изменило мой взгляд на вещи',
  'Всегда рад новым знаниям',
  'Как давно ты этим занимаешься?',
  'Звучит профессионально',
  'Не знал об этом, спасибо!',
];

// Функция для создания миниатюры изображения в памяти
function createMinimalPNG() {
  // Минимальный 1x1 PNG с красным пикселем
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xF8, 0x0F, 0x00, 0x00,
    0x01, 0x01, 0x00, 0x01, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
}

// Функция для копирования файла или создания заглушки
async function ensureFileExists(filePath, isImage = true) {
  if (!fs.existsSync(filePath)) {
    if (isImage) {
      fs.writeFileSync(filePath, createMinimalPNG());
    } else {
      fs.writeFileSync(filePath, Buffer.from('Тестовый медиафайл'));
    }
  }
  return filePath;
}

// Генерация случайного поста
function generatePostBody() {
  const theme = postThemes[Math.floor(Math.random() * postThemes.length)];
  const topic = theme.topics[Math.floor(Math.random() * theme.topics.length)];
  const template = postTemplates[Math.floor(Math.random() * postTemplates.length)];
  return template.replace('{topic}', topic);
}

// Хеширование пароля
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Основная функция заполнения
async function seed() {
  try {
    console.log('🌱 Начинаю заполнение базы данных...');
    
    // Очистить существующие данные
    console.log('🗑️  Очищаю старые данные...');
    await pool.query('DELETE FROM likes_comments');
    await pool.query('DELETE FROM likes_posts');
    await pool.query('DELETE FROM post_views');
    await pool.query('DELETE FROM subscriptions');
    await pool.query('DELETE FROM comments');
    await pool.query('DELETE FROM post_files');
    await pool.query('DELETE FROM posts');
    await pool.query('DELETE FROM users');
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    
    // Создать 30 пользователей
    console.log('👥 Создаю 30 пользователей...');
    const usernames = [];
    const firstNames = ['Алекс', 'Ольга', 'Иван', 'Мария', 'Петр', 'Елена', 'Сергей', 'Анна', 'Дмитрий', 'Виктория'];
    const lastNames = ['Волков', 'Соколов', 'Петров', 'Орлов', 'Беков', 'Морозов', 'Павлов', 'Смирнов', 'Козлов', 'Новиков'];
    
    for (let i = 1; i <= 30; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const nick = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${i}`;
      usernames.push(nick);
      
      const email = `${nick}@example.com`;
      const hashedPassword = await hashPassword('password123');
      
      await pool.query(
        'INSERT INTO users (nick, email, hashed_password) VALUES ($1, $2, $3)',
        [nick, email, hashedPassword]
      );
    }
    console.log(`✅ Создано ${usernames.length} пользователей`);
    
    // Получить всех пользователей
    const usersRes = await pool.query('SELECT id FROM users ORDER BY id');
    const users = usersRes.rows;
    
    // Создать подписки (каждый подписан на 3-7 других)
    console.log('🔗 Создаю подписки...');
    let subscriptionCount = 0;
    for (const user of users) {
      const subCount = 3 + Math.floor(Math.random() * 5);
      const targetUsers = users.filter(u => u.id !== user.id).sort(() => 0.5 - Math.random()).slice(0, subCount);
      
      for (const target of targetUsers) {
        try {
          await pool.query(
            'INSERT INTO subscriptions (follower_id, followee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [user.id, target.id]
          );
          subscriptionCount++;
        } catch (e) {
          // Игнорировать дубликаты
        }
      }
    }
    console.log(`✅ Создано ${subscriptionCount} подписок`);
    
    // Создать 200+ постов
    console.log('📝 Создаю 200+ постов...');
    let postCount = 0;
    for (let i = 0; i < 200; i++) {
      const userId = users[Math.floor(Math.random() * users.length)].id;
      const body = generatePostBody();
      
      // Случайная дата в последние 30 дней
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const createdAt = new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 3600 * 1000);
      
      const postRes = await pool.query(
        'INSERT INTO posts (user_id, body, created_at) VALUES ($1, $2, $3) RETURNING id',
        [userId, body, createdAt]
      );
      
      const postId = postRes.rows[0].id;
      
      // Добавить файлы к некоторым постам (50% постов имеют медиа)
      if (Math.random() > 0.5) {
        const fileCount = 1 + Math.floor(Math.random() * 3);
        for (let f = 0; f < fileCount; f++) {
          const fileType = Math.random() > 0.7 ? 'video' : 'image';
          const fileName = `${uuidv4()}.${fileType === 'video' ? 'mp4' : 'png'}`;
          const filePath = path.join(UPLOADS_DIR, fileName);
          
          await ensureFileExists(filePath, fileType === 'image');
          
          const fileUrl = `/uploads/${fileName}`;
          const stats = fs.statSync(filePath);
          
          await pool.query(
            'INSERT INTO post_files (post_id, file_url, file_type, original_name, mime_type, size_bytes) VALUES ($1, $2, $3, $4, $5, $6)',
            [
              postId,
              fileUrl,
              fileType,
              `media_${f + 1}.${fileType === 'video' ? 'mp4' : 'png'}`,
              fileType === 'video' ? 'video/mp4' : 'image/png',
              stats.size
            ]
          );
        }
      }
      
      postCount++;
    }
    console.log(`✅ Создано ${postCount} постов`);
    
    // Добавить лайки постам (каждый пост получает 2-15 лайков)
    console.log('❤️  Добавляю лайки...');
    let likeCount = 0;
    const postsRes = await pool.query('SELECT id FROM posts');
    const posts = postsRes.rows;
    
    for (const post of posts) {
      const likeCount_ = 2 + Math.floor(Math.random() * 14);
      const likers = users.sort(() => 0.5 - Math.random()).slice(0, likeCount_);
      
      for (const liker of likers) {
        try {
          await pool.query(
            'INSERT INTO likes_posts (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [post.id, liker.id]
          );
          likeCount++;
        } catch (e) {
          // Игнорировать дубликаты
        }
      }
    }
    console.log(`✅ Добавлено ${likeCount} лайков`);
    
    // Добавить комментарии (30% постов имеют комментарии)
    console.log('💬 Добавляю комментарии...');
    let commentCount = 0;
    for (const post of posts) {
      if (Math.random() > 0.7) {
        const commentCount_ = 1 + Math.floor(Math.random() * 4);
        for (let c = 0; c < commentCount_; c++) {
          const commenterId = users[Math.floor(Math.random() * users.length)].id;
          const commentBody = comments[Math.floor(Math.random() * comments.length)];
          
          const daysAgo = Math.floor(Math.random() * 20);
          const hoursAgo = Math.floor(Math.random() * 24);
          const createdAt = new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 3600 * 1000);
          
          await pool.query(
            'INSERT INTO comments (post_id, user_id, body, created_at) VALUES ($1, $2, $3, $4)',
            [post.id, commenterId, commentBody, createdAt]
          );
          commentCount++;
        }
      }
    }
    console.log(`✅ Добавлено ${commentCount} комментариев`);
    
    // Добавить просмотры (каждый пост просмотрен 5-50 раз)
    console.log('👁️  Добавляю просмотры...');
    let viewCount = 0;
    for (const post of posts) {
      const viewCount_ = 5 + Math.floor(Math.random() * 46);
      const viewers = users.sort(() => 0.5 - Math.random()).slice(0, viewCount_);
      
      for (const viewer of viewers) {
        try {
          const daysAgo = Math.floor(Math.random() * 30);
          const hoursAgo = Math.floor(Math.random() * 24);
          const viewedAt = new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 3600 * 1000);
          
          await pool.query(
            'INSERT INTO post_views (post_id, user_id, viewed_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [post.id, viewer.id, viewedAt]
          );
          viewCount++;
        } catch (e) {
          // Игнорировать дубликаты
        }
      }
    }
    console.log(`✅ Добавлено ${viewCount} просмотров`);
    
    // Добавить лайки комментариям (20% комментариев имеют лайки)
    console.log('💖 Добавляю лайки комментариям...');
    const commentsRes = await pool.query('SELECT id FROM comments');
    const allComments = commentsRes.rows;
    let commentLikeCount = 0;
    
    for (const comment of allComments) {
      if (Math.random() > 0.8) {
        const likeCount_ = 1 + Math.floor(Math.random() * 5);
        const likers = users.sort(() => 0.5 - Math.random()).slice(0, likeCount_);
        
        for (const liker of likers) {
          try {
            await pool.query(
              'INSERT INTO likes_comments (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [comment.id, liker.id]
            );
            commentLikeCount++;
          } catch (e) {
            // Игнорировать дубликаты
          }
        }
      }
    }
    console.log(`✅ Добавлено ${commentLikeCount} лайков комментариям`);
    
    console.log('\n✨ БД успешно заполнена!');
    console.log('📊 Статистика:');
    console.log(`   - Пользователей: ${users.length}`);
    console.log(`   - Постов: ${posts.length}`);
    console.log(`   - Подписок: ${subscriptionCount}`);
    console.log(`   - Лайков постам: ${likeCount}`);
    console.log(`   - Комментариев: ${commentCount}`);
    console.log(`   - Просмотров: ${viewCount}`);
    console.log(`   - Лайков комментариям: ${commentLikeCount}`);
    console.log('\n🔑 Аккаунты для входа:');
    usernames.slice(0, 5).forEach((nick, i) => {
      console.log(`   - ${nick}: password123`);
    });
    console.log(`   ... и ещё ${usernames.length - 5} пользователей`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка:', err);
    process.exit(1);
  }
}

seed();
