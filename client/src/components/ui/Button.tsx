import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus-visible:border-primary-600 disabled:opacity-50 disabled:pointer-events-none rounded-md select-none active:scale-[0.98]';

    const sizeStyles = {
      xs: 'h-7 px-2 text-[11px] gap-1',
      sm: 'h-8 px-2.5 text-xs gap-1.5',
      md: 'h-9 px-3.5 text-xs gap-2',
      lg: 'h-10 px-4 text-sm gap-2.5',
    };

    const variantStyles = {
      primary:
        'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-subtle border border-primary-700/20',
      secondary:
        'bg-surface-subtle text-text-primary hover:bg-[#EAECF0] active:bg-[#D0D5DD] border border-border shadow-subtle',
      outline:
        'border border-border bg-white text-text-primary hover:bg-surface-subtle hover:border-slate-300 active:bg-slate-100 shadow-subtle',
      ghost:
        'text-text-secondary hover:text-text-primary hover:bg-surface-subtle',
      danger:
        'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 shadow-subtle border border-danger-700/20',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children && <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{children}</span>}
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
