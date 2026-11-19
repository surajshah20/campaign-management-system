import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-text-primary tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'flex h-9 w-full rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted transition-colors shadow-subtle',
            'focus-visible:outline-none focus-visible:border-primary-500 focus-visible:ring-1 focus-visible:ring-primary-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-danger-500 focus-visible:border-danger-500 focus-visible:ring-danger-500',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-danger-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-text-secondary">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
