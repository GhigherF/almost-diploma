const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
  host: process.env.PGHOST || 'postgres',
  port: 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'microblog',
});

const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Образовательный контент для болванчиков
const educationalPosts = [
  {
    username: 'science_daily',
    email: 'science@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=science',
    posts: [
      `Чёрные дыры и квантовая механика

Квантовая механика описывает поведение частиц на микроскопическом уровне, где классические законы физики перестают работать. В основе теории лежит принцип неопределённости Гейзенберга, который утверждает, что невозможно одновременно точно измерить положение и импульс частицы.

Чёрные дыры представляют собой регионы пространства-времени с гравитационным притяжением настолько сильным, что ничто, даже свет, не может покинуть их. Горизонт событий — граница чёрной дыры — отделяет область, откуда невозможен возврат. Согласно теории относительности Эйнштейна, массивные объекты искривляют пространство-время, создавая гравитационное поле.`,

      `Эволюция и естественный отбор

Теория эволюции Чарльза Дарвина объясняет разнообразие жизни на Земле через процесс естественного отбора. Организмы с полезными наследуемыми признаками имеют больше шансов выжить и размножаться, передавая эти признаки потомству.

Генетика показала, что эволюция происходит на молекулярном уровне через мутации ДНК. Современная эволюционная теория синтезирует дарвиновский отбор с популяционной генетикой. Примеры естественного отбора можно наблюдать повсюду: от резистентности бактерий к антибиотикам до камуфляжа бабочек-берёзовиц.`,

      `Климат Земли и парниковый эффект

Парниковый эффект — естественный процесс, при котором атмосфера Земли удерживает тепло от Солнца. Без него средняя температура планеты составляла бы около -18°C вместо текущих +15°C. Однако антропогенные выбросы CO2 и метана усиливают этот эффект.

Глобальное потепление приводит к таянию ледников, повышению уровня моря и экстремальным погодным явлениям. Межправительственная группа экспертов по изменению климата (МГЭИК) прогнозирует рост температуры на 1.5-4.5°C к 2100 году без серьёзных мер по сокращению выбросов.`
    ]
  },
  {
    username: 'history_facts',
    email: 'history@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=history',
    posts: [
      `Древний Египет и пирамидальное строительство

Пирамиды Гизы — последнее из семи чудес древнего мира, сохранившееся до наших дней. Великая пирамида Хеопса была построена около 2560 года до н.э. и оставалась самым высоким сооружением мира более 3800 лет.

Египтяне разработали сложные системы ирригации, математики и астрономии. Их календарь на 365 дней был на удивление точным. Иератическое письмо, упрощённая форма иероглифов, использовалась для повседневной документации. Религия древних египтян включала веру в загробную жизнь, что привело к практике мумификации для сохранения тела для будущего возрождения.`,

      `Ренессанс и возрождение науки

Ренессанс XIV-XVII веков ознаменовал переход от средневековья к новому времени. Италия стала колыбелью этого движения, с Флоренцией, Венецией и Римом как центрами культурного расцвета.

Леонардо да Винчи воплощал идеал универсального человека: он был художником, инженером, анатомом и изобретателем. Его работы "Мона Лиза" и "Тайная вечеря" стали символами эпохи. Микеланджело создал статую Давида и расписал потолок Сикстинской капеллы. Изобретение книгопечатания Гутенбергом в 1440-х годах революционизировало распространение знаний.`,

      `Промышленная революция

Промышленная революция XVIII-XIX веков преобразовала аграрные общества в индустриальные. Изобретение паровой машины Джеймсом Уаттом и механизация текстильного производства изменили экономику и социальную структуру.

Железные дороги и пароходы сократили время путешествий. Урбанизация привела к росту городов и появлению рабочего класса. Эпоха принесла как прогресс в технологиях и медицине, так и социальные проблемы: детский труд, загрязнение окружающей среды и неравенство.`
    ]
  },
  {
    username: 'tech_explained',
    email: 'tech@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech',
    posts: [
      `Искусственный интеллект и машинное обучение

Машинное обучение — подраздел искусственного интеллекта, где системы учатся на данных без явного программирования. Существуют три основных типа: обучение с учителем, без учителя и с подкреплением.

Нейронные сети, вдохновлённые биологическими нейронами, лежат в основе глубокого обучения. Они состоят из слоёв узлов, которые обрабатывают информацию. Современные трансформеры, используемые в GPT и аналогичных моделях, применяют механизм внимания для обработки последовательностей данных. Применения ИИ включают распознавание речи, компьютерное зрение, автономные транспортные средства и медицинскую диагностику.`,

      `Блокчейн и криптовалюты

Блокчейн — распределённый реестр, где транзакции записываются в блоках, связанных криптографически. Каждый блок содержит хэш предыдущего, создавая неизменяемую цепочку. Эта технология обеспечивает децентрализацию и прозрачность без необходимости доверенных посредников.

Биткоин, созданный в 2008 году, стал первой криптовалютой. Доказательство работы (Proof of Work) требует вычислительных ресурсов для проверки транзакций. Эфириум ввёл смарт-контракты — самоисполняющиеся программы на блокчейне. Технология находит применение в финансах, логистике, здравоохранении и управлении цифровой идентичностью.`,

      `Квантовые компьютеры

Классические компьютеры используют биты (0 или 1), тогда как квантовые используют кубиты, которые могут находиться в суперпозиции состояний. Это позволяет квантовым компьютерам обрабатывать огромное количество вариантов одновременно.

Запутанность — явление, при котором квантовые частицы остаются связанными независимо от расстояния. Квантовые алгоритмы, такие как алгоритм Шора для факторизации чисел и алгоритм Гровера для поиска в неструктурированных базах данных, демонстрируют экспоненциальное ускорение по сравнению с классическими алгоритмами. Крупные компании, включая IBM, Google и Microsoft, разрабатывают квантовые процессоры с сотнями кубитов.`
    ]
  }
];

// Пользователи для накрутки
const influencers = ['FOTOshopper', 'videograph', 'zanuda', 'musicбvvideo'];

async function seedInfluencers() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Обновить аватарки инфлюенсерам
    for (const nick of influencers) {
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${nick}`;
      await client.query(
        'UPDATE users SET avatar_url = $1 WHERE nick = $2',
        [avatar, nick]
      );
      console.log(`[✓] Аватар для ${nick}`);
    }
    
    // 2. Получить ID инфлюенсеров и их посты
    const { rows: influencerUsers } = await client.query(
      'SELECT id, nick FROM users WHERE nick = ANY($1)',
      [influencers]
    );
    
    const allUserIds = (await client.query('SELECT id FROM users')).rows.map(r => r.id);
    
    for (const user of influencerUsers) {
      // Получить посты этого пользователя
      const { rows: posts } = await client.query(
        'SELECT id FROM posts WHERE user_id = $1 AND deleted = FALSE',
        [user.id]
      );
      
      for (const post of posts) {
        // Добавить случайное количество лайков (50-200)
        const likesCount = 50 + Math.floor(Math.random() * 150);
        const shuffled = allUserIds.filter(id => id !== user.id).sort(() => 0.5 - Math.random());
        const likeUsers = shuffled.slice(0, likesCount);
        
        for (const likerId of likeUsers) {
          await client.query(
            'INSERT INTO likes_posts (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [post.id, likerId]
          );
        }
        
        // Добавить случайное количество комментариев (10-50)
        const commentsCount = 10 + Math.floor(Math.random() * 40);
        const commentUsers = shuffled.slice(0, commentsCount);
        
        const commentTexts = [
          'Отличный пост! 🔥',
          'Очень полезная информация 👍',
          'Спасибо за контент',
          'Интересно, продолжай в том же духе',
          'Класс! Подписался',
          'Это то, что я искал',
          'Супер, очень познавательно',
          'Мне нравится твой стиль',
          'Как всегда на высоте',
          'Всё понятно объяснил',
          'Полезный материал',
          'Жду новых постов',
          'Очень круто! 😍',
          'Спасибо, записал',
          'Топ контент 👏',
          'Мастерски',
          'Браво!',
          'Просто и понятно',
          'Ценная информация',
          'Сохранил в закладки'
        ];
        
        for (let i = 0; i < commentsCount; i++) {
          const text = commentTexts[Math.floor(Math.random() * commentTexts.length)];
          const commenterId = commentUsers[i % commentUsers.length];
          await client.query(
            'INSERT INTO comments (post_id, user_id, body, deleted, created_at) VALUES ($1, $2, $3, FALSE, NOW() - INTERVAL \'1 day\' * floor(random() * 7))',
            [post.id, commenterId, text]
          );
        }
        
        console.log(`[✓] ${user.nick}: пост ${post.id} — ${likesCount} лайков, ${commentsCount} комментариев`);
      }
    }
    
    // 3. Создать 3 болванчика с образовательным контентом
    for (const author of educationalPosts) {
      // Проверить существует ли пользователь
      const { rows: existing } = await client.query(
        'SELECT id FROM users WHERE nick = $1',
        [author.username]
      );
      
      let userId;
      if (existing.length === 0) {
        // Создать пользователя
        const hashedPw = await bcrypt.hash('Password123', 10);
        const { rows: newUser } = await client.query(
          'INSERT INTO users (nick, email, hashed_password, role, avatar_url, created_at) VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL \'1 year\') RETURNING id',
          [author.username, author.email, hashedPw, 'user', author.avatar]
        );
        userId = newUser[0].id;
        console.log(`[✓] Создан пользователь ${author.username}`);
      } else {
        userId = existing[0].id;
        // Обновить аватар
        await client.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [author.avatar, userId]);
      }
      
      // Создать посты
      for (const body of author.posts) {
        const { rows: existingPost } = await client.query(
          'SELECT id FROM posts WHERE user_id = $1 AND body LIKE $2 LIMIT 1',
          [userId, body.substring(0, 50) + '%']
        );
        
        if (existingPost.length === 0) {
          const { rows: newPost } = await client.query(
            'INSERT INTO posts (user_id, body, deleted, created_at) VALUES ($1, $2, FALSE, NOW() - INTERVAL \'30 days\' * floor(random() * 6)) RETURNING id',
            [userId, body]
          );
          
          // Добавить лайки и комментарии образовательным постам
          const likesCount = 30 + Math.floor(Math.random() * 50);
          const shuffled = allUserIds.filter(id => id !== userId).sort(() => 0.5 - Math.random());
          const likeUsers = shuffled.slice(0, likesCount);
          
          for (const likerId of likeUsers) {
            await client.query(
              'INSERT INTO likes_posts (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [newPost[0].id, likerId]
            );
          }
          
          console.log(`[✓] Пост для ${author.username}: ${likesCount} лайков`);
        }
      }
    }
    
    // 4. Создать подписки для тестирования (alice подписывается на инфлюенсеров и болванчиков)
    const { rows: aliceRow } = await client.query("SELECT id FROM users WHERE nick = 'alice'");
    if (aliceRow.length > 0) {
      const aliceId = aliceRow[0].id;
      
      // Подписать alice на всех
      const targets = [...influencers, ...educationalPosts.map(e => e.username)];
      for (const targetNick of targets) {
        const { rows: target } = await client.query('SELECT id FROM users WHERE nick = $1', [targetNick]);
        if (target.length > 0) {
          await client.query(
            'INSERT INTO subscriptions (follower_id, followee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [aliceId, target[0].id]
          );
        }
      }
      console.log(`[✓] Alice подписана на ${targets.length} пользователей`);
    }
    
    await client.query('COMMIT');
    console.log('\n[✓] Готово! Инфлюенсеры и болванчики настроены.');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[✗] Ошибка:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedInfluencers();
