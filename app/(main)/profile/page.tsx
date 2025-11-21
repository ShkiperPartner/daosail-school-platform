'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  TrendingUp,
  Trophy
} from 'lucide-react';
import { useAppContext } from '@/lib/contexts/app-context';
import { ProfileInfoTab } from '@/components/profile/profile-info-tab';
import { MyPathTab } from '@/components/profile/my-path-tab';
import { AchievementsTab } from '@/components/profile/achievements-tab';

export default function ProfilePage() {
  const { language, userProfile, isAuthenticated } = useAppContext();

  // Redirect or show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {language === 'ru' ? 'Требуется авторизация' : 'Authentication Required'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ru'
            ? 'Войдите в свой аккаунт для просмотра профиля'
            : 'Please sign in to view your profile'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-brand to-primary bg-clip-text text-transparent">
            {language === 'ru' ? 'Мой профиль' : 'My Profile'}
          </h1>
          <p className="text-xl text-muted-foreground">
            {language === 'ru'
              ? 'Управляйте своим аккаунтом и отслеживайте прогресс'
              : 'Manage your account and track your progress'
            }
          </p>
        </div>

        {/* Main Content - Full Width */}
        <div className="w-full">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {language === 'ru' ? 'Профиль' : 'Profile'}
              </TabsTrigger>
              <TabsTrigger value="path" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {language === 'ru' ? 'Мой Путь' : 'My Path'}
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                {language === 'ru' ? 'Достижения' : 'Achievements'}
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="profile" className="space-y-6">
                <ProfileInfoTab />
              </TabsContent>

              <TabsContent value="path" className="space-y-6">
                <MyPathTab />
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6">
                <AchievementsTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}