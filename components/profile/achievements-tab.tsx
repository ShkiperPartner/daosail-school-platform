'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Calendar,
  MessageCircle,
  BookOpen,
  Search,
  Users,
  Star,
  Award,
  Target,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useAppContext } from '@/lib/contexts/app-context';
import type { UserAchievement } from '@/lib/types/profile';

export function AchievementsTab() {
  const { language, userProfile } = useAppContext();

  if (!userProfile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {language === 'ru' ? 'Загрузка достижений...' : 'Loading achievements...'}
        </p>
      </div>
    );
  }

  const { achievements, stats } = userProfile;

  // Available achievements (including locked ones)
  const allAchievements = [
    ...achievements,
    // Add more achievements based on stats
    ...generateProgressAchievements(stats, language)
  ];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getAchievementIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'MessageCircle': <MessageCircle className="h-8 w-8" />,
      'BookOpen': <BookOpen className="h-8 w-8" />,
      'Search': <Search className="h-8 w-8" />,
      'Users': <Users className="h-8 w-8" />,
      'Star': <Star className="h-8 w-8" />,
      'Award': <Award className="h-8 w-8" />,
      'Target': <Target className="h-8 w-8" />,
      'Zap': <Zap className="h-8 w-8" />
    };
    return icons[iconName] || <Trophy className="h-8 w-8" />;
  };

  const getCategoryColor = (category: UserAchievement['category']) => {
    const colors = {
      'learning': 'bg-blue-100 text-blue-800 border-blue-200',
      'community': 'bg-green-100 text-green-800 border-green-200',
      'progress': 'bg-purple-100 text-purple-800 border-purple-200',
      'special': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[category] || colors.progress;
  };

  const getCategoryIcon = (category: UserAchievement['category']) => {
    const icons = {
      'learning': <BookOpen className="h-4 w-4" />,
      'community': <Users className="h-4 w-4" />,
      'progress': <TrendingUp className="h-4 w-4" />,
      'special': <Star className="h-4 w-4" />
    };
    return icons[category] || icons.progress;
  };

  const groupedAchievements = allAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, UserAchievement[]>);

  const unlockedCount = achievements.length;
  const totalCount = allAchievements.length;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            {language === 'ru' ? 'Обзор достижений' : 'Achievements Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-yellow-600">{unlockedCount}</div>
              <div className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Достижений разблокировано' : 'Achievements Unlocked'}
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-orange-600">{totalCount - unlockedCount}</div>
              <div className="text-sm text-muted-foreground">
                {language === 'ru' ? 'В процессе' : 'In Progress'}
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-green-600">
                {Math.round((unlockedCount / totalCount) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Завершенность' : 'Completion'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Categories */}
      {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getCategoryIcon(category as UserAchievement['category'])}
              {getCategoryTitle(category as UserAchievement['category'], language)}
              <Badge variant="secondary" className="ml-2">
                {categoryAchievements.filter(a => achievements.find(ua => ua.id === a.id)).length} / {categoryAchievements.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAchievements.map((achievement) => {
                const isUnlocked = achievements.find(ua => ua.id === achievement.id);
                return (
                  <Card
                    key={achievement.id}
                    className={`transition-all duration-200 ${
                      isUnlocked
                        ? 'hover:shadow-md bg-gradient-to-br from-white to-gray-50'
                        : 'opacity-60 bg-muted/30'
                    }`}
                  >
                    <CardContent className="p-4 text-center space-y-3">
                      <div className={`mx-auto w-fit p-3 rounded-full ${
                        isUnlocked ? 'text-primary bg-primary/10' : 'text-muted-foreground bg-muted'
                      }`}>
                        {getAchievementIcon(achievement.iconName)}
                      </div>

                      <div className="space-y-2">
                        <h3 className={`font-semibold ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {language === 'ru' ? achievement.titleRu : achievement.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ru' ? achievement.descriptionRu : achievement.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getCategoryColor(achievement.category)}`}
                        >
                          {getCategoryTitle(achievement.category, language)}
                        </Badge>

                        {isUnlocked && achievement.unlockedAt && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(achievement.unlockedAt)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Achievement Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {language === 'ru' ? 'Прогресс к следующим достижениям' : 'Progress to Next Achievements'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getUpcomingAchievements(stats, language).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    {getAchievementIcon(item.iconName)}
                  </div>
                  <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {item.current} / {item.target}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((item.current / item.target) * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getCategoryTitle(category: UserAchievement['category'], language: 'en' | 'ru'): string {
  const titles = {
    'learning': { en: 'Learning', ru: 'Обучение' },
    'community': { en: 'Community', ru: 'Сообщество' },
    'progress': { en: 'Progress', ru: 'Прогресс' },
    'special': { en: 'Special', ru: 'Особые' }
  };
  return titles[category]?.[language] || category;
}

function generateProgressAchievements(stats: any, language: 'en' | 'ru'): UserAchievement[] {
  const progressAchievements: UserAchievement[] = [];

  // Questions milestone achievements
  const questionMilestones = [10, 25, 50, 100];
  questionMilestones.forEach(milestone => {
    if (stats.questionsAsked < milestone) {
      progressAchievements.push({
        id: `questions_${milestone}`,
        title: `${milestone} Questions`,
        titleRu: `${milestone} вопросов`,
        description: `Ask ${milestone} questions to AI assistants`,
        descriptionRu: `Задайте ${milestone} вопросов ИИ-ассистентам`,
        iconName: 'MessageCircle',
        unlockedAt: new Date(), // Will be set when unlocked
        category: 'progress'
      });
    }
  });

  // Lessons milestone achievements
  const lessonMilestones = [5, 10, 20];
  lessonMilestones.forEach(milestone => {
    if (stats.lessonsCompleted < milestone) {
      progressAchievements.push({
        id: `lessons_${milestone}`,
        title: `${milestone} Lessons`,
        titleRu: `${milestone} уроков`,
        description: `Complete ${milestone} learning lessons`,
        descriptionRu: `Пройдите ${milestone} обучающих уроков`,
        iconName: 'BookOpen',
        unlockedAt: new Date(),
        category: 'learning'
      });
    }
  });

  return progressAchievements.slice(0, 3); // Limit for display
}

function getUpcomingAchievements(stats: any, language: 'en' | 'ru') {
  return [
    {
      title: language === 'ru' ? 'Активный собеседник' : 'Active Conversationalist',
      description: language === 'ru' ? 'Задайте 10 вопросов' : 'Ask 10 questions',
      iconName: 'MessageCircle',
      current: stats.questionsAsked,
      target: 10
    },
    {
      title: language === 'ru' ? 'Начинающий ученик' : 'Beginning Student',
      description: language === 'ru' ? 'Пройдите 2 урока' : 'Complete 2 lessons',
      iconName: 'BookOpen',
      current: stats.lessonsCompleted,
      target: 2
    },
    {
      title: language === 'ru' ? 'Исследователь знаний' : 'Knowledge Explorer',
      description: language === 'ru' ? 'Прочитайте 5 статей' : 'Read 5 articles',
      iconName: 'Search',
      current: stats.articlesRead,
      target: 5
    }
  ].filter(item => item.current < item.target);
}