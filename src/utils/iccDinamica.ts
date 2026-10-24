import { SCL90RData } from '../types';

export type EstructuraPsiquica = 'neurotico' | 'psicotico' | 'perverso' | 'fronterizo' | 'borderline';
export type EstructuraClinica = EstructuraPsiquica;

export interface IccParametrosDinamicos {
  estructura: EstructuraPsiquica;
  /** Carga pulsional inicial Q(0) */
  Q0: number;
  /** Constante de disipación / ligadura somática gamma */
  gamma: number;
  /** Frecuencia de retorno de lo reprimido / Drang oscilatorio omega */
  omega: number;
  /** Eficacia de la barra significante / represión K_rep */
  K_rep: number;
  /** Factor de reactivación traumática en marcas de fantasía I_trauma */
  I_trauma: number;
  /** Impedancia del orificio singular p (cúspide v=pi) */
  eta_orificio: number;
  /** Capacidad de contención de la barrera de censura lambda_bar */
  lambda_bar: number;
  /** Deformación acoplada al toro Horn delta */
  delta: number;
  /** Carga basal pulsional constante c0 */
  c0: number;
  /** Datos psicométricos de origen */
  sclData: SCL90RData;
}

export interface SimulationOptions {
  t_max?: number; // default 20.0
  dt?: number; // default 0.05
  drang_impulso?: number; // impulso puntual opcional
  a_critical?: number; // default Math.PI / 4 = 0.785
}

export interface ResultadoSimulacionIcc {
  /** IGS simulado tras la evolución dinámica (res["IGS_sim"]) */
  IGS_sim: number;
  /** Carga energética total acumulada integral Q(t) dt (res["Q_total"]) */
  Q_total: number;
  /** Pico máximo de carga pulsional */
  Q_max: number;
  /** Carga al final del intervalo de simulación */
  Q_final: number;
  /** Booleano: ¿se desbordó la barrera o el umbral crítico de angustia? */
  desborde: boolean;
  /** Porcentaje de tiempo de simulación pasado en desborde */
  desborde_pct: number;
  /** Desencadenamiento o ruptura psicótica fuera de contención */
  ruptura_psicotica: boolean;
  /** Vector de instantes de tiempo t */
  tiempo: number[];
  /** Vector de carga pulsional Q(t) */
  Q_t: number[];
  /** Vector de nivel de angustia A(t) */
  angustia_t: number[];
  /** Vector de tensión de síntoma */
  sintoma_t: number[];
  /** Actividad del mecanismo de defensa (represión / forclusión / desmentida / escisión) */
  defensa_t: number[];
  /** Trayectoria en coordenadas toroidales (u(t), v(t)) */
  trayectoria_uv: { u: number; v: number }[];
  /** Régimen de atractor dinámico */
  regimen: string;
  /** Declaración axiomática explícita (Axioma 2(a) vs Axioma 2(b)) */
  axioma_operante: string;
  /** Condición empírica contrastable del protocolo clínico (Hipótesis H2) */
  condicion_protocolo_h2: string;
  /** Descripción e interpretación clínica lacaniana */
  interpretacion_clinica: string;
  /** Parámetros dinámicos calculados */
  parametros: IccParametrosDinamicos;
  /** Estructura psíquica evaluada */
  estructura: EstructuraPsiquica;
}

/**
 * scl90r_a_parametros(scl90r_data, estructura="neurotico")
 *
 * Mapea el vector psicométrico de 9 dimensiones + índices globales del SCL-90-R
 * a los coeficientes del sistema dinámico no lineal del Inconsciente (Horn Torus).
 */
export function scl90r_a_parametros(
  scl90r_data: SCL90RData | Record<string, number>,
  estructura: EstructuraPsiquica = 'neurotico'
): IccParametrosDinamicos {
  const getVal = (key: string, def: number): number => {
    const v = (scl90r_data as Record<string, number>)[key];
    return typeof v === 'number' && !isNaN(v) ? v : def;
  };

  const som = getVal('Somatización', 0.8);
  const oc = getVal('Obsesión-Compulsión', 0.9);
  const si = getVal('Sensibilidad Interpersonal', 0.7);
  const dep = getVal('Depresión', 0.85);
  const ans = getVal('Ansiedad', 0.95);
  const hos = getVal('Hostilidad', 0.6);
  const fob = getVal('Ansiedad Fóbica', 0.75);
  const par = getVal('Ideación Paranoide', 0.8);
  const psy = getVal('Psicoticismo', 0.9);
  const gsi = getVal('GSI', 0.85);
  const pst = getVal('PST', 45);
  const psdi = getVal('PSDI', 1.70);

  // Carga pulsional inicial Q0: proporcional al GSI escalado por el malestar (PSDI)
  const Q0 = Math.max(0.1, gsi * 0.95 + (psdi - 1.0) * 0.45);

  // Disipación somática y fijación en el cuerpo: Somatización amortigua el exceso libre ligándolo a síntoma corporal
  const gamma_base = 0.45 + (som * 0.18) + (oc * 0.12);

  // Frecuencia del Drang (pulsión constante que no cesa de escribirse): Ansiedad y Hostilidad aceleran la rotación cíclica
  const omega_base = 1.05 + (ans * 0.40) + (hos * 0.35);

  // Intensidad de trauma I_trauma: proximidad a la marca de fantasía reactivada por Depresión, Fobia y Sensibilidad
  const I_trauma = 0.50 + (dep * 0.28) + (fob * 0.32) + (si * 0.20);

  // Perturbación del horn torus delta
  const delta = Math.min(0.85, 0.20 + gsi * 0.25);

  // Impedancia del orificio singular p (v = pi, por donde penetra la voz)
  const eta_orificio = Math.max(0.08, 0.35 - (psy * 0.08));

  // Capacidad de contención de la barrera de censura
  const lambda_bar_base = 1.80 + (oc * 0.30) - (gsi * 0.25);

  // Modulaciones según Estructura Clínica Lacaniana
  let K_rep: number;
  let gamma: number = gamma_base;
  let omega: number = omega_base;
  let lambda_bar: number = lambda_bar_base;
  let c0: number = 0.35 + gsi * 0.20;

  switch (estructura) {
    case 'neurotico':
      // Represión primaria operante (S1 -> S2). Barra significante sólida.
      // Retorno de lo reprimido metabólico y acotado.
      K_rep = Math.max(0.55, 0.88 - (ans * 0.12));
      lambda_bar = Math.max(1.2, lambda_bar_base);
      gamma = gamma_base * 1.05;
      break;

    case 'psicotico':
      // Forclusión del Nombre del Padre (P0). La barra de represión no opera.
      // La pulsión no se metaboliza en síntoma significante; se proyecta a lo Real hacia p.
      K_rep = 0.06; // Casi nulo
      lambda_bar = 0.65; // Pared permeable o colapsada
      gamma = gamma_base * 0.45; // Muy baja disipación significante
      omega = omega_base * 1.35; // Aceleración desbordante
      c0 = c0 * 1.5; // Carga no ligada en bruto
      break;

    case 'perverso':
      // Desmentida (Verleugnung). El fetiche hace de pantalla contingente.
      // Evita la angustia mediante fijación a la fantasía. Oscilador sostenido.
      K_rep = 0.42;
      lambda_bar = 1.45;
      gamma = gamma_base * 0.85;
      omega = omega_base * 0.90;
      break;

    case 'fronterizo':
    case 'borderline':
      // Estructura Psíquica Borderline: Escisión (Spaltung). Estados lábiles, alternancia bimodal de cargas.
      K_rep = 0.35;
      lambda_bar = 1.05;
      gamma = gamma_base * 0.70;
      omega = omega_base * 1.20;
      break;
  }

  const sclDataFull: SCL90RData = {
    'Somatización': som,
    'Obsesión-Compulsión': oc,
    'Sensibilidad Interpersonal': si,
    'Depresión': dep,
    'Ansiedad': ans,
    'Hostilidad': hos,
    'Ansiedad Fóbica': fob,
    'Ideación Paranoide': par,
    'Psicoticismo': psy,
    'GSI': gsi,
    'PST': pst,
    'PSDI': psdi,
  };

  return {
    estructura,
    Q0,
    gamma,
    omega,
    K_rep,
    I_trauma,
    eta_orificio,
    lambda_bar,
    delta,
    c0,
    sclData: sclDataFull,
  };
}

/**
 * correr_caso(tu_scl90r_data, estructura="neurotico", opciones)
 *
 * Ejecuta la integración dinámica temporal del circuito pulsional, angustia y síntoma
 * sobre la topología del Horn Torus.
 * Retorna res["IGS_sim"], res["Q_total"], trayectorias, clasificaciones de atractor y banderas de desborde.
 */
export function correr_caso(
  tu_scl90r_data: SCL90RData | Record<string, number>,
  estructura: EstructuraPsiquica = 'neurotico',
  opciones: SimulationOptions = {}
): ResultadoSimulacionIcc {
  const p = scl90r_a_parametros(tu_scl90r_data, estructura);
  const t_max = opciones.t_max ?? 20.0;
  const dt = opciones.dt ?? 0.05;
  const a_critical = opciones.a_critical ?? (Math.PI / 4); // 0.785 rad
  const drang_impulso = opciones.drang_impulso ?? 0;

  const steps = Math.floor(t_max / dt);
  const tiempo: number[] = new Array(steps);
  const Q_t: number[] = new Array(steps);
  const angustia_t: number[] = new Array(steps);
  const sintoma_t: number[] = new Array(steps);
  const defensa_t: number[] = new Array(steps);
  const trayectoria_uv: { u: number; v: number }[] = new Array(steps);

  // Variables de estado inicial
  let q = p.Q0;
  // Angustia inicial: ligada al factor de trauma y al umbral de angustia
  let a = Math.max(0.1, p.I_trauma * 0.40);
  // Coordenadas angulares sobre el horn torus
  let u = 0.0;
  let v = Math.PI / 2; // Inicia en el ecuador / meridiano medio

  let desbordeCount = 0;
  let qSum = 0;
  let qMax = q;
  let rupturaPsicotica = false;

  // Integración numérica RK4 (Runge-Kutta de 4to orden) para estabilidad y fidelidad matemática
  const derivatives = (currQ: number, currA: number, currU: number, currV: number, t: number) => {
    // Pulsión Drang: fuerza constante más oscilación de frecuencia omega
    const drang = p.c0 + 0.35 * Math.sin(p.omega * t) + (t > 5.0 && t < 5.8 ? drang_impulso : 0);

    // Represión significante / Defensa
    let defensa = 0;
    let ligadura = 0;
    let angustiaSource = 0;
    let damping = p.gamma * currQ;

    if (p.estructura === 'neurotico') {
      // Mecanismo de represión: frena el desborde a costa de tensión de síntoma
      defensa = p.K_rep * Math.tanh(currQ / 1.2);
      ligadura = 0.45 * defensa;
      // Proximidad al punto de fantasía (u = pi, v = 3pi/4)
      const distFantasia = Math.hypot(
        Math.atan2(Math.sin(currU - Math.PI), Math.cos(currU - Math.PI)),
        Math.atan2(Math.sin(currV - (3 * Math.PI) / 4), Math.cos(currV - (3 * Math.PI) / 4))
      );
      angustiaSource = distFantasia < a_critical ? (a_critical - distFantasia) * 1.5 * p.I_trauma : 0;
    } else if (p.estructura === 'psicotico') {
      // Forclusión: no hay ligadura significante; el retorno viene desde lo Real
      defensa = 0.05 * Math.sin(currQ);
      ligadura = 0.02 * currQ;
      // La singularidad de la cúspide (v = pi, la voz) atrae la carga
      const distCuspide = Math.abs(Math.atan2(Math.sin(currV - Math.PI), Math.cos(currV - Math.PI)));
      angustiaSource = (1.2 / Math.max(0.15, distCuspide)) * 0.35 * p.I_trauma;
      damping = damping * 0.5; // Menor drenaje metabólico
    } else if (p.estructura === 'perverso') {
      // Desmentida: el fetiche actúa como desvío tangencial impidiendo la entrada a la zona crítica
      defensa = p.K_rep * (0.8 + 0.2 * Math.cos(2 * currU));
      ligadura = 0.35 * currQ;
      const distFantasia = Math.hypot(
        Math.atan2(Math.sin(currU - Math.PI), Math.cos(currU - Math.PI)),
        Math.atan2(Math.sin(currV - (3 * Math.PI) / 4), Math.cos(currV - (3 * Math.PI) / 4))
      );
      // El fetiche neutraliza la angustia directa
      angustiaSource = distFantasia < a_critical ? 0.3 * (a_critical - distFantasia) * p.I_trauma : 0;
    } else {
      // Fronterizo: escisión alternante
      defensa = p.K_rep * Math.sign(Math.sin(1.5 * t)) * 0.5 + 0.3;
      ligadura = 0.20 * currQ;
      angustiaSource = p.I_trauma * (0.4 + 0.3 * Math.sin(currU + currV));
    }

    // dq/dt = Drang - Damping - Ligadura + Retorno
    const dq = drang - damping - ligadura + (currA * 0.4);

    // da/dt = AngustiaSource - Disipación_Angustia
    const da = angustiaSource - (0.65 * currA) + (currQ > p.lambda_bar ? (currQ - p.lambda_bar) * 0.8 : 0);

    // Flujo angular sobre el Horn Torus (du/dt, dv/dt)
    const du = p.omega * 0.85 + (currQ * 0.15);
    const dv = (p.omega * 0.55) * (1.0 + p.delta * Math.cos(currU));

    return { dq, da, du, dv, defensa, ligadura };
  };

  for (let i = 0; i < steps; i++) {
    const t = i * dt;
    tiempo[i] = parseFloat(t.toFixed(2));
    Q_t[i] = parseFloat(q.toFixed(4));
    angustia_t[i] = parseFloat(a.toFixed(4));
    trayectoria_uv[i] = {
      u: parseFloat(((u % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)).toFixed(3)),
      v: parseFloat(((v % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)).toFixed(3)),
    };

    const derivNow = derivatives(q, a, u, v, t);
    defensa_t[i] = parseFloat(derivNow.defensa.toFixed(4));
    sintoma_t[i] = parseFloat((derivNow.ligadura + a * 0.5).toFixed(4));

    if (q > qMax) qMax = q;
    qSum += q * dt;

    if (a >= a_critical || q > p.lambda_bar) {
      desbordeCount++;
    }

    if (p.estructura === 'psicotico' && (q > 3.2 || a > 2.5)) {
      rupturaPsicotica = true;
    }

    // RK4 step
    const k1 = derivatives(q, a, u, v, t);
    const k2 = derivatives(q + 0.5 * dt * k1.dq, a + 0.5 * dt * k1.da, u + 0.5 * dt * k1.du, v + 0.5 * dt * k1.dv, t + 0.5 * dt);
    const k3 = derivatives(q + 0.5 * dt * k2.dq, a + 0.5 * dt * k2.da, u + 0.5 * dt * k2.du, v + 0.5 * dt * k2.dv, t + 0.5 * dt);
    const k4 = derivatives(q + dt * k3.dq, a + dt * k3.da, u + dt * k3.du, v + dt * k3.dv, t + dt);

    q += (dt / 6) * (k1.dq + 2 * k2.dq + 2 * k3.dq + k4.dq);
    a += (dt / 6) * (k1.da + 2 * k2.da + 2 * k3.da + k4.da);
    u += (dt / 6) * (k1.du + 2 * k2.du + 2 * k3.du + k4.du);
    v += (dt / 6) * (k1.dv + 2 * k2.dv + 2 * k3.dv + k4.dv);

    // Safeguards
    if (q < 0.01) q = 0.01;
    if (a < 0.0) a = 0.0;
    if (p.estructura === 'psicotico' && q > 12.0) {
      q = 12.0; // Saturación en ruptura
      rupturaPsicotica = true;
    }
  }

  // Cálculo del IGS simulado (IGS_sim):
  // Representa el índice de severidad global resultante de promediar la carga metabólica,
  // la tasa de angustia y el desborde acumulado durante la simulación.
  const qMean = qSum / t_max;
  const aMean = angustia_t.reduce((acc, val) => acc + val, 0) / steps;
  const desbordeFraction = desbordeCount / steps;

  let igsSimRaw = (qMean * 0.55) + (aMean * 0.45) + (desbordeFraction * 0.40);
  if (p.estructura === 'psicotico' && rupturaPsicotica) {
    igsSimRaw = Math.max(igsSimRaw, 3.30); // Fuera de baremo (3x corte)
  }

  const IGS_sim = parseFloat(Math.max(0.1, igsSimRaw).toFixed(3));
  const Q_total = parseFloat(qSum.toFixed(3));
  const Q_max = parseFloat(qMax.toFixed(3));
  const Q_final = parseFloat(q.toFixed(3));
  const desborde = desbordeCount > 0;
  const desborde_pct = parseFloat((desbordeFraction * 100).toFixed(1));

  // Clasificación del Atractor Dinámico y Declaración Axiomática
  let regimen: string;
  let axioma_operante: string;
  let condicion_protocolo_h2: string;
  let interpretacion_clinica: string;

  if (p.estructura === 'neurotico') {
    // Rama Axioma 2(a): Superposición conexa, represión primaria (S1 -> S2).
    // Corolario II NO aplica a (a): no hay dispersión de significantes ni eyección fuera del toro.
    axioma_operante = 'Axioma 2(a) — Superposición conexa (Represión S1➔S2 / Sin dispersión ni eyección)';
    condicion_protocolo_h2 =
      'Condición H2 (Neurosis): IGS_sim relaja asintóticamente a un atractor puntual o ciclo límite acotado dentro de baremo clínico (IGS_sim < 3.0), sin ruptura topológica.';

    if (desborde_pct < 10) {
      regimen = 'Atractor puntual metaestable (Represión lograda)';
      interpretacion_clinica =
        'Estructura neurótica con barra de represión operante (S1 ➔ S2). Axioma 2(a): la correspondencia de origen no pasa por Σ; el Drang se metaboliza en síntoma significante sin dispersar ni eyectar la cinta fuera del horn torus.';
    } else {
      regimen = 'Ciclo límite neurótico sintomático (Angustia de señal)';
      interpretacion_clinica =
        'Estructura neurótica bajo sobrecarga: el retorno de lo reprimido produce oscilaciones periódicas que rozan la marca de trauma en la cara interna, activando angustia de señal compensada. Axioma 2(a) garantiza contención sin eyección.';
    }
  } else if (p.estructura === 'psicotico') {
    // Rama Axioma 2(b): Trecho disjunto, forclusión del Nombre del Padre (P0).
    // Corolario II operante: la falta de punto de basta induce eyección por la cúspide singular p (v = ±π).
    axioma_operante = 'Axioma 2(b) — Trecho disjunto / Forclusión P0 (Corolario II operante: Eyección por p)';
    condicion_protocolo_h2 =
      'Condición H2 (Psicosis): IGS_sim NO relaja a asíntota; diverge o mantiene picos fuera de baremo (IGS_sim ≥ 3.30, eyección por la voz v=±π), firma observable contrastable contra trayectorias longitudinales.';

    if (rupturaPsicotica || IGS_sim >= 3.0) {
      regimen = 'Bifurcación divergente / Desencadenamiento psicótico (Corolario II)';
      interpretacion_clinica =
        'Forclusión del Nombre del Padre (P0, Axioma 2b): al carecer de la metáfora paterna, el afecto traumático no se anuda y es eyectado por el orificio de autotangencia p (cúspide v=±π, la voz), desencadenando el Corolario II con picos persistentes fuera de baremo (IGS → ∞).';
    } else {
      regimen = 'Régimen pre-psicótico de compensación imaginaria';
      interpretacion_clinica =
        'Estructura psicótica no desencadenada (Axioma 2b): compensación por suplencia imaginaria, pero con impedancia crítica ante reactivaciones del Drang (riesgo latente de eyección por p).';
    }
  } else if (p.estructura === 'perverso') {
    axioma_operante = 'Axioma 2(a) modificado — Desmentida (Fetiche pantalla / Contención sin eyección)';
    condicion_protocolo_h2 =
      'Condición H2 (Perversión): IGS_sim se estabiliza en un ciclo periódico sostenido acotado por la pantalla fetichista, neutralizando la proximidad al trauma sin eyección exterior.';
    regimen = 'Régimen perverso de pantalla fetichista';
    interpretacion_clinica =
      'Desmentida (Verleugnung): el fetiche opera como pantalla contingente sobre la marca de trauma. Mantiene la satisfacción pulsional en un ciclo estable evitando la eclosión de angustia franca.';
  } else {
    axioma_operante = 'Axioma 2(a)/2(b) lábil — Escisión yoica (Spaltung / Estatuto Borderline)';
    condicion_protocolo_h2 =
      'Condición H2 (Borderline): En la estructura psíquica borderline, IGS_sim exhibe saltos caóticos bimodales entre desborde y repliegue sin convergencia a punto fijo pero sin eyección terminal permanente.';
    regimen = 'Oscilador caótico bimodal (Estructura psíquica Borderline)';
    interpretacion_clinica =
      'Estructura psíquica borderline (Spaltung): la dinámica oscila bruscamente entre picos de desbordamiento de angustia y vacíos afectivos, sin estabilización en un atractor único ni eyección exterior catastrófica.';
  }

  return {
    IGS_sim,
    Q_total,
    Q_max,
    Q_final,
    desborde,
    desborde_pct,
    ruptura_psicotica: rupturaPsicotica,
    tiempo,
    Q_t,
    angustia_t,
    sintoma_t,
    defensa_t,
    trayectoria_uv,
    regimen,
    axioma_operante,
    condicion_protocolo_h2,
    interpretacion_clinica,
    parametros: p,
    estructura,
  };
}

/**
 * Genera el código Python completo para el módulo autónomo `icc_dinamica.py`,
 * listo para `from icc_dinamica import correr_caso, scl90r_a_parametros`.
 */
export function generateIccDinamicaPythonScript(sclData?: SCL90RData): string {
  const defaultJson = JSON.stringify(
    sclData ?? {
      "Somatización": 0.8,
      "Obsesión-Compulsión": 0.9,
      "Sensibilidad Interpersonal": 0.7,
      "Depresión": 0.85,
      "Ansiedad": 0.95,
      "Hostilidad": 0.6,
      "Ansiedad Fóbica": 0.75,
      "Ideación Paranoide": 0.8,
      "Psicoticismo": 0.9,
      "GSI": 0.85,
      "PST": 45,
      "PSDI": 1.70,
    },
    null,
    4
  );

  return `"""
icc_dinamica.py — Módulo de Simulación Dinámica del Inconsciente (Horn Torus & Lacan)

Uso estándar:
    from icc_dinamica import correr_caso, scl90r_a_parametros
    res = correr_caso(tu_scl90r_data, estructura="neurotico")  # -> res["IGS_sim"], res["Q_total"]

Estructuras Psíquicas soportadas:
    - "neurotico"  : Represión primaria operante (S1 -> S2), ligadura significante
    - "psicotico"  : Forclusión del Nombre del Padre (P0), divergencia en cúspide p (v=pi)
    - "perverso"   : Desmentida (Verleugnung), pantalla fetichista contingente
    - "borderline" : Estructura psíquica Borderline (Spaltung / Escisión yoica bimodal)
"""

import math

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

try:
    from scipy.integrate import odeint
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False

def scl90r_a_parametros(scl90r_data, estructura="neurotico"):
    """
    Convierte el vector SCL-90-R a parámetros cinéticos y topológicos del modelo Horn Torus.
    """
    def g(k, def_val=0.8):
        v = scl90r_data.get(k, def_val)
        return float(v) if v is not None else def_val

    som = g("Somatización", 0.8)
    oc  = g("Obsesión-Compulsión", 0.9)
    si  = g("Sensibilidad Interpersonal", 0.7)
    dep = g("Depresión", 0.85)
    ans = g("Ansiedad", 0.95)
    hos = g("Hostilidad", 0.6)
    fob = g("Ansiedad Fóbica", 0.75)
    par = g("Ideación Paranoide", 0.8)
    psy = g("Psicoticismo", 0.9)
    gsi = g("GSI", 0.85)
    pst = g("PST", 45)
    psdi = g("PSDI", 1.70)

    # Carga inicial pulsional Q0
    Q0 = max(0.1, gsi * 0.95 + (psdi - 1.0) * 0.45)

    # Disipación somática (gamma) y Drang oscilatorio (omega)
    gamma_base = 0.45 + (som * 0.18) + (oc * 0.12)
    omega_base = 1.05 + (ans * 0.40) + (hos * 0.35)
    I_trauma = 0.50 + (dep * 0.28) + (fob * 0.32) + (si * 0.20)
    delta = min(0.85, 0.20 + gsi * 0.25)
    lambda_bar_base = 1.80 + (oc * 0.30) - (gsi * 0.25)
    c0 = 0.35 + gsi * 0.20

    if estructura == "neurotico":
        K_rep = max(0.55, 0.88 - (ans * 0.12))
        lambda_bar = max(1.2, lambda_bar_base)
        gamma = gamma_base * 1.05
        omega = omega_base
    elif estructura == "psicotico":
        K_rep = 0.06
        lambda_bar = 0.65
        gamma = gamma_base * 0.45
        omega = omega_base * 1.35
        c0 = c0 * 1.5
    elif estructura == "perverso":
        K_rep = 0.42
        lambda_bar = 1.45
        gamma = gamma_base * 0.85
        omega = omega_base * 0.90
    else:  # fronterizo
        K_rep = 0.35
        lambda_bar = 1.05
        gamma = gamma_base * 0.70
        omega = omega_base * 1.20

    return {
        "estructura": estructura,
        "Q0": Q0,
        "gamma": gamma,
        "omega": omega,
        "K_rep": K_rep,
        "I_trauma": I_trauma,
        "lambda_bar": lambda_bar,
        "delta": delta,
        "c0": c0,
        "a_critical": math.pi / 4.0
    }

def correr_caso(scl90r_data, estructura="neurotico", t_max=20.0, dt=0.05, guardar_grafica=None):
    """
    Ejecuta la simulación dinámica del caso clínico.
    
    Retorna:
        dict con llaves:
          - "IGS_sim": float (IGS dinámico simulado)
          - "Q_total": float (Carga energética acumulada)
          - "Q_max": float
          - "desborde": bool
          - "tiempo": list
          - "Q_t": list
          - "angustia_t": list
          - "regimen": str
          - "interpretacion_clinica": str
    """
    p = scl90r_a_parametros(scl90r_data, estructura)
    a_cr = p["a_critical"]

    steps = int(round(t_max / dt))
    t_list = [round(i * dt, 4) for i in range(steps)]

    # Estado: [Q, A, u, v]
    y0 = [p["Q0"], max(0.1, p["I_trauma"] * 0.4), 0.0, math.pi / 2.0]

    def sistema(y, t_curr):
        q_curr, a_curr, u_curr, v_curr = y
        drang = p["c0"] + 0.35 * math.sin(p["omega"] * t_curr)
        damping = p["gamma"] * q_curr

        if estructura == "neurotico":
            defensa = p["K_rep"] * math.tanh(q_curr / 1.2)
            ligadura = 0.45 * defensa
            du = math.atan2(math.sin(u_curr - math.pi), math.cos(u_curr - math.pi))
            dv = math.atan2(math.sin(v_curr - 3.0 * math.pi / 4.0), math.cos(v_curr - 3.0 * math.pi / 4.0))
            dist_f = math.hypot(du, dv)
            angustia_src = (a_cr - dist_f) * 1.5 * p["I_trauma"] if dist_f < a_cr else 0.0
        elif estructura == "psicotico":
            defensa = 0.05 * math.sin(q_curr)
            ligadura = 0.02 * q_curr
            dv_cusp = abs(math.atan2(math.sin(v_curr - math.pi), math.cos(v_curr - math.pi)))
            angustia_src = (1.2 / max(0.15, dv_cusp)) * 0.35 * p["I_trauma"]
            damping *= 0.5
        elif estructura == "perverso":
            defensa = p["K_rep"] * (0.8 + 0.2 * math.cos(2 * u_curr))
            ligadura = 0.35 * q_curr
            du = math.atan2(math.sin(u_curr - math.pi), math.cos(u_curr - math.pi))
            dv = math.atan2(math.sin(v_curr - 3.0 * math.pi / 4.0), math.cos(v_curr - 3.0 * math.pi / 4.0))
            dist_f = math.hypot(du, dv)
            angustia_src = 0.3 * (a_cr - dist_f) * p["I_trauma"] if dist_f < a_cr else 0.0
        else:
            defensa = p["K_rep"] * math.copysign(0.5, math.sin(1.5 * t_curr)) + 0.3
            ligadura = 0.20 * q_curr
            angustia_src = p["I_trauma"] * (0.4 + 0.3 * math.sin(u_curr + v_curr))

        dq = drang - damping - ligadura + (a_curr * 0.4)
        da = angustia_src - 0.65 * a_curr + (max(0.0, q_curr - p["lambda_bar"]) * 0.8)
        du_ang = p["omega"] * 0.85 + (q_curr * 0.15)
        dv_ang = (p["omega"] * 0.55) * (1.0 + p["delta"] * math.cos(u_curr))
        return [dq, da, du_ang, dv_ang]

    if HAS_SCIPY and HAS_NUMPY:
        t_arr = np.array(t_list)
        sol = odeint(sistema, y0, t_arr)
        Q_traj = sol[:, 0].tolist()
        A_traj = sol[:, 1].tolist()
    else:
        Q_traj = [0.0] * steps
        A_traj = [0.0] * steps
        y = list(y0)
        for i in range(steps):
            Q_traj[i] = y[0]
            A_traj[i] = y[1]
            t_c = t_list[i]
            k1 = sistema(y, t_c)
            y_k2 = [y[j] + 0.5 * dt * k1[j] for j in range(4)]
            k2 = sistema(y_k2, t_c + 0.5 * dt)
            y_k3 = [y[j] + 0.5 * dt * k2[j] for j in range(4)]
            k3 = sistema(y_k3, t_c + 0.5 * dt)
            y_k4 = [y[j] + dt * k3[j] for j in range(4)]
            k4 = sistema(y_k4, t_c + dt)
            for j in range(4):
                y[j] += (dt / 6.0) * (k1[j] + 2.0 * k2[j] + 2.0 * k3[j] + k4[j])
            if y[0] < 0.01:
                y[0] = 0.01
            if y[1] < 0.0:
                y[1] = 0.0

    q_sum = float(sum(Q_traj) * dt)
    q_mean = float(sum(Q_traj) / steps)
    a_mean = float(sum(A_traj) / steps)
    q_max = float(max(Q_traj))

    desborde_count = sum(1 for q_v, a_v in zip(Q_traj, A_traj) if a_v >= a_cr or q_v > p["lambda_bar"])
    desborde_pct = float((desborde_count / steps) * 100.0)
    desborde = desborde_count > 0
    ruptura = estructura == "psicotico" and (q_max > 3.2 or a_mean > 1.8)

    igs_sim = (q_mean * 0.55) + (a_mean * 0.45) + (desborde_pct / 100.0 * 0.40)
    if ruptura:
        igs_sim = max(igs_sim, 3.30)  # Fuera de baremo (3x corte T=60)

    if estructura == "neurotico":
        axioma = "Axioma 2(a) — Superposición conexa (Represión S1->S2 / Sin dispersión ni eyección)"
        h2_cond = "H2 (Neurosis): Relajación asintótica a atractor acotado (< 3.0), sin ruptura topológica."
        regimen = "Atractor puntual metaestable (Represión lograda)" if desborde_pct < 10 else "Ciclo límite neurótico sintomático"
        interp = "Represión primaria operante (S1 -> S2); la pulsión se metaboliza en síntoma sin dispersión ni eyección."
    elif estructura == "psicotico":
        axioma = "Axioma 2(b) — Trecho disjunto / Forclusión P0 (Corolario II operante: Eyección por p)"
        h2_cond = "H2 (Psicosis): IGS_sim no relaja a asíntota; diverge o mantiene picos fuera de baremo (≥ 3.30, eyección por la voz v=±π)."
        regimen = "Bifurcación divergente / Desencadenamiento psicótico (Corolario II)" if ruptura else "Compensación pre-psicótica"
        interp = "Forclusión del Nombre del Padre (P0); al no haber metáfora paterna, el afecto traumático es eyectado por p (la voz) fuera de baremo."
    elif estructura == "perverso":
        axioma = "Axioma 2(a) modificado — Desmentida (Pantalla fetichista / Sin eyección)"
        h2_cond = "H2 (Perversión): Ciclo periódico sostenido acotado por fetiche sin eyección exterior."
        regimen = "Régimen perverso de pantalla fetichista"
        interp = "Desmentida (Verleugnung); el fetiche desvía la proximidad a la marca de trauma en ciclo estable."
    else:
        axioma = "Axioma 2(a)/2(b) lábil — Escisión yoica (Spaltung / Estatuto Borderline)"
        h2_cond = "H2 (Borderline): Saltos caóticos bimodales sin punto fijo pero sin eyección terminal permanente."
        regimen = "Oscilador caótico bimodal (Estructura psíquica Borderline)"
        interp = "Estructura psíquica borderline (Spaltung) con alternancia afectiva abrupta sin eyección catastrófica."

    res = {
        "IGS_sim": round(float(igs_sim), 3),
        "Q_total": round(q_sum, 3),
        "Q_max": round(q_max, 3),
        "Q_final": round(float(Q_traj[-1]), 3),
        "desborde": desborde,
        "desborde_pct": round(desborde_pct, 1),
        "ruptura_psicotica": ruptura,
        "tiempo": t_list,
        "Q_t": [round(float(v), 4) for v in Q_traj],
        "angustia_t": [round(float(v), 4) for v in A_traj],
        "regimen": regimen,
        "axioma_operante": axioma,
        "condicion_protocolo_h2": h2_cond,
        "interpretacion_clinica": interp,
        "parametros": p,
        "estructura": estructura
    }

    if guardar_grafica:
        try:
            import matplotlib.pyplot as plt
            fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 7), sharex=True)
            ax1.plot(t_list, Q_traj, 'cyan', lw=2, label="Carga pulsional Q(t)")
            ax1.axhline(p["lambda_bar"], color='red', ls='--', alpha=0.7, label=f"Barrera censura ({p['lambda_bar']:.2f})")
            ax1.set_ylabel("Carga Q")
            ax1.set_title(f"Dinámica Icc — Estructura: {estructura.upper()} (IGS_sim={res['IGS_sim']}, Q_total={res['Q_total']})")
            ax1.legend(loc="upper right")
            ax1.grid(True, alpha=0.3)

            ax2.plot(t_list, A_traj, 'magenta', lw=2, label="Angustia A(t)")
            ax2.axhline(a_cr, color='yellow', ls='--', lw=1.5, label=f"Umbral crítico A_cr ({a_cr:.3f})")
            ax2.set_xlabel("Tiempo t")
            ax2.set_ylabel("Angustia A")
            ax2.legend(loc="upper right")
            ax2.grid(True, alpha=0.3)

            plt.tight_layout()
            plt.savefig(guardar_grafica, dpi=150)
            plt.close()
            print(f"[✓] Gráfica dinámica guardada en '{guardar_grafica}'")
        except Exception as e:
            print(f"[!] No se pudo guardar la gráfica: {e}")

    return res

if __name__ == '__main__':
    tu_scl90r_data = ${defaultJson}

    print("=" * 65)
    print("SIMULACIÓN DINÁMICA DEL INCONSCIENTE (HORN TORUS)")
    print("=" * 65)

    for est in ["neurotico", "psicotico", "perverso", "fronterizo"]:
        resultado = correr_caso(tu_scl90r_data, estructura=est)
        print(f"\\nEstructura: {est.upper()}")
        print(f"  • IGS_sim : {resultado['IGS_sim']}")
        print(f"  • Q_total : {resultado['Q_total']}")
        print(f"  • Q_max   : {resultado['Q_max']}")
        print(f"  • Régimen : {resultado['regimen']}")
        print(f"  • Desborde: {resultado['desborde']} ({resultado['desborde_pct']}%)")
`;
}
