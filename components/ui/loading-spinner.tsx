/**
 * LoadingSpinner Component
 * Reusable loading state with spinner animation
 */

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function LoadingSpinner({
  message = 'Loading...',
  size = 'md',
  fullScreen = true
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const content = (
    <div className="text-center">
      <div
        className={`animate-spin rounded-full border-b-2 border-foreground mx-auto mb-4 ${sizeClasses[size]}`}
      />
      <p className="text-base text-foreground/70 font-medium">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        {content}
      </div>
    );
  }

  return content;
}
