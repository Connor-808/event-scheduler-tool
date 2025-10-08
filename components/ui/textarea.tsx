import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold mb-2 text-foreground">
            {label}
            {props.required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <textarea
          className={cn(
            'flex min-h-[120px] w-full rounded-lg border-2 border-foreground/20 bg-background px-4 py-3 text-base leading-relaxed',
            'placeholder:text-foreground/40',
            'focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground',
            'hover:border-foreground/30',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-foreground/5',
            'resize-y',
            'transition-colors duration-200',
            'touch-manipulation',
            error && 'border-red-600 focus:ring-red-600/20 focus:border-red-600',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-foreground/60">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };


