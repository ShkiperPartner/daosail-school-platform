-- Seed data for development
-- Этот файл запускается после миграций для добавления тестовых данных

-- Создание bucket для аватаров если он не существует
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Политики для storage bucket avatars
DO $$
BEGIN
  -- Политика для загрузки аватаров
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Users can upload their own avatar'
  ) THEN
    CREATE POLICY "Users can upload their own avatar" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Политика для обновления аватаров
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Users can update their own avatar'
  ) THEN
    CREATE POLICY "Users can update their own avatar" ON storage.objects
      FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Политика для удаления аватаров
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Users can delete their own avatar'
  ) THEN
    CREATE POLICY "Users can delete their own avatar" ON storage.objects
      FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Политика для просмотра аватаров
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Anyone can view avatars'
  ) THEN
    CREATE POLICY "Anyone can view avatars" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Добавление шаблонных достижений в систему
-- (Эти достижения будут автоматически назначаться пользователям при выполнении условий)

-- Пока добавим только приветственное достижение
-- Остальные будут добавляться динамически через ProfileService

-- ============================================================================
-- ТЕСТОВЫЕ ДАННЫЕ ДЛЯ РАЗРАБОТКИ
-- ============================================================================
-- ВНИМАНИЕ: Эти данные предназначены только для разработки!
-- В production они должны быть удалены!

-- Очистка существующих тестовых данных (опционально)
-- DELETE FROM user_chats WHERE user_id IN (SELECT id FROM profiles WHERE full_name LIKE '%Test%' OR full_name LIKE '%Тест%');
-- DELETE FROM user_achievements WHERE user_id IN (SELECT id FROM profiles WHERE full_name LIKE '%Test%' OR full_name LIKE '%Тест%');
-- DELETE FROM user_stats WHERE id IN (SELECT id FROM profiles WHERE full_name LIKE '%Test%' OR full_name LIKE '%Тест%');
-- DELETE FROM profiles WHERE full_name LIKE '%Test%' OR full_name LIKE '%Тест%';

-- Создаем тестовые профили пользователей
-- ВАЖНО: В реальном приложении эти записи будут создаваться автоматически при регистрации через Supabase Auth

-- Тестовый пользователь 1: Начинающий (Интересующийся)
INSERT INTO profiles (id, full_name, nickname, avatar_url, city, bio, role, join_date, created_at, updated_at)
VALUES
  ('11111111-2222-3333-4444-555555555001', 'Тест Новичков', 'test_beginner', NULL, 'Тест-Сити', 'Тестовый пользователь - новичок в парусном спорте', 'Интересующийся', '2025-01-01 10:00:00+00', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  nickname = EXCLUDED.nickname,
  city = EXCLUDED.city,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  updated_at = NOW();

INSERT INTO user_stats (id, questions_asked, lessons_completed, articles_read, community_messages, last_login_date, total_logins, created_at, updated_at)
VALUES
  ('11111111-2222-3333-4444-555555555001', 3, 0, 1, 0, NOW(), 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  questions_asked = EXCLUDED.questions_asked,
  lessons_completed = EXCLUDED.lessons_completed,
  articles_read = EXCLUDED.articles_read,
  community_messages = EXCLUDED.community_messages,
  last_login_date = EXCLUDED.last_login_date,
  total_logins = EXCLUDED.total_logins,
  updated_at = NOW();

-- Тестовый пользователь 2: Прогрессирующий (близок к Пассажиру)
INSERT INTO profiles (id, full_name, nickname, avatar_url, city, bio, role, join_date, created_at, updated_at)
VALUES
  ('11111111-2222-3333-4444-555555555002', 'Тест Прогресс', 'test_progress', NULL, 'Прогресс-Сити', 'Тестовый пользователь для проверки прогрессии', 'Интересующийся', '2024-12-01 10:00:00+00', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  nickname = EXCLUDED.nickname,
  city = EXCLUDED.city,
  bio = EXCLUDED.bio,
  updated_at = NOW();

INSERT INTO user_stats (id, questions_asked, lessons_completed, articles_read, community_messages, last_login_date, total_logins, created_at, updated_at)
VALUES
  ('11111111-2222-3333-4444-555555555002', 12, 3, 6, 2, NOW(), 15, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  questions_asked = EXCLUDED.questions_asked,
  lessons_completed = EXCLUDED.lessons_completed,
  articles_read = EXCLUDED.articles_read,
  community_messages = EXCLUDED.community_messages,
  last_login_date = EXCLUDED.last_login_date,
  total_logins = EXCLUDED.total_logins,
  updated_at = NOW();

-- Тестовый пользователь 3: Опытный (Матрос)
INSERT INTO profiles (id, full_name, nickname, avatar_url, city, bio, role, join_date, created_at, updated_at)
VALUES
  ('11111111-2222-3333-4444-555555555003', 'Тест Матрос', 'test_sailor', NULL, 'Морской-Порт', 'Тестовый опытный пользователь с достижениями', 'Матрос', '2024-08-01 10:00:00+00', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  nickname = EXCLUDED.nickname,
  city = EXCLUDED.city,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role,
  updated_at = NOW();

INSERT INTO user_stats (id, questions_asked, lessons_completed, articles_read, community_messages, last_login_date, total_logins, created_at, updated_at)
VALUES
  ('11111111-2222-3333-4444-555555555003', 35, 8, 15, 20, NOW(), 25, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  questions_asked = EXCLUDED.questions_asked,
  lessons_completed = EXCLUDED.lessons_completed,
  articles_read = EXCLUDED.articles_read,
  community_messages = EXCLUDED.community_messages,
  last_login_date = EXCLUDED.last_login_date,
  total_logins = EXCLUDED.total_logins,
  updated_at = NOW();

-- Добавляем несколько тестовых достижений
INSERT INTO user_achievements (id, user_id, achievement_id, title, title_ru, description, description_ru, icon_name, category, unlocked_at, created_at, updated_at)
VALUES
  -- Достижения для новичка
  ('ach-11111111-2222-3333-4444-555555555001', '11111111-2222-3333-4444-555555555001', 'first_question', 'First Question', 'Первый вопрос', 'Asked your first question', 'Задал первый вопрос', 'MessageSquare', 'engagement', '2025-01-01 12:00:00+00', NOW(), NOW()),

  -- Достижения для прогрессирующего
  ('ach-11111111-2222-3333-4444-555555555002', '11111111-2222-3333-4444-555555555002', 'first_question', 'First Question', 'Первый вопрос', 'Asked your first question', 'Задал первый вопрос', 'MessageSquare', 'engagement', '2024-12-01 11:00:00+00', NOW(), NOW()),
  ('ach-21111111-2222-3333-4444-555555555002', '11111111-2222-3333-4444-555555555002', 'curious_explorer', 'Curious Explorer', 'Любознательный исследователь', 'Asked 10 questions', 'Задал 10 вопросов', 'Compass', 'engagement', '2024-12-15 14:00:00+00', NOW(), NOW()),

  -- Достижения для опытного
  ('ach-11111111-2222-3333-4444-555555555003', '11111111-2222-3333-4444-555555555003', 'first_question', 'First Question', 'Первый вопрос', 'Asked your first question', 'Задал первый вопрос', 'MessageSquare', 'engagement', '2024-08-01 11:00:00+00', NOW(), NOW()),
  ('ach-21111111-2222-3333-4444-555555555003', '11111111-2222-3333-4444-555555555003', 'curious_explorer', 'Curious Explorer', 'Любознательный исследователь', 'Asked 10 questions', 'Задал 10 вопросов', 'Compass', 'engagement', '2024-08-10 12:00:00+00', NOW(), NOW()),
  ('ach-31111111-2222-3333-4444-555555555003', '11111111-2222-3333-4444-555555555003', 'inquisitive_mind', 'Inquisitive Mind', 'Пытливый ум', 'Asked 25 questions', 'Задал 25 вопросов', 'Brain', 'engagement', '2024-09-01 15:00:00+00', NOW(), NOW()),
  ('ach-41111111-2222-3333-4444-555555555003', '11111111-2222-3333-4444-555555555003', 'dedicated_learner', 'Dedicated Learner', 'Прилежный ученик', 'Completed 5 lessons', 'Прошел 5 уроков', 'GraduationCap', 'learning', '2024-09-15 16:00:00+00', NOW(), NOW()),
  ('ach-51111111-2222-3333-4444-555555555003', '11111111-2222-3333-4444-555555555003', 'knowledge_seeker', 'Knowledge Seeker', 'Искатель знаний', 'Read 10 articles', 'Прочитал 10 статей', 'FileText', 'learning', '2024-10-01 14:00:00+00', NOW(), NOW()),
  ('ach-61111111-2222-3333-4444-555555555003', '11111111-2222-3333-4444-555555555003', 'active_contributor', 'Active Contributor', 'Активный участник', 'Posted 10 messages', 'Написал 10 сообщений', 'MessageCircle', 'social', '2024-10-15 17:00:00+00', NOW(), NOW()),
  ('ach-71111111-2222-3333-4444-555555555003', '11111111-2222-3333-4444-555555555003', 'role_promotion_passenger', 'Welcome Aboard!', 'Добро пожаловать на борт!', 'Advanced to Passenger', 'Получил звание Пассажира', 'Ship', 'progression', '2024-09-10 13:00:00+00', NOW(), NOW()),
  ('ach-81111111-2222-3333-4444-555555555003', '11111111-2222-3333-4444-555555555003', 'role_promotion_sailor', 'True Sailor', 'Настоящий матрос', 'Advanced to Sailor', 'Получил звание Матроса', 'Anchor', 'progression', '2024-11-01 18:00:00+00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Добавляем тестовые чаты
INSERT INTO user_chats (id, user_id, title, assistant_type, main_topic, messages_count, last_activity, created_at, updated_at)
VALUES
  -- Чаты для новичка
  ('chat-11111111-2222-3333-4444-555555555001', '11111111-2222-3333-4444-555555555001', 'Что такое парусный спорт?', 'navigator', 'basic_sailing', 3, '2025-01-02 14:00:00+00', '2025-01-01 12:00:00+00', '2025-01-02 14:00:00+00'),

  -- Чаты для прогрессирующего
  ('chat-11111111-2222-3333-4444-555555555002', '11111111-2222-3333-4444-555555555002', 'Основы навигации', 'navigator', 'navigation', 8, '2024-12-20 16:00:00+00', '2024-12-10 10:00:00+00', '2024-12-20 16:00:00+00'),
  ('chat-21111111-2222-3333-4444-555555555002', '11111111-2222-3333-4444-555555555002', 'Выбор первой яхты', 'skipper', 'equipment', 5, '2025-01-05 12:00:00+00', '2025-01-01 11:00:00+00', '2025-01-05 12:00:00+00'),

  -- Чаты для опытного
  ('chat-11111111-2222-3333-4444-555555555003', '11111111-2222-3333-4444-555555555003', 'Тактика регат', 'skipper', 'racing', 15, '2024-11-20 19:00:00+00', '2024-09-01 14:00:00+00', '2024-11-20 19:00:00+00'),
  ('chat-21111111-2222-3333-4444-555555555003', '11111111-2222-3333-4444-555555555003', 'Планирование дальнего похода', 'navigator', 'voyage_planning', 22, '2024-12-15 20:30:00+00', '2024-10-01 16:00:00+00', '2024-12-15 20:30:00+00'),
  ('chat-31111111-2222-3333-4444-555555555003', '11111111-2222-3333-4444-555555555003', 'Обслуживание яхты', 'skipper', 'maintenance', 12, '2025-01-10 17:00:00+00', '2024-12-01 15:00:00+00', '2025-01-10 17:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- Выводим статистику созданных тестовых данных
DO $$
BEGIN
  RAISE NOTICE 'Seed данные успешно загружены!';
  RAISE NOTICE 'Тестовых профилей: %', (SELECT COUNT(*) FROM profiles WHERE full_name LIKE 'Тест%');
  RAISE NOTICE 'Тестовых достижений: %', (SELECT COUNT(*) FROM user_achievements WHERE user_id IN (SELECT id FROM profiles WHERE full_name LIKE 'Тест%'));
  RAISE NOTICE 'Тестовых чатов: %', (SELECT COUNT(*) FROM user_chats WHERE user_id IN (SELECT id FROM profiles WHERE full_name LIKE 'Тест%'));
END $$;