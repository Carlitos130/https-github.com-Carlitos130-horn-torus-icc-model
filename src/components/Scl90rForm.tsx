import React, { useState } from 'react';
import { SCL90RData, ModelParams, SCL90RInputMode } from '../types';
import {
  CLINICAL_PRESETS,
  DEFAULT_SCL90R_DATA,
  checkScl90rConsistency,
  derivePsdi,
  pstRangeForGsi,
  gsiRangeFromDimensions,
  BAREMOS,
  BAREMO_IDS,
  getBaremo,
  ruptureThresholdGsi,
  publishedRange,
  tDeEscalaCon,
  getTScoreInterpretation,
  normRowsDeBaremo,
  sclDataDesdeTScores,
  sclDataToTScores,
} from '../utils/hornTorusMath';
import {
  Sliders,
  RotateCcw,
  Brain,
  Activity,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  Pause,
  Table,
  FileText,
} from 'lucide-react';

interface Scl90rFormProps {
  sclData: SCL90RData;
  onChangeSclData: (newData: SCL90RData) => void;
  params: ModelParams;
  onChangeParams: (newParams: ModelParams) => void;
  /** Modo de carga: puntajes directos (PD) o puntajes T. Vive en App para sobrevivir al cambio de pestaña. */
  inputMode: SCL90RInputMode;
  onChangeInputMode: (mode: SCL90RInputMode) => void;
  /** Puntajes T tal como se cargaron (pueden superar T=80, que la tabla no representa). */
  tScores: Record<keyof SCL90RData, number>;
  onChangeTScores: (t: Record<keyof SCL90RData, number>) => void;
  isAnimatingDeformation?: boolean;
  onToggleDeformationAnimation?: () => void;
}

type Field = { key: keyof SCL90RData; label: string; effect: string };

// Primarias
const CORE_FIELDS: Field[] = [
  { key: 'Somatización', label: 'Somatización (SOM)', effect: 'Ondulación poloidal exterior m=3 (manifestación corporal)' },
  { key: 'Obsesión-Compulsión', label: 'Obsesión-Compulsión (O-C)', effect: 'Bandas toroidales ortogonales n=4 (rigidez cognitiva)' },
  { key: 'Psicoticismo', label: 'Psicoticismo (PSY)', effect: 'Distorsión y cizalladura en la cúspide singular v=±π' },
  { key: 'GSI', label: 'Global Severity Index (GSI)', effect: 'Dilatación radial y volumen global (a = a_scale · IGS)' },
  { key: 'PST', label: 'Positive Symptom Total (PST)', effect: 'Conteo de ítems > 0 (0–90) · densidad de perturbaciones' },
  { key: 'PSDI', label: 'Positive Symptom Distress (PSDI)', effect: 'Derivado: IGS·90/PST (1–4) · gradiente focal' },
];

// Secundarias
const EXTENDED_FIELDS: Field[] = [
  { key: 'Depresión', label: 'Depresión (DEP)', effect: 'Inflexión en el eje z' },
  { key: 'Ansiedad', label: 'Ansiedad (ANX)', effect: 'Micro-temblor armónico sobre el meridiano' },
  { key: 'Hostilidad', label: 'Hostilidad (HOS)', effect: 'Gradientes angulares' },
  { key: 'Sensibilidad Interpersonal', label: 'Sensibilidad Interpersonal (SI)', effect: 'Retracción en la interfaz relacional' },
  { key: 'Ansiedad Fóbica', label: 'Ansiedad Fóbica (PHOB)', effect: 'Constricción focalizada' },
  { key: 'Ideación Paranoide', label: 'Ideación Paranoide (PAR)', effect: 'Descentramiento asimétrico' },
];

const DIM_KEYS = ['Somatización', 'Obsesión-Compulsión', 'Sensibilidad Interpersonal', 'Depresión', 'Ansiedad', 'Hostilidad', 'Ansiedad Fóbica', 'Ideación Paranoide', 'Psicoticismo'] as const;

export const Scl90rForm: React.FC<Scl90rFormProps> = ({
  sclData,
  onChangeSclData,
  params,
  onChangeParams,
  inputMode,
  onChangeInputMode,
  tScores,
  onChangeTScores,
  isAnimatingDeformation = false,
  onToggleDeformationAnimation,
}) => {
  const [showExtended, setShowExtended] = useState(false);
  const [showBaremoTable, setShowBaremoTable] = useState(false);
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);
  const baremo = getBaremo(params.baremoId);

  // --- Modo PD: PSDI no es libre, se deriva de IGS y PST (IGS = PST·PSDI/90). Al mover
  // el IGS, el PST se acota al rango que deja PSDI dentro de [1, 4].
  const handleSliderChangePd = (key: keyof SCL90RData, value: number) => {
    const next: SCL90RData = { ...sclData, [key]: parseFloat(value.toFixed(2)) };
    if (key === 'GSI' || key === 'PST') {
      const [pstMin, pstMax] = pstRangeForGsi(next['GSI']);
      next['PST'] = Math.round(Math.min(pstMax, Math.max(pstMin, next['PST'])));
      next['PSDI'] = parseFloat(derivePsdi(next['GSI'], next['PST']).toFixed(2));
    }
    onChangeSclData(next);
  };

  // --- Modo T: se guarda el T cargado y se convierte a PD con el baremo elegido.
  const handleSliderChangeT = (key: keyof SCL90RData, t: number) => {
    const nextT = { ...tScores, [key]: t };
    onChangeTScores(nextT);
    onChangeSclData(sclDataDesdeTScores(nextT, params.baremoId));
  };

  const handleChangeMode = (mode: SCL90RInputMode) => {
    if (mode === inputMode) return;
    if (mode === 't_scores') {
      // Al pasar a T, se parte de los T que corresponden a los PD actuales.
      onChangeTScores(sclDataToTScores(sclData, params.baremoId));
    }
    onChangeInputMode(mode);
  };

  const consistencyIssues = inputMode === 'pd' ? checkScl90rConsistency(sclData) : [];

  // Escalas cuya PD excede el techo publicado del baremo (el T se acota a 80).
  const fueraDeBaremo = DIM_KEYS
    .map((key) => {
      const rango = publishedRange(params.baremoId, key);
      if (!rango) return null;
      const [, techo] = rango;
      const val = sclData[key] ?? 0;
      return val > techo ? { key, val, techo } : null;
    })
    .filter((x): x is { key: typeof DIM_KEYS[number]; val: number; techo: number } => x !== null);

  const techoDe = (key: keyof SCL90RData): string | null => {
    const rango = publishedRange(params.baremoId, key as never);
    if (!rango) return null;
    const [, techo] = rango;
    const val = sclData[key] ?? 0;
    return val > techo ? `${val.toFixed(2)} excede el techo ${techo.toFixed(2)} (T=80)` : null;
  };

  const handleParamChange = (key: keyof ModelParams, value: number | string) => {
    const next = { ...params, [key]: value } as ModelParams;
    onChangeParams(next);
    // En modo T, cambiar de población recalcula los PD desde los mismos T.
    if (key === 'baremoId' && inputMode === 't_scores') {
      onChangeSclData(sclDataDesdeTScores(tScores, value as ModelParams['baremoId']));
    }
  };

  const RUPTURE_PRESET_NAME = 'Ruptura del modelo (IGS extremo)';
  const handleSelectPreset = (index: number) => {
    setActivePresetIndex(index);
    const preset = CLINICAL_PRESETS[index];
    if (!preset) return;
    if (preset.mode === 't_scores' && preset.tScores) {
      onChangeInputMode('t_scores');
      onChangeTScores({ ...preset.tScores });
      onChangeSclData(sclDataDesdeTScores(preset.tScores, params.baremoId));
    } else {
      onChangeInputMode('pd');
      onChangeSclData({ ...preset.data });
    }
    // Wegbreite (Corolario I): el preset de ruptura adelgaza la pared (δ = 0.55) para que
    // el cruce tenga anchura suficiente (≥ π/6); cualquier otro caso restablece δ = 0.30.
    onChangeParams({ ...params, deformation_factor: preset.name === RUPTURE_PRESET_NAME ? 0.55 : 0.30 });
  };

  const handleResetToDefault = () => {
    setActivePresetIndex(0);
    onChangeInputMode('pd');
    onChangeSclData({ ...DEFAULT_SCL90R_DATA });
    onChangeParams({ ...params, a_scale: 0.1, deformation_factor: 0.3 });
  };

  const sliderRangePd = (key: keyof SCL90RData): { min: number; max: number; step: number } =>
    key === 'PST' ? { min: 0, max: 90, step: 1 } : { min: 0, max: 4, step: 0.01 };

  const [gsiMin, gsiMax] = gsiRangeFromDimensions(sclData);

  const renderField = (field: Field, compact: boolean) => {
    const val = sclData[field.key] ?? 0;
    const tShown = inputMode === 't_scores'
      ? Math.round(tScores[field.key] ?? 50)
      : Math.round(tDeEscalaCon(baremo, field.key, val).t);
    const interp = getTScoreInterpretation(tShown);
    const fuera = fueraDeBaremo.some((f) => f.key === field.key);
    return (
      <div
        key={field.key}
        className={`bg-slate-950/40 border rounded-lg ${compact ? 'p-2' : 'p-2.5'} space-y-1.5 transition-colors ${
          interp.isAlert ? 'border-red-500/60' : interp.isRisk ? 'border-yellow-700/60' : 'border-slate-800/80 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs font-mono gap-1">
          <span className="text-slate-200 font-medium truncate">{field.label}</span>
          <span className="flex items-center gap-1 shrink-0">
            <span
              className={`font-bold px-1.5 py-0.5 rounded border ${fuera ? 'bg-amber-950 text-amber-300 border-amber-600' : 'bg-slate-800 text-cyan-300 border-slate-700'}`}
              title={techoDe(field.key) ?? 'Puntaje directo (PD)'}
            >
              PD {field.key === 'PST' ? val.toFixed(0) : val.toFixed(2)}
            </span>
            <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${interp.badgeClass}`} title={interp.description}>
              T={tShown}
            </span>
          </span>
        </div>

        {inputMode === 't_scores' ? (
          <input
            id={`slider-t-${field.key}`}
            type="range"
            min="30"
            max="120"
            step="1"
            value={Math.min(120, Math.max(30, tShown))}
            onChange={(e) => handleSliderChangeT(field.key, parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        ) : (
          <input
            id={`slider-${field.key}`}
            type="range"
            min={sliderRangePd(field.key).min}
            max={sliderRangePd(field.key).max}
            step={sliderRangePd(field.key).step}
            value={val}
            disabled={field.key === 'PSDI'}
            onChange={(e) => handleSliderChangePd(field.key, parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          />
        )}

        <div className="flex items-center justify-between text-[9.5px] text-slate-400 gap-2">
          <span className="truncate">{field.effect}</span>
          <span className={`font-medium shrink-0 ${interp.textColor}`}>{interp.rangeLabel}</span>
        </div>
        {inputMode === 'pd' && techoDe(field.key) && (
          <p className="text-[9px] text-amber-400/90 font-mono truncate" title={techoDe(field.key)!}>
            ⚠ fuera de baremo · {techoDe(field.key)!}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-5 text-slate-200">
      {/* Encabezado, modo de carga y presets */}
      <div className="flex flex-col gap-2.5 border-b border-slate-800 pb-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <h2 className="font-semibold text-sm tracking-wide text-white">Vector Psicométrico SCL-90-R</h2>
          </div>
          <button
            id="btn-reset-scl-defaults"
            onClick={handleResetToDefault}
            className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800"
            title="Restaurar los valores iniciales"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Valores Iniciales</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              id="mode-pd-btn"
              onClick={() => handleChangeMode('pd')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                inputMode === 'pd' ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/80 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Puntajes directos, con validación de consistencia (IGS = PST·PSDI/90)"
            >
              Puntajes directos
            </button>
            <button
              id="mode-t-scores-btn"
              onClick={() => handleChangeMode('t_scores')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                inputMode === 't_scores' ? 'bg-amber-950 text-amber-200 border border-amber-500/80 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Puntajes T informados en el protocolo; se convierten a PD con el baremo elegido"
            >
              Puntajes T
            </button>
          </div>
          <button
            id="btn-toggle-baremo-table"
            onClick={() => setShowBaremoTable(!showBaremoTable)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors border ${
              showBaremoTable ? 'bg-cyan-950 text-cyan-300 border-cyan-600' : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700'
            }`}
            title={`Tabla normativa: ${baremo.label}`}
          >
            <Table className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tabla del baremo</span>
          </button>
        </div>

        {showBaremoTable && (
          <div className="bg-slate-950 border border-cyan-500/50 rounded-xl p-3 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                {baremo.label}
              </span>
              <span className="text-[10px] text-slate-400">{baremo.fuente}</span>
            </div>
            <div className="overflow-x-auto max-h-52">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/90 text-cyan-300 sticky top-0">
                    {['T', 'SOM', 'OBS', 'SI', 'DEP', 'ANS', 'HOS', 'FOB', 'PAR', 'PSIC', 'IGS', 'TSP', 'IMSP'].map((h) => (
                      <th key={h} className="py-1 px-1">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {normRowsDeBaremo(params.baremoId).map((row) => (
                    <tr key={row.T} className={row.T >= 80 ? 'bg-rose-950/20 text-rose-200' : row.T === 63 ? 'bg-yellow-950/20 text-yellow-200' : ''}>
                      <td className="py-0.5 px-1 font-bold text-cyan-400">{row.T}</td>
                      {[row.SOM, row.OBS, row.SI, row.DEP, row.ANS, row.HOS, row.FOB, row.PAR, row.PSIC, row.IGS].map((x, i) => (
                        <td key={i} className="py-0.5 px-1">{x.toFixed(2)}</td>
                      ))}
                      <td className="py-0.5 px-1">{row.TSP.toFixed(1)}</td>
                      <td className="py-0.5 px-1">{row.IMSP.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[9.5px] text-slate-400 italic pt-1">
              T = 50 es la media poblacional; T ≥ 60 sintomático; T ≥ 63 en riesgo (percentil 90). La tabla termina en T = 80:
              los T mayores se convierten a PD extrapolando el último tramo y se marcan fuera de baremo.
            </p>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-400">Casos y perfiles predefinidos:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {CLINICAL_PRESETS.map((preset, idx) => (
              <button
                key={preset.name}
                id={`preset-btn-${idx}`}
                onClick={() => handleSelectPreset(idx)}
                className={`text-left p-2 rounded-lg text-xs transition-all border ${
                  activePresetIndex === idx
                    ? 'bg-cyan-950/70 border-cyan-500/80 text-cyan-200 font-medium'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="font-medium truncate flex items-center gap-1">
                  {preset.isRiskCase && <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />}
                  <span className="truncate">{preset.name}</span>
                  <span className="ml-auto text-[9px] font-mono text-slate-500 shrink-0">{preset.mode === 't_scores' ? 'T' : 'PD'}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate opacity-80">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Parámetros del manifold */}
      <div className="bg-slate-950/60 border border-slate-800/90 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-cyan-300 flex items-center gap-1.5 font-medium">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Parámetros del Manifold Horn Torus
          </span>
          <span className="text-[10px] text-slate-400">r/R = {params.rOverR.toFixed(2)} {params.rOverR >= 1 ? '(Condición Horn)' : '(Toro liso)'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-300">a_scale (Escala):</span>
              <span className="text-cyan-400 font-bold">{params.a_scale.toFixed(2)}</span>
            </div>
            <input
              id="slider-a-scale"
              type="range" min="0.02" max="0.30" step="0.01"
              value={params.a_scale}
              onChange={(e) => handleParamChange('a_scale', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[9px] text-slate-400 font-mono">a = a_scale · IGS</p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-300">r/R (familia):</span>
              <span className="text-emerald-400 font-bold">{params.rOverR.toFixed(2)}</span>
            </div>
            <input
              id="slider-r-over-r"
              type="range" min="0.05" max="1.0" step="0.01"
              value={params.rOverR}
              onChange={(e) => handleParamChange('rOverR', parseFloat(e.target.value))}
              className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[9px] text-slate-400 font-mono">1.0 = horn torus (límite) · &lt; 1.0 = toro liso, H1 = Z²⟨μ, λ⟩</p>
          </div>

          <div className="space-y-1.5 sm:col-span-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-slate-300 flex items-center gap-1">
                Wegbreite — deformation_factor (δ):
                {isAnimatingDeformation && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
              </span>
              <span className="text-amber-400 font-bold">{params.deformation_factor.toFixed(2)}</span>
            </div>
            <input
              id="slider-deformation-factor"
              type="range" min="0.0" max="0.80" step="0.01"
              value={params.deformation_factor}
              onChange={(e) => handleParamChange('deformation_factor', parseFloat(e.target.value))}
              className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex items-center gap-1.5 pt-0.5">
              {onToggleDeformationAnimation && (
                <button
                  id="btn-animate-deformation-form"
                  onClick={onToggleDeformationAnimation}
                  className={`flex-1 py-1 px-2 rounded text-[10px] font-medium flex items-center justify-center gap-1 transition-all border ${
                    isAnimatingDeformation
                      ? 'bg-amber-500 text-slate-950 border-amber-300 font-semibold'
                      : 'bg-amber-950/70 hover:bg-amber-900 text-amber-200 border-amber-700/70'
                  }`}
                  title="Animar la transición de δ desde el toro estándar (δ = 0) hasta el valor actual"
                >
                  {isAnimatingDeformation ? (
                    <><Pause className="w-3 h-3" /><span>Pausar animación</span></>
                  ) : (
                    <><Sparkles className="w-3 h-3" /><span>Animar transición (0 → δ)</span></>
                  )}
                </button>
              )}
              {[0, 0.3, 0.55].map((d) => (
                <button
                  key={d}
                  onClick={() => handleParamChange('deformation_factor', d)}
                  className="py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[9.5px] font-mono"
                  title={d === 0.55 ? 'Pared adelgazada por encima del techo π/6 (Wegbreite suficiente)' : `Fijar δ = ${d}`}
                >
                  δ = {d}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-slate-400 font-mono">Corolario I: anchura del cruce (adelgazamiento de la pared). Techo π/6 ≈ 0.52</p>
          </div>
        </div>

        {/* Σ como pantalla o mero anudamiento (pregunta abierta de la tesis, Cap. 7) */}
        <div className="space-y-1 pt-1 border-t border-slate-800/60">
          <label className="flex items-center gap-2 text-[11px] font-mono cursor-pointer">
            <input
              id="chk-sigma-pantalla"
              type="checkbox"
              checked={params.sigmaPantalla === true}
              onChange={(e) => onChangeParams({ ...params, sigmaPantalla: e.target.checked })}
              className="accent-blue-400 w-3.5 h-3.5"
            />
            <span className="text-slate-300">Σ como pantalla (Cap. 7):</span>
            <span className={params.sigmaPantalla ? 'text-blue-400 font-bold' : 'text-slate-500 font-bold'}>
              {params.sigmaPantalla ? 'desvía los cruces' : 'mero anudamiento'}
            </span>
          </label>
          <p className="text-[9px] text-slate-400 font-mono">
            Pregunta abierta: ¿Σ aleja los cruces de las marcas de fantasía o solo anuda a S e I? Como pantalla, la banda del síntoma intercepta la zona de angustia.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800/60">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-300">Baremo (población):</span>
              <span className="text-fuchsia-400 font-bold">T60 IGS = {baremo.t60Gsi.toFixed(2)}</span>
            </div>
            <select
              id="select-baremo"
              value={params.baremoId ?? 'm_adultos'}
              onChange={(e) => handleParamChange('baremoId', e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-md px-2 py-1 text-[11px] font-mono text-slate-200 cursor-pointer"
              title={baremo.label}
            >
              {BAREMO_IDS.map((id) => (
                <option key={id} value={id}>{BAREMOS[id].corto}</option>
              ))}
            </select>
            <p className="text-[9px] text-slate-400 font-mono">
              {baremo.fuente} · ruptura: IGS ≥ {ruptureThresholdGsi(params.baremoId).toFixed(2)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-300">Marcas de fantasía (N):</span>
              <span className="text-rose-400 font-bold">{params.fantasyMarkCount ?? 1}</span>
            </div>
            <input
              id="slider-fantasy-marks"
              type="range" min="1" max="12" step="1"
              value={params.fantasyMarkCount ?? 1}
              onChange={(e) => handleParamChange('fantasyMarkCount', parseInt(e.target.value, 10))}
              className="w-full accent-rose-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              title="Resumen §8: una o varias marcas de trauma. La zona de angustia es la unión de sus vecindades."
            />
            <p className="text-[9px] text-slate-400 font-mono">Zona de angustia = unión de vecindades (A_cr) de todas las marcas</p>
          </div>
        </div>
      </div>

      {/* Escalas principales */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
          <span>
            {inputMode === 'pd'
              ? 'Variables SCL-90-R principales (PD: dimensiones 0–4 · PST 0–90 · PSDI derivado)'
              : 'Variables SCL-90-R principales (puntajes T, 30–120)'}
          </span>
        </div>

        {inputMode === 'pd' ? (
          <p className="text-[10px] text-slate-400 font-mono">
            IGS compatible con las dimensiones: {gsiMin.toFixed(2)} – {gsiMax.toFixed(2)}
          </p>
        ) : (
          <p className="text-[10px] text-amber-300/90 font-mono">
            Modo T: los PD se derivan escala por escala con el baremo; la consistencia IGS = PST·PSDI/90 no se valida.
          </p>
        )}

        {consistencyIssues.length > 0 && (
          <div id="scl-consistency-warning" className="bg-rose-950/50 border border-rose-700/70 rounded-lg p-2 space-y-1 text-[10.5px] text-rose-200">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Perfil SCL-90-R imposible</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5">
              {consistencyIssues.map((issue) => <li key={issue}>{issue}</li>)}
            </ul>
          </div>
        )}

        {inputMode === 'pd' && fueraDeBaremo.length > 0 && (
          <div id="scl-fuera-baremo-warning" className="bg-amber-950/50 border border-amber-700/70 rounded-lg p-2 space-y-1 text-[10.5px] text-amber-200">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Fuera de baremo: el T se acota al techo publicado</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5">
              {fueraDeBaremo.map(({ key, val, techo }) => (
                <li key={key as string}>
                  {key}: {val.toFixed(2)} &gt; {techo.toFixed(2)} — el baremo termina en T=80.
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {CORE_FIELDS.map((f) => renderField(f, false))}
        </div>
      </div>

      {/* Escalas secundarias */}
      <div className="border-t border-slate-800 pt-2">
        <button
          id="toggle-extended-dimensions-btn"
          onClick={() => setShowExtended(!showExtended)}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 font-medium transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            Dimensiones secundarias SCL-90-R (Depresión, Ansiedad, Hostilidad...)
          </span>
          {showExtended ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showExtended && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60">
            {EXTENDED_FIELDS.map((f) => renderField(f, true))}
          </div>
        )}
      </div>
    </div>
  );
};
