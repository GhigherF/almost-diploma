require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'microblog',
});

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const users = [
  ['alice', 'alice@example.com', 'admin'],
  ['anna_design', 'anna.design@example.com', 'admin'],
  ['max_frontend', 'max.frontend@example.com', 'user'],
  ['lena_photo', 'lena.photo@example.com', 'user'],
  ['igor_backend', 'igor.backend@example.com', 'user'],
  ['maria_travel', 'maria.travel@example.com', 'user'],
  ['pavel_music', 'pavel.music@example.com', 'user'],
  ['olga_books', 'olga.books@example.com', 'user'],
  ['denis_sport', 'denis.sport@example.com', 'user'],
  ['sofia_art', 'sofia.art@example.com', 'user'],
  ['nikita_devops', 'nikita.devops@example.com', 'user'],
  ['alisa_ui', 'alisa.ui@example.com', 'user'],
  ['roman_code', 'roman.code@example.com', 'user'],
  ['vera_cafe', 'vera.cafe@example.com', 'user'],
  ['kirill_game', 'kirill.game@example.com', 'user'],
  ['dasha_writer', 'dasha.writer@example.com', 'user'],
  ['artem_data', 'artem.data@example.com', 'user'],
  ['katya_nature', 'katya.nature@example.com', 'user'],
  ['misha_video', 'misha.video@example.com', 'user'],
  ['yulia_startup', 'yulia.startup@example.com', 'user'],
  ['egor_mobile', 'egor.mobile@example.com', 'user'],
];

// Медиа-файлы не используются (удалено загрузка внешних изображений и GIF)
// Оставляем только документы и текстовые посты

const postBodies = [
  { kind: 'text', body: 'Вчера я впервые за долгое время вышел на прогулку без телефона. Сначала было странно: рука автоматически тянулась проверить уведомления, открыть ленту, ответить на что-то неважное. Через десять минут я начал замечать город: мокрый асфальт, людей у кофейни, старую вывеску на углу, запах хлеба из пекарни. Кажется, иногда лучший способ перезагрузиться — просто перестать постоянно документировать жизнь и немного пожить её напрямую.' },
  { kind: 'image', body: 'почти без слов' },
  { kind: 'gif', body: 'хахах, это буквально я после деплоя в пятницу вечером' },
  { kind: 'none', body: 'утро началось с кофе и трёх новых багов. классика.' },
  { kind: 'doc', body: 'Прикрепил короткий список идей для следующего спринта.' },
  { kind: 'image', body: 'Сегодняшний свет в окне просто идеальный.' },
  { kind: 'none', body: 'Иногда “потом поправлю” превращается в архитектурное решение на полгода.' },
  { kind: 'gif', body: 'когда тесты прошли с первого раза' },
  { kind: 'text', body: 'Маленькое наблюдение: чем проще интерфейс выглядит для пользователя, тем больше невидимой работы внутри. Хорошая форма — это не просто поля и кнопка, а валидация, подсказки, состояния ошибок, загрузка, доступность, адаптивность и нормальные тексты. И всё это должно не мешать, а помогать.' },
  { kind: 'image-doc', body: 'Собрал мини-референс по карточкам профиля. Фото и заметки приложил.' },
  { kind: 'none', body: 'поймал себя на том, что открыл редактор “на 5 минут” и очнулся через 2 часа' },
  { kind: 'image', body: 'Небольшой кадр с прогулки. Ничего особенного, но настроение есть.' },
  { kind: 'doc', body: 'Черновик плана публикаций на неделю. Может кому-то пригодится.' },
  { kind: 'none', body: 'если код работает, но ты не понимаешь почему — это не победа, это предупреждение' },
  { kind: 'gif', body: 'мой мозг, когда в задаче написано “быстро поправить”' },
  { kind: 'text', body: 'Сегодня разбирал старый проект и понял, насколько сильно меняется подход к разработке со временем. Раньше хотелось быстрее “чтобы работало”, теперь всё чаще думаю о читаемости, предсказуемости и том, сможет ли другой человек разобраться в этом коде без археологических раскопок.' },
  { kind: 'image', body: 'Рабочее место сегодня выглядит подозрительно аккуратно.' },
  { kind: 'none', body: 'очень короткий пост' },
  { kind: 'image', body: '' },
  { kind: 'doc', body: 'Оставил файл с заметками, потому что в один пост всё не поместилось.' },
  { kind: 'gif', body: 'всё, я официально устал, но смешно' },
  { kind: 'none', body: 'Нужно чаще сохранять маленькие победы. Они потом очень помогают не бросать большую задачу.' },
  { kind: 'image-doc', body: 'До/после правок интерфейса. Плюс приложил текстовое описание изменений.' },
  { kind: 'none', body: 'Собеседование — это когда знаешь ответ, но мозг внезапно открывает вкладку “паника”.' },
  { kind: 'image', body: 'Этот снимок почему-то выглядит как обложка спокойного плейлиста.' },
  { kind: 'text', body: 'Длинная история про один баг. Всё началось с жалобы “иногда не открывается пост”. Логи молчали, локально всё работало, база выглядела нормально. Через час выяснилось, что проблема появлялась только у пользователей без аватарки и только после обновления списка комментариев. Ещё через полчаса стало понятно: фронт ожидал строку, а получал null. Исправление заняло одну строку. Поиск — половину вечера.' },
  { kind: 'gif', body: 'ну всё, продуктивность закончилась' },
  { kind: 'none', body: 'Самая недооценённая функция приложения — понятное сообщение об ошибке.' },
  { kind: 'doc', body: 'Мини-конспект по PostgreSQL: индексы, связи и каскадное удаление.' },
  { kind: 'image', body: 'Проверяю, как в ленте смотрятся вертикальные и горизонтальные изображения.' },
  { kind: 'none', body: 'Сегодня без умных мыслей. Просто хороший день.' },
  { kind: 'image-doc', body: 'Набросал идею новой страницы. Картинка + файл с пояснениями.' },
  { kind: 'gif', body: 'когда “маленькая правка” затронула 12 файлов' },
  { kind: 'text', body: 'Мне нравится формат коротких заметок: они не требуют идеальной структуры, но помогают фиксировать ход мыслей. Через несколько недель такие записи превращаются в карту решений: почему выбрали именно этот путь, что пробовали, что не сработало и какие идеи стоит вернуть позже.' },
  { kind: 'none', body: 'Никогда не спорь с CSS после полуночи.' },
  { kind: 'image', body: 'Поймал красивый градиент на небе.' },
  { kind: 'doc', body: 'Файл с чек-листом перед релизом. Да, чек-листы спасают.' },
  { kind: 'none', body: 'Лента стала выглядеть намного живее, когда данные перестали быть одинаковыми.' },
  { kind: 'gif', body: 'я, когда наконец нашёл нужную строку в логах' },
  { kind: 'text', body: 'Иногда полезно специально добавить в тестовые данные странные случаи: пустые подписи, длинные тексты, посты только с файлом, GIF, документы, много комментариев, мало лайков, старые даты. Именно такие данные быстрее показывают, где интерфейс ломается или выглядит неестественно.' },
];
const comments = [
  'Классно выглядит, особенно идея с деталями.',
  'Очень полезный опыт, забираю себе на заметку.',
  'Согласен, регулярность решает больше мотивации.',
  'Отличная работа, видно аккуратный подход.',
  'Жду продолжения, тема действительно интересная.',
  'Спасибо за пример, как раз пригодится.',
  'Выглядит живо и естественно.',
  'Хороший результат, особенно для демо.',
  'Нужно будет попробовать такой подход.',
  'Супер, стало намного понятнее.',
];

function buildGeneratedPosts() {
  const kinds = ['none', 'image', 'gif', 'doc', 'image-doc', 'json', 'csv', 'markdown', 'pdf', 'audio', 'video', 'multi'];
  const starts = [
    'Сегодня заметил странную мелочь:',
    'Коротко о рабочем дне:',
    'Наблюдение из проекта:',
    'Мини-мысль без контекста:',
    'Пока пил кофе, понял:',
    'Записал для себя:',
    'Если вдруг кому-то пригодится:',
    'Хаотичная заметка дня:',
    'Небольшой апдейт:',
    'Проверяю крайний случай:',
  ];
  const middles = [
    'интерфейс становится лучше не от количества кнопок, а от понятных сценариев.',
    'самые неприятные баги обычно прячутся в тестовых данных, которых никто не создавал.',
    'один хороший комментарий в коде иногда экономит час разговоров.',
    'демо выглядит убедительнее, когда данные не похожи друг на друга.',
    'короткие посты тоже нужны, иначе лента становится слишком ровной.',
    'файлы разных типов быстро показывают слабые места загрузчика.',
    'пользователь редко делает всё так, как мы ожидали.',
    'старые даты помогают проверить статистику и сортировку.',
    'иногда нужно добавить немного хаоса, чтобы приложение выглядело живым.',
    'лучший тест интерфейса — открыть его уставшим и без подсказок.',
  ];
  const endings = [
    'Потом вернусь к этому подробнее.',
    'На этом всё, продолжаю эксперимент.',
    'Выглядит мелочью, но эффект заметный.',
    'Сохраняю как напоминание самому себе.',
    'Звучит просто, но работает.',
    'Кажется, это хороший кандидат для улучшения.',
    'Пусть будет здесь для истории.',
    'Иногда именно такие детали решают.',
  ];

  const generated = [];
  for (let i = postBodies.length; i < 200; i++) {
    const kind = kinds[i % kinds.length];
    const compact = i % 17 === 0;
    const long = i % 19 === 0;
    const body = compact
      ? ['ок', 'без слов', 'ну вот', 'это оно', 'проверка 👀'][i % 5]
      : long
        ? `${starts[i % starts.length]} ${middles[i % middles.length]} ${endings[i % endings.length]} ${middles[(i + 3) % middles.length]} ${endings[(i + 2) % endings.length]}`
        : `${starts[i % starts.length]} ${middles[i % middles.length]} ${endings[i % endings.length]}`;
    generated.push({ kind, body });
  }
  return generated;
}

postBodies.push(...buildGeneratedPosts());

function svgBuffer(title, color = '#6c8cff') {
  const safeTitle = title.replace(/[<>&]/g, '');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520"><rect width="900" height="520" fill="${color}"/><circle cx="720" cy="120" r="120" fill="rgba(255,255,255,.22)"/><circle cx="130" cy="420" r="150" fill="rgba(255,255,255,.18)"/><text x="70" y="270" font-family="Arial" font-size="54" font-weight="700" fill="white">${safeTitle}</text></svg>`);
}

function textBuffer(title, body) {
  return Buffer.from(`${title}\n\n${body}\n`, 'utf8');
}

function jsonBuffer(index, body) {
  return Buffer.from(JSON.stringify({ id: index, title: `demo-${index}`, text: body, tags: ['demo', 'microblog', 'seed'] }, null, 2), 'utf8');
}

function csvBuffer(index) {
  return Buffer.from(`name,value\nlikes,${10 + index}\nviews,${100 + index * 3}\ncomments,${index % 12}\n`, 'utf8');
}

function markdownBuffer(index, body) {
  return Buffer.from(`# Заметка ${index}\n\n${body}\n\n- идея\n- наблюдение\n- вывод\n`, 'utf8');
}

function pdfBuffer(index, body) {
  return Buffer.from(`%PDF-1.1\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >> endobj\n4 0 obj << /Length ${body.length + 32} >> stream\nBT /F1 12 Tf 30 90 Td (Demo PDF ${index}) Tj ET\nendstream endobj\ntrailer << /Root 1 0 R >>\n%%EOF`, 'utf8');
}

function binaryBuffer(label, size = 2048) {
  const buffer = Buffer.alloc(size);
  Buffer.from(label).copy(buffer);
  for (let i = label.length; i < buffer.length; i++) buffer[i] = (i * 31) % 255;
  return buffer;
}

function extFromMime(mime, fallback) {
  if (mime?.includes('gif')) return '.gif';
  if (mime?.includes('png')) return '.png';
  if (mime?.includes('webp')) return '.webp';
  if (mime?.includes('jpeg') || mime?.includes('jpg')) return '.jpg';
  if (mime?.includes('text')) return '.txt';
  return fallback;
}

async function downloadUploadFile(prefix, url, fallbackExt, fallbackBuffer) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000, maxRedirects: 5 });
    const mime = response.headers['content-type'] || '';
    const ext = extFromMime(mime, fallbackExt);
    const buffer = Buffer.from(response.data);
    const fileName = `${prefix}-${uuidv4()}${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, fileName), buffer);
    return { fileUrl: `/uploads/${fileName}`, size: buffer.length, mimeType: mime || 'application/octet-stream', ext };
  } catch (err) {
    const fileName = `${prefix}-${uuidv4()}${fallbackExt}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, fileName), fallbackBuffer);
    return { fileUrl: `/uploads/${fileName}`, size: fallbackBuffer.length, mimeType: fallbackExt === '.gif' ? 'image/gif' : 'image/svg+xml', ext: fallbackExt };
  }
}

function writeUploadFile(prefix, ext, buffer, mimeType) {
  const fileName = `${prefix}-${uuidv4()}${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, fileName), buffer);
  return { fileUrl: `/uploads/${fileName}`, size: buffer.length, mimeType, ext };
}

function daysAgo(days, hour = 12, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function insertPostFile(client, postId, file) {
  await client.query(
    `INSERT INTO post_files (post_id, file_url, file_type, original_name, mime_type, size_bytes, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [postId, file.fileUrl, file.fileType, file.originalName, file.mimeType, file.size, file.createdAt]
  );
}

async function seed() {
  const client = await pool.connect();
  try {
    const password = await bcrypt.hash('Password123', 10);
    const createdUsers = [];

    console.log('Seed: создаём только текстовые посты и документы (без изображений/GIF)');

    await client.query('BEGIN');
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM likes_comments');
    await client.query('DELETE FROM likes_posts');
    await client.query('DELETE FROM post_views');
    await client.query('DELETE FROM subscriptions');
    await client.query('DELETE FROM comments');
    await client.query('DELETE FROM post_files');
    await client.query('DELETE FROM posts');
    await client.query('DELETE FROM users');

    for (let i = 0; i < users.length; i++) {
      const [nick, email, role] = users[i];
      const { rows } = await client.query(
        `INSERT INTO users (nick, email, hashed_password, role, avatar_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nick`,
        [nick, email, password, role, null, daysAgo(55 - i * 2, 9 + (i % 9), 10)]
      );
      createdUsers.push(rows[0]);
    }

    for (let i = 0; i < createdUsers.length; i++) {
      const follower = createdUsers[i];
      const shuffled = createdUsers.filter(user => user.id !== follower.id).sort(() => 0.5 - Math.random());
      for (const target of shuffled.slice(0, 5 + (i % 5))) {
        await client.query(
          `INSERT INTO subscriptions (follower_id, followee_id, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [follower.id, target.id, daysAgo(35 - (i % 20), 13, i)]
        );
      }
    }

    const posts = [];
    for (let i = 0; i < postBodies.length; i++) {
      const postData = postBodies[i];
      const author = createdUsers[i % createdUsers.length];
      const createdAt = daysAgo(34 - i, 8 + (i % 11), (i * 11) % 60);
      const { rows } = await client.query(
        `INSERT INTO posts (user_id, body, created_at) VALUES ($1, $2, $3) RETURNING id, user_id, created_at`,
        [author.id, postData.body || ' ', createdAt]
      );
      const post = rows[0];
      posts.push(post);

      if (postData.kind === 'doc') {
        const doc = writeUploadFile(`note-${post.id}`, '.txt', textBuffer(`Заметки к посту ${i + 1}`, postData.body || 'Пост с прикреплённым файлом.'), 'text/plain');
        await insertPostFile(client, post.id, {
          fileUrl: doc.fileUrl,
          fileType: 'document',
          originalName: `notes-${i + 1}.txt`,
          mimeType: doc.mimeType,
          size: doc.size,
          createdAt,
        });
      }

      if (postData.kind === 'json' || postData.kind === 'multi') {
        const file = writeUploadFile(`data-${post.id}`, '.json', jsonBuffer(i + 1, postData.body), 'application/json');
        await insertPostFile(client, post.id, {
          fileUrl: file.fileUrl,
          fileType: 'document',
          originalName: `data-${i + 1}.json`,
          mimeType: file.mimeType,
          size: file.size,
          createdAt,
        });
      }

      if (postData.kind === 'csv' || postData.kind === 'multi') {
        const file = writeUploadFile(`table-${post.id}`, '.csv', csvBuffer(i + 1), 'text/csv');
        await insertPostFile(client, post.id, {
          fileUrl: file.fileUrl,
          fileType: 'document',
          originalName: `stats-${i + 1}.csv`,
          mimeType: file.mimeType,
          size: file.size,
          createdAt,
        });
      }

      if (postData.kind === 'markdown') {
        const file = writeUploadFile(`markdown-${post.id}`, '.md', markdownBuffer(i + 1, postData.body), 'text/markdown');
        await insertPostFile(client, post.id, {
          fileUrl: file.fileUrl,
          fileType: 'document',
          originalName: `note-${i + 1}.md`,
          mimeType: file.mimeType,
          size: file.size,
          createdAt,
        });
      }

      if (postData.kind === 'pdf') {
        const file = writeUploadFile(`pdf-${post.id}`, '.pdf', pdfBuffer(i + 1, postData.body), 'application/pdf');
        await insertPostFile(client, post.id, {
          fileUrl: file.fileUrl,
          fileType: 'document',
          originalName: `brief-${i + 1}.pdf`,
          mimeType: file.mimeType,
          size: file.size,
          createdAt,
        });
      }

    }

    const commentIds = [];
    for (let i = 0; i < posts.length; i++) {
      const commenters = createdUsers.filter(user => user.id !== posts[i].user_id).sort(() => 0.5 - Math.random()).slice(0, 2 + (i % 4));
      for (let j = 0; j < commenters.length; j++) {
        const { rows } = await client.query(
          `INSERT INTO comments (post_id, user_id, body, created_at) VALUES ($1, $2, $3, $4) RETURNING id`,
          [posts[i].id, commenters[j].id, comments[(i + j) % comments.length], new Date(new Date(posts[i].created_at).getTime() + (j + 2) * 3600000)]
        );
        commentIds.push(rows[0].id);
      }
    }

    for (let i = 0; i < posts.length; i++) {
      const actors = createdUsers.filter(user => user.id !== posts[i].user_id).sort(() => 0.5 - Math.random());
      for (const user of actors.slice(0, 6 + (i % 8))) {
        await client.query(`INSERT INTO likes_posts (post_id, user_id, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [posts[i].id, user.id, new Date(new Date(posts[i].created_at).getTime() + (user.id + 1) * 3600000)]);
      }
      for (const user of actors.slice(0, 9 + (i % 10))) {
        await client.query(`INSERT INTO post_views (post_id, user_id, viewed_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [posts[i].id, user.id, new Date(new Date(posts[i].created_at).getTime() + (user.id + 3) * 3600000)]);
      }
    }

    for (let i = 0; i < commentIds.length; i++) {
      for (const user of createdUsers.sort(() => 0.5 - Math.random()).slice(0, 1 + (i % 5))) {
        await client.query(`INSERT INTO likes_comments (comment_id, user_id, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [commentIds[i], user.id, daysAgo(12 - (i % 9), 18, i % 60)]);
      }
    }

    await client.query('COMMIT');
    console.log('Демо-данные успешно созданы.');
    console.log(`Пользователей: ${createdUsers.length}`);
    console.log(`Постов: ${posts.length}`);
    console.log(`Комментариев: ${commentIds.length}`);
    console.log('Пароль для всех пользователей: Password123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка заполнения демо-данных:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

