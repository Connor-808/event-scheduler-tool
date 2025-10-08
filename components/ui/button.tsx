import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none touch-manipulation';

    const variants = {
      primary:
        'bg-foreground text-background hover:bg-foreground/90 active:scale-[0.98] active:bg-foreground/80 focus-visible:ring-foreground shadow-sm hover:shadow-md',
      secondary:
        'border-2 border-foreground/20 bg-transparent text-foreground hover:bg-foreground/5 hover:border-foreground/30 active:scale-[0.98] active:bg-foreground/10 focus-visible:ring-foreground/50',
      tertiary:
        'text-foreground hover:bg-foreground/10 active:bg-foreground/15 active:scale-[0.98] focus-visible:ring-foreground/50',
      destructive:
        'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] active:bg-red-800 focus-visible:ring-red-600 shadow-sm hover:shadow-md',
    };

    // Enhanced mobile-first sizing with minimum 44px touch targets
    const sizes = {
      sm: 'min-h-[44px] h-10 px-4 text-sm sm:h-9 sm:min-h-0',
      md: 'min-h-[44px] h-12 px-6 text-base sm:h-11',
      lg: 'min-h-[48px] h-14 px-8 text-base sm:text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };


