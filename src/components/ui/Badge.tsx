import React from 'react';
import type { ConfidenceStatus } from '../../engine/patternEngine';

interface BadgeProps {
  status: ConfidenceStatus;
}

const statusConfig: Record<ConfidenceStatus, { label: string; bgColor: string; textColor: string; border: string }> = {
  'SEGURO': { label: 'Perfecto', bgColor: 'bg-[var(--color-knit-teal)]', textColor: 'text-[var(--color-knit-cream)]', border: 'border-[var(--color-knit-navy)]' },
  'REVISAR': { label: 'Ajustado', bgColor: 'bg-[var(--color-knit-mustard)]', textColor: 'text-[var(--color-knit-navy)]', border: 'border-[var(--color-knit-cocoa)]' },
  'RIESGOSO': { label: 'Riesgo', bgColor: 'bg-[var(--color-knit-red)]', textColor: 'text-white', border: 'border-[var(--color-knit-darkred)]' },
  'NO_RECOMENDADO': { label: 'Inválido', bgColor: 'bg-[var(--color-knit-cocoa)]', textColor: 'text-[var(--color-knit-cream)]', border: 'border-[var(--color-knit-navy)]' },
};

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-black uppercase tracking-widest ${config.bgColor} ${config.textColor} border-[3px] ${config.border} shadow-[2px_2px_0_0_var(--color-knit-navy)]`}>
      {config.label}
    </span>
  );
};
