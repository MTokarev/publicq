import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import styles from '../../styles/components/modal.module.css';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to call when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal subtitle */
  subtitle?: string;
  /** Modal description */
  description?: string;
  /** Modal size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Modal overlay variant */
  overlay?: 'light' | 'dark' | 'black';
  /** Modal type variant */
  variant?: 'default' | 'confirmation' | 'loading' | 'form';
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether modal content has no padding */
  noPadding?: boolean;
  /** Whether modal body is scrollable */
  scrollableBody?: boolean;
  /** Custom close button content */
  closeButtonContent?: React.ReactNode;
  /** Modal content */
  children: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Custom CSS classes */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Whether to close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Whether to close on escape key */
  closeOnEscape?: boolean;
  /** Custom z-index */
  zIndex?: number;
  /** Loading state */
  loading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Confirmation icon */
  confirmationIcon?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  description,
  size = 'md',
  overlay = 'dark',
  variant = 'default',
  showCloseButton = true,
  noPadding = false,
  scrollableBody = false,
  closeButtonContent = '×',
  children,
  footer,
  className,
  style,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  zIndex,
  loading = false,
  loadingMessage = 'Loading...',
  confirmationIcon
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, onClose, closeOnEscape]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Add class to prevent body scroll
      document.body.classList.add('modal-open');
      
      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus();
      }
    } else {
      // Remove class to restore body scroll
      document.body.classList.remove('modal-open');
      
      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    // Cleanup function
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className={cn(
        styles['modal-overlay'],
        styles[`modal-overlay--${overlay}`]
      )}
      onClick={handleOverlayClick}
      style={zIndex ? { zIndex } : undefined}
    >
      <div 
        ref={modalRef}
        className={cn(
          styles.modal,
          styles[`modal--${size}`],
          variant === 'confirmation' && styles['modal--confirmation'],
          variant === 'loading' && styles['modal--loading'],
          noPadding && styles['modal--no-padding'],
          className
        )}
        style={style}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        data-focus-trap
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={styles.modal__header}>
            <div>
              {title && (
                <h2 id="modal-title" className={styles.modal__title}>
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className={styles.modal__subtitle}>
                  {subtitle}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                className={styles.modal__close}
                onClick={onClose}
                aria-label="Close modal"
              >
                {closeButtonContent}
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div 
          className={cn(
            styles.modal__body,
            scrollableBody && styles['modal__body--scrollable']
          )}
        >
          {/* Loading state */}
          {loading && (
            <div className={styles['modal--loading']}>
              <div className={styles['loading-spinner']} />
              <p>{loadingMessage}</p>
            </div>
          )}

          {/* Confirmation icon for confirmation variant */}
          {variant === 'confirmation' && confirmationIcon && (
            <div className={styles.confirmation__icon}>
              {confirmationIcon}
            </div>
          )}

          {/* Description */}
          {description && (
            <p id="modal-description" className={styles.modal__description}>
              {description}
            </p>
          )}

          {/* Main content */}
          {!loading && children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={styles.modal__footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Render modal using portal to document.body
  return createPortal(modalContent, document.body);
};

// Form-specific modal wrapper
export interface ModalFormProps extends Omit<ModalProps, 'variant' | 'children'> {
  /** Form fields */
  children: React.ReactNode;
  /** Form submit handler */
  onSubmit?: (e: React.FormEvent) => void;
  /** Primary action button */
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'primary' | 'danger';
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
}

export const ModalForm: React.FC<ModalFormProps> = ({
  children,
  onSubmit,
  primaryAction,
  secondaryAction,
  ...modalProps
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    } else if (primaryAction?.onClick) {
      primaryAction.onClick();
    }
  };

  const footer = (primaryAction || secondaryAction) ? (
    <div className={styles['modal-form__actions']}>
      {secondaryAction && (
        <button
          type="button"
          onClick={secondaryAction.onClick}
          disabled={secondaryAction.disabled}
          className="btn btn--outline"
        >
          {secondaryAction.label}
        </button>
      )}
      {primaryAction && (
        <button
          type="submit"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled || primaryAction.loading}
          className={cn(
            'btn',
            primaryAction.variant === 'danger' ? 'btn--danger' : 'btn--primary'
          )}
        >
          {primaryAction.loading ? 'Loading...' : primaryAction.label}
        </button>
      )}
    </div>
  ) : undefined;

  return (
    <Modal 
      {...modalProps} 
      variant="form"
      footer={footer}
    >
      <form className={styles['modal-form']} onSubmit={handleSubmit}>
        {children}
      </form>
    </Modal>
  );
};

// Confirmation modal wrapper
export interface ModalConfirmationProps extends Omit<ModalProps, 'variant' | 'children'> {
  /** Confirmation message */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm button variant */
  confirmVariant?: 'primary' | 'danger';
  /** Confirm action handler */
  onConfirm: () => void;
  /** Cancel action handler */
  onCancel?: () => void;
  /** Warning icon */
  icon?: React.ReactNode;
}

export const ModalConfirmation: React.FC<ModalConfirmationProps> = ({
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  icon = '⚠️',
  onClose,
  ...modalProps
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const footer = (
    <div className={styles['modal-form__actions']}>
      <button
        type="button"
        onClick={handleCancel}
        className="btn btn--outline"
      >
        {cancelText}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className={cn(
          'btn',
          confirmVariant === 'danger' ? 'btn--danger' : 'btn--primary'
        )}
      >
        {confirmText}
      </button>
    </div>
  );

  return (
    <Modal 
      {...modalProps}
      variant="confirmation"
      confirmationIcon={icon}
      footer={footer}
      onClose={onClose}
    >
      <p>{message}</p>
    </Modal>
  );
};

export default Modal;