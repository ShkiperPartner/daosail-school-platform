-- Migration: Role-based search function for knowledge documents
-- Date: 2025-09-16
-- Phase: 4.2 - Role-based Chat Architecture

BEGIN;

-- Create role-based search function for knowledge documents
CREATE OR REPLACE FUNCTION search_knowledge_documents_by_role(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 5,
  filter_category text DEFAULT NULL,
  filter_language text DEFAULT 'ru',
  accessible_roles text[] DEFAULT ARRAY['public']
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  source_type text,
  source_url text,
  category text,
  language text,
  access_roles text[],
  target_audience text,
  knowledge_level text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kd.id,
    kd.title,
    kd.content,
    kd.source_type,
    kd.source_url,
    kd.category,
    kd.language,
    kd.access_roles,
    kd.target_audience,
    kd.knowledge_level,
    1 - (kd.embedding <=> query_embedding) as similarity
  FROM knowledge_documents kd
  WHERE
    1 - (kd.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR kd.category = filter_category)
    AND kd.language = filter_language
    AND kd.access_roles && accessible_roles  -- Array overlap operator
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_knowledge_documents_by_role TO authenticated;
GRANT EXECUTE ON FUNCTION search_knowledge_documents_by_role TO anon;

-- Add comment
COMMENT ON FUNCTION search_knowledge_documents_by_role IS 'Search knowledge documents with role-based access filtering using vector similarity';

-- Create function to increment chat statistics
CREATE OR REPLACE FUNCTION increment_chat_stats(
  chat_id uuid,
  tokens_increment int DEFAULT 0,
  chunks_increment int DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE user_chats
  SET
    messages_count = messages_count + 1,
    tokens_used = tokens_used + tokens_increment,
    knowledge_chunks_used = knowledge_chunks_used + chunks_increment,
    last_activity = NOW()
  WHERE id = chat_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_chat_stats TO authenticated;
GRANT EXECUTE ON FUNCTION increment_chat_stats TO anon;

-- Add comment
COMMENT ON FUNCTION increment_chat_stats IS 'Increment chat statistics (messages, tokens, knowledge chunks)';

COMMIT;