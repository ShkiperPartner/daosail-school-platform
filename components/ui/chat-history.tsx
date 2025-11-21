'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  MessageSquare,
  Calendar,
  Archive,
  Trash2,
  Download,
  ExternalLink,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppContext } from '@/lib/contexts/app-context';
import { persistentChatService, ChatSession } from '@/lib/services/persistent-chat-service';
import { getAssistant } from '@/lib/types/assistants';

interface ChatHistoryProps {
  onChatSelect?: (sessionId: string) => void;
  onNewChat?: () => void;
}

export function ChatHistory({ onChatSelect, onNewChat }: ChatHistoryProps) {
  const { language, isAuthenticated } = useAppContext();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load chat sessions
  useEffect(() => {
    const loadChatSessions = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const sessions = await persistentChatService.getUserChatSessions();
        setChatSessions(sessions);
      } catch (error) {
        console.error('Failed to load chat sessions:', error);
        setError(
          error instanceof Error
            ? error.message
            : language === 'ru'
            ? 'Ошибка загрузки истории чатов'
            : 'Failed to load chat history'
        );
      } finally {
        setLoading(false);
      }
    };

    loadChatSessions();
  }, [isAuthenticated, language]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return new Intl.DateTimeFormat(language, {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } else if (diffInHours < 168) { // 7 days
      return new Intl.DateTimeFormat(language, {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } else {
      return new Intl.DateTimeFormat(language, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }
  };

  const handleArchiveChat = async (sessionId: string) => {
    try {
      await persistentChatService.archiveChatSession(sessionId);
      setChatSessions(prev => prev.filter(chat => chat.sessionId !== sessionId));
    } catch (error) {
      console.error('Failed to archive chat:', error);
    }
  };

  const handleDeleteChat = async (sessionId: string) => {
    try {
      await persistentChatService.deleteChatSession(sessionId);
      setChatSessions(prev => prev.filter(chat => chat.sessionId !== sessionId));
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const handleExportChat = async (sessionId: string) => {
    try {
      const chatData = await persistentChatService.exportChatSession(sessionId);
      const blob = new Blob([JSON.stringify(chatData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${chatData.session.title}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export chat:', error);
    }
  };

  const getAssistantInfo = (assistantType: string) => {
    const assistant = getAssistant(assistantType as any);
    if (assistant) {
      return {
        title: language === 'ru' ? assistant.titleRu : assistant.title,
        color: assistant.color.split(' ').pop() || 'blue-500'
      };
    }
    return {
      title: language === 'ru' ? 'Навигатор' : 'Navigator',
      color: 'blue-500'
    };
  };

  if (!isAuthenticated) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {language === 'ru'
                ? 'Войдите в систему, чтобы видеть историю чатов'
                : 'Sign in to view chat history'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {language === 'ru' ? 'Загрузка чатов...' : 'Loading chats...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              {language === 'ru' ? 'Попробовать снова' : 'Try again'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {language === 'ru' ? 'История чатов' : 'Chat History'}
          </CardTitle>
          {onNewChat && (
            <Button variant="outline" size="sm" onClick={onNewChat}>
              {language === 'ru' ? 'Новый чат' : 'New Chat'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-6 pb-6">
          {chatSessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {language === 'ru'
                  ? 'У вас пока нет сохраненных чатов'
                  : 'You don\'t have any saved chats yet'
                }
              </p>
              {onNewChat && (
                <Button onClick={onNewChat}>
                  {language === 'ru' ? 'Начать новый чат' : 'Start new chat'}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {chatSessions.map((chat) => {
                const assistantInfo = getAssistantInfo(chat.assistantType);
                return (
                  <div
                    key={chat.sessionId}
                    className="group p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onChatSelect?.(chat.sessionId)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm truncate">
                            {chat.title}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {assistantInfo.title}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {chat.messagesCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(chat.lastActivity)}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 p-1 h-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onChatSelect?.(chat.sessionId);
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {language === 'ru' ? 'Открыть' : 'Open'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportChat(chat.sessionId);
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {language === 'ru' ? 'Экспорт' : 'Export'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveChat(chat.sessionId);
                            }}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            {language === 'ru' ? 'Архивировать' : 'Archive'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChat(chat.sessionId);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {language === 'ru' ? 'Удалить' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}