import { createClient } from '@/lib/supabase/client';
import type { AccessRole } from '@/lib/supabase/types';
import type { AssistantType } from '@/lib/types/assistants';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  assistantType?: AssistantType;
  model?: string;
  metadata?: {
    userRole?: string;
    knowledgeChunksUsed?: number;
    accessLevel?: AccessRole;
  };
}

export interface ChatResponse {
  message: ChatMessage;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  assistantType: AssistantType;
  assistantRole?: string;
  accessLevel?: AccessRole;
  tokensUsed?: number;
  knowledgeChunksUsed?: number;
  created_at: string;
  updated_at: string;
}

export class ChatService {
  private supabase = createClient();

  // Отправка сообщения к ИИ с учетом роли пользователя
  async sendMessage(
    messages: ChatMessage[],
    assistantType: AssistantType = 'navigator',
    userRole: string = 'Интересующийся',
    userId?: string
  ): Promise<ChatResponse> {
    try {
      console.log('Sending chat message:', {
        messagesCount: messages.length,
        assistantType,
        userRole,
        userId,
        lastMessage: messages[messages.length - 1]?.content?.substring(0, 100)
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          assistantType,
          userRole,
          userId
        }),
      });

      if (!response.ok) {
        console.error('Chat API response not ok:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });

        let errorData;
        try {
          errorData = await response.json();
          console.error('Chat API error data:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          const responseText = await response.text().catch(() => 'Could not read response text');
          console.error('Raw response:', responseText);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }

        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('ChatService.sendMessage error:', error);
      throw error;
    }
  }

  // Создание новой сессии чата с роль-информацией
  async createChatSession(
    title: string,
    assistantType: 'navigator' | 'skipper' = 'navigator',
    userRole: string = 'Интересующийся'
  ): Promise<string> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Определяем уровень доступа на основе роли
      const accessLevel = this.getUserAccessLevel(userRole);

      const { data, error } = await this.supabase
        .from('user_chats')
        .insert({
          user_id: user.id,
          title,
          assistant_type: assistantType,
          assistant_role: assistantType === 'navigator' ? 'Навигатор' : 'Шкипер',
          access_level: accessLevel,
          messages_count: 0,
          tokens_used: 0,
          knowledge_chunks_used: 0,
          last_activity: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat session:', error);
        throw error;
      }

      return data.id;

    } catch (error) {
      console.error('ChatService.createChatSession error:', error);
      throw error;
    }
  }

  // Определение уровня доступа по роли пользователя
  private getUserAccessLevel(userRole: string): AccessRole {
    const roleMapping: Record<string, AccessRole> = {
      'Интересующийся': 'public',
      'Пассажир': 'passenger',
      'Матрос': 'sailor',
      'Партнер': 'partner'
    };

    return roleMapping[userRole] || 'public';
  }

  // Получение истории чатов пользователя
  async getChatSessions(): Promise<ChatSession[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return [];

      // TODO: Загрузить из Supabase
      // Пока возвращаем пустой массив

      return [];

    } catch (error) {
      console.error('ChatService.getChatSessions error:', error);
      return [];
    }
  }

  // Получение конкретной сессии чата
  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;

      // TODO: Загрузить из Supabase

      return null;

    } catch (error) {
      console.error('ChatService.getChatSession error:', error);
      return null;
    }
  }

  // Сохранение отдельного сообщения в chat_messages
  async saveMessage(
    chatId: string,
    message: ChatMessage,
    tokensUsed: number = 0
  ): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await this.supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          user_id: user.id,
          role: message.role,
          content: message.content,
          metadata: message.metadata || {},
          tokens_used: tokensUsed
        });

      if (error) {
        console.error('Error saving message:', error);
        throw error;
      }

      // Обновляем статистику чата
      await this.updateChatStatistics(chatId, tokensUsed, message.metadata?.knowledgeChunksUsed || 0);

    } catch (error) {
      console.error('ChatService.saveMessage error:', error);
      throw error;
    }
  }

  // Обновление статистики чата
  async updateChatStatistics(
    chatId: string,
    additionalTokens: number,
    additionalChunks: number
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .rpc('increment_chat_stats', {
          chat_id: chatId,
          tokens_increment: additionalTokens,
          chunks_increment: additionalChunks
        });

      if (error) {
        // Если RPC функция не существует, обновляем вручную
        const { error: updateError } = await this.supabase
          .from('user_chats')
          .update({
            messages_count: 1, // Increment by 1
            tokens_used: additionalTokens, // Add to existing
            knowledge_chunks_used: additionalChunks, // Add to existing
            last_activity: new Date().toISOString()
          })
          .eq('id', chatId);

        if (updateError) {
          console.error('Error updating chat statistics:', updateError);
        }
      }

    } catch (error) {
      console.error('ChatService.updateChatStatistics error:', error);
    }
  }

  // Загрузка сообщений чата
  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading chat messages:', error);
        return [];
      }

      return data.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at,
        metadata: msg.metadata
      }));

    } catch (error) {
      console.error('ChatService.getChatMessages error:', error);
      return [];
    }
  }

  // Обновление заголовка чата на основе первого сообщения
  generateChatTitle(firstUserMessage: string, language: 'ru' | 'en' = 'ru'): string {
    // Обрезаем длинные сообщения
    const maxLength = 50;
    let title = firstUserMessage.trim();

    if (title.length > maxLength) {
      title = title.substring(0, maxLength) + '...';
    }

    // Удаляем лишние символы
    title = title.replace(/[^\w\s\u0400-\u04FF.-]/g, '');

    // Если заголовок пустой, даем дефолтный
    if (!title) {
      title = language === 'ru' ? 'Новый чат' : 'New Chat';
    }

    return title;
  }

  // Валидация сообщения
  validateMessage(message: string): { isValid: boolean; error?: string } {
    if (!message || typeof message !== 'string') {
      return { isValid: false, error: 'Message is required' };
    }

    if (message.trim().length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }

    if (message.length > 4000) {
      return { isValid: false, error: 'Message is too long (max 4000 characters)' };
    }

    return { isValid: true };
  }

  // Получение подсказок для быстрых вопросов
  getQuickQuestions(
    assistantType: 'navigator' | 'skipper',
    language: 'ru' | 'en' = 'ru'
  ): string[] {
    const questions = {
      navigator: {
        ru: [
          'Что такое парусный спорт?',
          'Как выбрать первую яхту?',
          'Основы морской навигации',
          'Как читать погодные карты?',
          'Планирование маршрута похода'
        ],
        en: [
          'What is sailing?',
          'How to choose your first yacht?',
          'Marine navigation basics',
          'How to read weather charts?',
          'Planning a sailing route'
        ]
      },
      skipper: {
        ru: [
          'Безопасность на воде',
          'Управление экипажем',
          'Процедуры экстренных ситуаций',
          'Швартовка и постановка на якорь',
          'Тактика регат'
        ],
        en: [
          'Water safety',
          'Crew management',
          'Emergency procedures',
          'Docking and anchoring',
          'Racing tactics'
        ]
      }
    };

    return questions[assistantType][language] || questions.navigator.ru;
  }
}

// Экспортируем синглтон
export const chatService = new ChatService();