// User profile types for DAOsail application

import { AssistantType } from './assistants';

export type UserRole = 'Интересующийся' | 'Пассажир' | 'Матрос';

export interface UserStats {
  questionsAsked: number;
  lessonsCompleted: number;
  articlesRead: number;
  communityMessages: number;
  lastLoginDate: Date;
  totalLogins: number;
}

export interface UserAchievement {
  id: string;
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  iconName: string;
  unlockedAt: Date;
  category: 'learning' | 'community' | 'progress' | 'special';
}

export interface RoleProgress {
  currentRole: UserRole;
  nextRole?: UserRole;
  progressPercentage: number;
  requirementsForNext?: {
    questionsRequired?: number;
    lessonsRequired?: number;
    articlesRequired?: number;
    communityRequired?: number;
  };
}

export interface UserProfile {
  // Basic info
  id: string;
  email: string;
  fullName: string;
  nickname?: string;
  avatarUrl?: string;
  city?: string;
  bio?: string;

  // Role and progress
  role: UserRole;
  joinDate: Date;
  roleProgress: RoleProgress;

  // Statistics
  stats: UserStats;

  // Achievements
  achievements: UserAchievement[];

  // Recent activity
  recentChats: ChatActivity[];
}

export interface ChatActivity {
  id: string;
  title: string;
  date: Date;
  assistantType: AssistantType;
  messagesCount: number;
  mainTopic: string;
}

// Role configurations
export interface RoleConfig {
  role: UserRole;
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  permissions: string[];
  nextRole?: UserRole;
  requirements?: {
    questionsRequired?: number;
    lessonsRequired?: number;
    articlesRequired?: number;
    communityRequired?: number;
  };
}

// Daily tip
export interface DailyTip {
  id: string;
  date: string; // YYYY-MM-DD format
  tip: string;
  tipRu: string;
  category: 'navigation' | 'learning' | 'community' | 'general';
}