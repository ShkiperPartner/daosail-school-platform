import { createClient } from '@/lib/supabase/client';
import { ChatMessage } from '@/lib/services/chat-service';

export interface ChatSession {
  sessionId: string;
  title: string;
  assistantType: string;
  messagesCount: number;
  lastActivity: string;
  createdAt: string;
}

export interface PersistentChatMessage extends ChatMessage {
  id?: string;
  tokenCount?: number;
  metadata?: Record<string, any>;
}

export class PersistentChatService {
  private supabase = createClient();

  /**
   * Создает новую сессию чата
   */
  async createChatSession(
    title: string,
    assistantType: string,
    userId?: string
  ): Promise<string> {
    if (!userId) {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      userId = user.id;
    }

    // Вставка в таблицу user_chats согласно реальной схеме
    const { data, error } = await this.supabase
      .from('user_chats')
      .insert({
        user_id: userId,
        title: title,
        assistant_type: assistantType,
        messages_count: 0,
        last_activity: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating chat session:', error);
      throw new Error(`Failed to create chat session: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Сохраняет сообщение в чат
   */
  async saveMessage(
    sessionId: string,
    message: PersistentChatMessage,
    userId?: string
  ): Promise<string> {
    if (!userId) {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      userId = user.id;
    }

    // Теперь sessionId это на самом деле chat ID (user_chats.id)
    // Проверяем что чат принадлежит пользователю
    const { data: chatData, error: chatError } = await this.supabase
      .from('user_chats')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (chatError || !chatData) {
      console.error('Error finding chat session:', chatError);
      throw new Error('Chat session not found or access denied');
    }

    // Временное решение: прямая вставка в таблицу chat_messages
    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert({
        chat_session_id: chatData.id,
        user_id: userId,
        role: message.role,
        content: message.content,
        assistant_type: message.assistantType || null,
        model: message.model || null,
        token_count: message.tokenCount || 0,
        metadata: message.metadata || {}
      })
      .select('id')
      .single();

    if (error) {
      console.warn('Database not fully configured for message storage:', error);
      // Временное решение: возвращаем mock ID
      return crypto.randomUUID();
    }

    // Обновляем статистику чата (без подсчета пока)
    await this.supabase
      .from('user_chats')
      .update({
        last_activity: new Date().toISOString()
      })
      .eq('id', chatData.id);

    return data.id;
  }

  /**
   * Вспомогательная функция для подсчета сообщений
   */
  private async getMessageCount(chatSessionId: string): Promise<number> {
    const { count } = await this.supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('chat_session_id', chatSessionId);

    return count || 0;
  }

  /**
   * Загружает историю чата
   */
  async getChatHistory(
    sessionId: string,
    userId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PersistentChatMessage[]> {
    if (!userId) {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      userId = user.id;
    }

    // Прямой запрос по chat_session_id (который теперь sessionId)
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select(`
        id,
        role,
        content,
        assistant_type,
        model,
        metadata,
        created_at
      `)
      .eq('chat_session_id', sessionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error loading chat history:', error);
      throw new Error(`Failed to load chat history: ${error.message}`);
    }

    return data.map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.created_at,
      assistantType: msg.assistant_type,
      model: msg.model,
      metadata: msg.metadata
    }));
  }

  /**
   * Получает список всех чатов пользователя
   */
  async getUserChatSessions(
    userId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ChatSession[]> {
    if (!userId) {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      userId = user.id;
    }

    // Прямой запрос к таблице user_chats, возвращаем id как sessionId
    const { data, error } = await this.supabase
      .from('user_chats')
      .select('id, title, assistant_type, messages_count, last_activity, created_at')
      .eq('user_id', userId)
      .order('last_activity', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error loading chat sessions:', error);
      throw new Error(`Failed to load chat sessions: ${error.message}`);
    }

    return data.map((session: any) => ({
      sessionId: session.id,
      title: session.title,
      assistantType: session.assistant_type,
      messagesCount: session.messages_count,
      lastActivity: session.last_activity,
      createdAt: session.created_at
    }));
  }

  /**
   * Обновляет заголовок чата
   */
  async updateChatTitle(
    sessionId: string,
    newTitle: string,
    userId?: string
  ): Promise<void> {
    if (!userId) {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      userId = user.id;
    }

    const { error } = await this.supabase
      .from('user_chats')
      .update({ title: newTitle })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating chat title:', error);
      throw new Error(`Failed to update chat title: ${error.message}`);
    }
  }

  /**
   * Архивирует чат
   */
  async archiveChatSession(
    sessionId: string,
    userId?: string
  ): Promise<void> {
    if (!userId) {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      userId = user.id;
    }

    const { error } = await this.supabase
      .from('user_chats')
      .update({ status: 'archived' })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error archiving chat session:', error);
      throw new Error(`Failed to archive chat session: ${error.message}`);
    }
  }

  /**
   * Удаляет чат
   */
  async deleteChatSession(
    sessionId: string,
    userId?: string
  ): Promise<void> {
    if (!userId) {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      userId = user.id;
    }

    const { error } = await this.supabase
      .from('user_chats')
      .update({ status: 'deleted' })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting chat session:', error);
      throw new Error(`Failed to delete chat session: ${error.message}`);
    }
  }

  /**
   * Подсчитывает общее количество сообщений пользователя
   */
  async getTotalUserMessages(userId?: string): Promise<number> {
    if (!userId) {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      userId = user.id;
    }

    const { count, error } = await this.supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('role', 'user');

    if (error) {
      console.error('Error counting user messages:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Экспортирует чат в JSON формат
   */
  async exportChatSession(
    sessionId: string,
    userId?: string
  ): Promise<{
    session: ChatSession;
    messages: PersistentChatMessage[];
  }> {
    if (!userId) {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      userId = user.id;
    }

    // Получаем информацию о сессии
    const sessions = await this.getUserChatSessions(userId);
    const session = sessions.find(s => s.sessionId === sessionId);

    if (!session) {
      throw new Error('Chat session not found');
    }

    // Получаем все сообщения чата
    const messages = await this.getChatHistory(sessionId, userId, 1000);

    return { session, messages };
  }

  /**
   * Импортирует чат из JSON формата
   */
  async importChatSession(
    chatData: {
      session: Omit<ChatSession, 'sessionId' | 'createdAt' | 'lastActivity'>;
      messages: Omit<PersistentChatMessage, 'id' | 'timestamp'>[];
    },
    userId?: string
  ): Promise<string> {
    if (!userId) {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      userId = user.id;
    }

    // Создаем новую сессию
    const sessionId = await this.createChatSession(
      `${chatData.session.title} (Imported)`,
      chatData.session.assistantType,
      userId
    );

    // Импортируем сообщения
    for (const message of chatData.messages) {
      await this.saveMessage(sessionId, {
        ...message,
        timestamp: new Date().toISOString()
      }, userId);
    }

    return sessionId;
  }
}

// Экспортируем singleton instance
export const persistentChatService = new PersistentChatService();