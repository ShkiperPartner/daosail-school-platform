import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/client';
import type { AccessRole, KnowledgeLevel, TargetAudience } from '@/lib/supabase/types';

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  source_type: string;
  source_url?: string;
  category?: string;
  language: string;
  access_roles: string[];
  target_audience: string;
  knowledge_level: string;
  similarity?: number;
}

export interface SearchResult {
  documents: KnowledgeDocument[];
  query: string;
  totalResults: number;
}

export class EmbeddingService {
  private openai: OpenAI;
  private supabase = createClient();

  constructor() {
    // На frontend используем публичные методы без API ключа
    // Embeddings будут создаваться через API routes
    this.openai = new OpenAI({
      apiKey: 'dummy', // На frontend не используем напрямую
      dangerouslyAllowBrowser: false
    });
  }

  // Поиск релевантных документов в базе знаний с роль-фильтрацией
  async searchKnowledgeBase(
    query: string,
    options: {
      category?: string;
      language?: 'ru' | 'en';
      maxResults?: number;
      threshold?: number;
      userRole?: AccessRole;
      knowledgeLevel?: KnowledgeLevel;
      targetAudience?: TargetAudience;
    } = {}
  ): Promise<SearchResult> {
    try {
      const {
        category,
        language = 'ru',
        maxResults = 5,
        threshold = 0.78
      } = options;

      // Отправляем запрос к API для получения embedding и поиска
      const response = await fetch('/api/search-knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          category,
          language,
          maxResults,
          threshold,
          userRole: options.userRole,
          knowledgeLevel: options.knowledgeLevel,
          targetAudience: options.targetAudience
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        documents: data.documents,
        query,
        totalResults: data.documents.length
      };

    } catch (error) {
      console.error('EmbeddingService.searchKnowledgeBase error:', error);
      return {
        documents: [],
        query,
        totalResults: 0
      };
    }
  }

  // Добавление документа в базу знаний (через API)
  async addKnowledgeDocument(
    title: string,
    content: string,
    metadata: {
      sourceType: string;
      sourceUrl?: string;
      category?: string;
      language?: 'ru' | 'en';
      filePath?: string;
    }
  ): Promise<string | null> {
    try {
      const response = await fetch('/api/add-knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          ...metadata
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.id;

    } catch (error) {
      console.error('EmbeddingService.addKnowledgeDocument error:', error);
      return null;
    }
  }

  // Получение документов по категории
  async getDocumentsByCategory(
    category: string,
    language: 'ru' | 'en' = 'ru'
  ): Promise<KnowledgeDocument[]> {
    try {
      const { data, error } = await this.supabase
        .from('knowledge_documents')
        .select('id, title, content, source_type, source_url, category, language')
        .eq('category', category)
        .eq('language', language)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents by category:', error);
        return [];
      }

      return (data || []) as KnowledgeDocument[];

    } catch (error) {
      console.error('EmbeddingService.getDocumentsByCategory error:', error);
      return [];
    }
  }

  // Получение всех категорий
  async getCategories(language: 'ru' | 'en' = 'ru'): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('knowledge_documents')
        .select('category')
        .eq('language', language)
        .not('category', 'is', null);

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      // Убираем дубликаты и null значения
      const categories = Array.from(
        new Set(data?.map(item => item.category).filter(Boolean))
      );

      return categories;

    } catch (error) {
      console.error('EmbeddingService.getCategories error:', error);
      return [];
    }
  }

  // Валидация текста для поиска
  validateSearchQuery(query: string): { isValid: boolean; error?: string } {
    if (!query || typeof query !== 'string') {
      return { isValid: false, error: 'Query is required' };
    }

    if (query.trim().length < 3) {
      return { isValid: false, error: 'Query must be at least 3 characters long' };
    }

    if (query.length > 1000) {
      return { isValid: false, error: 'Query is too long (max 1000 characters)' };
    }

    return { isValid: true };
  }

  // Форматирование результатов поиска для отображения
  formatSearchResults(
    results: KnowledgeDocument[],
    maxLength: number = 200
  ): KnowledgeDocument[] {
    return results.map(doc => ({
      ...doc,
      content: doc.content.length > maxLength
        ? doc.content.substring(0, maxLength) + '...'
        : doc.content
    }));
  }

  // Получение разрешенных ролей доступа для пользователя
  getAccessibleRoles(userRole: string): AccessRole[] {
    const roleHierarchy: Record<string, AccessRole[]> = {
      'Интересующийся': ['public'],
      'Пассажир': ['public', 'passenger'],
      'Матрос': ['public', 'passenger', 'sailor'],
      'Партнер': ['public', 'passenger', 'sailor', 'partner'],
      'admin': ['public', 'passenger', 'sailor', 'partner', 'admin']
    };

    return roleHierarchy[userRole] || ['public'];
  }

  // Роль-основанный поиск знаний
  async searchKnowledgeByRole(
    query: string,
    userRole: string,
    options: {
      assistantType?: 'navigator' | 'skipper';
      language?: 'ru' | 'en';
      maxResults?: number;
    } = {}
  ): Promise<SearchResult> {
    const {
      assistantType = 'navigator',
      language = 'ru',
      maxResults = 5
    } = options;

    // Определяем доступные роли для пользователя
    const accessibleRoles = this.getAccessibleRoles(userRole);
    const primaryRole = accessibleRoles[accessibleRoles.length - 1];

    // Определяем категории для ассистента
    const categoryMap = {
      navigator: ['sailing_basics', 'navigation', 'weather', 'equipment'],
      skipper: ['safety', 'crew_management', 'emergency', 'racing']
    };

    const relevantCategories = categoryMap[assistantType];
    let allResults: KnowledgeDocument[] = [];

    // Ищем по категориям с учетом роли
    for (const category of relevantCategories) {
      const results = await this.searchKnowledgeBase(query, {
        category,
        language,
        maxResults: 2,
        threshold: 0.7,
        userRole: primaryRole
      });
      allResults.push(...results.documents);
    }

    // Убираем дубликаты и сортируем
    allResults = allResults
      .filter((doc, index, self) => index === self.findIndex(d => d.id === doc.id))
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, maxResults);

    return {
      documents: allResults,
      query,
      totalResults: allResults.length
    };
  }

  // Получение контекста для ИИ на основе роли пользователя
  async getContextForAI(
    query: string,
    userRole: string,
    assistantType: 'navigator' | 'skipper' = 'navigator',
    language: 'ru' | 'en' = 'ru'
  ): Promise<string> {
    try {
      // Используем роль-основанный поиск
      const results = await this.searchKnowledgeByRole(query, userRole, {
        assistantType,
        language,
        maxResults: 5
      });

      if (results.documents.length === 0) {
        return '';
      }

      // Формируем контекст для ИИ с указанием уровня доступа
      const accessibleRoles = this.getAccessibleRoles(userRole);
      const accessLevel = accessibleRoles[accessibleRoles.length - 1];

      const contextParts = results.documents.map(doc =>
        `**${doc.title}** (${doc.knowledge_level}, ${doc.target_audience})\n${doc.content}`
      );

      const contextHeader = language === 'ru'
        ? `Контекст из базы знаний (уровень доступа: ${accessLevel}):`
        : `Context from knowledge base (access level: ${accessLevel}):`;

      return `${contextHeader}\n\n${contextParts.join('\n\n---\n\n')}`;

    } catch (error) {
      console.error('EmbeddingService.getContextForAI error:', error);
      return '';
    }
  }

  // Получение статистики доступа к знаниям по роли
  async getKnowledgeAccessStats(userRole: string): Promise<{
    total: number;
    accessible: number;
    byLevel: Record<string, number>;
    byAudience: Record<string, number>;
  }> {
    try {
      const accessibleRoles = this.getAccessibleRoles(userRole);

      const { data: totalDocs, error: totalError } = await this.supabase
        .from('knowledge_documents')
        .select('knowledge_level, target_audience, access_roles');

      if (totalError || !totalDocs) {
        return { total: 0, accessible: 0, byLevel: {}, byAudience: {} };
      }

      const accessibleDocs = totalDocs.filter(doc =>
        doc.access_roles.some((role: string) => accessibleRoles.includes(role as AccessRole))
      );

      const byLevel = accessibleDocs.reduce((acc, doc) => {
        acc[doc.knowledge_level] = (acc[doc.knowledge_level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byAudience = accessibleDocs.reduce((acc, doc) => {
        acc[doc.target_audience] = (acc[doc.target_audience] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total: totalDocs.length,
        accessible: accessibleDocs.length,
        byLevel,
        byAudience
      };

    } catch (error) {
      console.error('EmbeddingService.getKnowledgeAccessStats error:', error);
      return { total: 0, accessible: 0, byLevel: {}, byAudience: {} };
    }
  }
}

// Экспортируем синглтон
export const embeddingService = new EmbeddingService();