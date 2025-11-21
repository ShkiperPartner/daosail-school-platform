import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Environment validation
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    // Parse request body
    const body: FAQRequest = await request.json();
    const {
      session_id,
      user_message,
      user_role = 'public',
      prefs = { lang: 'ru' }
    } = body;

    if (!session_id || !user_message) {
      return NextResponse.json(
        { error: 'Missing session_id or user_message' },
        { status: 400 }
      );
    }

    // Call Supabase Edge Function
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabaseClient.functions.invoke('handle-faq', {
      body: {
        session_id,
        user_message,
        user_role,
        prefs
      }
    });

    if (error) {
      console.error('Edge Function error:', error);
      return NextResponse.json(
        { error: 'FAQ service error', details: error.message },
        { status: 500 }
      );
    }

    // Return response
    const response: FAQResponse = data;
    return NextResponse.json(response);

  } catch (error) {
    console.error('FAQ API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}