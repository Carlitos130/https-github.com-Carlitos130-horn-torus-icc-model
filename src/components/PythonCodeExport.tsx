import React, { useState } from 'react';
import { SCL90RData, ModelParams } from '../types';
import { generatePythonScript, generateInteractiveHTMLScript } from '../utils/hornTorusMath';
import { Code, Download, Copy, Check, FileCode, Globe } from 'lucide-react';

interface PythonCodeExportProps {
  sclData: SCL90RData;
  params: ModelParams;
}

export const PythonCodeExport: React.FC<PythonCodeExportProps> = ({
  sclData,
  params,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedReqs, setCopiedReqs] = useState(false);
  const [activeTab, setActiveTab] = useState<'python' | 'html' | 'requirements'>('python');

  const pythonScript = generatePythonScript(sclData, params);
  const htmlScript = generateInteractiveHTMLScript(sclData, params);
  const requirementsText = `numpy>=1.21.0\nmatplotlib>=3.5.0\nscipy>=1.7.0\n`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlScript);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleCopyReqs = () => {
    navigator.clipboard.writeText(requirementsText);
    setCopiedReqs(true);
    setTimeout(() => setCopiedReqs(false), 2000);
  };

  const handleDownloadPython = () => {
    const blob = new Blob([pythonScript], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'horn_torus_icc_model.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([htmlScript], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'horn_torus_icc_interactivo.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadReqs = () => {
    const blob = new Blob([requirementsText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'requirements.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3.5 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-sm text-white">
            Exportación de Scripts (Python, HTML Interactivo 3D)
          </h3>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            id="tab-python-code"
            onClick={() => setActiveTab('python')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              activeTab === 'python'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3 h-3 text-cyan-400" />
            horn_torus_icc_model.py
          </button>
          <button
            id="tab-html-code"
            onClick={() => setActiveTab('html')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              activeTab === 'html'
                ? 'bg-amber-950 text-amber-300 border border-amber-800 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3 h-3 text-amber-400" />
            horn_torus_icc_interactivo.html
          </button>
          <button
            id="tab-requirements-txt"
            onClick={() => setActiveTab('requirements')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'requirements'
                ? 'bg-slate-800 text-slate-200 border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            requirements.txt
          </button>
        </div>
      </div>

      {activeTab === 'python' ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Ejecutable directamente con: <code className="text-cyan-300">python horn_torus_icc_model.py</code></span>
            <div className="flex items-center gap-1.5">
              <button
                id="btn-copy-python-code"
                onClick={handleCopyCode}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-1 transition-colors border border-slate-700"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
              </button>
              <button
                id="btn-download-python-code"
                onClick={handleDownloadPython}
                className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded text-xs font-mono flex items-center gap-1.5 transition-colors border border-cyan-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar .py</span>
              </button>
            </div>
          </div>

          <pre
            id="code-python-view"
            className="w-full max-h-[360px] overflow-auto bg-slate-950 text-slate-300 font-mono text-[11px] leading-relaxed p-3 rounded-lg border border-slate-800"
          >
            {pythonScript}
          </pre>
        </div>
      ) : activeTab === 'html' ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Abrir directamente en navegador: <code className="text-amber-300">horn_torus_icc_interactivo.html</code></span>
            <div className="flex items-center gap-1.5">
              <a
                id="btn-open-html-tab"
                href="/horn_torus_icc_interactivo.html"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
                title="Abrir visor interactivo Three.js en pestaña independiente"
              >
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Abrir en Pestaña</span>
              </a>
              <button
                id="btn-copy-html-code"
                onClick={handleCopyHtml}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-1 transition-colors border border-slate-700"
              >
                {copiedHtml ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHtml ? 'Copiado' : 'Copiar HTML'}</span>
              </button>
              <button
                id="btn-download-html-code"
                onClick={handleDownloadHtml}
                className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 rounded text-xs font-mono flex items-center gap-1.5 transition-colors border border-amber-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar .html Interactivo</span>
              </button>
            </div>
          </div>

          <pre
            id="code-html-view"
            className="w-full max-h-[360px] overflow-auto bg-slate-950 text-amber-100/90 font-mono text-[11px] leading-relaxed p-3 rounded-lg border border-slate-800"
          >
            {htmlScript}
          </pre>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Instalar con: <code className="text-cyan-300">pip install -r requirements.txt</code></span>
            <div className="flex items-center gap-1.5">
              <button
                id="btn-copy-reqs"
                onClick={handleCopyReqs}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono flex items-center gap-1 transition-colors border border-slate-700"
              >
                {copiedReqs ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedReqs ? 'Copiado' : 'Copiar'}</span>
              </button>
              <button
                id="btn-download-reqs"
                onClick={handleDownloadReqs}
                className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded text-xs font-mono flex items-center gap-1.5 transition-colors border border-cyan-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar requirements.txt</span>
              </button>
            </div>
          </div>

          <pre
            id="code-requirements-view"
            className="w-full max-h-[160px] overflow-auto bg-slate-950 text-cyan-300 font-mono text-xs leading-relaxed p-3.5 rounded-lg border border-slate-800"
          >
            {requirementsText}
          </pre>
        </div>
      )}
    </div>
  );
};

