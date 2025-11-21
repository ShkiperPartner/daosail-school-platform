import type { RoleConfig, UserRole } from '@/lib/types/profile';

// Role configurations for the DAOsail club system
export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  'Интересующийся': {
    role: 'Интересующийся',
    title: 'Interested',
    titleRu: 'Интересующийся',
    description: 'You can explore basics and ideas about our club creation. Access to chat with AI Skipper Administrator.',
    descriptionRu: 'Вы можете познакомиться с основами и идеями по созданию нашего клуба. Имеете доступ к чату с ИИ Шкипером Администратором.',
    permissions: [
      'chat_with_skipper',
      'read_library',
      'view_community'
    ],
    nextRole: 'Пассажир',
    requirements: {
      questionsRequired: 10,
      articlesRequired: 5,
      lessonsRequired: 2
    }
  },

  'Пассажир': {
    role: 'Пассажир',
    title: 'Passenger',
    titleRu: 'Пассажир',
    description: 'Enhanced access to learning materials, community participation, and advanced AI assistants.',
    descriptionRu: 'Расширенный доступ к обучающим материалам, участие в сообществе и продвинутые ИИ-ассистенты.',
    permissions: [
      'chat_with_skipper',
      'chat_with_navigator',
      'participate_in_community',
      'access_simulations',
      'full_library_access'
    ],
    nextRole: 'Матрос',
    requirements: {
      questionsRequired: 50,
      articlesRequired: 20,
      lessonsRequired: 10,
      communityRequired: 25
    }
  },

  'Матрос': {
    role: 'Матрос',
    title: 'Sailor',
    titleRu: 'Матрос',
    description: 'Full access to all club features, advanced simulations, and leadership opportunities.',
    descriptionRu: 'Полный доступ ко всем функциям клуба, продвинутые симуляции и возможности лидерства.',
    permissions: [
      'chat_with_skipper',
      'chat_with_navigator',
      'chat_with_boatswain',
      'full_community_access',
      'advanced_simulations',
      'mentor_access',
      'club_events_organization'
    ]
    // No next role - this is the highest level
  }
};

// Helper functions for role management
export function getRoleConfig(role: UserRole): RoleConfig {
  return ROLE_CONFIGS[role];
}

export function getNextRole(currentRole: UserRole): UserRole | undefined {
  return ROLE_CONFIGS[currentRole].nextRole;
}

export function calculateRoleProgress(
  currentRole: UserRole,
  stats: {
    questionsAsked: number;
    lessonsCompleted: number;
    articlesRead: number;
    communityMessages: number;
  }
): number {
  const config = getRoleConfig(currentRole);

  if (!config.requirements) {
    return 100; // Max role reached
  }

  const requirements = config.requirements;
  let totalProgress = 0;
  let totalRequirements = 0;

  if (requirements.questionsRequired) {
    totalProgress += Math.min(stats.questionsAsked, requirements.questionsRequired);
    totalRequirements += requirements.questionsRequired;
  }

  if (requirements.lessonsRequired) {
    totalProgress += Math.min(stats.lessonsCompleted, requirements.lessonsRequired);
    totalRequirements += requirements.lessonsRequired;
  }

  if (requirements.articlesRequired) {
    totalProgress += Math.min(stats.articlesRead, requirements.articlesRequired);
    totalRequirements += requirements.articlesRequired;
  }

  if (requirements.communityRequired) {
    totalProgress += Math.min(stats.communityMessages, requirements.communityRequired);
    totalRequirements += requirements.communityRequired;
  }

  return totalRequirements > 0 ? Math.round((totalProgress / totalRequirements) * 100) : 100;
}

export function canUpgradeRole(
  currentRole: UserRole,
  stats: {
    questionsAsked: number;
    lessonsCompleted: number;
    articlesRead: number;
    communityMessages: number;
  }
): boolean {
  return calculateRoleProgress(currentRole, stats) >= 100;
}