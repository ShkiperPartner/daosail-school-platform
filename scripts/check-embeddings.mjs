// Проверка наличия embeddings в chunks
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rmlgsnlgwmstajwdhygg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbGdzbmxnd21zdGFqd2RoeWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU2Mjg4MiwiZXhwIjoyMDcwMTM4ODgyfQ.xomNoP1ue8HQvIDNojIVlmkRSVuXqMcSp7gQ-TME3mo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Checking embeddings in chunks table...\n');

// 1. Проверяем есть ли embedding колонка
const { data: sample, error } = await supabase
  .from('chunks')
  .select('id, source, path, embedding')
  .limit(5);

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log(`Found ${sample.length} chunks:\n`);

sample.forEach((chunk, idx) => {
  const hasEmbedding = chunk.embedding !== null && chunk.embedding !== undefined;
  const embeddingInfo = hasEmbedding
    ? `✅ EXISTS (length: ${Array.isArray(chunk.embedding) ? chunk.embedding.length : 'unknown'})`
    : '❌ NULL or missing';

  console.log(`[${idx + 1}] ${chunk.path}`);
  console.log(`    Embedding: ${embeddingInfo}`);
  console.log('');
});

// 2. Подсчитаем сколько чанков с embeddings и без
const { data: allChunks } = await supabase
  .from('chunks')
  .select('id, embedding');

const withEmbeddings = allChunks.filter(c => c.embedding !== null).length;
const withoutEmbeddings = allChunks.length - withEmbeddings;

console.log('📊 Statistics:');
console.log(`   Total chunks: ${allChunks.length}`);
console.log(`   With embeddings: ${withEmbeddings} ✅`);
console.log(`   Without embeddings: ${withoutEmbeddings} ❌`);

if (withoutEmbeddings > 0) {
  console.log('\n⚠️  WARNING: Some chunks missing embeddings!');
  console.log('   You need to run embedding generation script.');
}
