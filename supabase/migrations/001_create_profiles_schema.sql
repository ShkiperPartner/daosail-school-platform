-- Создание схемы базы данных для профилей пользователей
-- Фаза 3: Интеграция с Supabase

-- Таблица пролилей пользователей
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  city TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'Интересующийся' CHECK (role IN ('Интересующийся', 'Пассажир', 'Матрос')),
  join_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица статистики пользователей
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  questions_asked INTEGER NOT NULL DEFAULT 0,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  articles_read INTEGER NOT NULL DEFAULT 0,
  community_messages INTEGER NOT NULL DEFAULT 0,
  last_login_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_logins INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица достижений пользователей
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  title TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description TEXT NOT NULL,
  description_ru TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('learning', 'community', 'progress', 'special')),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Таблица чатов пользователей для истории
CREATE TABLE IF NOT EXISTS user_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assistant_type TEXT NOT NULL,
  main_topic TEXT,
  messages_count INTEGER NOT NULL DEFAULT 0,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS (Row Level Security) политики
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_chats ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы profiles
CREATE POLICY "Пользователи могут видеть свой профиль" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Пользователи могут обновлять свой профиль" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Пользователи могут создавать свой профиль" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Политики для таблицы user_stats
CREATE POLICY "Пользователи могут видеть свою статистику" ON user_stats
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Пользователи могут обновлять свою статистику" ON user_stats
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Пользователи могут создавать свою статистику" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Политики для таблицы user_achievements
CREATE POLICY "Пользователи могут видеть свои достижения" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать свои достижения" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политики для таблицы user_chats
CREATE POLICY "Пользователи могут видеть свои чаты" ON user_chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать свои чаты" ON user_chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять свои чаты" ON user_chats
  FOR UPDATE USING (auth.uid() = user_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Функция для создания профиля при регистрации пользователя
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, nickname)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'nickname', NULL)
  );

  INSERT INTO user_stats (id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического создания профиля
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_category ON user_achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_chats_user_id ON user_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chats_last_activity ON user_chats(last_activity DESC);

-- Вставка начальных достижений (шаблоны)
INSERT INTO user_achievements (user_id, achievement_id, title, title_ru, description, description_ru, icon_name, category)
SELECT
  id,
  'welcome',
  'Welcome Aboard!',
  'Добро пожаловать на борт!',
  'Successfully joined DAOsail community',
  'Успешно присоединились к сообществу DAOsail',
  'Star',
  'special'
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM user_achievements
  WHERE user_id = profiles.id AND achievement_id = 'welcome'
);