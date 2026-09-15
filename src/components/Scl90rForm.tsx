import React, { useState } from 'react';
import { SCL90RData, ModelParams, SCL90RInputMode } from '../types';
import {
  CLINICAL_PRESETS,
  DEFAULT_SCL90R_DATA,
  BAREMO_CASULLO_PEREZ_2008_VARONES,
  normalizeSCL90RTScore,
  denormalizeSCL90RTScore,
  getTScoreInterpretation
} from '../utils/hornTorusMath';
import {
  Sliders,
  RotateCcw,
  Brain,
  Activity,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Pause,
  Table,
  AlertTriangle,
  FileText,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface Scl90rFormProps {
  sclData: SCL90RData;
  onChangeSclData: (newData: SCL90RData) => void;
  params: ModelParams;
  onChangeParams: (newParams: ModelParams) => void;
  isAnimatingDeformation?: boolean;
  onToggleDeformationAnimation?: () => void;
}

export const Scl90rForm: React.FC<Scl90rFormProps> = ({
  sclData,
  onChangeSclData,
  params,
  onChangeParams,
  isAnimatingDeformation = false,
  onToggleDeformationAnimation,
}) => {
  const [inputMode, setInputMode] = useState<SCL90RInputMode>('t_scores');
  const [showBaremoTable, setShowBaremoTable] = useState(false);
  const [showExtended, setShowExtended] = useState(true);
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);

  const maxNormalized = params.max_normalized ?? 2.0;

  const handleSliderChangeNormalized = (key: keyof SCL90RData, normValue: number) => {
    onChangeSclData({
      ...sclData,
      [key]: parseFloat(normValue.toFixed(4))
    });
  };

  const handleSliderChangeTScore = (key: keyof SCL90RData, tScore: number) => {
    const normalized = normalizeSCL90RTScore(tScore, maxNormalized);
    onChangeSclData({
      ...sclData,
      [key]: normalized
    });
  };

  const handleParamChange = (key: keyof ModelParams, value: number) => {
    onChangeParams({
      ...params,
      [key]: value
    });
  };

  const handleSelectPreset = (index: number) => {
    setActivePresetIndex(index);
    const preset = CLINICAL_PRESETS[index];
    if (preset) {
      onChangeSclData({ ...preset.data });
    }
  };

  const handleResetToDefault = () => {
    setActivePresetIndex(0);
    onChangeSclData({ ...DEFAULT_SCL90R_DATA });
    onChangeParams({
      ...params,
      a_scale: 0.1,
      deformation_factor: 0.3
    });
  };

  // Primary 6 dimensions from user prompt
  const coreFields: { key: keyof SCL90RData; label: string; abbreviation: string; effect: string }[] = [
    {
      key: 'Somatización',
      label: 'Somatización',
      abbreviation: 'SOM',
      effect: 'Ondulación poloidal m=3 (manifestación visceral en cuerpo I)'
    },
    {
      key: 'Obsesión-Compulsión',
      label: 'Obsesión-Compulsión',
      abbreviation: 'OBS',
      effect: 'Bandas toroidales ortogonales n=4 (rigidez y fijeza cognitiva)'
    },
    {
      key: 'Psicoticismo',
      label: 'Psicoticismo',
      abbreviation: 'PSIC',
      effect: 'Cizalladura en cúspide singular v=±π (pérdida de lazo al Otro)'
    },
    {
      key: 'GSI',
      label: 'Global Severity Index',
      abbreviation: 'IGS',
      effect: 'Dilatación radial macroscópica y volumen global a = a_scale * GSI'
    },
    {
      key: 'PST',
      label: 'Positive Symptom Total',
      abbreviation: 'TSP',
      effect: 'Densidad modular de perturbaciones de alta frecuencia'
    },
    {
      key: 'PSDI',
      label: 'Positive Symptom Distress',
      abbreviation: 'IMSP',
      effect: 'Pendiente de gradiente focal y profundidad del estrés'
    },
  ];

  // Extended dimensions
  const extendedFields: { key: keyof SCL90RData; label: string; abbreviation: string; effect: string }[] = [
    {
      key: 'Depresión',
      label: 'Depresión',
      abbreviation: 'DEP',
      effect: 'Inflexión z-axis y colapso de amplitud libidinal'
    },
    {
      key: 'Ansiedad',
      label: 'Ansiedad',
      abbreviation: 'ANS',
      effect: 'Micro-temblor armónico sobre el meridiano toroidal'
    },
    {
      key: 'Hostilidad',
      label: 'Hostilidad',
      abbreviation: 'HOS',
      effect: 'Puntas y gradientes angulares de reactividad agresiva'
    },
    {
      key: 'Sensibilidad Interpersonal',
      label: 'Sensibilidad Interpersonal',
      abbreviation: 'SI',
      effect: 'Vulnerabilidad y retracción en la interfaz relacional'
    },
    {
      key: 'Ansiedad Fóbica',
      label: 'Ansiedad Fóbica',
      abbreviation: 'FOB',
      effect: 'Evitación y constricción focalizada en sectores perimetrales'
    },
    {
      key: 'Ideación Paranoide',
      label: 'Ideación Paranoide',
      abbreviation: 'PAR',
      effect: 'Descentramiento asimétrico y proyección persecutoria'
    },
  ];

  const renderFieldControl = (field: { key: keyof SCL90RData; label: string; abbreviation: string; effect: string }) => {
    const normVal = sclData[field.key] ?? 0.5;
    const tScore = denormalizeSCL90RTScore(normVal);
    const interp = getTScoreInterpretation(tScore);

    return (
      <div
        key={field.key}
        className={`bg-slate-950/50 border rounded-lg p-2.5 space-y-1.5 transition-all ${
          interp.isAlert
            ? 'border-red-500/70 shadow-sm shadow-red-950/40 bg-red-950/10'
            : interp.isRisk
            ? 'border-yellow-700/60 hover:border-yellow-600'
            : 'border-slate-800/80 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-200">
              {field.label} ({field.abbreviation})
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-slate-400">
              Norm: <strong className="text-cyan-300">{normVal.toFixed(2)}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span
              className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${interp.badgeClass}`}
            >
              T={tScore}
            </span>
          </div>
        </div>

        {/* Dynamic Range Slider */}
        {inputMode === 't_scores' ? (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>T=30</span>
              <span className="text-cyan-400 font-bold">
                T = {tScore} {tScore > 80 && <span className="text-red-400 font-extrabold">(T &gt; 80)</span>}
              </span>
              <span>T=120+</span>
            </div>
            <input
              id={`slider-t-${field.key}`}
              type="range"
              min="30"
              max="120"
              step="1"
              value={Math.min(120, Math.max(30, tScore))}
              onChange={(e) => handleSliderChangeTScore(field.key, parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0.00</span>
              <span className="text-amber-400 font-bold">{normVal.toFixed(2)}</span>
              <span>{maxNormalized.toFixed(1)}</span>
            </div>
            <input
              id={`slider-norm-${field.key}`}
              type="range"
              min="0.0"
              max={maxNormalized}
              step="0.01"
              value={normVal}
              onChange={(e) => handleSliderChangeNormalized(field.key, parseFloat(e.target.value))}
              className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        )}

        <div className="flex items-center justify-between text-[9.5px] text-slate-400">
          <span className="truncate max-w-[210px]">{field.effect}</span>
          <span className={`font-medium ${interp.textColor}`}>{interp.rangeLabel}</span>
        </div>
      </div>
    );
  };

  const activePreset = CLINICAL_PRESETS[activePresetIndex];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-5 text-slate-200">
      {/* Header & Presets */}
      <div className="flex flex-col gap-2.5 border-b border-slate-800 pb-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <h2 className="font-semibold text-sm tracking-wide text-white">
              Vector Psicométrico SCL-90-R
            </h2>
          </div>
          <button
            id="btn-reset-scl-defaults"
            onClick={handleResetToDefault}
            className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800"
            title="Restaurar a los valores por defecto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reiniciar</span>
          </button>
        </div>

        {/* Input Mode Selector & Baremo Table Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              id="mode-t-scores-btn"
              onClick={() => setInputMode('t_scores')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                inputMode === 't_scores'
                  ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/80 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Puntajes T (Baremo Casullo 2008)
            </button>
            <button
              id="mode-normalized-btn"
              onClick={() => setInputMode('normalized')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                inputMode === 'normalized'
                  ? 'bg-amber-950 text-amber-200 border border-amber-500/80 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Normalizado [0, {maxNormalized.toFixed(1)}]
            </button>
          </div>

          <button
            id="btn-toggle-baremo-table"
            onClick={() => setShowBaremoTable(!showBaremoTable)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors border ${
              showBaremoTable
                ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Ver tabla normativa de baremos Casullo & Pérez (2008) Varones Adultos"
          >
            <Table className="w-3.5 h-3.5 text-cyan-400" />
            <span>Baremo Varones Adultos</span>
          </button>
        </div>

        {/* Collapsible Baremo Normative Table */}
        {showBaremoTable && (
          <div className="bg-slate-950 border border-cyan-500/50 rounded-xl p-3 space-y-2 text-xs font-mono animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Baremo Casullo – Pérez (2008) · Varones Adultos (N: 379, 25-60 a.)
              </span>
              <span className="text-[10px] text-slate-400">Buenos Aires y Conurbano</span>
            </div>

            <div className="overflow-x-auto max-h-52">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/90 text-cyan-300 sticky top-0">
                    <th className="py-1 px-1.5 font-bold">T</th>
                    <th className="py-1 px-1">SOM</th>
                    <th className="py-1 px-1">OBS</th>
                    <th className="py-1 px-1">SI</th>
                    <th className="py-1 px-1">DEP</th>
                    <th className="py-1 px-1">ANS</th>
                    <th className="py-1 px-1">HOS</th>
                    <th className="py-1 px-1">FOB</th>
                    <th className="py-1 px-1">PAR</th>
                    <th className="py-1 px-1">PSIC</th>
                    <th className="py-1 px-1">IGS</th>
                    <th className="py-1 px-1">TSP</th>
                    <th className="py-1 px-1">IMSP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {BAREMO_CASULLO_PEREZ_2008_VARONES.map((row) => {
                    const isRowCritical = row.T >= 80;
                    const isRowRisk = row.T === 63;
                    return (
                      <tr
                        key={row.T}
                        className={`hover:bg-slate-800/60 transition-colors ${
                          isRowCritical
                            ? 'bg-rose-950/20 text-rose-200'
                            : isRowRisk
                            ? 'bg-yellow-950/20 text-yellow-200'
                            : ''
                        }`}
                      >
                        <td className="py-0.5 px-1.5 font-bold text-cyan-400">{row.T}</td>
                        <td className="py-0.5 px-1">{row.SOM.toFixed(2)}</td>
                        <td className="py-0.5 px-1">{row.OBS.toFixed(2)}</td>
                        <td className="py-0.5 px-1">{row.SI.toFixed(2)}</td>
                        <td className="py-0.5 px-1">{row.DEP.toFixed(2)}</td>
                        <td className="py-0.5 px-1">{row.ANS.toFixed(2)}</td>
                        <td className="py-0.5 px-1">{row.HOS.toFixed(2)}</td>
                        <td className="py-0.5 px-1">{row.FOB.toFixed(2)}</td>
                        <td className="py-0.5 px-1">{row.PAR.toFixed(2)}</td>
                        <td className="py-0.5 px-1">{row.PSIC.toFixed(2)}</td>
                        <td className="py-0.5 px-1">{row.IGS.toFixed(2)}</td>
                        <td className="py-0.5 px-1">{row.TSP.toFixed(1)}</td>
                        <td className="py-0.5 px-1">{row.IMSP.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-[9.5px] text-slate-400 italic pt-1">
              Nota clínica: T=50 es la media poblacional. T ≥ 63 representa el Percentil 90 (umbral de riesgo).
              Para casos donde T &gt; 80 (fuera del techo del baremo, ej. PSIC &gt; 80), la nueva fórmula (T - 50)/50
              permite normalizaciones diferenciables hasta {maxNormalized.toFixed(1)}.
            </p>
          </div>
        )}

        {/* Clinical Presets Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-400">Protocolos y Casos Clínicos:</label>
          <div className="grid grid-cols-1 gap-1.5">
            {CLINICAL_PRESETS.map((preset, idx) => (
              <button
                key={preset.name}
                id={`preset-btn-${idx}`}
                onClick={() => handleSelectPreset(idx)}
                className={`text-left p-2.5 rounded-lg text-xs transition-all border ${
                  activePresetIndex === idx
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-100 font-medium ring-1 ring-cyan-500/30'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                    {preset.isRiskCase && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />}
                    {preset.name}
                  </span>
                  {activePresetIndex === idx && (
                    <span className="text-[10px] bg-cyan-900 text-cyan-200 px-1.5 py-0.5 rounded border border-cyan-700">
                      Activo
                    </span>
                  )}
                </div>
                <div className="text-[10.5px] text-slate-400 mt-0.5 leading-relaxed">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Clinical Highlight Card for Matías Gabriel Ross Case */}
        {activePreset?.patientName === 'Ross, Matías Gabriel' && (
          <div className="bg-red-950/20 border border-red-500/60 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Informe Psicométrico: Ross, Matías Gabriel (30a, Varón)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-200 border border-red-700 font-bold">
                PSIC &gt; 80 (⚠ ALERTA)
              </span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1">
              <p>
                <strong>Diagnóstico Topológico:</strong> Psicoticismo T &gt; 80 (T=100) y Depresión T=73 sobrepasan el techo estándar del baremo.
              </p>
              <p className="text-slate-400 text-[10px]">
                Con la fórmula de normalización robusta <code className="text-cyan-300 font-mono">(T - 50)/50</code> y la estabilización sigmoidal <code className="text-amber-300 font-mono">tanh</code>, el manifold del Horn Torus <strong>no se rompe ni se invierte</strong>, manteniendo la continuidad analítica del síntoma.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Model Hyperparameters (a_scale & deformation_factor) */}
      <div className="bg-slate-950/60 border border-slate-800/90 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-cyan-300 flex items-center gap-1.5 font-medium">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Parámetros del Manifold Horn Torus
          </span>
          <span className="text-[10px] text-slate-400">R = r = a (Condición Horn)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* a_scale slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-300">a_scale (Escala):</span>
              <span className="text-cyan-400 font-bold">{params.a_scale.toFixed(2)}</span>
            </div>
            <input
              id="slider-a-scale"
              type="range"
              min="0.02"
              max="0.30"
              step="0.01"
              value={params.a_scale}
              onChange={(e) => handleParamChange('a_scale', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[9px] text-slate-400 font-mono">a = a_scale * GSI (Radio central)</p>
          </div>

          {/* deformation_factor slider & animation controls */}
          <div className="space-y-1.5 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <span>deformation_factor (δ):</span>
                {isAnimatingDeformation && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </span>
              <span className="text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
                {params.deformation_factor.toFixed(2)}
              </span>
            </div>

            <input
              id="slider-deformation-factor"
              type="range"
              min="0.0"
              max="0.80"
              step="0.01"
              value={params.deformation_factor}
              onChange={(e) => handleParamChange('deformation_factor', parseFloat(e.target.value))}
              className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />

            {/* Animation and Quick Presets Button Bar */}
            <div className="flex items-center gap-1.5 pt-1">
              {onToggleDeformationAnimation && (
                <button
                  id="btn-animate-deformation-form"
                  onClick={onToggleDeformationAnimation}
                  className={`flex-1 py-1 px-2 rounded text-[10px] font-medium flex items-center justify-center gap-1 transition-all border ${
                    isAnimatingDeformation
                      ? 'bg-amber-500 text-slate-950 border-amber-300 font-semibold animate-pulse shadow-sm'
                      : 'bg-amber-950/70 hover:bg-amber-900 text-amber-200 border-amber-700/70 hover:border-amber-500'
                  }`}
                  title="Animar la transición suave de deformation_factor desde el toro estándar (δ=0) hasta el estado deformado"
                >
                  {isAnimatingDeformation ? (
                    <>
                      <Pause className="w-3 h-3 text-slate-950 fill-current" />
                      <span>Pausar Animación</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Animar Transición (0 ➔ δ)</span>
                    </>
                  )}
                </button>
              )}

              <button
                id="btn-set-delta-zero"
                onClick={() => handleParamChange('deformation_factor', 0.0)}
                className="py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[9.5px] font-mono transition-colors"
                title="Fijar δ = 0.0 (Toro estándar perfecto)"
              >
                δ = 0
              </button>

              <button
                id="btn-set-delta-nominal"
                onClick={() => handleParamChange('deformation_factor', 0.3)}
                className="py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[9.5px] font-mono transition-colors"
                title="Fijar δ = 0.3 (Valor nominal)"
              >
                δ = 0.3
              </button>

              <button
                id="btn-set-delta-acute"
                onClick={() => handleParamChange('deformation_factor', 0.6)}
                className="py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-[9.5px] font-mono transition-colors"
                title="Fijar δ = 0.6 (Perturbación aguda)"
              >
                δ = 0.6
              </button>
            </div>

            <p className="text-[9px] text-slate-400 font-mono pt-0.5">
              plot_deformed_model(deformation_factor={params.deformation_factor.toFixed(2)}): Morfología continua.
            </p>
          </div>
        </div>
      </div>

      {/* Primary 6 SCL-90-R Scores */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
          <span>Variables SCL-90-R Principales ({inputMode === 't_scores' ? 'Puntajes T' : 'Normalizadas'})</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {inputMode === 't_scores' ? 'T: 30 a 120+' : `0.00 a ${maxNormalized.toFixed(1)}`}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {coreFields.map((field) => renderFieldControl(field))}
        </div>
      </div>

      {/* Extended SCL-90-R Subscales (Collapsible) */}
      <div className="border-t border-slate-800 pt-2 space-y-2">
        <button
          id="toggle-extended-dimensions-btn"
          onClick={() => setShowExtended(!showExtended)}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 font-medium transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dimensiones Clínicas Secundarias (Depresión, Ansiedad, Hostilidad...)</span>
          </span>
          {showExtended ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showExtended && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {extendedFields.map((field) => renderFieldControl(field))}
          </div>
        )}
      </div>
    </div>
  );
};
