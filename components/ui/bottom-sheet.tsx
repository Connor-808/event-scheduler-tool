'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  dismissible?: boolean;
}

export function BottomSheet({ isOpen, onClose, children, dismissible = true }: BottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Trigger animation after mount
      setTimeout(() => setIsAnimating(true), 10);
      // Prevent body scroll when sheet is open
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = '';
      }, 300);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = () => {
    if (dismissible && onClose) {
      onClose();
    }
  };

  const handleSheetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999]"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black transition-opacity duration-300 ease-out',
          isAnimating ? 'opacity-40' : 'opacity-0'
        )}
        onClick={handleBackdropClick}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-background rounded-t-[20px] shadow-2xl transition-transform duration-300 ease-out',
          'max-h-[60vh] overflow-y-auto',
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        )}
        onClick={handleSheetClick}
        style={{
          // Glassmorphism effect
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {/* Handle/Pill */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-foreground/20 rounded-full" />
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-2">
          {children}
        </div>

        {/* Safe area padding for iOS */}
        <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
      </div>
    </div>
  );
}

