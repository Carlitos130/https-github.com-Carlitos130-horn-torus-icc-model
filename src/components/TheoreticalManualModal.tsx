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
}

export const TheoreticalManual: React.FC<TheoreticalManualProps> = ({
  onTriggerPsychoticBreak,
}) => {
  const [activeSection, setActiveSection] = useState<
    'theoretical_basis' | 'lacan_torus' | 'psychotic_break' | 'freud_innovations' | 'user_manual'
  >('theoretical_basis');

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
              Topología del Inconsciente, Metapsicología Freudiana y Estructura Lacaniana
            </p>
          </div>
        </div>

        {onTriggerPsychoticBreak && (
          <button
            id="btn-manual-trigger-break"
            onClick={onTriggerPsychoticBreak}
            className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-600/80 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all animate-pulse"
            title="Cargar parámetros de crisis aguda y observar el desgarro topológico"
          >
            <Zap className="w-3.5 h-3.5 text-rose-400 fill-current" />
            <span>Simular Brote Psicótico</span>
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
          <span>3. Explosión de Angustia & Psicosis</span>
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
                En la topología toroidal, <strong>toda la superficie es la trama continua del Inconsciente (Icc)</strong>:
                no existe un adentro sustancial ni un afuera espacial. La supuesta "conciencia" es apenas una perspectiva
                especular proyectada sobre esa misma superficie bidimensional sin espesor.
              </p>
            </div>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-800/40 p-3 rounded-lg space-y-1 text-[11.5px]">
            <strong className="text-cyan-300">La Condición Específica del Horn Torus ($R = r = a$):</strong>
            <p className="text-slate-300">
              En un toro ordinario ($R &gt; r$), existe un pasaje cilíndrico abierto.
              En el <strong>Horn Torus</strong>, el radio mayor iguala al radio menor ($R = r$), haciendo que el agujero central
              colapse en un <strong>punto singular de auto-tangencia en el origen $(0,0,0)$</strong> (en $v = \pm\pi$).
              Este orificio central no es un interior cerrado, sino el <strong>embudo de intrusión éxtima</strong> por donde
              irrumpe la pulsión primordial (la Voz y el Superyó) que horada la superficie del Inconsciente.
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
              Lacan derriba definitivamente la psicología de las profundidades: <strong>no hay nada en el interior del toro</strong>.
              El toro es una 2-variedad compacta sin volumen interior: <strong>toda la superficie es el tejido del Inconsciente</strong>.
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
                  <strong>1. La Voz y el Superyó como Intrusión Éxtima:</strong> La Voz es el objeto pulsional ($a$) más desprendido e invasivo; encarna el imperativo mudo del Superyó (<em>"¡Goza!"</em>). En el Horn Torus, la Voz no pertenece a un espacio exterior habitable: es una <strong>intrusión éxtima que horada el cuello central $(v = \pi)$</strong>.
                </p>
                <p>
                  <strong>2. Los $V_R$ (Vorstellungsrepräsentanz) en toda la Superficie:</strong> A partir de ese orificio central de contacto con el Ello/Superyó, los representantes de la representación de la pulsión ($V_R$) <strong>se desplazan, circulan y se anudan sobre la totalidad de la superficie toroidal</strong>. No están confinados a un rincón interno: circulan continuamente sobre la superficie del Inconsciente bordeando el agujero central sin jamás colmarlo.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-lg space-y-1.5">
              <h4 className="font-semibold text-amber-300">
                C. La Fantasía Fundamental $(\$ \diamond a)$ como Agujero sin Representación ($1 / S_2$)
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                La fórmula $(\$ \diamond a)$ establece que la fantasía es un <strong>agujero en el toro donde no existe una representación significante</strong>. Mientras que el significante ordinario funciona en binario $S_1 \to S_2$, en el punto de fantasía ese acoplamiento <strong>falla estructuralmente</strong>.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Las cadenas de significantes $S$ y las imágenes de la especularidad $I$ bordean y enmarcan ese vacío sin poder penetrar la Cosa (<em>Das Ding</em>). La fantasía es la pantalla/marco protector que contiene la angustia.
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-lg space-y-1.5">
              <h4 className="font-semibold text-rose-300">
                D. La Angustia en Lacan: "La Angustia no es la Pérdida del Objeto"
              </h4>
              <p className="text-[11px] text-slate-400">
                En el <em>Seminario X</em>, Lacan rompe con la idea tradicional de que la angustia proviene de la pérdida del objeto.
                Lacan formula: <em>"La angustia no es la duda, es la certeza... La angustia surge ante la falta de la falta"</em>.
              </p>
              <p className="text-[11px] text-slate-400">
                Cuando el objeto $a$ se aproxima excesivamente al sujeto, desbordando el marco de la fantasía en la cara interna,
                la distancia protectora se extingue. El campo escalar de angustia $A(u, v)$ en este software modela precisamente
                esta métrica angular: cuando A(u, v) ≤ A_cr = π/4, la zona entra en fase crítica de asfixia simbólica.
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
              3. ¿Cómo Reconocer en el Toro la Explosión Psicótica de la Angustia?
            </h3>
            <p>
              En la clínica psicoanalítica lacaniana de las psicosis (Seminario III), el desencadenamiento
              o <em>brote psicótico</em> ocurre por la <strong>forclusión del Nombre-del-Padre</strong> (<em>Verwerfung</em>).
              Al ser convocado el significante paterno en lo Real sin que haya inscripción simbólica, se produce
              una catástrofe en el aparato: el lazo se desanuda y la angustia irrumpe como desborde pulsional masivo.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg space-y-1">
              <h4 className="font-semibold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                1. Saturación y Cizalladura en la Cúspide Singular ($v = \pm\pi$)
              </h4>
              <p className="text-[11px] text-slate-400">
                En la neurosis, la represión ($Udr$) amortigua el impacto pulsional.
                En el brote psicótico, el <strong>Psicoticismo</strong> se dispara ($T &gt; 80$, $T=100$, como en el caso <em>Matías Gabriel Ross</em>).
                Matemáticamente, el término de deformación psicótica cizalla la cúspide singular:
                <code className="text-cyan-300 font-mono text-[10.5px] block bg-slate-900 p-1.5 rounded mt-1">
                  wPsy = Psicoticismo * 0.35 * sin(u + v)
                </code>
                En el polo central de contacto ($0,0,0$), el toroide sufre una torsión asimétrica no compensada.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg space-y-1">
              <h4 className="font-semibold text-amber-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                2. Inundación Carmesí del Campo de Angustia (A ≤ A_cr)
              </h4>
              <p className="text-[11px] text-slate-400">
                Al seleccionar el mapa de color <strong>Angustia</strong> (`#btn-colormap-angustia`), la superficie se tiñe de
                <strong> rojo brillante / fucsia</strong> en todos los sectores donde la angustia excede el umbral crítico (A ≤ A_cr).
                Durante el brote, el área crítica supera el <strong>65-80%</strong> de la superficie total, invadiendo el orificio
                interior y devorando el punto dorado de la fantasía.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg space-y-1">
              <h4 className="font-semibold text-fuchsia-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                3. Ruptura del Marco Fantasmático en la Cara Interna
              </h4>
              <p className="text-[11px] text-slate-400">
                En la vista <strong>Interior (Icc)</strong> o <strong>Rayos X Icc</strong>, observe cómo las cintas entrecruzadas
                que unen la pulsión al significante se desvían de sus trayectorias armónicas.
                El punto de anclaje $(\$ \diamond a)$ queda sumergido en el vórtice singular central: el sujeto experimenta
                la vivencia del fin del mundo, alucinaciones auditivas invasivas y fragmentación del cuerpo (<em>corps morcelé</em>).
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
                Esto permite visualizar el <strong>máximo desgarro y torsión morfológica</strong> sin perder la continuidad matemática
                de la superficie, ilustrando cómo el sujeto psicótico sigue existiendo como estructura topológica.
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
                Lacan propuso que James Joyce evitó el brote psicótico gracias a su escritura como <strong>cuarto nudo (Sinthome)</strong>.
                Podemos modelar matemáticamente un <strong>lazo de corrección homotópica</strong> sobre la singularidad del Horn Torus,
                demostrando cómo creaciones sublimatorias o suplencias estabilizan el aparato sin necesidad de la metáfora paterna tradicional.
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
                <li><strong>Vórtice Central (Icc):</strong> La cámara se orienta hacia el orificio singular central donde penetra la pulsión Voz, revelando el despliegue continuo de los VR en la superficie, el punto de fantasía y las cintas simbólicas e imaginarias.</li>
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
                <li><strong>Pestaña SCL-90-R:</strong> Modifique los puntajes en formato Puntajes T (Baremo Casullo 2008) o valores normalizados. Active la tabla de baremo completa para consultar datos normativos de la UBA.</li>
                <li><strong>Animación de Deformación:</strong> Presione el botón de destello o <em>Animar Transición (0 ➔ δ)</em> para ver la metamorfosis continua del toro a 60 FPS.</li>
                <li><strong>Pestaña Resumen:</strong> Métricas de energía de Willmore, área superficial, tensión diferencial e informe psicométrico formal.</li>
                <li><strong>Pestaña Python:</strong> Código autocontenido listo para ejecutar localmente con `matplotlib` y `numpy`.</li>
                <li><strong>Captura PNG:</strong> Guarde instantáneas en alta resolución (`mi_modelo.png` y `mi_modelo_deformado.png`) directamente al disco.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
