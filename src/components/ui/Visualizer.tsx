import React from 'react';

interface VisualizerProps {
  stitches: number;
}

export const Visualizer: React.FC<VisualizerProps> = ({ stitches }) => {
  // A simplified traditional snowflake/star motif using a 9x9 CSS grid
  // 1 = colored stitch, 0 = background stitch
  const motif = [
    [0,0,0,0,1,0,0,0,0],
    [0,1,0,0,1,0,0,1,0],
    [0,0,1,0,1,0,1,0,0],
    [0,0,0,1,1,1,0,0,0],
    [1,1,1,1,1,1,1,1,1],
    [0,0,0,1,1,1,0,0,0],
    [0,0,1,0,1,0,1,0,0],
    [0,1,0,0,1,0,0,1,0],
    [0,0,0,0,1,0,0,0,0]
  ];

  // We determine how many motifs can fit roughly
  const motifWidth = 9;
  const repeats = Math.max(1, Math.floor(stitches / (motifWidth + 2)));
  const displayRepeats = Math.min(repeats, 5); // Limit visual render for performance/UI

  return (
    <div className="w-full bg-[var(--color-heritage-cream)] border-2 border-[var(--color-heritage-charcoal)] rounded-md overflow-hidden p-4 flex justify-center space-x-2">
      {Array.from({ length: displayRepeats }).map((_, i) => (
        <div key={i} className="grid grid-cols-9 gap-px bg-[var(--color-heritage-steel)]/20 p-px">
          {motif.map((row, y) => (
             row.map((cell, x) => (
               <div 
                 key={`${y}-${x}`} 
                 className={`w-3 h-3 md:w-4 md:h-4 ${cell ? 'bg-[var(--color-heritage-charcoal)]' : 'bg-transparent'}`}
               />
             ))
          ))}
        </div>
      ))}
      {repeats > displayRepeats && (
        <div className="flex items-center text-[var(--color-heritage-steel)] font-bold font-mono px-4">
          + {repeats - displayRepeats} repeticiones...
        </div>
      )}
    </div>
  );
};
