import React, { useState } from 'react';
import {
  BookOpen,
  Brain,
  Zap,
  Flame,
  Activity,
  Layers,
  Sparkles,
  Sliders,
  Terminal,
  Code,
  Compass,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronRight,
  Target
} from 'lucide-react';

interface TheoreticalManualProps {
  onTriggerPsychoticBreak?: () => void;
  initialSection?: 'theoretical_basis' | 'lacan_torus' | 'psychotic_break' | 'freud_innovations' | 'user_manual' | 'symbology';
}

export const TheoreticalManual: React.FC<TheoreticalManualProps> = ({
  onTriggerPsychoticBreak,
  initialSection = 'theoretical_basis'
}) => {
  const [activeSection, setActiveSection] = useState<
    'theoretical_basis' | 'lacan_torus' | 'psychotic_break' | 'freud_innovations' | 'user_manual' | 'symbology'
  >(initialSection);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="font-bold text-sm text-white tracking-wide">
              Tratado Teórico & Manual Clínico
            </h2>
            <p className="text-[10.5px] text-slate-400">
              Topología del Inconsciente, Metapsicología Freudiana y Estructura Lacaniana · alineado a la tesis V47 (Axioma 2 rearticulado)
            </p>
          </div>
        </div>

        {onTriggerPsychoticBreak && (
          <button
            id="btn-manual-trigger-break"
            onClick={onTriggerPsychoticBreak}
            className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-600/80 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all animate-pulse"
            title="Disparar la secuencia de ruptura del modelo (Corolario II): la cinta sale por la voz y se reconfigura — AXIOMA"
          >
            <Zap className="w-3.5 h-3.5 text-rose-400 fill-current" />
            <span>Ruptura del modelo</span>
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveSection('theoretical_basis')}
          className={`px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeSection === 'theoretical_basis'
              ? 'bg-cyan-950 text-cyan-200 border border-cyan-700 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-cyan-400" />
          <span>1. Base Teórica (Freud)</span>
        </button>

        <button
          onClick={() => setActiveSection('lacan_torus')}
          className={`px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeSection === 'lacan_torus'
              ? 'bg-cyan-950 text-cyan-200 border border-cyan-700 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>2. El Toro en Lacan & Fantasía</span>
        </button>

        <button
          onClick={() => setActiveSection('psychotic_break')}
          className={`px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeSection === 'psychotic_break'
              ? 'bg-rose-950 text-rose-200 border border-rose-700 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>3. Angustia y ruptura del modelo</span>
        </button>

        <button
          onClick={() => setActiveSection('freud_innovations')}
          className={`px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeSection === 'freud_innovations'
              ? 'bg-cyan-950 text-cyan-200 border border-cyan-700 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>4. ¿Qué podemos crear de nuevo?</span>
        </button>

        <button
          onClick={() => setActiveSection('user_manual')}
          className={`px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeSection === 'user_manual'
              ? 'bg-cyan-950 text-cyan-200 border border-cyan-700 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>5. Manual de la Aplicación</span>
        </button>

        <button
          id="btn-manual-tab-symbology"
          onClick={() => setActiveSection('symbology')}
          className={`px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeSection === 'symbology'
              ? 'bg-blue-950 text-blue-200 border border-blue-600 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-blue-400" />
          <span>§ Simbología & Notación Σ</span>
        </button>
      </div>

      {/* Section 1: Base Teórica (Freud) */}
      {activeSection === 'theoretical_basis' && (
        <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed animate-in fade-in duration-150">
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg space-y-2">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              1. La Metapsicología Freudiana y el Horn Torus
            </h3>
            <p>
              El modelo formalizado en este software se fundamenta en la articulación entre la
              <strong> metapsicología freudiana</strong> (específicamente la teoría pulsional de 1915 y
              la segunda tópica de 1920/1923) y la <strong>geometría diferencial de variedades toroidales continuas</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-lg space-y-1.5">
              <h4 className="font-semibold text-amber-300 flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                La Pulsión (Trieb) como Circuito Cerrado Acéfalo
              </h4>
              <p className="text-[11px] text-slate-400">
                En <em>Pulsiones y sus destinos (1915)</em>, Freud define la pulsión mediante cuatro componentes:
                <strong> Drang</strong> (empuje constante), <strong>Quelle</strong> (fuente somática erógena),
                <strong> Ziel</strong> (meta) y <strong>Objekt</strong> (objeto).
                A diferencia del instinto biológico que tiene un objeto prefijado, la pulsión no alcanza jamás un objeto final:
                <strong> gira en torno a él</strong> en un bucle cerrado continuo.
              </p>
              <p className="text-[11px] text-slate-400">
                En el <strong>Horn Torus</strong>, esta trayectoria se modela matemáticamente como una
                <strong> geodésica toroidal cerrada</strong> caracterizada por dos números de enrollamiento $(p, q)$
                alrededor de los dos ciclos homológicos fundamentales: el ciclo poloidal ($v$) y el ciclo toroidal ($u$).
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-lg space-y-1.5">
              <h4 className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                Del Esquema de la Vesícula al Monismo de Superficie del Inconsciente
              </h4>
              <p className="text-[11px] text-slate-400">
                En <em>Más allá del principio del placer (1920)</em>, Freud esbozó el aparato psíquico como una
                vesícula con una corteza externa protectora (<em>Reizschutz</em>). Sin embargo, Jacques Lacan
                demuestra que la metáfora esférica induce un engaño cartesiano (adentro vs. afuera).
              </p>
              <p className="text-[11px] text-slate-400">
                En este modelo <strong>toda la superficie es el Icc</strong> (AXIOMA); la censura es una propiedad de la marca, no un espesor de la pared (X sin espesor — V35), y la cinta S-I-Σ es el <strong>soporte de las series</strong> de Vorstellungsrepräsentanzen (V46): las VR de S se inscriben sobre una banda y las de I sobre otra.
                El Prcc no es un espesor: es el campo de representaciones-palabra que entra por el oído (GW XIII, cap. II),
                y la Cc no es un lugar sino un umbral de sobreinvestidura dentro de ese campo (GW X, secc. VI).
                La geometría (embudo, campo sin borde) es construcción del autor — AXIOMA.
              </p>
            </div>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-800/40 p-3 rounded-lg space-y-1 text-[11.5px]">
            <strong className="text-cyan-300">La Condición Específica del Horn Torus ($R = r = a$):</strong>
            <p className="text-slate-300">
              En un toro ordinario ($R &gt; r$), existe un pasaje cilíndrico abierto.
              En el <strong>Horn Torus</strong>, el radio mayor iguala al radio menor ($R = r$), haciendo que el agujero central
              colapse en un <strong>punto singular de auto-tangencia en el origen $(0,0,0)$</strong> (en $v = \pm\pi$).
              Ese punto p es el <strong>único orificio fijo</strong> y es de doble sentido: por él <strong>entra lo oído</strong>
              —el campo Prcc, concentrado en el embudo que el exterior forma a lo largo del eje— y <strong>sale la voz</strong>.
              El horn torus no es una variedad (χ = 1, género indefinido; tesis §4.7).
            </p>
          </div>
        </div>
      )}

      {/* Section 2: El Toro en Lacan & Fantasía */}
      {activeSection === 'lacan_torus' && (
        <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed animate-in fade-in duration-150">
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg space-y-2">
            <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              2. Lacan y la Topología del Toro: Monismo de Superficie y Extimidad
            </h3>
            <p>
              En el <em>Seminario IX: La identificación</em>, el <em>Seminario X: La angustia</em> y en <em>L'Étourdit</em>,
              Lacan trabaja el toro como superficie. En este modelo, <strong>el interior del horn torus no aloja nada</strong>
              y <strong>toda la superficie es el Icc</strong> (AXIOMA). El horn torus no es una 2-variedad: en el punto de
              autotangencia el entorno son dos discos unidos por el centro (tesis §4.7).
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-lg space-y-1.5">
              <h4 className="font-semibold text-cyan-300">
                A. Los Dos Giros: Demanda y Deseo
              </h4>
              <p className="text-[11px] text-slate-400">
                En el toro, un lazo que da una vuelta meridiana ($v$) representa la <strong>demanda</strong>.
                Para rodear el agujero central (el objeto perdido del deseo), el lazo debe realizar una vuelta longitudinal ($u$).
                Lacan demuestra que para cortar el toro y liberar una superficie conexa equivalente a una banda de Möbius o plano,
                se requiere una trayectoria en <strong>doble vuelta en ocho ($8$)</strong> que entreteje ambos giros.
              </p>
            </div>

            <div className="bg-amber-950/40 border border-amber-600/60 p-3 rounded-lg space-y-2">
              <h4 className="font-bold text-amber-200 flex items-center gap-1.5 text-xs">
                <Target className="w-4 h-4 text-amber-400" />
                B. La Extimidad: La Pulsión Voz (Superyó) como Único "Afuera" y los $V_R$ en toda la Superficie
              </h4>
              <p className="text-[11.5px] text-amber-100 leading-relaxed font-sans">
                <strong>La formulación topológica fundamental:</strong> <em>"No hay adentro ni afuera: es todo superficie del inconsciente. El único afuera que podemos ver desde el toro es la pulsión Voz que entra al toro."</em>
              </p>
              <div className="text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                <p>
                  <strong>1. La voz y lo oído:</strong> el oído es, para Lacan, el único orificio del campo del inconsciente que no puede cerrarse (Seminario XI, 20 de mayo de 1964). En el horn torus ese orificio es p $(v = \pi)$, de doble sentido: por él entra lo oído —las representaciones-palabra que forman el Prcc (GW XIII, cap. II)— y sale la voz. El superyó procede de lo oído, pero su energía viene del ello (GW XIII, cap. V).
                </p>
                <p>
                  <strong>2. Los $V_R$ (Vorstellungsrepräsentanz) sobre los soportes de las dos series (tesis V44/V46):</strong> las VR se inscriben una por una sobre la cara interna de Ding —las de S sobre su banda, las de I sobre la suya (Axioma 1)— y cada inscripción repite el trayecto A→a' del esquema L. <strong>Configuración (Axioma 2 rearticulado, V47):</strong> (a) <em>neurosis</em> — soportes en <strong>superposición</strong> (unión conexa; trayecto A→a' sin trecho; correspondencia de origen): Σ es <strong>contingente</strong>; (b) <em>Border</em> (psicosis no desencadenada) — soportes <strong>disjuntos</strong> (trecho; la correspondencia de origen falta): Σ es <strong>exigida</strong>. Σ no se redefine: cambia el estatuto modal de su operación (contingente / exigida). El botón «Config Axioma 2» de la app desfasa el dibujo de la banda S en (b), sin tocar el cálculo.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-lg space-y-1.5">
              <h4 className="font-semibold text-amber-300">
                C. La fantasía: marcas de trauma sobre la cara interna (tesis V40–V46, Axioma 4)
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                La fantasía (concepto freudiano) se formaliza como <strong>marcas Icc de trauma</strong> sobre la cara interna de la pared, distintas entre sí y de contenido desconocido: se ven sus efectos (Agieren, síntoma), no lo que son. La angustia surge por <strong>proximidad</strong>: cuando un cruce se acerca a una marca (señal) o pasa por ella (situación traumática). AXIOMA.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Una versión anterior de esta app (16–17/9/2026) modelaba la fantasía como un agujero sin representación en el centro del toro. El autor eligió las marcas (24/9/2026); esa versión quedó en el historial del repositorio.
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-lg space-y-1.5">
              <h4 className="font-semibold text-rose-300">
                D. La Angustia en Lacan: "La Angustia no es la Pérdida del Objeto"
              </h4>
              <p className="text-[11px] text-slate-400">
                En el <em>Seminario X</em>, Lacan rompe con la idea tradicional de que la angustia proviene de la pérdida del objeto.
                Lacan define la angustia como <em>«ce qui ne trompe pas»</em>, lo que no engaña (Seminario X, 8 de mayo de 1963), y
                afirma que <em>«l'angoisse n'est pas sans objet»</em> (29 de mayo de 1963).
              </p>
              <p className="text-[11px] text-slate-400">
                En este software, A(u, v) mide la proximidad a la marca de fantasía más cercana: es máxima sobre ella. La vecindad
                crítica es A ≥ A_max − A_cr (A_cr = π/4). Aproximación: situación de peligro, angustia señal; pasaje: situación
                traumática (GW XIV, p. 199). La traducción geométrica es AXIOMA.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Explosión de Angustia & Psicosis */}
      {activeSection === 'psychotic_break' && (
        <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed animate-in fade-in duration-150">
          <div className="bg-rose-950/30 border border-rose-600/50 p-3 rounded-lg space-y-2">
            <h3 className="text-sm font-semibold text-rose-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
              3. Angustia y ruptura del modelo
            </h3>
            <p>
              En Lacan (Seminario III), el desencadenamiento psicótico se piensa desde la <strong>forclusión del Nombre-del-Padre</strong>.
              Este modelo <strong>no infiere estructura clínica</strong> a partir del SCL-90-R: un Psicoticismo alto no es forclusión, y un
              IGS extremo no es un diagnóstico. La «ruptura» de la app es una consecuencia del modelo formal (Corolario II, AXIOMA): se dispara con
              IGS ≥ 3× el corte T=60 de la población y Wegbreite suficiente.
            </p>
            <div className="bg-slate-900/90 border border-slate-700/80 p-2.5 rounded text-[11px] space-y-1.5 font-sans">
              <div className="font-semibold text-rose-300 font-mono">
                Declaración Axiomática de Ramas (Axioma 2 y Corolario II):
              </div>
              <p className="border-l-2 border-cyan-500 pl-2 text-cyan-200">
                <strong>Rama Axioma 2(a) [Neurosis / Represión]:</strong> Soportes de S e I en superposición conexa ($S_1 \to S_2$). La correspondencia de origen no pasa por Σ; el pasaje traumático <em>no dispersa las cadenas ni eyecta la cinta</em> fuera de la superficie tórica. La dinámica relaja asintóticamente a un atractor acotado dentro de baremo clínico.
              </p>
              <p className="border-l-2 border-rose-500 pl-2 text-rose-200">
                <strong>Rama Axioma 2(b) [Psicosis / Forclusión P0]:</strong> Soportes de S e I disjuntos (trecho). Al no operar el significante del Nombre del Padre como punto de basta, la reactivación traumática desata plenamente el <strong>Corolario II (Umbau/Eyección)</strong>: la cinta S-I-Σ y el afecto pulsional son <em>eyectados a través de la singularidad de la voz ($p$, $v = \pm\pi$)</em>.
              </p>
              <p className="border-l-2 border-amber-500 pl-2 text-amber-200 font-medium">
                <strong>Protocolo Empírico (Hipótesis H2):</strong> La eyección proporciona una firma cuantitativa nítida: en estructura psicótica el IGS simulado <em>no relaja a asíntota sino que diverge o mantiene picos fuera de baremo (IGS_sim ≥ 3.30)</em>, lo cual es empíricamente contrastable y falsable frente a las trayectorias longitudinales reales de casos clínicos.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg space-y-1">
              <h4 className="font-semibold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                1. Saturación y Cizalladura en la Cúspide Singular ($v = \pm\pi$)
              </h4>
              <p className="text-[11px] text-slate-400">
                Con Psicoticismo fuera de baremo ($T &gt; 80$, como en el caso clínico A del preset, anonimizado),
                el término de deformación asignado a esa escala (asignación AXIOMA) cizalla la cúspide:
                <code className="text-cyan-300 font-mono text-[10.5px] block bg-slate-900 p-1.5 rounded mt-1">
                  wPsy = Psicoticismo * 0.45 * |sin(v/2)|³ * sin(2u + v)
                </code>
                Es una descripción geométrica de la superficie deformada, no de la estructura del sujeto.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg space-y-1">
              <h4 className="font-semibold text-amber-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                2. Vecindades críticas de las marcas (A ≥ A_max − A_cr)
              </h4>
              <p className="text-[11px] text-slate-400">
                Con el mapa de color <strong>Angustia</strong>, la superficie se tiñe de rojo en la unión de las vecindades de las marcas de
                fantasía; el resumen informa el porcentaje de área. Agregar marcas (control N) amplía esa zona.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg space-y-1">
              <h4 className="font-semibold text-fuchsia-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                3. Ruptura del Marco Fantasmático en la Cara Interna
              </h4>
              <p className="text-[11px] text-slate-400">
                En la vista <strong>Interior (Icc)</strong> o <strong>Rayos X Icc</strong>, durante la secuencia de ruptura la cinta
                sale por la voz y luego se reconfigura cubriendo la cara interna (Einriß / Umbau, Freud 1924, en la lectura de la tesis).
                Es una homología del modelo (AXIOMA): no describe la vivencia clínica del sujeto.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg space-y-1">
              <h4 className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                4. Estabilización sin Colapso Numérico (tanh)
              </h4>
              <p className="text-[11px] text-slate-400">
                A diferencia de modelos gráficos lineales simples que se rompen (vértices con NaN o mallas auto-intersectadas que colapsan),
                nuestro motor implementa una compresión sigmoidal <code className="text-amber-300 font-mono">tanh(raw / 1.45)</code>.
                Esto permite visualizar deformaciones extremas sin perder la continuidad de la superficie: la topología del horn torus
                no cambia con la deformación.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: ¿Qué podemos crear de nuevo? */}
      {activeSection === 'freud_innovations' && (
        <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed animate-in fade-in duration-150">
          <div className="bg-cyan-950/30 border border-cyan-700/50 p-3 rounded-lg space-y-2">
            <h3 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              4. Nuevos Desarrollos: ¿Qué podemos crear a partir de Freud y Lacan?
            </h3>
            <p>
              Partiendo de la metapsicología freudiana de 1895 a 1920 y los nudos lacanianos de 1974 a 1977,
              podemos proyectar innovaciones pioneras en psicoanálisis computacional y topología matemática:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <span className="w-5 h-5 rounded-full bg-amber-950 border border-amber-600 flex items-center justify-center text-[10px] font-mono">1</span>
                <span>Topología de Catástrofes del Síntoma</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Integrar la <strong>Teoría de Catástrofes de René Thom</strong> (cúspide, pliegue, cola de milano)
                sobre la superficie del Horn Torus. Modelar cómo una variación infinitesimal en un factor psicométrico
                (ej. incremento de la hostilidad o sospecha paranoide) produce un salto discontinuo en el estado del sujeto
                (pasaje al acto o desencadenamiento psicótico).
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-600 flex items-center justify-center text-[10px] font-mono">2</span>
                <span>Flujo de Cantidad Qη (Freud 1895 en Variedades)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Formalizar el <em>Proyecto de una psicología para neurólogos (1895)</em> de Freud con ecuaciones diferenciales
                de difusión-reacción sobre el toroide: la cantidad investida ($Q_\eta$) fluyendo a través de barreras de contacto
                ($\psi$), donde las dimensiones del SCL-90-R regulan la conductancia y resistencia psíquica de ligadura (<em>Bindung</em>).
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 text-fuchsia-300 font-semibold">
                <span className="w-5 h-5 rounded-full bg-fuchsia-950 border border-fuchsia-600 flex items-center justify-center text-[10px] font-mono">3</span>
                <span>El Sinthome como Prótesis Topológica (Seminario XXIII)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Lacan propuso que James Joyce evitó el brote psicótico gracias a su escritura como <strong>cuarto nudo (Sinthome)</strong>. En la tesis V47 el sinthome sigue <strong>sin definirse</strong> (la cita del Seminario XXIII queda como material en espera) y Joyce se conserva como <strong>paradigma de la configuración (b)</strong>: la consistencia la sostiene la operación Σ exigida en acto —por la modalidad de la operación, no por un borromeo—. La formalización como lazo de corrección sobre la singularidad del Horn Torus queda como material secundario en espera (L = S∪I∪Σ, PENDIENTE).
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-600 flex items-center justify-center text-[10px] font-mono">4</span>
                <span>Espacio de Fases de la Pulsión de Muerte</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Graficar el atractor caótico entre <em>Eros</em> (la persistencia del ciclo cerrado de vida que mantiene el volumen del toro)
                y <em>Thanatos</em> (la tendencia termodinámica al colapso hacia el punto singular cero $(0,0,0)$ de entropía mínima y disolución de tensiones).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 5: Manual de la Aplicación */}
      {activeSection === 'user_manual' && (
        <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed animate-in fade-in duration-150">
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg space-y-2">
            <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              5. Manual de Uso Completo del Programa
            </h3>
            <p>
              Guía práctica para la manipulación interactiva de las herramientas, visores y controles del modelo:
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-lg space-y-2">
              <h4 className="font-semibold text-cyan-300 flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                A. Navegación en el Visor 3D (WebGL / Three.js)
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-400">
                <li><strong>Rotación / Órbita:</strong> Arrastre con el botón izquierdo del mouse o un dedo en pantallas táctiles.</li>
                <li><strong>Paneo / Traslación:</strong> Arrastre con el botón derecho o dos dedos en paralelo.</li>
                <li><strong>Zoom:</strong> Rueda del mouse o gesto de pellizco.</li>
                <li><strong>Presets de Cámara:</strong> Utilice los botones superiores `Frente (X-Z)`, `Corte (X-Y)` o `Superior (X-Y)` para reorientar la perspectiva instantáneamente.</li>
              </ul>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-lg space-y-2">
              <h4 className="font-semibold text-amber-300 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                B. Modos de Visualización del Manifold
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-400">
                <li><strong>Estándar:</strong> Geometría pura del Horn Torus (δ = 0, R = r = a) sin perturbación psicométrica.</li>
                <li><strong>Deformado:</strong> Aplicación de la perturbación armónica 1.0 + δ · deform basada en el vector SCL-90-R.</li>
                <li><strong>Vórtice Central (Icc):</strong> La cámara se orienta hacia el orificio singular central donde penetra la pulsión Voz, revelando las cintas S, I y Σ —soportes de las series de VR (V46)—, las marcas de fantasía y el hilo pulsional pegado al borde de I.</li>
                <li><strong>Rayos X Icc:</strong> Aplica transparencia selectiva al toro para observar la red de significantes y el flujo de los VR a través de toda la superficie continua.</li>
                <li><strong>Dual:</strong> Renderiza ambos estados morfológicos en ventanas contiguas para comparación directa.</li>
              </ul>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-lg space-y-2">
              <h4 className="font-semibold text-rose-300 flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                C. Mapas de Color y Umbral Crítico A_cr
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-400">
                <li><strong>Angustia (A(u,v)):</strong> Muestra el gradiente de angustia. Ajuste el control <code>A_cr</code> contiguo para modificar el umbral crítico en tiempo real (por defecto π/4 ≈ 0.785 rad).</li>
                <li><strong>Tensión Diferencial:</strong> Refleja el estrés mecánico acumulado por la distorsión sintomática.</li>
                <li><strong>Desplazamiento Normal:</strong> Señala hacia dónde se infla o deprime la superficie.</li>
                <li><strong>Profundidad Z:</strong> Gradiente espectral de cota altimétrica.</li>
              </ul>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-lg space-y-2">
              <h4 className="font-semibold text-emerald-300 flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                D. Pestañas Laterales: Parámetros, Resumen y Exportación
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-400">
                <li><strong>Pestaña SCL-90-R:</strong> Cargue puntajes directos (con validación de consistencia IGS = PST·PSDI/90) o puntajes T del protocolo (se convierten a PD con el baremo de la población elegida). La tabla del baremo muestra los datos normativos (Casullo – Pérez).</li>
                <li><strong>Config Axioma 2 (V47, solo visual):</strong> botón junto a «Cintas 3D»: alterna (a) <em>superposición</em> —soportes de las bandas S e I unidos (unión conexa, Σ contingente)— y (b) <em>trecho</em> —la banda S se desfasa y queda separada de I (soportes disjuntos, Σ exigida). No altera el cálculo.</li>
                <li><strong>Animación de Deformación:</strong> Presione el botón de destello o <em>Animar Transición (0 ➔ δ)</em> para ver la metamorfosis continua del toro a 60 FPS.</li>
                <li><strong>Pestaña Resumen:</strong> Métricas de energía de Willmore, área superficial, tensión diferencial e informe psicométrico formal.</li>
                <li><strong>Pestaña Python:</strong> Código autocontenido listo para ejecutar localmente con `matplotlib` y `numpy`.</li>
                <li><strong>Captura PNG:</strong> Guarde instantáneas en alta resolución (`mi_modelo.png` y `mi_modelo_deformado.png`) directamente al disco.</li>
              </ul>
            </div>

            <div className="bg-slate-950/50 border border-cyan-800/60 p-3 rounded-lg space-y-2">
              <h4 className="font-semibold text-cyan-300 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                E. Simulación Dinámica Temporal (icc_dinamica.py y Pestaña Dinámica Icc)
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-400">
                <li>
                  <strong>Módulo Autónomo Python:</strong> Ejecute directamente con:
                  <code className="text-cyan-300 block bg-slate-900 p-1.5 rounded my-1 font-mono text-[10.5px]">
                    from icc_dinamica import correr_caso, scl90r_a_parametros<br />
                    res = correr_caso(tu_scl90r_data, estructura="neurotico") # -&gt; res["IGS_sim"], res["Q_total"]
                  </code>
                </li>
                <li><strong>Estructura Psíquica y Declaración Axiomática:</strong> El selector de <em>Estructura Psíquica</em> formaliza el estatuto metapsicológico de las cuatro organizaciones: <code>"neurotico"</code> (Axioma 2a: superposición conexa, represión primaria S1 ➔ S2, sin dispersión ni eyección), <code>"psicotico"</code> (Axioma 2b: trecho disjunto, forclusión P0 con eyección por la cúspide p y Corolario II operante), <code>"perverso"</code> (Axioma 2a modificado: desmentida / pantalla fetichista sin eyección) y <code>"borderline"</code> (estatuto formal de estructura psíquica borderline: escisión yoica Spaltung bimodal).</li>
                <li><strong>Protocolo de Contrastación Empírica (H2):</strong> En estructura psicótica (b), el IGS simulado no relaja a una asíntota regular sino que diverge o sostiene picos fuera de baremo (IGS_sim ≥ 3.30, eyección por la voz v = ±π). Esta firma observable cuantitativa es directamente contrastable con trayectorias longitudinales empíricas de casos reales. En estructura neurótica (a), el sistema relaja asintóticamente a ciclo límite o atractor acotado sin eyección.</li>
                <li><strong>Variables de Estado:</strong> Integra la carga pulsional Q(t), la proximidad a marcas de fantasía A(t), la barrera de censura λ_bar y la reactivación del trauma.</li>
                <li><strong>Plano de Fase (Q vs A):</strong> Grafica en tiempo real los ciclos límite, atractores metaestables y zonas de desborde crítico (A &gt; A_cr).</li>
                <li><strong>Acoplar a 3D:</strong> El botón <em>Acoplar a 3D</em> permite retroalimentar el IGS simulado (IGS_sim) directamente al radio y deformación del Horn Torus.</li>
              </ul>
            </div>

            {/* Subsection F: § Simbología y Notación Σ */}
            <div className="bg-slate-950/50 border border-blue-800/60 p-3 rounded-lg space-y-2">
              <h4 className="font-semibold text-blue-300 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                F. § Simbología: Notación Σ y Contrato de Refutación
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <strong>Notación Σ.</strong> En este modelo Σ designa la banda sintomática: el anudamiento de S (significante) e I (imagen del cuerpo) que opera como pantalla e intercepta la zona de angustia (unión de vecindades A_cr de las marcas de fantasía). Σ no es el Sinthome lacaniano del marco RSI-borromeo: ese concepto, y el enlace borromeo completo, quedan excluidos globalmente del proyecto [A] — el marco RSI no se unifica con el tronco freudiano («Poincaré no admite borromeo»). La coincidencia de símbolo es un artefacto de notación, no una readmisión encubierta [P].
              </p>
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-[10.5px] space-y-1 font-mono">
                <div className="text-amber-300 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pregunta abierta registrada (Cap. 7):</span>
                </div>
                <p className="text-slate-300 font-sans">
                  ¿Σ aleja los cruces de las marcas de fantasía o solo anuda a S e I?
                </p>
                <div className="p-1.5 rounded bg-blue-950/60 border border-blue-700/60 text-blue-200">
                  <strong>Contrato:</strong> se refuta si en simulación la banda sintomática no modifica la distancia de los cruces a las marcas en ningún régimen de parámetros (entonces «pantalla» se rebaja a metáfora visual).
                </div>
                <p className="text-slate-400 text-[9.5px] font-sans italic pt-0.5">
                  Nota: en la pregunta abierta le agregué el contrato de refutación «se refuta si…», siguiendo tu disciplina — es la forma en que esa pregunta del Cap. 7 deja de ser decorativa y se vuelve testeable en tu propio banco. La distancia cruces↔marcas queda como métrica a registrar en las corridas del banco 4a junto con los saltos.
                </p>
              </div>
            </div>

            {/* Invariantes del Pie de Página Activo */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-cyan-300 border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Invariantes del Pie de Página Activo & Estado del Manifold</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  En tiempo real
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                La franja inferior permanente de la ventana renderiza continuamente los parámetros topológicos cardinales de la variedad y la clínica:
              </p>
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] space-y-2 text-slate-300">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 font-bold">Horn Torus Icc:</span>
                  <span className="text-cyan-400 font-semibold">R = r = a = a_scale · GSI</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-rose-400 font-semibold">Fantasía: (π, 3π/4) · cara interna</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-amber-400 font-semibold">A_cr = π/4</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[10.5px] border-t border-slate-800/80 pt-1.5 text-slate-300">
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400">Ruptura:</span>
                    <span className="text-rose-400 font-bold">1.7%</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400">ΔE Tensión:</span>
                    <span className="text-fuchsia-400 font-bold">43.3%</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400">Willmore W:</span>
                    <span className="text-amber-400 font-bold">∞</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400">Índice ICC (AXIOMA):</span>
                    <span className="text-cyan-400 font-bold">...%</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 6: § Simbología & Notación Formal */}
      {activeSection === 'symbology' && (
        <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed animate-in fade-in duration-150">
          <div className="bg-blue-950/40 border border-blue-600/60 p-3 rounded-lg space-y-2">
            <h3 className="text-sm font-semibold text-blue-200 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span>§ Simbología, Notación Formal y Preguntas Abiertas</span>
            </h3>
            <p className="text-[11.5px] text-slate-300">
              Definiciones axiomáticas, convenciones de símbolos y contratos de refutación empírica en el marco del proyecto.
            </p>
          </div>

          {/* Primary Card: Notación Σ */}
          <div className="bg-slate-950/70 border border-blue-800/80 p-3.5 rounded-lg space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs border-b border-blue-900/60 pb-2">
              <span className="font-bold text-blue-300 font-mono text-sm flex items-center gap-2">
                <span>Notación Σ (Banda Sintomática)</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900 text-blue-100 border border-blue-500 font-mono">
                  [A] Axioma / Exclusión
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600 font-mono">
                  [P] Precaución Epistémica
                </span>
              </div>
            </div>

            <p className="text-[11.5px] text-slate-200 leading-relaxed font-sans">
              <strong>Notación Σ.</strong> En este modelo Σ designa la banda sintomática: el anudamiento de S (significante) e I (imagen del cuerpo) que opera como pantalla e intercepta la zona de angustia (unión de vecindades A_cr de las marcas de fantasía). Σ no es el Sinthome lacaniano del marco RSI-borromeo: ese concepto, y el enlace borromeo completo, quedan excluidos globalmente del proyecto [A] — el marco RSI no se unifica con el tronco freudiano («Poincaré no admite borromeo»). La coincidencia de símbolo es un artefacto de notación, no una readmisión encubierta [P].
            </p>

            <div className="bg-amber-950/30 border border-amber-700/60 p-2.5 rounded-lg text-[11px] space-y-1.5 font-mono">
              <div className="text-amber-300 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Pregunta abierta registrada (Cap. 7):</span>
              </div>
              <p className="text-slate-300 font-sans">
                ¿Σ aleja los cruces de las marcas de fantasía o solo anuda a S e I?
              </p>
              <div className="bg-slate-950/80 p-2 rounded border border-amber-800/60 text-slate-200 text-[10.5px]">
                <strong className="text-amber-300">Contrato:</strong> se refuta si en simulación la banda sintomática no modifica la distancia de los cruces a las marcas en ningún régimen de parámetros (entonces «pantalla» se rebaja a metáfora visual).
              </div>
              <p className="text-[10px] text-slate-400 font-sans italic pt-0.5">
                Nota: en la pregunta abierta le agregué el contrato de refutación «se refuta si…», siguiendo tu disciplina — es la forma en que esa pregunta del Cap. 7 deja de ser decorativa y se vuelve testeable en tu propio banco. Si la pegás, la distancia cruces↔marcas queda como métrica a registrar en las corridas del banco 4a junto con los saltos.
              </p>
            </div>
          </div>

          {/* Glosario de Símbolos Cardinales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-red-500" />
                <span className="font-mono font-bold text-red-400 text-xs">S (Significante)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Serie de Vorstellungsrepräsentanzen ligadas simbólicamente. En configuración (a) conexa a I; en (b) separada por un trecho exigiendo Σ.
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                <span className="font-mono font-bold text-emerald-400 text-xs">I (Imagen del Cuerpo)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Soporte de la serie imaginaria de Vorstellungsrepräsentanzen. Lleva adherido a su borde el flujo del Hilo Pulsional (Trieb).
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-400" />
                <span className="font-mono font-bold text-amber-300 text-xs">Pulsión (Trieb · Drang)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hilo pulsional vectorial íntimamente pegado al borde de I; empuje constante que no cesa de escribirse en el circuito toroidal continuo.
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-purple-500" />
                <span className="font-mono font-bold text-purple-400 text-xs">p (v = ±π, Orificio Singular)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Cúspide de autotangencia del horn torus. Único orificio fijo: por él entra lo oído (campo Prcc) y sale la voz (pulsión).
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                <span className="font-mono font-bold text-rose-400 text-xs">Marcas de Fantasía (u, v)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Marcas Icc de trauma sobre la cara interna. La angustia A(u,v) surge por proximidad angular a ellas (Axioma 4).
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-cyan-400" />
                <span className="font-mono font-bold text-cyan-300 text-xs">A_cr (Umbral Crítico)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Radio de la vecindad crítica de angustia (por defecto π/4 ≈ 0.785 rad). Define la zona roja de riesgo de desborde y reactivación.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
