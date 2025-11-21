'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/lib/contexts/app-context';
import { Button } from '@/components/ui/button';
import {
  Anchor,
  Navigation,
  MessageCircle,
  Users,
  BookOpen,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface Assistant {
  id: 'navigator' | 'skipper';
  icon: React.ReactNode;
  name: { ru: string; en: string };
  color: string;
  description: { ru: string; en: string };
}

const assistants: Assistant[] = [
  {
    id: 'navigator',
    icon: <Navigation className="h-5 w-5" />,
    name: { ru: 'Навигатор', en: 'Navigator' },
    color: 'bg-blue-500 hover:bg-blue-600',
    description: { ru: 'Помощник по навигации', en: 'Navigation assistant' }
  },
  {
    id: 'skipper',
    icon: <Anchor className="h-5 w-5" />,
    name: { ru: 'Шкипер', en: 'Skipper' },
    color: 'bg-orange-500 hover:bg-orange-600',
    description: { ru: 'Морской эксперт', en: 'Marine expert' }
  }
];

interface AssistantDockProps {
  className?: string;
}

export function AssistantDock({ className }: AssistantDockProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, saveNavigationContext } = useAppContext();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide/show dock on mobile scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // On mobile (< 768px), hide dock when scrolling down
      if (window.innerWidth < 768) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleAssistantClick = async (assistant: Assistant) => {
    try {
      // Don't save context if already on chat page
      if (!pathname.includes('/chat')) {
        const currentTitle = document.title || 'DAOsail';
        const section = pathname.split('/')[1] || 'home';

        await saveNavigationContext(
          pathname,
          currentTitle,
          section,
          'page'
        );
      }

      // Navigate to chat with selected assistant
      router.push(`/chat?assistant=${assistant.id}`);
    } catch (error) {
      console.error('Error in handleAssistantClick:', error);
      // Fallback navigation
      router.push(`/chat?assistant=${assistant.id}`);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Don't show dock on chat page itself
  if (pathname.includes('/chat')) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50",
        "transition-all duration-300 ease-in-out",
        !isVisible && "translate-y-20 opacity-0",
        className
      )}
    >
      {/* Mobile: Compact dock with expand button */}
      <div className="md:hidden">
        {!isExpanded ? (
          // Collapsed state - floating button
          <Button
            onClick={toggleExpanded}
            size="lg"
            className="rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground p-4"
          >
            <MessageCircle className="h-6 w-6" />
            <ChevronUp className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          // Expanded state - full dock
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-2xl shadow-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground px-2">
                {language === 'ru' ? 'Выберите ассистента:' : 'Choose assistant:'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpanded}
                className="ml-auto p-1 h-6 w-6"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              {assistants.map((assistant) => (
                <Button
                  key={assistant.id}
                  onClick={() => handleAssistantClick(assistant)}
                  className={cn(
                    "flex flex-col items-center gap-1 h-auto py-3 px-4 rounded-xl",
                    "transition-all duration-200",
                    assistant.color,
                    "text-white shadow-md"
                  )}
                >
                  {assistant.icon}
                  <span className="text-xs font-medium">
                    {assistant.name[language]}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Always visible full dock */}
      <div className="hidden md:block">
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-2xl shadow-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium">
                {language === 'ru' ? 'Задать вопрос:' : 'Ask a question:'}
              </span>
            </div>

            <div className="flex gap-2">
              {assistants.map((assistant) => (
                <Button
                  key={assistant.id}
                  onClick={() => handleAssistantClick(assistant)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl",
                    "transition-all duration-200 hover:scale-105",
                    assistant.color,
                    "text-white shadow-md"
                  )}
                  title={assistant.description[language]}
                >
                  {assistant.icon}
                  <span className="font-medium">
                    {assistant.name[language]}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick access indicators for different sections */}
      <div className="hidden lg:flex absolute -top-12 left-1/2 transform -translate-x-1/2 gap-2 text-xs text-muted-foreground">
        {pathname.includes('/library') && (
          <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
            <BookOpen className="h-3 w-3" />
            <span>{language === 'ru' ? 'Библиотека' : 'Library'}</span>
          </div>
        )}
        {pathname.includes('/community') && (
          <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
            <Users className="h-3 w-3" />
            <span>{language === 'ru' ? 'Сообщество' : 'Community'}</span>
          </div>
        )}
      </div>
    </div>
  );
}