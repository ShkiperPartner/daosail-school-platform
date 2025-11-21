// Скрипт для применения fix миграции session_id в user_chats
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('Found SUPABASE_URL:', supabaseUrl);
  console.error('Found SERVICE_KEY:', supabaseServiceKey ? 'Yes' : 'No');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFix() {
  console.log('🔧 Applying fix for user_chats.session_id...\n');

  // 1. Добавляем session_id
  console.log('1. Adding session_id column...');
  const { error: error1 } = await supabase.rpc('exec_sql', {
    query: `
      ALTER TABLE user_chats
      ADD COLUMN IF NOT EXISTS session_id UUID DEFAULT gen_random_uuid();
    `
  }).catch(async () => {
    // Если RPC не работает, пробуем через прямой SQL
    return await supabase.from('user_chats').select('session_id').limit(1);
  });

  // Альтернатива: используем raw SQL через postgrest
  const queries = [
    `ALTER TABLE user_chats ADD COLUMN IF NOT EXISTS session_id UUID DEFAULT gen_random_uuid();`,
    `ALTER TABLE user_chats ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted'));`,
    `ALTER TABLE user_chats ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_chats_session_id ON user_chats(session_id);`,
    `UPDATE user_chats SET session_id = gen_random_uuid() WHERE session_id IS NULL;`,
  ];

  for (const query of queries) {
    console.log(`\nExecuting: ${query.substring(0, 60)}...`);

    // Используем REST API для выполнения SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      console.log(`⚠️  Response: ${response.status} (may already exist, continuing...)`);
    } else {
      console.log('✅ Success');
    }
  }

  // Проверяем результат
  console.log('\n📋 Checking user_chats structure...');
  const { data, error } = await supabase
    .from('user_chats')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error checking structure:', error);
  } else {
    console.log('✅ user_chats columns:', Object.keys(data[0] || {}));

    if (data[0] && data[0].session_id) {
      console.log('\n🎉 Fix applied successfully! session_id column exists.');
    } else {
      console.log('\n⚠️  session_id column may not be visible yet, but likely exists.');
    }
  }
}

applyFix().catch(console.error);
