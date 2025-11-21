'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { menuItems, MenuItem } from '@/data/menu';
import { useAppContext } from '@/lib/contexts/app-context';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function LeftSidebar() {
  const pathname = usePathname();
  const { language } = useAppContext();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Auto-expand items that have active children
  useEffect(() => {
    const shouldExpand = new Set<string>();

    const checkForActiveChildren = (items: MenuItem[]): void => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          const hasActiveChild = item.children.some(child =>
            pathname === child.href || pathname.startsWith(child.href)
          );

          if (hasActiveChild) {
            shouldExpand.add(item.id);
          }

          // Recursively check nested children
          checkForActiveChildren(item.children);
        }
      });
    };

    checkForActiveChildren(menuItems);

    if (shouldExpand.size > 0) {
      setExpandedItems(prev => new Set([...prev, ...shouldExpand]));
    }
  }, [pathname]);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const Icon = item.icon;
    const isActive = pathname === item.href ||
      (pathname.startsWith(item.href) && item.href !== '/');
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);

    // Check if any child is active
    const hasActiveChild = hasChildren && item.children!.some(child =>
      pathname === child.href || pathname.startsWith(child.href)
    );

    return (
      <div key={item.id}>
        {hasChildren ? (
          <div>
            <button
              onClick={() => toggleExpanded(item.id)}
              className={cn(
                'sidebar-link w-full justify-between',
                (isActive || hasActiveChild) && 'active'
              )}
              style={{ paddingLeft: `${16 + level * 12}px` }}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">
                  {language === 'ru' ? item.labelRu : item.label}
                </span>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )}
            </button>
            {isExpanded && (
              <div className="mt-1 space-y-1">
                {item.children!.map((child) => renderMenuItem(child, level + 1))}
              </div>
            )}
          </div>
        ) : (
          <Link
            href={item.href}
            className={cn(
              'sidebar-link',
              isActive && 'active'
            )}
            style={{ paddingLeft: `${16 + level * 12}px` }}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="font-medium">
              {language === 'ru' ? item.labelRu : item.label}
            </span>
          </Link>
        )}
      </div>
    );
  };

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-muted/50 h-full">
      <div className="flex-1 overflow-auto custom-scrollbar p-4">
        <nav className="space-y-2" role="navigation" aria-label="Main navigation">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
      </div>
    </aside>
  );
}