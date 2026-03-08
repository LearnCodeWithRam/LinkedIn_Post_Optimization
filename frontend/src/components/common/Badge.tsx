// src/components/common/Badge.tsx
import { cn } from '@/utils/helpers';
import React from 'react';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-primary-100 text-primary-800',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  error: 'bg-error-50 text-error-700',
  info: 'bg-blue-50 text-blue-700',
  default: 'bg-gray-100 text-gray-700',
};

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'default', 
  children, 
  dot, 
  className,
  ...props 
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <svg className="mr-1.5 h-2 w-2 fill-current" viewBox="0 0 8 8">
          <circle cx="4" cy="4" r="3" />
        </svg>
      )}
      {children}
    </span>
  );
};