// Простой скрипт для применения fix миграции
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rmlgsnlgwmstajwdhygg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbGdzbmxnd21zdGFqd2RoeWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU2Mjg4MiwiZXhwIjoyMDcwMTM4ODgyfQ.xomNoP1ue8HQvIDNojIVlmkRSVuXqMcSp7gQ-TME3mo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 Applying fix for user_chats.session_id...\n');

// Проверяем текущую структуру
console.log('1. Checking current structure...');
const { data: testData, error: testError } = await supabase
  .from('user_chats')
  .select('*')
  .limit(1);

if (testError) {
  console.error('❌ Error:', testError);
  process.exit(1);
}

console.log('Current columns:', Object.keys(testData[0] || {}));

if (testData[0] && testData[0].session_id) {
  console.log('\n✅ session_id already exists! No fix needed.');
  process.exit(0);
}

console.log('\n⚠️  session_id column is missing. Need to apply migration manually.');
console.log('\n📋 Copy and run this SQL in Supabase Dashboard > SQL Editor:\n');

const sqlFix = `
-- Add session_id column
ALTER TABLE user_chats
ADD COLUMN IF NOT EXISTS session_id UUID DEFAULT gen_random_uuid();

-- Add status column
ALTER TABLE user_chats
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
CHECK (status IN ('active', 'archived', 'deleted'));

-- Add updated_at column
ALTER TABLE user_chats
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_chats_session_id ON user_chats(session_id);

-- Fill session_id for existing records
UPDATE user_chats SET session_id = gen_random_uuid() WHERE session_id IS NULL;
`;

console.log(sqlFix);
console.log('\n📍 URL: https://supabase.com/dashboard/project/rmlgsnlgwmstajwdhygg/sql/new');
