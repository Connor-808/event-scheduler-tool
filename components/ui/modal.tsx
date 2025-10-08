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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full rounded-2xl bg-background p-6 shadow-xl',
          'animate-in fade-in-0 zoom-in-95',
          sizes[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-foreground/60 hover:bg-foreground/10 hover:text-foreground transition-colors"
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
          <div className="mb-6 pr-8">
            {title && (
              <h2 id="modal-title" className="text-2xl font-semibold">
                {title}
              </h2>
            )}
            {description && (
              <p id="modal-description" className="mt-2 text-sm text-foreground/60">
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
      className={cn('mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3', className)}
      {...props}
    />
  );
}

