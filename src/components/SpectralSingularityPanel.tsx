import React, { useState, useMemo } from 'react';
import {
  ModelParams,
  SCL90RData,
  SingularityCriticalPoint,
  ColorMapMode,
  ViewMode
} from '../types';
import {
  computeSpectralSingularityAnalysis
} from '../utils/hornTorusMath';
import {
  Activity,
  Sparkles,
  Zap,
  Target,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  BarChart3,
  ScatterChart,
  Eye,
  Sliders,
  Compass,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface SpectralSingularityPanelProps {
  params: ModelParams;
  sclData: SCL90RData;
  colorMap: ColorMapMode;
  onSetColorMap: (mode: ColorMapMode) => void;
  onSetViewMode?: (mode: ViewMode) => void;
  onTriggerPsychoticBreak?: () => void;
  isPsychoticBreakActive?: boolean;
}

export const SpectralSingularityPanel: React.FC<SpectralSingularityPanelProps> = ({
  params,
  sclData,
  colorMap,
  onSetColorMap,
  onSetViewMode,
  onTriggerPsychoticBreak,
  isPsychoticBreakActive = false
}) => {
  const [selectedPointId, setSelectedPointId] = useState<string>('fantasy_point');
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'spectrum' | 'scatter'>('matrix');

  // Compute live spectral singularity report
  const report = useMemo(() => {
    return computeSpectralSingularityAnalysis(params, sclData);
  }, [params, sclData]);

  const selectedPoint = useMemo(() => {
    return (
      report.criticalPoints.find((p) => p.id === selectedPointId) ||
      report.criticalPoints[0]
    );
  }, [report.criticalPoints, selectedPointId]);

  // Max count for spectrum histogram normalization
  const maxSpectrumCount = useMemo(() => {
    return Math.max(1, ...report.curvatureSpectrum.map((b) => b.count));
  }, [report.curvatureSpectrum]);

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-5 text-slate-200 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Análisis Espectral de Singularidades
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                  K(u,v) en Tiempo Real
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Curvatura Gaussiana en puntos críticos y acoplamiento con la Fantasía ($ ◇ a)
              </p>
            </div>
          </div>
        </div>

        {/* Quick Visual Controls */}
        <div className="flex items-center gap-2">
          <button
            id="btn-spectral-set-curvature"
            onClick={() => onSetColorMap('curvature')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
              colorMap === 'curvature'
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Activar mapa de Curvatura Gaussiana en el viewport 3D"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Colormap Curvatura</span>
          </button>

          <button
            id="btn-spectral-set-angustia"
            onClick={() => onSetColorMap('angustia')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
              colorMap === 'angustia'
                ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Activar mapa de Angustia en el viewport 3D"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Colormap Angustia</span>
          </button>

          {onTriggerPsychoticBreak && (
            <button
              id="btn-spectral-trigger-break"
              onClick={onTriggerPsychoticBreak}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                isPsychoticBreakActive
                  ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30 animate-pulse'
                  : 'bg-rose-950/70 hover:bg-rose-900 text-rose-200 border-rose-700/80'
              }`}
              title="Disparar o compensar brote psicótico"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400 fill-current" />
              <span>{isPsychoticBreakActive ? 'Compensar' : '⚡ Brote'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Metric Cards: Coupling & Integrity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Pearson Correlation */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>CORRELACIÓN K-ANGUSTIA</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 flex items-baseline gap-1.5">
            <span>r = {report.pearsonCorrelationCurvatureAnguish.toFixed(3)}</span>
            <span className="text-[10px] text-cyan-400/80 font-normal">
              {report.pearsonCorrelationCurvatureAnguish > 0.6 ? 'Alta' : 'Moderada'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Acoplamiento entre magnitud de curvatura |K| y desborde de angustia crítica.
          </p>
        </div>

        {/* Card 2: High Curvature Overlap */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>SUPERPOSICIÓN CRÍTICA</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 flex items-baseline gap-1.5">
            <span>{report.highCurvatureAnguishOverlapPercent}%</span>
            <span className="text-[10px] text-amber-400/80 font-normal">Área A ≤ A_cr</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Porcentaje de la zona de angustia desbordada bajo alta curvatura hiperbólica.
          </p>
        </div>

        {/* Card 3: Fantasy Point & Hole Distortion */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>AGUJERO FANTASÍA ($ ◇ a)</span>
            <Target className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-lg font-bold font-mono text-white">
              ΔK = {report.fantasyPointDistortion.deltaK > 0 ? '+' : ''}
              {report.fantasyPointDistortion.deltaK.toFixed(2)}
            </div>
            <span
              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                report.fantasyPointDistortion.structuralIntegrity === 'Integra'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : report.fantasyPointDistortion.structuralIntegrity === 'Tensa'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
              }`}
            >
              {report.fantasyPointDistortion.structuralIntegrity}
            </span>
          </div>
          <p className="text-[10px] text-amber-300/90 leading-tight font-mono">
            Agujero sin representación significante ($1 / S_2).
          </p>
        </div>

        {/* Card 4: Cusp Distortion */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>CÚSPIDE SINGULAR (v=±π)</span>
            <Flame className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-lg font-bold font-mono text-purple-300">
              K = {report.cuspSingularityDistortion.K_def.toFixed(1)}
            </div>
            <span
              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                report.cuspSingularityDistortion.status === 'Compensada'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : report.cuspSingularityDistortion.status === 'Cizalladura Leve'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
              }`}
            >
              {report.cuspSingularityDistortion.status}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Tensión de cizalladura singular en el orificio central.
          </p>
        </div>
      </div>

      {/* Subtabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          id="btn-subtab-matrix"
          onClick={() => setActiveSubTab('matrix')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            activeSubTab === 'matrix'
              ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Matriz de Puntos Críticos ({report.criticalPoints.length})</span>
        </button>

        <button
          id="btn-subtab-spectrum"
          onClick={() => setActiveSubTab('spectrum')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            activeSubTab === 'spectrum'
              ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Histograma Espectral</span>
        </button>

        <button
          id="btn-subtab-scatter"
          onClick={() => setActiveSubTab('scatter')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            activeSubTab === 'scatter'
              ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ScatterChart className="w-3.5 h-3.5" />
          <span>Dispersión Curvatura vs Angustia</span>
        </button>
      </div>

      {/* View 1: Critical Points Matrix */}
      {activeSubTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Critical Points Table / List */}
          <div className="lg:col-span-7 space-y-2">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pb-1">
              <span>PUNTO CRÍTICO TOPOLÓGICO</span>
              <span>K0 → K_def (ΔK) | ESTADO</span>
            </div>

            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {report.criticalPoints.map((pt) => {
                const isSelected = pt.id === selectedPointId;
                const isHyperbolic = pt.classification === 'hiperbolica' || pt.classification === 'singular';
                const isElliptic = pt.classification === 'eliptica';

                return (
                  <div
                    key={pt.id}
                    id={`critical-point-${pt.id}`}
                    onClick={() => setSelectedPointId(pt.id)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/50'
                        : 'bg-slate-950/50 hover:bg-slate-800/50 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          pt.isAnguishOverflow
                            ? 'bg-rose-500 animate-pulse ring-2 ring-rose-500/40'
                            : isHyperbolic
                            ? 'bg-amber-400'
                            : isElliptic
                            ? 'bg-cyan-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5 truncate">
                          <span>{pt.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {pt.lacanianLabel} • ({pt.uDeg}°, {pt.vDeg}°)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 text-right">
                      <div>
                        <div className="text-xs font-mono font-bold text-slate-200">
                          <span className="text-slate-400">{pt.K0.toFixed(2)}</span>
                          <span className="text-slate-500 mx-1">→</span>
                          <span
                            className={
                              pt.isAnguishOverflow
                                ? 'text-rose-400'
                                : isHyperbolic
                                ? 'text-amber-300'
                                : 'text-cyan-300'
                            }
                          >
                            {pt.K_def.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          ΔK = {pt.deltaK > 0 ? '+' : ''}
                          {pt.deltaK.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                            pt.isAnguishOverflow
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {pt.isAnguishOverflow ? 'Desborde' : 'Margen'}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          A={pt.angustia.toFixed(2)}
                        </span>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 text-slate-500 transition-transform ${
                          isSelected ? 'text-cyan-400 translate-x-0.5' : ''
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Point Deep Clinical & Mathematical Inspector */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div>
                  <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider">
                    INSPECTOR TOPOLÓGICO
                  </span>
                  <h3 className="text-sm font-bold text-white">{selectedPoint.name}</h3>
                  <p className="text-xs text-amber-300 font-mono">{selectedPoint.lacanianLabel}</p>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                    selectedPoint.isAnguishOverflow
                      ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}
                >
                  {selectedPoint.isAnguishOverflow ? '⚠ Angustia Desbordada' : '✓ Zona Protegida'}
                </span>
              </div>

              {/* Geometry Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Curvatura Gaussiana K</span>
                  <div className="font-bold text-white text-sm">
                    {selectedPoint.K_def.toFixed(3)}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">
                      (K0: {selectedPoint.K0.toFixed(2)})
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-300">
                    ΔK = {selectedPoint.deltaK > 0 ? '+' : ''}
                    {selectedPoint.deltaK.toFixed(3)}
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Curvatura Media H</span>
                  <div className="font-bold text-white text-sm">
                    {selectedPoint.H_def.toFixed(3)}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">
                      (H0: {selectedPoint.H0.toFixed(2)})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {selectedPoint.classification}
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Angustia A(u, v)</span>
                  <div className="font-bold text-sm text-white flex items-baseline gap-1">
                    <span className={selectedPoint.isAnguishOverflow ? 'text-rose-400' : 'text-emerald-400'}>
                      {selectedPoint.angustia.toFixed(3)} rad
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    A_cr = {params.a_critical.toFixed(3)} rad
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Tensión Diferencial</span>
                  <div className="font-bold text-sm text-white">
                    {selectedPoint.differentialTension.toFixed(3)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Estrés sintomático: {selectedPoint.stress.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Clinical Interpretation */}
              <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-mono text-cyan-300 uppercase flex items-center gap-1 font-semibold">
                  <Info className="w-3 h-3" />
                  Significado Metapsicológico & Clínico:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedPoint.clinicalMeaning}
                </p>
              </div>
            </div>

            {/* Point Action Buttons */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500 font-mono">
                Coord: u={(selectedPoint.u / Math.PI).toFixed(2)}π, v={(selectedPoint.v / Math.PI).toFixed(2)}π
              </span>
              <button
                id="btn-inspect-view-3d-point"
                onClick={() => {
                  if (onSetViewMode) {
                    if (selectedPoint.id === 'fantasy_point' || selectedPoint.id === 'cusp_singular') {
                      onSetViewMode('xray_icc');
                    } else {
                      onSetViewMode('deformed');
                    }
                  }
                  onSetColorMap('curvature');
                }}
                className="px-2.5 py-1 rounded-md bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-700/80 text-xs font-medium flex items-center gap-1 transition-all"
              >
                <span>Enfocar en 3D</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Curvature Spectrum Histogram */}
      {activeSubTab === 'spectrum' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 border-b border-slate-800 pb-2">
            <div>
              <span className="font-semibold text-white">Distribución de Curvatura Gaussiana K:</span>{' '}
              Zonas Hiperbólicas (K &lt; 0), Parabólicas (K ≈ 0) y Elípticas (K &gt; 0).
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                <span>Población Total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span>Angustia Crítica (A ≤ A_cr)</span>
              </div>
            </div>
          </div>

          {/* SVG Histogram Chart */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4">
            <div className="h-56 w-full flex items-end gap-2 pt-6 pb-6 px-2">
              {report.curvatureSpectrum.map((bin, idx) => {
                const heightPercent = Math.max(4, (bin.count / maxSpectrumCount) * 100);
                const criticalHeightPercent =
                  bin.count > 0 ? (bin.criticalAnguishCount / bin.count) * 100 : 0;

                const isHyp = bin.type === 'hiperbolica';
                const isEll = bin.type === 'eliptica';

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 border border-slate-700 text-white text-[10px] font-mono p-1.5 rounded shadow-xl whitespace-nowrap">
                      <div>K ~ {bin.binCenter.toFixed(1)}</div>
                      <div>Puntos: {bin.count}</div>
                      <div>Angustia Crítica: {bin.criticalAnguishCount}</div>
                    </div>

                    {/* Bar container */}
                    <div
                      className={`w-full rounded-t transition-all relative overflow-hidden flex flex-col justify-end ${
                        isHyp
                          ? 'bg-amber-950/60 border-t border-amber-500/80'
                          : isEll
                          ? 'bg-cyan-950/60 border-t border-cyan-500/80'
                          : 'bg-emerald-950/60 border-t border-emerald-500/80'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    >
                      {/* Base colored bar */}
                      <div
                        className={`w-full ${
                          isHyp ? 'bg-amber-500/40' : isEll ? 'bg-cyan-500/40' : 'bg-emerald-500/40'
                        }`}
                        style={{ height: '100%' }}
                      />
                      {/* Critical Anguish Overlay */}
                      {bin.criticalAnguishCount > 0 && (
                        <div
                          className="w-full bg-rose-500/90 border-t border-rose-300 absolute bottom-0 left-0 transition-all"
                          style={{ height: `${criticalHeightPercent}%` }}
                        />
                      )}
                    </div>

                    {/* Bin center label */}
                    <span className="text-[9px] font-mono text-slate-400 mt-1.5 truncate">
                      {bin.binCenter > 0 ? `+${bin.binCenter}` : bin.binCenter}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chart X-axis explanation */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
              <span className="text-amber-400">◀ Hiperbólica / Singular (K &lt;&lt; 0)</span>
              <span className="text-emerald-400">● Parabólica (K ≈ 0, Fantasía $ ◇ a)</span>
              <span className="text-cyan-400">Elíptica / Convexa Cc (K &gt; 0) ▶</span>
            </div>
          </div>
        </div>
      )}

      {/* View 3: Scatter Plot Curvature vs Anguish */}
      {activeSubTab === 'scatter' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 border-b border-slate-800 pb-2">
            <div>
              <span className="font-semibold text-white">Espacio Fase (Curvatura Gaussiana K vs Angustia A):</span>{' '}
              La línea carmesí horizontal marca el umbral crítico A_cr = {params.a_critical.toFixed(2)} rad.
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Desborde Crítico (A ≤ A_cr)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Zona Protegida</span>
              </div>
            </div>
          </div>

          {/* SVG Scatter Plot */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 relative">
            <div className="relative h-64 w-full border-l border-b border-slate-700">
              {/* Threshold line A = a_critical */}
              {(() => {
                const maxAng = Math.PI * 1.5; // ~4.7 rad
                const yPercent = 100 - (params.a_critical / maxAng) * 100;
                return (
                  <div
                    className="absolute left-0 right-0 border-b-2 border-dashed border-rose-500/80 z-10 flex items-center justify-end pr-2"
                    style={{ top: `${yPercent}%` }}
                  >
                    <span className="text-[10px] font-mono bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded border border-rose-700/80 shadow">
                      Umbral A_cr = {params.a_critical.toFixed(2)} rad
                    </span>
                  </div>
                );
              })()}

              {/* Zero Curvature Vertical Guide (Parabolic Line) */}
              <div
                className="absolute top-0 bottom-0 border-r border-dashed border-emerald-500/40 z-10"
                style={{ left: '50%' }}
              >
                <span className="text-[9px] font-mono text-emerald-400/80 absolute top-1 -translate-x-1/2">
                  K = 0
                </span>
              </div>

              {/* Scatter Points */}
              {report.samplePoints.map((pt, idx) => {
                // Map K in [-8, +6] to [0%, 100%]
                const xPercent = Math.max(3, Math.min(97, ((pt.K + 8) / 14) * 100));
                // Map Angustia in [0, 4.5] to [100%, 0%]
                const maxAng = Math.PI * 1.5;
                const yPercent = Math.max(3, Math.min(97, 100 - (pt.angustia / maxAng) * 100));

                return (
                  <div
                    key={idx}
                    className={`absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-150 cursor-pointer ${
                      pt.isOverflow
                        ? 'bg-rose-500 ring-2 ring-rose-500/40 shadow-sm shadow-rose-500'
                        : 'bg-cyan-400/70'
                    }`}
                    style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                    title={`K: ${pt.K}, Angustia: ${pt.angustia}`}
                  />
                );
              })}

              {/* Prominent Fantasy Point Beacon */}
              {(() => {
                const fp = report.criticalPoints.find((p) => p.id === 'fantasy_point')!;
                const xPercent = Math.max(5, Math.min(95, ((fp.K_def + 8) / 14) * 100));
                const maxAng = Math.PI * 1.5;
                const yPercent = Math.max(5, Math.min(95, 100 - (fp.angustia / maxAng) * 100));

                return (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
                    style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                  >
                    <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-lg shadow-amber-400/80 animate-ping absolute" />
                    <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-lg flex items-center justify-center text-[8px] font-bold text-slate-950">
                      ★
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-slate-900/90 px-1 rounded border border-amber-500 mt-1 shadow whitespace-nowrap">
                      $ ◇ a (Fantasía)
                    </span>
                  </div>
                );
              })()}

              {/* Prominent Cusp Singular Beacon */}
              {(() => {
                const cusp = report.criticalPoints.find((p) => p.id === 'cusp_singular')!;
                const xPercent = Math.max(5, Math.min(95, ((cusp.K_def + 8) / 14) * 100));
                const maxAng = Math.PI * 1.5;
                const yPercent = Math.max(5, Math.min(95, 100 - (cusp.angustia / maxAng) * 100));

                return (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
                    style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-white shadow-lg flex items-center justify-center text-[7px] font-bold text-white">
                      ⚡
                    </div>
                    <span className="text-[9px] font-mono font-bold text-purple-300 bg-slate-900/90 px-1 rounded border border-purple-500 mt-1 shadow whitespace-nowrap">
                      Cúspide v=±π
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Axes Labels */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2">
              <span>Curvatura Hiperbólica K &lt;&lt; 0</span>
              <span>Curvatura Gaussiana K(u, v)</span>
              <span>Curvatura Convexa K &gt;&gt; 0</span>
            </div>
            <div className="absolute left-2 top-2 text-[9px] font-mono text-slate-400">
              ▲ Angustia Máxima A
            </div>
            <div className="absolute left-2 bottom-6 text-[9px] font-mono text-slate-400">
              ▼ Angustia Nula (Foco)
            </div>
          </div>
        </div>
      )}

      {/* Metapsychological Summary Footer */}
      <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-lg text-xs text-slate-400 space-y-1">
        <h4 className="font-semibold text-cyan-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Fundamentación Metapsicológica: La Fantasía como Agujero sin Representación
        </h4>
        <p className="leading-relaxed text-[11px]">
          En la geometría del Horn Torus, la <strong>Fantasía Fundamental ($\$ \diamond a$)</strong> constituye un <strong>agujero estructural en el toro donde no existe una representación significante ($1 / S_2$)</strong>. Las cadenas de significantes $S$ y las imágenes de la especularidad $I$ bordean este vacío sin poder penetrarlo o colmarlo. La línea parabólica ($K_0 = 0$) en $v = \pi/2$ actúa como marco de este agujero; cuando la deformación sintomática comba el marco ($\Delta K \neq 0$), la angustia desborda el umbral crítico ($A \le A\_cr$) inundando el manifold psíquico hacia la singularidad central ($v = \pm\pi$).
        </p>
      </div>
    </div>
  );
};
