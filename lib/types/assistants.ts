import {
  Navigation,
  Anchor,
  Coins,
  Bot,
  User,
  Settings,
  HelpCircle
} from 'lucide-react';

export type AssistantType =
  | 'navigator'      // ЦПК (Цифровой Помощник Клуба) - общий навигатор
  | 'sailing_coach'  // ЦПК/ИИ Шкипер Инструктор - тренер по яхтингу
  | 'dao_advisor'    // Шкипер ДАО - советник по DAO
  | 'ai_guide'       // Шкипер Партнер (главный) - гид по ИИ
  | 'personal'       // Шкипер Компаньон - личный ассистент
  | 'steward';       // Стюард - встречает гостей и отвечает по базе знаний

export interface Assistant {
  id: AssistantType;
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  role: string;
  roleRu: string;
  icon: any;
  color: string;
  specialization: string;
  specializationRu: string;
  available: boolean;
  requiresAuth?: boolean;
  requiresRole?: string[];
}

// Extended interface for chat messages to include FAQ specific data
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  assistantType?: AssistantType;
  model?: string;
  citations?: Array<{
    doc_id: string;
    url: string | null;
    chunk_idx: number;
    similarity: number;
  }>;
  trace?: {
    intent: string;
    tools: string[];
    latency_ms: number;
  };
}

export const assistants: Assistant[] = [
  {
    id: 'navigator',
    title: 'Digital Club Assistant',
    titleRu: 'ЦПК',
    description: 'Your general navigation guide through DAOsail ecosystem',
    descriptionRu: 'Ваш общий навигационный помощник по экосистеме DAOsail',
    role: 'Navigator',
    roleRu: 'Навигатор',
    icon: Navigation,
    color: 'from-blue-500 to-cyan-500',
    specialization: 'General guidance and navigation',
    specializationRu: 'Общее руководство и навигация',
    available: true,
  },
  {
    id: 'sailing_coach',
    title: 'Sailing Instructor',
    titleRu: 'Шкипер Инструктор',
    description: 'Expert sailing coach for training and skill development',
    descriptionRu: 'Экспертный тренер по парусному спорту для обучения и развития навыков',
    role: 'Coach',
    roleRu: 'Тренер',
    icon: Anchor,
    color: 'from-emerald-500 to-teal-500',
    specialization: 'Sailing techniques and training',
    specializationRu: 'Техника парусного спорта и обучение',
    available: true,
  },
  {
    id: 'dao_advisor',
    title: 'DAO Skipper',
    titleRu: 'Шкипер ДАО',
    description: 'DAO governance and community management specialist',
    descriptionRu: 'Специалист по управлению DAO и сообществом',
    role: 'Advisor',
    roleRu: 'Советник',
    icon: Coins,
    color: 'from-amber-500 to-orange-500',
    specialization: 'DAO governance and voting',
    specializationRu: 'Управление DAO и голосование',
    available: true,
  },
  {
    id: 'ai_guide',
    title: 'Skipper Partner',
    titleRu: 'Шкипер Партнер',
    description: 'Advanced AI interactions and technology guidance',
    descriptionRu: 'Продвинутые взаимодействия с ИИ и технологическое руководство',
    role: 'Guide',
    roleRu: 'Гид',
    icon: Bot,
    color: 'from-purple-500 to-pink-500',
    specialization: 'AI technology and automation',
    specializationRu: 'ИИ технологии и автоматизация',
    available: false, // Not available to everyone
    requiresRole: ['premium', 'captain', 'admiral'],
  },
  {
    id: 'personal',
    title: 'Skipper Companion',
    titleRu: 'Шкипер Компаньон',
    description: 'Your personal digital assistant for club activities',
    descriptionRu: 'Ваш персональный цифровой ассистент для клубных активностей',
    role: 'Companion',
    roleRu: 'Компаньон',
    icon: User,
    color: 'from-indigo-500 to-blue-500',
    specialization: 'Personal assistance and organization',
    specializationRu: 'Личная помощь и организация',
    available: false,
    requiresAuth: true,
    requiresRole: ['member', 'premium', 'captain', 'admiral'],
  },
  {
    id: 'steward',
    title: 'Steward',
    titleRu: 'Стюард',
    description: 'Service assistant for administrative and support tasks',
    descriptionRu: 'Сервисный ассистент для административных и вспомогательных задач',
    role: 'Steward',
    roleRu: 'Стюард',
    icon: Settings,
    color: 'from-gray-500 to-slate-500',
    specialization: 'Administrative support and services',
    specializationRu: 'Административная поддержка и услуги',
    available: true,
  },
];

export function getAssistant(type: AssistantType): Assistant | undefined {
  return assistants.find(assistant => assistant.id === type);
}

export function getAvailableAssistants(isAuthenticated: boolean = false, userRole?: string): Assistant[] {
  return assistants.filter(assistant => {
    if (!assistant.available) return false;

    if (assistant.requiresAuth && !isAuthenticated) return false;

    if (assistant.requiresRole && userRole) {
      return assistant.requiresRole.includes(userRole);
    }

    return true;
  });
}