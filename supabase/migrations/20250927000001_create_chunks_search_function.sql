-- Migration: Create search function for existing chunks table
-- Created: 2025-09-27
-- Description: RPC function to search in existing chunks table with embeddings

-- RPC: match_chunks_docs (semantic search in existing chunks table)
create or replace function public.match_chunks_docs(
  query_embedding vector(1536),
  match_count int default 8,
  min_similarity float default 0.75
) returns table (
  id bigint,
  source text,
  path text,
  content text,
  metadata jsonb,
  similarity float
) language sql stable as $$
  select
    chunks.id,
    chunks.source,
    chunks.path,
    chunks.content,
    chunks.metadata,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from public.chunks
  where (1 - (chunks.embedding <=> query_embedding)) >= min_similarity
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- Grant permissions
grant execute on function public.match_chunks_docs to anon, authenticated;