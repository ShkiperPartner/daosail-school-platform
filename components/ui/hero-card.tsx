'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useAppContext } from '@/lib/contexts/app-context';
import Link from 'next/link';

export function HeroCard() {
  const { language } = useAppContext();

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-brand/5 to-accent/5 border-2 border-primary/20">
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-accent" />
              <span className="text-accent font-semibold">
                {language === 'ru' ? 'ИИ-Проводник' : 'AI Guide'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-brand to-primary bg-clip-text text-transparent leading-tight">
              {language === 'ru'
                ? 'DAOsail'
                : 'DAOsail'
              }
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {language === 'ru'
                ? 'DAOsail — это гибридный клуб, живущий в двух реальностях: под парусами и в блокчейне. Мы создаём флотилию свободы, где решения принимаются сообща, а ИИ помогает идти вперёд. Познакомьтесь с нашими цифровыми Шкиперами — они подскажут всё о клубе и не только.'
                : 'DAOsail is a hybrid club living in two realities: under sails and in blockchain. We create a flotilla of freedom where decisions are made together, and AI helps us move forward. Meet our digital Skippers — they will tell you everything about the club and more.'
              }
            </p>
          </div>
          
          <Link href="/chat">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              {language === 'ru' ? 'Задать вопрос цифровому Шкиперу' : 'Ask Digital Skipper'}
            </Button>
          </Link>

          {/* Основные вопросы */}
          <div className="mt-8 pt-6 border-t border-primary/20">
            <h3 className="text-xl font-semibold text-center mb-4 text-primary">
              {language === 'ru' ? 'Основные вопросы' : 'Key Questions'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
              <Link href={`/chat?question=${encodeURIComponent(language === 'ru' ? 'Кратко о DAOsail' : 'Brief about DAOsail')}`}>
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left whitespace-normal justify-start bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/40 transition-all"
                >
                  <span className="text-sm">
                    {language === 'ru'
                      ? 'Кратко о DAOsail'
                      : 'Brief about DAOsail'
                    }
                  </span>
                </Button>
              </Link>
              <Link href={`/chat?question=${encodeURIComponent(language === 'ru' ? 'Какие роли предусмотрены в нашем клубе' : 'What roles are provided in our club')}`}>
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left whitespace-normal justify-start bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/40 transition-all"
                >
                  <span className="text-sm">
                    {language === 'ru'
                      ? 'Какие роли предусмотрены в нашем клубе'
                      : 'What roles are provided in our club'
                    }
                  </span>
                </Button>
              </Link>
              <Link href={`/chat?question=${encodeURIComponent(language === 'ru' ? 'Цифровые помощники нашего парусного клуба. Кто они' : 'Digital assistants of our sailing club. Who are they')}`}>
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left whitespace-normal justify-start bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/40 transition-all"
                >
                  <span className="text-sm">
                    {language === 'ru'
                      ? 'Цифровые помощники нашего парусного клуба. Кто они'
                      : 'Digital assistants of our sailing club. Who are they'
                    }
                  </span>
                </Button>
              </Link>
              <Link href={`/chat?question=${encodeURIComponent(language === 'ru' ? 'Как мы используем децентрализацию при построении клуба или роль ДАО' : 'How we use decentralization in building the club or the role of DAO')}`}>
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left whitespace-normal justify-start bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/40 transition-all md:col-span-2 lg:col-span-1"
                >
                  <span className="text-sm">
                    {language === 'ru'
                      ? 'Как мы используем децентрализацию при построении клуба или роль ДАО'
                      : 'How we use decentralization in building the club or the role of DAO'
                    }
                  </span>
                </Button>
              </Link>
              <Link href={`/chat?question=${encodeURIComponent(language === 'ru' ? 'Что такое субДАО и зачем оно?' : 'What is subDAO and why is it needed?')}`}>
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left whitespace-normal justify-start bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/40 transition-all"
                >
                  <span className="text-sm">
                    {language === 'ru'
                      ? 'Что такое субДАО и зачем оно?'
                      : 'What is subDAO and why is it needed?'
                    }
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-xl" />
      <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-primary/20 to-brand/20 rounded-full blur-xl" />
    </Card>
  );
}