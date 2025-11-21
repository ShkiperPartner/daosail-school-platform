-- Быстрый фикс для добавления session_id в user_chats
-- Применить в Supabase Dashboard > SQL Editor

-- Добавляем session_id если еще нет
ALTER TABLE user_chats
ADD COLUMN IF NOT EXISTS session_id UUID DEFAULT gen_random_uuid();

-- Добавляем status если еще нет
ALTER TABLE user_chats
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
CHECK (status IN ('active', 'archived', 'deleted'));

-- Добавляем updated_at если еще нет
ALTER TABLE user_chats
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Создаем уникальный индекс для session_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_chats_session_id ON user_chats(session_id);

-- Заполняем session_id для существующих записей если NULL
UPDATE user_chats SET session_id = gen_random_uuid() WHERE session_id IS NULL;

-- Проверка результата
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_chats'
ORDER BY ordinal_position;
