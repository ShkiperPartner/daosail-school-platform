'use client';

import React from 'react';
import { useAppContext } from '@/lib/contexts/app-context';
import { chatService } from '@/lib/services/chat-service';

interface QuickQuestionsProps {
  onQuestionClick: (question: string) => void;
  assistantType?: 'navigator' | 'skipper';
}

export function QuickQuestions({
  onQuestionClick,
  assistantType = 'navigator'
}: QuickQuestionsProps) {
  const { language } = useAppContext();

  // Get quick questions from ChatService
  const questions = chatService.getQuickQuestions(assistantType, language);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">
        {language === 'ru' ? 'Быстрые вопросы' : 'Quick Questions'}
      </h3>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={`${assistantType}-${index}`}
            onClick={() => onQuestionClick(question)}
            className="quick-chip px-3 py-2 text-sm rounded-full border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}