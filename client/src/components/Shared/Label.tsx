import React from 'react';
import labelStyles from './Label.module.css';

// Utility function for conditional class names
const cn = (...classes: (string | undefined | false | null)[]): string => 
  classes.filter(Boolean).join(' ');

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is optional (adds optional text) */
  optional?: boolean;
  /** Size of the label */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
  /** Children content */
  children: React.ReactNode;
}

const Label: React.FC<LabelProps> = ({
  required = false,
  optional = false,
  size = 'md',
  className,
  children,
  ...props
}) => {
  const labelClasses = cn(
    labelStyles.label,
    labelStyles[`label--${size}`],
    required && labelStyles['label--required'],
    className
  );

  return (
    <label className={labelClasses} {...props}>
      <span className={labelStyles.text}>
        {children}
        {required && (
          <span className={labelStyles.requiredIndicator} aria-label="required">
            *
          </span>
        )}
        {optional && (
          <span className={labelStyles.optionalIndicator}>
            (optional)
          </span>
        )}
      </span>
    </label>
  );
};

export default Label;