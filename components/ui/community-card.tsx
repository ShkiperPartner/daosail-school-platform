'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ExternalLink, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/lib/contexts/app-context';

interface CommunityCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  link: string;
  color?: 'telegram' | 'discord' | 'facebook' | 'youtube' | 'website' | 'default';
}

const colorVariants = {
  telegram: {
    gradient: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    buttonHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
  },
  discord: {
    gradient: 'from-indigo-500 to-purple-600',
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-600',
    buttonHover: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
  },
  facebook: {
    gradient: 'from-blue-600 to-blue-700',
    iconBg: 'bg-blue-600/10',
    iconColor: 'text-blue-700',
    buttonHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
  },
  youtube: {
    gradient: 'from-red-500 to-red-600',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-600',
    buttonHover: 'hover:bg-red-50 dark:hover:bg-red-900/20'
  },
  website: {
    gradient: 'from-slate-500 to-slate-600',
    iconBg: 'bg-slate-500/10',
    iconColor: 'text-slate-600',
    buttonHover: 'hover:bg-slate-50 dark:hover:bg-slate-900/20'
  },
  default: {
    gradient: 'from-primary to-primary/80',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    buttonHover: 'hover:bg-primary/5'
  }
};

export function CommunityCard({
  icon: Icon,
  title,
  description,
  link,
  color = 'default'
}: CommunityCardProps) {
  const { language } = useAppContext();
  const variant = colorVariants[color];

  const handleClick = () => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <TooltipProvider>
      <Card className="group transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border hover:border-primary/20">
        <CardContent className="p-6 space-y-4">
          {/* Icon with gradient background */}
          <div className="relative">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center',
              variant.iconBg
            )}>
              <Icon className={cn('h-8 w-8', variant.iconColor)} />
            </div>
            {/* Gradient overlay effect */}
            <div className={cn(
              'absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300',
              variant.gradient
            )} />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>

            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 cursor-help">
                  {description}
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm p-3">
                <p className="text-sm leading-relaxed">
                  {description}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleClick}
            className={cn(
              'w-full gap-2 transition-all duration-200',
              variant.buttonHover
            )}
            variant="outline"
            size="default"
            aria-label={`${language === 'ru' ? 'Перейти к' : 'Go to'} ${title}`}
          >
            <span className="font-medium">
              {language === 'ru' ? 'Присоединиться' : 'Join'}
            </span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}