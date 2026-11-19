import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[10px] font-semibold',
    md: 'px-2 py-0.5 text-xs font-medium',
  };

  const variantStyles = {
    default: 'bg-primary-50 text-primary-700 border border-primary-100',
    success: 'bg-success-50 text-success-700 border border-success-100',
    warning: 'bg-warning-50 text-warning-700 border border-warning-100',
    danger: 'bg-danger-50 text-danger-700 border border-danger-100',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    outline: 'border border-border text-text-secondary bg-white',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full leading-none tracking-tight select-none',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
