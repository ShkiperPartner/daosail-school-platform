'use client';

import React, { useState } from 'react';
import { useAppContext } from '@/lib/contexts/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Ship } from 'lucide-react';

interface EmailCaptureProps {
  onSkip?: () => void;
}

export function EmailCapture({ onSkip }: EmailCaptureProps) {
  const { language, captureEmail } = useAppContext();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    setIsLoading(true);

    try {
      await captureEmail(email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error capturing email:', error);
      // Продолжаем даже при ошибке - UX важнее
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 text-center">
        <Ship className="w-8 h-8 mx-auto mb-4 text-blue-600" />
        <h3 className="text-lg font-semibold mb-2">
          {language === 'ru' ? 'Спасибо!' : 'Thank you!'}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {language === 'ru'
            ? 'Можете задать еще 3 вопроса, а после подтверждения почты получите полный доступ к платформе.'
            : 'You can ask 3 more questions, and after email confirmation you\'ll get full platform access.'
          }
        </p>
        <div className="text-sm text-gray-500">
          {language === 'ru'
            ? 'Проверьте свою почту для подтверждения'
            : 'Check your email for confirmation'
          }
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
      <div className="flex items-center gap-3 mb-4">
        <Mail className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold">
          {language === 'ru'
            ? 'Вижу, вас заинтересовал наш клуб!'
            : 'I see you\'re interested in our club!'
          }
        </h3>
      </div>

      <p className="text-gray-600 dark:text-gray-300 mb-4">
        {language === 'ru'
          ? 'Оставьте email для более продуктивного сотрудничества.'
          : 'Leave your email for more productive collaboration.'
        }
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder={language === 'ru' ? 'ваш@email.com' : 'your@email.com'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="w-full"
        />

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={!email.trim() || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              language === 'ru' ? 'Сохраняем...' : 'Saving...'
            ) : (
              language === 'ru' ? 'Продолжить' : 'Continue'
            )}
          </Button>

          {onSkip && (
            <Button
              type="button"
              variant="outline"
              onClick={onSkip}
              disabled={isLoading}
            >
              {language === 'ru' ? 'Позже' : 'Later'}
            </Button>
          )}
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-500 text-center">
        {language === 'ru'
          ? 'Мы не передаем ваши данные третьим лицам'
          : 'We don\'t share your data with third parties'
        }
      </div>
    </div>
  );
}