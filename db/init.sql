-- db/init.sql

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  nick            VARCHAR(50)  UNIQUE NOT NULL,
  email           VARCHAR(100) UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL DEFAULT '',
  role            VARCHAR(10)  NOT NULL DEFAULT 'user',
  avatar_url      TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_files (
  id            SERIAL PRIMARY KEY,
  post_id       INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  file_url      TEXT NOT NULL,
  file_type     VARCHAR(20) NOT NULL DEFAULT 'other',
  original_name TEXT NOT NULL DEFAULT '',
  mime_type     VARCHAR(100) NOT NULL DEFAULT '',
  size_bytes    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id             SERIAL PRIMARY KEY,
  post_id        INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id      INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  body           TEXT NOT NULL,
  deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes_posts (
  id         SERIAL PRIMARY KEY,
  post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS likes_comments (
  id         SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id          SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);

CREATE TABLE IF NOT EXISTS post_views (
  id        SERIAL PRIMARY KEY,
  post_id   INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

INSERT INTO users (nick, email, hashed_password, role, avatar_url) VALUES
  ('alice', 'alice@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'),
  ('bob',   'bob@example.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'),
  ('creative', 'creative@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'https://api.dicebear.com/7.x/avataaars/svg?seed=creative&backgroundColor=5ba3d0'),
  ('designer', 'designer@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'https://api.dicebear.com/7.x/avataaars/svg?seed=designer'),
  ('coder', 'coder@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'https://api.dicebear.com/7.x/avataaars/svg?seed=coder&backgroundColor=db8a52'),
  ('artist', 'artist@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'https://api.dicebear.com/7.x/avataaars/svg?seed=artist&backgroundColor=e91e63')
ON CONFLICT DO NOTHING;

-- Seed posts and activities for creative user (distributed throughout the month)
INSERT INTO posts (user_id, body, created_at) VALUES
  (3, 'Начало нового проекта! 🎨', NOW() - INTERVAL '35 days'),
  (3, 'Работаю над дизайном новых компонентов', NOW() - INTERVAL '33 days'),
  (3, 'Новая идея для интерфейса профиля', NOW() - INTERVAL '31 days'),
  (3, 'Вдохновение приходит в самые неожиданные моменты', NOW() - INTERVAL '29 days'),
  (3, 'Завершил первый макет главной страницы', NOW() - INTERVAL '27 days'),
  (3, 'Обсуждение с командой разработки', NOW() - INTERVAL '25 days'),
  (3, 'Переделка интерфейса с учетом feedback', NOW() - INTERVAL '23 days'),
  (3, 'Новые компоненты готовы к тестированию', NOW() - INTERVAL '21 days'),
  (3, 'Тестирование всех функций on mobile', NOW() - INTERVAL '19 days'),
  (3, 'Нашел интересный подход к анимациям', NOW() - INTERVAL '17 days'),
  (3, 'Синхронизация между модулями завершена', NOW() - INTERVAL '15 days'),
  (3, 'Готовлю презентацию для stakeholders', NOW() - INTERVAL '13 days'),
  (3, 'Последние правки перед релизом', NOW() - INTERVAL '11 days'),
  (3, 'Проект почти готов к продакшену!', NOW() - INTERVAL '9 days'),
  (3, 'Финальное тестирование перед запуском', NOW() - INTERVAL '7 days'),
  (3, 'Готово к запуску на production! 🚀', NOW() - INTERVAL '5 days'),
  (3, 'Анализ фидбека пользователей', NOW() - INTERVAL '4 days'),
  (3, 'Планирую улучшения для следующей версии', NOW() - INTERVAL '3 days'),
  (3, 'Новое обновление уже в работе! 💪', NOW() - INTERVAL '2 days'),
  (3, 'Что-то крутое готовится...'|| chr(10) || 'Stay tuned! 👀', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Seed posts for artist user (with files)
INSERT INTO posts (user_id, body, created_at) VALUES
  (6, 'Начали работу над новым портфолио! 🎨', NOW() - INTERVAL '32 days'),
  (6, 'Концепт дизайна готов к обсуждению', NOW() - INTERVAL '28 days'),
  (6, 'Переделал color palette, выглядит намного лучше', NOW() - INTERVAL '24 days'),
  (6, 'Завершил портфолио проект! Используем React и Tailwind CSS для создания красивого дизайна. Документация с полной спецификацией систем дизайна прилагается. 📁', NOW() - INTERVAL '20 days'),
  (6, 'Клиент в восторге от результата! ✨', NOW() - INTERVAL '16 days'),
  (6, 'Новое обновление дизайн-системы! Добавил новые цвета, типографику и компоненты. Все детали в прикрепленном файле. 🎨✨', NOW() - INTERVAL '12 days'),
  (6, 'Интеграция дизайн-системы в проект', NOW() - INTERVAL '10 days'),
  (6, 'Работаю над улучшением user experience', NOW() - INTERVAL '8 days'),
  (6, 'Новые идеи для следующего проекта 💡', NOW() - INTERVAL '6 days'),
  (6, 'Комплектую портфолио свежими работами', NOW() - INTERVAL '4 days'),
  (6, 'Приглашаю на открытый обзор моих проектов!', NOW() - INTERVAL '2 days'),
  (6, 'Спасибо всем за поддержку! 🙏 Это вдохновляет на новые работы', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Add comments from other users
INSERT INTO comments (post_id, user_id, body, created_at) 
SELECT p.id, 2, 'Отличная работа!', p.created_at + INTERVAL '2 hours'
FROM posts p WHERE p.user_id = 3 LIMIT 5
ON CONFLICT DO NOTHING;

-- Add files to artist user's posts
INSERT INTO post_files (post_id, file_url, file_type, original_name, mime_type, size_bytes, created_at)
SELECT p.id, '/files/portfolio.pdf', 'document', 'portfolio.pdf', 'application/pdf', 2847, p.created_at
FROM posts p WHERE p.user_id = 6 AND p.created_at = (SELECT MIN(created_at) FROM posts WHERE user_id = 6)
ON CONFLICT DO NOTHING;

INSERT INTO post_files (post_id, file_url, file_type, original_name, mime_type, size_bytes, created_at)
SELECT p.id, '/files/recommendations.docx', 'document', 'recommendations.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1956, p.created_at
FROM posts p WHERE p.user_id = 6 AND p.created_at = (SELECT MAX(created_at) FROM posts WHERE user_id = 6)
ON CONFLICT DO NOTHING;

INSERT INTO post_files (post_id, file_url, file_type, original_name, mime_type, size_bytes, created_at)
SELECT p.id, '/files/project_mockup.png', 'image', 'project_mockup.png', 'image/png', 3456, p.created_at
FROM posts p WHERE p.user_id = 6 AND p.created_at = (SELECT MIN(created_at) FROM posts WHERE user_id = 6)
ON CONFLICT DO NOTHING;

-- Add likes
INSERT INTO likes_posts (post_id, user_id, created_at)
SELECT p.id, u.id, p.created_at + INTERVAL '3 hours'
FROM posts p, users u 
WHERE p.user_id = 3 AND u.id IN (2, 4, 5)
ON CONFLICT DO NOTHING;

-- Add likes to artist user's posts
INSERT INTO likes_posts (post_id, user_id, created_at)
SELECT p.id, u.id, p.created_at + INTERVAL '4 hours'
FROM posts p, users u 
WHERE p.user_id = 6 AND u.id IN (1, 2, 3, 4, 5)
ON CONFLICT DO NOTHING;

-- Add subscriptions
INSERT INTO subscriptions (follower_id, followee_id, created_at) VALUES
  (2, 3, NOW() - INTERVAL '30 days'),
  (4, 3, NOW() - INTERVAL '25 days'),
  (5, 3, NOW() - INTERVAL '22 days'),
  (1, 3, NOW() - INTERVAL '18 days'),
  (6, 3, NOW() - INTERVAL '16 days'),
  (3, 2, NOW() - INTERVAL '12 days'),
  (2, 6, NOW() - INTERVAL '28 days'),
  (3, 6, NOW() - INTERVAL '24 days'),
  (4, 6, NOW() - INTERVAL '20 days'),
  (5, 6, NOW() - INTERVAL '18 days'),
  (1, 6, NOW() - INTERVAL '14 days'),
  (6, 2, NOW() - INTERVAL '10 days'),
  (1, 2, NOW() - INTERVAL '15 days'),
  (4, 2, NOW() - INTERVAL '12 days')
ON CONFLICT DO NOTHING;

-- Migration: add parent_id to comments if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='parent_id') THEN
    ALTER TABLE comments ADD COLUMN parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_change_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_email VARCHAR(100) NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for email_change_tokens table
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_user_id ON email_change_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_expires_at ON email_change_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_token ON email_change_tokens(token);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='deleted_by_admin') THEN
    ALTER TABLE posts ADD COLUMN deleted_by_admin BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='banned') THEN
    ALTER TABLE users ADD COLUMN banned BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='banned_at') THEN
    ALTER TABLE users ADD COLUMN banned_at TIMESTAMP;
  END IF;
END $$;

INSERT INTO posts (user_id, body) VALUES
  (1, 'Hello from Alice!'),
  (2, 'Hello from Bob!')
ON CONFLICT DO NOTHING;