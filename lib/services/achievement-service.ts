import { profileService } from '@/lib/supabase/profile-service';
import type { UserProfile } from '@/lib/types/profile';

export interface AchievementTemplate {
  id: string;
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  iconName: string;
  category: string;
  checkCondition: (profile: UserProfile) => boolean;
}

// Предопределенные достижения
const ACHIEVEMENT_TEMPLATES: AchievementTemplate[] = [
  {
    id: 'first_question',
    title: 'First Question',
    titleRu: 'Первый вопрос',
    description: 'Asked your first question to the AI consultant',
    descriptionRu: 'Задал первый вопрос ИИ-консультанту',
    iconName: 'MessageSquare',
    category: 'progress',
    checkCondition: (profile) => profile.stats.questionsAsked >= 1
  },
  {
    id: 'curious_explorer',
    title: 'Curious Explorer',
    titleRu: 'Любознательный исследователь',
    description: 'Asked 10 questions to learn more about sailing',
    descriptionRu: 'Задал 10 вопросов, изучая парусный спорт',
    iconName: 'Compass',
    category: 'progress',
    checkCondition: (profile) => profile.stats.questionsAsked >= 10
  },
  {
    id: 'inquisitive_mind',
    title: 'Inquisitive Mind',
    titleRu: 'Пытливый ум',
    description: 'Asked 25 questions - your curiosity knows no bounds!',
    descriptionRu: 'Задал 25 вопросов - твоему любопытству нет границ!',
    iconName: 'Brain',
    category: 'progress',
    checkCondition: (profile) => profile.stats.questionsAsked >= 25
  },
  {
    id: 'first_lesson',
    title: 'First Steps',
    titleRu: 'Первые шаги',
    description: 'Completed your first sailing lesson',
    descriptionRu: 'Прошел первый урок по парусному спорту',
    iconName: 'BookOpen',
    category: 'learning',
    checkCondition: (profile) => profile.stats.lessonsCompleted >= 1
  },
  {
    id: 'dedicated_learner',
    title: 'Dedicated Learner',
    titleRu: 'Прилежный ученик',
    description: 'Completed 5 lessons - you\'re making great progress!',
    descriptionRu: 'Прошел 5 уроков - отличный прогресс!',
    iconName: 'GraduationCap',
    category: 'learning',
    checkCondition: (profile) => profile.stats.lessonsCompleted >= 5
  },
  {
    id: 'knowledge_seeker',
    title: 'Knowledge Seeker',
    titleRu: 'Искатель знаний',
    description: 'Read 10 articles about sailing and maritime topics',
    descriptionRu: 'Прочитал 10 статей о парусном спорте и морских темах',
    iconName: 'FileText',
    category: 'learning',
    checkCondition: (profile) => profile.stats.articlesRead >= 10
  },
  {
    id: 'community_member',
    title: 'Community Member',
    titleRu: 'Член сообщества',
    description: 'Participated in community discussions',
    descriptionRu: 'Принял участие в обсуждениях сообщества',
    iconName: 'Users',
    category: 'community',
    checkCondition: (profile) => profile.stats.communityMessages >= 1
  },
  {
    id: 'active_contributor',
    title: 'Active Contributor',
    titleRu: 'Активный участник',
    description: 'Posted 10 messages in community discussions',
    descriptionRu: 'Написал 10 сообщений в обсуждениях сообщества',
    iconName: 'MessageCircle',
    category: 'community',
    checkCondition: (profile) => profile.stats.communityMessages >= 10
  },
  {
    id: 'early_adopter',
    title: 'Early Adopter',
    titleRu: 'Ранний пользователь',
    description: 'Joined DAOsail in its early stages',
    descriptionRu: 'Присоединился к DAOsail на раннем этапе',
    iconName: 'Zap',
    category: 'special',
    checkCondition: (profile) => {
      const joinDate = new Date(profile.joinDate);
      const earlyDate = new Date('2025-01-01'); // Ранние пользователи до 2025
      return joinDate < earlyDate;
    }
  },
  {
    id: 'loyal_user',
    title: 'Loyal User',
    titleRu: 'Верный пользователь',
    description: 'Logged in for 7 consecutive days',
    descriptionRu: 'Заходил в систему 7 дней подряд',
    iconName: 'Calendar',
    category: 'progress',
    checkCondition: (profile) => profile.stats.totalLogins >= 7
  },
  {
    id: 'role_promotion_passenger',
    title: 'Welcome Aboard!',
    titleRu: 'Добро пожаловать на борт!',
    description: 'Advanced to Passenger rank',
    descriptionRu: 'Получил звание Пассажира',
    iconName: 'Ship',
    category: 'progression',
    checkCondition: (profile) => profile.role === 'Пассажир' || profile.role === 'Матрос'
  },
  {
    id: 'role_promotion_sailor',
    title: 'True Sailor',
    titleRu: 'Настоящий матрос',
    description: 'Advanced to Sailor rank - you\'re now part of the crew!',
    descriptionRu: 'Получил звание Матроса - теперь ты часть экипажа!',
    iconName: 'Anchor',
    category: 'progression',
    checkCondition: (profile) => profile.role === 'Матрос'
  }
];

export class AchievementService {
  // Проверка и добавление новых достижений
  async checkAndAddAchievements(userId: string, profile: UserProfile): Promise<string[]> {
    const newAchievements: string[] = [];
    const existingAchievementIds = profile.achievements.map(a => a.id);

    for (const template of ACHIEVEMENT_TEMPLATES) {
      // Пропускаем уже полученные достижения
      if (existingAchievementIds.includes(template.id)) continue;

      // Проверяем условие получения
      if (template.checkCondition(profile)) {
        try {
          const success = await profileService.addAchievement(userId, {
            achievement_id: template.id,
            title: template.title,
            title_ru: template.titleRu,
            description: template.description,
            description_ru: template.descriptionRu,
            icon_name: template.iconName,
            category: template.category as 'learning' | 'community' | 'progress' | 'special',
            unlocked_at: new Date().toISOString()
          });

          if (success) {
            newAchievements.push(template.id);
            console.log(`🏆 Achievement unlocked: ${template.title} (${template.titleRu})`);
          }
        } catch (error) {
          console.error(`Error adding achievement ${template.id}:`, error);
        }
      }
    }

    return newAchievements;
  }

  // Получение всех шаблонов достижений
  getAllTemplates(): AchievementTemplate[] {
    return ACHIEVEMENT_TEMPLATES;
  }

  // Получение шаблона по ID
  getTemplate(id: string): AchievementTemplate | undefined {
    return ACHIEVEMENT_TEMPLATES.find(t => t.id === id);
  }

  // Получение доступных достижений для роли
  getAvailableForRole(role: string): AchievementTemplate[] {
    // Базовые достижения доступны всем
    const baseAchievements = ACHIEVEMENT_TEMPLATES.filter(t =>
      t.category !== 'progression' ||
      (t.id === 'role_promotion_passenger' && role !== 'Интересующийся') ||
      (t.id === 'role_promotion_sailor' && role === 'Матрос')
    );

    return baseAchievements;
  }

  // Проверка прогресса для достижения
  getProgressForAchievement(id: string, profile: UserProfile): { current: number; target: number; percentage: number } | null {
    const template = this.getTemplate(id);
    if (!template) return null;

    // Определяем прогресс на основе типа достижения
    if (id.includes('question')) {
      const target = id === 'first_question' ? 1 : id === 'curious_explorer' ? 10 : 25;
      return {
        current: profile.stats.questionsAsked,
        target,
        percentage: Math.min(100, (profile.stats.questionsAsked / target) * 100)
      };
    }

    if (id.includes('lesson')) {
      const target = id === 'first_lesson' ? 1 : 5;
      return {
        current: profile.stats.lessonsCompleted,
        target,
        percentage: Math.min(100, (profile.stats.lessonsCompleted / target) * 100)
      };
    }

    if (id.includes('article') || id === 'knowledge_seeker') {
      return {
        current: profile.stats.articlesRead,
        target: 10,
        percentage: Math.min(100, (profile.stats.articlesRead / 10) * 100)
      };
    }

    if (id.includes('community')) {
      const target = id === 'community_member' ? 1 : 10;
      return {
        current: profile.stats.communityMessages,
        target,
        percentage: Math.min(100, (profile.stats.communityMessages / target) * 100)
      };
    }

    if (id === 'loyal_user') {
      return {
        current: profile.stats.totalLogins,
        target: 7,
        percentage: Math.min(100, (profile.stats.totalLogins / 7) * 100)
      };
    }

    return null;
  }
}

// Экспортируем синглтон
export const achievementService = new AchievementService();