import React from 'react';
import { cn } from '../../utils/cn';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Whether the button should take full width */
  fullWidth?: boolean;
  /** Icon to display before the text */
  iconLeft?: React.ReactNode;
  /** Icon to display after the text */
  iconRight?: React.ReactNode;
  /** Button content */
  children?: React.ReactNode;
}

/**
 * Button component following CSS Modules pattern with design tokens
 * 
 * @example
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 * 
 * @example
 * <Button variant="outline" loading disabled>
 *   Loading...
 * </Button>
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  children,
  className,
  disabled,
  ...props
}) => {
  const hasIcon = Boolean(iconLeft || iconRight);

  return (
    <button
      className={cn(
        styles.button,
        styles[`button--${variant}`],
        styles[`button--${size}`],
        {
          [styles['button--loading']]: loading,
          [styles['button--full-width']]: fullWidth,
          [styles['button--with-icon']]: hasIcon,
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {iconLeft && (
        <span className={cn(styles.button__icon, styles['button__icon--left'])}>
          {iconLeft}
        </span>
      )}
      {children}
      {iconRight && (
        <span className={cn(styles.button__icon, styles['button__icon--right'])}>
          {iconRight}
        </span>
      )}
    </button>
  );
};

export default Button;