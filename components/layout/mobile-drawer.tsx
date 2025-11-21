'use client';

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { menuItems } from '@/data/menu';
import { useAppContext } from '@/lib/contexts/app-context';

export function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { language } = useAppContext();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="lg:hidden"
          aria-label={language === 'ru' ? 'Открыть меню' : 'Open menu'}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <nav className="space-y-2 mt-6" role="navigation" aria-label="Mobile navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (pathname.startsWith(item.href) && item.href !== '/');
            
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'sidebar-link',
                  isActive && 'active'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">
                  {language === 'ru' ? item.labelRu : item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}