-- =====================================================
-- FAQ AGENT MIGRATION - COPY AND PASTE TO SUPABASE SQL EDITOR
-- =====================================================

-- 1. Enable vector extension
create extension if not exists vector;

-- 2. Create chat_messages table
create table if not exists public.chat_messages (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null,
  role         text not null check (role in ('user','assistant','system','tool')),
  content      text not null,
  agent        text not null,
  created_at   timestamptz not null default now(),
  meta         jsonb default '{}'::jsonb
);

-- 3. Create indexes for chat_messages
create index if not exists idx_chat_messages_session on public.chat_messages (session_id, created_at);
create index if not exists idx_chat_messages_agent on public.chat_messages (agent, created_at);

-- 4. Create knowledge_chunks table
create table if not exists public.knowledge_chunks (
  id              bigserial primary key,
  doc_id          text not null,
  chunk_idx       int  not null,
  text            text not null,
  embedding       vector(1536),
  accessible_roles text[] not null default array['public'],
  tags            text[] not null default array[]::text[],
  url             text,
  updated_at      timestamptz not null default now()
);

-- 5. Create indexes for knowledge_chunks
create index if not exists idx_knowledge_chunks_embedding on public.knowledge_chunks using ivfflat (embedding) with (lists = 100);
create index if not exists idx_knowledge_chunks_roles on public.knowledge_chunks using gin (accessible_roles);
create index if not exists idx_knowledge_chunks_doc on public.knowledge_chunks (doc_id, chunk_idx);
create index if not exists idx_knowledge_chunks_tags on public.knowledge_chunks using gin (tags);
create unique index if not exists idx_knowledge_chunks_unique on public.knowledge_chunks (doc_id, chunk_idx);

-- 6. Create match_docs function
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

-- 7. Enable RLS
alter table public.chat_messages enable row level security;
alter table public.knowledge_chunks enable row level security;

-- 8. Create security policies
drop policy if exists "Public knowledge chunks are readable by everyone" on public.knowledge_chunks;
create policy "Public knowledge chunks are readable by everyone"
  on public.knowledge_chunks for select
  using ('public' = any(accessible_roles));

drop policy if exists "Anyone can insert chat messages" on public.chat_messages;
create policy "Anyone can insert chat messages"
  on public.chat_messages for insert
  with check (true);

drop policy if exists "Users can read their chat messages" on public.chat_messages;
create policy "Users can read their chat messages"
  on public.chat_messages for select
  using (true);

-- 9. Grant permissions
grant usage on schema public to anon, authenticated;
grant all on public.chat_messages to anon, authenticated;
grant all on public.knowledge_chunks to anon, authenticated;
grant all on sequence public.knowledge_chunks_id_seq to anon, authenticated;
grant execute on function public.match_docs to anon, authenticated;

-- =====================================================
-- MIGRATION COMPLETE!
-- Now you can test with: SELECT public.match_docs(ARRAY[0,0,0...], 1, ARRAY['public']);
-- =====================================================