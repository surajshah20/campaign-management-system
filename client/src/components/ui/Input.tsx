import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      id,
      leftIcon,
      rightElement,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-semibold text-text-primary tracking-tight uppercase"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-text-secondary">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'flex h-9 w-full rounded-md border border-border bg-white px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted transition-all shadow-subtle',
              'focus-visible:outline-none focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500/15',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F2F4F7]',
              leftIcon && 'pl-9',
              rightElement && 'pr-9',
              error &&
                'border-danger-500 focus-visible:border-danger-500 focus-visible:ring-danger-500/15',
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2.5 flex items-center">{rightElement}</div>
          )}
        </div>
        {error ? (
          <p className="text-[11px] text-danger-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-text-secondary">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
