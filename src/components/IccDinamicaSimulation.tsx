import React, { useState, useMemo } from 'react';
import { SCL90RData, ModelParams } from '../types';
import {
  correr_caso,
  scl90r_a_parametros,
  EstructuraClinica,
  ResultadoSimulacionIcc,
} from '../utils/iccDinamica';
import {
  Activity,
  Play,
  RotateCcw,
  Copy,
  Check,
  Zap,
  ShieldAlert,
  Sliders,
  Info,
  TrendingUp,
  Flame,
  Code,
  Sparkles
} from 'lucide-react';

interface IccDinamicaSimulationProps {
  sclData: SCL90RData;
  params: ModelParams;
  onApplyIgsSim?: (igsSim: number) => void;
  onTriggerPsychoticBreak?: () => void;
}

export const IccDinamicaSimulation: React.FC<IccDinamicaSimulationProps> = ({
  sclData,
  params,
  onApplyIgsSim,
  onTriggerPsychoticBreak,
}) => {
  const [estructura, setEstructura] = useState<EstructuraClinica>('neurotico');
  const [tMax, setTMax] = useState<number>(20.0);
  const [impulso, setImpulso] = useState<number>(0.0);
  const [activeSubTab, setActiveSubTab] = useState<'graficas' | 'fase' | 'codigo' | 'parametros'>('graficas');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Ejecución dinámica
  const resultado: ResultadoSimulacionIcc = useMemo(() => {
    return correr_caso(sclData, estructura, {
      t_max: tMax,
      dt: 0.05,
      drang_impulso: impulso,
      a_critical: params.a_critical,
    });
  }, [sclData, estructura, tMax, impulso, params.a_critical]);

  const pythonSnippet = `from icc_dinamica import correr_caso, scl90r_a_parametros

tu_scl90r_data = {
    "Somatización": ${sclData["Somatización"].toFixed(2)},
    "Obsesión-Compulsión": ${sclData["Obsesión-Compulsión"].toFixed(2)},
    "Sensibilidad Interpersonal": ${sclData["Sensibilidad Interpersonal"].toFixed(2)},
    "Depresión": ${sclData["Depresión"].toFixed(2)},
    "Ansiedad": ${sclData["Ansiedad"].toFixed(2)},
    "Hostilidad": ${sclData["Hostilidad"].toFixed(2)},
    "Ansiedad Fóbica": ${sclData["Ansiedad Fóbica"].toFixed(2)},
    "Ideación Paranoide": ${sclData["Ideación Paranoide"].toFixed(2)},
    "Psicoticismo": ${sclData["Psicoticismo"].toFixed(2)},
    "GSI": ${sclData["GSI"].toFixed(2)},
    "PST": ${sclData["PST"]},
    "PSDI": ${sclData["PSDI"].toFixed(2)}
}

res = correr_caso(tu_scl90r_data, estructura="${estructura}")
print("IGS_sim :", res["IGS_sim"])
print("Q_total :", res["Q_total"])
print("Régimen :", res["regimen"])`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Helper para dibujar SVG polyline de series de tiempo
  const renderSvgTimeSeries = (
    data: number[],
    threshold: number | null,
    strokeColor: string,
    thresholdColor: string,
    yLabel: string
  ) => {
    const w = 380;
    const h = 130;
    const pad = 24;
    const maxVal = Math.max(...data, threshold ?? 1.0, 1.2) * 1.15;
    const minVal = Math.min(0, Math.min(...data));
    const rangeY = maxVal - minVal || 1;

    const points = data
      .map((val, idx) => {
        const x = pad + (idx / (data.length - 1)) * (w - pad * 2);
        const y = h - pad - ((val - minVal) / rangeY) * (h - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const threshY =
      threshold !== null ? h - pad - ((threshold - minVal) / rangeY) * (h - pad * 2) : null;

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32 bg-slate-950/80 rounded-lg border border-slate-800">
        {/* Grid lines */}
        <line x1={pad} y1={pad} x2={w - pad} y2={pad} stroke="#334155" strokeDasharray="2,2" strokeWidth="0.8" />
        <line x1={pad} y1={h / 2} x2={w - pad} y2={h / 2} stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.8" />
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#334155" strokeWidth="1" />

        {/* Threshold line */}
        {threshY !== null && threshY >= pad && threshY <= h - pad && (
          <line
            x1={pad}
            y1={threshY}
            x2={w - pad}
            y2={threshY}
            stroke={thresholdColor}
            strokeDasharray="4,3"
            strokeWidth="1.2"
          />
        )}

        {/* Data curve */}
        <polyline fill="none" stroke={strokeColor} strokeWidth="2" points={points} />

        {/* Labels */}
        <text x={pad} y={pad - 6} fill="#94a3b8" fontSize="9" fontFamily="monospace">
          {maxVal.toFixed(2)}
        </text>
        <text x={pad} y={h - 6} fill="#94a3b8" fontSize="9" fontFamily="monospace">
          {minVal.toFixed(2)} (t=0)
        </text>
        <text x={w - pad} y={h - 6} fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="end">
          t={tMax}s
        </text>
        <text x={w - pad} y={pad - 6} fill={strokeColor} fontSize="9" fontFamily="monospace" textAnchor="end" fontWeight="bold">
          {yLabel}
        </text>
      </svg>
    );
  };

  // Helper para plano de fase (Q vs Angustia)
  const renderPhasePlane = () => {
    const w = 380;
    const h = 180;
    const pad = 30;
    const qData = resultado.Q_t;
    const aData = resultado.angustia_t;
    const maxQ = Math.max(...qData, resultado.parametros.lambda_bar, 1.5) * 1.1;
    const maxA = Math.max(...aData, params.a_critical, 1.2) * 1.1;

    const points = qData
      .map((qVal, idx) => {
        const aVal = aData[idx];
        const x = pad + (qVal / maxQ) * (w - pad * 2);
        const y = h - pad - (aVal / maxA) * (h - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const aCrY = h - pad - (params.a_critical / maxA) * (h - pad * 2);
    const lambdaX = pad + (resultado.parametros.lambda_bar / maxQ) * (w - pad * 2);

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44 bg-slate-950/80 rounded-lg border border-slate-800">
        {/* Background danger zone (Desborde) */}
        {aCrY >= pad && lambdaX <= w - pad && (
          <rect
            x={lambdaX}
            y={pad}
            width={w - pad - lambdaX}
            height={aCrY - pad}
            fill="#e11d48"
            fillOpacity="0.08"
          />
        )}

        {/* Axes */}
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#475569" strokeWidth="1" />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#475569" strokeWidth="1" />

        {/* Threshold lines */}
        {aCrY >= pad && aCrY <= h - pad && (
          <line x1={pad} y1={aCrY} x2={w - pad} y2={aCrY} stroke="#f59e0b" strokeDasharray="3,3" strokeWidth="1.2" />
        )}
        {lambdaX >= pad && lambdaX <= w - pad && (
          <line x1={lambdaX} y1={pad} x2={lambdaX} y2={h - pad} stroke="#ef4444" strokeDasharray="3,3" strokeWidth="1.2" />
        )}

        {/* Trajectory */}
        <polyline fill="none" stroke="#38bdf8" strokeWidth="1.8" points={points} opacity="0.85" />

        {/* Start Point */}
        <circle
          cx={pad + (qData[0] / maxQ) * (w - pad * 2)}
          cy={h - pad - (aData[0] / maxA) * (h - pad * 2)}
          r="3.5"
          fill="#10b981"
        />

        {/* End Point */}
        <circle
          cx={pad + (qData[qData.length - 1] / maxQ) * (w - pad * 2)}
          cy={h - pad - (aData[aData.length - 1] / maxA) * (h - pad * 2)}
          r="4.5"
          fill="#f43f5e"
          stroke="#fff"
          strokeWidth="1"
        />

        {/* Labels */}
        <text x={w / 2} y={h - 10} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
          Carga Pulsional Q(t) ➔
        </text>
        <text x={12} y={h / 2} fill="#94a3b8" fontSize="10" fontFamily="monospace" transform={`rotate(-90 12 ${h / 2})`} textAnchor="middle">
          Angustia A(t) ➔
        </text>
        <text x={lambdaX + 2} y={pad + 10} fill="#f87171" fontSize="8" fontFamily="monospace">
          λ_bar
        </text>
        <text x={w - pad - 4} y={aCrY - 4} fill="#fbbf24" fontSize="8" fontFamily="monospace" textAnchor="end">
          A_cr
        </text>
      </svg>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3.5 text-slate-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
            <span>Simulador Dinámico:</span>
            <code className="text-cyan-300 font-mono text-xs bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60">
              icc_dinamica.py
            </code>
          </h3>
        </div>
        <div className="text-[10.5px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          correr_caso(scl_data, estructura="{estructura}")
        </div>
      </div>

      {/* Structure Selector (Estructura Psíquica) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-medium text-slate-300">Estructura Psíquica:</span>
          <span className="text-[11px] text-cyan-400 font-mono">
            {estructura === 'neurotico' && 'Represión (S1 ➔ S2)'}
            {estructura === 'psicotico' && 'Forclusión (P0 en cúspide p)'}
            {estructura === 'perverso' && 'Desmentida (Fetiche Pantalla)'}
            {estructura === 'fronterizo' && 'Escisión Yoica (Spaltung / Borderline)'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setEstructura('neurotico')}
            className={`py-1.5 px-2 rounded text-center transition-all ${
              estructura === 'neurotico'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Neurótico
          </button>
          <button
            onClick={() => setEstructura('psicotico')}
            className={`py-1.5 px-2 rounded text-center transition-all ${
              estructura === 'psicotico'
                ? 'bg-rose-950 text-rose-300 border border-rose-700 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Psicótico
          </button>
          <button
            onClick={() => setEstructura('perverso')}
            className={`py-1.5 px-2 rounded text-center transition-all ${
              estructura === 'perverso'
                ? 'bg-purple-950 text-purple-300 border border-purple-700 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Perverso
          </button>
          <button
            onClick={() => setEstructura('fronterizo')}
            className={`py-1.5 px-2 rounded text-center transition-all ${
              estructura === 'fronterizo'
                ? 'bg-amber-950 text-amber-300 border border-amber-700 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Borderline
          </button>
        </div>
      </div>

      {/* Sección: Declaración de Axioma Clínico */}
      <div
        id="seccion-declaracion-axioma-clinico"
        className={`p-2.5 rounded-lg border text-xs font-mono transition-all ${
          estructura === 'psicotico'
            ? 'bg-rose-950/40 border-rose-600/80 text-rose-200 shadow-sm shadow-rose-950/30'
            : estructura === 'neurotico'
            ? 'bg-cyan-950/40 border-cyan-600/80 text-cyan-200 shadow-sm shadow-cyan-950/30'
            : estructura === 'perverso'
            ? 'bg-purple-950/40 border-purple-600/80 text-purple-200'
            : 'bg-amber-950/40 border-amber-600/80 text-amber-200'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
          <span className="flex items-center gap-1.5 text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Declaración de Axioma Clínico</span>
          </span>
          <span
            className={`text-[9.5px] px-2 py-0.5 rounded font-bold uppercase border ${
              estructura === 'psicotico'
                ? 'bg-rose-900/80 text-rose-100 border-rose-500'
                : estructura === 'neurotico'
                ? 'bg-cyan-900/80 text-cyan-100 border-cyan-500'
                : estructura === 'perverso'
                ? 'bg-purple-900/80 text-purple-100 border-purple-500'
                : 'bg-amber-900/80 text-amber-100 border-amber-500'
            }`}
          >
            {estructura === 'psicotico'
              ? 'Rama Forclusión'
              : estructura === 'neurotico'
              ? 'Rama Neurosis'
              : estructura === 'perverso'
              ? 'Rama Perversión'
              : 'Rama Borderline'}
          </span>
        </div>

        <div className="text-[12px] font-bold tracking-tight">
          {estructura === 'psicotico' && (
            <span className="text-rose-300">
              Forclusión: eyección de significantes (S, I) fuera de baremo (IGS → ∞)
            </span>
          )}
          {estructura === 'neurotico' && (
            <span className="text-cyan-300">
              Represión: significante incluido en la superficie del toro
            </span>
          )}
          {estructura === 'perverso' && (
            <span className="text-purple-300">
              Desmentida: fetiche como pantalla contingente, contención sin eyección exterior
            </span>
          )}
          {estructura === 'fronterizo' && (
            <span className="text-amber-300">
              Escisión yoica (Spaltung): alternancia bimodal de cargas sin eyección catastrófica
            </span>
          )}
        </div>
      </div>

      {/* KPI Outputs: IGS_sim, Q_total, Q_max, Desborde */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
          <div className="text-[10px] text-slate-400 font-mono">res["IGS_sim"]</div>
          <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
            {resultado.IGS_sim.toFixed(3)}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Original: {sclData["GSI"].toFixed(2)}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
          <div className="text-[10px] text-slate-400 font-mono">res["Q_total"]</div>
          <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
            {resultado.Q_total.toFixed(2)}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Integral ∫ Q(t) dt
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
          <div className="text-[10px] text-slate-400 font-mono">res["Q_max"]</div>
          <div className="text-lg font-bold text-fuchsia-400 font-mono mt-0.5">
            {resultado.Q_max.toFixed(2)}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Pico pulsional
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
          <div className="text-[10px] text-slate-400 font-mono">Desborde crítico</div>
          <div className={`text-base font-bold font-mono mt-0.5 ${
            resultado.desborde ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {resultado.desborde ? `${resultado.desborde_pct}% tiempo` : 'No (Estable)'}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            A &gt; A_cr ({params.a_critical.toFixed(2)})
          </div>
        </div>
      </div>

      {/* Régimen and Axiom Declaration */}
      <div className={`p-3 rounded-lg border text-xs leading-relaxed space-y-2 ${
        resultado.ruptura_psicotica
          ? 'bg-rose-950/40 border-rose-700/80 text-rose-200'
          : resultado.desborde
          ? 'bg-amber-950/40 border-amber-700/80 text-amber-200'
          : 'bg-cyan-950/30 border-cyan-800/60 text-cyan-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
          <div className="flex items-center gap-1.5 font-semibold font-mono text-[11px]">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Régimen: {resultado.regimen}</span>
          </div>
          {resultado.ruptura_psicotica && (
            <button
              onClick={onTriggerPsychoticBreak}
              className="px-2 py-0.5 bg-rose-900 hover:bg-rose-800 text-rose-100 rounded text-[10px] font-mono border border-rose-600 transition-colors"
            >
              Ver Ruptura 3D
            </button>
          )}
        </div>

        {/* Explicit Axiom Badge */}
        <div className="flex items-center gap-1.5 text-[10.5px] font-mono">
          <span className="text-slate-400 font-sans">Axioma operante:</span>
          <span className={`px-2 py-0.5 rounded font-bold border ${
            estructura === 'psicotico'
              ? 'bg-rose-900/60 text-rose-200 border-rose-500'
              : 'bg-cyan-900/60 text-cyan-200 border-cyan-500'
          }`}>
            {resultado.axioma_operante}
          </span>
        </div>

        <p className="text-[11px] text-slate-300 opacity-90">
          {resultado.interpretacion_clinica}
        </p>

        {/* Empirical Validation Protocol / H2 Hypothesis */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 bg-slate-950/50 p-2 rounded text-[10.5px] space-y-1">
          <div className="font-semibold text-amber-300 font-mono flex items-center justify-between">
            <span>Protocolo Clínico (Hipótesis H2 — Firma Observable Contrastable):</span>
            <span className="text-[9.5px] text-slate-400 font-normal">Falsable vs casos reales</span>
          </div>
          <p className="text-slate-300 leading-snug">
            {resultado.condicion_protocolo_h2}
          </p>
          <p className="text-[9.5px] text-slate-400">
            {estructura === 'psicotico'
              ? 'En estructura psicótica (Axioma 2b), la no-relajación y la persistencia de picos fuera de baremo (IGS ≥ 3.30) constituyen una firma cuantitativa nítida contrastable con los registros evolutivos de pacientes.'
              : estructura === 'neurotico'
              ? 'En estructura neurótica (Axioma 2a), la reactivación no dispersa ni eyecta la cinta; el sistema disipa energía hacia un atractor acotado.'
              : estructura === 'perverso'
              ? 'En estructura perversa, la pantalla fetichista circunscribe la órbita de carga en un ciclo límite estable.'
              : 'En la estructura psíquica borderline, la escisión yoica produce oscilaciones bimodales de desborde intermitente sin convergencia puntual.'}
          </p>
        </div>
      </div>

      {/* Sub Tabs: Gráficas de Tiempo, Plano de Fase, Código Python, Parámetros */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
        <button
          onClick={() => setActiveSubTab('graficas')}
          className={`px-2.5 py-1 rounded transition-colors ${
            activeSubTab === 'graficas'
              ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Series Temporales
        </button>
        <button
          onClick={() => setActiveSubTab('fase')}
          className={`px-2.5 py-1 rounded transition-colors ${
            activeSubTab === 'fase'
              ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Plano de Fase (Q vs A)
        </button>
        <button
          onClick={() => setActiveSubTab('codigo')}
          className={`px-2.5 py-1 rounded transition-colors ${
            activeSubTab === 'codigo'
              ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Python Code
        </button>
        <button
          onClick={() => setActiveSubTab('parametros')}
          className={`px-2.5 py-1 rounded transition-colors ${
            activeSubTab === 'parametros'
              ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Parámetros
        </button>
      </div>

      {/* Tab Contents */}
      {activeSubTab === 'graficas' && (
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-1">
              <span>Carga pulsional Q(t) vs Barrera de censura λ_bar ({resultado.parametros.lambda_bar.toFixed(2)})</span>
            </div>
            {renderSvgTimeSeries(
              resultado.Q_t,
              resultado.parametros.lambda_bar,
              '#38bdf8',
              '#ef4444',
              'Q(t)'
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-rose-400 mb-1">
              <span>Angustia A(t) vs Umbral crítico A_cr ({params.a_critical.toFixed(3)})</span>
            </div>
            {renderSvgTimeSeries(
              resultado.angustia_t,
              params.a_critical,
              '#f43f5e',
              '#f59e0b',
              'A(t)'
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'fase' && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Retrato en el espacio de estados (Q vs Angustia):</span>
            <span className="text-emerald-400">● Inicio</span>
            <span className="text-rose-400">● Final</span>
          </div>
          {renderPhasePlane()}
          <div className="text-[10px] text-slate-400 font-mono">
            Zona sombreada roja: régimen de desborde simultáneo (Q &gt; λ_bar y A &gt; A_cr).
          </div>
        </div>
      )}

      {activeSubTab === 'codigo' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Ejecutable directamente en Python:</span>
            <button
              onClick={handleCopyCode}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-1 transition-colors border border-slate-700"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'Copiado' : 'Copiar snippet'}</span>
            </button>
          </div>
          <pre className="w-full max-h-[220px] overflow-auto bg-slate-950 text-cyan-300 font-mono text-[11px] leading-relaxed p-3 rounded-lg border border-slate-800">
            {pythonSnippet}
          </pre>
        </div>
      )}

      {activeSubTab === 'parametros' && (
        <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
          <div>
            <span className="text-slate-500">Q0 (Carga inicial):</span>{' '}
            <span className="text-cyan-300">{resultado.parametros.Q0.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500">gamma (Disipación):</span>{' '}
            <span className="text-cyan-300">{resultado.parametros.gamma.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500">omega (Frecuencia Drang):</span>{' '}
            <span className="text-cyan-300">{resultado.parametros.omega.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500">K_rep (Barra represión):</span>{' '}
            <span className="text-cyan-300">{resultado.parametros.K_rep.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500">I_trauma (Fantasía):</span>{' '}
            <span className="text-cyan-300">{resultado.parametros.I_trauma.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500">lambda_bar (Censura):</span>{' '}
            <span className="text-cyan-300">{resultado.parametros.lambda_bar.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500">eta (Impedancia cúspide p):</span>{' '}
            <span className="text-cyan-300">{resultado.parametros.eta_orificio.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500">delta (Perturbación toro):</span>{' '}
            <span className="text-cyan-300">{resultado.parametros.delta.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Declaración de Axioma Clínico (Controles de Simulación) */}
      <div className="pt-2 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-mono bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/70">
        <span className="text-slate-400 font-sans font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Axioma Clínico Activo:</span>
        </span>
        <span
          className={`font-semibold ${
            estructura === 'psicotico'
              ? 'text-rose-300'
              : estructura === 'neurotico'
              ? 'text-cyan-300'
              : estructura === 'perverso'
              ? 'text-purple-300'
              : 'text-amber-300'
          }`}
        >
          {estructura === 'psicotico' &&
            'Forclusión: eyección de significantes (S, I) fuera de baremo (IGS → ∞)'}
          {estructura === 'neurotico' &&
            'Represión: significante incluido en la superficie del toro'}
          {estructura === 'perverso' &&
            'Desmentida: fetiche como pantalla contingente, contención sin eyección exterior'}
          {estructura === 'fronterizo' &&
            'Escisión yoica (Spaltung): alternancia bimodal de cargas sin eyección catastrófica'}
        </span>
      </div>

      {/* Bottom Controls: Horizonte Temporal e Impulso */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span>Tiempo T:</span>
          <input
            type="range"
            min="5"
            max="40"
            step="1"
            value={tMax}
            onChange={(e) => setTMax(parseFloat(e.target.value))}
            className="w-16 accent-cyan-400 h-1 cursor-pointer"
          />
          <span className="text-cyan-300 font-bold">{tMax}s</span>
        </div>

        <div className="flex items-center gap-2">
          <span>Impulso Drang:</span>
          <input
            type="range"
            min="0"
            max="3"
            step="0.2"
            value={impulso}
            onChange={(e) => setImpulso(parseFloat(e.target.value))}
            className="w-16 accent-amber-400 h-1 cursor-pointer"
          />
          <span className="text-amber-300 font-bold">+{impulso.toFixed(1)}</span>
        </div>

        {onApplyIgsSim && (
          <button
            onClick={() => onApplyIgsSim(resultado.IGS_sim)}
            className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded text-xs font-mono border border-cyan-800 transition-colors flex items-center gap-1"
            title="Aplicar el IGS simulado a la geometría 3D del Horn Torus"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Acoplar a 3D</span>
          </button>
        )}
      </div>
    </div>
  );
};
