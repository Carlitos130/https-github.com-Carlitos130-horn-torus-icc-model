import React, { useState } from 'react';
import { TopologicalMetrics, SCL90RData, ModelParams } from '../types';
import { generateModelSummaryText } from '../utils/hornTorusMath';
import { formatMetricSafe } from '../utils/formatMetric';
import { Terminal, Copy, Check, Download, ShieldCheck, Activity, TrendingUp, Info } from 'lucide-react';

interface ModelSummaryModalProps {
  sclData: SCL90RData;
  params: ModelParams;
  metrics: TopologicalMetrics;
}

export const ModelSummaryModal: React.FC<ModelSummaryModalProps> = ({
  sclData,
  params,
  metrics,
}) => {
  const [copied, setCopied] = useState(false);
  const summaryText = generateModelSummaryText(sclData, params, metrics);

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `horn_torus_icc_summary_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const severityColors = {
    'Normal': 'bg-emerald-950/60 border-emerald-500 text-emerald-300',
    'Leve': 'bg-cyan-950/60 border-cyan-500 text-cyan-300',
    'Moderado': 'bg-amber-950/60 border-amber-500 text-amber-300',
    'Severo': 'bg-orange-950/60 border-orange-500 text-orange-300',
    'Crítico': 'bg-rose-950/60 border-rose-500 text-rose-300'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4 text-slate-200">
      {/* Top Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
          <div className="text-[10px] text-slate-400 font-mono">Índice ICC</div>
          <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
            {metrics.iccIndex.toFixed(1)}%
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">Compuesto (AXIOMA)</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
          <div className="text-[10px] text-slate-400 font-mono">Energía Willmore</div>
          <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
            {formatMetricSafe(metrics.willmoreEnergyDeformed, 2)}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">Base: 2π² ≈ 19.74</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
          <div className="text-[10px] text-slate-400 font-mono">ΔE Tensión Dif.</div>
          <div className="text-lg font-bold font-mono text-fuchsia-400 mt-0.5">
            {(metrics.avgDifferentialTension * 100).toFixed(1)}%
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">Máx: {(metrics.maxDifferentialTension * 100).toFixed(1)}%</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
          <div className="text-[10px] text-slate-400 font-mono">Δ Área Superficie</div>
          <div className={`text-lg font-bold font-mono mt-0.5 ${metrics.surfaceAreaDeltaPercent >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {metrics.surfaceAreaDeltaPercent >= 0 ? '+' : ''}{metrics.surfaceAreaDeltaPercent.toFixed(1)}%
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">{metrics.surfaceAreaDeformed.toFixed(1)} u²</div>
        </div>

        <div className={`rounded-lg p-2.5 border ${severityColors[metrics.clinicalSeverityTier]}`}>
          <div className="text-[10px] font-mono opacity-80">Malestar (T IGS)</div>
          <div className="text-lg font-bold font-mono mt-0.5 tracking-wider">
            {metrics.clinicalSeverityTier}
          </div>
          <div className="text-[9px] opacity-80 mt-0.5">GSI: {sclData["GSI"].toFixed(2)}</div>
        </div>
      </div>

      {/* Terminal View of model.print_model_summary() */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs font-semibold text-slate-200">
              Salida model.print_model_summary()
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-copy-summary"
              onClick={handleCopy}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-1 transition-colors border border-slate-700"
              title="Copiar texto del resumen"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>

            <button
              id="btn-download-summary"
              onClick={handleDownloadTxt}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-1 transition-colors border border-slate-700"
              title="Descargar reporte como archivo de texto"
            >
              <Download className="w-3 h-3" />
              <span>.txt</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <pre
            id="terminal-output-summary"
            className="w-full max-h-[300px] overflow-auto bg-slate-950 text-slate-300 font-mono text-[11px] leading-relaxed p-3.5 rounded-lg border border-slate-800 selection:bg-cyan-900 selection:text-cyan-100"
          >
            {summaryText}
          </pre>
        </div>
      </div>
    </div>
  );
};
