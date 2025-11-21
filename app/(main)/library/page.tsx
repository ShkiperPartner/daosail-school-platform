'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  HelpCircle, 
  Search, 
  Clock,
  User,
  ExternalLink
} from 'lucide-react';
import { useAppContext } from '@/lib/contexts/app-context';

export default function LibraryPage() {
  const { language } = useAppContext();

  const categories = [
    {
      id: 'dao-basics',
      title: language === 'ru' ? 'Основы DAO' : 'DAO Basics',
      count: 12,
      icon: BookOpen,
    },
    {
      id: 'ai-guide',
      title: language === 'ru' ? 'Руководство по ИИ' : 'AI Guide',
      count: 8,
      icon: HelpCircle,
    },
    {
      id: 'blockchain',
      title: language === 'ru' ? 'Блокчейн' : 'Blockchain',
      count: 15,
      icon: BookOpen,
    },
    {
      id: 'community',
      title: language === 'ru' ? 'Сообщество' : 'Community',
      count: 6,
      icon: User,
    },
  ];

  const articles = [
    {
      id: '1',
      title: language === 'ru' ? 'Что такое DAO и как оно работает' : 'What is DAO and how does it work',
      excerpt: language === 'ru' 
        ? 'Полное руководство по децентрализованным автономным организациям'
        : 'Complete guide to decentralized autonomous organizations',
      category: language === 'ru' ? 'Основы DAO' : 'DAO Basics',
      readTime: '5 мин',
      isPopular: true,
    },
    {
      id: '2',
      title: language === 'ru' ? 'Введение в искусственный интеллект' : 'Introduction to Artificial Intelligence',
      excerpt: language === 'ru'
        ? 'Основы ИИ для начинающих с практическими примерами'
        : 'AI basics for beginners with practical examples',
      category: language === 'ru' ? 'Руководство по ИИ' : 'AI Guide',
      readTime: '8 мин',
      isPopular: true,
    },
    {
      id: '3',
      title: language === 'ru' ? 'Токеномика и управление' : 'Tokenomics and Governance',
      excerpt: language === 'ru'
        ? 'Как работают токены управления в DAO'
        : 'How governance tokens work in DAOs',
      category: language === 'ru' ? 'Основы DAO' : 'DAO Basics',
      readTime: '12 мин',
      isPopular: false,
    },
    {
      id: '4',
      title: language === 'ru' ? 'Умные контракты простыми словами' : 'Smart Contracts Explained Simply',
      excerpt: language === 'ru'
        ? 'Что такое смарт-контракты и зачем они нужны'
        : 'What are smart contracts and why do we need them',
      category: language === 'ru' ? 'Блокчейн' : 'Blockchain',
      readTime: '7 мин',
      isPopular: false,
    },
    {
      id: '5',
      title: language === 'ru' ? 'Как участвовать в голосованиях DAO' : 'How to Participate in DAO Voting',
      excerpt: language === 'ru'
        ? 'Пошаговое руководство по участию в управлении'
        : 'Step-by-step guide to governance participation',
      category: language === 'ru' ? 'Сообщество' : 'Community',
      readTime: '6 мин',
      isPopular: true,
    },
    {
      id: '6',
      title: language === 'ru' ? 'Безопасность в DeFi' : 'Security in DeFi',
      excerpt: language === 'ru'
        ? 'Как защитить себя в децентрализованных финансах'
        : 'How to protect yourself in decentralized finance',
      category: language === 'ru' ? 'Блокчейн' : 'Blockchain',
      readTime: '10 мин',
      isPopular: false,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-brand to-primary bg-clip-text text-transparent">
            {language === 'ru' ? 'Библиотека знаний' : 'Knowledge Library'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === 'ru'
              ? 'Изучайте DAO, блокчейн и ИИ с нашими экспертными материалами'
              : 'Learn DAO, blockchain and AI with our expert materials'
            }
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder={language === 'ru' ? 'Поиск статей...' : 'Search articles...'}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">{category.title}</h3>
                  <Badge variant="secondary">{category.count} статей</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Articles Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {language === 'ru' ? 'Популярные статьи' : 'Popular Articles'}
            </h2>
            <Button variant="outline">
              {language === 'ru' ? 'Все статьи' : 'All Articles'}
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {article.category}
                    </Badge>
                    {article.isPopular && (
                      <Badge className="text-xs">
                        {language === 'ru' ? 'Популярно' : 'Popular'}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {article.readTime}
                    {language === 'ru' && ' чтения'}
                    {language === 'en' && ' read'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              {language === 'ru' ? 'Часто задаваемые вопросы' : 'Frequently Asked Questions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border-b border-border last:border-b-0 pb-4 last:pb-0">
                  <h4 className="font-medium mb-2">
                    {language === 'ru' 
                      ? `Вопрос №${i}: Как начать работу с DAO?`
                      : `Question #${i}: How to get started with DAO?`
                    }
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ru'
                      ? 'Подробный ответ на популярный вопрос с практическими рекомендациями и ссылками на дополнительные материалы.'
                      : 'Detailed answer to a popular question with practical recommendations and links to additional materials.'
                    }
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}