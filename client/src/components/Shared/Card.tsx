import React from 'react';
import { cn } from '../../utils/cn';
import styles from '../../styles/components/card.module.css';

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Card variant style */
  variant?: 'default' | 'elevated' | 'flat' | 'outlined' | 'primary' | 'success' | 'warning' | 'error';
  /** Card size */
  size?: 'sm' | 'md' | 'lg';
  /** Card header content */
  header?: React.ReactNode;
  /** Card footer content */
  footer?: React.ReactNode;
  /** Whether the card is interactive (clickable) */
  interactive?: boolean;
  /** Click handler for interactive cards */
  onClick?: () => void;
  /** Whether the card has no padding on body */
  noPadding?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Card title (when not using custom header) */
  title?: string;
  /** Card subtitle (when not using custom header) */
  subtitle?: string;
  /** Card description (when not using custom header) */
  description?: React.ReactNode;
  /** Whether to show a loading state */
  loading?: boolean;
  /** Loading message */
  loadingMessage?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  size = 'md',
  header,
  footer,
  interactive = false,
  onClick,
  noPadding = false,
  className,
  style,
  title,
  subtitle,
  description,
  loading = false,
  loadingMessage = 'Loading...'
}) => {
  const handleClick = () => {
    if (interactive && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (interactive && onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  const cardClasses = cn(
    styles.card,
    variant !== 'default' && styles[`card--${variant}`],
    size !== 'md' && styles[`card--${size}`],
    interactive && styles['card--interactive'],
    noPadding && styles['card--no-padding'],
    className
  );

  // Render custom or default header
  const renderHeader = () => {
    if (header) {
      return <div className={styles.card__header}>{header}</div>;
    }
    
    if (title || subtitle || description) {
      return (
        <div className={styles.card__header}>
          {title && <h3 className={styles.card__title}>{title}</h3>}
          {subtitle && <p className={styles.card__subtitle}>{subtitle}</p>}
          {description && <div className={styles.card__description}>{description}</div>}
        </div>
      );
    }
    
    return null;
  };

  // Render loading state
  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles['card--loading']}>
          <div className={styles['loading-spinner']} />
          <p>{loadingMessage}</p>
        </div>
      );
    }
    return children;
  };

  return (
    <div
      className={cardClasses}
      style={style}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive && title ? title : undefined}
    >
      {renderHeader()}
      <div className={styles.card__body}>
        {renderContent()}
      </div>
      {footer && <div className={styles.card__footer}>{footer}</div>}
    </div>
  );
};

// Stats card specialized component
export interface StatsCardProps extends Omit<CardProps, 'variant' | 'children'> {
  /** Main statistic number */
  number: string | number;
  /** Label for the statistic */
  label: string;
  /** Optional trend indicator */
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  /** Optional icon */
  icon?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  number,
  label,
  trend,
  icon,
  ...cardProps
}) => {
  return (
    <Card {...cardProps} variant="default" className={styles['card--stats']}>
      <div className={styles.stats__content}>
        {icon && <div className={styles.stats__icon}>{icon}</div>}
        <div className={styles.stats__number}>{number}</div>
        <div className={styles.stats__label}>{label}</div>
        {trend && (
          <div className={cn(
            styles.stats__trend,
            styles[`stats__trend--${trend.direction}`]
          )}>
            {trend.direction === 'up' && '↗'}
            {trend.direction === 'down' && '↘'}
            {trend.direction === 'neutral' && '→'}
            {trend.value}
          </div>
        )}
      </div>
    </Card>
  );
};

// Info box specialized component
export interface InfoBoxProps {
  /** Info box type */
  type: 'info' | 'success' | 'warning' | 'error';
  /** Title for the info box */
  title?: string;
  /** Info box content */
  children: React.ReactNode;
  /** Whether to show an icon */
  showIcon?: boolean;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Custom CSS classes */
  className?: string;
}

export const InfoBox: React.FC<InfoBoxProps> = ({
  type,
  title,
  children,
  showIcon = true,
  icon,
  className
}) => {
  const defaultIcons = {
    info: <img src="/images/icons/information.svg" alt="Info" style={{width: '16px', height: '16px', verticalAlign: 'middle'}} />,
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  return (
    <div className={cn(styles['info-box'], styles[`info-box--${type}`], className)}>
      {showIcon && (
        <div className={styles['info-box__icon']}>
          {icon || defaultIcons[type]}
        </div>
      )}
      <div className={styles['info-box__content']}>
        {title && <div className={styles['info-box__title']}>{title}</div>}
        <div className={styles['info-box__body']}>{children}</div>
      </div>
    </div>
  );
};

// Card grid container
export interface CardGridProps {
  /** Grid content */
  children: React.ReactNode;
  /** Grid variant */
  variant?: 'default' | 'compact';
  /** Custom CSS classes */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  variant = 'default',
  className,
  style
}) => {
  return (
    <div 
      className={cn(
        styles['card-grid'],
        variant === 'compact' && styles['card-grid--compact'],
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
};

export default Card;