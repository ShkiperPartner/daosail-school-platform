-- Исправляем существующие таблицы и добавляем недостающие колонки

-- 1. Включаем vector extension
create extension if not exists vector;

-- 2. Добавляем недостающие колонки в chat_messages (если таблица уже существует)
alter table public.chat_messages
add column if not exists session_id text,
add column if not exists agent text,
add column if not exists meta jsonb default '{}';

-- 3. Создаем таблицу knowledge_chunks
create table if not exists public.knowledge_chunks (
  id bigserial primary key,
  doc_id text not null,
  chunk_idx int not null,
  text text not null,
  embedding vector(1536),
  accessible_roles text[] default array['public'],
  tags text[] default array[]::text[],
  url text,
  updated_at timestamptz default now()
);

-- 4. ГЛАВНОЕ: Удаляем старую и создаем новую функцию match_docs
drop function if exists public.match_docs;
create or replace function public.match_docs(
  query_embedding vector(1536),
  match_count int default 8,
  roles text[] default array['public'],
  min_similarity float default 0.75
) returns table (
  id bigint,
  doc_id text,
  chunk_idx int,
  text text,
  url text,
  similarity float
) language sql stable as $$
  select
    kc.id,
    kc.doc_id,
    kc.chunk_idx,
    kc.text,
    kc.url,
    1 - (kc.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks kc
  where kc.accessible_roles && roles
    and (1 - (kc.embedding <=> query_embedding)) >= min_similarity
  order by kc.embedding <=> query_embedding
  limit match_count;
$$;

-- 5. Даем права доступа
grant execute on function public.match_docs to anon, authenticated;
grant all on public.chat_messages to anon, authenticated;
grant all on public.knowledge_chunks to anon, authenticated;
grant all on sequence public.knowledge_chunks_id_seq to anon, authenticated;