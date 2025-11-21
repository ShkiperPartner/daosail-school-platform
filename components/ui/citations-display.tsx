'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, Clock } from 'lucide-react';
import { useAppContext } from '@/lib/contexts/app-context';

interface Citation {
  doc_id: string;
  url: string | null;
  chunk_idx: number;
  similarity: number;
}

interface CitationsDisplayProps {
  citations: Citation[];
  traceInfo?: {
    intent: string;
    tools: string[];
    latency_ms: number;
  };
}

export function CitationsDisplay({ citations, traceInfo }: CitationsDisplayProps) {
  const { language } = useAppContext();

  if (!citations || citations.length === 0) {
    return null;
  }

  const formatSimilarity = (similarity: number) => {
    return Math.round(similarity * 100);
  };

  const formatDocId = (docId: string) => {
    // Clean up document ID for display
    return docId
      .replace(/\.md$/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getSimilarityColor = (similarity: number) => {
    const percent = similarity * 100;
    if (percent >= 85) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (percent >= 75) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
  };

  return (
    <Card className="mt-3 bg-muted/30 border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          {language === 'ru' ? 'Источники информации' : 'Information Sources'}
          {traceInfo && (
            <div className="flex items-center gap-1 ml-auto text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {traceInfo.latency_ms}ms
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {citations.map((citation, index) => (
            <div
              key={`${citation.doc_id}-${citation.chunk_idx}`}
              className="flex items-center justify-between p-2 rounded-lg bg-background border"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {formatDocId(citation.doc_id)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Фрагмент' : 'Chunk'} {citation.chunk_idx + 1}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    className={`text-xs ${getSimilarityColor(citation.similarity)}`}
                    variant="secondary"
                  >
                    {formatSimilarity(citation.similarity)}%
                  </Badge>

                  {citation.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(citation.url!, '_blank', 'noopener,noreferrer')}
                      title={language === 'ru' ? 'Открыть источник' : 'Open source'}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {traceInfo && (
          <div className="mt-3 pt-3 border-t border-muted">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span>{language === 'ru' ? 'Намерение:' : 'Intent:'}</span>
                <Badge variant="outline" className="text-xs">
                  {traceInfo.intent}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>{language === 'ru' ? 'Инструменты:' : 'Tools:'}</span>
                <div className="flex gap-1">
                  {traceInfo.tools.map((tool, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-muted-foreground">
          {language === 'ru'
            ? 'Информация получена из базы знаний проекта. Процент показывает релевантность источника к вашему вопросу.'
            : 'Information retrieved from project knowledge base. Percentage shows source relevance to your question.'
          }
        </div>
      </CardContent>
    </Card>
  );
}