'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Construction, ArrowLeft } from 'lucide-react';
import { useAppContext } from '@/lib/contexts/app-context';
import Link from 'next/link';

interface PlaceholderPageProps {
  title: string;
  titleRu: string;
  description?: string;
  descriptionRu?: string;
  category: string;
  categoryRu: string;
  icon: React.ReactNode;
  backHref?: string;
  comingSoon?: boolean;
}

export function PlaceholderPage({
  title,
  titleRu,
  description,
  descriptionRu,
  category,
  categoryRu,
  icon,
  backHref = '/',
  comingSoon = true
}: PlaceholderPageProps) {
  const { language } = useAppContext();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Back button */}
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'ru' ? 'Назад' : 'Back'}
          </Button>
        </Link>

        {/* Main card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                {icon}
              </div>
            </div>

            <div className="space-y-2">
              <Badge variant="outline" className="mb-2">
                {language === 'ru' ? categoryRu : category}
              </Badge>
              <CardTitle className="text-2xl md:text-3xl">
                {language === 'ru' ? titleRu : title}
              </CardTitle>
              {(description || descriptionRu) && (
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  {language === 'ru' ? descriptionRu : description}
                </p>
              )}
            </div>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            {comingSoon && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Construction className="h-12 w-12 text-amber-500" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-amber-600">
                    {language === 'ru' ? 'Скоро будет доступно' : 'Coming Soon'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {language === 'ru'
                      ? 'Мы активно работаем над этим разделом. Следите за обновлениями!'
                      : 'We are actively working on this section. Stay tuned for updates!'
                    }
                  </p>
                </div>

                <div className="pt-4">
                  <Link href="/chat">
                    <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                      {language === 'ru'
                        ? 'Пока что задайте вопрос Шкиперу'
                        : 'Ask the Skipper for now'
                      }
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-xl" />
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-xl" />
        </Card>
      </div>
    </div>
  );
}