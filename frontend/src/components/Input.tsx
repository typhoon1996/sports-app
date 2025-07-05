import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text', 
    label, 
    error, 
    helpText, 
    success, 
    leftIcon, 
    rightIcon, 
    variant = 'default',
    size = 'md',
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    
    const sizeClasses = {
      sm: 'h-8 px-2 py-1 text-xs',
      md: 'h-10 px-3 py-2 text-sm',
      lg: 'h-12 px-4 py-3 text-base'
    };
    
    const variantClasses = {
      default: 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500/20',
      filled: 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-blue-500/20 focus:bg-white',
      minimal: 'border-0 border-b-2 border-gray-200 bg-transparent rounded-none focus:border-blue-500 focus:ring-0 px-0'
    };
    
    const baseClasses = cn(
      'flex w-full rounded-md border transition-all duration-200 ease-in-out',
      'placeholder:text-gray-400 focus:outline-none focus:ring-2',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
      sizeClasses[size],
      variantClasses[variant],
      {
        'border-red-500 focus:border-red-500 focus:ring-red-500/20': error,
        'border-green-500 focus:border-green-500 focus:ring-green-500/20': success,
        'pl-10': leftIcon,
        'pr-10': rightIcon || isPassword,
        'shadow-sm': variant === 'default' && isFocused,
        'transform scale-[1.02]': variant === 'filled' && isFocused,
      },
      className
    );
    
    const labelClasses = cn(
      'block text-sm font-medium transition-colors duration-200',
      {
        'text-gray-700': !error && !success,
        'text-red-600': error,
        'text-green-600': success,
        'text-blue-600': isFocused && !error && !success,
      }
    );

    return (
      <div className="space-y-2">
        {label && (
          <label className={labelClasses}>
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            type={inputType}
            className={baseClasses}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          
          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {success && !error && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {error && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            {rightIcon && !isPassword && !success && !error && (
              <div className="text-gray-400">
                {rightIcon}
              </div>
            )}
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="flex items-center space-x-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Help text */}
        {helpText && !error && (
          <p className="text-sm text-gray-500">{helpText}</p>
        )}
        
        {/* Success message */}
        {success && !error && (
          <div className="flex items-center space-x-1 text-sm text-green-600">
            <Check className="h-4 w-4 flex-shrink-0" />
            <span>Valid input</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
