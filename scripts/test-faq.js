// Простой тест FAQ агента локально
// Запуск: node scripts/test-faq.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Конфигурация
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Отсутствуют необходимые переменные окружения');
  console.log('Проверьте .env.local:');
  console.log('- SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  console.log('- OPENAI_API_KEY');
  process.exit(1);
}

// Получение эмбеддингов
async function getEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-ada-002',
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// FAQ ответ
async function getFAQResponse(userQuestion, context) {
  const systemPrompt = `Ты FAQ ассистент DAOsail — строгий и точный помощник по базе знаний проекта.

🎯 ГЛАВНОЕ ПРАВИЛО: Отвечаешь ТОЛЬКО по предоставленному контексту. Никаких выдумок!

📋 ИНСТРУКЦИИ:
• Если есть информация в контексте → отвечай четко и кратко
• Если информации НЕТ → скажи "В базе знаний нет информации по этому вопросу"
• Никогда не добавляй информацию "от себя" или из общих знаний
• Ссылайся на номера источников в ответе [1], [2] если нужно
• Тон: деловой, но дружелюбный
• Длина: 1-3 предложения, максимум 150 слов

Предоставленный контекст:
${context}

Вопрос пользователя: ${userQuestion}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userQuestion }
      ],
      max_tokens: 300,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Основная функция теста
async function testFAQ() {
  console.log('🚀 Тестируем FAQ агента...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Тестовые вопросы
  const testQuestions = [
    'Что такое DAOsail?',
    'Как работает DAO в проекте?',
    'Какие роли есть в сообществе?',
    'Сколько стоит биткоин?', // Вопрос вне базы знаний
  ];

  for (let i = 0; i < testQuestions.length; i++) {
    const question = testQuestions[i];
    console.log(`\n📝 Вопрос ${i + 1}: "${question}"`);
    console.log('─'.repeat(50));

    try {
      // 1. Получаем эмбеддинг вопроса
      console.log('🔍 Получаем эмбеддинг...');
      const queryEmbedding = await getEmbedding(question);

      // 2. Ищем в базе знаний
      console.log('📚 Ищем в базе знаний...');
      const { data: matches, error } = await supabase.rpc('match_docs', {
        query_embedding: queryEmbedding,
        match_count: 3,
        roles: ['public'],
        min_similarity: 0.7
      });

      if (error) {
        console.error('❌ Ошибка поиска:', error);
        continue;
      }

      console.log(`✅ Найдено ${matches?.length || 0} релевантных фрагментов`);

      // 3. Формируем контекст
      let context = '';
      if (matches && matches.length > 0) {
        context = matches
          .map((match, idx) =>
            `[${idx + 1}] ${match.text}\n(Источник: ${match.doc_id}, релевантность: ${Math.round(match.similarity * 100)}%)`
          )
          .join('\n\n');

        console.log('\n📖 Контекст для агента:');
        matches.forEach((match, idx) => {
          console.log(`  [${idx + 1}] ${match.doc_id} (${Math.round(match.similarity * 100)}%)`);
        });
      } else {
        console.log('⚠️  Релевантный контекст не найден');
      }

      // 4. Получаем ответ от FAQ агента
      console.log('\n🤖 Получаем ответ от FAQ агента...');
      const answer = await getFAQResponse(question, context);

      console.log('\n✨ Ответ агента:');
      console.log(`"${answer}"`);

      // Задержка между запросами
      if (i < testQuestions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error('❌ Ошибка:', error.message);
    }
  }

  console.log('\n🎉 Тестирование завершено!');
}

// Запуск
testFAQ().catch(console.error);