'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle, UserPlus } from 'lucide-react';
import { useAppContext } from '@/lib/contexts/app-context';

export function SoftGateBanner() {
  const router = useRouter();
  const { language, responsesLeft } = useAppContext();

  if (responsesLeft > 1) return null;

  const handleRegister = () => {
    router.push('/signup');
  };

  return (
    <div className="soft-gate-banner mb-6">
      <div className="flex items-center justify-center gap-3">
        <AlertTriangle className="h-5 w-5 text-primary" />
        <div className="flex-1 text-center">
          <p className="font-medium">
            {language === 'ru' 
              ? `Остался ${responsesLeft} ответ. Зарегистрируйтесь, чтобы продолжить.`
              : `${responsesLeft} response left. Register to continue.`
            }
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {language === 'ru'
              ? 'Получите неограниченный доступ к ИИ-консультанту'
              : 'Get unlimited access to AI consultant'
            }
          </p>
        </div>
        <Button onClick={handleRegister} className="shrink-0">
          <UserPlus className="h-4 w-4 mr-2" />
          {language === 'ru' ? 'Регистрация' : 'Register'}
        </Button>
      </div>
    </div>
  );
}