'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmailCapture } from '@/components/ui/email-capture';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Loader2,
  Bot,
  User,
  AlertCircle,
  Anchor,
  Navigation,
  ArrowLeft,
  Search,
  X,
  Paperclip,
  Upload,
  FileText,
  Image,
  Code,
  FileSpreadsheet,
  File,
  Trash2
} from 'lucide-react';
import { useAppContext } from '@/lib/contexts/app-context';
import { chatService } from '@/lib/services/chat-service';
import { ChatMessage } from '@/lib/types/assistants';
import { CitationsDisplay } from '@/components/ui/citations-display';
import { persistentChatService, PersistentChatMessage } from '@/lib/services/persistent-chat-service';
import { fileUploadService, ChatFile, FileUploadProgress } from '@/lib/services/file-upload-service';
import { useRouter } from 'next/navigation';
import { AssistantType, getAssistant } from '@/lib/types/assistants';

interface ChatBoxProps {
  newQuestion?: string;
  onQuestionProcessed?: () => void;
  assistantType?: AssistantType;
  onChangeAssistant?: () => void;
  existingSessionId?: string; // Для загрузки существующего чата
}

export function ChatBox({
  newQuestion,
  onQuestionProcessed,
  assistantType = 'navigator',
  onChangeAssistant,
  existingSessionId
}: ChatBoxProps) {
  const router = useRouter();
  const {
    language,
    decrementResponses,
    responsesLeft,
    isAuthenticated,
    incrementStat,
    userProfile,
    guestStage,
    totalQuestionsAsked,
    captureEmail,
    getBackUrl,
    searchChats,
    chatSearchResults,
    isSearching,
    clearChatSearch
  } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<ChatFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, FileUploadProgress>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize session and load history if needed
  useEffect(() => {
    const initSession = async () => {
      try {
        if (existingSessionId) {
          // Загружаем существующий чат
          setSessionId(existingSessionId);
          const history = await persistentChatService.getChatHistory(existingSessionId);
          setMessages(history.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp || new Date().toISOString(),
            assistantType: msg.assistantType as AssistantType | undefined,
            model: msg.model
          })));

          // Загружаем файлы для существующего чата
          if (isAuthenticated) {
            try {
              const files = await fileUploadService.getChatFiles(existingSessionId);
              setUploadedFiles(files);
            } catch (error) {
              console.error('Failed to load chat files:', error);
            }
          }
        } else {
          // Создаем новую сессию
          const newSessionId = await persistentChatService.createChatSession(
            language === 'ru' ? 'Новый чат' : 'New Chat',
            assistantType
          );
          setSessionId(newSessionId);
        }
      } catch (error) {
        console.error('Failed to initialize chat session:', error);
        // Fallback to local session
        setSessionId(`local-${Date.now()}`);
      }
    };

    if (isAuthenticated) {
      initSession();
    } else {
      // Для гостей используем локальную сессию
      setSessionId(`guest-${Date.now()}`);
    }
  }, [assistantType, isAuthenticated, language, existingSessionId]);

  // Helper function for streaming response
  const handleStreamingResponse = async (newMessages: ChatMessage[], userRole: string, userId?: string): Promise<ChatMessage | null> => {
    try {
      setIsStreaming(true);
      setStreamingContent('');

      // Prepare files context
      const filesContext = fileUploadService.prepareFilesContext(uploadedFiles);

      const response = await fetch('/api/chat?stream=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          assistantType,
          userRole,
          userId,
          filesContext
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'content') {
                fullContent += data.content;
                setStreamingContent(fullContent);
              } else if (data.type === 'finish') {
                const aiMessage: ChatMessage = {
                  role: 'assistant',
                  content: data.fullContent,
                  timestamp: data.message.timestamp,
                  assistantType: data.message.assistantType,
                  model: data.message.model
                };

                setMessages(prev => [...prev, aiMessage]);
                setStreamingContent('');
                setIsStreaming(false);
                return aiMessage;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      setIsStreaming(false);
      setStreamingContent('');
      throw error;
    }

    return null;
  };

  const handleSend = useCallback(async (message?: string) => {
    const messageToSend = message || input.trim();
    if (!messageToSend || isTyping || isStreaming) return;

    // Validate message
    const validation = chatService.validateMessage(messageToSend);
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    // Check if user has responses left (for non-authenticated users)
    if (!isAuthenticated && responsesLeft <= 0) {
      setError(language === 'ru'
        ? 'Достигнут лимит ответов. Зарегистрируйтесь для продолжения.'
        : 'Response limit reached. Please register to continue.'
      );
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setError(null);
    setIsTyping(true);

    try {
      const userRole = userProfile?.role || 'Интересующийся';
      const userId = userProfile?.id;

      // Save user message to persistent storage
      if (isAuthenticated && sessionId && !sessionId.startsWith('local-') && !sessionId.startsWith('guest-')) {
        try {
          await persistentChatService.saveMessage(sessionId, userMessage, userId);
        } catch (error) {
          console.error('Failed to save user message:', error);
        }
      }

      // Use streaming for all assistants (including steward with RAG)
      const aiResponse = await handleStreamingResponse(newMessages, userRole, userId);

      // Save AI response to persistent storage
      if (isAuthenticated && sessionId && !sessionId.startsWith('local-') && !sessionId.startsWith('guest-') && aiResponse) {
        try {
          await persistentChatService.saveMessage(sessionId, {
            role: 'assistant',
            content: aiResponse.content,
            timestamp: aiResponse.timestamp,
            assistantType: aiResponse.assistantType,
            model: aiResponse.model
          }, userId);
        } catch (error) {
          console.error('Failed to save AI message:', error);
        }
      }

      // Update user statistics if authenticated
      if (isAuthenticated) {
        await incrementStat('questionsAsked');

        // Generate and update title for first message
        if (newMessages.length === 1 && sessionId && !sessionId.startsWith('local-') && !sessionId.startsWith('guest-')) {
          try {
            const title = chatService.generateChatTitle(messageToSend, language);
            await persistentChatService.updateChatTitle(sessionId, title, userId);
          } catch (error) {
            console.error('Failed to update chat title:', error);
          }
        }
      } else {
        // Decrement responses for guests
        decrementResponses();
      }

    } catch (error) {
      console.error('Chat error:', error);
      setError(
        error instanceof Error
          ? error.message
          : language === 'ru'
            ? 'Произошла ошибка при отправке сообщения'
            : 'An error occurred while sending the message'
      );
    } finally {
      setIsTyping(false);
    }
  }, [
    input,
    isTyping,
    isStreaming,
    messages,
    assistantType,
    isAuthenticated,
    responsesLeft,
    language,
    decrementResponses,
    incrementStat,
    userProfile,
    streamingContent
  ]);

  // Handle new question from quick questions
  useEffect(() => {
    if (newQuestion) {
      handleSend(newQuestion);
      onQuestionProcessed?.();
    }
  }, [newQuestion, handleSend, onQuestionProcessed]);

  // Auto-scroll to bottom when new messages are added or streaming content changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat(language, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get assistant icon and title
  const getAssistantInfo = () => {
    const assistant = getAssistant(assistantType);

    if (assistant) {
      const Icon = assistant.icon;
      return {
        icon: <Icon className="h-4 w-4" />,
        title: language === 'ru' ? assistant.titleRu : assistant.title,
        role: language === 'ru' ? assistant.roleRu : assistant.role,
        bgColor: `bg-gradient-to-br ${assistant.color}`,
        description: language === 'ru' ? assistant.descriptionRu : assistant.description
      };
    }

    // Fallback for unknown assistant types
    return {
      icon: <Navigation className="h-4 w-4" />,
      title: language === 'ru' ? 'Навигатор' : 'Navigator',
      role: language === 'ru' ? 'Навигатор' : 'Navigator',
      bgColor: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      description: language === 'ru' ? 'Общий помощник' : 'General assistant'
    };
  };

  const assistantInfo = getAssistantInfo();

  // Navigation functions
  const handleBackClick = () => {
    const backUrl = getBackUrl();
    if (backUrl) {
      router.push(backUrl);
    } else {
      // Fallback to main page
      router.push('/');
    }
  };

  // Search functions
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await searchChats(searchQuery);
    }
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      clearChatSearch();
      setSearchQuery('');
    }
  };

  const handleSearchResultClick = (result: any) => {
    // Navigate to the specific chat session
    // For now, just show a snippet in the current chat
    setInput(`Ранее вы спрашивали: "${result.messageContent}"`);
    setShowSearch(false);
    clearChatSearch();
    setSearchQuery('');
  };

  // File upload handlers
  const handleFileUpload = async (files: FileList) => {
    if (!isAuthenticated || !sessionId || sessionId.startsWith('local-') || sessionId.startsWith('guest-')) {
      setError(language === 'ru'
        ? 'Загрузка файлов доступна только для зарегистрированных пользователей'
        : 'File upload is only available for registered users'
      );
      return;
    }

    const fileArray = Array.from(files);

    for (const file of fileArray) {
      // Валидация файла
      const validation = fileUploadService.validateFile(file);
      if (!validation.isValid) {
        setError(validation.error!);
        continue;
      }

      try {
        const uploadedFile = await fileUploadService.uploadFile(
          file,
          sessionId,
          (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          }
        );

        setUploadedFiles(prev => [...prev, uploadedFile]);

        // Очищаем прогресс после завершения
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      } catch (error) {
        console.error('File upload failed:', error);
        setError(
          error instanceof Error
            ? error.message
            : language === 'ru'
              ? 'Ошибка загрузки файла'
              : 'File upload error'
        );

        // Очищаем прогресс при ошибке
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
      // Сбрасываем input для возможности повторной загрузки того же файла
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      await fileUploadService.deleteFile(fileId);
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Failed to delete file:', error);
      setError(
        error instanceof Error
          ? error.message
          : language === 'ru'
            ? 'Ошибка удаления файла'
            : 'File deletion error'
      );
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'code':
        return <Code className="h-4 w-4" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Back button */}
            {getBackUrl() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
                className="mr-2 p-2"
                title={language === 'ru' ? 'Вернуться назад' : 'Go back'}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            <div className={`p-2 rounded-full ${assistantInfo.bgColor} text-white shadow-lg`}>
              {assistantInfo.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-lg">{assistantInfo.title}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {assistantInfo.role}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {onChangeAssistant && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onChangeAssistant}
                className="p-2"
                title={language === 'ru' ? 'Сменить ассистента' : 'Change assistant'}
              >
                <Bot className="h-4 w-4" />
              </Button>
            )}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSearch}
                className="p-2"
                title={language === 'ru' ? 'Поиск по чатам' : 'Search chats'}
              >
                {showSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </CardTitle>

        {/* Search interface */}
        {showSearch && isAuthenticated && (
          <div className="mt-3 space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ru' ? 'Поиск по истории чатов...' : 'Search chat history...'}
                className="flex-1"
              />
              <Button type="submit" disabled={isSearching} size="sm">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </form>

            {/* Search results */}
            {chatSearchResults.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {chatSearchResults.slice(0, 5).map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleSearchResultClick(result)}
                    className="p-2 text-sm bg-muted/50 rounded cursor-pointer hover:bg-muted transition-colors"
                  >
                    <div className="font-medium text-xs text-muted-foreground mb-1">
                      {result.chatTitle}
                    </div>
                    <div className="line-clamp-2">
                      {result.messageContent}
                    </div>
                  </div>
                ))}
                {chatSearchResults.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center py-1">
                    +{chatSearchResults.length - 5} {language === 'ru' ? 'еще результатов' : 'more results'}
                  </div>
                )}
              </div>
            )}

            {searchQuery && chatSearchResults.length === 0 && !isSearching && (
              <div className="text-sm text-muted-foreground text-center py-2">
                {language === 'ru' ? 'Ничего не найдено' : 'No results found'}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages area */}
        <ScrollArea 
          className="flex-1 px-4" 
          ref={scrollAreaRef}
        >
          <div className="space-y-4 pb-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>
                  {language === 'ru' 
                    ? 'Начните разговор, задав вопрос ниже' 
                    : 'Start a conversation by asking a question below'
                  }
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.timestamp}-${index}`}
                  className={`flex gap-3 chat-message ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className={`${assistantInfo.bgColor} text-white`}>
                        {assistantInfo.icon}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`max-w-[80%] ${
                    message.role === 'user' ? 'order-1' : ''
                  }`}>
                    <div className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      {message.model && message.role === 'assistant' && (
                        <div className="text-xs opacity-60 mt-2">
                          {message.model}
                        </div>
                      )}
                    </div>

                    {/* Show citations for FAQ messages */}
                    {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                      <div className="mt-2">
                        <CitationsDisplay
                          citations={message.citations}
                          traceInfo={message.trace}
                        />
                      </div>
                    )}

                    <div className={`text-xs text-muted-foreground mt-1 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}

            {/* Streaming response */}
            {isStreaming && streamingContent && (
              <div className="flex gap-3 justify-start chat-message">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className={`${assistantInfo.bgColor} text-white`}>
                    {assistantInfo.icon}
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[80%]">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {streamingContent}
                      <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse" />
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 text-left">
                    {language === 'ru' ? 'Печатает...' : 'Typing...'}
                  </div>
                </div>
              </div>
            )}

            {/* Typing indicator for when AI is thinking */}
            {isTyping && !isStreaming && (
              <div className="flex gap-3 justify-start chat-message">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className={`${assistantInfo.bgColor} text-white`}>
                    {assistantInfo.icon}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">
                      {language === 'ru'
                        ? `${assistantInfo.title} думает...`
                        : `${assistantInfo.title} is thinking...`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Guest Flow: Email Capture or Registration */}
        {!isAuthenticated && totalQuestionsAsked === 3 && guestStage === 'initial' && (
          <div className="px-4 py-3 border-t">
            <EmailCapture
              onSkip={() => {
                // Пользователь выбрал "Позже" - продолжаем к этапу 2
              }}
            />
          </div>
        )}

        {!isAuthenticated && guestStage === 'registration_required' && (
          <div className="px-4 py-3 border-t">
            <div className="text-center p-6 border rounded-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
              <AlertCircle className="w-8 h-8 mx-auto mb-4 text-orange-600" />
              <h3 className="text-lg font-semibold mb-2">
                {language === 'ru' ? 'Требуется регистрация' : 'Registration Required'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {language === 'ru'
                  ? 'Если вас действительно интересует проект, зарегистрируйтесь, ибо для избежания спама я больше не смогу отвечать на ваши вопросы.'
                  : 'If you\'re really interested in the project, please register, as I can no longer answer your questions to avoid spam.'
                }
              </p>
              <Button className="w-full">
                {language === 'ru' ? 'Зарегистрироваться' : 'Register'}
              </Button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        {/* Uploaded files display */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/30">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              {language === 'ru' ? 'Прикрепленные файлы:' : 'Attached files:'}
            </div>
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 px-2 py-1 bg-background rounded border text-xs"
                >
                  {getFileIcon(file.fileType)}
                  <span className="max-w-[100px] truncate">{file.originalFilename}</span>
                  <span className="text-muted-foreground">({formatFileSize(file.fileSize)})</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleFileDelete(file.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload progress display */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/30">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              {language === 'ru' ? 'Загрузка файлов...' : 'Uploading files...'}
            </div>
            <div className="space-y-2">
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="truncate max-w-[150px]">{progress.fileName}</span>
                    <span>{progress.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1">
                    <div
                      className="bg-primary h-1 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                  {progress.status === 'error' && progress.error && (
                    <div className="text-destructive mt-1">{progress.error}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div
          className={`p-4 border-t transition-colors ${
            isDragOver ? 'bg-primary/10 border-primary' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragOver && (
            <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10">
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-primary font-medium">
                  {language === 'ru' ? 'Отпустите для загрузки файлов' : 'Drop files to upload'}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={
                language === 'ru'
                  ? 'Задайте ваш вопрос...'
                  : 'Ask your question...'
              }
              disabled={isTyping || responsesLeft <= 0}
              className="flex-1"
            />

            {/* File upload button */}
            {isAuthenticated && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileInputChange}
                  accept=".pdf,.docx,.txt,.md,.csv,.xlsx,.json,.js,.py,.sql,.jpg,.jpeg,.png,.webp,.gif"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping}
                  title={language === 'ru' ? 'Прикрепить файл' : 'Attach file'}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </>
            )}

            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping || responsesLeft <= 0}
              size="sm"
              aria-label={language === 'ru' ? 'Отправить сообщение' : 'Send message'}
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Hints */}
          <div className="mt-2 text-xs text-muted-foreground">
            {language === 'ru' ? (
              <>Enter для отправки • Shift+Enter для новой строки • Перетащите файлы для загрузки</>
            ) : (
              <>Enter to send • Shift+Enter for new line • Drag files to upload</>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}