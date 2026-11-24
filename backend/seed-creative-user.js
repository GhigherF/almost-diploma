require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const axios = require('axios');
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

// Создаем директорию uploads если её нет
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Проверка на существование пользователя CREATiveOR
async function checkCreativeUserExists() {
  const { rows } = await pool.query("SELECT id FROM users WHERE nick = 'CREATiveOR'");
  return rows.length > 0;
}

// Посты с изображениями
const posts = [
  {
    title: '🎨 Новый арт-проект: Цифровая живопись',
    body: `Рад представить вам мой новый проект в области цифровой живописи! 🖌️

Последние несколько недель я работал над серией абстрактных композиций, исследуя взаимодействие света и тени в цифровом пространстве. Это путешествие научило меня многому о балансе цветов и форм.

Каждый штрих здесь - это результат экспериментов с различными техниками и инструментами. Я использовал комбинацию традиционных художественных принципов и современных цифровых возможностей.

Что вы думаете о таком подходе к искусству? Делитесь своими мыслями в комментариях! 💭

#DigitalArt #AbstractArt #CreativeProcess #ArtWork`,
    imageUrl: 'https://picsum.photos/800/600?random=1',
  },
  {
    title: '📸 Фотография: Городские пейзажи на рассвете',
    body: `Сегодня хочу поделиться с вами магией городских рассветов! 🌅

Есть что-то особенное в том, чтобы проснуться до восхода солнца и запечатлеть город, когда он только просыпается. Пустые улицы, первые лучи света, пробивающиеся между зданиями, создают неповторимую атмосферу спокойствия и предвкушения нового дня.

Эта фотография была сделана на крыше одного из высотных зданий. Я провел там около двух часов, наблюдая, как меняется свет и цвет неба. Терпение - ключ к хорошей фотографии.

Для тех, кто интересуется техническими деталями: ISO 100, f/8, выдержка 1/125s. Постобработка минимальная - природа сама создала идеальную палитру.

#Photography #UrbanPhotography #Sunrise #CityLife #PhotoOfTheDay`,
    imageUrl: 'https://picsum.photos/800/600?random=2',
  },
  {
    title: '🎬 Видеопроизводство: За кадром моего последнего проекта',
    body: `Делюсь с вами процессом создания моего последнего видеопроекта! 🎥

Работа над видео - это всегда командная работа. От идеи до финального монтажа проходит множество этапов: сценарий, раскадровка, съемка, монтаж, цветокоррекция, звуковой дизайн. Каждый этап требует внимания к деталям и творческого подхода.

На этом кадре вы можете увидеть момент съемки одной из ключевых сцен. Мы использовали естественное освещение и минималистичную постановку, чтобы создать атмосферу искренности и близости со зрителем.

Самое важное в видеопроизводстве - это история, которую вы рассказываете. Техника важна, но эмоции и смысл - вот что остается с людьми.

Скоро покажу финальный результат! Следите за обновлениями 👀

#VideoProduction #Filmmaking #BehindTheScenes #CreativeWork #ContentCreation`,
    imageUrl: 'https://picsum.photos/800/600?random=3',
  },
  {
    title: '💻 Дизайн интерфейсов: Минимализм и функциональность',
    body: `Сегодня поговорим о дизайне пользовательских интерфейсов! 🎯

Хороший UI/UX дизайн - это баланс между эстетикой и функциональностью. Каждый элемент должен иметь свою цель, каждый цвет - свое значение, каждая анимация - свой смысл.

В этом проекте я следовал принципам минимализма: чистые линии, много воздуха, интуитивная навигация. Цветовая палитра ограничена тремя основными цветами, что создает визуальную гармонию и не отвлекает пользователя от контента.

Особое внимание уделил типографике - правильный выбор шрифтов и их размеров критически важен для читаемости и общего восприятия интерфейса.

Что для вас важнее в дизайне приложений - красота или удобство? Или можно совместить? 🤔

#UIDesign #UXDesign #WebDesign #Minimalism #DesignThinking #UserExperience`,
    imageUrl: 'https://picsum.photos/800/600?random=4',
  },
  {
    title: '🌟 Творческое вдохновение: Где я черпаю идеи',
    body: `Часто меня спрашивают: "Откуда ты берешь идеи для своих проектов?" 💡

Вдохновение повсюду - нужно только научиться его замечать. Я нахожу идеи в архитектуре города, в природе, в музыке, в разговорах с людьми, даже в случайных узорах на стене.

Этот снимок - пример того, как обычная прогулка может превратиться в источник творческих идей. Игра света и тени, текстуры, формы - все это материал для будущих проектов.

Мой совет начинающим креаторам: всегда носите с собой камеру (или смартфон) и блокнот. Фиксируйте все, что привлекает ваше внимание. Не все идеи станут проектами, но каждая идея - это шаг в развитии вашего творческого видения.

Творчество - это не талант, это привычка замечать красоту и необычное в обычном.

Где вы находите свое вдохновение? Поделитесь в комментариях! ⬇️

#Inspiration #CreativeLife #Photography #ArtisticVision #CreativeProcess`,
    imageUrl: 'https://picsum.photos/800/600?random=5',
  },
];

// Комментарии для постов
const commentTemplates = [
  'Невероятная работа! Очень вдохновляет! 🔥',
  'Это просто шедевр! Продолжай в том же духе!',
  'Обожаю твой стиль! Каждый пост - произведение искусства 🎨',
  'Спасибо за то, что делишься своим творчеством!',
  'Какая красота! Сколько времени ушло на создание?',
  'Это лучшее, что я видел сегодня! 👏',
  'Твои работы всегда на высоте! Браво!',
  'Очень профессионально! Видно, что вложена душа',
  'Подписался, чтобы не пропустить новые работы!',
  'Это так круто! Хочу научиться так же!',
  'Потрясающе! Какие инструменты используешь?',
  'Вау! Это нечто! 😍',
  'Талант! Продолжай творить!',
  'Каждая деталь продумана. Респект!',
  'Это искусство в чистом виде!',
  'Мурашки по коже! Очень атмосферно',
  'Сохранил в избранное! Буду пересматривать',
  'Как всегда на высоте! 💯',
  'Это вдохновляет меня на собственное творчество!',
  'Профессионализм чувствуется в каждом пикселе!',
];

async function downloadImage(url, filename) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 30000,
    });
    
    const filepath = path.join(UPLOADS_DIR, filename);
    const writer = fs.createWriteStream(filepath);
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filepath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Ошибка загрузки изображения ${url}:`, error.message);
    return null;
  }
}

async function seedCreativeUser() {
  // Проверяем, не создан ли уже пользователь
  const alreadyExists = await checkCreativeUserExists();
  if (alreadyExists) {
    console.log('ℹ️  Пользователь CREATiveOR уже существует, пропускаем создание');
    return;
  }
  
  const client = await pool.connect();
  
  try {
    console.log('🎨 Создаем креативного пользователя CREATiveOR...\n');
    
    // 1. Создаем пользователя CREATiveOR
    console.log('👤 Создаем пользователя...');
    const hashedPassword = await bcrypt.hash('Password123', 10);
    
    const { rows: userRows } = await client.query(
      `INSERT INTO users (nick, email, hashed_password, role)
       VALUES ($1, $2, $3, 'user')
       ON CONFLICT (email) DO UPDATE SET nick = EXCLUDED.nick
       RETURNING id`,
      ['CREATiveOR', 'creativeor@example.com', hashedPassword]
    );
    
    const userId = userRows[0].id;
    console.log(`Пользователь CREATiveOR создан (ID: ${userId})\n`);
    
    const { rows: allUsers } = await client.query('SELECT id FROM users WHERE id != $1', [userId]);
    const userIds = allUsers.map(u => u.id);
    
    console.log(`Найдено ${userIds.length} пользователей для взаимодействия\n`);
    
    console.log('Создаем посты с изображениями...\n');
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`Пост ${i + 1}/5: ${post.title}`);
      
      const { rows: postRows } = await client.query(
        `INSERT INTO posts (user_id, body, created_at)
         VALUES ($1, $2, NOW() - INTERVAL '${i} days')
         RETURNING id`,
        [userId, `${post.title}\n\n${post.body}`]
      );
      
      const postId = postRows[0].id;
      console.log(`     ✓ Пост создан (ID: ${postId})`);
      
      console.log(`     ⬇️ Загружаем изображение...`);
      const filename = `${uuidv4()}.jpg`;
      const filepath = await downloadImage(post.imageUrl, filename);
      
      if (filepath) {
        await client.query(
          `INSERT INTO post_files (post_id, file_url, file_type, original_name, mime_type, size_bytes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [postId, `/uploads/${filename}`, 'image', `image_${i + 1}.jpg`, 'image/jpeg', 0]
        );
        console.log(`     ✓ Изображение прикреплено`);
      }
      
      const likesCount = 15 + Math.floor(Math.random() * 11);
      const shuffledUsers = [...userIds].sort(() => 0.5 - Math.random());
      const likers = shuffledUsers.slice(0, likesCount);
      
      for (const likerId of likers) {
        await client.query(
          `INSERT INTO likes_posts (post_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [postId, likerId]
        );
      }
      console.log(`Добавлено ${likesCount} лайков`);
      
      const commentsCount = 5 + Math.floor(Math.random() * 6);
      const commenters = shuffledUsers.slice(0, commentsCount);
      
      for (const commenterId of commenters) {
        const commentBody = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
        
        const { rows: commentRows } = await client.query(
          `INSERT INTO comments (post_id, user_id, body)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [postId, commenterId, commentBody]
        );
        
        const commentId = commentRows[0].id;
        
        const commentLikesCount = Math.floor(Math.random() * 6);
        const commentLikers = shuffledUsers.slice(0, commentLikesCount);
        
        for (const likerId of commentLikers) {
          await client.query(
            `INSERT INTO likes_comments (comment_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [commentId, likerId]
          );
        }
      }
      console.log(`Добавлено ${commentsCount} комментариев`);
      
      const viewsCount = 20 + Math.floor(Math.random() * 11);
      const viewers = shuffledUsers.slice(0, viewsCount);
      
      for (const viewerId of viewers) {
        await client.query(
          `INSERT INTO post_views (post_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [postId, viewerId]
        );
      }
      console.log(`     👁️ Добавлено ${viewsCount} просмотров\n`);
    }
    
    console.log('🔗 Добавляем подписчиков...');
    const followersCount = 10 + Math.floor(Math.random() * 6);
    const followers = [...userIds].sort(() => 0.5 - Math.random()).slice(0, followersCount);
    
    for (const followerId of followers) {
      await client.query(
        `INSERT INTO subscriptions (follower_id, followee_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [followerId, userId]
      );
    }
    console.log(`Добавлено ${followersCount} подписчиков\n`);
    
    console.log('🔗 Добавляем подписки для CREATiveOR...');
    const followingCount = 5 + Math.floor(Math.random() * 4);
    const following = [...userIds].sort(() => 0.5 - Math.random()).slice(0, followingCount);
    
    for (const followeeId of following) {
      await client.query(
        `INSERT INTO subscriptions (follower_id, followee_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userId, followeeId]
      );
    }
    console.log(`CREATiveOR подписан на ${followingCount} пользователей\n`);
    
    console.log('═══════════════════════════════════════');
    console.log('Пользователь CREATiveOR успешно создан!');
    console.log('═══════════════════════════════════════');
    console.log('Статистика:');
    console.log(`   Постов: 5 (с изображениями)`);
    console.log(`   Подписчиков: ${followersCount}`);
    console.log(`   Подписок: ${followingCount}`);
    console.log(`   Лайков на постах: ~100`);
    console.log(`   Комментариев: ~35`);
    console.log(`   Просмотров: ~125`);
    console.log('═══════════════════════════════════════');
    console.log('\nДанные для входа:');
    console.log('   Email: creativeor@example.com');
    console.log('   Пароль: Password123');
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedCreativeUser().catch(err => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
