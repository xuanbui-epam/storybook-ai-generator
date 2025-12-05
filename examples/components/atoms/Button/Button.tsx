import React from "react";

export interface ButtonProps {
  /** Text label shown on the button */
  label: string;
  /** If true, button is disabled */
  disabled?: boolean;
  /** variant: primary | secondary */
  variant?: "primary" | "secondary";
  /** onClick handler */
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ label, disabled = false, variant = "primary", onClick }) => {
  return (
    <button disabled={disabled} data-variant={variant} onClick={onClick}>
      {label}
    </button>
  );
};