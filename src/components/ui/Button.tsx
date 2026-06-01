import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "px-6 py-2.5 rounded-sm font-sans text-sm tracking-wide transition-all duration-200 ease-in-out focus:outline-none";
  
  const variants = {
    primary: "bg-[var(--color-fjord-blue)] text-white hover:opacity-90 shadow-sm",
    secondary: "bg-[var(--color-nordic-steel)] text-white hover:opacity-90",
    outline: "bg-transparent border border-[var(--color-nordic-coal)] text-[var(--color-nordic-coal)] hover:bg-[var(--color-nordic-coal)] hover:text-white"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
