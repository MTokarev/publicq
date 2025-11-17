import React from "react";
import ValidationError from "./ValidationError";

interface FormGroupProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  htmlFor?: string;
}

const FormGroup: React.FC<FormGroupProps> = ({ label, children, error, htmlFor }) => {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      <ValidationError errors={error ? [error] : []} />
    </div>
  );
};

export default FormGroup;