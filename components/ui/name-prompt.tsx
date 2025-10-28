'use client';

import { useState, useEffect, useRef } from 'react';
import { BottomSheet } from './bottom-sheet';
import { setUserName } from '@/lib/utils';

interface NamePromptProps {
  isOpen: boolean;
  onComplete: (name: string) => void;
}

export function NamePrompt({ isOpen, onComplete }: NamePromptProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Auto-focus the input when sheet opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 350); // Wait for animation to complete
    }
  }, [isOpen]);

  const trimmedName = name.trim();
  const isValid = trimmedName.length >= 2 && trimmedName.length <= 30;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      // Save name to cookie
      setUserName(trimmedName);
      // Call completion handler
      onComplete(trimmedName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleSubmit(e);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} dismissible={false}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            What should we call you?
          </h3>
          <p className="text-sm text-foreground/60">
            Your friends will see this name when you vote
          </p>
        </div>

        {/* Input */}
        <div>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your name"
            maxLength={30}
            className="w-full h-12 px-4 text-base font-medium rounded-xl border-2 border-foreground/20 bg-background focus:border-foreground focus:outline-none focus:ring-0 transition-colors"
            style={{ fontSize: '16px' }} // Prevent iOS zoom
          />
        </div>

        {/* Continue Button */}
        <button
          type="submit"
          disabled={!isValid}
          className="w-full h-14 rounded-xl font-semibold text-base text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          style={{
            background: isValid
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: isValid ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none',
          }}
        >
          Continue
        </button>
      </form>
    </BottomSheet>
  );
}

