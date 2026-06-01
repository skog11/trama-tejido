import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white shadow-sm border border-[var(--color-heritage-steel)]/20 ${className}`}
    >
      {children}
    </div>
  );
};
