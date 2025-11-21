// Типы для Supabase интеграции
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          nickname: string | null;
          avatar_url: string | null;
          city: string | null;
          bio: string | null;
          email: string | null;
          role: 'Интересующийся' | 'Пассажир' | 'Матрос';
          join_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          nickname?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          bio?: string | null;
          email?: string | null;
          role?: 'Интересующийся' | 'Пассажир' | 'Матрос';
          join_date?: string;
        };
        Update: {
          full_name?: string;
          nickname?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          bio?: string | null;
          email?: string | null;
          role?: 'Интересующийся' | 'Пассажир' | 'Матрос';
        };
      };
      user_stats: {
        Row: {
          id: string;
          questions_asked: number;
          lessons_completed: number;
          articles_read: number;
          community_messages: number;
          last_login_date: string;
          total_logins: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          questions_asked?: number;
          lessons_completed?: number;
          articles_read?: number;
          community_messages?: number;
          last_login_date?: string;
          total_logins?: number;
        };
        Update: {
          questions_asked?: number;
          lessons_completed?: number;
          articles_read?: number;
          community_messages?: number;
          last_login_date?: string;
          total_logins?: number;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          title: string;
          title_ru: string;
          description: string;
          description_ru: string;
          icon_name: string;
          category: 'learning' | 'community' | 'progress' | 'special';
          unlocked_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          achievement_id: string;
          title: string;
          title_ru: string;
          description: string;
          description_ru: string;
          icon_name: string;
          category: 'learning' | 'community' | 'progress' | 'special';
          unlocked_at?: string;
        };
        Update: {
          title?: string;
          title_ru?: string;
          description?: string;
          description_ru?: string;
          icon_name?: string;
          category?: 'learning' | 'community' | 'progress' | 'special';
        };
      };
      user_chats: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          assistant_type: string;
          main_topic: string | null;
          messages_count: number;
          last_activity: string;
          assistant_role: string;
          access_level: string;
          tokens_used: number;
          knowledge_chunks_used: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          assistant_type: string;
          main_topic?: string | null;
          messages_count?: number;
          last_activity?: string;
          assistant_role?: string;
          access_level?: string;
          tokens_used?: number;
          knowledge_chunks_used?: number;
        };
        Update: {
          title?: string;
          assistant_type?: string;
          main_topic?: string | null;
          messages_count?: number;
          last_activity?: string;
          assistant_role?: string;
          access_level?: string;
          tokens_used?: number;
          knowledge_chunks_used?: number;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          chat_id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          metadata: Record<string, any>;
          tokens_used: number;
          created_at: string;
        };
        Insert: {
          chat_id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          metadata?: Record<string, any>;
          tokens_used?: number;
        };
        Update: {
          content?: string;
          metadata?: Record<string, any>;
          tokens_used?: number;
        };
      };
      knowledge_documents: {
        Row: {
          id: string;
          title: string;
          content: string;
          source_type: string;
          source_url: string | null;
          file_path: string | null;
          language: string;
          category: string;
          embedding: number[] | null;
          access_roles: string[];
          target_audience: string;
          knowledge_level: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          content: string;
          source_type: string;
          source_url?: string | null;
          file_path?: string | null;
          language?: string;
          category?: string;
          embedding?: number[] | null;
          access_roles?: string[];
          target_audience?: string;
          knowledge_level?: string;
        };
        Update: {
          title?: string;
          content?: string;
          source_type?: string;
          source_url?: string | null;
          file_path?: string | null;
          language?: string;
          category?: string;
          embedding?: number[] | null;
          access_roles?: string[];
          target_audience?: string;
          knowledge_level?: string;
        };
      };
    };
  };
}

// Экспорт дополнительных типов
export type ChatMessageRow = Database['public']['Tables']['chat_messages']['Row'];
export type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];
export type ChatMessageUpdate = Database['public']['Tables']['chat_messages']['Update'];

export type KnowledgeDocumentRow = Database['public']['Tables']['knowledge_documents']['Row'];
export type KnowledgeDocumentInsert = Database['public']['Tables']['knowledge_documents']['Insert'];
export type KnowledgeDocumentUpdate = Database['public']['Tables']['knowledge_documents']['Update'];

// Роли доступа к знаниям
export type AccessRole = 'public' | 'passenger' | 'sailor' | 'partner' | 'admin';
export type KnowledgeLevel = 'basic' | 'intermediate' | 'advanced' | 'expert';
export type TargetAudience = 'general' | 'beginners' | 'advanced' | 'experts';

// Типы для работы с профилем
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type UserStatsRow = Database['public']['Tables']['user_stats']['Row'];
export type UserStatsInsert = Database['public']['Tables']['user_stats']['Insert'];
export type UserStatsUpdate = Database['public']['Tables']['user_stats']['Update'];

export type UserAchievementRow = Database['public']['Tables']['user_achievements']['Row'];
export type UserAchievementInsert = Database['public']['Tables']['user_achievements']['Insert'];

export type UserChatRow = Database['public']['Tables']['user_chats']['Row'];
export type UserChatInsert = Database['public']['Tables']['user_chats']['Insert'];
export type UserChatUpdate = Database['public']['Tables']['user_chats']['Update'];

// Полный профиль пользователя с данными из разных таблиц
export interface FullUserProfile {
  profile: ProfileRow;
  stats: UserStatsRow;
  achievements: UserAchievementRow[];
  recentChats: UserChatRow[];
}