'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { useAppContext } from '@/lib/contexts/app-context';
import { ProfileSidebar } from '@/components/profile/profile-sidebar';

export function RightSidebar() {
  const { language, responsesLeft, isAuthenticated, userProfile } = useAppContext();

  // Show personalized sidebar for authenticated users
  if (isAuthenticated && userProfile) {
    return <ProfileSidebar />;
  }

  const progressPercentage = ((3 - responsesLeft) / 3) * 100;

  return (
    <aside className="w-80 border-l bg-muted/50 h-full overflow-auto custom-scrollbar">
      <div className="p-4 space-y-4">
        {/* Mini Profile */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" alt="User avatar" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                  G
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold">Guest</div>
                <Badge variant="secondary" className="text-xs">
                  {language === 'ru' ? 'Новичок' : 'Beginner'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {/* Progress indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {language === 'ru' ? 'Прогресс:' : 'Progress:'}
                </span>
                <span className="font-medium">
                  {3 - responsesLeft}/3 {language === 'ru' ? 'ответов' : 'responses'}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {language === 'ru' ? 'Быстрые действия' : 'Quick Actions'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start" 
              disabled={isAuthenticated}
            >
              <User className="h-4 w-4 mr-2" />
              {language === 'ru' ? 'Заполнить профиль' : 'Fill profile'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {language === 'ru' ? 'Подключить Discord' : 'Connect Discord'}
              <ExternalLink className="h-3 w-3 ml-auto" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
            >
              <Mail className="h-4 w-4 mr-2" />
              {language === 'ru' ? 'Подписаться на email' : 'Subscribe to email'}
            </Button>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {language === 'ru' ? 'Совет дня' : 'Tip of the day'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {language === 'ru' 
                ? 'Участвуйте в голосованиях DAO, чтобы влиять на развитие проекта и получать дополнительные награды.'
                : 'Participate in DAO votes to influence project development and earn additional rewards.'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}