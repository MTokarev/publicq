import React from 'react';
import styles from '../../styles/validation.module.css';

export interface ValidationMessageProps {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  size?: 'small' | 'normal' | 'large';
  className?: string;
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  type,
  message,
  size = 'normal',
  className = ''
}) => {
  const sizeClass = size !== 'normal' ? `--${size}` : '';
  const messageClass = `${type}Message${sizeClass}`;
  
  return (
    <div className={`${styles.message} ${styles[messageClass]} ${className}`}>
      {message}
    </div>
  );
};

export interface FieldValidationProps {
  error?: string;
  success?: string;
  warning?: string;
  info?: string;
  className?: string;
}

export const FieldValidation: React.FC<FieldValidationProps> = ({
  error,
  success,
  warning,
  info,
  className = ''
}) => {
  if (!error && !success && !warning && !info) return null;

  const message = error || success || warning || info;
  const type = error ? 'error' : success ? 'success' : warning ? 'warning' : 'info';
  const fieldClass = `field${type.charAt(0).toUpperCase() + type.slice(1)}`;

  return (
    <span className={`${styles[fieldClass]} ${className}`}>
      {message}
    </span>
  );
};

export interface ValidationListProps {
  items: Array<{
    type: 'error' | 'success' | 'warning' | 'info';
    message: string;
  }>;
  className?: string;
}

export const ValidationList: React.FC<ValidationListProps> = ({
  items,
  className = ''
}) => {
  if (!items || items.length === 0) return null;

  return (
    <ul className={`${styles.validationList} ${className}`}>
      {items.map((item, index) => {
        const itemClass = `validationItem--${item.type}`;
        return (
          <li key={index} className={`${styles.validationItem} ${styles[itemClass]}`}>
            {item.message}
          </li>
        );
      })}
    </ul>
  );
};

export interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  validationState?: 'error' | 'success' | 'warning';
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  children,
  className = '',
  validationState
}) => {
  const sectionClass = validationState ? `formSection--${validationState}` : '';
  
  return (
    <div className={`${sectionClass ? styles[sectionClass] : ''} ${className}`}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
};

// Loading state component for forms
export interface FormLoadingProps {
  message?: string;
  className?: string;
}

export const FormLoading: React.FC<FormLoadingProps> = ({
  message = 'Loading...',
  className = ''
}) => {
  return (
    <div className={`${styles.validationLoading} ${className}`}>
      {message}
    </div>
  );
};