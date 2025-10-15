/**
 * StatusIcon Component
 * Reusable icon for success/error/warning/info states
 */

interface StatusIconProps {
  type: 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusIcon({ type, size = 'md', className = '' }: StatusIconProps) {
  const config = {
    success: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      color: 'text-green-600 dark:text-green-400',
      path: 'M5 13l4 4L19 7',
    },
    error: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      color: 'text-red-600 dark:text-red-400',
      path: 'M6 18L18 6M6 6l12 12',
    },
    warning: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      color: 'text-yellow-600 dark:text-yellow-400',
      path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    },
    info: {
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      color: 'text-blue-600 dark:text-blue-400',
      path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  };

  const sizes = {
    sm: { container: 'w-12 h-12', icon: 'w-6 h-6' },
    md: { container: 'w-16 h-16', icon: 'w-8 h-8' },
    lg: { container: 'w-20 h-20', icon: 'w-10 h-10' },
  };

  const { bg, color, path } = config[type];
  const { container, icon } = sizes[size];

  return (
    <div className={`inline-flex items-center justify-center ${container} rounded-full ${bg} shadow-lg ${className}`}>
      <svg className={`${icon} ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
      </svg>
    </div>
  );
}
