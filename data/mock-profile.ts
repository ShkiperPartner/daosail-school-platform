import type {
  UserProfile,
  UserAchievement,
  ChatActivity,
  DailyTip
} from '@/lib/types/profile';
import { calculateRoleProgress } from '@/lib/config/roles';

// Mock user achievements
export const mockAchievements: UserAchievement[] = [
  {
    id: '1',
    title: 'First Question',
    titleRu: 'Первый вопрос',
    description: 'Asked your first question to an assistant',
    descriptionRu: 'Задал свой первый вопрос ассистенту',
    iconName: 'MessageCircle',
    unlockedAt: new Date('2024-01-15T10:30:00'),
    category: 'learning'
  },
  {
    id: '2',
    title: 'Learning Started',
    titleRu: 'Обучение начато',
    description: 'Completed first lesson in Beginner Sailor course',
    descriptionRu: 'Прошел первый урок курса "Начинающий яхтсмен"',
    iconName: 'BookOpen',
    unlockedAt: new Date('2024-01-16T14:20:00'),
    category: 'learning'
  },
  {
    id: '3',
    title: 'Explorer',
    titleRu: 'Исследователь',
    description: 'Read 5 articles from Library/FAQ',
    descriptionRu: 'Прочитал 5 статей из Библиотеки/FAQ',
    iconName: 'Search',
    unlockedAt: new Date('2024-01-18T09:45:00'),
    category: 'progress'
  }
];

// Mock recent chat activities
export const mockRecentChats: ChatActivity[] = [
  {
    id: '1',
    title: 'Основы навигации',
    date: new Date('2024-01-20T16:30:00'),
    assistantType: 'navigator',
    messagesCount: 12,
    mainTopic: 'navigation'
  },
  {
    id: '2',
    title: 'Правила безопасности на воде',
    date: new Date('2024-01-19T11:15:00'),
    assistantType: 'sailing_coach',
    messagesCount: 8,
    mainTopic: 'safety'
  },
  {
    id: '3',
    title: 'Подготовка к сезону',
    date: new Date('2024-01-17T14:45:00'),
    assistantType: 'steward',
    messagesCount: 15,
    mainTopic: 'preparation'
  }
];

// Mock daily tips
export const mockDailyTips: DailyTip[] = [
  {
    id: '1',
    date: '2024-01-21',
    tip: 'Always check weather conditions before heading out on the water',
    tipRu: 'Всегда проверяйте погодные условия перед выходом на воду',
    category: 'navigation'
  },
  {
    id: '2',
    date: '2024-01-22',
    tip: 'Practice knot tying regularly - it could save your life',
    tipRu: 'Регулярно практикуйте вязание узлов - это может спасти вашу жизнь',
    category: 'general'
  },
  {
    id: '3',
    date: '2024-01-23',
    tip: 'Join our community discussions to learn from experienced sailors',
    tipRu: 'Присоединяйтесь к обсуждениям в сообществе, чтобы учиться у опытных яхтсменов',
    category: 'community'
  }
];

// Create mock user profile
export function createMockUserProfile(email: string, fullName: string): UserProfile {
  const stats = {
    questionsAsked: 7,
    lessonsCompleted: 1,
    articlesRead: 5,
    communityMessages: 3,
    lastLoginDate: new Date(),
    totalLogins: 12
  };

  const currentRole = 'Интересующийся' as const;
  const progressPercentage = calculateRoleProgress(currentRole, stats);

  return {
    id: 'mock-user-1',
    email,
    fullName,
    nickname: fullName.split(' ')[0],
    avatarUrl: undefined,
    city: '',
    bio: 'Начинающий яхтсмен, интересуюсь парусным спортом и морскими путешествиями.',

    role: currentRole,
    joinDate: new Date('2024-01-15T08:00:00'),
    roleProgress: {
      currentRole,
      nextRole: 'Пассажир',
      progressPercentage,
      requirementsForNext: {
        questionsRequired: 10,
        lessonsRequired: 2,
        articlesRequired: 5
      }
    },

    stats,
    achievements: mockAchievements,
    recentChats: mockRecentChats
  };
}

// Get daily tip for today
export function getTodaysTip(language: 'en' | 'ru' = 'ru'): DailyTip {
  const today = new Date().toISOString().split('T')[0];

  // Find tip for today, or return a random one
  const todaysTip = mockDailyTips.find(tip => tip.date === today) ||
                   mockDailyTips[Math.floor(Math.random() * mockDailyTips.length)];

  return todaysTip;
}