// Тестирование RAG поиска для Steward ассистента
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
  console.error('❌ Missing environment variables. Please set:');
  console.error('   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('   - OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

// Функция для генерации embedding
async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}

// Тестовые вопросы
const testQuestions = [
  'Что такое DAOsail?',
  'Какая философия проекта?',
  'Какие роли существуют в DAOsail?',
  'Как работает экономическая модель?'
];

console.log('🧪 Testing Steward RAG Search\n');
console.log('=' .repeat(60));

for (const question of testQuestions) {
  console.log(`\n\n❓ Question: "${question}"`);
  console.log('-'.repeat(60));

  try {
    // 1. Генерируем embedding
    console.log('🔄 Generating embedding...');
    const embedding = await getEmbedding(question);
    console.log(`✅ Embedding generated (dimension: ${embedding.length})`);

    // 2. Ищем в базе знаний
    console.log('🔍 Searching knowledge base...');
    const { data: matches, error } = await supabase.rpc('match_chunks_docs', {
      query_embedding: embedding,
      match_count: 5,
      roles: ['public'],
      min_similarity: 0.7
    });

    if (error) {
      console.error('❌ Search error:', error);
      continue;
    }

    console.log(`✅ Found ${matches.length} matches`);

    // 3. Показываем результаты
    if (matches.length > 0) {
      matches.forEach((match, idx) => {
        console.log(`\n  [${idx + 1}] Similarity: ${(match.similarity * 100).toFixed(1)}%`);
        console.log(`      Path: ${match.path}`);
        console.log(`      Roles: ${match.accessible_roles?.join(', ')}`);
        console.log(`      Content: ${match.content.substring(0, 150)}...`);
      });
    } else {
      console.log('  ⚠️ No matches found (similarity threshold: 0.7)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

console.log('\n\n' + '='.repeat(60));
console.log('✅ Test complete!');
