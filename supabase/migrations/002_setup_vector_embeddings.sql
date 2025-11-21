-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing knowledge base documents
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- 'github', 'manual', 'website', etc.
  source_url TEXT,
  file_path TEXT,
  language VARCHAR(10) DEFAULT 'ru',
  category VARCHAR(100), -- 'sailing_basics', 'navigation', 'safety', etc.
  embedding vector(1536), -- OpenAI text-embedding-ada-002 dimension
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_embedding
ON knowledge_documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_category
ON knowledge_documents(category);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_language
ON knowledge_documents(language);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_source_type
ON knowledge_documents(source_type);

-- Function to search similar documents
CREATE OR REPLACE FUNCTION search_knowledge_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 5,
  filter_category text DEFAULT NULL,
  filter_language text DEFAULT 'ru'
)
RETURNS TABLE (
  id uuid,
  title varchar(500),
  content text,
  source_type varchar(50),
  source_url text,
  category varchar(100),
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
    1 - (kd.embedding <=> query_embedding) AS similarity
  FROM knowledge_documents kd
  WHERE
    (filter_language IS NULL OR kd.language = filter_language)
    AND (filter_category IS NULL OR kd.category = filter_category)
    AND 1 - (kd.embedding <=> query_embedding) > match_threshold
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Enable RLS
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read knowledge documents (public knowledge base)
CREATE POLICY "Anyone can view knowledge documents" ON knowledge_documents
    FOR SELECT USING (true);

-- Policy: Only authenticated users can insert/update knowledge documents
CREATE POLICY "Authenticated users can manage knowledge documents" ON knowledge_documents
    FOR ALL USING (auth.role() = 'authenticated');

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_knowledge_documents_updated_at
    BEFORE UPDATE ON knowledge_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample knowledge base entries
INSERT INTO knowledge_documents (title, content, source_type, category, language) VALUES
(
  'Основы парусного спорта',
  'Парусный спорт — это вид спорта и активного отдыха, при котором используется энергия ветра для движения по воде. Основные элементы: яхта с парусами, управление ветром, навигация. Для начинающих важно изучить основы безопасности на воде, понимание ветра и базовые навыки управления яхтой.',
  'manual',
  'sailing_basics',
  'ru'
),
(
  'Навигация и GPS',
  'Современная морская навигация включает использование GPS, морских карт, компаса и радара. Важные принципы: определение местоположения, прокладка курса, учет течений и ветра, использование навигационных знаков. GPS обеспечивает точное позиционирование, но всегда нужно иметь резервные способы навигации.',
  'manual',
  'navigation',
  'ru'
),
(
  'Безопасность на воде',
  'Безопасность — приоритет номер один в парусном спорте. Обязательные требования: спасательные жилеты для всего экипажа, средства связи (радиостанция), сигнальные средства, аптечка первой помощи. Важно знать процедуры человек за бортом, действия при шторме, правила расхождения судов.',
  'manual',
  'safety',
  'ru'
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON knowledge_documents TO authenticated;
GRANT SELECT ON knowledge_documents TO anon;
GRANT EXECUTE ON FUNCTION search_knowledge_documents TO anon, authenticated;