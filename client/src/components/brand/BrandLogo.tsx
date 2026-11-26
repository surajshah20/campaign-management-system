import React from 'react';
import { cn } from '../../lib/utils';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
  variant?: 'dark' | 'light' | 'mono';
}

export const BrandSymbol: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none transition-transform', className)}
    >
      {/* Outer base container */}
      <rect width="32" height="32" rx="7" fill="#182230" />
      {/* Precision Geometric Apex Glyph: Left facet */}
      <path
        d="M7.5 23.5L14.2 8.5H17.8L11.2 23.5H7.5Z"
        fill="url(#brand-symbol-grad-1)"
      />
      {/* Right facet */}
      <path
        d="M24.5 23.5L17.8 8.5H14.2L20.8 23.5H24.5Z"
        fill="url(#brand-symbol-grad-2)"
      />
      {/* Intersecting central focal node & crossbar */}
      <path
        d="M11.8 17.2H20.2L18.8 14.2H13.2L11.8 17.2Z"
        fill="#FFFFFF"
        fillOpacity="0.95"
      />
      <circle cx="16" cy="8.5" r="1.5" fill="#9B8AFB" />
      <defs>
        <linearGradient
          id="brand-symbol-grad-1"
          x1="7.5"
          y1="8.5"
          x2="17.8"
          y2="23.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9B8AFB" />
          <stop offset="1" stopColor="#5145E8" />
        </linearGradient>
        <linearGradient
          id="brand-symbol-grad-2"
          x1="24.5"
          y1="23.5"
          x2="14.2"
          y2="8.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#5145E8" />
          <stop offset="1" stopColor="#7A5AF8" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
  subtitle,
  className,
  variant = 'dark',
}) => {
  const pixelSizes = {
    sm: 22,
    md: 26,
    lg: 32,
    xl: 40,
  };

  const wordmarkSizes = {
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  };

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <BrandSymbol size={pixelSizes[size]} />
      {showWordmark && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'font-bold tracking-[0.12em] uppercase font-sans text-text-primary',
                wordmarkSizes[size],
                variant === 'light' && 'text-white'
              )}
            >
              AGENCY<span className="text-primary-600 ml-1">OS</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider bg-primary-50 text-primary-700 border border-primary-100">
              PRO
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] text-text-secondary mt-1 font-normal tracking-tight truncate max-w-[150px]">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};