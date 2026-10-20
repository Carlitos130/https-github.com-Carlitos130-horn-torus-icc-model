import { ScrollText, X } from 'lucide-react';

interface estatutoNoticeProps {
  onClose: () => void;
}

/**
 * Aviso de estatuto del artefacto (tesis V52 — Sección 3, y Cierre metodológico):
 * la app NO es un instrumento de medición psicométrica ni un dispositivo de diagnóstico
 * clínico: es el prototipo computacional de un modelo estructural cuya operación es
 * LECTURA (calcula, no mide). Los perfiles SCL-90-R son entrada axiomática (§6.2),
 * no dato contrastado. La BME exige cuatro pasos para cualquier uso empírico.
 */
export const EstatutoNotice = ({ onClose }: estatutoNoticeProps) => {
  return (
    <div className="bg-slate-900 border border-amber-700/60 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between text-xs font-medium text-amber-300 border-b border-slate-800 pb-2">
        <span className="flex items-center gap-1.5">
          <ScrollText className="w-4 h-4 text-amber-400" />
          <span id="estatuto-titulo">ESTATUTO DE ESTE ARTEFACTO</span>
        </span>
        <button
          id="estatuto-cerrar-btn"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 transition-colors"
          title="Cerrar aviso de estatuto"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
        <p>
          Esta aplicación <span className="text-amber-300 font-semibold">no es un instrumento de
          medición psicométrica</span> ni un dispositivo de diagnóstico clínico. Es el{' '}
          <span className="text-cyan-300 font-semibold">prototipo computacional de un modelo
          estructural</span> cuya operación se llama <span className="text-cyan-300 font-semibold">LECTURA</span>.
        </p>

        <div className="space-y-1 text-[11px]">
          <p>
            <span className="text-cyan-400 font-semibold">Qué hace.</span> Calcula invariantes
            topológicos y geométricos (χ, H₁, curvatura gaussiana en puntos críticos) sobre una
            superficie —horn torus— cuya deformación está regulada, por axioma, por el vector
            SCL-90-R. Visualiza la rearticulación del Axioma 2 (V47; soportes en V52) en sus dos configuraciones:
            (a) superposición, con correspondencia de origen S–I; (b) trecho, donde esa correspondencia falta.
            Σ es contingente en ambas (decisión del autor posterior a V52).
          </p>
          <p>
            <span className="text-rose-400 font-semibold">Qué no hace.</span> No mide estructura
            clínica. No infiere diagnóstico. No valida el modelo contra datos. Un Psicoticismo
            alto <span className="font-semibold">no es</span> forclusión; un IGS extremo{' '}
            <span className="font-semibold">no es</span> un diagnóstico. Los perfiles SCL-90-R son{' '}
            <span className="text-amber-300 font-semibold">entrada axiomática</span> (§6.2 de la
            tesis), no dato contrastado.
          </p>
          <p>
            <span className="text-slate-200 font-semibold">Estatuto epistémico.</span> El modelo{' '}
            <span className="text-cyan-300">calcula, no mide</span>;{' '}
            <span className="text-cyan-300">lee, no infiere</span>. La operación se llama LECTURA y
            su paradigma es Joyce: la epifanía como homología, el sinthome como axioma que funciona
            sin garantía. La BME (§6.2) exige cuatro pasos para cualquier uso empírico del
            instrumento; esta app no los satisface ni pretende satisfacerlos.
          </p>
          <p className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800">
            Para uso empírico, remitirse a la tesis: tesis_rsi_poincare V52.docx, §6.2 (BME) y
            §6.3 (Joyce como paradigma de la LECTURA).
          </p>
        </div>
      </div>
    </div>
  );
};
