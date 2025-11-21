'use client';

import React from 'react';
import { HeroCard } from '@/components/ui/hero-card';
import { SoftGateBanner } from '@/components/ui/soft-gate-banner';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <SoftGateBanner />
        <HeroCard />
      </div>
    </div>
  );
}