export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  contentRu: string;
  timestamp: Date;
}

export const mockChatMessages: ChatMessage[] = [
  {
    id: '1',
    type: 'assistant',
    content: 'Hello! I\'m Skipper-Partner, your guide through Sails, DAO and AI. How can I help you today?',
    contentRu: 'Привет! Я Шкипер-Партнёр, твой проводник по Парусам, DAO и ИИ. Как могу помочь сегодня?',
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
  },
  {
    id: '2',
    type: 'user',
    content: 'What is DAO and how does it work?',
    contentRu: 'Что такое DAO и как это работает?',
    timestamp: new Date(Date.now() - 240000), // 4 minutes ago
  },
  {
    id: '3',
    type: 'assistant',
    content: 'DAO stands for Decentralized Autonomous Organization. It\'s a blockchain-based organization governed by smart contracts and community voting. Members hold tokens that give them voting rights on proposals.',
    contentRu: 'DAO расшифровывается как Децентрализованная Автономная Организация. Это организация на блокчейне, управляемая смарт-контрактами и голосованием сообщества. Участники держат токены, которые дают им право голоса.',
    timestamp: new Date(Date.now() - 180000), // 3 minutes ago
  },
  {
    id: '4',
    type: 'user',
    content: 'How can I join your DAO?',
    contentRu: 'Как мне присоединиться к вашему DAO?',
    timestamp: new Date(Date.now() - 120000), // 2 minutes ago
  },
  {
    id: '5',
    type: 'assistant',
    content: 'Great question! To join our DAO, you need to: 1) Complete the tutorial, 2) Get verified in our community, 3) Purchase governance tokens. I can guide you through each step!',
    contentRu: 'Отличный вопрос! Чтобы присоединиться к нашему DAO, нужно: 1) Пройти учебник, 2) Верифицироваться в сообществе, 3) Приобрести токены управления. Я могу провести вас через каждый шаг!',
    timestamp: new Date(Date.now() - 60000), // 1 minute ago
  },
];