import React from 'react';
import type { YarnCategory } from '../../engine/patternEngine';

const YARN_CATEGORIES: YarnCategory[] = [
  'Lace', 'Fingering', 'Sport', 'DK', 'Worsted', 'Aran', 'Bulky', 'Super Bulky'
];

interface YarnSelectorProps {
  label: string;
  value: YarnCategory;
  onChange: (value: YarnCategory) => void;
}

export const YarnSelector: React.FC<YarnSelectorProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-sans font-black uppercase tracking-widest text-[var(--color-knit-navy)]">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as YarnCategory)}
          className="w-full appearance-none bg-white border-[3px] border-[var(--color-knit-navy)] p-4 pr-10 font-serif font-black text-xl text-[var(--color-knit-navy)] focus:border-[var(--color-knit-red)] focus:outline-none focus:ring-0 transition-colors cursor-pointer shadow-[4px_4px_0_0_var(--color-knit-navy)] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--color-knit-navy)]"
        >
          {YARN_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-knit-navy)]">
          <svg className="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
    </div>
  );
};
