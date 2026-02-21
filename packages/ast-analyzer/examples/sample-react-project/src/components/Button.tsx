import React from 'react';

interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  onClick: () => void;
}

export function Button({ label, variant = 'primary', disabled, onClick }: ButtonProps) {
  const className = `btn btn-${variant}`;

  return (
    <button className={className} disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
}

export default Button;
