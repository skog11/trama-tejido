import React from 'react';

interface GaugeInputProps {
  label: string;
  value: { stitches: number; rows: number };
  onChange: (value: { stitches: number; rows: number }) => void;
}

export const GaugeInput: React.FC<GaugeInputProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-sans font-black uppercase tracking-widest text-[var(--color-knit-navy)] block mb-1">
        {label}
      </label>
      <div className="flex space-x-4">
        <div className="flex-1">
          <span className="text-xs text-[var(--color-knit-cocoa)] mb-1 block font-bold">Pts por 10cm</span>
          <input
            type="number"
            value={value.stitches || ''}
            onChange={(e) => onChange({ ...value, stitches: Number(e.target.value) })}
            className="w-full p-3 border-[3px] border-[var(--color-knit-navy)] text-center font-mono font-bold text-xl focus:border-[var(--color-knit-red)] focus:outline-none focus:ring-0 transition-colors shadow-inner bg-[var(--color-knit-cream)]"
            placeholder="Ej: 20"
          />
        </div>
        <div className="flex-1">
          <span className="text-xs text-[var(--color-knit-cocoa)] mb-1 block font-bold">Vtas por 10cm</span>
          <input
            type="number"
            value={value.rows || ''}
            onChange={(e) => onChange({ ...value, rows: Number(e.target.value) })}
            className="w-full p-3 border-[3px] border-[var(--color-knit-navy)] text-center font-mono font-bold text-xl focus:border-[var(--color-knit-red)] focus:outline-none focus:ring-0 transition-colors shadow-inner bg-[var(--color-knit-cream)]"
            placeholder="Ej: 28"
          />
        </div>
      </div>
    </div>
  );
};
