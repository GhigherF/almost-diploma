require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const pool = new Pool({
  host: process.env.PGHOST || 'postgres',
  port: 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'microblog',
});

const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Популярные посты с большим количеством лайков
const popularPosts = [
  {
    body: `🎨 Искусство программирования

Сегодня хочу поделиться своими мыслями о том, что программирование - это не просто написание кода, это настоящее искусство! 

Каждая строка кода - это мазок кисти на холсте, каждая функция - это композиция, а весь проект - это шедевр, который мы создаём вместе.

Вдохновляйтесь, творите и не бойтесь экспериментировать! 💻✨`,
    likes: 85,
    comments: 25,
    views: 150,
    imageUrl: 'https://picsum.photos/800/600?random=1'
  },
  {
    body: `🌅 Рассвет над городом

Сегодня встал пораньше и поймал невероятный рассвет! Такие моменты напоминают, как прекрасен наш мир.

Иногда нужно просто остановиться и насладиться красотой вокруг нас. Делюсь с вами этим волшебным моментом! 📸

#фотография #рассвет #красота`,
    likes: 120,
    comments: 30,
    views: 200,
    imageUrl: 'https://picsum.photos/800/600?random=2'
  },
  {
    body: `🎵 Музыка - это жизнь!

Только что закончил работу над новым треком. Это было невероятное путешествие!

Музыка имеет силу объединять людей, вдохновлять и исцелять. Что вы слушаете сейчас? Поделитесь своими любимыми треками! 🎧

Скоро выложу демо-версию, следите за обновлениями!`,
    likes: 95,
    comments: 40,
    views: 180,
    imageUrl: 'https://picsum.photos/800/600?random=3'
  },
  {
    body: `🚀 Запуск нового проекта!

Друзья, рад объявить о запуске моего нового проекта! Это было долгое путешествие, полное вызовов и открытий.

Огромное спасибо всем, кто поддерживал меня на этом пути. Без вас это было бы невозможно! 🙏

Следите за обновлениями, впереди много интересного! 💪

#стартап #проект #мечты`,
    likes: 150,
    comments: 45,
    views: 250,
    imageUrl: 'https://picsum.photos/800/600?random=4'
  },
  {
    body: `🌍 Путешествия расширяют горизонты

Только что вернулся из невероятного путешествия! Новые места, новые люди, новые впечатления.

Каждое путешествие - это возможность узнать что-то новое о мире и о себе. Куда бы вы хотели отправиться? ✈️

Делюсь с вами одним из самых красивых видов, которые я видел!

#путешествия #приключения #мир`,
    likes: 110,
    comments: 35,
    views: 190,
    imageUrl: 'https://picsum.photos/800/600?random=5'
  }
];

async function downloadImage(url, filename) {
  const filepath = path.join(UPLOADS_DIR, filename);
  
  // Проверяем, существует ли файл
  if (fs.existsSync(filepath)) {
    console.log(`  ✓ Файл ${filename} уже существует`);
    return filename;
  }
  
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });
    
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`  ✓ Загружено: ${filename}`);
        resolve(filename);
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`  ✗ Ошибка загрузки ${filename}:`, error.message);
    return null;
  }
}

async function seedPopularPosts() {
  const client = await pool.connect();
  
  try {
    console.log('🌟 Создаём популярные посты с изображениями...\n');
    
    // Создаём директорию для загрузок, если её нет
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    
    // Получаем случайных пользователей
    const { rows: users } = await client.query('SELECT id FROM users ORDER BY RANDOM() LIMIT 5');
    
    if (users.length === 0) {
      console.log('❌ Нет пользователей в базе данных');
      return;
    }
    
    for (let i = 0; i < popularPosts.length; i++) {
      const postData = popularPosts[i];
      const userId = users[i % users.length].id;
      
      console.log(`\n📝 Создаём популярный пост ${i + 1}/${popularPosts.length}...`);
      
      // Создаём пост в прошлом (5-15 дней назад)
      const daysAgo = 5 + Math.floor(Math.random() * 10);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(Math.floor(Math.random() * 24));
      createdAt.setMinutes(Math.floor(Math.random() * 60));
      
      const { rows: postRows } = await client.query(
        `INSERT INTO posts (user_id, body, created_at)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [userId, postData.body, createdAt]
      );
      
      const postId = postRows[0].id;
      console.log(`  ✓ Пост создан (ID: ${postId})`);
      
      // Загружаем изображение
      const filename = `popular-${postId}-${Date.now()}.jpg`;
      const downloadedFile = await downloadImage(postData.imageUrl, filename);
      
      if (downloadedFile) {
        // Добавляем файл к посту
        await client.query(
          `INSERT INTO post_files (post_id, file_url, file_type, original_name, mime_type, size_bytes)
           VALUES ($1, $2, 'image', $3, 'image/jpeg', 0)`,
          [postId, `/uploads/${downloadedFile}`, `image-${i + 1}.jpg`]
        );
        console.log(`  ✓ Изображение прикреплено`);
      }
      
      // Получаем всех пользователей для лайков
      const { rows: allUsers } = await client.query('SELECT id FROM users');
      const shuffled = allUsers.sort(() => 0.5 - Math.random());
      const likers = shuffled.slice(0, postData.likes);
      
      // Добавляем лайки
      for (const liker of likers) {
        const likedAt = new Date(createdAt);
        likedAt.setHours(likedAt.getHours() + Math.floor(Math.random() * 48));
        
        await client.query(
          `INSERT INTO likes_posts (post_id, user_id, created_at)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [postId, liker.id, likedAt]
        );
      }
      console.log(`  ✓ Добавлено ${postData.likes} лайков`);
      
      // Добавляем просмотры
      const viewers = shuffled.slice(0, postData.views);
      for (const viewer of viewers) {
        const viewedAt = new Date(createdAt);
        viewedAt.setHours(viewedAt.getHours() + Math.floor(Math.random() * 96));
        
        await client.query(
          `INSERT INTO post_views (post_id, user_id, viewed_at)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [postId, viewer.id, viewedAt]
        );
      }
      console.log(`  ✓ Добавлено ${postData.views} просмотров`);
    }
    
    console.log('\n═══════════════════════════════════════');
    console.log('✅ Популярные посты успешно созданы!');
    console.log('═══════════════════════════════════════');
    console.log(`📝 Создано постов: ${popularPosts.length}`);
    console.log(`❤️ Общее количество лайков: ${popularPosts.reduce((sum, p) => sum + p.likes, 0)}`);
    console.log(`👁️ Общее количество просмотров: ${popularPosts.reduce((sum, p) => sum + p.views, 0)}`);
    console.log('═══════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Ошибка при создании популярных постов:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Запускаем скрипт
seedPopularPosts().catch(err => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
