// Применение SQL миграции через Supabase Management API
const supabaseProjectRef = 'rmlgsnlgwmstajwdhygg';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbGdzbmxnd21zdGFqd2RoeWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU2Mjg4MiwiZXhwIjoyMDcwMTM4ODgyfQ.xomNoP1ue8HQvIDNojIVlmkRSVuXqMcSp7gQ-TME3mo';

const sql = `
-- Add session_id column
ALTER TABLE user_chats ADD COLUMN IF NOT EXISTS session_id UUID DEFAULT gen_random_uuid();

-- Add status column
ALTER TABLE user_chats ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted'));

-- Add updated_at column
ALTER TABLE user_chats ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_chats_session_id ON user_chats(session_id);

-- Fill session_id for existing records
UPDATE user_chats SET session_id = gen_random_uuid() WHERE session_id IS NULL;
`;

console.log('🚀 Applying migration via Supabase API...\n');

try {
  // Используем Supabase Database REST API
  const response = await fetch(`https://${supabaseProjectRef}.supabase.co/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });

  console.log('Response status:', response.status);

  if (response.ok) {
    const result = await response.json();
    console.log('✅ Migration applied successfully!');
    console.log('Result:', result);
  } else {
    const error = await response.text();
    console.log('❌ API response:', error);
    console.log('\n⚠️  Direct SQL execution not available via REST API.');
    console.log('📋 Please apply the migration manually in Supabase Dashboard:\n');
    console.log(sql);
    console.log('\n📍 URL: https://supabase.com/dashboard/project/rmlgsnlgwmstajwdhygg/sql/new');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n📋 Please apply this SQL manually in Supabase Dashboard:\n');
  console.log(sql);
  console.log('\n📍 URL: https://supabase.com/dashboard/project/rmlgsnlgwmstajwdhygg/sql/new');
}
