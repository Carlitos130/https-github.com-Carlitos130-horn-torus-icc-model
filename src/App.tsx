import React, { useState } from 'react';
import { SCL90RData, ModelParams, ViewMode, ColorMapMode } from './types';
import { DEFAULT_SCL90R_DATA, computeTopologicalMetrics } from './utils/hornTorusMath';
import { HornTorusCanvas } from './components/HornTorusCanvas';
import { Scl90rForm } from './components/Scl90rForm';
import { ModelSummaryModal } from './components/ModelSummaryModal';
import { PythonCodeExport } from './components/PythonCodeExport';
import {
  Boxes,
  Sliders,
  Terminal,
  Code,
  Download,
  Eye,
  Scissors,
  Layers,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Flame,
  Palette,
  Activity,
  Radio,
  Scan
} from 'lucide-react';

export default function App() {
  // SCL-90-R Psychometric Data from user prompt
  const [sclData, setSclData] = useState<SCL90RData>(DEFAULT_SCL90R_DATA);

  // Model Parameters: a_scale=0.1, u_scale=2*pi, v_scale=pi, A_cr=pi/4, deformation_factor=0.3
  const [params, setParams] = useState<ModelParams>({
    a_scale: 0.1,
    u_scale: 2 * Math.PI,
    v_scale: Math.PI,
    deformation_factor: 0.3,
    gridResolution: 80,
    a_critical: Math.PI / 4,
  });

  // Visualization options
  const [viewMode, setViewMode] = useState<ViewMode>('deformed');
  const [colorMap, setColorMap] = useState<ColorMapMode>('angustia');
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [showVortexFlow, setShowVortexFlow] = useState<boolean>(true);

  // Lacanian Ribbons & Point toggles
  const [showCurveS, setShowCurveS] = useState<boolean>(true);
  const [showCurveI, setShowCurveI] = useState<boolean>(true);
  const [showPulsion, setShowPulsion] = useState<boolean>(true);
  const [showCurveSigma, setShowCurveSigma] = useState<boolean>(true);
  const [showFantasyPoint, setShowFantasyPoint] = useState<boolean>(true);
  const [showRibbons, setShowRibbons] = useState<boolean>(true);
  const [ccOpacity, setCcOpacity] = useState<number>(0.92);

  // Deformation Animation State
  const [isAnimatingDeformation, setIsAnimatingDeformation] = useState<boolean>(false);

  // UI Active Sidebar Tab
  const [activeTab, setActiveTab] = useState<'parameters' | 'summary' | 'python' | 'gallery'>('parameters');

  // Captured snapshots gallery
  const [gallery, setGallery] = useState<{ type: string; url: string; time: string }[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Computed topological invariants & clinical metrics
  const metrics = computeTopologicalMetrics(params, sclData);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeformationFactorChange = (factor: number) => {
    setParams((prev) => ({ ...prev, deformation_factor: parseFloat(factor.toFixed(3)) }));
  };

  const handleToggleDeformationAnimation = () => {
    setIsAnimatingDeformation((prev) => !prev);
  };

  const handleCapturePng = (type: 'standard' | 'deformed', dataUrl: string) => {
    const filename = type === 'standard' ? 'mi_modelo.png' : 'mi_modelo_deformado.png';
    setGallery((prev) => [
      {
        type: filename,
        url: dataUrl,
        time: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 5)
    ]);
    showToast(`✓ Imagen guardada exitosamente como "${filename}"`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-cyan-950/95 border border-cyan-500 text-cyan-200 px-4 py-2.5 rounded-lg shadow-2xl text-xs font-mono backdrop-blur-md animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo and Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-white">
                  Horn Torus ICC Model
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                  SCL-90-R & Lacan
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Exterior Cc vs Interior Icc: S, I, Hilo Pulsional (pegado a I), Σ y Fantasía=Angustia
              </p>
            </div>
          </div>

          {/* View Mode Switcher Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              id="btn-view-standard"
              onClick={() => {
                setViewMode('standard');
                if (ccOpacity < 0.5) setCcOpacity(0.92);
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'standard'
                  ? 'bg-cyan-900/80 text-cyan-200 shadow-sm border border-cyan-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Exterior Cc: Vista exterior estándar del Horn Torus"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exterior (Cc)</span>
            </button>

            <button
              id="btn-view-xray-icc"
              onClick={() => {
                setViewMode('xray_icc');
                if (ccOpacity > 0.45 || ccOpacity < 0.08) setCcOpacity(0.20);
                setShowCurveS(true);
                setShowCurveI(true);
                setShowPulsion(true);
                setShowCurveSigma(true);
                setShowFantasyPoint(true);
                setShowRibbons(true);
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'xray_icc'
                  ? 'bg-cyan-950/90 text-cyan-200 shadow-md border border-cyan-400 font-semibold ring-2 ring-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista de Rayos X del Icc: Transparencia dinámica a las porciones Cc manteniendo la envolvente semitransparente"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Rayos X Icc</span>
            </button>

            <button
              id="btn-view-interior-icc"
              onClick={() => {
                setViewMode('interior_icc');
                if (ccOpacity > 0.3) setCcOpacity(0.20);
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'interior_icc'
                  ? 'bg-amber-950/90 text-amber-200 shadow-sm border border-amber-600 font-semibold ring-1 ring-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Ver el interior del Horn Torus (Icc): Cintas entrecruzadas, pulsión pegada a I y fantasía"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Interior (Icc)</span>
            </button>

            <button
              id="btn-view-deformed"
              onClick={() => setViewMode('deformed')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'deformed'
                  ? 'bg-amber-950/80 text-amber-200 shadow-sm border border-amber-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="model.plot_deformed_model(deformation_factor=0.3)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Deformado (δ={params.deformation_factor})</span>
            </button>

            <button
              id="btn-view-comparison"
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'comparison'
                  ? 'bg-indigo-950/80 text-indigo-200 shadow-sm border border-indigo-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Superposición de Toro Estándar y Deformado"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Comparación</span>
            </button>

            <button
              id="btn-view-cross-section"
              onClick={() => setViewMode('cross_section')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'cross_section'
                  ? 'bg-rose-950/80 text-rose-200 shadow-sm border border-rose-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Corte sagital a través de la singularidad central"
            >
              <Scissors className="w-3.5 h-3.5 text-rose-400" />
              <span>Corte Cúspide</span>
            </button>
          </div>

          {/* ColorMap Mode Switcher & a_critical Live Control */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-1">
              <button
                id="btn-colormap-angustia"
                onClick={() => setColorMap('angustia')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                  colorMap === 'angustia'
                    ? 'bg-rose-950 text-rose-300 border border-rose-700 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Campo de Angustia A(u, v) y Umbral Crítico A_cr"
              >
                <Flame className="w-3 h-3 text-rose-400" />
                <span>Angustia</span>
              </button>

              {/* Real-time a_critical slider and numeric input */}
              <div
                id="panel-a-critical-control"
                className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-0.5 rounded-lg border border-rose-900/50 text-[10.5px] font-mono shadow-inner"
                title="Modificar en tiempo real el valor de 'a_critical' (actualmente π/4 ≈ 0.785) para observar la topología de la zona de angustia"
              >
                <span className="text-rose-300/90 font-semibold text-[10px]">A_cr:</span>
                <input
                  id="slider-a-critical-colormap"
                  type="range"
                  min="0.10"
                  max="2.50"
                  step="0.01"
                  value={params.a_critical}
                  onChange={(e) => setParams((prev) => ({ ...prev, a_critical: parseFloat(e.target.value) }))}
                  className="w-16 accent-rose-400 h-1 cursor-pointer"
                  title="Deslizador a_critical"
                />
                <input
                  id="input-a-critical-colormap"
                  type="number"
                  min="0.05"
                  max="3.14"
                  step="0.01"
                  value={parseFloat(params.a_critical.toFixed(3))}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0.01 && val <= 3.14) {
                      setParams((prev) => ({ ...prev, a_critical: val }));
                    }
                  }}
                  className="w-12 bg-slate-950 border border-slate-700 text-rose-300 font-mono text-[10px] rounded px-1 py-0.5 text-center focus:border-rose-500 focus:outline-none"
                  title="Valor exacto de a_critical (rad)"
                />
                <button
                  id="btn-preset-pi-4"
                  onClick={() => setParams((prev) => ({ ...prev, a_critical: Math.PI / 4 }))}
                  className={`px-1 py-0.5 rounded text-[9px] border transition-colors ${
                    Math.abs(params.a_critical - Math.PI / 4) < 0.01
                      ? 'bg-rose-950 text-rose-200 border-rose-600 font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="Restablecer A_cr = π/4 (0.785 rad)"
                >
                  π/4
                </button>
              </div>
            </div>

            <button
              id="btn-colormap-diff-stress"
              onClick={() => setColorMap('differential_stress')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                colorMap === 'differential_stress'
                  ? 'bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-700 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Differential Stress: Compara la superficie de energía del toro estándar vs. deformado"
            >
              <Activity className="w-3 h-3 text-fuchsia-400" />
              <span>Diff Stress</span>
            </button>

            <button
              id="btn-colormap-stress"
              onClick={() => setColorMap('stress')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                colorMap === 'stress'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Estrés por deformación psicométrica"
            >
              <Palette className="w-3 h-3 text-amber-400" />
              <span>Estrés</span>
            </button>
          </div>
        </div>

        {/* Lacanian Curves, Hilo Pulsional & Visual Layers Quick Strip */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 text-[11px]">Cintas Interiores (Icc):</span>
            
            {/* Curve S toggle */}
            <button
              id="toggle-curve-s-btn"
              onClick={() => setShowCurveS(!showCurveS)}
              className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1.5 ${
                showCurveS
                  ? 'bg-red-950/80 text-red-300 border-red-700'
                  : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
              }`}
              title="Curva/Cinta S (Significante / Simbólico): basada en Ansiedad + Obsesión y PSDI"
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>S (Significante)</span>
            </button>

            {/* Curve I toggle */}
            <button
              id="toggle-curve-i-btn"
              onClick={() => setShowCurveI(!showCurveI)}
              className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1.5 ${
                showCurveI
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
              }`}
              title="Curva/Cinta I (Imagen del cuerpo): basada en Somatización + Sensibilidad y PST"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>I (Cuerpo)</span>
            </button>

            {/* Hilo Pulsional toggle - Pegado a I & Campo Vectorial de Flujo Animado */}
            <button
              id="toggle-curve-pulsion-btn"
              onClick={() => setShowPulsion(!showPulsion)}
              className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1.5 ${
                showPulsion
                  ? 'bg-amber-950/90 text-amber-300 border-amber-600 font-semibold shadow-sm'
                  : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
              }`}
              title="Hilo Pulsional (Trieb / Vorstellungrepräsentanz): Visualiza el campo vectorial animado de flujo interior (Drang) anclado a I"
            >
              <span className={`w-2 h-2 rounded-full ${showPulsion ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
              <span>Pulsión (Campo Vectorial)</span>
            </button>

            {/* Curve Sigma toggle */}
            <button
              id="toggle-curve-sigma-btn"
              onClick={() => setShowCurveSigma(!showCurveSigma)}
              className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1.5 ${
                showCurveSigma
                  ? 'bg-blue-950/80 text-blue-300 border-blue-700'
                  : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
              }`}
              title="Curva/Cinta Σ (Síntoma / Sinthome): basada en Psicoticismo + Hostilidad"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Σ (Síntoma)</span>
            </button>

            {/* Fantasy Point toggle */}
            <button
              id="toggle-fantasy-point-btn"
              onClick={() => setShowFantasyPoint(!showFantasyPoint)}
              className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1.5 ${
                showFantasyPoint
                  ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                  : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
              }`}
              title="Punto de Fantasía (π, π/2) - Foco de Angustia Máxima"
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Fantasía=Angustia</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Ribbons 3D vs Lines */}
            <button
              id="toggle-ribbons-btn"
              onClick={() => setShowRibbons(!showRibbons)}
              className={`px-2 py-0.5 rounded text-xs font-mono border transition-colors ${
                showRibbons
                  ? 'bg-purple-950/80 text-purple-300 border-purple-700'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title="Alternar entre cintas entrelazadas 3D y líneas vectoriales"
            >
              {showRibbons ? 'Cintas 3D' : 'Líneas 1D'}
            </button>

            {/* Opacity Cc slider with Dynamic Presets for X-Ray mode */}
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] transition-colors ${
              viewMode === 'xray_icc'
                ? 'bg-cyan-950/80 border-cyan-500/70 shadow-sm'
                : 'bg-slate-950 border-slate-800'
            }`}>
              <span className={viewMode === 'xray_icc' ? 'text-cyan-200 font-semibold' : 'text-slate-400'}>
                {viewMode === 'xray_icc' ? 'Transparencia Cc:' : 'Opacidad Cc:'}
              </span>
              <input
                id="slider-cc-opacity"
                type="range"
                min="0.04"
                max="1.0"
                step="0.02"
                value={ccOpacity}
                onChange={(e) => setCcOpacity(parseFloat(e.target.value))}
                className="w-18 accent-cyan-400 h-1 cursor-pointer"
                title="Opacidad dinámica de la piel exterior (Cc / Consciente)"
              />
              <span className="text-cyan-300 font-mono font-bold w-8 text-right">{(ccOpacity * 100).toFixed(0)}%</span>

              {viewMode === 'xray_icc' && (
                <div className="flex items-center gap-1 ml-1 border-l border-cyan-800/80 pl-1.5 text-[9px] font-mono">
                  <button
                    onClick={() => setCcOpacity(0.08)}
                    className="px-1.5 py-0.5 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700/60"
                    title="Envolvente fantasma ultra translúcida (8%)"
                  >
                    Fantasma
                  </button>
                  <button
                    onClick={() => setCcOpacity(0.20)}
                    className="px-1.5 py-0.5 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700/60"
                    title="Radiografía óptima (20%)"
                  >
                    Rayos X
                  </button>
                  <button
                    onClick={() => setCcOpacity(0.40)}
                    className="px-1.5 py-0.5 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700/60"
                    title="Carcasa cristalina (40%)"
                  >
                    Cristal
                  </button>
                </div>
              )}
            </div>

            <button
              id="toggle-vortex-flow-btn"
              onClick={() => setShowVortexFlow(!showVortexFlow)}
              className={`px-2 py-0.5 rounded text-xs font-mono flex items-center gap-1 border transition-colors ${
                showVortexFlow
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showVortexFlow ? 'bg-cyan-400' : 'bg-slate-600'}`} />
              <span>Vórtice</span>
            </button>

            <button
              id="toggle-wireframe-btn"
              onClick={() => setShowWireframe(!showWireframe)}
              className={`px-2 py-0.5 rounded text-xs font-mono border transition-colors ${
                showWireframe
                  ? 'bg-slate-800 text-cyan-300 border-slate-700'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              Malla
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col lg:flex-row gap-5">
        {/* Left Column: 3D Horn Torus Viewport */}
        <section className="flex-1 flex flex-col min-h-[500px] lg:min-h-[640px]">
          <HornTorusCanvas
            sclData={sclData}
            params={params}
            viewMode={viewMode}
            colorMap={colorMap}
            showWireframe={showWireframe}
            showVortexFlow={showVortexFlow}
            showCurveS={showCurveS}
            showCurveI={showCurveI}
            showPulsion={showPulsion}
            showCurveSigma={showCurveSigma}
            showFantasyPoint={showFantasyPoint}
            showRibbons={showRibbons}
            ccOpacity={ccOpacity}
            isAnimatingDeformationExternal={isAnimatingDeformation}
            onCcOpacityChange={setCcOpacity}
            onDeformationFactorChange={handleDeformationFactorChange}
            onToggleDeformationAnimation={handleToggleDeformationAnimation}
            onViewModeChange={(m) => {
              setViewMode(m);
              if (m === 'interior_icc' && ccOpacity > 0.3) setCcOpacity(0.20);
              if (m === 'standard' && ccOpacity < 0.5) setCcOpacity(0.92);
            }}
            onCapturePng={handleCapturePng}
          />
        </section>

        {/* Right Column: Interactive Controls, Terminal Summary, Python Script */}
        <aside className="w-full lg:w-[440px] flex flex-col gap-3">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              id="tab-parameters-btn"
              onClick={() => setActiveTab('parameters')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'parameters'
                  ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>SCL-90-R</span>
            </button>

            <button
              id="tab-summary-btn"
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'summary'
                  ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Resumen</span>
            </button>

            <button
              id="tab-python-btn"
              onClick={() => setActiveTab('python')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'python'
                  ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Python</span>
            </button>

            {gallery.length > 0 && (
              <button
                id="tab-gallery-btn"
                onClick={() => setActiveTab('gallery')}
                className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'gallery'
                    ? 'bg-slate-800 text-amber-300 font-semibold border border-slate-700/80'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Capturas generadas"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="text-[10px] bg-slate-700 px-1 rounded-full">{gallery.length}</span>
              </button>
            )}
          </div>

          {/* Tab Content Display */}
          <div className="flex-1 overflow-y-auto max-h-[640px] pr-1 space-y-3">
            {activeTab === 'parameters' && (
              <Scl90rForm
                sclData={sclData}
                onChangeSclData={setSclData}
                params={params}
                onChangeParams={setParams}
                isAnimatingDeformation={isAnimatingDeformation}
                onToggleDeformationAnimation={handleToggleDeformationAnimation}
              />
            )}

            {activeTab === 'summary' && (
              <ModelSummaryModal
                sclData={sclData}
                params={params}
                metrics={metrics}
              />
            )}

            {activeTab === 'python' && (
              <PythonCodeExport
                sclData={sclData}
                params={params}
              />
            )}

            {activeTab === 'gallery' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-slate-300 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>Archivos Exportados (.png)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    model.plot_*_model(save_path=...)
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {gallery.map((item, i) => (
                    <div
                      key={i}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center gap-3"
                    >
                      <img
                        src={item.url}
                        alt={item.type}
                        className="w-20 h-16 object-cover rounded bg-black border border-slate-800"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs font-semibold text-cyan-300 truncate">
                          {item.type}
                        </div>
                        <div className="text-[10px] text-slate-400">Generado a las {item.time}</div>
                        <a
                          href={item.url}
                          download={item.type}
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium mt-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Descargar archivo</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 text-xs py-2 px-4 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>Horn Torus Icc: </span>
            <span className="text-cyan-400">R = r = a = a_scale · GSI</span>
            <span className="text-slate-600"> | </span>
            <span className="text-rose-400">Fantasía: (π, π/2)</span>
            <span className="text-slate-600"> | </span>
            <span className="text-amber-400">A_cr = π/4</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Ruptura: <span className="text-rose-400 font-bold">{metrics.lacanian.ruptureAreaPercent.toFixed(1)}%</span></span>
            <span className="text-slate-600">•</span>
            <span>ΔE Tensión: <span className="text-fuchsia-400 font-bold">{(metrics.avgDifferentialTension * 100).toFixed(1)}%</span></span>
            <span className="text-slate-600">•</span>
            <span>Willmore W: <span className="text-amber-400 font-bold">{metrics.willmoreEnergyDeformed.toFixed(2)}</span></span>
            <span className="text-slate-600">•</span>
            <span>ICC Coherencia: <span className="text-cyan-400 font-bold">{metrics.iccIndex.toFixed(1)}%</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
