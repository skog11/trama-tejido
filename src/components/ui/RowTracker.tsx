import React, { useState } from 'react';
import type { CalculationResult } from '../../engine/patternEngine';

interface RowTrackerProps {
  sectionName: string;
  totalRows?: number;
  result: CalculationResult;
  onClose: () => void;
}

export const RowTracker: React.FC<RowTrackerProps> = ({ sectionName, totalRows, result, onClose }) => {
  const [currentRow, setCurrentRow] = useState(1);

  let alertInterval = 0;
  if (result.shapingRate) {
    const match = result.shapingRate.match(/cada (\d+) vueltas/i);
    if (match && match[1]) {
      alertInterval = parseInt(match[1], 10);
    }
  }

  const isAlertRow = alertInterval > 0 && currentRow > 1 && (currentRow % alertInterval === 0);

  const handleNext = () => {
    if (!totalRows || currentRow < totalRows) setCurrentRow(c => c + 1);
  };
  
  const handlePrev = () => {
    if (currentRow > 1) setCurrentRow(c => c - 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-selbu-navy flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300">
      {/* Decorative Border */}
      <div className="absolute top-0 left-0 w-full h-8 bg-zigzag-red shadow-[0_4px_0_0_var(--color-knit-cocoa)]"></div>
      <div className="absolute bottom-0 left-0 w-full h-8 bg-zigzag-red shadow-[0_-4px_0_0_var(--color-knit-cocoa)]"></div>

      <div className="absolute top-12 right-12">
        <button onClick={onClose} className="bg-[var(--color-knit-cream)] text-[var(--color-knit-navy)] border-[4px] border-[var(--color-knit-cocoa)] hover:bg-[var(--color-knit-mustard)] p-2 shadow-[4px_4px_0_0_var(--color-knit-cocoa)] transition-all">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="mb-12 bg-[var(--color-knit-cream)] border-[6px] border-[var(--color-knit-red)] p-6 shadow-[8px_8px_0_0_var(--color-knit-cocoa)] rotate-2">
        <h2 className="text-xl font-sans text-[var(--color-knit-cocoa)] uppercase tracking-widest font-black mb-2">Modo Tejido</h2>
        <h1 className="text-5xl font-serif text-[var(--color-knit-navy)] font-black">{sectionName}</h1>
      </div>

      <div className="flex items-center space-x-12 mb-12">
        <button onClick={handlePrev} className="bg-[var(--color-knit-mustard)] text-[var(--color-knit-navy)] border-[4px] border-[var(--color-knit-navy)] p-4 shadow-[4px_4px_0_0_var(--color-knit-navy)] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:hover:translate-y-0" disabled={currentRow <= 1}>
          <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        
        <div 
          onClick={handleNext}
          className={`w-72 h-72 rounded-none flex flex-col items-center justify-center cursor-pointer transition-all duration-300 select-none border-[8px] ${isAlertRow ? 'border-[var(--color-knit-cream)] bg-[var(--color-knit-red)] shadow-[12px_12px_0_0_var(--color-knit-mustard)] scale-110' : 'border-[var(--color-knit-navy)] bg-[var(--color-knit-cream)] shadow-[12px_12px_0_0_var(--color-knit-mustard)] hover:bg-white hover:scale-105'}`}
        >
          <span className={`text-xl font-black uppercase tracking-widest mb-2 ${isAlertRow ? 'text-[var(--color-knit-cream)]' : 'text-[var(--color-knit-cocoa)]'}`}>
            VUELTA
          </span>
          <span className={`text-9xl font-black font-mono leading-none ${isAlertRow ? 'text-white' : 'text-[var(--color-knit-navy)]'}`}>
            {currentRow}
          </span>
          {totalRows && (
             <span className={`text-2xl font-black mt-2 ${isAlertRow ? 'text-[var(--color-knit-mustard)]' : 'text-[var(--color-knit-teal)]'}`}>
               / {totalRows}
             </span>
          )}
        </div>

        <button onClick={handleNext} className="bg-[var(--color-knit-mustard)] text-[var(--color-knit-navy)] border-[4px] border-[var(--color-knit-navy)] p-4 shadow-[4px_4px_0_0_var(--color-knit-navy)] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:hover:translate-y-0" disabled={totalRows ? currentRow >= totalRows : false}>
          <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="h-24">
        {isAlertRow ? (
          <div className="animate-bounce bg-[var(--color-knit-cream)] text-[var(--color-knit-red)] px-8 py-4 border-[6px] border-[var(--color-knit-red)] shadow-[8px_8px_0_0_var(--color-knit-cocoa)]">
            <h3 className="text-2xl font-black uppercase tracking-wider mb-1">¡ATENCIÓN TEJEDORA!</h3>
            <p className="text-xl font-bold font-serif">{result.shapingRate}</p>
          </div>
        ) : (
          <div className="bg-[var(--color-knit-navy)] text-[var(--color-knit-cream)] px-8 py-4 border-[4px] border-[var(--color-knit-teal)] shadow-[4px_4px_0_0_var(--color-knit-cocoa)]">
            <span className="text-sm uppercase tracking-widest font-black text-[var(--color-knit-teal)]">Instrucción Activa</span>
            <p className="text-xl font-serif font-bold mt-1">{result.shapingRate || 'Tejer recto (sin cambios)'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
