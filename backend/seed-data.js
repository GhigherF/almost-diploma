require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.PGHOST || 'postgres',
  port: 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'microblog',
});

// Проверка на существующие данные
async function checkExistingData() {
  const { rows } = await pool.query("SELECT COUNT(*) as count FROM users WHERE nick LIKE '%Иванов%' OR nick LIKE '%Петров%'");
  return parseInt(rows[0].count) > 0;
}

// Списки для генерации контента
const firstNames = ['Александр', 'Мария', 'Дмитрий', 'Анна', 'Иван', 'Елена', 'Сергей', 'Ольга', 'Андрей', 'Наталья', 'Михаил', 'Татьяна', 'Алексей', 'Ирина', 'Владимир', 'Светлана', 'Николай', 'Екатерина', 'Павел', 'Юлия'];
const lastNames = ['Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Соколов', 'Михайлов', 'Новиков', 'Федоров', 'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Семенов', 'Егоров', 'Павлов', 'Козлов', 'Степанов'];

const postTopics = [
  'Сегодня отличная погода! ☀️',
  'Только что закончил интересный проект 💻',
  'Кто-нибудь смотрел новый фильм? Очень рекомендую! 🎬',
  'Утренний кофе - лучшее начало дня ☕',
  'Делюсь своими мыслями о программировании 🚀',
  'Прекрасный закат сегодня 🌅',
  'Новая книга просто потрясающая! 📚',
  'Выходные - время для отдыха и новых идей 💡',
  'Спорт - это жизнь! Только что вернулся с пробежки 🏃',
  'Музыка вдохновляет на новые свершения 🎵',
  'Путешествия расширяют горизонты 🌍',
  'Учусь чему-то новому каждый день 📖',
  'Технологии меняют мир к лучшему 🔧',
  'Природа - лучший источник вдохновения 🌲',
  'Друзья - это самое ценное 👥',
  'Работа над собой никогда не заканчивается 💪',
  'Искусство повсюду вокруг нас 🎨',
  'Кулинария - это творчество 🍳',
  'Фотография помогает запечатлеть моменты 📸',
  'Медитация и спокойствие 🧘',
];

const postBodies = [
  'Сегодня был невероятно продуктивный день! Удалось завершить все запланированные задачи и даже больше. Чувствую себя на вершине мира! 🎉',
  'Иногда нужно просто остановиться и насладиться моментом. Жизнь прекрасна в своей простоте.',
  'Начал изучать новую технологию и уже вижу огромный потенциал. Это открывает совершенно новые возможности!',
  'Встретил старого друга после долгого времени. Как же здорово вспоминать старые времена и делиться новостями!',
  'Прочитал интересную статью о будущем искусственного интеллекта. Мир меняется быстрее, чем мы думаем.',
  'Сегодня попробовал новый рецепт - получилось восхитительно! Делюсь с вами своим открытием 😋',
  'Закончил марафон! Это было непросто, но я справился. Главное - не сдаваться!',
  'Посмотрел документальный фильм о космосе. Вселенная настолько огромна и загадочна...',
  'Работа над новым проектом идет полным ходом. Скоро покажу результаты!',
  'Выходные провел на природе - это было именно то, что нужно для перезагрузки.',
  'Научился новому навыку сегодня. Никогда не поздно учиться чему-то новому!',
  'Музыкальный концерт был потрясающим! Живая музыка - это совсем другой уровень эмоций.',
  'Размышляю о том, как важно ценить каждый день и каждый момент жизни.',
  'Только что закончил читать книгу, которая полностью изменила мое мировоззрение.',
  'Утренняя пробежка в парке - лучший способ начать день с правильной ноги!',
  'Экспериментирую с новым хобби. Пока получается не очень, но это только начало!',
  'Сегодня помог незнакомцу, и это сделало мой день лучше. Доброта возвращается.',
  'Работаю над улучшением своих навыков. Постоянное развитие - ключ к успеху.',
  'Посетил выставку современного искусства. Некоторые работы просто поразили воображение!',
  'Готовлюсь к важному событию. Волнуюсь, но в хорошем смысле!',
];

const comments = [
  'Отличный пост! 👍',
  'Полностью согласен с вами!',
  'Интересная мысль, спасибо за то, что поделились',
  'Вау, это впечатляет! 🔥',
  'Спасибо за вдохновение!',
  'Очень актуально, именно то, что нужно было услышать',
  'Продолжайте в том же духе!',
  'Это действительно круто! 😊',
  'Подписываюсь под каждым словом',
  'Отличная работа!',
  'Мотивирует на новые свершения',
  'Спасибо за позитив!',
  'Очень полезная информация',
  'Браво! 👏',
  'Это то, что я искал!',
];

async function seedData() {
  // Проверяем, не заполнена ли уже база
  const alreadySeeded = await checkExistingData();
  if (alreadySeeded) {
    console.log('ℹ️  База данных уже содержит тестовые данные, пропускаем заполнение');
    return;
  }
  
  const client = await pool.connect();
  
  try {
    console.log('🚀 Начинаем заполнение базы данных...\n');
    
    // 1. Создаем пользователей
    console.log('👥 Создаем 30 пользователей...');
    const userIds = [];
    const hashedPassword = await bcrypt.hash('Password123', 10);
    
    // Список URL аватарок (используем placeholder сервис)
    const avatarUrls = [
      'https://i.pravatar.cc/150?img=1',
      'https://i.pravatar.cc/150?img=2',
      'https://i.pravatar.cc/150?img=3',
      'https://i.pravatar.cc/150?img=5',
      'https://i.pravatar.cc/150?img=6',
      'https://i.pravatar.cc/150?img=7',
      'https://i.pravatar.cc/150?img=8',
      'https://i.pravatar.cc/150?img=9',
      'https://i.pravatar.cc/150?img=11',
      'https://i.pravatar.cc/150?img=12',
      'https://i.pravatar.cc/150?img=13',
      'https://i.pravatar.cc/150?img=14',
      'https://i.pravatar.cc/150?img=15',
      'https://i.pravatar.cc/150?img=16',
      'https://i.pravatar.cc/150?img=17',
      'https://i.pravatar.cc/150?img=18',
      'https://i.pravatar.cc/150?img=19',
      'https://i.pravatar.cc/150?img=20',
    ];
    
    for (let i = 0; i < 30; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const nick = `${firstName}${lastName}${i}`;
      const email = `${nick.toLowerCase()}@example.com`;
      
      // 60% пользователей получают аватарки
      const hasAvatar = Math.random() < 0.6;
      const avatarUrl = hasAvatar ? avatarUrls[i % avatarUrls.length] : null;
      
      // Дата регистрации в течение последних 60 дней
      const daysAgo = Math.floor(Math.random() * 60);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(Math.floor(Math.random() * 24));
      createdAt.setMinutes(Math.floor(Math.random() * 60));
      
      const { rows } = await client.query(
        `INSERT INTO users (nick, email, hashed_password, role, avatar_url, created_at)
         VALUES ($1, $2, $3, 'user', $4, $5)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [nick, email, hashedPassword, avatarUrl, createdAt]
      );
      
      if (rows.length > 0) {
        userIds.push(rows[0].id);
        console.log(`  ✓ Создан пользователь: ${nick}${hasAvatar ? ' (с аватаркой)' : ''}`);
      }
    }
    
    console.log(`\n✅ Создано ${userIds.length} пользователей\n`);
    
    // 2. Создаем подписки (каждый пользователь подписывается на 3-7 случайных пользователей)
    console.log('🔗 Создаем подписки...');
    let subscriptionsCount = 0;
    
    for (const userId of userIds) {
      const subsCount = 3 + Math.floor(Math.random() * 5); // 3-7 подписок
      const availableUsers = userIds.filter(id => id !== userId);
      const shuffled = availableUsers.sort(() => 0.5 - Math.random());
      const toSubscribe = shuffled.slice(0, subsCount);
      
      for (const followeeId of toSubscribe) {
        try {
          await client.query(
            `INSERT INTO subscriptions (follower_id, followee_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [userId, followeeId]
          );
          subscriptionsCount++;
        } catch (err) {
          // Игнорируем дубликаты
        }
      }
    }
    
    console.log(`✅ Создано ${subscriptionsCount} подписок\n`);
    
    // 3. Создаем посты
    console.log('📝 Создаем 200+ постов...');
    const postIds = [];
    
    for (let i = 0; i < 210; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const topic = postTopics[Math.floor(Math.random() * postTopics.length)];
      const body = postBodies[Math.floor(Math.random() * postBodies.length)];
      const fullBody = `${topic}\n\n${body}`;
      
      // Случайная дата в последние 30 дней
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(Math.floor(Math.random() * 24));
      createdAt.setMinutes(Math.floor(Math.random() * 60));
      
      const { rows } = await client.query(
        `INSERT INTO posts (user_id, body, created_at)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [userId, fullBody, createdAt]
      );
      
      postIds.push(rows[0].id);
      
      if ((i + 1) % 20 === 0) {
        console.log(`  ✓ Создано ${i + 1} постов...`);
      }
    }
    
    console.log(`✅ Создано ${postIds.length} постов\n`);
    
    // 4. Создаем лайки на посты (каждый пост получает 0-15 лайков)
    console.log('❤️ Создаем лайки на посты...');
    let postLikesCount = 0;
    
    for (const postId of postIds) {
      const likesCount = Math.floor(Math.random() * 16); // 0-15 лайков
      const shuffledUsers = [...userIds].sort(() => 0.5 - Math.random());
      const likers = shuffledUsers.slice(0, likesCount);
      
      for (const userId of likers) {
        try {
          // Лайк ставится в случайное время после создания поста
          const { rows: postRows } = await client.query('SELECT created_at FROM posts WHERE id = $1', [postId]);
          const postCreatedAt = new Date(postRows[0].created_at);
          const likedAt = new Date(postCreatedAt);
          const hoursAfter = Math.floor(Math.random() * 48); // 0-48 часов после создания
          likedAt.setHours(likedAt.getHours() + hoursAfter);
          
          await client.query(
            `INSERT INTO likes_posts (post_id, user_id, created_at)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [postId, userId, likedAt]
          );
          postLikesCount++;
        } catch (err) {
          // Игнорируем дубликаты
        }
      }
    }
    
    console.log(`✅ Создано ${postLikesCount} лайков на посты\n`);
    
    // 5. Создаем комментарии (30-50 комментариев на случайные посты)
    console.log('💬 Создаем комментарии...');
    const commentsCount = 30 + Math.floor(Math.random() * 21); // 30-50 комментариев
    const commentIds = [];
    
    for (let i = 0; i < commentsCount; i++) {
      const postId = postIds[Math.floor(Math.random() * postIds.length)];
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const commentBody = comments[Math.floor(Math.random() * comments.length)];
      
      // Комментарий создается после поста
      const { rows: postRows } = await client.query('SELECT created_at FROM posts WHERE id = $1', [postId]);
      const postCreatedAt = new Date(postRows[0].created_at);
      const commentedAt = new Date(postCreatedAt);
      const hoursAfter = Math.floor(Math.random() * 72); // 0-72 часа после создания поста
      commentedAt.setHours(commentedAt.getHours() + hoursAfter);
      
      const { rows } = await client.query(
        `INSERT INTO comments (post_id, user_id, body, created_at)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [postId, userId, commentBody, commentedAt]
      );
      
      commentIds.push(rows[0].id);
    }
    
    console.log(`✅ Создано ${commentIds.length} комментариев\n`);
    
    // 6. Создаем лайки на комментарии
    console.log('❤️ Создаем лайки на комментарии...');
    let commentLikesCount = 0;
    
    for (const commentId of commentIds) {
      const likesCount = Math.floor(Math.random() * 8); // 0-7 лайков
      const shuffledUsers = [...userIds].sort(() => 0.5 - Math.random());
      const likers = shuffledUsers.slice(0, likesCount);
      
      for (const userId of likers) {
        try {
          // Лайк на комментарий ставится после создания комментария
          const { rows: commentRows } = await client.query('SELECT created_at FROM comments WHERE id = $1', [commentId]);
          const commentCreatedAt = new Date(commentRows[0].created_at);
          const likedAt = new Date(commentCreatedAt);
          const hoursAfter = Math.floor(Math.random() * 24); // 0-24 часа после комментария
          likedAt.setHours(likedAt.getHours() + hoursAfter);
          
          await client.query(
            `INSERT INTO likes_comments (comment_id, user_id, created_at)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [commentId, userId, likedAt]
          );
          commentLikesCount++;
        } catch (err) {
          // Игнорируем дубликаты
        }
      }
    }
    
    console.log(`✅ Создано ${commentLikesCount} лайков на комментарии\n`);
    
    // 7. Создаем просмотры постов
    console.log('👁️ Создаем просмотры постов...');
    let viewsCount = 0;
    
    for (const postId of postIds) {
      const viewersCount = Math.floor(Math.random() * 20); // 0-19 просмотров
      const shuffledUsers = [...userIds].sort(() => 0.5 - Math.random());
      const viewers = shuffledUsers.slice(0, viewersCount);
      
      for (const userId of viewers) {
        try {
          // Просмотр происходит после создания поста
          const { rows: postRows } = await client.query('SELECT created_at FROM posts WHERE id = $1', [postId]);
          const postCreatedAt = new Date(postRows[0].created_at);
          const viewedAt = new Date(postCreatedAt);
          const hoursAfter = Math.floor(Math.random() * 96); // 0-96 часов после создания
          viewedAt.setHours(viewedAt.getHours() + hoursAfter);
          
          await client.query(
            `INSERT INTO post_views (post_id, user_id, viewed_at)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [postId, userId, viewedAt]
          );
          viewsCount++;
        } catch (err) {
          // Игнорируем дубликаты
        }
      }
    }
    
    console.log(`✅ Создано ${viewsCount} просмотров\n`);
    
    // Итоговая статистика
    console.log('═══════════════════════════════════════');
    console.log('📊 ИТОГОВАЯ СТАТИСТИКА:');
    console.log('═══════════════════════════════════════');
    console.log(`👥 Пользователей: ${userIds.length}`);
    console.log(`📝 Постов: ${postIds.length}`);
    console.log(`💬 Комментариев: ${commentIds.length}`);
    console.log(`🔗 Подписок: ${subscriptionsCount}`);
    console.log(`❤️ Лайков на посты: ${postLikesCount}`);
    console.log(`❤️ Лайков на комментарии: ${commentLikesCount}`);
    console.log(`👁️ Просмотров: ${viewsCount}`);
    console.log('═══════════════════════════════════════');
    console.log('\n✅ База данных успешно заполнена!\n');
    console.log('📝 Данные для входа:');
    console.log('   Email: любой из созданных (например, АлександрИванов0@example.com)');
    console.log('   Пароль: Password123');
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Ошибка при заполнении базы данных:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Запускаем скрипт
seedData().catch(err => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
