'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  MessageSquare,
  BookOpen,
  Users,
  ArrowRight,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { useAppContext } from '@/lib/contexts/app-context';
import { getRoleConfig, calculateRoleProgress } from '@/lib/config/roles';

export function MyPathTab() {
  const { language, userProfile } = useAppContext();

  if (!userProfile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {language === 'ru' ? 'Загрузка данных...' : 'Loading data...'}
        </p>
      </div>
    );
  }

  const { role, stats, recentChats } = userProfile;
  const roleConfig = getRoleConfig(role);
  const nextRoleConfig = roleConfig.nextRole ? getRoleConfig(roleConfig.nextRole) : null;
  const progressPercentage = calculateRoleProgress(role, stats);

  const getAssistantIcon = (type: string) => {
    switch (type) {
      case 'Шкипер': return '🧭';
      case 'Навигатор': return '⭐';
      case 'Боцман': return '⚓';
      default: return '🤖';
    }
  };

  const getTopicColor = (topic: string) => {
    switch (topic) {
      case 'navigation': return 'bg-blue-100 text-blue-800';
      case 'safety': return 'bg-red-100 text-red-800';
      case 'preparation': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRelativeTime = (date: Date) => {
    const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return rtf.format(-minutes, 'minute');
    } else if (hours < 24) {
      return rtf.format(-hours, 'hour');
    } else {
      const days = Math.floor(hours / 24);
      return rtf.format(-days, 'day');
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Level Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/80">
              {language === 'ru' ? roleConfig.titleRu : roleConfig.title}
            </Badge>
            {language === 'ru' ? 'Ваш текущий уровень' : 'Your Current Level'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            {language === 'ru' ? roleConfig.descriptionRu : roleConfig.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roleConfig.permissions.map((permission, index) => (
              <div key={index} className="flex items-center gap-2 bg-white/60 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">
                  {getPermissionLabel(permission, language)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress to Next Level */}
      {nextRoleConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {language === 'ru' ? 'Прогресс до следующего уровня' : 'Progress to Next Level'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">
                  {language === 'ru' ? 'Следующая роль:' : 'Next role:'}{' '}
                  <span className="text-primary">
                    {language === 'ru' ? nextRoleConfig.titleRu : nextRoleConfig.title}
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'ru' ? nextRoleConfig.descriptionRu : nextRoleConfig.description}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {language === 'ru' ? 'Общий прогресс' : 'Overall Progress'}
                </span>
                <span className="text-sm font-medium">
                  {progressPercentage}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            {roleConfig.requirements && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {roleConfig.requirements.questionsRequired && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      <span className="font-medium text-blue-900">
                        {language === 'ru' ? 'Вопросы' : 'Questions'}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {stats.questionsAsked}/{roleConfig.requirements.questionsRequired}
                    </div>
                    <Progress
                      value={(stats.questionsAsked / roleConfig.requirements.questionsRequired) * 100}
                      className="mt-2 h-2"
                    />
                  </div>
                )}

                {roleConfig.requirements.lessonsRequired && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-900">
                        {language === 'ru' ? 'Уроки' : 'Lessons'}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {stats.lessonsCompleted}/{roleConfig.requirements.lessonsRequired}
                    </div>
                    <Progress
                      value={(stats.lessonsCompleted / roleConfig.requirements.lessonsRequired) * 100}
                      className="mt-2 h-2"
                    />
                  </div>
                )}

                {roleConfig.requirements.articlesRequired && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-purple-500" />
                      <span className="font-medium text-purple-900">
                        {language === 'ru' ? 'Статьи' : 'Articles'}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {stats.articlesRead}/{roleConfig.requirements.articlesRequired}
                    </div>
                    <Progress
                      value={(stats.articlesRead / roleConfig.requirements.articlesRequired) * 100}
                      className="mt-2 h-2"
                    />
                  </div>
                )}

                {roleConfig.requirements.communityRequired && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-orange-500" />
                      <span className="font-medium text-orange-900">
                        {language === 'ru' ? 'Сообщество' : 'Community'}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-orange-700">
                      {stats.communityMessages}/{roleConfig.requirements.communityRequired}
                    </div>
                    <Progress
                      value={(stats.communityMessages / roleConfig.requirements.communityRequired) * 100}
                      className="mt-2 h-2"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {language === 'ru' ? 'Недавняя активность' : 'Recent Activity'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>
                {language === 'ru' ? 'Последний вход:' : 'Last login:'}
              </span>
              <span className="font-medium">
                {formatRelativeTime(stats.lastLoginDate)}
              </span>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">
                {language === 'ru' ? 'Последние чаты' : 'Recent Chats'}
              </h4>
              <div className="space-y-3">
                {recentChats.slice(0, 3).map((chat) => (
                  <div key={chat.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl">{getAssistantIcon(chat.assistantType)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-sm">{chat.title}</h5>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getTopicColor(chat.mainTopic)}`}
                        >
                          {chat.mainTopic}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {chat.messagesCount}{' '}
                          {language === 'ru' ? 'сообщений' : 'messages'}
                        </span>
                        <span>
                          {formatRelativeTime(chat.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {recentChats.length > 3 && (
                <Button variant="outline" className="w-full mt-4">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {language === 'ru' ? 'Посмотреть все чаты' : 'View All Chats'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to translate permissions
function getPermissionLabel(permission: string, language: 'en' | 'ru'): string {
  const labels: Record<string, { en: string; ru: string }> = {
    'chat_with_skipper': { en: 'Chat with Skipper', ru: 'Чат с Шкипером' },
    'chat_with_navigator': { en: 'Chat with Navigator', ru: 'Чат с Навигатором' },
    'chat_with_boatswain': { en: 'Chat with Boatswain', ru: 'Чат с Боцманом' },
    'read_library': { en: 'Library Access', ru: 'Доступ к библиотеке' },
    'view_community': { en: 'View Community', ru: 'Просмотр сообщества' },
    'participate_in_community': { en: 'Community Participation', ru: 'Участие в сообществе' },
    'access_simulations': { en: 'Simulations Access', ru: 'Доступ к симуляторам' },
    'full_library_access': { en: 'Full Library', ru: 'Полная библиотека' },
    'advanced_simulations': { en: 'Advanced Simulations', ru: 'Продвинутые симуляторы' },
    'mentor_access': { en: 'Mentor Access', ru: 'Наставничество' },
    'club_events_organization': { en: 'Event Organization', ru: 'Организация событий' }
  };

  return labels[permission]?.[language] || permission;
}