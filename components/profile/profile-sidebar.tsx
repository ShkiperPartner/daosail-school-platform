'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  User,
  Lightbulb,
  ArrowRight,
  Star,
  TrendingUp
} from 'lucide-react';
import { useAppContext } from '@/lib/contexts/app-context';
import { getTodaysTip } from '@/data/mock-profile';
import { getRoleConfig } from '@/lib/config/roles';

export function ProfileSidebar() {
  const { language, userProfile } = useAppContext();

  if (!userProfile) {
    return null;
  }

  const { role, roleProgress } = userProfile;
  const roleConfig = getRoleConfig(role);
  const todaysTip = getTodaysTip(language);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <aside className="w-80 border-l bg-muted/50 h-full overflow-auto custom-scrollbar">
      <div className="p-4 space-y-4">
      {/* User Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={userProfile.avatarUrl} alt="User avatar" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xl">
                  {getInitials(userProfile.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2">
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  {userProfile.achievements.length}
                </Badge>
              </div>
            </div>

            {/* Name and Role */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{userProfile.fullName}</h3>
              <Badge
                variant="outline"
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
              >
                {language === 'ru' ? roleConfig.titleRu : roleConfig.title}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {language === 'ru' ? 'Прогресс до следующей роли' : 'Progress to Next Role'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {roleProgress.nextRole ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Текущий:' : 'Current:'}
                </span>
                <span className="text-sm font-medium">
                  {language === 'ru' ? roleConfig.titleRu : roleConfig.title}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {language === 'ru' ? 'Следующий:' : 'Next:'}
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {roleProgress.nextRole}
                  </span>
                </div>

                <div className="space-y-1">
                  <Progress
                    value={roleProgress.progressPercentage}
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{roleProgress.progressPercentage}%</span>
                    <span>
                      {language === 'ru' ? 'завершено' : 'complete'}
                    </span>
                  </div>
                </div>
              </div>

              {roleProgress.progressPercentage < 100 && (
                <Button
                  size="sm"
                  className="w-full"
                  variant="outline"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {language === 'ru' ? 'Узнать требования' : 'View Requirements'}
                </Button>
              )}
            </>
          ) : (
            <div className="text-center space-y-2">
              <div className="text-2xl">🏆</div>
              <p className="text-sm text-muted-foreground">
                {language === 'ru'
                  ? 'Достигнута максимальная роль!'
                  : 'Maximum role achieved!'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Tip */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            {language === 'ru' ? 'Совет дня' : 'Daily Tip'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {language === 'ru' ? todaysTip.tipRu : todaysTip.tip}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {todaysTip.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString(language)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            {language === 'ru' ? 'Быстрая сводка' : 'Quick Summary'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {language === 'ru' ? 'Вопросов:' : 'Questions:'}
            </span>
            <span className="font-medium">{userProfile.stats.questionsAsked}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {language === 'ru' ? 'Уроков:' : 'Lessons:'}
            </span>
            <span className="font-medium">{userProfile.stats.lessonsCompleted}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {language === 'ru' ? 'Статей:' : 'Articles:'}
            </span>
            <span className="font-medium">{userProfile.stats.articlesRead}</span>
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Последний вход:' : 'Last login:'}
              </span>
              <span className="text-sm font-medium">
                {userProfile.stats.lastLoginDate.toLocaleDateString(language)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </aside>
  );
}