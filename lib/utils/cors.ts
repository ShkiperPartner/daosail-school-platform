// CORS utilities for API routes
// Based on REVIEW.md Section 8: Безопасность

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  // Allowed origins for CORS
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL,
  ].filter(Boolean);

  // Determine if origin is allowed
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

export function createApiResponse(
  body: any,
  options: {
    status?: number;
    origin?: string | null;
    additionalHeaders?: Record<string, string>;
  } = {}
): Response {
  const { status = 200, origin, additionalHeaders = {} } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...getCorsHeaders(origin),
    ...additionalHeaders,
  };

  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}

export function createStreamResponse(
  stream: ReadableStream,
  origin?: string | null
): Response {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    ...getCorsHeaders(origin),
  };

  return new Response(stream, { headers });
}