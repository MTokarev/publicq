import React, { forwardRef } from 'react';
import inputStyles from './Input.module.css';

// Utility function for conditional class names
const cn = (...classes: (string | undefined | false | null)[]): string => 
  classes.filter(Boolean).join(' ');

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input variant for different styles */
  variant?: 'default' | 'error' | 'success' | 'warning';
  /** Size of the input */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the input is in a loading state */
  loading?: boolean;
  /** Icon to display at the start of the input */
  startIcon?: React.ReactNode;
  /** Icon to display at the end of the input */
  endIcon?: React.ReactNode;
  /** Helper text to display below the input */
  helperText?: string;
  /** Error message to display below the input */
  errorMessage?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Custom class name */
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  variant = 'default',
  size = 'md',
  loading = false,
  startIcon,
  endIcon,
  helperText,
  errorMessage,
  required,
  className,
  disabled,
  ...props
}, ref) => {
  const hasError = !!errorMessage || variant === 'error';
  const inputClasses = cn(
    inputStyles.input,
    inputStyles[`input--${size}`],
    inputStyles[`input--${variant}`],
    hasError && inputStyles['input--error'],
    loading && inputStyles['input--loading'],
    disabled && inputStyles['input--disabled'],
    (startIcon || endIcon) ? inputStyles['input--with-icon'] : false,
    className
  );

  const containerClasses = cn(
    inputStyles.container,
    hasError && inputStyles['container--error']
  );

  return (
    <div className={containerClasses}>
      <div className={inputStyles.inputWrapper}>
        {startIcon && (
          <div className={inputStyles.iconStart}>
            {startIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={inputClasses}
          disabled={disabled || loading}
          aria-invalid={hasError}
          aria-describedby={
            (helperText || errorMessage) ? `${props.id}-description` : undefined
          }
          {...props}
        />
        
        {endIcon && (
          <div className={inputStyles.iconEnd}>
            {endIcon}
          </div>
        )}
        
        {loading && (
          <div className={inputStyles.loadingSpinner}>
            <div className={inputStyles.spinner} />
          </div>
        )}
      </div>
      
      {(helperText || errorMessage) && (
        <div 
          id={`${props.id}-description`} 
          className={cn(
            inputStyles.description,
            hasError && inputStyles['description--error']
          )}
        >
          {errorMessage || helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;