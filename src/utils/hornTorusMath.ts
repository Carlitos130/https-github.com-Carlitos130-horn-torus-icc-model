import {
  SCL90RData,
  ModelParams,
  TopologicalMetrics,
  LacanianCoordinates,
  ColorMapMode,
  PostEpisodeState,
  SCL90RInputMode,
  TScoreCategory,
  CasulloPerezNormRow,
  SingularityCriticalPoint,
  SpectralSingularityReport
} from '../types';
import { BAREMOS, DEFAULT_BAREMO_ID, BaremoId, getBaremo, tDeEscalaCon, ruptureThresholdGsi, BAREMO_IDS } from './baremos';
export { BAREMOS, DEFAULT_BAREMO_ID, getBaremo, BAREMO_IDS, ruptureThresholdGsi, tDeEscalaCon, publishedRange } from './baremos';
export type { BaremoId } from './baremos';

export const DEFAULT_SCL90R_DATA: SCL90RData = {
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
  // PST es un conteo de ítems (0–90) y PSDI = suma/PST >= 1: IGS = PST·PSDI/90.
  // Los valores del prompt original (PST 0.70, PSDI 0.90) eran imposibles.
  "PST": 45,
  "PSDI": 1.70
};

/**
 * Preset clínico. `mode` indica cómo se cargó: 'pd' (puntajes directos, con validación
 * de consistencia) o 't_scores' (protocolos que solo informan T). Internamente `data`
 * es SIEMPRE PD: los presets en T se convierten con el baremo (ver sclDataDesdeTScores).
 */
export interface ClinicalPreset {
  name: string;
  description: string;
  mode: SCL90RInputMode;
  data: SCL90RData;
  tScores?: Record<keyof SCL90RData, number>;
  isRiskCase?: boolean;
}

export const CLINICAL_PRESETS: ClinicalPreset[] = [
  {
    name: "Modelo Icc Lacaniano (Código Python)",
    description: "Configuración psicométrica completa con curvas S, I, Σ y marca de fantasía",
    mode: 'pd',
    data: { ...DEFAULT_SCL90R_DATA }
  },
  {
    name: "Caso SCL-90-R (Prompt Inicial)",
    description: "GSI 0.90, Psicoticismo 0.95, Obsesión 0.85, Somatización 0.75 (PST 48, PSDI 1.69)",
    mode: 'pd',
    data: {
      "Somatización": 0.75,
      "Obsesión-Compulsión": 0.85,
      "Sensibilidad Interpersonal": 0.70,
      "Depresión": 0.70,
      "Ansiedad": 0.80,
      "Hostilidad": 0.60,
      "Ansiedad Fóbica": 0.65,
      "Ideación Paranoide": 0.75,
      "Psicoticismo": 0.95,
      "GSI": 0.90,
      "PST": 48,
      "PSDI": 1.69
    }
  },
  {
    name: "Perfil obsesivo (O-C sintomática)",
    description: "O-C 2.20 (T≈65) con IGS bajo el corte: curva S dominante, sin ruptura",
    mode: 'pd',
    data: {
      "Somatización": 0.60,
      "Obsesión-Compulsión": 2.20,
      "Sensibilidad Interpersonal": 1.00,
      "Depresión": 1.00,
      "Ansiedad": 1.20,
      "Hostilidad": 0.60,
      "Ansiedad Fóbica": 0.30,
      "Ideación Paranoide": 0.70,
      "Psicoticismo": 0.40,
      "GSI": 1.00,
      "PST": 50,
      "PSDI": 1.80
    }
  },
  {
    name: "Ruptura del modelo (IGS extremo)",
    description: "IGS 3.30 = 3× el corte T=60 (fuera de baremo): eyección de S, I y Pulsión — AXIOMA, no diagnóstico de estructura",
    mode: 'pd',
    data: {
      "Somatización": 3.10,
      "Obsesión-Compulsión": 3.40,
      "Sensibilidad Interpersonal": 3.30,
      "Depresión": 3.20,
      "Ansiedad": 3.40,
      "Hostilidad": 3.50,
      "Ansiedad Fóbica": 2.90,
      "Ideación Paranoide": 3.60,
      "Psicoticismo": 3.50,
      "GSI": 3.30,
      "PST": 88,
      "PSDI": 3.38
    }
  },
  {
    name: "Perfil somatización + SI (Imagen I)",
    description: "SOM 1.80 (T≈70) y SI 1.40 (T≈61): curva I desfasada",
    mode: 'pd',
    data: {
      "Somatización": 1.80,
      "Obsesión-Compulsión": 0.80,
      "Sensibilidad Interpersonal": 1.40,
      "Depresión": 1.00,
      "Ansiedad": 1.10,
      "Hostilidad": 0.50,
      "Ansiedad Fóbica": 0.60,
      "Ideación Paranoide": 0.60,
      "Psicoticismo": 0.40,
      "GSI": 1.00,
      "PST": 55,
      "PSDI": 1.64
    }
  }
];

export interface TorusPoint {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  u: number;
  v: number;
  angustia: number;
  isRupture: boolean;
  stress: number;
}

/**
 * Corte del baremo masculino-adultos (Casullo – Pérez 2008): PD del IGS que
 * corresponde a T = 60. La ruptura psicótica se define FUERA de baremo: IGS >=
 * 3× el corte DE LA POBLACIÓN elegida (ver baremos.ts).
 */
export const BAREMO_T60_GSI = 1.10; // masculino adultos 25–60 (default, compat)
export const PSYCHOTIC_RUPTURE_FACTOR = 3.0;
/** Umbral del baremo default: 3× 1.10, redondeado (3.0 × 1.10 = 3.3000…03 en FP). */
export const PSYCHOTIC_RUPTURE_THRESHOLD_GSI = 3.30;

/** Ítems por dimensión del SCL-90-R (83) + 7 ítems adicionales = 90. */
export const SCL90R_ITEM_COUNTS: Partial<Record<keyof SCL90RData, number>> = {
  "Somatización": 12,
  "Obsesión-Compulsión": 10,
  "Sensibilidad Interpersonal": 9,
  "Depresión": 13,
  "Ansiedad": 10,
  "Hostilidad": 6,
  "Ansiedad Fóbica": 7,
  "Ideación Paranoide": 6,
  "Psicoticismo": 10,
};
export const SCL90R_TOTAL_ITEMS = 90;
export const SCL90R_ADDITIONAL_ITEMS = 7;

/**
 * PST (conteo 0–90) llevado a la escala 0–4 de las demás puntuaciones, solo para
 * la geometría: las fórmulas de deformación y de v_I fueron calibradas en 0–4.
 */
export function pstGeom(pst: number): number {
  return pst / (SCL90R_TOTAL_ITEMS / 4);
}

/** PSDI derivado: suma/PST = IGS·90/PST (0 si no hay síntomas positivos). */
export function derivePsdi(gsi: number, pst: number): number {
  return pst > 0 ? (gsi * SCL90R_TOTAL_ITEMS) / pst : 0;
}

/** Rango admisible de PST para un IGS dado: PSDI ∈ [1, 4]. */
export function pstRangeForGsi(gsi: number): [number, number] {
  const sum = gsi * SCL90R_TOTAL_ITEMS;
  return [
    Math.min(SCL90R_TOTAL_ITEMS, Math.ceil(sum / 4 - 1e-9)),
    Math.min(SCL90R_TOTAL_ITEMS, Math.floor(sum + 1e-9)),
  ];
}

/** Rango de IGS compatible con las nueve dimensiones (los 7 ítems adicionales entre 0 y 4). */
export function gsiRangeFromDimensions(data: SCL90RData): [number, number] {
  let sum = 0;
  for (const [k, n] of Object.entries(SCL90R_ITEM_COUNTS)) {
    sum += (data[k as keyof SCL90RData] ?? 0) * (n as number);
  }
  return [sum / SCL90R_TOTAL_ITEMS, (sum + 4 * SCL90R_ADDITIONAL_ITEMS) / SCL90R_TOTAL_ITEMS];
}

/** Inconsistencias internas del perfil SCL-90-R (vacío = perfil posible). */
export function checkScl90rConsistency(data: SCL90RData): string[] {
  const issues: string[] = [];
  const gsi = data["GSI"] ?? 0;
  const pst = data["PST"] ?? 0;
  const psdi = data["PSDI"] ?? 0;
  if (pst < 0 || pst > SCL90R_TOTAL_ITEMS) issues.push(`PST ${pst} fuera de 0–90 (es un conteo de ítems).`);
  if (pst > 0 && (psdi < 1 || psdi > 4)) issues.push(`PSDI ${psdi.toFixed(2)} fuera de 1–4 (cada ítem positivo vale al menos 1).`);
  if (Math.abs((pst * psdi) / SCL90R_TOTAL_ITEMS - gsi) > 0.02) {
    issues.push(`IGS ${gsi.toFixed(2)} ≠ PST·PSDI/90 = ${((pst * psdi) / SCL90R_TOTAL_ITEMS).toFixed(2)}.`);
  }
  const [lo, hi] = gsiRangeFromDimensions(data);
  if (gsi < lo - 0.005 || gsi > hi + 0.005) {
    issues.push(`IGS ${gsi.toFixed(2)} incompatible con las dimensiones: debe estar entre ${lo.toFixed(2)} y ${hi.toFixed(2)}.`);
  }
  return issues;
}

/**
 * Ruptura psicótica fuera de baremo: IGS >= 3× el corte T=60 de la población, con
 * la Wegbreite suficiente (Corolario I al Axioma 4, tesis V22). La anchura del cruce
 * es un factor distinto de la cantidad (Q) y de la resistencia (Widerstand) en el
 * Entwurf: un cruce angosto se disipa sin llegar al pasaje, aunque el IGS alcance
 * el umbral; solo uno de anchura suficiente llega a pasar por la marca.
 *
 * Articulación con el modelo: la Wegbreite se mide sobre el adelgazamiento de la
 * pared (la censura Icc/Prcc), cuyo factor es `deformation_factor` (δ). Con la
 * ruptura activada (preset "Ruptura del modelo"), δ sube a 0.55 — siempre por
 * encima del techo π/6 ≈ 0.524.
 */
export const WEGREITE_MIN_DELTA = Math.PI / 6;
/** En el Entwurf la anchura es constante e independiente de la resistencia: un cruce
 *  por una pared adelgazada por debajo del techo no llega al pasaje (se disipa). */
export const WEGREITE_DISIPACION_DELTA = Math.PI / 6;

/** Cadena significante (Corolario II): eslabones s1..s8 / i1..i8, en el sentido
 *  lacaniano de cadena (S-threatening de la tesis V22, Figs. 5.9–5.10): el pasaje
 *  los dispersa y los reengancha en un orden nuevo. */
export const UMBAU_N = 8;
export const UMBAU_ESLABONES: number[] = Array.from({ length: UMBAU_N }, (_, i) => i);

export function isPsychoticRupture(sclData: SCL90RData, params?: ModelParams): boolean {
  const gsi = sclData["GSI"] ?? 0;
  const baremoId = params?.baremoId;
  const umbral = baremoId ? ruptureThresholdGsi(baremoId) : PSYCHOTIC_RUPTURE_THRESHOLD_GSI;
  if (!Number.isFinite(gsi) || gsi < umbral - 1e-9) return false;
  // Corolario I (Wegbreite): sin anchura suficiente el cruce se disipa — no llega
  // al pasaje aunque la cantidad (IGS) alcance el umbral.
  const delta = params?.deformation_factor ?? 0.3;
  return delta >= WEGREITE_MIN_DELTA - 1e-9;
}

/**
 * Calculates Lacanian parameters S, I, Sigma, fantasy point, and rupture points
 * directly following the user's HornTorusICCModel definition
 */
export function calculateLacanianParameters(
  sclData: SCL90RData, 
  params: ModelParams
): LacanianCoordinates {
  const { a_scale, u_scale, v_scale, a_critical } = params;
  // Pregunta abierta (tesis Cap. 7): Σ como pantalla (true) o mero anudamiento
  // (false, default). Conmuta el régimen del cálculo de la zona de angustia.
  const sigmaPantalla = (params as { sigmaPantalla?: boolean }).sigmaPantalla === true;

  // r/R ratio: guarded against invalid input (0, negative, NaN, > 1).
  // Anything non-finite or out of range falls back to 1.0 (horn torus).
  const rOverRRaw = (params as { rOverR?: number }).rOverR;
  const rOverR =
    typeof rOverRRaw === "number" && Number.isFinite(rOverRRaw) && rOverRRaw > 0 && rOverRRaw <= 1.0
      ? rOverRRaw
      : 1.0;

  // Radio a (escalado por GSI)
  const gsi = sclData["GSI"] ?? 0.85;
  const a = a_scale * gsi;

  // Radios de la familia: R = a, r = rOverR * R.
  // rOverR = 1 reproduce exactamente el horn torus actual (R = r = a).
  const R = a;
  const r = rOverR * a;

  // Escalas primarias sin GSI, PST, PSDI
  const numScales = 9;

  // S (Significante): basado en Ansiedad y Obsesión
  const anxiety = sclData["Ansiedad"] ?? 0.95;
  const obsession = sclData["Obsesión-Compulsión"] ?? 0.9;
  const u_S = (u_scale * (anxiety + obsession)) / numScales;

  // v para S: basado en PSDI
  const psdi = sclData["PSDI"] ?? 0.9;
  const v_S = v_scale * (1 + psdi);

  // I (Imagen del cuerpo): basado en Somatización y Sensibilidad Interpersonal
  const somatization = sclData["Somatización"] ?? 0.8;
  const interpersonal = sclData["Sensibilidad Interpersonal"] ?? 0.7;
  const u_I = (u_scale * (somatization + interpersonal)) / numScales;

  // v para I: basado en PST
  const pst = pstGeom(sclData["PST"] ?? 45);
  const v_I = v_scale * (1 + pst);

  // Hilo Pulsional (Trieb · Drang):
  // Pegado al borde de I (umbral de inscripción del organismo como imagen del cuerpo) — AXIOMA
  const depression = sclData["Depresión"] ?? 0.8;
  const pulsionAttachmentStrength = Math.min(
    1.0,
    Math.max(0.3, 0.88 + somatization * 0.12 - depression * 0.15)
  );
  const u_Pulsion = u_I;
  const v_Pulsion = v_I;

  // Σ (Síntoma): basado en Psicoticismo y Hostilidad
  const psychoticism = sclData["Psicoticismo"] ?? 0.9;
  const hostility = sclData["Hostilidad"] ?? 0.6;
  const u_Sigma = (u_scale * (psychoticism + hostility)) / numScales;

  // v para Σ: basado en Psicoticismo
  const v_Sigma = v_scale * (1 + psychoticism);

  // --- Marcas de fantasía (Resumen §8, resuelto): la fantasía son MARCAS Icc
  // de trauma, distintas entre sí, pegadas a la cara interna de la PARED (la censura Icc/Prcc) —
  // regla del usuario: en la configuración neurótica la marca está en UN LUGAR
  // del horn torus, y es ahí donde la angustia aparece cuando la pulsión pasa
  // cerca; SOLO en el desencadenamiento psicótico la marca queda en el medio
  // (el orificio) — lo que la secuencia ya representa al hacerla migrar al
  // orificio e integrarse a la voz. Posición por defecto: (π, 3π/4), un punto
  // de la pared entre el ecuador superior y la garganta, lejos del orificio.
  const nMarks = Math.max(1, Math.min(12, Math.round(
    Number.isFinite((params as { fantasyMarkCount?: number }).fantasyMarkCount)
      ? (params as { fantasyMarkCount?: number }).fantasyMarkCount as number
      : 1
  )));
  const fantasyMarks: { u: number; v: number }[] = [];
  for (let m = 0; m < nMarks; m++) {
    if (m === 0) {
      fantasyMarks.push({ u: Math.PI, v: 3 * Math.PI / 4 });
    } else {
      // Caracol sobre la pared: avanza en u (1.9 rad ≈ separación visible) y
      // deriva en v dentro de la banda de la cara interna de la pared.
      const u_m = Math.PI + m * 1.9;
      const v_m = 3 * Math.PI / 4 + 0.35 * Math.sin(m * 2.1);
      fantasyMarks.push({ u: u_m, v: v_m });
    }
  }
  const u_F = fantasyMarks[0].u;
  const v_F = fantasyMarks[0].v;

  // Coordenadas 3D de cada marca, en la superficie de la familia:
  // x = (R + r·cos v)·cos u, y = (R + r·cos v)·sin u, z = r·sin v.
  // En r = R se reduce a a·(1 + cos v), el punto actual.
  const fantasyMarks3D: [number, number, number][] = fantasyMarks.map(({ u: um, v: vm }) => [
    (R + r * Math.cos(vm)) * Math.cos(um),
    (R + r * Math.cos(vm)) * Math.sin(um),
    r * Math.sin(vm),
  ]);
  const x_F = fantasyMarks3D[0][0];
  const y_F = fantasyMarks3D[0][1];
  const z_F = fantasyMarks3D[0][2];

  // Zona crítica de angustia: UNIÓN de las vecindades (A_cr) de TODAS las
  // marcas — AXIOMA §8: la angustia aparece cuando algo pasa cerca de una
  // de ellas. El % es de ÁREA, no de parámetros: cada muestra pesa por el
  // elemento de área dA = r·(R + r·cos v) du dv, que se anula en la cúspide.
  const sampleSteps = 60;
  // --- Pregunta abierta de la tesis (Cap. 7): ¿Σ como pantalla o mero anudamiento? ---
  // La tesis lo deja sin decidir: no está claro si Σ aleja los cruces de las marcas
  // (pantalla) o solo anuda a S e I en M_L sin incidir en dónde se producen los
  // cruces. El modelo lo hace CONMUTABLE: params.sigmaPantalla (default false).
  // Como pantalla: la banda de Σ sobre la superficie (la misma que dibuja el canvas:
  // v = π + 0.58·sin(2u + φ_Σ), semiancho 0.35) INTERCEPTA los cruces — esa porción
  // de la zona de angustia queda desviada (no cuenta como ruptura). Como mero
  // anudamiento: Σ no incide y los cruces llegan a las marcas (comportamiento base).
  const phiSigma = v_Sigma % (2 * Math.PI);
  const SIGMA_HALF_WIDTH = 0.35;
  const enBandaSigma = (u: number, v: number): boolean =>
    Math.abs(angularDistance(v, Math.PI + 0.58 * Math.sin(2 * u + phiSigma))) <= SIGMA_HALF_WIDTH;

  let rupturePointsCount = 0;
  let ruptureAreaConPantalla = 0;
  let ruptureAreaSinPantalla = 0;
  let totalArea = 0;
  for (let i = 0; i < sampleSteps; i++) {
    const u = (i / sampleSteps) * 2 * Math.PI;
    for (let j = 0; j < sampleSteps; j++) {
      const v = (j / sampleSteps) * 2 * Math.PI;
      const dA = R + r * Math.cos(v);
      totalArea += dA;
      // Vecindad de alguna marca: d_per_min <= a_cr.
      let cerca = false;
      for (const mark of fantasyMarks) {
        if (angularDistance(u, mark.u) <= a_critical) {
          const dv = angularDistance(v, mark.v);
          if (dv <= Math.sqrt(Math.max(0, a_critical * a_critical - angularDistance(u, mark.u) ** 2))) {
            cerca = true;
            break;
          }
        }
      }
      if (cerca) {
        rupturePointsCount++;
        ruptureAreaSinPantalla += dA;
        if (!enBandaSigma(u, v)) ruptureAreaConPantalla += dA;
      }
    }
  }
  const ruptureAreaPercentSinPantalla = totalArea > 0 ? (ruptureAreaSinPantalla / totalArea) * 100 : 0;
  // Fracción de la zona de angustia que la banda de Σ intercepta (0–1).
  const sigmaPantallaFraccion = ruptureAreaSinPantalla > 0
    ? Math.min(1, Math.max(0, 1 - ruptureAreaConPantalla / ruptureAreaSinPantalla))
    : 0;
  // Régimen conmutado: como pantalla el % final descuenta lo interceptado;
  // como mero anudamiento los cruces llegan a las marcas (comportamiento base).
  const ruptureAreaPercent = sigmaPantalla
    ? ruptureAreaPercentSinPantalla * (1 - sigmaPantallaFraccion)
    : ruptureAreaPercentSinPantalla;
  const ruptureCountFinal = Math.round(rupturePointsCount * (ruptureAreaPercent / Math.max(ruptureAreaPercentSinPantalla, 1e-9)));

  // Proximidad de la cinta S a la marca de fantasía más cercana (Axioma 4: aproximación).
  // Distancia periódica en (u, v); dentro de A_cr la cinta S pasa por la vecindad de una marca.
  const uSm = ((u_S % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const vSm = ((v_S % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const distanceSignifierToFantasy = Math.min(
    ...fantasyMarks.map((m) => Math.hypot(angularDistance(uSm, m.u), angularDistance(vSm, m.v)))
  );
  const isTraumaReactivated = distanceSignifierToFantasy <= a_critical;

  // Actividad en p (la voz): cercanía de la cinta S al punto de autotangencia (v = π).
  const earCuspActivity = Math.max(0, Math.min(1, 1.0 - angularDistance(vSm, Math.PI) / Math.PI));

  // p es de doble sentido (tesis V22): por él entra lo oído —las representaciones-palabra
  // que forman el Prcc— y sale la voz. El vector apunta a lo largo del eje, hacia p.
  // Intensidad de la voz: asignación AXIOMÁTICA a Hostilidad y Psicoticismo (PD acotados a 0–2).
  const host = Math.min(2, Math.max(0, sclData['Hostilidad'] ?? 0.6));
  const psyV = Math.min(2, Math.max(0, sclData['Psicoticismo'] ?? 0.8));
  const voiceIntensity = 0.8 + 0.4 * host + 0.5 * psyV;
  const voiceIntrusionVector: [number, number, number] = [0, 0, -voiceIntensity];
  const extimacyDescription =
    'Toda la superficie del horn torus es el Icc; la pared es la censura Icc/Prcc. El punto de autotangencia p es ' +
    'el único orificio fijo y es de doble sentido: por él entra lo oído —las representaciones-palabra que forman ' +
    'el Prcc, un campo concentrado en el embudo del eje y sin borde— y sale la voz. La Cc no es un lugar sino un ' +
    'umbral de sobreinvestidura dentro de ese campo (GW XIII, caps. II y V; GW X, secc. VI). Geometría: AXIOMA.';

  return {
    a,
    rOverR,
    R,
    r,
    u_S,
    v_S,
    u_I,
    v_I,
    u_Pulsion,
    v_Pulsion,
    pulsionAttachmentStrength,
    u_Sigma,
    v_Sigma,
    fantasyPointUV: [u_F, v_F],
    fantasyPoint3D: [x_F, y_F, z_F],
    fantasyMarks,
    fantasyMarks3D,
    ruptureCount: ruptureCountFinal,
    ruptureAreaPercent,
    sigmaPantallaFraccion,
    ruptureAreaPercentSinPantalla,
    distanceSignifierToFantasy,
    isTraumaReactivated,
    earCuspActivity,
    voiceIntrusionVector,
    extimacyDescription
  };
}

/** Distancia angular periódica en [0, π]. */
function angularDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % (2 * Math.PI);
  return Math.min(d, 2 * Math.PI - d);
}

/** Máximo de A(u, v): sobre la marca de fantasía (distancia periódica 0). */
export const MAX_ANGUSTIA_DISTANCE = Math.PI * Math.SQRT2;

/**
 * A(u, v) = intensidad de angustia — AXIOMA: surge por proximidad a UNA marca
 * de fantasía y es MÁXIMA sobre ella. Con N marcas (Resumen §8), A es el
 * MÁXIMO sobre todas: basta que algo pase cerca de una para que haya angustia.
 * A = máx_m (A_max − d_per(u,v, m)); la ruptura es la unión de las vecindades.
 */
export function calculateAngustia(
  u: number,
  v: number,
  marks: { u: number; v: number }[] = [{ u: Math.PI, v: 3 * Math.PI / 4 }]
): number {
  let max = 0;
  for (const m of marks) {
    const a = MAX_ANGUSTIA_DISTANCE - Math.hypot(angularDistance(u, m.u), angularDistance(v, m.v));
    if (a > max) max = a;
  }
  return max;
}

/**
 * Fases de la secuencia de ruptura psicótica de las cintas:
 * - 'stable': configuración lacaniana entrecruzada normal (S, I, Pulsión pegadas al interior).
 * - 'ejected': las cintas S, I y Pulsión están eyectadas por el orificio (cúspide v = π,
 *   el origen del horn torus, por donde "sale la voz").
 * - 'covered': reconfiguración — las cintas vuelven cubriendo TODA la superficie
 *   (latitud completa v ∈ (0, 2π), en lugar del interior v ≈ π).
 */
export type RibbonMode = 'stable' | 'ejected' | 'covered';

/**
 * Generates 3D coordinates for curves/ribbons S, I, Hilo Pulsional, and Sigma.
 * Las cintas están dispuestas y entrecruzadas en el interior del horn torus (Icc),
 * donde el Hilo Pulsional está íntimamente pegado y trenzado a la cinta I.
 *
 * mode controla la secuencia de ruptura psicótica:
 * - 'stable' (default): geometría original.
 * - 'ejected': S, I y Pulsión colapsan hacia el orificio (cúspide v = π en el origen).
 * - 'covered': S, I y Pulsión reconfiguradas cubriendo toda la superficie.
 */
export function getLacanianCurves(
  lacanian: LacanianCoordinates,
  uPoints: number = 220,
  visualScale: number = 25.0, // scale up coordinates for viewport
  mode: RibbonMode = 'stable'
) {
  const uVals: number[] = [];
  for (let i = 0; i <= uPoints; i++) {
    uVals.push((i / uPoints) * 2 * Math.PI);
  }

  const effectiveA = lacanian.a * visualScale; // R (revolution radius)
  const tubeR = effectiveA * lacanian.rOverR; // r (tube radius)
  const phi_I = (lacanian.v_I % (2 * Math.PI));
  const phi_S = (lacanian.v_S % (2 * Math.PI));
  const phi_Sigma = (lacanian.v_Sigma % (2 * Math.PI));

  // Parámetros de la secuencia de ruptura (solo afectan S, I y Pulsión; Σ intacta):
  const ejected = mode === 'ejected';
  const covered = mode === 'covered';
  // En 'covered' el v de las cintas barre TODA la circunferencia poloidal (v ∈ (0, 2π))
  // en vez del interior estrecho v ≈ π; con 3 giros por vuelta toroidal las cintas
  // entrecruzadas cubren toda la superficie.
  const coverTurns = covered ? 3 : 0;

  // 1. Curva I (Imagen del cuerpo, color verde esmeralda):
  // Recorre el interior del toro oscilando a través de la garganta/cúspide.
  // Base point of the family: (R + r·cos v), z = r·sin v; exactly the old
  // a·(1 + cos v) form at r/R = 1.
  const curveI: [number, number, number][] = uVals.map((u) => {
    if (ejected) {
      // Colapso hacia el orificio: cúspide v = π en el origen del horn torus.
      return [0, 0, 0];
    }
    const vBase = Math.PI + 0.48 * Math.sin(u + phi_I) + 0.12 * Math.cos(2 * u);
    // En 'covered' el barrido poloidal completo cubre TODA la superficie.
    const v = covered ? u * coverTurns : vBase;
    const rad = effectiveA + tubeR * Math.cos(v);
    const x = rad * Math.cos(u);
    const y = rad * Math.sin(u);
    const z = tubeR * Math.sin(v);
    return [x, y, z];
  });

  // 2. Hilo Pulsional (Trieb · Drang, color dorado/ámbar):
  // ESTÁ PEGADO A I: Se acopla de manera estrecha a la cinta I, entrelazándose
  // helicoidalmente como la investidura pulsional de las zonas erógenas corporales.
  const curvePulsion: [number, number, number][] = uVals.map((u, idx) => {
    if (ejected) {
      // Sigue a I al orificio (pegado a I, como siempre).
      return [0, 0, 0];
    }
    const basePt = curveI[idx];
    const vBase = covered
      ? u * coverTurns + 0.22 // pegado a I también en la cobertura total
      : Math.PI + 0.48 * Math.sin(u + phi_I) + 0.12 * Math.cos(2 * u);
    // Micro-desplazamiento pulsional entrelazado con I
    const pulsionFreq = 6;
    const vOffset = 0.14 * Math.sin(pulsionFreq * u) * lacanian.pulsionAttachmentStrength;
    const vP = vBase + vOffset;
    const rOffset = 0.08 * Math.cos(pulsionFreq * u) * tubeR * lacanian.pulsionAttachmentStrength;
    const rad = effectiveA + tubeR * Math.cos(vP) + rOffset;
    const x = rad * Math.cos(u);
    const y = rad * Math.sin(u);
    const z = tubeR * Math.sin(vP) + 0.06 * Math.sin(pulsionFreq * u) * tubeR;
    return [x, y, z];
  });

  // 3. Curva S (Significante / Simbólico, color rojo carmesí):
  // Trayectoria meridional que intersecta y corta transversalmente a I y al Hilo Pulsional
  const curveS: [number, number, number][] = uVals.map((u) => {
    if (ejected) {
      return [0, 0, 0];
    }
    const vBase = Math.PI + 0.48 * Math.cos(u + phi_S) - 0.16 * Math.sin(2 * u);
    const v = covered ? u * coverTurns + Math.PI / 3 : vBase;
    const rad = effectiveA + tubeR * Math.cos(v);
    const x = rad * Math.cos(u);
    const y = rad * Math.sin(u);
    const z = tubeR * Math.sin(v);
    return [x, y, z];
  });

  // 4. Curva Sigma (Síntoma, color azul cobalto):
  // Trayectoria del síntoma en el interior, cruzando la singularidad
  const curveSigma: [number, number, number][] = uVals.map((u) => {
    const v = Math.PI + 0.58 * Math.sin(2 * u + phi_Sigma);
    const rad = effectiveA + tubeR * Math.cos(v);
    const x = rad * Math.cos(u);
    const y = rad * Math.sin(u);
    const z = tubeR * Math.sin(v);
    return [x, y, z];
  });

  // Punto de fantasía en 3D escalado: foco de Angustia máxima
  const fantasy3D: [number, number, number] = [
    lacanian.fantasyPoint3D[0] * visualScale,
    lacanian.fantasyPoint3D[1] * visualScale,
    lacanian.fantasyPoint3D[2] * visualScale,
  ];

  return { curveS, curveI, curvePulsion, curveSigma, fantasy3D };
}

/**
 * Builds 3D Ribbon geometry data (positions, normals, uvs, indices)
 * to render curves as genuine physical ribbons weaving through the interior.
 */
export function generateRibbonGeometryData(
  points: [number, number, number][],
  ribbonWidth: number = 0.09
): {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array | Uint32Array;
} {
  const n = points.length;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < n; i++) {
    const p = points[i];
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];

    // Tangente de la curva
    const tx = next[0] - prev[0];
    const ty = next[1] - prev[1];
    const tz = next[2] - prev[2];
    const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
    const tHat = [tx / tLen, ty / tLen, tz / tLen];

    // Vector hacia el origen (aproximación radial de la superficie)
    const rx = p[0];
    const ry = p[1];
    const rz = p[2];
    const rLen = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
    const rHat = [rx / rLen, ry / rLen, rz / rLen];

    // Binormal: perpendicular a la tangente y a la dirección radial
    let bx = tHat[1] * rHat[2] - tHat[2] * rHat[1];
    let by = tHat[2] * rHat[0] - tHat[0] * rHat[2];
    let bz = tHat[0] * rHat[1] - tHat[1] * rHat[0];
    const bLen = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
    bx /= bLen;
    by /= bLen;
    bz /= bLen;

    // Normal de la cinta (apunta hacia la cara de la cinta)
    let nx = by * tHat[2] - bz * tHat[1];
    let ny = bz * tHat[0] - bx * tHat[2];
    let nz = bx * tHat[1] - by * tHat[0];
    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    nx /= nLen;
    ny /= nLen;
    nz /= nLen;

    const halfW = ribbonWidth * 0.5;

    // Vértice Izquierdo
    positions.push(p[0] - bx * halfW, p[1] - by * halfW, p[2] - bz * halfW);
    normals.push(nx, ny, nz);
    uvs.push(0, i / n);

    // Vértice Derecho
    positions.push(p[0] + bx * halfW, p[1] + by * halfW, p[2] + bz * halfW);
    normals.push(nx, ny, nz);
    uvs.push(1, i / n);
  }

  // Generar triángulos entre segmentos sucesivos
  for (let i = 0; i < n - 1; i++) {
    const v0 = i * 2;
    const v1 = i * 2 + 1;
    const v2 = (i + 1) * 2;
    const v3 = (i + 1) * 2 + 1;

    indices.push(v0, v1, v2);
    indices.push(v1, v3, v2);
  }

  // Cerrar el bucle
  const last0 = (n - 1) * 2;
  const last1 = (n - 1) * 2 + 1;
  indices.push(last0, last1, 0);
  indices.push(last1, 1, 0);

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: positions.length / 3 > 65535 ? new Uint32Array(indices) : new Uint16Array(indices)
  };
}

export interface PulsionVectorItem {
  origin: [number, number, number];
  direction: [number, number, number];
  magnitude: number;
  u: number;
  v: number;
  phase: number;
}

export interface PulsionVectorFieldData {
  vectors: PulsionVectorItem[];
  uSteps: number;
  vSteps: number;
  count: number;
}

/**
 * Generates the directional flow vector field for the Hilo Pulsional (Trieb)
 * moving across the interior surface of the Horn Torus (v in [pi/2, 3*pi/2]).
 * Attached to the edge of curve I (body image),
 * Freud's Drang (constant push), and helical circulation around the cusp/central void.
 */
export function generatePulsionVectorFieldData(
  lacanian: LacanianCoordinates,
  sclData: SCL90RData,
  params: ModelParams,
  isDeformed: boolean,
  uSteps: number = 24,
  vSteps: number = 14,
  visualScale: number = 25.0
): PulsionVectorFieldData {
  const effectiveA = lacanian.a * visualScale;
  const effectiveDeform = isDeformed ? params.deformation_factor : 0.0;
  const phi_I = lacanian.v_I % (2 * Math.PI);
  const attachment = lacanian.pulsionAttachmentStrength;

  const vectors: PulsionVectorItem[] = [];

  // Interior manifold domain: v in [pi/2, 3*pi/2] (concave interior facing the cusp at v = pi)
  for (let iv = 0; iv < vSteps; iv++) {
    const tV = (iv + 0.5) / vSteps;
    const v = Math.PI * 0.5 + tV * Math.PI; // in (pi/2, 3*pi/2)

    for (let iu = 0; iu < uSteps; iu++) {
      const u = (iu / uSteps) * 2 * Math.PI;

      const cosV = Math.cos(v);
      const sinV = Math.sin(v);
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);

      const r0 = effectiveA * (1 + cosV);
      let x = r0 * cosU;
      let y = r0 * sinU;
      let z = effectiveA * sinV;

      // Deformation if deformed mode
      const { factor } = computeSclDeformation(u, v, sclData, effectiveDeform);
      if (isDeformed && effectiveDeform > 0) {
        x *= factor;
        y *= factor;
        z *= 1.0 + (factor - 1.0) * 0.85;
      }

      // Unit tangents along u and v
      const tu_x = -sinU;
      const tu_y = cosU;
      const tu_z = 0;

      const tv_x = -sinV * cosU;
      const tv_y = -sinV * sinU;
      const tv_z = cosV;

      // Distance to curve I (edge of the body image)
      const v_I_at_u = Math.PI + 0.48 * Math.sin(u + phi_I) + 0.12 * Math.cos(2 * u);
      const distToI = Math.abs(v - v_I_at_u);
      const weightI = Math.exp(-Math.pow(distToI / 0.55, 2));

      // Trieb Flow Direction (Drang):
      // Combines toroidal circulation (cu) and poloidal push towards/through the throat (cv)
      const cu = 0.72 + 0.38 * weightI * attachment;
      const cv = 0.68 + 0.18 * Math.sin(u) + 0.28 * weightI;

      let vx = cu * tu_x + cv * tv_x;
      let vy = cu * tu_y + cv * tv_y;
      let vz = cu * tu_z + cv * tv_z;

      const vLen = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1.0;
      vx /= vLen;
      vy /= vLen;
      vz /= vLen;

      // Magnitude modulated by proximity to I and cusp throat acceleration
      const throatProximity = 1.0 + 0.35 * Math.sin(v);
      const magnitude = (0.75 + 0.4 * weightI * attachment) * throatProximity;
      const phase = 3.0 * u + 2.0 * v;

      vectors.push({
        origin: [x, y, z],
        direction: [vx, vy, vz],
        magnitude,
        u,
        v,
        phase
      });
    }
  }

  return {
    vectors,
    uSteps,
    vSteps,
    count: vectors.length
  };
}

/**
 * Computes deformation magnitude psi(u, v) based on psychometric scores
 */
export function computeSclDeformation(
  u: number,
  v: number,
  data: SCL90RData,
  deformationFactor: number
): { factor: number; stress: number } {
  const som = data["Somatización"] || 0;
  const oc = data["Obsesión-Compulsión"] || 0;
  const psy = data["Psicoticismo"] || 0;
  const gsi = data["GSI"] || 0;
  const pst = pstGeom(data["PST"] || 0);
  const psdi = data["PSDI"] || 0;
  const dep = data["Depresión"] || 0;
  const anx = data["Ansiedad"] || 0;

  // Somatización: ondulación poloidal exterior
  const wSom = som * 0.28 * Math.cos(3 * v) * (1 + 0.35 * Math.cos(u));

  // Obsesión-Compulsión: rigidez periódica toroidal
  const wOC = oc * 0.32 * Math.sin(4 * u) * Math.cos(v);

  // Psicoticismo: distorsión en la cúspide singular v -> +-pi
  const cuspDist = Math.abs(Math.sin(v * 0.5));
  const wPsy = psy * 0.45 * Math.pow(cuspDist, 3) * Math.sin(2 * u + v);

  // GSI: dilatación volumétrica global
  const wGSI = gsi * 0.22 * (Math.cos(v) + 0.5 * Math.sin(u));

  // PST y PSDI: densidad modular y gradiente focal
  const wPST = pst * 0.15 * Math.sin(5 * v + 3 * u);
  const wPSDI = psdi * 0.20 * Math.cos(2 * v - 2 * u);

  // Ansiedad y Depresión
  const wDep = dep * 0.18 * Math.sin(v);
  const wAnx = anx * 0.14 * Math.sin(8 * u) * Math.cos(2 * v);

  const rawDeform = wSom + wOC + wPsy + wGSI + wPST + wPSDI + wDep + wAnx;
  // Saturación suave (tanh): con puntajes extremos (fuera de baremo) la perturbación
  // acumulada no invierte ni colapsa el toro; el factor queda acotado por debajo en 0.15.
  const safeScale = 1.45;
  const boundedDeform = Math.tanh(rawDeform / safeScale) * safeScale;
  const factor = Math.max(0.15, 1.0 + deformationFactor * boundedDeform);
  const stress = Math.min(1.0, Math.max(0.0, Math.abs(boundedDeform) * (1 + psdi * 0.5)));

  return { factor, stress };
}

/**
 * Computes Differential Topological Tension between standard Horn Torus (E0)
 * and deformed Horn Torus (E_def):
 * ΔE(u, v) = || r_deformed(u, v) - r_standard(u, v) || + spatial shear gradient
 * with singular cusp concentration as v -> π.
 */
export function computeDifferentialTension(
  u: number,
  v: number,
  data: SCL90RData,
  deformationFactor: number,
  effectiveA: number,
  rOverR: number = 1.0 // r/R in (0, 1]; default keeps the horn-torus base point
): {
  tension: number;
  displacementNorm: number;
  gradientMag: number;
  cuspStrain: number;
} {
  const deformScale = Math.max(0.05, deformationFactor);

  // Standard coordinates of the family member: x = (R + r·cos v)·cos u, etc.
  // With rOverR = 1 this is exactly the old horn-torus base point a·(1 + cos v).
  const tubeR = effectiveA * rOverR;
  const x0 = (effectiveA + tubeR * Math.cos(v)) * Math.cos(u);
  const y0 = (effectiveA + tubeR * Math.cos(v)) * Math.sin(u);
  const z0 = tubeR * Math.sin(v);

  // Deformed Horn Torus coordinates
  const { factor, stress } = computeSclDeformation(u, v, data, deformationFactor);
  const xDef = x0 * factor;
  const yDef = y0 * factor;
  const zDef = z0 * (1.0 + (factor - 1.0) * 0.85);

  // Euclidean displacement Δr
  const dx = xDef - x0;
  const dy = yDef - y0;
  const dz = zDef - z0;
  const displacement = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const displacementNorm = displacement / (effectiveA * deformScale + 1e-5);

  // Local spatial gradient of the deformation membrane (shear strain)
  const eps = 0.04;
  const f_u1 = computeSclDeformation(u + eps, v, data, deformationFactor).factor;
  const f_u0 = computeSclDeformation(u - eps, v, data, deformationFactor).factor;
  const f_v1 = computeSclDeformation(u, v + eps, data, deformationFactor).factor;
  const f_v0 = computeSclDeformation(u, v - eps, data, deformationFactor).factor;

  const gradU = (f_u1 - f_u0) / (2 * eps);
  const gradV = (f_v1 - f_v0) / (2 * eps);
  const gradientMag = Math.sqrt(gradU * gradU + gradV * gradV);

  // Cusp singular shear concentration:
  // As v -> π, the throat radius a*(1 + cos v) approaches 0.
  // Circumferential warping at the throat induces extreme geometric strain.
  const throatRadius = 1 + Math.cos(v); // 0 at v = π
  const cuspStrain = (Math.abs(gradU) * 1.5 + Math.abs(gradV) * 0.8) / (throatRadius + 0.18);

  // Composite topological energy difference / tension metric
  const rawTension = 0.35 * Math.min(2.5, displacementNorm) +
                     0.35 * Math.min(3.0, gradientMag * 2.0) +
                     0.30 * Math.min(3.5, cuspStrain * 0.45) +
                     0.20 * stress;

  // Calibrated normalized tension index [0, 1]
  const tension = Math.min(1.0, Math.max(0.0, rawTension / 1.75));

  return {
    tension,
    displacementNorm,
    gradientMag,
    cuspStrain
  };
}

/**
 * Generates mesh vertex and index data for standard or deformed Horn Torus
 */
export function generateHornTorusGeometry(
  params: ModelParams,
  sclData: SCL90RData,
  isDeformed: boolean,
  colorMode: ColorMapMode = 'angustia'
) {
  const { a_scale, deformation_factor, gridResolution, a_critical } = params;
  const lacanian = calculateLacanianParameters(sclData, params);
  // r/R ratio (already guarded in calculateLacanianParameters: (0, 1], 1 = horn torus)
  const rOverR = lacanian.rOverR;

  // Base radius a = a_scale * GSI scaled for standard 3D viewport (e.g. ~2.0)
  const visualScale = 25.0;
  const effectiveA = lacanian.a * visualScale; // R = revolution radius
  const tubeR = effectiveA * rOverR; // r = tube radius
  const effectiveDeform = isDeformed ? deformation_factor : 0.0;

  const numU = gridResolution;
  const numV = gridResolution;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const maxAngustia = MAX_ANGUSTIA_DISTANCE;

  // u in [0, 2*pi], v in [0, 2*pi]
  for (let i = 0; i <= numV; i++) {
    const v = (i / numV) * 2 * Math.PI; // poloidal angle

    for (let j = 0; j <= numU; j++) {
      const u = (j / numU) * 2 * Math.PI; // toroidal angle

      // Parametric equations of the torus family (R = revolution radius, r = tube radius):
      // x = (R + r·cos(v))·cos(u), y = (R + r·cos(v))·sin(u), z = r·sin(v)
      // At r/R = 1 (horn torus) this is exactly R·(1 + cos(v))·cos(u), etc.
      let x = (effectiveA + tubeR * Math.cos(v)) * Math.cos(u);
      let y = (effectiveA + tubeR * Math.cos(v)) * Math.sin(u);
      let z = tubeR * Math.sin(v);

      const { factor, stress } = computeSclDeformation(u, v, sclData, effectiveDeform);

      if (isDeformed) {
        x *= factor;
        y *= factor;
        z *= 1.0 + (factor - 1.0) * 0.85;
      }

      // Outward normal
      const cosV = Math.cos(v);
      const sinV = Math.sin(v);
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);

      let nx = cosV * cosU;
      let ny = cosV * sinU;
      let nz = sinV;

      if (isDeformed && deformation_factor > 0) {
        nx += (factor - 1) * 0.5 * cosU;
        ny += (factor - 1) * 0.5 * sinU;
        nz += (factor - 1) * 0.4 * sinV;
      }

      const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;
      nx /= nLen;
      ny /= nLen;
      nz /= nLen;

      // Angustia A(u, v) — máximo sobre las marcas de fantasía; la ruptura es
      // la unión de sus vecindades: A >= A_max − a_cr ⟺ min d_per <= a_cr.
      const angustia = calculateAngustia(u, v, lacanian.fantasyMarks);
      const isRupture = angustia >= MAX_ANGUSTIA_DISTANCE - a_critical;

      // Differential tension calculation (energy surface difference)
      const { tension: diffTension } = computeDifferentialTension(
        u,
        v,
        sclData,
        deformation_factor,
        effectiveA,
        rOverR
      );

      positions.push(x, y, z);
      normals.push(nx, ny, nz);
      uvs.push(j / numU, i / numV);

      // Color mapping
      const rgb = getVertexColor(
        angustia,
        isRupture,
        stress,
        diffTension,
        v,
        maxAngustia,
        a_critical,
        colorMode,
        rOverR
      );
      colors.push(rgb.r, rgb.g, rgb.b);
    }
  }

  // Tópica (tesis V22, Resumen v6 §4): TODA la superficie del horn torus es el Icc
  // y su pared es la censura Icc/Prcc. El Prcc NO es la pared: es el campo de
  // representaciones-palabra que entra por p (la voz), concentrado en el embudo del
  // eje y sin borde (ver prccFieldIntensity). La Cc es un umbral dentro de ese campo.
  // La partición por triángulos separa la cara interna (v en [π/2, 3π/2], la que mira
  // al volumen) de la externa solo para las vistas de pared; la superficie completa
  // vive en `indices`. Los nombres prccIndices/outerFaceIndices se conservan por
  // compatibilidad con el canvas.
  const prccIndices: number[] = [];
  const outerFaceIndices: number[] = [];

  for (let i = 0; i < numV; i++) {
    const vMid = ((i + 0.5) / numV) * 2 * Math.PI;
    // Cara interna de la pared (la que mira al volumen interior).
    const isPrccFace = Math.cos(vMid) <= 0;

    for (let j = 0; j < numU; j++) {
      const a = i * (numU + 1) + j;
      const b = (i + 1) * (numU + 1) + j;
      const c = (i + 1) * (numU + 1) + (j + 1);
      const d = i * (numU + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);

      if (isPrccFace) {
        prccIndices.push(a, b, d);
        prccIndices.push(b, c, d);
      } else {
        outerFaceIndices.push(a, b, d);
        outerFaceIndices.push(b, c, d);
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    colors: new Float32Array(colors),
    indices: new Uint32Array(indices),
    prccIndices: new Uint32Array(prccIndices),
    outerFaceIndices: new Uint32Array(outerFaceIndices),
    lacanian
  };
}

/**
 * Color mapper based on Angustia A(u, v), Rupture zones, Stress, and Differential Stress
 */
export function getVertexColor(
  angustia: number,
  isRupture: boolean,
  stress: number,
  diffTension: number,
  v: number,
  maxAngustia: number,
  aCritical: number,
  mode: ColorMapMode,
  rOverR: number = 1.0
) {
  if (mode === 'angustia') {
    // Zona de ruptura (vecindad del foco, donde A es máxima): resplandor cálido
    // que se intensifica al acercarse al foco (A → A_max).
    if (isRupture) {
      // Intensifica al acercarse al foco: A va de (A_max − A_cr) en el borde a A_max.
      const t = aCritical > 0
        ? Math.min(1, Math.max(0, (angustia - (maxAngustia - aCritical)) / aCritical))
        : 0;
      return { r: 0.98, g: 0.15 + 0.5 * t, b: 0.1 };
    }
    // Zona segura: del borde de la zona de ruptura (cian claro) al punto más
    // lejano del foco (azul profundo).
    // A decrece al alejarse de las marcas: norm = 0 en el borde de la vecindad, 1 lo más lejos.
    const borde = maxAngustia - aCritical;
    const norm = borde > 0 ? Math.min(1.0, Math.max(0.0, (borde - angustia) / borde)) : 0;
    return {
      r: 0.1 + 0.3 * (1 - norm),
      g: 0.35 + 0.45 * (1 - norm),
      b: 0.85 - 0.2 * norm
    };
  }

  if (mode === 'differential_stress') {
    // Differential Stress colormap:
    // Compares energy surface of standard torus vs deformed torus,
    // highlighting high topological tension and singular shear areas:
    // Low tension: Deep obsidian navy / sapphire (equilibrium)
    // Moderate: Electric cyan / seafoam green
    // High tension: Vibrant solar amber / flame orange
    // Critical / Peak tension: Laser magenta to glowing crimson-white core
    if (diffTension <= 0.20) {
      const t = diffTension / 0.20;
      return {
        r: 0.05 + 0.08 * t,
        g: 0.12 + 0.28 * t,
        b: 0.45 + 0.45 * t
      };
    } else if (diffTension <= 0.45) {
      const t = (diffTension - 0.20) / 0.25;
      return {
        r: 0.13 - 0.08 * t,
        g: 0.40 + 0.48 * t,
        b: 0.90 - 0.08 * t
      };
    } else if (diffTension <= 0.70) {
      const t = (diffTension - 0.45) / 0.25;
      return {
        r: 0.05 + 0.90 * t,
        g: 0.88 - 0.22 * t,
        b: 0.82 - 0.72 * t
      };
    } else if (diffTension <= 0.88) {
      const t = (diffTension - 0.70) / 0.18;
      return {
        r: 0.95 + 0.03 * t,
        g: 0.66 - 0.48 * t,
        b: 0.10 + 0.65 * t
      };
    } else {
      // Peak critical topological singularity / rupture tension
      const t = (diffTension - 0.88) / 0.12;
      return {
        r: 0.98 + 0.02 * t,
        g: 0.18 + 0.72 * t,
        b: 0.75 + 0.25 * t
      };
    }
  }

  if (mode === 'stress') {
    // Thermal stress colormap
    if (stress < 0.3) {
      return { r: 0.1, g: 0.45 + stress * 0.8, b: 0.85 };
    } else if (stress < 0.7) {
      const t = (stress - 0.3) / 0.4;
      return { r: 0.2 + 0.7 * t, g: 0.75 - 0.1 * t, b: 0.3 - 0.2 * t };
    } else {
      const t = (stress - 0.7) / 0.3;
      return { r: 0.95, g: 0.35 - 0.2 * t, b: 0.1 };
    }
  }

  if (mode === 'elevation') {
    const zNorm = 0.5 + 0.5 * Math.sin(v);
    return { r: 0.1 + 0.7 * zNorm, g: 0.4 + 0.2 * zNorm, b: 0.9 - 0.6 * zNorm };
  }

  // Curvatura gaussiana (de la versión de GitHub, generalizada a la familia r/R ≤ 1):
  // K·r² = cos v / (R/r + cos v). En el horn torus (r = R) diverge a −∞ en la cúspide.
  // - Cúspide / zona hiperbólica extrema (K << 0): magenta
  // - Silla hiperbólica (K < 0): ámbar
  // - Banda parabólica (K ≈ 0, v ≈ π/2): verde agua
  // - Domo elíptico exterior (K > 0, v ≈ 0): zafiro
  // - Vecindad de una marca de fantasía (isRupture): fucsia
  const cosV = Math.cos(v);
  const rho = 1 / Math.max(1e-6, rOverR);
  const K_norm = cosV / Math.max(0.012, rho + cosV);
  if (isRupture) {
    const t = aCritical > 0
      ? Math.min(1, Math.max(0, (angustia - (maxAngustia - aCritical)) / aCritical))
      : 0;
    return { r: 0.98, g: 0.22 + 0.35 * t, b: 0.75 - 0.45 * t };
  }
  if (K_norm < -1.8) {
    const t = Math.min(1.0, (-K_norm - 1.8) / 8.0);
    return { r: 0.85 + 0.15 * t, g: 0.08 * (1 - t), b: 0.45 + 0.45 * t };
  } else if (K_norm < -0.15) {
    const t = (-K_norm - 0.15) / 1.65;
    return { r: 0.95 - 0.10 * t, g: 0.65 - 0.50 * t, b: 0.10 + 0.30 * t };
  } else if (K_norm <= 0.20) {
    const t = (K_norm + 0.15) / 0.35;
    return { r: 0.10 + 0.15 * t, g: 0.82 - 0.12 * t, b: 0.65 + 0.25 * t };
  }
  const t = Math.min(1.0, (K_norm - 0.20) / 0.80);
  return { r: 0.08 + 0.20 * t, g: 0.40 + 0.40 * t, b: 0.95 };
}

/**
 * Computes topological and clinical metrics for HornTorusICCModel
 */
export function computeTopologicalMetrics(
  params: ModelParams,
  sclData: SCL90RData,
  baremoId: BaremoId = DEFAULT_BAREMO_ID
): TopologicalMetrics {
  const lacanian = calculateLacanianParameters(sclData, params);
  const a = lacanian.a * 25.0; // R = effectiveA
  const rOverR = lacanian.rOverR;
  const r = a * rOverR; // tube radius (visual scale)
  const isLimit = rOverR >= 1.0; // horn torus = limit object

  // --- Exact geometric invariants of the torus family (verify against the
  // acceptance table in spec_hornTorusMath_familia.txt, tolerance 1e-3) ---

  // Area A = 4·π²·R·r (at r=R: 4π²a²)
  const surfaceAreaStandard = 4 * Math.PI * Math.PI * a * r;
  // Volume V = 2·π²·R·r² (at r=R: 2π²a³)
  const volumeStandard = 2 * Math.PI * Math.PI * a * r * r;

  // Willmore energy W = π²ρ²/√(ρ²−1) with ρ = R/r > 1; → +∞ as r → R.
  const rho = a / r; // = 1/rOverR
  const willmoreEnergyStandard = isLimit
    ? Infinity
    : (Math.PI * Math.PI * rho * rho) / Math.sqrt(rho * rho - 1);

  // Curvatures are pure geometry of the surface: no SCL-90-R factors.
  // K_max = 1/(r(R+r)) at v=0; K_min = −1/(r(R−r)) at v=π (→ −∞ as r → R);
  // ⟨H⟩ = 1/(2r).
  const gaussianCurvatureMax = 1.0 / (r * (a + r));
  const gaussianCurvatureMin = isLimit ? -Infinity : -1.0 / (r * (a - r));
  const meanCurvatureAvg = 1.0 / (2 * r);

  // Regime-dependent topology. In the limit r = R the parametrization
  // collapses the inner circle {v = π} to a single point: the object is
  // T²/λ_int (a sphere with two points identified) — not a manifold, no genus.
  const esVariedad = !isLimit;
  const eulerCharacteristic = isLimit ? 1 : 0;
  const rangoH1 = isLimit ? 1 : 2;

  const delta = params.deformation_factor;
  const gsi = sclData["GSI"] || 0.85;
  const psy = sclData["Psicoticismo"] || 0.9;
  const som = sclData["Somatización"] || 0.8;
  const oc = sclData["Obsesión-Compulsión"] || 0.9;
  const psdi = sclData["PSDI"] || 1.7;
  const pst = pstGeom(sclData["PST"] || 45);

  // Deformed Area & Volume
  const areaExpansionFactor = 1.0 + delta * (0.28 * som + 0.35 * gsi + 0.20 * pst);
  const surfaceAreaDeformed = surfaceAreaStandard * areaExpansionFactor;
  const surfaceAreaDeltaPercent = ((surfaceAreaDeformed - surfaceAreaStandard) / surfaceAreaStandard) * 100;

  const volExpansion = 1.0 + delta * (0.42 * gsi - 0.18 * psy + 0.15 * oc);
  const volumeDeformed = volumeStandard * volExpansion;
  const volumeDeltaPercent = ((volumeDeformed - volumeStandard) / volumeStandard) * 100;

  // Willmore Energy W = Integral(H^2 dA)
  // Deformed W keeps the engine's clinical expansion factor, but anchored to
  // the actual W of the member (not the old fixed 2π² Clifford baseline).
  // Clamp the factor at 0: with standard = Infinity (r = R), a factor <= 0
  // would produce Infinity * 0 = NaN.
  const wDeformedFactor = Math.max(0.0, 1.0 + delta * (0.85 * psdi + 0.65 * psy));
  const willmoreEnergyDeformed = willmoreEnergyStandard * wDeformedFactor;

  // Shannon entropy
  const values = [som, oc, psy, gsi, pst, psdi];
  const sumVals = values.reduce((x, y) => x + y, 0) || 1;
  let topologicalEntropy = 0;
  values.forEach((v) => {
    const p = v / sumVals;
    if (p > 0.001) topologicalEntropy -= p * Math.log2(p);
  });

  // ICC Index
  const disharmony = (gsi * 0.3 + psy * 0.3 + oc * 0.2 + som * 0.2) * (1 + delta * 0.5);
  const iccIndex = Math.max(8.5, Math.min(99.0, (1.0 - disharmony * 0.65) * 100));

  // --- Baremo Casullo–Pérez (Adaptación UBA), población seleccionada ---
  // Las cuatro tablas (sexo × edad) viven en baremos.ts, extraídas del
  // inventario_sintomas.pdf. Nota: la fila de Psicoticismo masculina-adulta
  // que circulaba en el código tenía los valores de la columna IGS; acá va
  // la fila correcta del PDF.
  const baremo = getBaremo(baremoId);

  // T de una escala por interpolación lineal en la tabla publicada. Fuera del
  // rango publicado (T 30–80) no se extrapola: el T se acota al extremo y la
  // escala se marca fuera de baremo (antes la extrapolación daba T ≈ 188).
  const fueraDeBaremo = new Map<string, 'bajo' | 'alto'>();
  const tDeEscala = (k: keyof SCL90RData): number => {
    const r = tDeEscalaCon(baremo, k, sclData[k] ?? 0);
    if (r.lado) fueraDeBaremo.set(String(k), r.lado);
    return r.t;
  };

  // T por escala (interp. en el baremo masculino-adulto) y estado por escala.
  // T < 60: normal · T >= 60: sintomático en esa escala.
  const scaleKeys = Object.keys(baremo.tabla) as (keyof SCL90RData)[];
  let worstScale: keyof SCL90RData = "GSI";
  let worstT = -Infinity;
  const escalasClinicas: string[] = [];
  const tScores = {} as Record<keyof SCL90RData, number>;
  for (const k of scaleKeys) {
    const t = tDeEscala(k);
    tScores[k] = t;
    if (t > worstT) { worstT = t; worstScale = k; }
    if (t >= 60) escalasClinicas.push(String(k));
  }

  // Gravedad global: T del IGS (GSI) interpolado del baremo. La regla del
  // usuario: T < 60 = normal, T >= 60 = sintomático.
  const tScoreGsi = tDeEscala("GSI");
  let clinicalSeverityTier: 'Normal' | 'Leve' | 'Moderado' | 'Severo' | 'Crítico';
  if (tScoreGsi < 60) clinicalSeverityTier = 'Normal';          // T < 60: rango normal
  else if (tScoreGsi < 65) clinicalSeverityTier = 'Leve';        // T 60–65
  else if (tScoreGsi < 70) clinicalSeverityTier = 'Moderado';    // T 65–70
  else if (tScoreGsi < 80) clinicalSeverityTier = 'Severo';      // T 70–80
  else clinicalSeverityTier = 'Crítico';                    // T >= 80

  const stabilityScore = Math.max(0, Math.min(100, 100 - (delta * 40 + gsi * 35 + psy * 25)));

  // --- Ruptura psicótica fuera de baremo: IGS >= 3× el corte T=60 + Wegbreite (δ) ---
  const psychoticRupture = isPsychoticRupture(sclData, params);
  const ruptureGsiThreshold = ruptureThresholdGsi(baremoId);
  const gsiOverCutoff = gsi > 0 ? Math.min(gsi / getBaremo(baremoId).t60Gsi, 9.99) : 0;

  // --- Estado post-episodio: el toro reconfigurado ya es otra cosa ---
  // Parámetros para pensarlo, cada uno anclado a la geometría del horn torus.
  // Ver computePostEpisodeState para la derivación y las referencias.
  // (se computa al final, con el baremo ya calculado, para evitar recursión).

  // Sample Differential Stress & Topological Tension across the manifold (E_def vs E_0)
  let sumTension = 0;
  let maxTension = 0;
  let highTensionCount = 0;
  const sampleSteps = 28;
  const totalSamples = sampleSteps * sampleSteps;

  for (let i = 0; i < sampleSteps; i++) {
    const v = (i / sampleSteps) * 2 * Math.PI;
    for (let j = 0; j < sampleSteps; j++) {
      const u = (j / sampleSteps) * 2 * Math.PI;
      const { tension } = computeDifferentialTension(u, v, sclData, delta, a, rOverR);
      sumTension += tension;
      if (tension > maxTension) maxTension = tension;
      if (tension >= 0.65) highTensionCount++;
    }
  }

  const avgDifferentialTension = sumTension / totalSamples;
  const highTensionAreaPercent = (highTensionCount / totalSamples) * 100;

  return {
    baremoId,
    surfaceAreaStandard,
    surfaceAreaDeformed,
    surfaceAreaDeltaPercent,
    volumeStandard,
    volumeDeformed,
    volumeDeltaPercent,
    willmoreEnergyStandard,
    willmoreEnergyDeformed,
    meanCurvatureAvg,
    gaussianCurvatureMin,
    gaussianCurvatureMax,
    esVariedad,
    eulerCharacteristic,
    rangoH1,
    rOverR,
    tScoreGsi,
    tScores,
    fueraDeBaremo: Object.fromEntries(fueraDeBaremo),
    escalasClinicas,
    escalaMasAlterada: String(worstScale),
    tScoreEscalaMasAlterada: worstT,
    topologicalEntropy,
    iccIndex,
    clinicalSeverityTier,
    stabilityScore,
    maxDifferentialTension: maxTension,
    avgDifferentialTension,
    highTensionAreaPercent,
    lacanian,
    psychoticRupture,
    ruptureGsiThreshold,
    gsiOverCutoff,
    postEpisode: psychoticRupture ? computePostEpisodeState(sclData, escalasClinicas, params) : null
  };
}

/**
 * Estado post-episodio del toro tras la reconfiguración psicótica.
 *
 * En el episodio la voz (que integra la fantasía-angustia) sale por el orificio
 * y S, I y Pulsión se reconfiguran cubriendo toda la superficie: el toro resultante
 * "ya es otra cosa". Estos son los parámetros para pensarlo, derivados de la
 * geometría y del baremo, sin inventar clínica:
 *
 * - topologyLabel: la topología no cambia (sigue siendo el límite horn, χ = 1,
 *   H₁ = Z⟨μ⟩) pero la ESTRUCTURA sobre ella sí — lo que cambia es cómo las
 *   cintas (S, I, Pulsión) ocupan la superficie.
 * - coveragePercent: fracción del manifold cubierta por las cintas tras la
 *   reconfiguración (medida sobre la curva, % de la longitud de la superficie).
 * - fantasyIntegrated: la fantasía-angustia ya no es un punto aparte en la
 *   pared (u,v) = (π, 3π/4): en el desencadenamiento la marca queda en el
 *   medio (el orificio) y se integró a la voz que salió por él.
 * - voiceAsContinue: la voz queda como flujo emergente del orificio —
 *   la continuidad del sujeto pasa por la voz, no por la imagen (I).
 * - integrativeCapacity: índice 0–100 de capacidad integrativa post-episodio.
 *   Base = 100 − intensidad del episodio (IGS/corte, escalado) + bono por el
 *   resto de red (1 − escalas clínicas/12). NO es un pronóstico: es un
 *   parámetro del modelo para comparar episodios y configuraciones.
 * - epithelialDescription / postEpisodeLabel: lectura cualitativa para el resumen.
 * - umbauCadenaS / umbauCadenaI: Corolario II al Axioma 4 (tesis V22) — el pasaje
 *   dispersa los eslabones de las cadenas significantes de S e I y los reengancha
 *   en un ORDEN NUEVO: otra cadena, no la misma restaurada. La permutación es
 *   determinista a partir del perfil (mismo perfil → misma cadena nueva).
 *   Freud 1924: fase activa de reconstrucción (Umbau) tras el Einriß — "una nueva
 *   realidad, que ya no ofrece el mismo motivo de conflicto que la abandonada".
 */
export function computePostEpisodeState(sclData: SCL90RData, escalasClinicas: string[], params?: ModelParams): PostEpisodeState {
  const gsi = sclData["GSI"] ?? 0;
  const baremoId = params?.baremoId;
  const corteT60 = getBaremo(baremoId).t60Gsi;
  const intensity = gsi / corteT60;
  // Cintas S + I + Pulsión cubriendo la superficie completa tras la reconfiguración.
  const coveragePercent = 100;
  // Las escalas clínicas persistentes pesan sobre la capacidad integrativa
  // (viene ya calculada por el baremo: T >= 60 por escala).
  const clinicalLoad = escalasClinicas.length / 12;
  // Capacidad integrativa: la intensidad del episodio la degrada; una red con pocas
  // escalas clínicas la conserva mejor.
  const integrativeCapacity = Math.max(0, Math.min(100,
    Math.round(100 - (intensity - PSYCHOTIC_RUPTURE_FACTOR) * 25 - clinicalLoad * 20)
  ));
  // --- Corolario II (Umbau): dispersión y reenganche de las cadenas de S e I ---
  // Los eslabones se dispersan de su orden cíclico original (s1..s8, i1..i8) y se
  // reenganchan en un orden NUEVO: rotación k + salto k2 dependientes de la carga
  // clínica y la intensidad (deterministas). El par queda expuesto para que la UI
  // muestre el rótulo del reenganche.
  const k1 = 2 + (clinicalLoad >= 0.5 ? 1 : 0) + (escalasClinicas.includes("Psicoticismo") ? 1 : 0);
  const k2 = 3 + (intensity >= 4 ? 2 : 0);
  const umbauCadenaS = {
    labels: UMBAU_ESLABONES.map((_, i) => `s${((i + k1) % UMBAU_N) + 1}`),
    reenganche: `s1→s${k1 + 1}, s2→s${k1 + 2}, … (rotación ${k1}; salto ${k2})`,
  };
  const umbauCadenaI = {
    labels: UMBAU_ESLABONES.map((_, i) => `i${((i + k1) % UMBAU_N) + 1}`),
    reenganche: `i1→i${k1 + 1}, i2→i${k1 + 2}, … (rotación ${k1}; salto ${k2})`,
  };
  return {
    topologyLabel: "Horn torus límite (χ=1, H₁=Z⟨μ⟩) — misma topología, otra estructura",
    coveragePercent,
    fantasyIntegrated: true,
    voiceAsContinue: true,
    integrativeCapacity,
    episodeIntensity: intensity,
  clinicalLoad,
    umbauCadenaS,
    umbauCadenaI,
    postEpisodeLabel: intensity > 4.5
      ? "Reconfiguración total — la superficie quedó estructurada alrededor del orificio (por donde salió la voz)"
      : "Reconfiguración completa — la superficie quedó organizada alrededor del orificio (por donde salió la voz)"
  };
}

/**
 * Formats a possibly-infinite metric for display: '∞' for ±Infinity, '-'
 * for NaN/undefined, fixed decimals otherwise. Prevents NaN/garbage in the
 * summary and the UI when the horn-torus limit (W = ∞, K_min = −∞) is shown.
 */
export function formatMetric(value: number, decimals: number = 4): string {
  if (value === Infinity) return "∞";
  if (value === -Infinity) return "−∞";
  if (!Number.isFinite(value)) return "-";
  
  return value.toFixed(decimals);
}

/** T de una escala para el resumen: "> 80" / "< 30" fuera del baremo publicado. */
function formatTScore(metrics: TopologicalMetrics, escala: string, t: number): string {
  const lado = metrics.fueraDeBaremo[escala];
  if (lado === 'alto') return '> 80, fuera de baremo';
  if (lado === 'bajo') return '< 30, fuera de baremo';
  return `≈ ${t.toFixed(1)}`;
}

/**
 * Generates the full string output for model.print_model_summary()
 */
export function generateModelSummaryText(
  sclData: SCL90RData,
  params: ModelParams,
  metrics: TopologicalMetrics
): string {
  const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const lac = metrics.lacanian;

  return `================================================================================
          HORN TORUS ICC MODEL (TOPOLOGICAL INCONSCIENT & SCL-90-R)
================================================================================
Timestamp: ${dateStr} UTC
Manifold: ${metrics.rOverR >= 1 ? "Horn Torus [R = r = a, Cusp Point (0,0,0) at v = π]" : `Toro liso de la familia [R = a, r = ${(metrics.rOverR * 100).toFixed(1)}% · a, agujero R − r > 0]`}
Radio a (a_scale * GSI):           ${lac.a.toFixed(5)}  [a_scale=${params.a_scale}, GSI=${sclData["GSI"].toFixed(3)}]
Escalas Angulares:                 u_scale=${params.u_scale.toFixed(4)} rad, v_scale=${params.v_scale.toFixed(4)} rad
Factor de Deformación (δ):         ${params.deformation_factor.toFixed(4)}
Umbral Crítico de Angustia (A_cr): ${params.a_critical.toFixed(4)} rad (π / 4)

[1] TOPOLOGÍA LACANIANA DEL HORN TORUS:
--------------------------------------------------------------------------------
  * Tópica: Icc = TODA la superficie · pared = censura Icc/Prcc (límite nítido)
    · Prcc = campo que entra por la voz (p), concentrado en el embudo del eje, sin borde
    · Cc = umbral de sobreinvestidura dentro de ese campo, no un lugar (AXIOMA; GW XIII, GW X)
  * p — punto de autotangencia: la voz, de doble sentido (entra lo oído, sale la voz)
    -> Actividad de la cinta S en p: ${(lac.earCuspActivity * 100).toFixed(1)}%
  * Proximidad de S a la marca más cercana: ${lac.distanceSignifierToFantasy.toFixed(4)} rad ${lac.isTraumaReactivated ? '(dentro de A_cr: aproximación → angustia señal)' : '(fuera de A_cr)'}
  * Cintas Entrecruzadas en el Interior:

  * S (Simbólico / Significante): u_S = ${lac.u_S.toFixed(4)} rad | v_S = ${lac.v_S.toFixed(4)} rad
    -> Función: Cadena significante. Ansiedad (${sclData["Ansiedad"].toFixed(2)}) + Obsesión (${sclData["Obsesión-Compulsión"].toFixed(2)})
    -> Color en Visualizador: ROJO (Crimson Ribbon)

  * I (Imaginario / Imagen del Cuerpo): u_I = ${lac.u_I.toFixed(4)} rad | v_I = ${lac.v_I.toFixed(4)} rad
    -> Función: Umbral — el organismo inscripto como imagen del cuerpo (no lo somático mismo). Asignación: Somatización (${sclData["Somatización"].toFixed(2)}) + Sensibilidad (${sclData["Sensibilidad Interpersonal"].toFixed(2)})
    -> Color en Visualizador: VERDE (Emerald Ribbon)

  * Hilo Pulsional (Trieb · Drang): PEGADO AL BORDE DE I
    -> Adherencia al borde de I = ${(lac.pulsionAttachmentStrength * 100).toFixed(1)}%
    -> Función: Empuje constante (Drang), nunca ligado a un evento puntual — AXIOMA.
    -> Color en Visualizador: DORADO / ÁMBAR (Golden Braid)

  * Σ (Síntoma): u_Σ = ${lac.u_Sigma.toFixed(4)} rad | v_Σ = ${lac.v_Sigma.toFixed(4)} rad
    -> Función: Síntoma. Asignación (AXIOMA): Psicoticismo (${sclData["Psicoticismo"].toFixed(2)}) + Hostilidad (${sclData["Hostilidad"].toFixed(2)})
    -> Color en Visualizador: AZUL COBALTO (Cobalt Ribbon)

  * Marcas de Fantasía [la angustia surge por proximidad — AXIOMA · Resumen §8: N marcas, una por trauma]: ${lac.fantasyMarks.length}
${lac.fantasyMarks.map((m, i) => `    -> Marca ${i + 1}: (u, v) = (${m.u.toFixed(3)}, ${m.v.toFixed(3)}) · 3D: (${lac.fantasyMarks3D[i][0].toFixed(4)}, ${lac.fantasyMarks3D[i][1].toFixed(4)}, ${lac.fantasyMarks3D[i][2].toFixed(4)})`).join('\n')}
    -> Angustia crítica: A ≥ A_max − A_cr = ${(MAX_ANGUSTIA_DISTANCE - Math.PI / 4).toFixed(2)} — UNIÓN de las vecindades de radio A_cr = π/4 (AXIOMA)
    -> Puntos de Ruptura (A ≥ A_max − A_cr, % ponderado por área): ${lac.ruptureCount} nodos (${lac.ruptureAreaPercent.toFixed(2)}% del área)${params.sigmaPantalla
      ? `
    -> Σ como PANTALLA (tesis Cap. 7): la banda del síntoma intercepta ${((lac.sigmaPantallaFraccion ?? 0) * 100).toFixed(1)}% de la zona de angustia
         y la desvía de las marcas de fantasía — sin pantalla sería ${lac.ruptureAreaPercentSinPantalla?.toFixed(2)}% del área.`
      : `
    -> Σ como mero ANUDAMIENTO (tesis Cap. 7): no incide en dónde se producen los cruces;
         la banda del síntoma cubriría ${((lac.sigmaPantallaFraccion ?? 0) * 100).toFixed(1)}% de la zona, pero los cruces llegan a las marcas.`}

[2] VECTOR PSICOMÉTRICO SCL-90-R (DEROGATIS):
--------------------------------------------------------------------------------
  * Somatización (SOM):                ${sclData["Somatización"].toFixed(3)}
  * Obsesión-Compulsión (O-C):          ${sclData["Obsesión-Compulsión"].toFixed(3)}
  * Sensibilidad Interpersonal (I-S):   ${sclData["Sensibilidad Interpersonal"].toFixed(3)}
  * Depresión (DEP):                    ${sclData["Depresión"].toFixed(3)}
  * Ansiedad (ANX):                     ${sclData["Ansiedad"].toFixed(3)}
  * Hostilidad (HOS):                   ${sclData["Hostilidad"].toFixed(3)}
  * Ansiedad Fóbica (PHOB):             ${sclData["Ansiedad Fóbica"].toFixed(3)}
  * Ideación Paranoide (PAR):           ${sclData["Ideación Paranoide"].toFixed(3)}
  * Psicoticismo (PSY):                 ${sclData["Psicoticismo"].toFixed(3)}
  * Global Severity Index (GSI):        ${sclData["GSI"].toFixed(3)}
  * Positive Symptom Total (PST):       ${sclData["PST"].toFixed(3)}
  * Positive Symptom Distress (PSDI):   ${sclData["PSDI"].toFixed(3)}

  * BAREMO CASULLO–PÉREZ (${getBaremo(metrics.baremoId).fuente}, T=60 = corte):
    -> T del IGS (GSI):                 ${formatTScore(metrics, "GSI", metrics.tScoreGsi)}  ${metrics.tScoreGsi < 60 ? "(T < 60: rango normal)" : "(T >= 60: sintomático)"}
    -> Escalas con T >= 60:             ${metrics.escalasClinicas.length === 0 ? "ninguna — perfil normal" : metrics.escalasClinicas.join(", ")}
    -> Escala más alterada:             ${metrics.escalaMasAlterada} (T ${formatTScore(metrics, metrics.escalaMasAlterada, metrics.tScoreEscalaMasAlterada)})${Object.keys(metrics.fueraDeBaremo).length > 0 ? `
    -> Fuera del baremo publicado:      ${Object.entries(metrics.fueraDeBaremo).map(([k, lado]) => `${k} (${lado === 'alto' ? '> 80' : '< 30'})`).join(", ")}` : ""}
${metrics.psychoticRupture
      ? `  * ¡RUPTURA DEL MODELO FUERA DE BAREMO! (secuencia: AXIOMA; el PSY del SCL-90-R no mide estructura)
      -> IGS = ${sclData["GSI"].toFixed(2)} = ${(metrics.gsiOverCutoff).toFixed(1)}× el corte T=60 (umbral: 3.00× = IGS ${metrics.ruptureGsiThreshold.toFixed(2)}).
      -> Corolario I — Wegbreite: cruce de anchura suficiente (deformation_factor ≥ π/6 ≈ 0.52; actual = ${params.deformation_factor.toFixed(2)}).
         Un cruce angosto (δ bajo el techo) se disipa aunque la cantidad (IGS) alcance el umbral — Entwurf (1895):
         la anchura de vía es independiente de la cantidad y de la resistencia, y permanece constante.
      -> La configuración S, I y Pulsión se rompe: eyectada por el orificio (cúspide v=π, origen)
         por donde sale la voz, y luego se reconfigura cubriendo toda la superficie.
`
      : ""}${metrics.postEpisode
      ? `  * POST-EPISODIO — EL TORO YA ES OTRA COSA:
      -> ${metrics.postEpisode.topologyLabel}
      -> Cobertura de cintas tras reconfiguración: ${metrics.postEpisode.coveragePercent}% del manifold.
      -> Fantasía: integrada a la voz que salió por el orificio (AXIOMA, a fundar).
      -> Continuidad del sujeto: por la voz (flujo emergente del orificio), no por la imagen I.
      -> Corolario II — Umbau: cadenas dispersas y reenganchadas en un orden NUEVO —
         S: ${metrics.postEpisode.umbauCadenaS.reenganche}
         I: ${metrics.postEpisode.umbauCadenaI.reenganche}
         (otra cadena, no la misma restaurada — Freud 1924: Umbau tras el Einriß).
      -> Capacidad integrativa post-episodio: ${metrics.postEpisode.integrativeCapacity}/100
         (intensidad ${metrics.postEpisode.episodeIntensity.toFixed(2)}× corte · carga clínica ${(metrics.postEpisode.clinicalLoad * 100).toFixed(0)}% de escalas con T>=60).
      -> ${metrics.postEpisode.postEpisodeLabel}
`
      : ""}
[3] INVARIANTES TOPOLÓGICOS Y ENERGÉTICOS:
--------------------------------------------------------------------------------
  * Característica de Euler (χ):        ${metrics.eulerCharacteristic} (${metrics.esVariedad ? "Toro liso encajado — H1 = Z²⟨μ, λ⟩, rango " + metrics.rangoH1 : "Horn Torus límite, NO variedad — H1 = Z⟨μ⟩, rango " + metrics.rangoH1 + "; género indefinido"})
  * Área Superficial Estándar:          ${metrics.surfaceAreaStandard.toFixed(4)} u²
  * Área Superficial Deformada:         ${metrics.surfaceAreaDeformed.toFixed(4)} u² (${metrics.surfaceAreaDeltaPercent >= 0 ? '+' : ''}${metrics.surfaceAreaDeltaPercent.toFixed(2)}%)
  * Volumen Encerrado Estándar:         ${metrics.volumeStandard.toFixed(4)} u³
  * Volumen Encerrado Deformado:        ${metrics.volumeDeformed.toFixed(4)} u³ (${metrics.volumeDeltaPercent >= 0 ? '+' : ''}${metrics.volumeDeltaPercent.toFixed(2)}%)
  * Energía de Willmore W = ∫H² dA:     ${formatMetric(metrics.willmoreEnergyDeformed)} (Base: ${formatMetric(metrics.willmoreEnergyStandard)})
  * Tensión Topológica Diferencial ΔE:  Promedio: ${(metrics.avgDifferentialTension * 100).toFixed(1)}% | Máxima: ${(metrics.maxDifferentialTension * 100).toFixed(1)}%
  * Área de Alta Tensión (τ ≥ 0.65):    ${metrics.highTensionAreaPercent.toFixed(1)}% del Manifold
  * Índice ICC (compuesto, AXIOMA):    ${metrics.iccIndex.toFixed(2)} %
  * Nivel de malestar (T del IGS):     [ ${metrics.clinicalSeverityTier.toUpperCase()} ]  (no es diagnóstico de estructura)
    ${lac.ruptureAreaPercent > 12.0 ? '-> ALERTA: zona de proximidad a la marca de fantasía expandida.' : '-> Zona de proximidad acotada: trayectorias S, I y Σ delimitadas.'}
================================================================================`;
}

/**
 * Returns exact standalone Python code for horn_torus_icc_model.py
 * complete with all classes, methods, curves, and plotting functions
 */
export function generatePythonScript(sclData: SCL90RData, params: ModelParams): string {
  return `#!/usr/bin/env python3
"""
Modelo 3D del Horn Torus para el Icc (Inconsciente)
Integra resultados del test psicométrico SCL-90-R de Derogatis
con variables S (Significante), I (Imagen del cuerpo), Σ (Síntoma)
y la fantasía como punto de angustia.
"""

import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib.colors import Normalize
from matplotlib.cm import ScalarMappable

class HornTorusICCModel:
    """
    Clase principal para modelar y visualizar el Horn Torus del Icc
    con datos del SCL-90-R.
    """

    def __init__(self, scl90r_data=None, a_scale=0.1, u_scale=2*np.pi, v_scale=np.pi, sigma_pantalla=False):
        # Datos por defecto del SCL-90-R (dimensiones 0–4; PST = conteo 0–90; IGS = PST·PSDI/90)
        self.default_scl90r_data = {
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
            "PSDI": 1.70
        }

        self.scl90r_data = scl90r_data if scl90r_data else self.default_scl90r_data
        self.a_scale = a_scale
        self.u_scale = u_scale
        self.v_scale = v_scale
        # Pregunta abierta de la tesis (Cap. 7): ¿Σ como pantalla que desvía los
        # cruces de las marcas o mero anudamiento? Conmutable.
        self.sigma_pantalla = sigma_pantalla

        # Parámetros del modelo
        self.a = None
        self.u_S = None
        self.v_S = None
        self.u_I = None
        self.v_I = None
        self.u_Sigma = None
        self.v_Sigma = None
        self.fantasy_point = None
        # Marcas de fantasía (Resumen §8: una o varias — una por trauma)
        self.n_fantasy_marks = 1
        self.fantasy_marks = []

        # Umbral de angustia
        self.A_cr = np.pi / 4

        # Calcular parámetros
        self._calculate_parameters()

    def _calculate_parameters(self):
        """Calcula todos los parámetros del modelo a partir de los datos del SCL-90-R."""
        # Radio a (escalado por GSI)
        self.a = self.a_scale * self.scl90r_data.get("GSI", 0.85)

        # Parámetro u para S (Significante): basado en Ansiedad y Obsesión
        anxiety = self.scl90r_data.get("Ansiedad", 0.95)
        obsession = self.scl90r_data.get("Obsesión-Compulsión", 0.9)
        num_scales = len([k for k in self.scl90r_data.keys() if k not in ["GSI", "PST", "PSDI"]])
        self.u_S = self.u_scale * (anxiety + obsession) / num_scales

        # Parámetro v para S: basado en PSDI
        psdi = self.scl90r_data.get("PSDI", 1.7)
        self.v_S = self.v_scale * (1 + psdi)

        # Parámetro u para I (Imagen del cuerpo): basado en Somatización y Sensibilidad Interpersonal
        somatization = self.scl90r_data.get("Somatización", 0.8)
        interpersonal = self.scl90r_data.get("Sensibilidad Interpersonal", 0.7)
        self.u_I = self.u_scale * (somatization + interpersonal) / num_scales

        # Parámetro v para I: basado en PST
        # PST (0–90) llevado a la escala 0–4 de las demás puntuaciones
        pst = self.scl90r_data.get("PST", 45) / 22.5
        self.v_I = self.v_scale * (1 + pst)

        # Parámetro u para Σ (Síntoma): basado en Psicoticismo y Hostilidad
        psychoticism = self.scl90r_data.get("Psicoticismo", 0.9)
        hostility = self.scl90r_data.get("Hostilidad", 0.6)
        self.u_Sigma = self.u_scale * (psychoticism + hostility) / num_scales

        # Parámetro v para Σ: basado en Psicoticismo
        self.v_Sigma = self.v_scale * (1 + psychoticism)

        # Marcas de fantasía (Resumen §8 resuelto: N marcas, una por trauma).
        # La marca vive en la PARED (cara interna): en la configuración neurótica
        # la angustia surge cuando la pulsión pasa cerca. SOLO en el
        # desencadenamiento la marca queda en el medio (el orificio).
        self.n_fantasy_marks = int(${JSON.stringify(params.fantasyMarkCount ?? 1)})
        self.fantasy_marks = [(np.pi, 3 * np.pi / 4)]
        for m in range(1, self.n_fantasy_marks):
            self.fantasy_marks.append((np.pi + m * 1.9, 3 * np.pi / 4 + 0.35 * np.sin(m * 2.1)))
        self.fantasy_point = self.fantasy_marks[0]

    def horn_torus_surface(self, u_resolution=100, v_resolution=100):
        """Genera la superficie paramétrica del horn torus."""
        u = np.linspace(0, 2 * np.pi, u_resolution)
        v = np.linspace(0, 2 * np.pi, v_resolution)
        u, v = np.meshgrid(u, v)

        # Ecuaciones paramétricas del horn torus (R = r = a)
        x = self.a * (1 + np.cos(v)) * np.cos(u)
        y = self.a * (1 + np.cos(v)) * np.sin(u)
        z = self.a * np.sin(v)

        return x, y, z, u, v

    def calculate_angustia(self, u, v):
        """A(u, v): intensidad de angustia — AXIOMA. Máximo sobre las N marcas de
        fantasía (Resumen §8): basta pasar cerca de una. A = máx(A_max − d_per).
        La ruptura es la UNIÓN de las vecindades: A >= A_max − A_cr."""
        best = np.zeros_like(np.asarray(u, dtype=float) + np.asarray(v, dtype=float))
        for u_F, v_F in self.fantasy_marks:
            du = np.abs(u - u_F) % (2 * np.pi)
            dv = np.abs(v - v_F) % (2 * np.pi)
            du = np.minimum(du, 2 * np.pi - du)
            dv = np.minimum(dv, 2 * np.pi - dv)
            a = np.pi * np.sqrt(2) - np.hypot(du, dv)
            best = np.maximum(best, a)
        return best

    def get_curves(self, u_points=100):
        """Genera las curvas S, I, Σ sobre la superficie del horn torus."""
        u_vals = np.linspace(0, 2 * np.pi, u_points)

        # Curva S (Significante)
        v_vals_S = np.full_like(u_vals, self.v_S)
        x_S = self.a * (1 + np.cos(v_vals_S)) * np.cos(u_vals)
        y_S = self.a * (1 + np.cos(v_vals_S)) * np.sin(u_vals)
        z_S = self.a * np.sin(v_vals_S)

        # Curva I (Imagen del cuerpo)
        v_vals_I = np.full_like(u_vals, self.v_I)
        x_I = self.a * (1 + np.cos(v_vals_I)) * np.cos(u_vals)
        y_I = self.a * (1 + np.cos(v_vals_I)) * np.sin(u_vals)
        z_I = self.a * np.sin(v_vals_I)

        # Curva Σ (Síntoma)
        v_vals_Sigma = np.full_like(u_vals, self.v_Sigma)
        x_Sigma = self.a * (1 + np.cos(v_vals_Sigma)) * np.cos(u_vals)
        y_Sigma = self.a * (1 + np.cos(v_vals_Sigma)) * np.sin(u_vals)
        z_Sigma = self.a * np.sin(v_vals_Sigma)

        return {
            'S': {'x': x_S, 'y': y_S, 'z': z_S, 'color': 'red', 'label': 'S (Significante)'},
            'I': {'x': x_I, 'y': y_I, 'z': z_I, 'color': 'green', 'label': 'I (Imagen del cuerpo)'},
            'Σ': {'x': x_Sigma, 'y': y_Sigma, 'z': z_Sigma, 'color': 'blue', 'label': 'Σ (Síntoma)'}
        }

    def get_fantasy_point_3d(self):
        """Obtiene las coordenadas 3D del punto de fantasía."""
        u_F, v_F = self.fantasy_point
        x = self.a * (1 + np.cos(v_F)) * np.cos(u_F)
        y = self.a * (1 + np.cos(v_F)) * np.sin(u_F)
        z = self.a * np.sin(v_F)
        return x, y, z

    def find_rupture_points(self, u_resolution=50, v_resolution=50):
        """Encuentra los puntos donde la angustia supera el umbral crítico (rupturas)."""
        u = np.linspace(0, 2 * np.pi, u_resolution)
        v = np.linspace(0, 2 * np.pi, v_resolution)
        u_grid, v_grid = np.meshgrid(u, v)
        
        angustia = self.calculate_angustia(u_grid, v_grid)
        rupture_mask = angustia >= (np.pi * np.sqrt(2) - self.A_cr)  # vecindad del foco: d_per <= A_cr
        
        # Pregunta abierta (tesis Cap. 7): Σ como pantalla intercepta los cruces en
        # su banda (v = π + 0.58·sin(2u + φ_Σ), semiancho 0.35) y los desvía de las
        # marcas; como mero anudamiento los cruces llegan a las marcas.
        if self.sigma_pantalla:
            phi_sigma = self.v_Sigma % (2 * np.pi)
            banda = np.abs((v_grid - (np.pi + 0.58 * np.sin(2 * u_grid + phi_sigma)) + np.pi) % (2 * np.pi) - np.pi) <= 0.35
            rupture_mask = rupture_mask & ~banda
        
        x = self.a * (1 + np.cos(v_grid)) * np.cos(u_grid)
        y = self.a * (1 + np.cos(v_grid)) * np.sin(u_grid)
        z = self.a * np.sin(v_grid)
        
        return x[rupture_mask], y[rupture_mask], z[rupture_mask], angustia[rupture_mask]

    def print_model_summary(self):
        """Imprime un resumen completo de las variables del modelo."""
        print("=" * 72)
        print("          HORN TORUS ICC MODEL SUMMARY (SCL-90-R & LACAN)")
        print("=" * 72)
        print(f"Radio a (a_scale * GSI): {self.a:.5f}")
        print(f"Curva S (Significante):      u_S={self.u_S:.4f}, v_S={self.v_S:.4f}")
        print(f"Curva I (Imagen del cuerpo): u_I={self.u_I:.4f}, v_I={self.v_I:.4f}")
        print(f"Curva Σ (Síntoma):           u_Σ={self.u_Sigma:.4f}, v_Σ={self.v_Sigma:.4f}")
        x_f, y_f, z_f = self.get_fantasy_point_3d()
        print(f"Punto Fantasía 3D:           ({x_f:.4f}, {y_f:.4f}, {z_f:.4f})")
        print(f"Umbral Crítico de Angustia:  {self.A_cr:.4f} rad")
        print("-" * 72)
        print("Datos SCL-90-R:")
        for k, val in self.scl90r_data.items():
            print(f"  * {k:<26}: {val:.3f}")
        print("=" * 72)

    def plot_3d_model(self, save_path='mi_modelo.png'):
        """Visualiza y guarda el modelo 3D del Horn Torus con curvas S, I, Σ."""
        fig = plt.figure(figsize=(12, 9), dpi=150)
        ax = fig.add_subplot(111, projection='3d')

        x, y, z, u, v = self.horn_torus_surface()
        angustia = self.calculate_angustia(u, v)

        # Superficie coloreada por angustia
        norm = Normalize(vmin=angustia.min(), vmax=angustia.max())
        surf = ax.plot_surface(
            x, y, z,
            facecolors=plt.cm.viridis(norm(angustia)),
            alpha=0.65,
            edgecolor='none',
            antialiased=True
        )

        # Curvas S, I, Σ
        curves = self.get_curves()
        for name, data in curves.items():
            ax.plot(data['x'], data['y'], data['z'], color=data['color'], linewidth=2.5, label=data['label'])

        # Punto de Fantasía
        xf, yf, zf = self.get_fantasy_point_3d()
        ax.scatter([xf], [yf], [zf], color='magenta', s=120, edgecolors='black', label='Marca de fantasía')

        ax.set_title("Horn Torus del Icc: Curvas S, I, Σ y Fantasía", fontsize=14, pad=12)
        ax.set_xlabel('X')
        ax.set_ylabel('Y')
        ax.set_zlabel('Z')
        ax.legend(loc='upper right')

        plt.colorbar(ScalarMappable(norm=norm, cmap='viridis'), ax=ax, shrink=0.5, aspect=10, label='Angustia A(u, v)')
        plt.tight_layout()
        plt.savefig(save_path, bbox_inches='tight')
        print(f"[✓] Guardado en '{save_path}'")
        plt.close()

    def plot_deformed_model(self, deformation_factor=0.3, save_path='mi_modelo_deformado.png'):
        """Visualiza y guarda el modelo con perturbación sintomática psicométrica."""
        fig = plt.figure(figsize=(12, 9), dpi=150)
        ax = fig.add_subplot(111, projection='3d')

        x, y, z, u, v = self.horn_torus_surface()
        angustia = self.calculate_angustia(u, v)

        # Deformación armónica basada en SCL-90-R
        som = self.scl90r_data.get("Somatización", 0.8)
        psy = self.scl90r_data.get("Psicoticismo", 0.9)
        oc = self.scl90r_data.get("Obsesión-Compulsión", 0.9)
        deform = 1.0 + deformation_factor * (som * 0.25 * np.cos(3*v) + oc * 0.25 * np.sin(4*u) + psy * 0.35 * np.sin(u + v))

        xd = x * deform
        yd = y * deform
        zd = z * (1.0 + (deform - 1.0) * 0.8)

        norm = Normalize(vmin=angustia.min(), vmax=angustia.max())
        ax.plot_surface(
            xd, yd, zd,
            facecolors=plt.cm.plasma(norm(angustia)),
            alpha=0.75,
            edgecolor='k',
            linewidth=0.1,
            antialiased=True
        )

        curves = self.get_curves()
        for name, data in curves.items():
            ax.plot(data['x'], data['y'], data['z'], color=data['color'], linewidth=3.0, label=data['label'])

        xf, yf, zf = self.get_fantasy_point_3d()
        ax.scatter([xf], [yf], [zf], color='yellow', s=140, edgecolors='black', label='Marca de fantasía')

        ax.set_title(f"Horn Torus Deformado por Síntoma (Factor δ={deformation_factor})", fontsize=14, pad=12)
        ax.set_xlabel('X')
        ax.set_ylabel('Y')
        ax.set_zlabel('Z')
        ax.legend(loc='upper right')

        plt.colorbar(ScalarMappable(norm=norm, cmap='plasma'), ax=ax, shrink=0.5, aspect=10, label='Angustia A(u, v)')
        plt.tight_layout()
        plt.savefig(save_path, bbox_inches='tight')
        print(f"[✓] Guardado en '{save_path}'")
        plt.close()

if __name__ == '__main__':
    scl90r_data = {
        "Somatización": ${sclData["Somatización"]},
        "Obsesión-Compulsión": ${sclData["Obsesión-Compulsión"]},
        "Sensibilidad Interpersonal": ${sclData["Sensibilidad Interpersonal"]},
        "Depresión": ${sclData["Depresión"]},
        "Ansiedad": ${sclData["Ansiedad"]},
        "Hostilidad": ${sclData["Hostilidad"]},
        "Ansiedad Fóbica": ${sclData["Ansiedad Fóbica"]},
        "Ideación Paranoide": ${sclData["Ideación Paranoide"]},
        "Psicoticismo": ${sclData["Psicoticismo"]},
        "GSI": ${sclData["GSI"]},
        "PST": ${sclData["PST"]},
        "PSDI": ${sclData["PSDI"]}
    }

    model = HornTorusICCModel(scl90r_data=scl90r_data, a_scale=${params.a_scale}, sigma_pantalla=${params.sigmaPantalla === true ? 'True' : 'False'})
    model.print_model_summary()
    model.plot_3d_model(save_path='mi_modelo.png')
    model.plot_deformed_model(deformation_factor=${params.deformation_factor}, save_path='mi_modelo_deformado.png')
`;
}

// ============================================================================
// Fusión con la versión de GitHub (15–18/9): carga por puntajes T, animación de
// la deformación, curvatura gaussiana, singularidades espectrales, visor HTML.
// Internamente todo sigue en puntajes directos (PD); los T se convierten con el
// baremo de la población elegida.
// ============================================================================

/** Techo teórico de PD por escala: dimensiones e IGS/PSDI en 0–4, PST en 0–90. */
function pdTecho(k: keyof SCL90RData): number {
  return k === 'PST' ? SCL90R_TOTAL_ITEMS : 4;
}

/**
 * PD que corresponde a un puntaje T en el baremo (inversa de tDeEscalaCon).
 * Dentro de la tabla publicada (T 30–80) interpola; por encima de T=80 extrapola con
 * la pendiente del último tramo (fuera de baremo) y acota al techo teórico de la escala.
 */
export function pdDesdeT(k: keyof SCL90RData, t: number, baremoId?: BaremoId): number {
  const tabla = getBaremo(baremoId).tabla[k];
  if (!tabla || tabla.length === 0) return 0;
  const [pFirst, tFirst] = tabla[0];
  const [pLast, tLast] = tabla[tabla.length - 1];
  if (t <= tFirst) return pFirst;
  if (t >= tLast) {
    let i = tabla.length - 2;
    while (i > 0 && tabla[i][0] >= pLast) i--;
    const [pPrev, tPrev] = tabla[i];
    const slope = tLast > tPrev ? (pLast - pPrev) / (tLast - tPrev) : 0;
    return Math.min(pdTecho(k), pLast + (t - tLast) * slope);
  }
  for (let i = 0; i < tabla.length - 1; i++) {
    const [pA, tA] = tabla[i];
    const [pB, tB] = tabla[i + 1];
    if (t <= tB) return tB > tA ? pA + ((t - tA) / (tB - tA)) * (pB - pA) : pB;
  }
  return pLast;
}

/** Convierte un protocolo informado en puntajes T a PD (modo de carga 't_scores'). */
export function sclDataDesdeTScores(
  tScores: Record<keyof SCL90RData, number>,
  baremoId?: BaremoId
): SCL90RData {
  const out = {} as SCL90RData;
  for (const k of Object.keys(tScores) as (keyof SCL90RData)[]) {
    const pd = pdDesdeT(k, tScores[k], baremoId);
    out[k] = k === 'PST' ? Math.round(pd) : parseFloat(pd.toFixed(2));
  }
  return out;
}

/** T de cada escala a partir de PD, con el baremo elegido (acotado a la tabla publicada). */
export function sclDataToTScores(data: SCL90RData, baremoId?: BaremoId): Record<keyof SCL90RData, number> {
  const baremo = getBaremo(baremoId);
  const out = {} as Record<keyof SCL90RData, number>;
  for (const k of Object.keys(data) as (keyof SCL90RData)[]) {
    out[k] = Math.round(tDeEscalaCon(baremo, k, data[k] ?? 0).t);
  }
  return out;
}

/** Filas del baremo (T 30…80 × escalas) para mostrar la tabla normativa en la UI. */
export function normRowsDeBaremo(baremoId?: BaremoId): CasulloPerezNormRow[] {
  const tabla = getBaremo(baremoId).tabla;
  const ts = tabla['GSI'].map(([, t]) => t);
  const pd = (k: keyof SCL90RData, t: number) => (tabla[k].find(([, tt]) => tt === t)?.[0] ?? 0);
  return ts.map((T) => ({
    T,
    SOM: pd('Somatización', T), OBS: pd('Obsesión-Compulsión', T), SI: pd('Sensibilidad Interpersonal', T),
    DEP: pd('Depresión', T), ANS: pd('Ansiedad', T), HOS: pd('Hostilidad', T), FOB: pd('Ansiedad Fóbica', T),
    PAR: pd('Ideación Paranoide', T), PSIC: pd('Psicoticismo', T), IGS: pd('GSI', T), TSP: pd('PST', T),
    IMSP: pd('PSDI', T),
  }));
}

/** Compatibilidad con la versión de GitHub: la tabla masculina adulta (25–60). */
export const BAREMO_CASULLO_PEREZ_2008_VARONES: CasulloPerezNormRow[] = normRowsDeBaremo('m_adultos');

/**
 * Lectura del puntaje T con la regla del baremo (T < 60 normal · T ≥ 60 sintomático ·
 * T ≥ 63 en riesgo). Por encima de T = 80 el puntaje excede la tabla publicada: se
 * marca como fuera de baremo, sin inferir estructura clínica a partir del número.
 */
export function getTScoreInterpretation(tScore: number): TScoreCategory {
  if (tScore < 60) {
    return {
      tier: 'Normal', rangeLabel: 'T < 60 (Normal)',
      badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80', textColor: 'text-emerald-400',
      description: 'Rango normal del baremo (T < 60; media poblacional 50).'
    };
  } else if (tScore < 63) {
    return {
      tier: 'Leve', rangeLabel: 'T 60-62 (Sintomático)',
      badgeClass: 'bg-teal-950/80 text-teal-300 border-teal-700/80', textColor: 'text-teal-400',
      description: 'Sintomático (T ≥ 60), por debajo del criterio de riesgo del documento (T ≥ 63).'
    };
  } else if (tScore < 70) {
    return {
      tier: 'Leve', rangeLabel: 'T 63-69 (En riesgo)',
      badgeClass: 'bg-yellow-950/80 text-yellow-300 border-yellow-700/80 ring-1 ring-yellow-500/30 font-semibold',
      textColor: 'text-yellow-400',
      description: 'En riesgo: T ≥ 63 (percentil 90 del baremo).', isRisk: true
    };
  } else if (tScore < 80) {
    return {
      tier: 'Moderado', rangeLabel: 'T 70-79',
      badgeClass: 'bg-orange-950/80 text-orange-300 border-orange-700/80 ring-1 ring-orange-500/40 font-semibold',
      textColor: 'text-orange-400',
      description: 'Malestar elevado (+2 a +3 desvíos).', isRisk: true
    };
  } else if (tScore <= 80) {
    return {
      tier: 'Severo', rangeLabel: 'T = 80 (techo del baremo)',
      badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-700/80 ring-1 ring-rose-500/50 font-bold',
      textColor: 'text-rose-400',
      description: 'En el techo de la tabla publicada.', isRisk: true, isAlert: true
    };
  }
  return {
    tier: 'Extremo', rangeLabel: 'T > 80 (fuera de baremo)',
    badgeClass: 'bg-red-950 text-red-200 border border-red-500 ring-2 ring-red-500/60 font-bold',
    textColor: 'text-red-400',
    description: 'Fuera de baremo (T > 80): el puntaje excede la tabla publicada. No es un diagnóstico de estructura.',
    isRisk: true, isAlert: true
  };
}

// --- Presets informados en puntajes T (de la versión de GitHub) -------------
// El caso con nombre y apellido se ANONIMIZÓ (decisión del autor, 24/9/2026).
// Los nombres de estructura clínica se reemplazaron por descripciones de perfil:
// un puntaje de malestar no da estructura (kill-critic, punto 5).
const T_PRESETS: { name: string; description: string; tScores: Record<keyof SCL90RData, number>; isRiskCase?: boolean }[] = [
  {
    name: 'Caso clínico A (30 años, varón) — puntajes T',
    description: 'Caso anonimizado: PSIC T=100 (fuera de baremo), DEP T=73, SI T=73, OBS T=70, IGS T=74',
    isRiskCase: true,
    tScores: {
      'Somatización': 63, 'Obsesión-Compulsión': 70, 'Sensibilidad Interpersonal': 73, 'Depresión': 73,
      'Ansiedad': 65, 'Hostilidad': 62, 'Ansiedad Fóbica': 60, 'Ideación Paranoide': 69, 'Psicoticismo': 100,
      'GSI': 74, 'PST': 69, 'PSDI': 65
    }
  },
  {
    name: 'Perfil T elevado (baremo adultos)',
    description: 'Ansiedad T=82, Psicoticismo T=85, Depresión T=78 (fuera de baremo en ANS y PSIC)',
    tScores: {
      'Somatización': 65, 'Obsesión-Compulsión': 72, 'Sensibilidad Interpersonal': 58, 'Depresión': 78,
      'Ansiedad': 82, 'Hostilidad': 55, 'Ansiedad Fóbica': 68, 'Ideación Paranoide': 70, 'Psicoticismo': 85,
      'GSI': 75, 'PST': 60, 'PSDI': 70
    }
  },
  {
    name: 'Población normal (T < 60)',
    description: 'Control no clínico: todas las escalas T < 60',
    tScores: {
      'Somatización': 45, 'Obsesión-Compulsión': 48, 'Sensibilidad Interpersonal': 46, 'Depresión': 45,
      'Ansiedad': 46, 'Hostilidad': 42, 'Ansiedad Fóbica': 40, 'Ideación Paranoide': 44, 'Psicoticismo': 43,
      'GSI': 45, 'PST': 44, 'PSDI': 48
    }
  },
  {
    name: 'Perfil O-C elevado — puntajes T',
    description: 'O-C T=79 y Ansiedad T=78: curva S dominante',
    tScores: {
      'Somatización': 54, 'Obsesión-Compulsión': 79, 'Sensibilidad Interpersonal': 60, 'Depresión': 64,
      'Ansiedad': 78, 'Hostilidad': 52, 'Ansiedad Fóbica': 58, 'Ideación Paranoide': 58, 'Psicoticismo': 52,
      'GSI': 66, 'PST': 62, 'PSDI': 72
    }
  },
  {
    name: 'Perfil extremo (T ≥ 80) — puntajes T',
    description: 'PSIC T=88, PAR T=82, ANS T=84: fuera de baremo en varias escalas (no es diagnóstico de estructura)',
    tScores: {
      'Somatización': 68, 'Obsesión-Compulsión': 70, 'Sensibilidad Interpersonal': 78, 'Depresión': 76,
      'Ansiedad': 84, 'Hostilidad': 75, 'Ansiedad Fóbica': 72, 'Ideación Paranoide': 82, 'Psicoticismo': 88,
      'GSI': 82, 'PST': 78, 'PSDI': 86
    }
  },
  {
    name: 'Perfil somatización + SI — puntajes T',
    description: 'Somatización T=82 y Sensibilidad T=75: curva I desfasada',
    tScores: {
      'Somatización': 82, 'Obsesión-Compulsión': 52, 'Sensibilidad Interpersonal': 75, 'Depresión': 66,
      'Ansiedad': 74, 'Hostilidad': 50, 'Ansiedad Fóbica': 68, 'Ideación Paranoide': 54, 'Psicoticismo': 52,
      'GSI': 68, 'PST': 70, 'PSDI': 76
    }
  },
];
for (const p of T_PRESETS) {
  CLINICAL_PRESETS.push({
    name: p.name,
    description: p.description,
    mode: 't_scores',
    tScores: p.tScores,
    data: sclDataDesdeTScores(p.tScores, DEFAULT_BAREMO_ID),
    isRiskCase: p.isRiskCase
  });
}

// --- Prcc: campo que entra por la voz (tesis V22, Resumen v6 §4) ------------

/**
 * Intensidad del campo Prcc en un punto del espacio exterior al horn torus — AXIOMA.
 * El Prcc es el campo de representaciones-palabra que entra por p (la voz, en el
 * origen): máximo en el embudo que el exterior forma a lo largo del eje (z), decrece
 * con la distancia y NO se anula (sin borde). La Cc no es un lugar sino un umbral
 * de sobreinvestidura dentro de este campo (segunda censura, GW X secc. VI).
 * Devuelve un valor en (0, 1]; `R` es el radio de revolución en unidades visuales.
 */
export function prccFieldIntensity(x: number, y: number, z: number, R: number): number {
  const rho = Math.hypot(x, y) / Math.max(1e-6, R);    // distancia al eje
  const d = Math.hypot(x, y, z) / Math.max(1e-6, R);    // distancia a p
  const embudo = Math.exp(-rho / 0.35);
  const f = Math.exp(-d / 1.4) * (0.45 + 0.55 * embudo);
  return Math.max(0.03, Math.min(1, f));
}

/**
 * Nube de puntos del campo Prcc para el visor: muestreo por rechazo con densidad
 * proporcional a prccFieldIntensity, SOLO fuera del volumen interior (el Prcc no
 * está en el Icc). Determinista (semilla fija) para que la escena no parpadee.
 */
export function generatePrccFieldPoints(R: number, count: number = 1400, seed: number = 7) {
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const positions: number[] = [];
  const intensities: number[] = [];
  const ext = 2.6 * R;
  let guard = 0;
  while (positions.length / 3 < count && guard < count * 60) {
    guard++;
    const x = (rnd() * 2 - 1) * ext;
    const y = (rnd() * 2 - 1) * ext;
    const z = (rnd() * 2 - 1) * ext;
    // fuera del sólido (ρ − R)² + z² ≤ R² (el interior U del horn torus)
    const rhoXY = Math.hypot(x, y);
    if ((rhoXY - R) ** 2 + z * z <= R * R) continue;
    const f = prccFieldIntensity(x, y, z, R);
    if (rnd() > f) continue;
    positions.push(x, y, z);
    intensities.push(f);
  }
  return { positions: new Float32Array(positions), intensities: new Float32Array(intensities) };
}

// --- Animación de la deformación (de GitHub, adaptada) ----------------------

/**
 * Actualiza en el lugar posiciones, normales y colores de la malla del horn torus
 * para un factor de deformación intermedio (transiciones animadas a 60 fps). Usa la
 * misma geometría de la familia r/R, las marcas de fantasía y la semántica de
 * angustia de generateHornTorusGeometry.
 */
export function updateHornTorusVertices(
  positions: Float32Array,
  normals: Float32Array,
  colors: Float32Array,
  params: ModelParams,
  sclData: SCL90RData,
  currentDeformation: number,
  colorMode: ColorMapMode = 'angustia'
) {
  const { gridResolution, a_critical } = params;
  const lacanian = calculateLacanianParameters(sclData, params);
  const rOverR = lacanian.rOverR;
  const effectiveA = lacanian.a * 25.0;
  const tubeR = effectiveA * rOverR;
  const numU = gridResolution;
  const numV = gridResolution;
  let ptr = 0;
  for (let i = 0; i <= numV; i++) {
    const v = (i / numV) * 2 * Math.PI;
    const cosV = Math.cos(v);
    const sinV = Math.sin(v);
    for (let j = 0; j <= numU; j++) {
      const u = (j / numU) * 2 * Math.PI;
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);
      let x = (effectiveA + tubeR * cosV) * cosU;
      let y = (effectiveA + tubeR * cosV) * sinU;
      let z = tubeR * sinV;
      const { factor, stress } = computeSclDeformation(u, v, sclData, currentDeformation);
      if (currentDeformation > 0) {
        x *= factor;
        y *= factor;
        z *= 1.0 + (factor - 1.0) * 0.85;
      }
      positions[ptr] = x;
      positions[ptr + 1] = y;
      positions[ptr + 2] = z;
      let nx = cosV * cosU;
      let ny = cosV * sinU;
      let nz = sinV;
      if (currentDeformation > 0) {
        nx += (factor - 1) * 0.5 * cosU;
        ny += (factor - 1) * 0.5 * sinU;
        nz += (factor - 1) * 0.4 * sinV;
      }
      const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;
      normals[ptr] = nx / nLen;
      normals[ptr + 1] = ny / nLen;
      normals[ptr + 2] = nz / nLen;
      const angustia = calculateAngustia(u, v, lacanian.fantasyMarks);
      const isRupture = angustia >= MAX_ANGUSTIA_DISTANCE - a_critical;
      const { tension: diffTension } = computeDifferentialTension(u, v, sclData, currentDeformation, effectiveA, rOverR);
      const rgb = getVertexColor(angustia, isRupture, stress, diffTension, v, MAX_ANGUSTIA_DISTANCE, a_critical, colorMode, rOverR);
      colors[ptr] = rgb.r;
      colors[ptr + 1] = rgb.g;
      colors[ptr + 2] = rgb.b;
      ptr += 3;
    }
  }
}

// --- Curvatura gaussiana y singularidades espectrales (de GitHub, adaptadas) ---

/**
 * Curvatura gaussiana K y media H en (u, v), estándar y deformada. Para la familia
 * (R, r = rOverR·R): K0 = cos v / (r (R + r cos v)). En el horn torus (r = R) K → −∞
 * en la cúspide v = π (se regulariza numéricamente).
 */
export function computePointGaussianCurvature(
  u: number,
  v: number,
  params: ModelParams,
  sclData: SCL90RData,
  isDeformed: boolean = true
): { K: number; H: number; classification: 'eliptica' | 'parabolica' | 'hiperbolica' | 'singular' } {
  const lac = calculateLacanianParameters(sclData, params);
  const R = Math.max(0.2, lac.R);
  const r = Math.max(0.2 * lac.rOverR, lac.r);
  const delta = isDeformed ? params.deformation_factor : 0;
  const cosV = Math.cos(v);
  const denomBase = R + r * cosV;

  if (Math.abs(denomBase) < 0.008 * R) {
    return { K: -18.5 * (1 + delta * 2), H: 0, classification: 'singular' };
  }
  const K0 = cosV / (r * Math.max(0.008 * R, denomBase));
  const H0 = (R + 2 * r * cosV) / (2 * r * Math.max(0.008 * R, denomBase));
  const clasificar = (K: number, singular: boolean) =>
    singular ? 'singular' as const : K > 0.08 ? 'eliptica' as const : K < -0.08 ? 'hiperbolica' as const : 'parabolica' as const;

  if (!isDeformed || delta <= 0.0001) {
    return { K: K0, H: H0, classification: clasificar(K0, Math.abs(denomBase) < 0.04 * R) };
  }

  const du = 0.002;
  const dv = 0.002;
  const evalPt = (uu: number, vv: number): [number, number, number] => {
    const { factor } = computeSclDeformation(uu, vv, sclData, delta);
    const rr = R + r * Math.cos(vv);
    return [rr * Math.cos(uu) * factor, rr * Math.sin(uu) * factor, r * Math.sin(vv) * (1.0 + (factor - 1.0) * 0.85)];
  };
  const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const pC = evalPt(u, v), pUp = evalPt(u + du, v), pUm = evalPt(u - du, v), pVp = evalPt(u, v + dv), pVm = evalPt(u, v - dv);
  const ru = sub(pUp, pUm).map((c) => c / (2 * du));
  const rv = sub(pVp, pVm).map((c) => c / (2 * dv));
  const E = ru[0] * ru[0] + ru[1] * ru[1] + ru[2] * ru[2];
  const F = ru[0] * rv[0] + ru[1] * rv[1] + ru[2] * rv[2];
  const G = rv[0] * rv[0] + rv[1] * rv[1] + rv[2] * rv[2];
  let nx = ru[1] * rv[2] - ru[2] * rv[1];
  let ny = ru[2] * rv[0] - ru[0] * rv[2];
  let nz = ru[0] * rv[1] - ru[1] * rv[0];
  const nLen = Math.hypot(nx, ny, nz);
  if (nLen > 1e-6) { nx /= nLen; ny /= nLen; nz /= nLen; }
  const ruu = [0, 1, 2].map((c) => (pUp[c] - 2 * pC[c] + pUm[c]) / (du * du));
  const rvv = [0, 1, 2].map((c) => (pVp[c] - 2 * pC[c] + pVm[c]) / (dv * dv));
  const pPP = evalPt(u + du, v + dv), pPM = evalPt(u + du, v - dv), pMP = evalPt(u - du, v + dv), pMM = evalPt(u - du, v - dv);
  const ruv = [0, 1, 2].map((c) => (pPP[c] - pPM[c] - pMP[c] + pMM[c]) / (4 * du * dv));
  const e = ruu[0] * nx + ruu[1] * ny + ruu[2] * nz;
  const f = ruv[0] * nx + ruv[1] * ny + ruv[2] * nz;
  const g = rvv[0] * nx + rvv[1] * ny + rvv[2] * nz;
  const det = E * G - F * F;
  let K = K0;
  let H = H0;
  if (det > 1e-6) {
    K = Math.max(-150, Math.min(150, (e * g - f * f) / det));
    H = Math.max(-50, Math.min(50, (e * G - 2 * f * F + g * E) / (2 * det)));
  }
  return { K, H, classification: clasificar(K, Math.abs(denomBase) < 0.04 * R || K < -12.0) };
}

/**
 * Análisis de singularidades espectrales: curvatura gaussiana en puntos críticos de la
 * superficie y su acoplamiento con la angustia (vecindades A_cr de las marcas).
 * Las lecturas clínicas son homologías del modelo (AXIOMA), no inferencias de estructura.
 */
export function computeSpectralSingularityAnalysis(params: ModelParams, sclData: SCL90RData): SpectralSingularityReport {
  const lac = calculateLacanianParameters(sclData, params);
  const effectiveA = lac.a * 25.0;
  const tubeR = effectiveA * lac.rOverR;
  const aCritical = params.a_critical;
  const delta = params.deformation_factor;
  const marks = lac.fantasyMarks;
  const mark = marks[0];
  const umbral = MAX_ANGUSTIA_DISTANCE - aCritical;

  const getPos3D = (u: number, v: number): [number, number, number] => {
    const { factor } = computeSclDeformation(u, v, sclData, delta);
    const rr = effectiveA + tubeR * Math.cos(v);
    return [rr * Math.cos(u) * factor, rr * Math.sin(u) * factor, tubeR * Math.sin(v) * (1.0 + (factor - 1.0) * 0.85)];
  };

  const rawPoints = [
    { id: 'fantasy_point', name: 'Marca de fantasía (principal)', lacanianLabel: 'Marca Icc de trauma (Axioma 4)',
      u: mark.u, v: mark.v,
      clinicalMeaning: 'Marca de fantasía sobre la cara interna. La angustia surge por proximidad: un cruce que se acerca (señal) o pasa por ella (situación traumática). Homología del modelo — AXIOMA.' },
    { id: 'cusp_singular', name: 'p — punto de autotangencia (la voz)', lacanianLabel: 'Orificio de doble sentido (v = π)',
      u: Math.PI, v: Math.PI - 0.02,
      clinicalMeaning: 'Único orificio fijo del Icc: entra lo oído (el campo Prcc) y sale la voz. Curvatura hiperbólica divergente (K → −∞) en el horn torus.' },
    { id: 'rupture_boundary', name: 'Borde de la vecindad crítica', lacanianLabel: 'Borde de A_cr alrededor de la marca',
      u: mark.u + aCritical, v: mark.v,
      clinicalMeaning: 'Límite de la vecindad de la marca: más allá, el cruce ya no está en aproximación.' },
    { id: 'conscious_equator', name: 'Ecuador exterior', lacanianLabel: 'Cara externa de la pared (v = 0)',
      u: 0, v: 0,
      clinicalMeaning: 'Zona elíptica de curvatura positiva estable (K > 0), la más alejada de p.' },
    { id: 'lower_parabolic', name: 'Inflexión parabólica inferior', lacanianLabel: 'Línea parabólica (v = 3π/2)',
      u: Math.PI, v: (3 * Math.PI) / 2,
      clinicalMeaning: 'Transición parabólica entre la cara externa y la cara interna de la pared.' },
    { id: 'symptom_sigma', name: 'Síntoma (Σ)', lacanianLabel: 'Cinta Σ',
      u: lac.u_Sigma % (2 * Math.PI), v: lac.v_Sigma % (2 * Math.PI),
      clinicalMeaning: 'Tramo de la cinta Σ; su ubicación depende de la asignación axiomática a Psicoticismo y Hostilidad.' },
    { id: 'body_image_I', name: 'Imagen del cuerpo (I)', lacanianLabel: 'Cinta I y borde del hilo pulsional',
      u: lac.u_I % (2 * Math.PI), v: lac.v_I % (2 * Math.PI),
      clinicalMeaning: 'Umbral donde el organismo se inscribe como imagen del cuerpo; el hilo pulsional corre pegado a su borde.' },
    { id: 'signifier_S', name: 'Cadena significante (S)', lacanianLabel: 'Cinta S',
      u: lac.u_S % (2 * Math.PI), v: lac.v_S % (2 * Math.PI),
      clinicalMeaning: 'Tramo de la cinta S (asignación axiomática a Ansiedad y Obsesión).' },
  ];

  const criticalPoints: SingularityCriticalPoint[] = rawPoints.map((pt) => {
    const cur0 = computePointGaussianCurvature(pt.u, pt.v, params, sclData, false);
    const curDef = computePointGaussianCurvature(pt.u, pt.v, params, sclData, true);
    const angustia = calculateAngustia(pt.u, pt.v, marks);
    const isAnguishOverflow = angustia >= umbral;
    const anguishRatio = MAX_ANGUSTIA_DISTANCE > 0 ? angustia / MAX_ANGUSTIA_DISTANCE : 0;
    const deltaK = curDef.K - cur0.K;
    const deltaKPercent = Math.abs(cur0.K) > 0.001 ? (deltaK / Math.abs(cur0.K)) * 100 : deltaK * 100;
    const { stress } = computeSclDeformation(pt.u, pt.v, sclData, delta);
    const { tension } = computeDifferentialTension(pt.u, pt.v, sclData, delta, effectiveA, lac.rOverR);
    return {
      id: pt.id, name: pt.name, lacanianLabel: pt.lacanianLabel, u: pt.u, v: pt.v,
      uDeg: Math.round((pt.u * 180) / Math.PI), vDeg: Math.round((pt.v * 180) / Math.PI),
      K0: parseFloat(cur0.K.toFixed(3)), K_def: parseFloat(curDef.K.toFixed(3)),
      deltaK: parseFloat(deltaK.toFixed(3)), deltaKPercent: parseFloat(deltaKPercent.toFixed(1)),
      H0: parseFloat(cur0.H.toFixed(3)), H_def: parseFloat(curDef.H.toFixed(3)),
      angustia: parseFloat(angustia.toFixed(3)), isAnguishOverflow, anguishRatio: parseFloat(anguishRatio.toFixed(3)),
      stress: parseFloat(stress.toFixed(3)), differentialTension: parseFloat(tension.toFixed(3)),
      classification: curDef.classification, clinicalMeaning: pt.clinicalMeaning, position3D: getPos3D(pt.u, pt.v)
    };
  });

  const gridSteps = 28;
  let maxHyp = 0;
  let maxEll = -Infinity;
  let overflowCount = 0;
  let overflowHighCurvCount = 0;
  const samples: { u: number; v: number; K: number; angustia: number; isOverflow: boolean; intensity: number }[] = [];
  const scatterPoints: { u: number; v: number; K: number; angustia: number; isOverflow: boolean }[] = [];
  for (let i = 0; i < gridSteps; i++) {
    const v = (i / gridSteps) * 2 * Math.PI;
    for (let j = 0; j < gridSteps; j++) {
      const u = (j / gridSteps) * 2 * Math.PI;
      const { K } = computePointGaussianCurvature(u, v, params, sclData, true);
      const angustia = calculateAngustia(u, v, marks);
      const isOverflow = angustia >= umbral;
      const intensity = aCritical > 0 ? Math.max(0, angustia - umbral) / aCritical : 0;
      if (K < maxHyp) maxHyp = K;
      if (K > maxEll) maxEll = K;
      if (isOverflow) {
        overflowCount++;
        if (Math.abs(K) > 0.85 || K < -1.0) overflowHighCurvCount++;
      }
      samples.push({ u, v, K, angustia, isOverflow, intensity });
      if (i % 3 === 0 && j % 3 === 0) {
        scatterPoints.push({ u: parseFloat(u.toFixed(2)), v: parseFloat(v.toFixed(2)), K: parseFloat(K.toFixed(2)), angustia: parseFloat(angustia.toFixed(2)), isOverflow });
      }
    }
  }
  const n = samples.length;
  const meanAbsK = samples.reduce((acc, s) => acc + Math.abs(s.K), 0) / n;
  const meanI = samples.reduce((acc, s) => acc + s.intensity, 0) / n;
  let cov = 0, varK = 0, varI = 0;
  for (const s of samples) {
    const dK = Math.abs(s.K) - meanAbsK;
    const dI = s.intensity - meanI;
    cov += dK * dI; varK += dK * dK; varI += dI * dI;
  }
  const denom = Math.sqrt(varK * varI);
  const pearsonCorrelationCurvatureAnguish = denom > 1e-6 ? parseFloat((cov / denom).toFixed(3)) : 0;
  const highCurvatureAnguishOverlapPercent = overflowCount > 0 ? parseFloat(((overflowHighCurvCount / overflowCount) * 100).toFixed(1)) : 0;

  const binEdges = [-8.0, -4.5, -2.5, -1.2, -0.4, 0.1, 0.6, 1.2, 2.5, 5.0];
  const curvatureSpectrum = binEdges.map((edge, idx) => {
    const next = binEdges[idx + 1] ?? 15.0;
    const binCenter = parseFloat(((edge + next) / 2).toFixed(2));
    const matching = samples.filter((s) => s.K >= edge && s.K < next);
    const count = matching.length;
    return {
      binCenter,
      count,
      avgAngustia: count > 0 ? parseFloat((matching.reduce((a, m) => a + m.angustia, 0) / count).toFixed(2)) : 0,
      criticalAnguishCount: matching.filter((s) => s.isOverflow).length,
      type: (binCenter < -0.3 ? 'hiperbolica' : binCenter > 0.3 ? 'eliptica' : 'parabolica') as 'hiperbolica' | 'parabolica' | 'eliptica'
    };
  });

  // Estado de la marca principal. La marca está siempre dentro de su propia vecindad, así
  // que el criterio no puede ser la angustia EN la marca: es si la cinta S pasa por su
  // vecindad (Axioma 4, aproximación) y cuánto cambia la curvatura con la deformación.
  const fp = criticalPoints.find((p) => p.id === 'fantasy_point')!;
  const sCerca = lac.isTraumaReactivated;
  let structuralIntegrity: 'Integra' | 'Tensa' | 'Desbordada' | 'Colapsada' = 'Integra';
  if (sCerca && Math.abs(fp.deltaK) > 1.2) structuralIntegrity = 'Colapsada';
  else if (sCerca) structuralIntegrity = 'Desbordada';
  else if (Math.abs(fp.deltaK) > 0.25) structuralIntegrity = 'Tensa';

  // Estado de la cúspide por el T de Psicoticismo (baremo elegido) y la curvatura:
  // describe tensión geométrica del modelo; no infiere estructura clínica.
  const cusp = criticalPoints.find((p) => p.id === 'cusp_singular')!;
  const tPsy = tDeEscalaCon(getBaremo(params.baremoId), 'Psicoticismo', sclData['Psicoticismo'] ?? 0).t;
  // La curvatura en la cúspide diverge por geometría en cualquier perfil: el estado se lee
  // solo del T de Psicoticismo y de δ; K_def se informa aparte.
  let status: 'Compensada' | 'Cizalladura Leve' | 'Estrangulamiento' | 'Tensión extrema' = 'Compensada';
  if (tPsy >= 80) status = 'Tensión extrema';
  else if (tPsy >= 70) status = 'Estrangulamiento';
  else if (tPsy >= 60 || delta > 0.25) status = 'Cizalladura Leve';

  return {
    criticalPoints,
    pearsonCorrelationCurvatureAnguish,
    highCurvatureAnguishOverlapPercent,
    maxHyperbolicCurvature: parseFloat(maxHyp.toFixed(2)),
    maxEllipticCurvature: parseFloat(maxEll.toFixed(2)),
    fantasyPointDistortion: { K0: fp.K0, K_def: fp.K_def, deltaK: fp.deltaK, angustia: fp.angustia, isRuptured: sCerca, structuralIntegrity },
    cuspSingularityDistortion: { K_def: cusp.K_def, strain: cusp.differentialTension, shearTension: cusp.stress, status },
    curvatureSpectrum,
    samplePoints: scatterPoints
  };
}

// --- Visor HTML autónomo (de GitHub, reescrito con marcas de fantasía y Prcc) ---

/**
 * Genera un HTML autónomo (Three.js por CDN) con el horn torus, las marcas de fantasía
 * sobre la superficie, p (la voz) y el campo Prcc que entra por p a lo largo del eje.
 */
export function generateInteractiveHTMLScript(sclData: SCL90RData, params: ModelParams): string {
  const lac = calculateLacanianParameters(sclData, params);
  const aVal = 1.0;
  const deltaVal = params.deformation_factor.toFixed(2);
  const aCrVal = params.a_critical.toFixed(4);
  const marksJson = JSON.stringify(lac.fantasyMarks.map((m) => [m.u, m.v]));
  const som = (sclData['Somatización'] ?? 0).toFixed(3);
  const oc = (sclData['Obsesión-Compulsión'] ?? 0).toFixed(3);
  const psy = (sclData['Psicoticismo'] ?? 0).toFixed(3);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Horn Torus Icc — visor interactivo</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #030712; color: #f3f4f6; font-family: ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
    #canvas-container { width: 100vw; height: 100vh; }
    #ui-panel { position: absolute; top: 16px; left: 16px; background: rgba(15, 23, 42, 0.88); padding: 18px; border-radius: 12px; border: 1px solid rgba(51, 65, 85, 0.8); max-width: 360px; font-size: 12px; z-index: 10; }
    h1 { font-size: 15px; font-weight: 700; color: #38bdf8; margin-bottom: 6px; }
    .subtitle { font-size: 11px; color: #94a3b8; margin-bottom: 12px; line-height: 1.4; }
    .quote-box { background: rgba(2, 6, 23, 0.6); border-left: 3px solid #2b9fa9; padding: 8px 10px; margin-bottom: 12px; border-radius: 4px; font-size: 11px; color: #d7f3f5; line-height: 1.45; }
    .badge-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; font-family: monospace; font-size: 10px; }
    .badge { padding: 3px 7px; background: #0f172a; border: 1px solid #334155; border-radius: 4px; color: #38bdf8; }
    .btn { width: 100%; padding: 9px; background: #0284c7; color: white; border: none; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; margin-top: 4px; }
    .hint { margin-top: 10px; text-align: center; font-size: 10px; color: #64748b; font-family: monospace; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>
  <div id="canvas-container"></div>
  <div id="ui-panel">
    <h1>Horn Torus Icc</h1>
    <div class="subtitle">Toda la superficie es el Icc; la pared es la censura Icc/Prcc.</div>
    <div class="quote-box">
      <strong>p — la voz:</strong> único orificio fijo, de doble sentido: entra lo oído y sale la voz.<br>
      <strong>Prcc:</strong> campo que entra por p, concentrado en el embudo del eje y sin borde.<br>
      <strong>Cc:</strong> umbral de sobreinvestidura dentro de ese campo, no un lugar.<br>
      <strong>Marcas de fantasía</strong> (rosa): la angustia surge por proximidad. Geometría: AXIOMA.
    </div>
    <div class="badge-grid">
      <span class="badge">A_cr: ${aCrVal}</span>
      <span class="badge">δ: ${deltaVal}</span>
      <span class="badge">marcas: ${lac.fantasyMarks.length}</span>
    </div>
    <button class="btn" onclick="toggleDeformation()">Conmutar deformación / reposo</button>
    <div class="hint">Arrastrar: rotar · Rueda: zoom · Clic derecho: desplazar</div>
  </div>
  <script>
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3.2, 4.6);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const l1 = new THREE.DirectionalLight(0x38bdf8, 1.4); l1.position.set(5, 10, 7); scene.add(l1);
    const l2 = new THREE.DirectionalLight(0xf43f5e, 0.9); l2.position.set(-5, -5, -5); scene.add(l2);

    const a = ${aVal};
    const delta = ${deltaVal};
    const som = ${som}, oc = ${oc}, psy = ${psy};
    const marks = ${marksJson};
    let isDeformed = true;

    function factorAt(u, v, d) {
      const raw = som * 0.28 * Math.cos(3 * v) + oc * 0.32 * Math.sin(4 * u) * Math.cos(v)
        + psy * 0.45 * Math.pow(Math.abs(Math.sin(v / 2)), 3) * Math.sin(2 * u + v);
      return Math.max(0.15, 1 + d * Math.tanh(raw / 1.45) * 1.45);
    }
    // Y es el eje de revolución en esta escena (p en el origen).
    function pointAt(u, v, d) {
      const f = factorAt(u, v, d);
      const r0 = a * (1 + Math.cos(v));
      return new THREE.Vector3(r0 * Math.cos(u) * f, a * Math.sin(v) * (1 + (f - 1) * 0.85), r0 * Math.sin(u) * f);
    }
    function createGeometry(deformed) {
      const N = 90, geo = new THREE.BufferGeometry(), pos = [], idx = [];
      for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
        const p = pointAt((j / N) * 2 * Math.PI, (i / N) * 2 * Math.PI, deformed ? delta : 0);
        pos.push(p.x, p.y, p.z);
      }
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const q = i * (N + 1) + j, w = q + N + 1;
        idx.push(q, w, q + 1, w, w + 1, q + 1);
      }
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      return geo;
    }
    const torus = new THREE.Mesh(createGeometry(true), new THREE.MeshStandardMaterial({
      color: 0xc0392b, metalness: 0.15, roughness: 0.45, side: THREE.DoubleSide, transparent: true, opacity: 0.55
    }));
    scene.add(torus);

    const markMeshes = marks.map(([u, v]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0xd9468f, emissive: 0x8e1b5f, emissiveIntensity: 0.7 }));
      scene.add(m);
      return { m, u, v };
    });
    function placeMarks() {
      markMeshes.forEach(({ m, u, v }) => m.position.copy(pointAt(u, v, isDeformed ? delta : 0).multiplyScalar(0.96)));
    }
    placeMarks();

    const voice = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 20), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    scene.add(voice);

    // Campo Prcc: puntos fuera del volumen, más densos en el embudo del eje (Y) y sin borde.
    const prccPos = [];
    let s = 7;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let k = 0, guard = 0; k < 1600 && guard < 120000; guard++) {
      const x = (rnd() * 2 - 1) * 2.6 * a, y = (rnd() * 2 - 1) * 2.6 * a, z = (rnd() * 2 - 1) * 2.6 * a;
      const rho = Math.hypot(x, z);
      if ((rho - a) ** 2 + y * y <= a * a) continue;
      const d = Math.hypot(x, y, z) / a;
      const f = Math.exp(-d / 1.4) * (0.45 + 0.55 * Math.exp(-(rho / a) / 0.35));
      if (rnd() > f) continue;
      prccPos.push(x, y, z); k++;
    }
    const prccGeo = new THREE.BufferGeometry();
    prccGeo.setAttribute('position', new THREE.Float32BufferAttribute(prccPos, 3));
    scene.add(new THREE.Points(prccGeo, new THREE.PointsMaterial({ color: 0x2b9fa9, size: 0.03, transparent: true, opacity: 0.55 })));

    function toggleDeformation() {
      isDeformed = !isDeformed;
      torus.geometry.dispose();
      torus.geometry = createGeometry(isDeformed);
      placeMarks();
    }
    window.toggleDeformation = toggleDeformation;

    const clock = new THREE.Clock();
    (function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const pulse = 1 + Math.sin(t * 3) * 0.2;
      voice.scale.set(pulse, pulse, pulse);
      controls.update();
      renderer.render(scene, camera);
    })();
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>`;
}
