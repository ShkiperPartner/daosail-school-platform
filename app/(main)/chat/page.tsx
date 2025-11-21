'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatBox } from '@/components/ui/chat-box';
import { QuickQuestions } from '@/components/ui/quick-questions';
import { SoftGateBanner } from '@/components/ui/soft-gate-banner';
import { AssistantSelector } from '@/components/ui/assistant-selector';
import { AssistantType } from '@/lib/types/assistants';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [assistantType, setAssistantType] = useState<AssistantType>('navigator');
  const [showAssistantSelector, setShowAssistantSelector] = useState(true);

  // Read parameters from URL
  useEffect(() => {
    const assistant = searchParams.get('assistant') as AssistantType;
    if (assistant && ['navigator', 'sailing_coach', 'dao_advisor', 'ai_guide', 'personal', 'steward'].includes(assistant)) {
      setAssistantType(assistant);
      setShowAssistantSelector(false); // Hide selector if assistant is specified in URL
    }

    // Handle predefined question from URL
    const question = searchParams.get('question');
    if (question) {
      setSelectedQuestion(decodeURIComponent(question));
      setShowAssistantSelector(false); // Hide selector if question is specified
    }
  }, [searchParams]);

  const handleQuestionClick = (question: string) => {
    setSelectedQuestion(question);
  };

  const handleQuestionProcessed = () => {
    setSelectedQuestion('');
  };

  const handleAssistantChange = (assistant: AssistantType) => {
    setAssistantType(assistant);
    setShowAssistantSelector(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <SoftGateBanner />

        {showAssistantSelector ? (
          <AssistantSelector
            selectedAssistant={assistantType}
            onAssistantChange={handleAssistantChange}
          />
        ) : (
          <div className="space-y-6">
            <QuickQuestions onQuestionClick={handleQuestionClick} />
            <ChatBox
              newQuestion={selectedQuestion}
              onQuestionProcessed={handleQuestionProcessed}
              assistantType={assistantType}
              onChangeAssistant={() => setShowAssistantSelector(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 max-w-4xl">Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
