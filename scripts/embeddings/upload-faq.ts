import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configuration
interface Config {
  supabaseUrl: string;
  supabaseServiceKey: string;
  openaiApiKey: string;
  chunkSize: number;
  chunkOverlap: number;
}

// Load configuration from environment
function loadConfig(): Config {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    openaiApiKey: process.env.OPENAI_API_KEY!,
    chunkSize: parseInt(process.env.CHUNK_SIZE || '600'),
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '100'),
  };
}

// Text chunking with overlap
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
  }

  return chunks;
}

// Get embeddings from OpenAI
async function getEmbedding(text: string, openai: OpenAI): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      input: text,
      model: 'text-embedding-ada-002',
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    throw error;
  }
}

// Process a single document
async function processDocument(
  filePath: string,
  docId: string,
  config: Config,
  openai: OpenAI,
  accessibleRoles: string[] = ['public'],
  tags: string[] = [],
  url?: string
) {
  console.log(`Processing document: ${docId}`);

  try {
    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');

    // Clean and chunk text
    const cleanContent = content
      .replace(/^---[\s\S]*?---/, '') // Remove frontmatter
      .replace(/#+\s/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();

    const chunks = chunkText(cleanContent, config.chunkSize, config.chunkOverlap);
    console.log(`Created ${chunks.length} chunks for ${docId}`);

    // Process each chunk
    const processedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length} for ${docId}`);

      // Get embedding
      const embedding = await getEmbedding(chunk, openai);

      processedChunks.push({
        doc_id: docId,
        chunk_idx: i,
        text: chunk,
        embedding,
        accessible_roles: accessibleRoles,
        tags,
        url,
      });

      // Rate limiting - wait between API calls
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return processedChunks;
  } catch (error) {
    console.error(`Error processing document ${docId}:`, error);
    throw error;
  }
}

// Upload chunks to Supabase
async function uploadChunks(chunks: any[], supabase: any) {
  console.log(`Uploading ${chunks.length} chunks to Supabase...`);

  // Delete existing chunks for these documents
  const docIds = [...new Set(chunks.map(c => c.doc_id))];
  for (const docId of docIds) {
    const { error: deleteError } = await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('doc_id', docId);

    if (deleteError && !deleteError.message.includes('No rows found')) {
      console.error(`Error deleting existing chunks for ${docId}:`, deleteError);
    }
  }

  // Insert new chunks in batches
  const batchSize = 50;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const { error } = await supabase
      .from('knowledge_chunks')
      .insert(batch);

    if (error) {
      console.error('Error uploading batch:', error);
      throw error;
    }

    console.log(`Uploaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
  }

  console.log('✅ All chunks uploaded successfully!');
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting FAQ embeddings upload...');

    const config = loadConfig();
    const openai = new OpenAI({ apiKey: config.openaiApiKey });
    const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

    // Define documents to process
    const documents = [
      {
        path: 'PROJECT_ARCHITECTURE.md',
        docId: 'project_architecture.md',
        roles: ['public'],
        tags: ['architecture', 'tech', 'overview'],
        url: null
      },
      // Add more documents here as needed
    ];

    let allChunks: any[] = [];

    // Process each document
    for (const doc of documents) {
      const filePath = path.join(process.cwd(), doc.path);

      try {
        await fs.access(filePath);
        const chunks = await processDocument(
          filePath,
          doc.docId,
          config,
          openai,
          doc.roles,
          doc.tags,
          doc.url ?? undefined
        );
        allChunks.push(...chunks);
      } catch (error) {
        console.warn(`⚠️  Skipping ${doc.path} (file not found or error):`, error instanceof Error ? error.message : String(error));
      }
    }

    if (allChunks.length === 0) {
      console.log('❌ No chunks to upload. Make sure documents exist.');
      return;
    }

    // Upload to Supabase
    await uploadChunks(allChunks, supabase);

    console.log('✅ FAQ embeddings upload completed!');
    console.log(`📊 Statistics:`);
    console.log(`   - Documents processed: ${documents.length}`);
    console.log(`   - Total chunks created: ${allChunks.length}`);
    console.log(`   - Average chunks per document: ${Math.round(allChunks.length / documents.length)}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run script
if (require.main === module) {
  main();
}

export { processDocument, uploadChunks, chunkText };