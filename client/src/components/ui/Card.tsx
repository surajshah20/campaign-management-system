import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  hoverable = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface p-5 shadow-subtle',
        hoverable &&
          'transition-all duration-150 hover:border-slate-300 hover:shadow-card cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
