'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ExternalLink, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/lib/contexts/app-context';

interface ConceptCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  link: string;
  color?: 'concept' | 'presentation' | 'blog' | 'dao' | 'philosophy' | 'manifesto' | 'roles' | 'default';
}

const colorVariants = {
  concept: {
    gradient: 'from-yellow-500 to-orange-500',
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-600',
    borderHover: 'hover:border-yellow-500/30',
    shadowHover: 'hover:shadow-yellow-500/10'
  },
  presentation: {
    gradient: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    borderHover: 'hover:border-blue-500/30',
    shadowHover: 'hover:shadow-blue-500/10'
  },
  blog: {
    gradient: 'from-green-500 to-emerald-600',
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-600',
    borderHover: 'hover:border-green-500/30',
    shadowHover: 'hover:shadow-green-500/10'
  },
  philosophy: {
    gradient: 'from-cyan-500 to-teal-600',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-600',
    borderHover: 'hover:border-cyan-500/30',
    shadowHover: 'hover:shadow-cyan-500/10'
  },
  manifesto: {
    gradient: 'from-orange-500 to-red-600',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-600',
    borderHover: 'hover:border-orange-500/30',
    shadowHover: 'hover:shadow-orange-500/10'
  },
  dao: {
    gradient: 'from-purple-500 to-indigo-600',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-600',
    borderHover: 'hover:border-purple-500/30',
    shadowHover: 'hover:shadow-purple-500/10'
  },
  roles: {
    gradient: 'from-pink-500 to-rose-600',
    iconBg: 'bg-pink-500/10',
    iconColor: 'text-pink-600',
    borderHover: 'hover:border-pink-500/30',
    shadowHover: 'hover:shadow-pink-500/10'
  },
  default: {
    gradient: 'from-slate-500 to-slate-600',
    iconBg: 'bg-slate-500/10',
    iconColor: 'text-slate-600',
    borderHover: 'hover:border-slate-500/30',
    shadowHover: 'hover:shadow-slate-500/10'
  }
};

export function ConceptCard({
  icon: Icon,
  title,
  description,
  link,
  color = 'default'
}: ConceptCardProps) {
  const { language } = useAppContext();
  const variant = colorVariants[color];

  const handleClick = () => {
    if (link && link !== '#') {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const isClickable = link && link !== '#';

  return (
    <TooltipProvider>
      <Card
        className={cn(
          'group transition-all duration-300 border',
          isClickable && 'cursor-pointer hover:shadow-lg',
          isClickable && variant.borderHover,
          isClickable && variant.shadowHover,
          !isClickable && 'opacity-60 cursor-not-allowed'
        )}
        onClick={isClickable ? handleClick : undefined}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        } : undefined}
        aria-label={isClickable ? `${language === 'ru' ? 'Открыть' : 'Open'} ${title}` : undefined}
      >
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
            <div className="flex items-start justify-between gap-2">
              <h3 className={cn(
                'text-lg font-semibold text-foreground transition-colors',
                isClickable && 'group-hover:text-primary'
              )}>
                {title}
              </h3>
              {isClickable && (
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              )}
            </div>

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

          {/* Status indicator */}
          {!isClickable && (
            <div className="flex items-center gap-2 pt-2 border-t border-dashed border-muted-foreground/20">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
              <span className="text-xs text-muted-foreground/60">
                {language === 'ru' ? 'Скоро появится' : 'Coming soon'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}