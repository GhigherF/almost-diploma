-- Добавление поля updated_at в таблицу posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- Установка значения updated_at равным created_at для существующих постов
UPDATE posts SET updated_at = created_at WHERE updated_at IS NULL;

-- Добавление поля deleted_by_admin если его нет
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_by_admin BOOLEAN NOT NULL DEFAULT FALSE;
