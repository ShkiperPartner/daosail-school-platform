-- Migration: Add role-based access and tags to existing chunks table
-- Created: 2025-09-28
-- Description: Unify chunks table with knowledge_chunks functionality for FAQ agent

-- Add new columns to existing chunks table
ALTER TABLE public.chunks
ADD COLUMN IF NOT EXISTS accessible_roles text[] NOT NULL DEFAULT array['public']::text[],
ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT array[]::text[];

-- Create indexes for efficient role-based and tag-based queries
CREATE INDEX IF NOT EXISTS idx_chunks_accessible_roles
ON public.chunks USING gin (accessible_roles);

CREATE INDEX IF NOT EXISTS idx_chunks_tags
ON public.chunks USING gin (tags);

-- Update existing rows to have default role access
UPDATE public.chunks
SET accessible_roles = array['public']::text[]
WHERE accessible_roles IS NULL OR array_length(accessible_roles, 1) IS NULL;

-- Drop the old function first (it had different parameters)
DROP FUNCTION IF EXISTS public.match_chunks_docs(vector, int, float);

-- Create new function with role-based access
CREATE OR REPLACE FUNCTION public.match_chunks_docs(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  roles text[] DEFAULT array['public']::text[],
  min_similarity float DEFAULT 0.75
) RETURNS TABLE (
  id bigint,
  source text,
  path text,
  content text,
  metadata jsonb,
  similarity float
) LANGUAGE sql STABLE AS $$
  SELECT
    chunks.id,
    chunks.source,
    chunks.path,
    chunks.content,
    chunks.metadata,
    1 - (chunks.embedding <=> query_embedding) AS similarity
  FROM public.chunks
  WHERE chunks.accessible_roles && roles
    AND (1 - (chunks.embedding <=> query_embedding)) >= min_similarity
  ORDER BY chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Enable RLS for chunks table if not already enabled
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read public chunks
DROP POLICY IF EXISTS "Public chunks are readable by everyone" ON public.chunks;
CREATE POLICY "Public chunks are readable by everyone" ON public.chunks
  FOR SELECT USING ('public' = ANY(accessible_roles));

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.match_chunks_docs TO anon, authenticated;

-- Add helpful comments
COMMENT ON COLUMN public.chunks.accessible_roles IS 'Array of roles that can access this chunk: public, guest, member, partner, admin';
COMMENT ON COLUMN public.chunks.tags IS 'Tags for filtering chunks by topic or category';
COMMENT ON FUNCTION public.match_chunks_docs IS 'Semantic search in chunks table with role-based access control';