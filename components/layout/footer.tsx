'use client';

import React from 'react';
import Link from 'next/link';
import { useAppContext } from '@/lib/contexts/app-context';

export function Footer() {
  const { language } = useAppContext();

  const links = [
    {
      href: '/terms',
      label: language === 'ru' ? 'Условия использования' : 'Terms of Service',
    },
    {
      href: '/privacy',
      label: language === 'ru' ? 'Конфиденциальность' : 'Privacy Policy',
    },
    {
      href: '/support',
      label: language === 'ru' ? 'Поддержка' : 'Support',
    },
  ];

  return (
    <footer className="border-t bg-muted/50 mt-auto">
      <div className="container px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div>
            © 2024 DAOsail. {language === 'ru' ? 'Все права защищены.' : 'All rights reserved.'}
          </div>
          <nav className="flex items-center space-x-4" role="contentinfo">
            {links.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}