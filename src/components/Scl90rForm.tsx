import React, { useState } from 'react';
import { SCL90RData, ModelParams } from '../types';
import { CLINICAL_PRESETS, DEFAULT_SCL90R_DATA } from '../utils/hornTorusMath';
import { Sliders, RotateCcw, Brain, Activity, HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

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

  const handleSliderChange = (key: keyof SCL90RData, value: number) => {
    onChangeSclData({
      ...sclData,
      [key]: parseFloat(value.toFixed(2))
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
      effect: 'Densidad modular de perturbaciones de alta frecuencia',
      color: 'from-teal-500 to-emerald-500'
    },
    {
      key: 'PSDI',
      label: 'Positive Symptom Distress (PSDI)',
      effect: 'Pendiente de gradiente focal y profundidad de estrés',
      color: 'from-orange-500 to-rose-500'
    },
  ];

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
          <span className="text-[10px] text-slate-400">R = r = 1.0 (Condición Horn)</span>
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

          {/* deformation_factor slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-300">deformation_factor (δ):</span>
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
            <p className="text-[9px] text-slate-400 font-mono">Amplitud en plot_deformed_model(deformation_factor=0.3)</p>
          </div>
        </div>
      </div>

      {/* Primary 6 SCL-90-R Scores */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
          <span>Variables SCL-90-R Principales (0.00 - 1.00)</span>
          <span className="text-[10px] text-slate-400 font-mono">scl90r_data</span>
        </div>

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
                  <span className="font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {val.toFixed(2)}
                  </span>
                </div>

                <input
                  id={`slider-${field.key}`}
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.01"
                  value={val}
                  onChange={(e) => handleSliderChange(field.key, parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />

                <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                  <span className="text-cyan-400">►</span>
                  <span className="truncate">{field.effect}</span>
                </div>
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
                    max="1.0"
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
