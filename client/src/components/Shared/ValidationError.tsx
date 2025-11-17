import React from "react";

interface ValidationErrorProps {
  errors?: string[];
}

const ValidationError: React.FC<ValidationErrorProps> = ({ errors }) => {
  if (!errors) return null;

  return (
    <p className="text-sm text-red-600 mt-1">
      {errors}
    </p>
  );
};

export default ValidationError;