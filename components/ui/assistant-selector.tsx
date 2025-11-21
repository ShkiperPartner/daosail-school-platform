'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/lib/contexts/app-context';
import { assistants, getAvailableAssistants, AssistantType } from '@/lib/types/assistants';

interface AssistantSelectorProps {
  selectedAssistant: AssistantType;
  onAssistantChange: (assistant: AssistantType) => void;
  className?: string;
}

export function AssistantSelector({
  selectedAssistant,
  onAssistantChange,
  className
}: AssistantSelectorProps) {
  const { language, isAuthenticated, userProfile } = useAppContext();

  const availableAssistants = getAvailableAssistants(
    isAuthenticated,
    userProfile?.role
  );

  const allAssistants = assistants;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          {language === 'ru' ? 'Выберите цифрового помощника' : 'Choose your digital assistant'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {language === 'ru'
            ? 'Каждый ассистент специализируется на определённых областях'
            : 'Each assistant specializes in specific areas'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allAssistants.map((assistant) => {
          const Icon = assistant.icon;
          const isSelected = selectedAssistant === assistant.id;
          const isAvailable = availableAssistants.some(a => a.id === assistant.id);
          const isLocked = !isAvailable;

          return (
            <Card
              key={assistant.id}
              className={cn(
                'relative cursor-pointer transition-all duration-200 transform hover:scale-105',
                isSelected && 'ring-2 ring-primary shadow-lg',
                isLocked && 'opacity-60 cursor-not-allowed',
                !isLocked && 'hover:shadow-md'
              )}
              onClick={() => {
                if (!isLocked) {
                  onAssistantChange(assistant.id);
                }
              }}
            >
              <CardContent className="p-4 space-y-3">
                {/* Header with icon and status */}
                <div className="flex items-start justify-between">
                  <div className={cn(
                    'h-12 w-12 rounded-lg flex items-center justify-center bg-gradient-to-br',
                    assistant.color
                  )}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        {language === 'ru' ? 'Активен' : 'Active'}
                      </Badge>
                    )}
                    {isLocked && (
                      <div className="flex items-center gap-1">
                        {assistant.requiresRole?.includes('premium') ||
                         assistant.requiresRole?.includes('captain') ||
                         assistant.requiresRole?.includes('admiral') ? (
                          <Crown className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Title and role */}
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm leading-tight">
                    {language === 'ru' ? assistant.titleRu : assistant.title}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {language === 'ru' ? assistant.roleRu : assistant.role}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {language === 'ru' ? assistant.descriptionRu : assistant.description}
                </p>

                {/* Specialization */}
                <div className="text-xs">
                  <span className="font-medium text-primary">
                    {language === 'ru' ? 'Специализация:' : 'Specialization:'}
                  </span>
                  <br />
                  <span className="text-muted-foreground">
                    {language === 'ru' ? assistant.specializationRu : assistant.specialization}
                  </span>
                </div>

                {/* Action button for locked assistants */}
                {isLocked && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8"
                      disabled
                    >
                      {assistant.requiresAuth && !isAuthenticated
                        ? (language === 'ru' ? 'Требуется вход' : 'Login Required')
                        : assistant.requiresRole
                        ? (language === 'ru' ? 'Нужна роль' : 'Role Required')
                        : (language === 'ru' ? 'Недоступно' : 'Unavailable')
                      }
                    </Button>
                  </div>
                )}
              </CardContent>

              {/* Selected indicator */}
              {isSelected && !isLocked && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Info text */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          {language === 'ru'
            ? 'Разблокируйте больше ассистентов, повышая свою роль в клубе'
            : 'Unlock more assistants by advancing your role in the club'
          }
        </p>
      </div>
    </div>
  );
}