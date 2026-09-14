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
  Palette
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

  // Lacanian Curves & Point toggles
  const [showCurveS, setShowCurveS] = useState<boolean>(true);
  const [showCurveI, setShowCurveI] = useState<boolean>(true);
  const [showCurveSigma, setShowCurveSigma] = useState<boolean>(true);
  const [showFantasyPoint, setShowFantasyPoint] = useState<boolean>(true);

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
                Topología del Inconsciente: Curvas S, I, Σ, Fantasía & Angustia A(u, v)
              </p>
            </div>
          </div>

          {/* View Mode Switcher Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              id="btn-view-standard"
              onClick={() => setViewMode('standard')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'standard'
                  ? 'bg-cyan-900/80 text-cyan-200 shadow-sm border border-cyan-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="model.plot_3d_model()"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Estándar (3D)</span>
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

          {/* ColorMap Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              id="btn-colormap-angustia"
              onClick={() => setColorMap('angustia')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                colorMap === 'angustia'
                  ? 'bg-rose-950 text-rose-300 border border-rose-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Campo de Angustia A(u, v) y Umbral Crítico A_cr=π/4"
            >
              <Flame className="w-3 h-3 text-rose-400" />
              <span>Angustia</span>
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

        {/* Lacanian Curves & Visual Layers Quick Strip */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">Capas Lacanianas:</span>
            
            {/* Curve S toggle */}
            <button
              id="toggle-curve-s-btn"
              onClick={() => setShowCurveS(!showCurveS)}
              className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1.5 ${
                showCurveS
                  ? 'bg-red-950/80 text-red-300 border-red-700'
                  : 'bg-slate-900 text-slate-500 border-slate-800 line-through'
              }`}
              title="Curva S (Significante): basada en Ansiedad + Obsesión y PSDI"
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
              title="Curva I (Imagen del cuerpo): basada en Somatización + Sensibilidad y PST"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>I (Cuerpo)</span>
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
              title="Curva Σ (Síntoma): basada en Psicoticismo + Hostilidad"
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
              <span>Fantasía</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
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
            showCurveSigma={showCurveSigma}
            showFantasyPoint={showFantasyPoint}
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
            <span>Willmore W: <span className="text-amber-400 font-bold">{metrics.willmoreEnergyDeformed.toFixed(2)}</span></span>
            <span className="text-slate-600">•</span>
            <span>ICC Coherencia: <span className="text-cyan-400 font-bold">{metrics.iccIndex.toFixed(1)}%</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
