export type YarnCategory = 'Lace' | 'Fingering' | 'Sport' | 'DK' | 'Worsted' | 'Aran' | 'Bulky' | 'Super Bulky';

export interface Gauge {
  stitches: number;
  rows: number;
}

export interface Shaping {
  type: 'increase' | 'decrease';
  stitchesToChange: number;
  overOriginalRows: number;
}

export interface PatternSection {
  id: string;
  name: string;
  originalStitches: number;
  originalRows?: number;
  repeatMultiple?: number; // e.g. 8 for an 8-stitch cable
  shaping?: Shaping;
}

export interface ProjectData {
  id: string;
  name: string;
  patternName: string;
  garmentType: string;
  notes: string;
  lastModified: number;
  originalGauge: Gauge;
  targetGauge: Gauge;
  originalYarn: YarnCategory;
  targetYarn: YarnCategory;
  originalSizeCm?: number;
  targetSizeCm?: number;
  originalMetrage?: number;
  blockingFactorPercent?: number; // Level 2: Blocking Factor
  sections: PatternSection[];
  version?: number; // Level 5: schema migration
}

export type ConfidenceStatus = 'SEGURO' | 'REVISAR' | 'RIESGOSO' | 'NO_RECOMENDADO';

export interface MultipleSuggestion {
  option: number;
  diffCm: number;
  isIdeal: boolean;
}

export interface CalculationResult {
  targetStitches: number;
  targetRows?: number;
  statusH: ConfidenceStatus; // Level 2: Axis independent
  statusV: ConfidenceStatus;
  warnings: string[];
  adjustedForMultiple: boolean;
  shapingRate?: string;
  multipleSuggestions?: MultipleSuggestion[]; // Level 2: Multiple suggestions
}

function findNearestMultiple(target: number, multiple: number): number {
  const remainder = target % multiple;
  if (remainder === 0) return target;
  
  const lower = target - remainder;
  const upper = lower + multiple;
  
  return (target - lower < upper - target) ? lower : upper;
}

export function calculateStitchConversion(project: ProjectData, section: PatternSection): CalculationResult {
  const result: CalculationResult = {
    targetStitches: 0,
    statusH: 'NO_RECOMENDADO',
    statusV: 'SEGURO', // default to safe if no rows
    warnings: [],
    adjustedForMultiple: false
  };

  if (!project.originalGauge.stitches || !project.targetGauge.stitches || !section.originalStitches) {
    return result;
  }

  // Calculate Base Ratio and apply Size scaling if provided
  let sizeRatio = 1;
  if (project.originalSizeCm && project.targetSizeCm) {
    sizeRatio = project.targetSizeCm / project.originalSizeCm;
  }

  const stitchRatio = project.targetGauge.stitches / project.originalGauge.stitches;
  const rawTargetStitches = section.originalStitches * stitchRatio * sizeRatio;
  let finalStitches = Math.round(rawTargetStitches);

  // Symmetry check (Level 2)
  const isOriginalOdd = section.originalStitches % 2 !== 0;
  
  // Adjust for repeat multiples
  if (section.repeatMultiple && section.repeatMultiple > 1) {
    const adjusted = findNearestMultiple(finalStitches, section.repeatMultiple);
    if (adjusted !== finalStitches) {
      result.adjustedForMultiple = true;
      finalStitches = adjusted;
      
      // Level 2: Suggest adjacent multiples
      const stitchesPerCm = project.targetGauge.stitches / 10;
      result.multipleSuggestions = [
        { option: adjusted - section.repeatMultiple, diffCm: -((section.repeatMultiple) / stitchesPerCm), isIdeal: false },
        { option: adjusted, diffCm: (adjusted - rawTargetStitches) / stitchesPerCm, isIdeal: true },
        { option: adjusted + section.repeatMultiple, diffCm: ((section.repeatMultiple) / stitchesPerCm), isIdeal: false }
      ];
    }
  } else {
    // Enforce symmetry if no multiple provided
    const isTargetOdd = finalStitches % 2 !== 0;
    if (isOriginalOdd !== isTargetOdd) {
       finalStitches += 1; // force match parity
       result.warnings.push('Se ajustó +/- 1 punto para mantener la simetría original (eje central).');
    }
  }

  result.targetStitches = finalStitches;

  // Determine H Status
  const diffStitchesRatio = Math.abs(finalStitches - rawTargetStitches) / rawTargetStitches;
  if (diffStitchesRatio === 0) result.statusH = 'SEGURO';
  else if (diffStitchesRatio <= 0.05) result.statusH = 'REVISAR';
  else result.statusH = 'RIESGOSO';

  if (diffStitchesRatio > 0.05) {
    result.warnings.push(`El ancho se ajustó en un ${(diffStitchesRatio * 100).toFixed(1)}% para encajar en el motivo. Esto alterará levemente la talla real.`);
  }

  // Calculate Rows if provided
  if (section.originalRows && project.originalGauge.rows && project.targetGauge.rows) {
    const rowRatio = project.targetGauge.rows / project.originalGauge.rows;
    // Row math does NOT scale with sizeRatio (length is usually fixed for human bodies unless height changes)
    const rawTargetRows = section.originalRows * rowRatio;
    result.targetRows = Math.round(rawTargetRows);

    const diffRowsRatio = Math.abs(result.targetRows - rawTargetRows) / rawTargetRows;
    if (diffRowsRatio === 0) result.statusV = 'SEGURO';
    else if (diffRowsRatio <= 0.05) result.statusV = 'REVISAR';
    else result.statusV = 'RIESGOSO';
    
    // Blocking Factor (Level 2)
    if (project.blockingFactorPercent) {
       const blockScale = 1 - (project.blockingFactorPercent / 100);
       result.targetRows = Math.round(result.targetRows * blockScale);
       result.warnings.push(`Vueltas reducidas un ${project.blockingFactorPercent}% asumiendo que la prenda crecerá al bloquear (lavar).`);
    }
  }

  // Calculate Shaping Rates (Increases/Decreases)
  if (section.shaping && section.shaping.stitchesToChange > 0 && result.targetRows) {
     const shapingStitchRatio = project.targetGauge.stitches / project.originalGauge.stitches;
     const targetShapingStitches = Math.round(section.shaping.stitchesToChange * shapingStitchRatio * sizeRatio);
     
     if (targetShapingStitches > 0) {
        // Find interval
        const interval = Math.floor(result.targetRows / targetShapingStitches);
        const action = section.shaping.type === 'increase' ? 'Aumentar' : 'Disminuir';
        
        if (interval < 1) {
           result.warnings.push('La cantidad de puntos a cambiar es mayor que las vueltas disponibles. El tejido quedará deformado.');
           result.shapingRate = `${action} ${targetShapingStitches} pts de forma brusca (peligroso)`;
           result.statusV = 'NO_RECOMENDADO';
        } else {
           result.shapingRate = `${action} 1 punto cada ${interval} vueltas (${targetShapingStitches} pts totales)`;
        }
     }
  }

  // Cross-axis validations
  const targetStitchRatio = project.targetGauge.stitches / project.originalGauge.stitches;
  const targetRowRatio = project.targetGauge.rows / project.originalGauge.rows;
  
  if (Math.abs(targetStitchRatio - targetRowRatio) > 0.15) {
    result.statusH = 'RIESGOSO';
    result.statusV = 'RIESGOSO';
    result.warnings.push('Tu muestra tiene proporciones muy diferentes a la original. El tejido quedará más "aplastado" o "estirado" verticalmente. Los escotes y sisas podrían quedar deformes.');
  }

  return result;
}

export function calculateMetrage(project: ProjectData): number | undefined {
  if (!project.originalMetrage) return undefined;
  if (!project.originalGauge.stitches || !project.targetGauge.stitches) return undefined;
  if (!project.originalGauge.rows || !project.targetGauge.rows) return undefined;

  const originalAreaDensity = project.originalGauge.stitches * project.originalGauge.rows;
  const targetAreaDensity = project.targetGauge.stitches * project.targetGauge.rows;
  
  let sizeScale = 1;
  if (project.originalSizeCm && project.targetSizeCm) {
     sizeScale = Math.pow(project.targetSizeCm / project.originalSizeCm, 2);
  }

  const densityRatio = originalAreaDensity / targetAreaDensity;
  const rawMetrage = project.originalMetrage * densityRatio * sizeScale;
  
  // Safe margin of +10%
  return Math.round(rawMetrage * 1.1);
}

// Local Storage API with Migration support (Level 5)
const STORAGE_KEY = 'trama_projects';
const CURRENT_VERSION = 2;

export function getProjects(): ProjectData[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    let parsed: ProjectData[] = JSON.parse(data);
    
    // Migration Logic
    parsed = parsed.map(p => {
       if (!p.version || p.version < 2) {
          // Migrate v1 to v2
          return {
             ...p,
             version: 2,
             blockingFactorPercent: 0,
             sections: p.sections.map(s => ({...s, originalStitches: s.originalStitches || 10 })) // ensure safe defaults
          };
       }
       return p;
    });
    
    return parsed;
  } catch (e) {
    console.error('Failed to parse projects', e);
    return [];
  }
}

export function saveProject(project: ProjectData): void {
  try {
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    project.version = CURRENT_VERSION;
    project.lastModified = Date.now();
    
    if (index >= 0) projects[index] = project;
    else projects.push(project);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save project', e);
  }
}

// User Yarn Library (Level 3)
const YARN_STORAGE_KEY = 'trama_yarns';
export interface UserYarn {
   id: string;
   name: string;
   category: YarnCategory;
   gauge: Gauge;
}

export function getUserYarns(): UserYarn[] {
   try {
      const data = localStorage.getItem(YARN_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
   } catch { return []; }
}

export function saveUserYarn(yarn: UserYarn): void {
   const yarns = getUserYarns();
   yarns.push(yarn);
   localStorage.setItem(YARN_STORAGE_KEY, JSON.stringify(yarns));
}
