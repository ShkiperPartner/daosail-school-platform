-- Создание системы загрузки файлов для чатов
-- Phase 7.1: Chat Enhancements - File Upload System

-- Создаем bucket для файлов чатов (если не существует)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  false,
  20971520, -- 20MB limit
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'text/javascript',
    'application/javascript',
    'text/x-python',
    'application/sql',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Таблица для метаданных загруженных файлов
CREATE TABLE IF NOT EXISTS chat_file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_session_id UUID REFERENCES user_chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL, -- путь в Supabase Storage
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('document', 'image', 'code', 'spreadsheet', 'text')),
  extracted_text TEXT, -- извлеченный текст для документов
  analysis_result JSONB, -- результат анализа ИИ (для изображений)
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS политики для chat_file_uploads
ALTER TABLE chat_file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пользователи могут видеть свои файлы" ON chat_file_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут загружать свои файлы" ON chat_file_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять свои файлы" ON chat_file_uploads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять свои файлы" ON chat_file_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- Storage политики для chat-files bucket
CREATE POLICY "Пользователи могут загружать свои файлы в chat-files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Пользователи могут просматривать свои файлы в chat-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Пользователи могут обновлять свои файлы в chat-files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Пользователи могут удалять свои файлы в chat-files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Триггер для обновления updated_at
CREATE TRIGGER update_chat_file_uploads_updated_at
  BEFORE UPDATE ON chat_file_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_chat_file_uploads_session_id ON chat_file_uploads(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_chat_file_uploads_user_id ON chat_file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_file_uploads_file_type ON chat_file_uploads(file_type);
CREATE INDEX IF NOT EXISTS idx_chat_file_uploads_processing_status ON chat_file_uploads(processing_status);
CREATE INDEX IF NOT EXISTS idx_chat_file_uploads_created_at ON chat_file_uploads(created_at DESC);

-- Функция для получения файлов чата
CREATE OR REPLACE FUNCTION get_chat_files(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  original_filename TEXT,
  file_path TEXT,
  file_size INTEGER,
  mime_type TEXT,
  file_type TEXT,
  extracted_text TEXT,
  analysis_result JSONB,
  processing_status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Проверяем доступ к чату
  IF NOT EXISTS (
    SELECT 1 FROM user_chats uc
    WHERE uc.session_id = p_session_id AND uc.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied to chat session';
  END IF;

  RETURN QUERY
  SELECT
    cfu.id,
    cfu.original_filename,
    cfu.file_path,
    cfu.file_size,
    cfu.mime_type,
    cfu.file_type,
    cfu.extracted_text,
    cfu.analysis_result,
    cfu.processing_status,
    cfu.created_at
  FROM chat_file_uploads cfu
  JOIN user_chats uc ON uc.id = cfu.chat_session_id
  WHERE uc.session_id = p_session_id
    AND cfu.user_id = p_user_id
  ORDER BY cfu.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для создания записи о загруженном файле
CREATE OR REPLACE FUNCTION create_file_upload_record(
  p_session_id UUID,
  p_user_id UUID,
  p_original_filename TEXT,
  p_file_path TEXT,
  p_file_size INTEGER,
  p_mime_type TEXT,
  p_file_type TEXT
)
RETURNS UUID AS $$
DECLARE
  chat_id UUID;
  file_id UUID;
BEGIN
  -- Получаем ID чата
  SELECT id INTO chat_id
  FROM user_chats
  WHERE session_id = p_session_id AND user_id = p_user_id;

  IF chat_id IS NULL THEN
    RAISE EXCEPTION 'Chat session not found or access denied';
  END IF;

  -- Создаем запись о файле
  INSERT INTO chat_file_uploads (
    chat_session_id,
    user_id,
    original_filename,
    file_path,
    file_size,
    mime_type,
    file_type
  )
  VALUES (
    chat_id,
    p_user_id,
    p_original_filename,
    p_file_path,
    p_file_size,
    p_mime_type,
    p_file_type
  )
  RETURNING id INTO file_id;

  RETURN file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для обновления результатов обработки файла
CREATE OR REPLACE FUNCTION update_file_processing_result(
  p_file_id UUID,
  p_user_id UUID,
  p_extracted_text TEXT DEFAULT NULL,
  p_analysis_result JSONB DEFAULT NULL,
  p_processing_status TEXT DEFAULT 'completed',
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Проверяем права доступа и обновляем
  UPDATE chat_file_uploads
  SET
    extracted_text = COALESCE(p_extracted_text, extracted_text),
    analysis_result = COALESCE(p_analysis_result, analysis_result),
    processing_status = p_processing_status,
    error_message = p_error_message,
    updated_at = NOW()
  WHERE id = p_file_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'File not found or access denied';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения статистики загруженных файлов пользователя
CREATE OR REPLACE FUNCTION get_user_file_stats(p_user_id UUID)
RETURNS TABLE (
  total_files INTEGER,
  total_size_bytes BIGINT,
  files_by_type JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_files,
    SUM(file_size)::BIGINT as total_size_bytes,
    jsonb_object_agg(file_type, type_count) as files_by_type
  FROM (
    SELECT
      file_type,
      COUNT(*) as type_count,
      file_size
    FROM chat_file_uploads
    WHERE user_id = p_user_id
      AND processing_status != 'failed'
    GROUP BY file_type, file_size
  ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для очистки старых неудачных загрузок (можно вызывать периодически)
CREATE OR REPLACE FUNCTION cleanup_failed_uploads()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM chat_file_uploads
  WHERE processing_status = 'failed'
    AND created_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;