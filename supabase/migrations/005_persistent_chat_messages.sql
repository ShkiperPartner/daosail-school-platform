-- Создание схемы для персистентного хранения сообщений чата
-- Phase 7.1: Chat Enhancements - Persistent Chat Storage

-- Обновляем таблицу user_chats (сессии чатов)
ALTER TABLE user_chats ADD COLUMN IF NOT EXISTS session_id UUID DEFAULT gen_random_uuid();
ALTER TABLE user_chats ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted'));
ALTER TABLE user_chats ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Создаем индекс для session_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_chats_session_id ON user_chats(session_id);

-- Таблица отдельных сообщений в чатах
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_session_id UUID REFERENCES user_chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  assistant_type TEXT,
  model TEXT,
  token_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS политики для chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пользователи могут видеть свои сообщения" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать свои сообщения" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять свои сообщения" ON chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- Триггер для обновления updated_at в chat_messages
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Триггер для обновления updated_at в user_chats
CREATE TRIGGER update_user_chats_updated_at
  BEFORE UPDATE ON user_chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Функция для автоматического обновления счетчика сообщений и времени активности
CREATE OR REPLACE FUNCTION update_chat_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_chats
    SET
      messages_count = messages_count + 1,
      last_activity = NOW()
    WHERE id = NEW.chat_session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_chats
    SET
      messages_count = GREATEST(messages_count - 1, 0),
      last_activity = NOW()
    WHERE id = OLD.chat_session_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления статистики чата
CREATE TRIGGER update_chat_stats_on_insert
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_stats();

CREATE TRIGGER update_chat_stats_on_delete
  AFTER DELETE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_stats();

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);

-- Функция для получения истории чата
CREATE OR REPLACE FUNCTION get_chat_history(
  p_session_id UUID,
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  role TEXT,
  content TEXT,
  assistant_type TEXT,
  model TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Проверяем, что пользователь имеет доступ к этому чату
  IF NOT EXISTS (
    SELECT 1 FROM user_chats
    WHERE session_id = p_session_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied to chat session';
  END IF;

  RETURN QUERY
  SELECT
    cm.id,
    cm.role,
    cm.content,
    cm.assistant_type,
    cm.model,
    cm.metadata,
    cm.created_at
  FROM chat_messages cm
  JOIN user_chats uc ON uc.id = cm.chat_session_id
  WHERE uc.session_id = p_session_id
    AND cm.user_id = p_user_id
  ORDER BY cm.created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для создания новой сессии чата
CREATE OR REPLACE FUNCTION create_chat_session(
  p_user_id UUID,
  p_title TEXT,
  p_assistant_type TEXT
)
RETURNS UUID AS $$
DECLARE
  new_session_id UUID;
  chat_id UUID;
BEGIN
  -- Создаем новую сессию чата
  INSERT INTO user_chats (user_id, title, assistant_type, session_id)
  VALUES (p_user_id, p_title, p_assistant_type, gen_random_uuid())
  RETURNING id, session_id INTO chat_id, new_session_id;

  RETURN new_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для сохранения сообщения в чат
CREATE OR REPLACE FUNCTION save_chat_message(
  p_session_id UUID,
  p_user_id UUID,
  p_role TEXT,
  p_content TEXT,
  p_assistant_type TEXT DEFAULT NULL,
  p_model TEXT DEFAULT NULL,
  p_token_count INTEGER DEFAULT 0,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  chat_id UUID;
  message_id UUID;
BEGIN
  -- Получаем ID чата по session_id
  SELECT id INTO chat_id
  FROM user_chats
  WHERE session_id = p_session_id AND user_id = p_user_id;

  IF chat_id IS NULL THEN
    RAISE EXCEPTION 'Chat session not found or access denied';
  END IF;

  -- Сохраняем сообщение
  INSERT INTO chat_messages (
    chat_session_id,
    user_id,
    role,
    content,
    assistant_type,
    model,
    token_count,
    metadata
  )
  VALUES (
    chat_id,
    p_user_id,
    p_role,
    p_content,
    p_assistant_type,
    p_model,
    p_token_count,
    p_metadata
  )
  RETURNING id INTO message_id;

  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения списка чатов пользователя
CREATE OR REPLACE FUNCTION get_user_chat_sessions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  session_id UUID,
  title TEXT,
  assistant_type TEXT,
  messages_count INTEGER,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uc.session_id,
    uc.title,
    uc.assistant_type,
    uc.messages_count,
    uc.last_activity,
    uc.created_at
  FROM user_chats uc
  WHERE uc.user_id = p_user_id
    AND uc.status = 'active'
  ORDER BY uc.last_activity DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;