-- Создание таблицы email_leads для гостевых пользователей
-- Phase 5: Guest Flow Implementation

-- Таблица для сохранения email адресов гостей
CREATE TABLE IF NOT EXISTS email_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL DEFAULT 'guest_chat', -- откуда пришел лид
  conversation_topic TEXT, -- тема первого разговора
  messages_count INTEGER NOT NULL DEFAULT 0,
  first_interaction TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_interaction TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_to_user BOOLEAN NOT NULL DEFAULT FALSE, -- стал ли зарегистрированным пользователем
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- связь с пользователем если зарегистрировался
  notes TEXT, -- заметки администратора
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE email_leads ENABLE ROW LEVEL SECURITY;

-- Политики доступа (только админы могут читать лиды)
CREATE POLICY "Только админы могут читать лиды" ON email_leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Администратор'
    )
  );

-- Гости могут создавать свои лиды (только для своего email)
CREATE POLICY "Гости могут создавать лиды" ON email_leads
  FOR INSERT WITH CHECK (TRUE); -- любой может создать лид

-- Обновление updated_at при изменении
CREATE TRIGGER update_email_leads_updated_at
  BEFORE UPDATE ON email_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_email_leads_email ON email_leads(email);
CREATE INDEX IF NOT EXISTS idx_email_leads_source ON email_leads(source);
CREATE INDEX IF NOT EXISTS idx_email_leads_created_at ON email_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_leads_converted ON email_leads(converted_to_user);

-- Функция для обновления статистики лида
CREATE OR REPLACE FUNCTION update_email_lead_stats(lead_email TEXT, new_topic TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  UPDATE email_leads
  SET
    messages_count = messages_count + 1,
    last_interaction = NOW(),
    conversation_topic = COALESCE(conversation_topic, new_topic),
    updated_at = NOW()
  WHERE email = lead_email;

  -- Если лид не найден, создаем новый
  IF NOT FOUND THEN
    INSERT INTO email_leads (email, conversation_topic, messages_count)
    VALUES (lead_email, new_topic, 1);
  END IF;
END;
$$ language 'plpgsql';

-- Функция для конвертации лида в пользователя
CREATE OR REPLACE FUNCTION convert_lead_to_user(lead_email TEXT, new_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE email_leads
  SET
    converted_to_user = TRUE,
    user_id = new_user_id,
    updated_at = NOW()
  WHERE email = lead_email;
END;
$$ language 'plpgsql';