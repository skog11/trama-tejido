import { useState, useEffect, useMemo } from 'react';
import { GaugeInput } from './components/ui/GaugeInput';
import { YarnSelector } from './components/ui/YarnSelector';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Badge } from './components/ui/Badge';
import { RowTracker } from './components/ui/RowTracker';
import { Visualizer } from './components/ui/Visualizer';
import { calculateStitchConversion, calculateMetrage, saveProject, getProjects } from './engine/patternEngine';
import type { ProjectData, CalculationResult, Shaping } from './engine/patternEngine';

const generateId = () => Math.random().toString(36).substring(2, 9);

const TEMPLATES: Record<string, Partial<ProjectData>> = {
  RAGLAN: {
    name: 'Suéter Raglán Tradicional',
    sections: [
      { id: generateId(), name: 'Cuello (Canalé)', originalStitches: 100, originalRows: 10, repeatMultiple: 2 },
      { id: generateId(), name: 'Sisa a Sisa (Cuerpo)', originalStitches: 200, originalRows: 80, shaping: { type: 'increase', stitchesToChange: 40, overOriginalRows: 40 } },
      { id: generateId(), name: 'Mangas (x2)', originalStitches: 60, originalRows: 100, shaping: { type: 'decrease', stitchesToChange: 20, overOriginalRows: 80 } }
    ]
  }
};

const STITCH_SUGGESTIONS: Record<number, string[]> = {
  2: ['Punto Arroz', 'Canalé 1x1'], 3: ['Punto Trigo Falso'], 4: ['Canalé 2x2', 'Punto Gofre'], 5: ['Canalé 3x2'], 
  6: ['Trenza Simple 6'], 8: ['Copo de Nieve Pequeño'], 12: ['Estrella Selbu Tradicional']
};

const YARN_WEIGHTS: Record<string, { weight: number, needle: string }> = {
  'Lace': { weight: 1, needle: '1.5 - 2.5mm' }, 'Fingering': { weight: 2, needle: '2.5 - 3.5mm' },
  'Sport': { weight: 3, needle: '3.5 - 4.5mm' }, 'DK': { weight: 4, needle: '4.5 - 5.5mm' },
  'Worsted': { weight: 5, needle: '5.5 - 6.5mm' }, 'Aran': { weight: 6, needle: '6.5 - 8.0mm' },
  'Bulky': { weight: 7, needle: '8.0 - 10.0mm' }, 'Super Bulky': { weight: 8, needle: '10.0+ mm' }
};

export default function App() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  // const [userYarns, setUserYarns] = useState<UserYarn[]>([]);
  const [isImperial, setIsImperial] = useState(false);
  const [saveTime, setSaveTime] = useState<string>('');
  
  const [project, setProject] = useState<ProjectData>({
    id: generateId(), name: 'Jersey Fair Isle', patternName: 'Nordic Winter', garmentType: 'Suéter', notes: '',
    lastModified: Date.now(), originalGauge: { stitches: 20, rows: 28 }, targetGauge: { stitches: 24, rows: 32 },
    originalYarn: 'Worsted', targetYarn: 'DK', originalSizeCm: 100, targetSizeCm: 100, originalMetrage: 1200,
    blockingFactorPercent: 0,
    sections: [
      { id: generateId(), name: 'Canesú Colorwork', originalStitches: 144, originalRows: 40, repeatMultiple: 12 },
      { id: generateId(), name: 'Cuerpo', originalStitches: 100, originalRows: 120, repeatMultiple: 2 },
    ]
  });

  const [showAddSection, setShowAddSection] = useState(false);
  const [activeTracker, setActiveTracker] = useState<{name: string, result: CalculationResult, rows?: number} | null>(null);

  const [newSection, setNewSection] = useState<{
    name: string; originalStitches: number; originalRows: number; repeatMultiple: number;
    shapingType: 'none'|'increase'|'decrease'; shapingStitches: number; shapingRows: number;
  }>({ name: '', originalStitches: 10, originalRows: 10, repeatMultiple: 0, shapingType: 'none', shapingStitches: 0, shapingRows: 0 });

  useEffect(() => { setProjects(getProjects()); /* setUserYarns(getUserYarns()); */ }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      saveProject(project); setProjects(getProjects());
      const now = new Date(); setSaveTime(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearTimeout(timer);
  }, [project]);

  const loadProject = (id: string) => { const p = projects.find(x => x.id === id); if (p) setProject(p); };
  const createNewProject = (templateKey?: string) => {
    const template = templateKey ? TEMPLATES[templateKey] : { name: 'Nuevo Proyecto', sections: [] };
    setProject({ ...project, id: generateId(), name: template.name || 'Nuevo Proyecto', sections: template.sections || [], lastModified: Date.now() });
  };
  const removeSection = (id: string) => setProject({...project, sections: project.sections.filter(s => s.id !== id)});
  const addSection = () => {
    if (!newSection.name || !newSection.originalStitches) return;
    let shaping: Shaping | undefined;
    if (newSection.shapingType !== 'none' && newSection.shapingStitches > 0 && newSection.shapingRows > 0) {
      shaping = { type: newSection.shapingType as 'increase'|'decrease', stitchesToChange: newSection.shapingStitches, overOriginalRows: newSection.shapingRows };
    }
    setProject({...project, sections: [...project.sections, { 
      id: generateId(), name: newSection.name, originalStitches: newSection.originalStitches, originalRows: newSection.originalRows || undefined,
      repeatMultiple: newSection.repeatMultiple || undefined, shaping
    }]});
    setShowAddSection(false);
  };

  const results = useMemo(() => {
    const r: Record<string, CalculationResult> = {};
    project.sections.forEach(sec => { r[sec.id] = calculateStitchConversion(project, sec); });
    return r;
  }, [project]);
  const targetMetrage = useMemo(() => calculateMetrage(project), [project]);
  
  const toDisplaySize = (cm: number) => isImperial ? +(cm / 2.54).toFixed(1) : cm;
  const fromDisplaySize = (val: number) => isImperial ? +(val * 2.54).toFixed(1) : val;
  const toDisplayLength = (m: number) => isImperial ? +(m * 1.09361).toFixed(0) : m;

  return (
    <div className="min-h-screen pb-16 bg-wool-cream animate-in fade-in duration-500">
      {activeTracker && <RowTracker sectionName={activeTracker.name} totalRows={activeTracker.rows} result={activeTracker.result} onClose={() => setActiveTracker(null)} />}

      <header className="w-full bg-selbu-navy pt-12 pb-12 px-8 flex flex-col items-center justify-center relative shadow-2xl border-b-knit-mustard">
        {saveTime && (
          <div className="absolute top-4 left-4 z-20 flex items-center text-white text-xs font-mono font-bold bg-[var(--color-knit-navy)] px-3 py-1 border-2 border-[var(--color-knit-mustard)] shadow-[2px_2px_0_0_var(--color-knit-cocoa)] no-print">
            <svg className="w-3 h-3 mr-2 text-[var(--color-knit-mustard)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            Guardado {saveTime}
          </div>
        )}

        <div className="no-print absolute top-4 right-4 z-20 flex space-x-3 items-center">
          <div className="flex bg-[var(--color-knit-navy)]/80 border border-[var(--color-knit-mustard)]/30 p-1 mr-4">
            <button onClick={() => setIsImperial(false)} className={`px-3 py-1 text-xs font-bold transition-colors ${!isImperial ? 'bg-[var(--color-knit-mustard)] text-[var(--color-knit-navy)]' : 'text-white/60 hover:text-white'}`}>Métrico</button>
            <button onClick={() => setIsImperial(true)} className={`px-3 py-1 text-xs font-bold transition-colors ${isImperial ? 'bg-[var(--color-knit-mustard)] text-[var(--color-knit-navy)]' : 'text-white/60 hover:text-white'}`}>Imperial</button>
          </div>
          <select className="bg-[var(--color-knit-navy)]/90 text-[var(--color-knit-cream)] text-xs font-mono p-2 border border-white/20 focus:outline-none" value={project.id} onChange={(e) => loadProject(e.target.value)}>
            <option disabled>Tus Proyectos...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="relative group">
            <button className="bg-[var(--color-knit-red)] text-white text-xs font-bold px-3 py-2 border-2 border-[var(--color-knit-darkred)] hover:bg-[var(--color-knit-darkred)] transition-transform hover:scale-105">+ Nuevo</button>
            <div className="absolute right-0 mt-2 w-56 bg-[var(--color-knit-cream)] border-4 border-[var(--color-knit-navy)] shadow-xl hidden group-hover:block text-black z-50">
              <button onClick={() => createNewProject()} className="block w-full text-left px-4 py-3 text-sm hover:bg-[var(--color-knit-mustard)] hover:text-[var(--color-knit-navy)] font-bold border-b-2 border-[var(--color-knit-navy)]/10">+ Proyecto Vacío</button>
              <button onClick={() => createNewProject('RAGLAN')} className="block w-full text-left px-4 py-3 text-sm hover:bg-[var(--color-knit-red)] hover:text-white transition-colors font-bold">🧶 Suéter Raglán</button>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-[var(--color-knit-cream)] p-4 border-[6px] border-[var(--color-knit-red)] shadow-2xl mb-4 rotate-3 hover:rotate-0 transition-transform">
             <h1 className="text-6xl md:text-7xl font-serif text-[var(--color-knit-navy)] tracking-tight mb-0 font-black">TRAMA</h1>
          </div>
          <div className="bg-[var(--color-knit-navy)] border-2 border-[var(--color-knit-mustard)] px-4 py-1 shadow-lg">
             <p className="text-[var(--color-knit-cream)] font-mono text-xs md:text-sm tracking-[0.4em] uppercase font-bold">Traductor Jacquard</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 px-8">
        
        {/* PARÁMETROS */}
        <section className="lg:col-span-5 space-y-8 animate-in slide-in-from-left-8 duration-700">
          <div className="bg-white border-[4px] border-[var(--color-knit-cocoa)] p-4 shadow-[4px_4px_0_0_var(--color-knit-cocoa)]">
            <input 
              value={project.name} onChange={e => setProject({...project, name: e.target.value})}
              className="text-3xl font-serif text-[var(--color-knit-navy)] font-bold w-full bg-transparent border-b-2 border-dashed border-[var(--color-knit-navy)]/30 focus:border-[var(--color-knit-red)] focus:outline-none pb-2 text-center"
              title="Haz clic para editar"
            />
          </div>

          <Card className="p-8 border-[4px] border-[var(--color-knit-navy)] shadow-[6px_6px_0_0_var(--color-knit-navy)] bg-white relative">
            <h2 className="text-xl font-serif mb-6 border-b-4 border-[var(--color-knit-mustard)] pb-2 font-black text-[var(--color-knit-navy)] flex items-center">
              Muestra Original
            </h2>
            <div className="space-y-6">
              <YarnSelector label="Grosor Original" value={project.originalYarn} onChange={y => setProject({...project, originalYarn: y})} />
              <GaugeInput label="Tensión Original" value={project.originalGauge} onChange={g => setProject({...project, originalGauge: g})} />
              {project.originalGauge.stitches > 0 && (
                <div className="bg-[var(--color-knit-navy)] text-[var(--color-knit-cream)] p-2 text-xs font-mono font-bold text-center border-2 border-[var(--color-knit-mustard)]">
                   Aguja Típica: {YARN_WEIGHTS[project.originalYarn]?.needle}
                </div>
              )}
            </div>
          </Card>

          <div className="flex justify-center no-print">
            <div className="h-12 w-2 border-l-4 border-dashed border-[var(--color-knit-cocoa)]"></div>
          </div>

          <Card className="p-8 border-[4px] border-[var(--color-knit-red)] shadow-[6px_6px_0_0_var(--color-knit-red)] bg-white">
            <h2 className="text-xl font-serif mb-6 border-b-4 border-[var(--color-knit-darkred)] pb-2 font-black text-[var(--color-knit-red)] flex items-center">
              Tu Nueva Muestra
            </h2>
            <div className="space-y-6">
              <YarnSelector label="Tu Grosor" value={project.targetYarn} onChange={y => setProject({...project, targetYarn: y})} />
              <GaugeInput label="Tu Tensión de Muestra" value={project.targetGauge} onChange={g => setProject({...project, targetGauge: g})} />
              
              <div className="pt-6 border-t-2 border-dashed border-[var(--color-knit-cocoa)]/20 grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-knit-navy)] block mb-1">Bloqueo (Factor)</label>
                  <div className="flex items-center">
                     <input type="number" value={project.blockingFactorPercent || ''} onChange={e => setProject({...project, blockingFactorPercent: Number(e.target.value)})} className="w-full p-2 border-[3px] border-[var(--color-knit-cocoa)] text-center font-mono font-bold focus:border-[var(--color-knit-mustard)] focus:outline-none bg-[var(--color-knit-cream)]" placeholder="Ej: 5" />
                     <span className="ml-2 text-sm text-[var(--color-knit-navy)] font-bold">%</span>
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-knit-navy)] block mb-1">Talla ({isImperial ? 'in' : 'cm'})</label>
                  <input type="number" value={project.targetSizeCm ? toDisplaySize(project.targetSizeCm) : ''} onChange={e => setProject({...project, targetSizeCm: fromDisplaySize(Number(e.target.value))})} className="w-full p-2 border-[3px] border-[var(--color-knit-red)] text-center font-mono font-bold bg-[var(--color-knit-red)]/5 text-[var(--color-knit-red)] focus:outline-none" />
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* RESULTADOS */}
        <section className="lg:col-span-7 space-y-8 animate-in slide-in-from-right-8 duration-700">
          <div className="flex justify-between items-end border-b-4 border-[var(--color-knit-cocoa)] pb-2 bg-zigzag-red p-4 shadow-[4px_4px_0_0_var(--color-knit-navy)] mb-8">
            <h2 className="text-2xl font-serif text-[var(--color-knit-cream)] font-black uppercase tracking-wider [text-shadow:3px_3px_0_var(--color-knit-navy),-1px_-1px_0_var(--color-knit-navy),1px_-1px_0_var(--color-knit-navy),-1px_1px_0_var(--color-knit-navy),1px_1px_0_var(--color-knit-navy)]">
              Patrón Calculado
            </h2>
            <button onClick={() => setShowAddSection(!showAddSection)} className="bg-[var(--color-knit-mustard)] text-[var(--color-knit-navy)] border-2 border-[var(--color-knit-navy)] font-bold text-xs uppercase px-3 py-1 hover:bg-white no-print shadow-[2px_2px_0_0_var(--color-knit-navy)]">
              {showAddSection ? 'Cancelar' : '+ Sección'}
            </button>
          </div>

          {targetMetrage !== undefined && (
            <div className="bg-[var(--color-knit-cream)] border-[4px] border-[var(--color-knit-teal)] p-6 flex items-center justify-between shadow-[4px_4px_0_0_var(--color-knit-teal)]">
              <div>
                <h4 className="font-bold text-[var(--color-knit-navy)] uppercase tracking-widest text-sm mb-1">Requerimiento de Lana</h4>
              </div>
              <div className="text-4xl font-black text-[var(--color-knit-teal)] font-serif">
                ~{toDisplayLength(targetMetrage)} <span className="text-xl font-sans font-bold opacity-80">{isImperial ? 'yd' : 'm'}</span>
              </div>
            </div>
          )}

          {project.sections.length === 0 && !showAddSection && (
             <div className="border-[6px] border-[var(--color-knit-navy)] bg-white p-12 flex flex-col items-center justify-center text-center shadow-[8px_8px_0_0_var(--color-knit-mustard)]">
                <div className="mb-6"><Visualizer stitches={50} /></div>
                <h3 className="text-3xl font-serif text-[var(--color-knit-navy)] font-black">Tu diseño espera</h3>
                <p className="text-sm font-sans text-[var(--color-knit-cocoa)] mt-4 max-w-sm font-bold">Agrega bloques de tejido (cuello, mangas, canesú) para comenzar a adaptar matemáticamente las instrucciones a tu lana.</p>
                <Button onClick={() => setShowAddSection(true)} className="mt-8 bg-[var(--color-knit-red)] text-white border-[3px] border-[var(--color-knit-navy)] uppercase tracking-widest font-bold shadow-[4px_4px_0_0_var(--color-knit-navy)]">+ Iniciar Patrón</Button>
             </div>
          )}

          {showAddSection && (
             <Card className="p-6 border-[4px] border-[var(--color-knit-cocoa)] bg-[var(--color-knit-cream)] no-print shadow-[6px_6px_0_0_var(--color-knit-mustard)]">
                <h3 className="font-serif font-black text-xl mb-4 text-[var(--color-knit-navy)]">Añadir Pieza</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-knit-cocoa)] block mb-1">Nombre</label>
                    <input className="w-full p-2 border-[3px] border-[var(--color-knit-cocoa)] font-bold bg-white focus:border-[var(--color-knit-red)] outline-none" value={newSection.name} onChange={e => setNewSection({...newSection, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-knit-cocoa)] block mb-1">Pts. Orig.</label>
                    <input type="number" className="w-full p-2 border-[3px] border-[var(--color-knit-cocoa)] font-mono bg-white outline-none focus:border-[var(--color-knit-red)]" value={newSection.originalStitches || ''} onChange={e => setNewSection({...newSection, originalStitches: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-knit-cocoa)] block mb-1">Vtas. Orig.</label>
                    <input type="number" className="w-full p-2 border-[3px] border-[var(--color-knit-cocoa)] font-mono bg-white outline-none focus:border-[var(--color-knit-red)]" value={newSection.originalRows || ''} onChange={e => setNewSection({...newSection, originalRows: Number(e.target.value)})} />
                  </div>
                </div>
                <Button onClick={addSection} className="w-full bg-[var(--color-knit-navy)] text-[var(--color-knit-cream)] border-[3px] border-[var(--color-knit-cocoa)] font-bold uppercase tracking-widest hover:bg-[var(--color-knit-mustard)] hover:text-[var(--color-knit-navy)] transition-colors">Confirmar Pieza</Button>
             </Card>
          )}

          {project.sections.map((section) => {
            const res = results[section.id];
            return (
              <Card key={section.id} className="p-0 border-[4px] border-[var(--color-knit-navy)] shadow-[6px_6px_0_0_var(--color-knit-navy)] bg-white relative overflow-hidden">
                <div className="bg-[var(--color-knit-navy)] px-6 py-4 flex justify-between items-center border-b-[8px] border-[var(--color-knit-red)] group relative">
                  {/* Watermark Motif */}
                  <div className="absolute inset-0 opacity-10 bg-selbu-navy pointer-events-none mix-blend-overlay"></div>
                  
                  <h3 className="font-serif font-black text-[var(--color-knit-cream)] tracking-widest text-2xl uppercase relative z-10">{section.name}</h3>
                  <button onClick={() => removeSection(section.id)} className="no-print relative z-10 text-white/50 hover:text-[var(--color-knit-mustard)] opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase text-xs">
                     Eliminar
                  </button>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-end border-b-4 border-dashed border-[var(--color-knit-cocoa)]/20 pb-6 relative">
                    <div className="flex flex-col">
                      <span className="text-sm text-[var(--color-knit-cocoa)] line-through font-bold mb-1 font-mono">Original: {section.originalStitches} pts</span>
                      <div className="flex items-baseline space-x-2">
                        <span className="font-black text-[var(--color-knit-navy)] text-7xl font-serif">{res.targetStitches}</span>
                        <span className="font-bold text-[var(--color-knit-mustard)] text-xl uppercase tracking-widest flex flex-col pt-2">
                           Puntos
                           <Badge status={res.statusH} />
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      {res.targetRows && (
                        <div className="flex items-baseline space-x-3 mb-2">
                           <span className="font-bold text-[var(--color-knit-teal)] text-sm uppercase tracking-widest flex flex-col items-end">
                              <Badge status={res.statusV} />
                              Vueltas
                           </span>
                           <span className="font-black text-[var(--color-knit-navy)] text-5xl font-serif bg-[var(--color-knit-cream)] px-2 border-2 border-[var(--color-knit-navy)] shadow-[2px_2px_0_0_var(--color-knit-navy)]">{res.targetRows}</span>
                        </div>
                      )}
                      <button onClick={() => setActiveTracker({ name: section.name, result: res, rows: res.targetRows })} className="no-print mt-2 text-xs font-black bg-[var(--color-knit-red)] text-white border-2 border-[var(--color-knit-darkred)] px-4 py-2 uppercase tracking-widest shadow-[4px_4px_0_0_var(--color-knit-navy)] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--color-knit-navy)] transition-all">
                        🧶 Ir a Tejer
                      </button>
                    </div>
                  </div>

                  {res.multipleSuggestions && (
                     <div className="bg-[var(--color-knit-cream)] p-4 border-[3px] border-[var(--color-knit-cocoa)] no-print relative">
                        <div className="absolute top-0 right-0 w-8 h-8 bg-zigzag-red border-l-[3px] border-b-[3px] border-[var(--color-knit-cocoa)]"></div>
                        <span className="text-xs font-black uppercase tracking-widest text-[var(--color-knit-navy)] block mb-3">Tu múltiplo ({section.repeatMultiple}) no encaja. Opciones:</span>
                        <div className="flex space-x-2">
                           {res.multipleSuggestions.map(sugg => (
                              <button key={sugg.option} className={`flex-1 p-2 border-[3px] text-sm font-bold font-mono transition-all uppercase ${sugg.isIdeal ? 'border-[var(--color-knit-mustard)] bg-[var(--color-knit-mustard)]/10 text-[var(--color-knit-cocoa)] shadow-[2px_2px_0_0_var(--color-knit-mustard)]' : 'border-[var(--color-knit-cocoa)]/30 text-[var(--color-knit-cocoa)] hover:border-[var(--color-knit-navy)]'}`}>
                                 {sugg.option} pts
                                 <span className="block text-xs font-sans mt-1">{sugg.diffCm > 0 ? '+' : ''}{sugg.diffCm.toFixed(1)} cm</span>
                              </button>
                           ))}
                        </div>
                        {section.repeatMultiple && STITCH_SUGGESTIONS[section.repeatMultiple] && (
                           <div className="mt-4 text-xs font-bold text-[var(--color-knit-teal)]">
                              💡 Puntos alternativos para múltiplo de {section.repeatMultiple}: {STITCH_SUGGESTIONS[section.repeatMultiple].join(', ')}
                           </div>
                        )}
                     </div>
                  )}
                </div>
              </Card>
            );
          })}
        </section>
      </main>
    </div>
  );
}
