/**
 * FixedBottomCTA Component
 * Reusable fixed bottom CTA container for mobile
 */

import { ReactNode } from 'react';

interface FixedBottomCTAProps {
  children: ReactNode;
  showOnMobile?: boolean;
  className?: string;
}

export function FixedBottomCTA({
  children,
  showOnMobile = true,
  className = ''
}: FixedBottomCTAProps) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-foreground/10 ${
        showOnMobile ? 'sm:hidden' : ''
      } z-50 ${className}`}
    >
      <div className="px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  );
}
