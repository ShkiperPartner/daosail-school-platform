-- Migration: Create FAQ agent tables
-- Created: 2025-09-26
-- Description: Chat messages and knowledge chunks for FAQ agent MVP

-- Enable required extensions
create extension if not exists vector;

-- Table: chat_messages (FAQ agent chat history)
create table if not exists public.chat_messages (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null,                 -- группировка диалога
  role         text not null check (role in ('user','assistant','system','tool')),
  content      text not null,
  agent        text not null,                 -- faq, meta, trainer, dao, tool-name
  created_at   timestamptz not null default now(),
  meta         jsonb default '{}'::jsonb      -- дополнительные данные (citations, etc)
);

-- Index for efficient chat history queries
create index if not exists idx_chat_messages_session on public.chat_messages (session_id, created_at);
create index if not exists idx_chat_messages_agent on public.chat_messages (agent, created_at);

-- Table: knowledge_chunks (FAQ knowledge base with embeddings)
create table if not exists public.knowledge_chunks (
  id              bigserial primary key,
  doc_id          text not null,       -- путь/имя исходника (faq.md, concepts.md, etc)
  chunk_idx       int  not null,       -- порядковый номер чанка в документе
  text            text not null,       -- текст чанка
  embedding       vector(1536),        -- OpenAI embeddings (ada-002)
  accessible_roles text[] not null default array['public'],  -- роли доступа
  tags            text[] not null default array[]::text[],   -- теги для фильтрации
  url             text,                -- ссылка на первоисточник
  updated_at      timestamptz not null default now()
);

-- Indexes for efficient vector search
create index if not exists idx_knowledge_chunks_embedding on public.knowledge_chunks using ivfflat (embedding) with (lists = 100);
create index if not exists idx_knowledge_chunks_roles on public.knowledge_chunks using gin (accessible_roles);
create index if not exists idx_knowledge_chunks_doc on public.knowledge_chunks (doc_id, chunk_idx);
create index if not exists idx_knowledge_chunks_tags on public.knowledge_chunks using gin (tags);

-- Unique constraint to prevent duplicate chunks
create unique index if not exists idx_knowledge_chunks_unique on public.knowledge_chunks (doc_id, chunk_idx);

-- RPC: match_docs (semantic search with role-based access)
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

-- Row Level Security (RLS) policies
alter table public.chat_messages enable row level security;
alter table public.knowledge_chunks enable row level security;

-- Policy: Anyone can read public knowledge chunks
create policy "Public knowledge chunks are readable by everyone" on public.knowledge_chunks
  for select using ('public' = any(accessible_roles));

-- Policy: Anyone can insert chat messages (will be restricted later)
create policy "Anyone can insert chat messages" on public.chat_messages
  for insert with check (true);

-- Policy: Users can read their own chat history
create policy "Users can read their chat messages" on public.chat_messages
  for select using (true); -- Temporary: allow all reads

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public.chat_messages to anon, authenticated;
grant all on public.knowledge_chunks to anon, authenticated;
grant all on sequence public.knowledge_chunks_id_seq to anon, authenticated;
grant execute on function public.match_docs to anon, authenticated;