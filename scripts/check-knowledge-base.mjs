// Проверка базы знаний и RAG функций
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rmlgsnlgwmstajwdhygg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbGdzbmxnd21zdGFqd2RoeWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU2Mjg4MiwiZXhwIjoyMDcwMTM4ODgyfQ.xomNoP1ue8HQvIDNojIVlmkRSVuXqMcSp7gQ-TME3mo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Checking knowledge base...\n');

// 1. Проверяем таблицу chunks
console.log('1️⃣ Checking chunks table...');
const { data: chunksData, error: chunksError } = await supabase
  .from('chunks')
  .select('id, source, path, content, accessible_roles, tags')
  .limit(5);

if (chunksError) {
  console.error('❌ Error reading chunks:', chunksError);
} else {
  console.log(`✅ Found ${chunksData.length} chunks (showing first 5)`);
  chunksData.forEach((chunk, idx) => {
    console.log(`\n  [${idx + 1}] Source: ${chunk.source}`);
    console.log(`      Path: ${chunk.path}`);
    console.log(`      Roles: ${chunk.accessible_roles?.join(', ') || 'none'}`);
    console.log(`      Content preview: ${chunk.content?.substring(0, 100)}...`);
  });
}

// 2. Подсчет общего количества
console.log('\n2️⃣ Total chunks count...');
const { count, error: countError } = await supabase
  .from('chunks')
  .select('*', { count: 'exact', head: true });

if (countError) {
  console.error('❌ Error counting:', countError);
} else {
  console.log(`✅ Total chunks in database: ${count}`);
}

// 3. Проверяем функцию match_chunks_docs существует ли
console.log('\n3️⃣ Checking match_chunks_docs function...');

try {
  // Создаем тестовый embedding (1536 размерность, заполненный нулями для теста)
  const testEmbedding = new Array(1536).fill(0);
  testEmbedding[0] = 1; // Чуть-чуть данных

  const { data: rpcData, error: rpcError } = await supabase.rpc('match_chunks_docs', {
    query_embedding: testEmbedding,
    match_count: 3,
    roles: ['public'],
    min_similarity: 0.1
  });

  if (rpcError) {
    console.error('❌ RPC Error:', rpcError);
    console.log('\n⚠️  Function match_chunks_docs may not exist!');
  } else {
    console.log(`✅ Function exists and returned ${rpcData?.length || 0} results`);
    if (rpcData && rpcData.length > 0) {
      console.log('Sample result:', {
        path: rpcData[0].path,
        similarity: rpcData[0].similarity,
        content_preview: rpcData[0].content?.substring(0, 50)
      });
    }
  }
} catch (error) {
  console.error('❌ Exception:', error.message);
}

// 4. Проверяем альтернативные функции
console.log('\n4️⃣ Checking alternative search functions...');
const { data: functions } = await supabase.rpc('pg_get_functiondef', {
  funcid: 'match_chunks_docs'
}).catch(() => null);

// Попробуем просто получить список функций через информационную схему
console.log('\n📋 Available RPC functions starting with "match":');
const { data: allFuncs, error: funcError } = await supabase
  .rpc('pg_catalog.pg_get_function_identity_arguments')
  .catch(() => ({ data: null, error: 'Cannot list functions' }));

console.log('\n✅ Diagnosis complete!');
