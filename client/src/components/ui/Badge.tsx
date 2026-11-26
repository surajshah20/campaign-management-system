import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[10px] font-medium gap-1',
    md: 'px-2 py-0.5 text-[11px] font-medium gap-1.5',
  };

  const variantStyles = {
    default: 'bg-primary-50 text-primary-700 border border-primary-200/60',
    success: 'bg-success-50 text-success-700 border border-success-100',
    warning: 'bg-warning-50 text-warning-700 border border-warning-100',
    danger: 'bg-danger-50 text-danger-700 border border-danger-100',
    neutral: 'bg-[#F2F4F7] text-[#344054] border border-[#E4E7EC]',
    outline: 'border border-border text-text-secondary bg-white shadow-subtle',
  };

  const dotColors = {
    default: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600',
    neutral: 'bg-slate-400',
    outline: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md leading-none tracking-tight select-none',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'inline-block rounded-full',
            size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};
