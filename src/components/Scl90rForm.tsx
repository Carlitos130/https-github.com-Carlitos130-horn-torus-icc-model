import React, { useState } from 'react';
import { SCL90RData, ModelParams } from '../types';
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
} from '../utils/hornTorusMath';
import { Sliders, RotateCcw, Brain, Activity, HelpCircle, ChevronDown, ChevronUp, Sparkles, AlertTriangle } from 'lucide-react';

interface Scl90rFormProps {
  sclData: SCL90RData;
  onChangeSclData: (newData: SCL90RData) => void;
  params: ModelParams;
  onChangeParams: (newParams: ModelParams) => void;
}

export const Scl90rForm: React.FC<Scl90rFormProps> = ({
  sclData,
  onChangeSclData,
  params,
  onChangeParams,
}) => {
  const [showExtended, setShowExtended] = useState(false);
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);

  // PSDI no es libre: se deriva de IGS y PST (IGS = PST·PSDI/90). Al mover el IGS,
  // el PST se acota al rango que deja PSDI dentro de [1, 4].
  const handleSliderChange = (key: keyof SCL90RData, value: number) => {
    const next: SCL90RData = { ...sclData, [key]: parseFloat(value.toFixed(2)) };
    if (key === 'GSI' || key === 'PST') {
      const [pstMin, pstMax] = pstRangeForGsi(next["GSI"]);
      next["PST"] = Math.round(Math.min(pstMax, Math.max(pstMin, next["PST"])));
      next["PSDI"] = parseFloat(derivePsdi(next["GSI"], next["PST"]).toFixed(2));
    }
    onChangeSclData(next);
  };

  const consistencyIssues = checkScl90rConsistency(sclData);

  // Escalas cuya PD excede el techo publicado del baremo de la población elegida
  // (patología severa): el T no se extrapola, se acota a T=80 y se avisa acá.
  const DIM_KEYS = ['Somatización', 'Obsesión-Compulsión', 'Sensibilidad Interpersonal', 'Depresión', 'Ansiedad', 'Hostilidad', 'Ansiedad Fóbica', 'Ideación Paranoide', 'Psicoticismo'] as const;
  const fueraDeBaremo = DIM_KEYS
    .map(key => {
      const rango = publishedRange(params.baremoId, key);
      if (!rango) return null;
      const [piso, techo] = rango;
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

  const handleParamChange = (key: keyof ModelParams, value: number) => {
    onChangeParams({
      ...params,
      [key]: value
    });
  };

  const RUPTURE_PRESET_NAME = 'Ruptura del modelo (IGS extremo)';
  const handleSelectPreset = (index: number) => {
    setActivePresetIndex(index);
    const preset = CLINICAL_PRESETS[index];
    if (preset) {
      onChangeSclData({ ...preset.data });
      // Wegbreite (Corolario I): el preset de ruptura adelgaza la pared (δ = 0.55)
      // para que el cruce tenga la anchura suficiente (≥ π/6); cualquier otro caso
      // restablece una pared gruesa (δ = 0.30) — cruce angosto, se disipa.
      if (preset.name === RUPTURE_PRESET_NAME) {
        onChangeParams({ ...params, deformation_factor: 0.55 });
      } else {
        onChangeParams({ ...params, deformation_factor: 0.30 });
      }
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
  const coreFields: { key: keyof SCL90RData; label: string; effect: string; color: string }[] = [
    {
      key: 'Somatización',
      label: 'Somatización (SOM)',
      effect: 'Ondulación poloidal exterior m=3 (manifestación corporal)',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      key: 'Obsesión-Compulsión',
      label: 'Obsesión-Compulsión (O-C)',
      effect: 'Bandas toroidales ortogonales n=4 (rigidez cognitiva)',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      key: 'Psicoticismo',
      label: 'Psicoticismo (PSY)',
      effect: 'Distorsión y cizalladura en cúspide singular θ=±π',
      color: 'from-rose-500 to-red-600'
    },
    {
      key: 'GSI',
      label: 'Global Severity Index (GSI)',
      effect: 'Dilatación radial macroscópica y volumen global',
      color: 'from-amber-500 to-orange-500'
    },
    {
      key: 'PST',
      label: 'Positive Symptom Total (PST)',
      effect: 'Conteo de ítems > 0 (0–90) · densidad modular de perturbaciones',
      color: 'from-teal-500 to-emerald-500'
    },
    {
      key: 'PSDI',
      label: 'Positive Symptom Distress (PSDI)',
      effect: 'Derivado: IGS·90/PST (1–4) · gradiente focal',
      color: 'from-orange-500 to-rose-500'
    },
  ];

  // Rango del slider por campo: PST es un conteo; PSDI es derivado (solo lectura).
  const sliderRange = (key: keyof SCL90RData): { min: number; max: number; step: number } =>
    key === 'PST' ? { min: 0, max: 90, step: 1 } : { min: 0, max: 4, step: 0.01 };

  const [gsiMin, gsiMax] = gsiRangeFromDimensions(sclData);

  // Extended dimensions
  const extendedFields: { key: keyof SCL90RData; label: string }[] = [
    { key: 'Depresión', label: 'Depresión (DEP) - Inflexión z-axis' },
    { key: 'Ansiedad', label: 'Ansiedad (ANX) - Micro-temblor armónico' },
    { key: 'Hostilidad', label: 'Hostilidad (HOS) - Puntas angulares' },
    { key: 'Sensibilidad Interpersonal', label: 'Sensibilidad Interpersonal (SI)' },
    { key: 'Ansiedad Fóbica', label: 'Ansiedad Fóbica (PHOB)' },
    { key: 'Ideación Paranoide', label: 'Ideación Paranoide (PAR)' },
  ];

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
            title="Restaurar a los valores exactos del prompt"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Valores Iniciales</span>
          </button>
        </div>

        {/* Clinical Presets Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-400">Casos Clínicos Predefinidos:</label>
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
                <div className="font-medium truncate">{preset.name}</div>
                <div className="text-[10px] text-slate-400 truncate opacity-80">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Model Hyperparameters (a_scale & deformation_factor) */}
      <div className="bg-slate-950/60 border border-slate-800/90 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-cyan-300 flex items-center gap-1.5 font-medium">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Parámetros del Manifold Horn Torus
          </span>
          <span className="text-[10px] text-slate-400">r/R = {params.rOverR.toFixed(2)} {params.rOverR >= 1 ? '(Condición Horn)' : '(Toro liso)'}</span>
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
            <p className="text-[9px] text-slate-400 font-mono">Factor métrico en HornTorusICCModel(a_scale=0.1)</p>
          </div>

          {/* rOverR slider: r/R ratio, 1 = horn torus limit */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-300">r/R (familia):</span>
              <span className="text-emerald-400 font-bold">{params.rOverR.toFixed(2)}</span>
            </div>
            <input
              id="slider-r-over-r"
              type="range"
              min="0.05"
              max="1.0"
              step="0.01"
              value={params.rOverR}
              onChange={(e) => handleParamChange('rOverR', parseFloat(e.target.value))}
              className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[9px] text-slate-400 font-mono">1.0 = horn torus (límite) · &lt; 1.0 = toro liso, H1 = Z²⟨μ, λ⟩</p>
          </div>

          {/* deformation_factor slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-300">Wegbreite — deformation_factor (δ):</span>
              <span className="text-amber-400 font-bold">{params.deformation_factor.toFixed(2)}</span>
            </div>
            <input
              id="slider-deformation-factor"
              type="range"
              min="0.0"
              max="0.80"
              step="0.02"
              value={params.deformation_factor}
              onChange={(e) => handleParamChange('deformation_factor', parseFloat(e.target.value))}
              className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[9px] text-slate-400 font-mono">Corolario I: anchura del cruce (adelgazamiento de la pared). Techo π/6 ≈ 0.52</p>
          </div>
        </div>

        {/* Baremo de población + N marcas de fantasía */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800/60">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-300">Baremo (población):</span>
              <span className="text-fuchsia-400 font-bold">
                T60 IGS = {getBaremo(params.baremoId).t60Gsi.toFixed(2)}
              </span>
            </div>
            <select
              id="select-baremo"
              value={params.baremoId ?? 'm_adultos'}
              onChange={(e) => handleParamChange('baremoId', e.target.value as unknown as number)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-md px-2 py-1 text-[11px] font-mono text-slate-200 cursor-pointer"
              title={getBaremo(params.baremoId).label}
            >
              {BAREMO_IDS.map(id => (
                <option key={id} value={id}>{BAREMOS[id].corto}</option>
              ))}
            </select>
            <p className="text-[9px] text-slate-400 font-mono">
              {getBaremo(params.baremoId).fuente} · ruptura: IGS ≥ {ruptureThresholdGsi(params.baremoId).toFixed(2)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-300">Marcas de fantasía (N):</span>
              <span className="text-rose-400 font-bold">{params.fantasyMarkCount ?? 1}</span>
            </div>
            <input
              id="slider-fantasy-marks"
              type="range"
              min="1"
              max="12"
              step="1"
              value={params.fantasyMarkCount ?? 1}
              onChange={(e) => handleParamChange('fantasyMarkCount', parseInt(e.target.value, 10))}
              className="w-full accent-rose-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              title="Resumen §8: una o varias marcas de trauma. La zona de angustia es la unión de sus vecindades."
            />
            <p className="text-[9px] text-slate-400 font-mono">Zona de angustia = unión de vecindades (A_cr) de todas las marcas</p>
          </div>
        </div>
      </div>

      {/* Primary 6 SCL-90-R Scores */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
          <span>Variables SCL-90-R Principales (dimensiones 0–4 · PST 0–90 · PSDI derivado)</span>
          <span className="text-[10px] text-slate-400 font-mono">scl90r_data</span>
        </div>

        <p className="text-[10px] text-slate-400 font-mono">
          IGS compatible con las dimensiones: {gsiMin.toFixed(2)} – {gsiMax.toFixed(2)}
        </p>

        {consistencyIssues.length > 0 && (
          <div id="scl-consistency-warning" className="bg-rose-950/50 border border-rose-700/70 rounded-lg p-2 space-y-1 text-[10.5px] text-rose-200">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Perfil SCL-90-R imposible</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5">
              {consistencyIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {fueraDeBaremo.length > 0 && (
          <div id="scl-fuera-baremo-warning" className="bg-amber-950/50 border border-amber-700/70 rounded-lg p-2 space-y-1 text-[10.5px] text-amber-200">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Fuera de baremo (patología severa): el T se acota al techo publicado</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5">
              {fueraDeBaremo.map(({ key, val, techo }) => (
                <li key={key as string}>
                  {key}: {val.toFixed(2)} &gt; {techo.toFixed(2)} — el baremo termina en T=80; el T real de este caso excede la tabla.
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {coreFields.map((field) => {
            const val = sclData[field.key] ?? 0.5;
            return (
              <div
                key={field.key}
                className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-2.5 space-y-1.5 transition-colors hover:border-slate-700"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-200 font-medium">{field.label}</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded border ${
                      fueraDeBaremo.some(f => f.key === field.key)
                        ? 'bg-amber-950 text-amber-300 border-amber-600'
                        : 'bg-slate-800 text-cyan-300 border-slate-700'
                    }`}
                    title={techoDe(field.key)}
                  >
                    {val.toFixed(2)}
                  </span>
                </div>

                <input
                  id={`slider-${field.key}`}
                  type="range"
                  min={sliderRange(field.key).min}
                  max={sliderRange(field.key).max}
                  step={sliderRange(field.key).step}
                  value={val}
                  disabled={field.key === 'PSDI'}
                  onChange={(e) => handleSliderChange(field.key, parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                />

                <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                  <span className="text-cyan-400">►</span>
                  <span className="truncate">{field.effect}</span>
                </div>
                {techoDe(field.key) && (
                  <p className="text-[9px] text-amber-400/90 font-mono truncate" title={techoDe(field.key)!}>
                    ⚠ fuera de baremo · {techoDe(field.key)!}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Extended SCL-90-R Subscales (Collapsible) */}
      <div className="border-t border-slate-800 pt-2">
        <button
          id="toggle-extended-dimensions-btn"
          onClick={() => setShowExtended(!showExtended)}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 font-medium transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            Dimensiones Secundarias SCL-90-R (Depresión, Ansiedad, Hostilidad...)
          </span>
          {showExtended ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showExtended && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60">
            {extendedFields.map((field) => {
              const val = sclData[field.key] ?? 0.5;
              return (
                <div key={field.key} className="bg-slate-950/30 p-2 rounded border border-slate-800/60 space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-300 truncate">{field.label}</span>
                    <span className="text-amber-400 font-semibold">{val.toFixed(2)}</span>
                  </div>
                  <input
                    id={`slider-ext-${field.key}`}
                    type="range"
                    min="0.0"
                    max="4.0"
                    step="0.01"
                    value={val}
                    onChange={(e) => handleSliderChange(field.key, parseFloat(e.target.value))}
                    className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
