-- Простая миграция FAQ без лишних деталей
-- Выполнить поэтапно в Supabase SQL Editor

-- ШАГ 1: Включить расширение vector
create extension if not exists vector;

-- ШАГ 2: Таблица сообщений чата
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  role text not null,
  content text not null,
  agent text not null,
  created_at timestamptz default now(),
  meta jsonb default '{}'
);

-- ШАГ 3: Таблица фрагментов знаний
create table if not exists public.knowledge_chunks (
  id bigserial primary key,
  doc_id text not null,
  chunk_idx int not null,
  text text not null,
  embedding vector(1536),
  accessible_roles text[] default array['public'],
  tags text[] default array[],
  url text,
  updated_at timestamptz default now()
);

-- ШАГ 4: Функция поиска (САМОЕ ВАЖНОЕ!)
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

-- ШАГ 5: Права доступа
grant execute on function public.match_docs to anon, authenticated;
grant all on public.chat_messages to anon, authenticated;
grant all on public.knowledge_chunks to anon, authenticated;