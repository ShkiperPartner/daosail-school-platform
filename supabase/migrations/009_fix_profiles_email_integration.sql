-- Исправление интеграции email в таблицу profiles
-- Устранение проблем с отсутствующим email и редактированием профиля

-- Добавляем колонку email в таблицу profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Создаем индекс для email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Обновляем существующие профили email'ами из auth.users
UPDATE profiles
SET email = auth_users.email
FROM auth.users auth_users
WHERE profiles.id = auth_users.id
AND profiles.email IS NULL;

-- Обновляем функцию создания профиля для включения email
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, nickname, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'nickname', NULL),
    NEW.email  -- ✅ Теперь сохраняем email!
  );

  INSERT INTO user_stats (id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Добавляем политику для обновления email (на случай изменения в auth)
CREATE POLICY "Пользователи могут обновлять email в профиле" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Функция для синхронизации email при его изменении в auth.users
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Обновляем email в профиле при его изменении в auth.users
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE profiles
    SET email = NEW.email, updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для синхронизации email
DROP TRIGGER IF EXISTS sync_profile_email_on_auth_update ON auth.users;
CREATE TRIGGER sync_profile_email_on_auth_update
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_email();