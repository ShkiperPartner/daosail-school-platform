import { createClient } from './client';
import type {
  Database,
  ProfileUpdate,
  UserStatsUpdate,
  FullUserProfile,
  UserAchievementInsert,
  UserChatInsert
} from './types';
import type { UserProfile, UserRole } from '../types/profile';

export class ProfileService {
  private supabase = createClient();

  // Получение полного профиля пользователя
  async getFullProfile(userId: string): Promise<FullUserProfile | null> {
    try {
      // Параллельно загружаем все данные профиля
      const [profileResult, statsResult, achievementsResult, chatsResult] = await Promise.all([
        this.supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),

        this.supabase
          .from('user_stats')
          .select('*')
          .eq('id', userId)
          .single(),

        this.supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', userId)
          .order('unlocked_at', { ascending: false }),

        this.supabase
          .from('user_chats')
          .select('*')
          .eq('user_id', userId)
          .order('last_activity', { ascending: false })
          .limit(10)
      ]);

      if (profileResult.error || statsResult.error) {
        console.error('Profile service error details:', {
          profileError: profileResult.error,
          statsError: statsResult.error,
          achievementsError: achievementsResult.error,
          chatsError: chatsResult.error
        });
        return null;
      }

      return {
        profile: profileResult.data,
        stats: statsResult.data,
        achievements: achievementsResult.data || [],
        recentChats: chatsResult.data || []
      };

    } catch (error) {
      console.error('Error fetching full profile:', error);
      return null;
    }
  }

  // Преобразование из Supabase формата в формат приложения
  transformToAppProfile(fullProfile: FullUserProfile): UserProfile {
    const { profile, stats, achievements, recentChats } = fullProfile;

    return {
      id: profile.id,
      email: profile.email || '', // ✅ Теперь берем email из таблицы profiles
      fullName: profile.full_name,
      nickname: profile.nickname || undefined,
      avatarUrl: profile.avatar_url || undefined,
      city: profile.city || undefined,
      bio: profile.bio || undefined,
      role: profile.role,
      joinDate: new Date(profile.join_date),
      roleProgress: {
        currentRole: profile.role,
        nextRole: this.getNextRole(profile.role),
        progressPercentage: this.calculateRoleProgress(profile.role, stats),
        requirementsForNext: this.getRequirementsForNextRole(profile.role)
      },
      stats: {
        questionsAsked: stats.questions_asked,
        lessonsCompleted: stats.lessons_completed,
        articlesRead: stats.articles_read,
        communityMessages: stats.community_messages,
        lastLoginDate: new Date(stats.last_login_date),
        totalLogins: stats.total_logins
      },
      achievements: achievements.map(achievement => ({
        id: achievement.achievement_id,
        title: achievement.title,
        titleRu: achievement.title_ru,
        description: achievement.description,
        descriptionRu: achievement.description_ru,
        iconName: achievement.icon_name,
        unlockedAt: new Date(achievement.unlocked_at),
        category: achievement.category
      })),
      recentChats: recentChats.map(chat => ({
        id: chat.id,
        title: chat.title,
        date: new Date(chat.last_activity),
        assistantType: chat.assistant_type as any,
        messagesCount: chat.messages_count,
        mainTopic: chat.main_topic || 'general'
      }))
    };
  }

  // Обновление профиля
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }

  // Обновление статистики
  async updateStats(userId: string, updates: UserStatsUpdate): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_stats')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('Error updating stats:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating stats:', error);
      return false;
    }
  }

  // Инкремент статистики
  async incrementStat(userId: string, statName: keyof UserStatsUpdate): Promise<boolean> {
    try {
      // Получаем текущие значения
      const { data: currentStats, error: fetchError } = await this.supabase
        .from('user_stats')
        .select(statName)
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching current stats:', fetchError);
        return false;
      }

      // Увеличиваем значение на 1
      const currentValue = (currentStats as any)[statName] || 0;
      const updates = {
        [statName]: currentValue + 1,
        updated_at: new Date().toISOString()
      } as UserStatsUpdate;

      return await this.updateStats(userId, updates);

    } catch (error) {
      console.error('Error incrementing stat:', error);
      return false;
    }
  }

  // Добавление достижения
  async addAchievement(userId: string, achievement: Omit<UserAchievementInsert, 'user_id'>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_achievements')
        .insert({
          ...achievement,
          user_id: userId
        });

      if (error) {
        // Игнорируем ошибку дублирования (409 Conflict)
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          console.log('Achievement already exists, skipping...');
          return true; // Считаем успешным, так как достижение уже есть
        }
        console.error('Error adding achievement:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error adding achievement:', error);
      return false;
    }
  }

  // Добавление чата в историю
  async addChatToHistory(userId: string, chat: Omit<UserChatInsert, 'user_id'>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_chats')
        .insert({
          ...chat,
          user_id: userId
        });

      if (error) {
        console.error('Error adding chat to history:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error adding chat to history:', error);
      return false;
    }
  }

  // Загрузка аватара
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return null;
      }

      // Получаем публичный URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Обновляем профиль с новым URL аватара
      await this.updateProfile(userId, { avatar_url: publicUrl });

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  }

  // Подписка на изменения профиля
  subscribeToProfile(userId: string, callback: (profile: FullUserProfile | null) => void) {
    const channel = this.supabase
      .channel('profile-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`
      }, () => {
        this.getFullProfile(userId).then(callback);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_stats',
        filter: `id=eq.${userId}`
      }, () => {
        this.getFullProfile(userId).then(callback);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_achievements',
        filter: `user_id=eq.${userId}`
      }, () => {
        this.getFullProfile(userId).then(callback);
      })
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }

  // Проверка и автоматическое повышение роли
  async checkAndPromoteRole(userId: string): Promise<string | null> {
    try {
      const fullProfile = await this.getFullProfile(userId);
      if (!fullProfile) return null;

      const { profile, stats } = fullProfile;
      const currentRole = profile.role;
      const nextRole = this.getNextRole(currentRole);

      if (!nextRole) return null; // Уже максимальная роль

      const requirements = this.getRequirementsForNextRole(currentRole);
      if (!requirements) return null;

      // Проверяем все требования для повышения
      const meetsRequirements = this.checkRoleRequirements(stats, requirements);

      if (meetsRequirements) {
        // Повышаем роль
        const success = await this.updateProfile(userId, { role: nextRole });
        if (success) {
          console.log(`🎖️ Role promoted: ${currentRole} → ${nextRole}`);
          return nextRole;
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking role promotion:', error);
      return null;
    }
  }

  // Проверка требований для роли
  private checkRoleRequirements(stats: any, requirements: any): boolean {
    if (requirements.questionsRequired && stats.questions_asked < requirements.questionsRequired) {
      return false;
    }
    if (requirements.lessonsRequired && stats.lessons_completed < requirements.lessonsRequired) {
      return false;
    }
    if (requirements.articlesRequired && stats.articles_read < requirements.articlesRequired) {
      return false;
    }
    if (requirements.communityRequired && stats.community_messages < requirements.communityRequired) {
      return false;
    }
    return true;
  }

  // Вспомогательные методы
  private getNextRole(currentRole: string): UserRole | undefined {
    const roleProgression: Record<string, UserRole | undefined> = {
      'Интересующийся': 'Пассажир',
      'Пассажир': 'Матрос',
      'Матрос': undefined
    };
    return roleProgression[currentRole] || undefined;
  }

  private calculateRoleProgress(role: string, stats: any): number {
    // Логика расчета прогресса на основе статистики
    const requirements = this.getRequirementsForNextRole(role);
    if (!requirements) return 100;

    let totalProgress = 0;
    let criteriaCount = 0;

    if (requirements.questionsRequired) {
      totalProgress += Math.min(100, (stats.questions_asked / requirements.questionsRequired) * 100);
      criteriaCount++;
    }
    if (requirements.lessonsRequired) {
      totalProgress += Math.min(100, (stats.lessons_completed / requirements.lessonsRequired) * 100);
      criteriaCount++;
    }
    if (requirements.articlesRequired) {
      totalProgress += Math.min(100, (stats.articles_read / requirements.articlesRequired) * 100);
      criteriaCount++;
    }

    return criteriaCount > 0 ? Math.round(totalProgress / criteriaCount) : 0;
  }

  private getRequirementsForNextRole(role: string): { questionsRequired?: number; lessonsRequired?: number; articlesRequired?: number; communityRequired?: number; } | undefined {
    const requirements: Record<string, { questionsRequired?: number; lessonsRequired?: number; articlesRequired?: number; communityRequired?: number; } | undefined> = {
      'Интересующийся': { questionsRequired: 10, lessonsRequired: 2, articlesRequired: 5 },
      'Пассажир': { questionsRequired: 25, lessonsRequired: 5, articlesRequired: 10, communityRequired: 10 },
      'Матрос': undefined
    };
    return requirements[role] || undefined;
  }
}

// Экспортируем синглтон
export const profileService = new ProfileService();