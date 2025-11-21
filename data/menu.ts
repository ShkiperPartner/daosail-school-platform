import {
  Home,
  Anchor,
  User,
  Bot,
  BookOpen,
  Database,
} from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  labelRu: string;
  href: string;
  icon: any;
  children?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    labelRu: 'Главная',
    href: '/',
    icon: Home,
  },
  {
    id: 'courses',
    label: 'Courses',
    labelRu: 'Курсы',
    href: '/courses',
    icon: BookOpen,
    children: [
      {
        id: 'course-introduction',
        label: 'Introduction to Yachting',
        labelRu: 'Введение в яхтинг',
        href: '/courses/introduction-to-yachting',
        icon: Anchor,
      },
    ],
  },
  {
    id: 'chat',
    label: 'AI Instructor',
    labelRu: 'ИИ-Инструктор',
    href: '/chat',
    icon: Bot,
  },
  {
    id: 'library',
    label: 'Knowledge Base',
    labelRu: 'База знаний',
    href: '/library',
    icon: Database,
  },
  {
    id: 'profile',
    label: 'Profile',
    labelRu: 'Профиль',
    href: '/profile',
    icon: User,
  },
];