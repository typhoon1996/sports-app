import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    disabled,
    children, 
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden';
    
    const variants = {
      primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/30 focus-visible:ring-blue-500 active:shadow-md',
      secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-500/25 hover:from-gray-700 hover:to-gray-800 hover:shadow-xl hover:shadow-gray-500/30 focus-visible:ring-gray-500 active:shadow-md',
      outline: 'border-2 border-gray-300 bg-white text-gray-700 shadow-sm hover:border-gray-400 hover:bg-gray-50 hover:shadow-md focus-visible:ring-gray-500 active:bg-gray-100 active:shadow-sm',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 hover:shadow-sm focus-visible:ring-gray-500 active:bg-gray-200'
    };
    
    const sizes = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 py-3 px-6 text-base',
      lg: 'h-12 px-8 text-lg'
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        <span className={cn('transition-all duration-200', isLoading && 'opacity-80')}>
          {children}
        </span>
        {/* Ripple effect overlay */}
        <span className="absolute inset-0 rounded-lg bg-white opacity-0 transition-opacity duration-200 hover:opacity-10 active:opacity-20" />
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
