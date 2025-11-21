#!/usr/bin/env node
/**
 * Steward Knowledge Base Rebuild Script
 *
 * Загружает публичную базу знаний для Steward ассистента:
 * - charter/ - Устав, философия, роли
 * - faq/ - Часто задаваемые вопросы
 * - yachting/ - Базовая информация о яхтинге
 *
 * Использует chunks таблицу с векторным поиском
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== CONFIGURATION ==========

const CONFIG = {
  chunkSize: 600,        // tokens (примерно 600 слов)
  chunkOverlap: 100,     // overlap для контекста
  batchSize: 50,         // chunks per batch insert
  rateLimit: 100,        // ms between OpenAI API calls
};

// Источники знаний для Steward (ТОЛЬКО публичная информация)
const STEWARD_SOURCES = [
  // Устав и философия
  'charter/philosophy.md',
  'charter/mission.md',
  'charter/roles.md',
  'charter/README.md',

  // FAQ для новичков
  'faq/general.md',
  'faq/club.md',
  'faq/membership.md',
  'faq/yachting.md',
  'faq/dao.md',
  'faq/ai.md',
  'faq/README.md',

  // Базовая информация о яхтинге
  'yachting/README.md',
  'yachting/training.md',

  // Decentralization основы
  'decentralization/dao.md',
];

// Роли доступа для Steward (публичные уровни)
const STEWARD_ROLES = ['guest', 'public', 'passenger'];

// ========== UTILITIES ==========

function loadEnv() {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY'];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`❌ Missing environment variable: ${key}`);
    }
  }

  return {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    openaiKey: process.env.OPENAI_API_KEY,
  };
}

// Чанкование текста с overlap
function chunkText(text, chunkSize, overlap) {
  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
  }

  return chunks;
}

// Генерация embedding через OpenAI
async function getEmbedding(text, openai) {
  try {
    const response = await openai.embeddings.create({
      input: text,
      model: 'text-embedding-ada-002',
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ OpenAI API error:', error.message);
    throw error;
  }
}

// Очистка markdown форматирования
function cleanMarkdown(content) {
  return content
    .replace(/^---[\s\S]*?---/, '')     // Remove frontmatter
    .replace(/#{1,6}\s/g, '')           // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1')    // Remove bold
    .replace(/\*(.*?)\*/g, '$1')        // Remove italic
    .replace(/`(.*?)`/g, '$1')          // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove links, keep text
    .replace(/\n{3,}/g, '\n\n')         // Normalize line breaks
    .trim();
}

// ========== MAIN PROCESSING ==========

async function processDocument(filePath, relativePath, openai) {
  console.log(`📄 Processing: ${relativePath}`);

  try {
    // Read file
    const content = await fs.readFile(filePath, 'utf-8');

    // Clean markdown
    const cleanContent = cleanMarkdown(content);

    if (!cleanContent || cleanContent.length < 50) {
      console.warn(`⚠️  Skipping ${relativePath} - content too short or empty`);
      return [];
    }

    // Chunk text
    const textChunks = chunkText(cleanContent, CONFIG.chunkSize, CONFIG.chunkOverlap);
    console.log(`   Created ${textChunks.length} chunks`);

    // Process each chunk
    const processedChunks = [];

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      console.log(`   Processing chunk ${i + 1}/${textChunks.length}`);

      // Get embedding
      const embedding = await getEmbedding(chunk, openai);

      // Определяем теги на основе пути
      const tags = [];
      if (relativePath.includes('charter')) tags.push('charter', 'philosophy');
      if (relativePath.includes('faq')) tags.push('faq', 'beginner');
      if (relativePath.includes('yachting')) tags.push('yachting', 'sailing');
      if (relativePath.includes('dao')) tags.push('dao', 'decentralization');

      processedChunks.push({
        source: 'steward-kb',
        path: `daosail-kb/docs/${relativePath}`,
        content: chunk,
        embedding,
        metadata: {
          chunk: i,
          total_chunks: textChunks.length,
          file: relativePath,
        },
        accessible_roles: STEWARD_ROLES,
        tags,
      });

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, CONFIG.rateLimit));
    }

    return processedChunks;

  } catch (error) {
    console.error(`❌ Error processing ${relativePath}:`, error.message);
    return [];
  }
}

async function uploadChunks(chunks, supabase) {
  console.log(`\n📤 Uploading ${chunks.length} chunks to Supabase...`);

  // 1. Удалить существующие chunks для steward-kb
  console.log('🗑️  Clearing existing steward-kb chunks...');
  const { error: deleteError } = await supabase
    .from('chunks')
    .delete()
    .eq('source', 'steward-kb');

  if (deleteError && !deleteError.message.includes('No rows')) {
    console.error('❌ Error deleting old chunks:', deleteError);
  }

  // 2. Загрузить новые chunks батчами
  const batchSize = CONFIG.batchSize;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    const { error } = await supabase
      .from('chunks')
      .insert(batch);

    if (error) {
      console.error('❌ Error uploading batch:', error);
      throw error;
    }

    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(chunks.length / batchSize);
    console.log(`   ✅ Batch ${batchNum}/${totalBatches} uploaded`);
  }

  console.log('✅ All chunks uploaded successfully!');
}

async function validateKnowledgeBase(supabase) {
  console.log('\n🔍 Validating knowledge base...');

  // Count chunks
  const { count, error } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'steward-kb');

  if (error) {
    console.error('❌ Validation error:', error);
    return false;
  }

  console.log(`   ✅ Total chunks in DB: ${count}`);

  // Test RPC function
  console.log('🧪 Testing match_chunks_docs function...');
  const testEmbedding = new Array(1536).fill(0.1);

  const { data: matches, error: rpcError } = await supabase.rpc('match_chunks_docs', {
    query_embedding: testEmbedding,
    match_count: 3,
    roles: STEWARD_ROLES,
    min_similarity: 0.1,
  });

  if (rpcError) {
    console.error('❌ RPC test failed:', rpcError);
    return false;
  }

  console.log(`   ✅ RPC function works, returned ${matches?.length || 0} results`);

  return true;
}

// ========== MAIN ==========

async function main() {
  console.log('🚀 Steward Knowledge Base Rebuild');
  console.log('==================================\n');

  try {
    // 1. Load environment
    const env = loadEnv();
    console.log('✅ Environment variables loaded');

    // 2. Initialize clients
    const openai = new OpenAI({ apiKey: env.openaiKey });
    const supabase = createClient(env.supabaseUrl, env.supabaseKey);
    console.log('✅ API clients initialized\n');

    // 3. Find KB directory
    const kbPath = path.join(__dirname, '..', 'daosail-kb', 'docs');
    console.log(`📁 KB path: ${kbPath}\n`);

    // 4. Process documents
    let allChunks = [];

    for (const source of STEWARD_SOURCES) {
      const filePath = path.join(kbPath, source);

      try {
        await fs.access(filePath);
        const chunks = await processDocument(filePath, source, openai);
        allChunks.push(...chunks);
      } catch (error) {
        console.warn(`⚠️  Skipping ${source} - file not found`);
      }
    }

    if (allChunks.length === 0) {
      console.log('❌ No chunks created. Check that daosail-kb repo is cloned.');
      process.exit(1);
    }

    // 5. Upload to Supabase
    await uploadChunks(allChunks, supabase);

    // 6. Validate
    const isValid = await validateKnowledgeBase(supabase);

    // 7. Statistics
    console.log('\n📊 FINAL STATISTICS');
    console.log('==================');
    console.log(`Documents processed: ${STEWARD_SOURCES.length}`);
    console.log(`Total chunks created: ${allChunks.length}`);
    console.log(`Avg chunks per doc: ${Math.round(allChunks.length / STEWARD_SOURCES.length)}`);
    console.log(`Accessible roles: ${STEWARD_ROLES.join(', ')}`);
    console.log(`Validation: ${isValid ? '✅ PASSED' : '❌ FAILED'}`);

    if (!isValid) {
      console.log('\n⚠️  Warning: Validation failed. Check database and RPC function.');
      process.exit(1);
    }

    console.log('\n✅ Steward Knowledge Base rebuild completed successfully!');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run
main();
