import React, { forwardRef } from 'react';
import Input, { InputProps } from './Input';
import Label, { LabelProps } from './Label';
import fieldGroupStyles from './FieldGroup.module.css';

// Utility function for conditional class names
const cn = (...classes: (string | undefined | false | null)[]): string => 
  classes.filter(Boolean).join(' ');

export interface FieldGroupProps {
  /** Label text */
  label: string;
  /** Input props */
  inputProps: InputProps;
  /** Label props */
  labelProps?: Omit<LabelProps, 'children'>;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is optional */
  optional?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper text to display */
  helperText?: string;
  /** Custom class name for the group */
  className?: string;
  /** ID for the input (will be used for label htmlFor) */
  id: string;
}

const FieldGroup = forwardRef<HTMLInputElement, FieldGroupProps>(({
  label,
  inputProps,
  labelProps = {},
  required = false,
  optional = false,
  error,
  helperText,
  className,
  id,
  ...props
}, ref) => {
  const groupClasses = cn(
    fieldGroupStyles.fieldGroup,
    error && fieldGroupStyles['fieldGroup--error'],
    className
  );

  // Combine error and helper text, prioritizing error
  const description = error || helperText;
  const hasError = !!error;

  return (
    <div className={groupClasses} {...props}>
      <Label
        htmlFor={id}
        required={required}
        optional={optional}
        {...labelProps}
      >
        {label}
      </Label>
      
      <Input
        ref={ref}
        id={id}
        variant={hasError ? 'error' : inputProps.variant}
        errorMessage={error}
        helperText={helperText}
        {...inputProps}
      />
    </div>
  );
});

FieldGroup.displayName = 'FieldGroup';

export default FieldGroup;