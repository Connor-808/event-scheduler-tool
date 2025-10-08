'use client';

import { HTMLAttributes, ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, description, children, size = 'md' }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent scroll on body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full bg-background shadow-2xl',
          'rounded-t-2xl sm:rounded-2xl',
          'p-5 sm:p-6',
          'max-h-[90vh] overflow-y-auto',
          'animate-in fade-in-0 slide-in-from-bottom-4 sm:zoom-in-95',
          sizes[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        {/* Close button - larger touch target on mobile */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 sm:right-5 sm:top-5 rounded-full p-2 sm:p-2.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center text-foreground/60 hover:bg-foreground/10 hover:text-foreground active:bg-foreground/15 transition-colors touch-manipulation"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        {(title || description) && (
          <div className="mb-5 sm:mb-6 pr-12">
            {title && (
              <h2 id="modal-title" className="text-xl sm:text-2xl font-bold leading-tight">
                {title}
              </h2>
            )}
            {description && (
              <p id="modal-description" className="mt-2 text-sm sm:text-base text-foreground/60 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}

export type ModalFooterProps = HTMLAttributes<HTMLDivElement>;

export function ModalFooter({ className, ...props }: ModalFooterProps) {
  return (
    <div
      className={cn('mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3', className)}
      {...props}
    />
  );
}

