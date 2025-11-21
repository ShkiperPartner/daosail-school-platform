import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

// Инициализируем OpenAI для создания embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const {
      query,
      category,
      language = 'ru',
      maxResults = 5,
      threshold = 0.78
    } = await request.json();

    // Валидация запроса
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return NextResponse.json(
        { error: 'Query must be at least 3 characters long' },
        { status: 400 }
      );
    }

    // Создаем embedding для поискового запроса
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query.trim(),
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Инициализируем Supabase
    const supabase = await createClient();

    // Выполняем поиск похожих документов
    const { data, error } = await supabase.rpc('search_knowledge_documents', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: maxResults,
      filter_category: category || null,
      filter_language: language
    } as any);

    if (error) {
      console.error('Supabase search error:', error);
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      );
    }

    // Приводим data к правильному типу
    const dataArray = (data || []) as any[];

    // Форматируем результаты
    const documents = dataArray.map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      source_type: doc.source_type,
      source_url: doc.source_url,
      category: doc.category,
      similarity: doc.similarity
    }));

    return NextResponse.json({
      documents,
      query,
      totalResults: documents.length,
      searchParams: {
        category,
        language,
        maxResults,
        threshold
      }
    });

  } catch (error) {
    console.error('Search knowledge API Error:', error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API Error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET метод для получения всех документов или по категории
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const language = searchParams.get('language') || 'ru';

    const supabase = await createClient();

    let query = supabase
      .from('knowledge_documents')
      .select('id, title, content, source_type, source_url, category, language, created_at')
      .eq('language', language)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      documents: data || [],
      category,
      language
    });

  } catch (error) {
    console.error('Get knowledge API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}