// Применяем миграцию FAQ напрямую к удаленной БД
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  console.log('🚀 Применяем миграцию FAQ...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Отсутствуют переменные окружения');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Читаем файл миграции
    const migrationSQL = fs.readFileSync(
      'supabase/migrations/20250926000001_create_faq_tables.sql',
      'utf8'
    );

    console.log('📄 Читаем миграцию...');
    console.log('🔄 Применяем к базе данных...');

    // Применяем миграцию
    const { data, error } = await supabase.rpc('exec', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Ошибка миграции:', error);

      // Попробуем применить по частям
      console.log('\n🔄 Пробуем применить по частям...');

      // Основные SQL команды
      const commands = [
        'create extension if not exists vector;',

        `create table if not exists public.chat_messages (
          id           uuid primary key default gen_random_uuid(),
          session_id   text not null,
          role         text not null check (role in ('user','assistant','system','tool')),
          content      text not null,
          agent        text not null,
          created_at   timestamptz not null default now(),
          meta         jsonb default '{}'::jsonb
        );`,

        `create table if not exists public.knowledge_chunks (
          id              bigserial primary key,
          doc_id          text not null,
          chunk_idx       int  not null,
          text            text not null,
          embedding       vector(1536),
          accessible_roles text[] not null default array['public'],
          tags            text[] not null default array[]::text[],
          url             text,
          updated_at      timestamptz not null default now()
        );`,

        `create or replace function public.match_docs(
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
      ];

      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        console.log(`  [${i+1}/${commands.length}] Выполняем команду...`);

        const { error: cmdError } = await supabase.rpc('sql', { query: cmd });
        if (cmdError) {
          console.error(`    ❌ Ошибка: ${cmdError.message}`);
        } else {
          console.log(`    ✅ Успешно`);
        }
      }

    } else {
      console.log('✅ Миграция применена успешно!');
    }

    // Проверяем что функция создалась
    console.log('\n🔍 Проверяем функцию match_docs...');
    const { data: testData, error: testError } = await supabase.rpc('match_docs', {
      query_embedding: new Array(1536).fill(0),
      match_count: 1,
      roles: ['public']
    });

    if (testError) {
      console.error('❌ Функция не работает:', testError.message);
    } else {
      console.log('✅ Функция match_docs работает!');
      console.log(`📊 Возвращено результатов: ${testData?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  }
}

applyMigration();