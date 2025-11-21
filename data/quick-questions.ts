export interface QuickQuestion {
  id: string;
  text: string;
  textRu: string;
}

export const quickQuestions: QuickQuestion[] = [
  {
    id: '1',
    text: 'How to get started?',
    textRu: 'С чего начать?',
  },
  {
    id: '2',
    text: 'How to join a team?',
    textRu: 'Как попасть в команду?',
  },
  {
    id: '3',
    text: 'What is DAO?',
    textRu: 'Что такое DAO?',
  },
  {
    id: '4',
    text: 'How does AI work?',
    textRu: 'Как работает ИИ?',
  },
  {
    id: '5',
    text: 'Tokenomics basics?',
    textRu: 'Основы токеномики?',
  },
  {
    id: '6',
    text: 'Community guidelines?',
    textRu: 'Правила сообщества?',
  },
  {
    id: '7',
    text: 'Technical requirements?',
    textRu: 'Технические требования?',
  },
  {
    id: '8',
    text: 'Best practices?',
    textRu: 'Лучшие практики?',
  },
];