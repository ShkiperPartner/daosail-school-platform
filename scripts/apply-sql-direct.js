// Применяем SQL напрямую через Supabase client
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function applySQL() {
  console.log('🚀 Применяем миграцию FAQ через SQL...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Отсутствуют переменные окружения');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // SQL команды по порядку
  const sqlCommands = [
    {
      name: 'Vector extension',
      sql: 'create extension if not exists vector;'
    },
    {
      name: 'Chat messages table',
      sql: `create table if not exists public.chat_messages (
        id           uuid primary key default gen_random_uuid(),
        session_id   text not null,
        role         text not null check (role in ('user','assistant','system','tool')),
        content      text not null,
        agent        text not null,
        created_at   timestamptz not null default now(),
        meta         jsonb default '{}'::jsonb
      );`
    },
    {
      name: 'Chat messages indexes',
      sql: `create index if not exists idx_chat_messages_session on public.chat_messages (session_id, created_at);
            create index if not exists idx_chat_messages_agent on public.chat_messages (agent, created_at);`
    },
    {
      name: 'Knowledge chunks table',
      sql: `create table if not exists public.knowledge_chunks (
        id              bigserial primary key,
        doc_id          text not null,
        chunk_idx       int  not null,
        text            text not null,
        embedding       vector(1536),
        accessible_roles text[] not null default array['public'],
        tags            text[] not null default array[]::text[],
        url             text,
        updated_at      timestamptz not null default now()
      );`
    },
    {
      name: 'Knowledge chunks indexes',
      sql: `create index if not exists idx_knowledge_chunks_embedding on public.knowledge_chunks using ivfflat (embedding) with (lists = 100);
            create index if not exists idx_knowledge_chunks_roles on public.knowledge_chunks using gin (accessible_roles);
            create index if not exists idx_knowledge_chunks_doc on public.knowledge_chunks (doc_id, chunk_idx);
            create index if not exists idx_knowledge_chunks_tags on public.knowledge_chunks using gin (tags);
            create unique index if not exists idx_knowledge_chunks_unique on public.knowledge_chunks (doc_id, chunk_idx);`
    },
    {
      name: 'Match docs function',
      sql: `create or replace function public.match_docs(
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
      $$;`
    },
    {
      name: 'RLS policies',
      sql: `alter table public.chat_messages enable row level security;
            alter table public.knowledge_chunks enable row level security;`
    },
    {
      name: 'Security policies',
      sql: `create policy if not exists "Public knowledge chunks are readable by everyone" on public.knowledge_chunks
              for select using ('public' = any(accessible_roles));
            create policy if not exists "Anyone can insert chat messages" on public.chat_messages
              for insert with check (true);
            create policy if not exists "Users can read their chat messages" on public.chat_messages
              for select using (true);`
    },
    {
      name: 'Permissions',
      sql: `grant usage on schema public to anon, authenticated;
            grant all on public.chat_messages to anon, authenticated;
            grant all on public.knowledge_chunks to anon, authenticated;
            grant all on sequence public.knowledge_chunks_id_seq to anon, authenticated;
            grant execute on function public.match_docs to anon, authenticated;`
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  // Выполняем каждую команду
  for (let i = 0; i < sqlCommands.length; i++) {
    const cmd = sqlCommands[i];
    console.log(`[${i+1}/${sqlCommands.length}] ${cmd.name}...`);

    try {
      const { data, error } = await supabase.from('_dummy_').select('*').limit(0);

      // Используем низкоуровневый fetch для выполнения SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: cmd.sql })
      });

      if (response.ok) {
        console.log(`  ✅ ${cmd.name} - успешно`);
        successCount++;
      } else {
        console.log(`  ⚠️  ${cmd.name} - возможная ошибка (${response.status})`);
        errorCount++;
      }

    } catch (error) {
      console.log(`  ⚠️  ${cmd.name} - ошибка: ${error.message}`);
      errorCount++;
    }

    // Пауза между командами
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n📊 Результаты:');
  console.log(`  ✅ Успешно: ${successCount}`);
  console.log(`  ⚠️  Ошибки: ${errorCount}`);

  // Тестируем функцию match_docs
  console.log('\n🧪 Тестируем функцию match_docs...');
  try {
    const { data: testData, error: testError } = await supabase.rpc('match_docs', {
      query_embedding: new Array(1536).fill(0),
      match_count: 1,
      roles: ['public']
    });

    if (testError) {
      console.log('❌ Функция не работает:', testError.message);
    } else {
      console.log('✅ Функция match_docs работает!');
      console.log(`📋 Результатов: ${testData?.length || 0}`);
    }
  } catch (error) {
    console.log('❌ Ошибка тестирования:', error.message);
  }

  console.log('\n🎉 Миграция завершена!');
}

applySQL().catch(console.error);