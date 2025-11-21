import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// CORS headers inline
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// Environment validation
function getEnvVar(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// OpenAI API call for embeddings
async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-ada-002',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// OpenAI API call for chat completion
async function getFAQResponse(
  userQuestion: string,
  context: string,
  language: string,
  apiKey: string
): Promise<string> {
  const systemPrompt = language === 'ru'
    ? `Ты FAQ ассистент DAOsail — строгий и точный помощник по базе знаний проекта.

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

Вопрос пользователя: ${userQuestion}`
    : `You are DAOsail FAQ assistant — strict and precise knowledge base helper.

🎯 MAIN RULE: Answer ONLY based on provided context. No inventions!

📋 INSTRUCTIONS:
• If information exists in context → answer clearly and briefly
• If information is MISSING → say "No information available in knowledge base for this question"
• Never add information "from yourself" or general knowledge
• Reference source numbers [1], [2] in answer if needed
• Tone: professional but friendly
• Length: 1-3 sentences, max 150 words

Provided context:
${context}

User question: ${userQuestion}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

interface FAQRequest {
  session_id: string;
  user_message: string;
  user_role?: string;
  prefs?: {
    lang?: string;
  };
}

interface FAQResponse {
  agent: string;
  final_text: string;
  citations: Array<{
    doc_id: string;
    url: string | null;
    chunk_idx: number;
    similarity: number;
  }>;
  trace: {
    intent: string;
    tools: string[];
    latency_ms: number;
  };
}

serve(async (req: Request) => {
  const startTime = Date.now();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Environment setup
    const supabaseUrl = getEnvVar('SUPABASE_URL');
    const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = getEnvVar('OPENAI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const requestData: FAQRequest = await req.json();
    const {
      session_id,
      user_message,
      user_role = 'public',
      prefs = { lang: 'ru' }
    } = requestData;

    if (!session_id || !user_message) {
      return new Response(
        JSON.stringify({ error: 'Missing session_id or user_message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Log user message
    await supabase.from('chat_messages').insert({
      session_id,
      role: 'user',
      content: user_message,
      agent: 'faq',
    });

    // 2. Get embedding for user question
    const queryEmbedding = await getEmbedding(user_message, openaiApiKey);

    // 3. Search knowledge base (using existing chunks table with role-based access)
    const userRoles = [user_role, 'public']; // Always include 'public' for basic access
    const { data: matches, error: searchError } = await supabase.rpc('match_chunks_docs', {
      query_embedding: queryEmbedding,
      match_count: 5,
      roles: userRoles,
      min_similarity: 0.7
    });

    if (searchError) {
      throw new Error(`Knowledge search error: ${searchError.message}`);
    }

    // 4. Prepare context
    let context = '';
    const citations: FAQResponse['citations'] = [];

    if (matches && matches.length > 0) {
      context = matches
        .map((match: any, idx: number) =>
          `[${idx + 1}] ${match.content}\n(Источник: ${match.path}, релевантность: ${Math.round(match.similarity * 100)}%)`
        )
        .join('\n\n');

      citations.push(...matches.map((match: any) => ({
        doc_id: match.path,
        url: null, // No URL in chunks table
        chunk_idx: match.metadata?.chunk || 0,
        similarity: match.similarity,
      })));
    }

    // 5. Get FAQ response
    const faqAnswer = await getFAQResponse(
      user_message,
      context,
      prefs.lang || 'ru',
      openaiApiKey
    );

    // 6. Log assistant response
    await supabase.from('chat_messages').insert({
      session_id,
      role: 'assistant',
      content: faqAnswer,
      agent: 'faq',
      meta: { citations }
    });

    // 7. Prepare response
    const response: FAQResponse = {
      agent: 'faq',
      final_text: faqAnswer,
      citations,
      trace: {
        intent: 'faq',
        tools: ['rag'],
        latency_ms: Date.now() - startTime
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('FAQ Handler Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});