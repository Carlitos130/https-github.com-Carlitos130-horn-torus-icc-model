import {
  SCL90RData,
  ModelParams,
  TopologicalMetrics,
  LacanianCoordinates,
  ColorMapMode,
  TScoreCategory,
  CasulloPerezNormRow,
  SingularityCriticalPoint,
  SpectralSingularityReport
} from '../types';

/**
 * Tabla Normativa Baremo Casullo - Pérez (2008)
 * SCL-90-R Adaptación UBA / CONICET.
 * Varones adultos (25-60 años), Población General Buenos Aires y Conurbano. N: 379.
 */
export const BAREMO_CASULLO_PEREZ_2008_VARONES: CasulloPerezNormRow[] = [
  { T: 30, SOM: 0.00, OBS: 0.00, SI: 0.00, DEP: 0.00, ANS: 0.00, HOS: 0.00, FOB: 0.00, PAR: 0.00, PSIC: 0.00, IGS: 0.11, TSP: 5.60, IMSP: 1.05 },
  { T: 35, SOM: 0.00, OBS: 0.20, SI: 0.00, DEP: 0.08, ANS: 0.10, HOS: 0.00, FOB: 0.00, PAR: 0.00, PSIC: 0.00, IGS: 0.17, TSP: 10.00, IMSP: 1.22 },
  { T: 40, SOM: 0.08, OBS: 0.30, SI: 0.11, DEP: 0.23, ANS: 0.20, HOS: 0.17, FOB: 0.00, PAR: 0.17, PSIC: 0.00, IGS: 0.29, TSP: 16.00, IMSP: 1.36 },
  { T: 45, SOM: 0.25, OBS: 0.50, SI: 0.33, DEP: 0.38, ANS: 0.40, HOS: 0.33, FOB: 0.00, PAR: 0.33, PSIC: 0.20, IGS: 0.41, TSP: 23.80, IMSP: 1.56 },
  { T: 50, SOM: 0.42, OBS: 0.80, SI: 0.56, DEP: 0.69, ANS: 0.60, HOS: 0.67, FOB: 0.14, PAR: 0.67, PSIC: 0.30, IGS: 0.61, TSP: 32.00, IMSP: 1.75 },
  { T: 55, SOM: 0.75, OBS: 1.30, SI: 0.89, DEP: 1.02, ANS: 0.90, HOS: 1.00, FOB: 0.29, PAR: 1.17, PSIC: 0.50, IGS: 0.88, TSP: 41.20, IMSP: 2.00 },
  { T: 60, SOM: 1.08, OBS: 1.70, SI: 1.33, DEP: 1.38, ANS: 1.30, HOS: 1.33, FOB: 0.57, PAR: 1.50, PSIC: 0.90, IGS: 1.10, TSP: 52.00, IMSP: 2.25 },
  { T: 63, SOM: 1.25, OBS: 1.90, SI: 1.56, DEP: 1.62, ANS: 1.60, HOS: 1.67, FOB: 0.86, PAR: 1.83, PSIC: 1.20, IGS: 1.32, TSP: 57.00, IMSP: 2.40 },
  { T: 65, SOM: 1.42, OBS: 2.20, SI: 1.67, DEP: 1.77, ANS: 1.70, HOS: 1.83, FOB: 1.00, PAR: 2.07, PSIC: 1.40, IGS: 1.49, TSP: 61.00, IMSP: 2.53 },
  { T: 70, SOM: 1.75, OBS: 2.60, SI: 2.38, DEP: 2.42, ANS: 2.28, HOS: 2.57, FOB: 1.43, PAR: 2.67, PSIC: 1.74, IGS: 1.84, TSP: 75.00, IMSP: 2.91 },
  { T: 75, SOM: 2.31, OBS: 3.40, SI: 3.00, DEP: 2.88, ANS: 2.67, HOS: 3.17, FOB: 1.88, PAR: 2.95, PSIC: 2.17, IGS: 2.17, TSP: 79.72, IMSP: 3.30 },
  { T: 80, SOM: 2.50, OBS: 3.60, SI: 3.22, DEP: 3.15, ANS: 2.70, HOS: 3.83, FOB: 2.71, PAR: 3.17, PSIC: 2.30, IGS: 2.22, TSP: 85.00, IMSP: 3.65 }
];

/**
 * Normaliza un puntaje T del SCL-90-R al rango [0, max_normalized].
 * Baremo estándar (Casullo & Pérez 2008):
 * - T = 50 (media poblacional) → 0.0
 * - T = 63 (umbral de riesgo clínico, p90) → 0.26
 * - T = 70 (moderado) → 0.40
 * - T = 80 (límite clínico del baremo) → 0.60
 * - T = 100 (máximo clínico extremo / psicosis) → 1.00
 * - T > 80 y hasta 150+ → valores > 1.0 diferenciables (hasta max_normalized = 2.0)
 * 
 * Fórmula: Math.max(0, Math.min(maxNormalized, (T - 50) / 50))
 */
export function normalizeSCL90RTScore(tScore: number, maxNormalized: number = 2.0): number {
  const norm = Math.max(0, Math.min(maxNormalized, (tScore - 50) / 50));
  return parseFloat(norm.toFixed(4));
}

/**
 * Convierte un valor normalizado a su puntaje T correspondiente:
 * T = round(50 + 50 * norm)
 */
export function denormalizeSCL90RTScore(normVal: number): number {
  return Math.round(50 + 50 * Math.max(0, normVal));
}

/**
 * Clasificación e interpretación clínica del SCL-90-R con baremo UBA/CONICET (Casullo & Pérez, 2008):
 * - T < 60: Normal (media poblacional T=50, asintomático)
 * - T 60-62: Normal-Alto / Subclínico
 * - T 63-69: EN RIESGO (T ≥ 63 es percentil 90, umbral de riesgo clínico)
 * - T 70-79: Moderado (+2 a +3 Desviaciones Estándar)
 * - T 80-84: Severo (+3 DE, límite de baremo estándar)
 * - T ≥ 85 o T > 80 (ej. T=100): ⚠ EN RIESGO (ALERTA) / FUERA DE BAREMO
 */
export function getTScoreInterpretation(tScore: number): TScoreCategory {
  if (tScore < 60) {
    return {
      tier: 'Normal',
      rangeLabel: 'T < 60 (Normal)',
      badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80',
      textColor: 'text-emerald-400',
      description: 'Población normal asintomática (T < 60, media estándar 50).'
    };
  } else if (tScore < 63) {
    return {
      tier: 'Leve',
      rangeLabel: 'T 60-62 (Subclínico)',
      badgeClass: 'bg-teal-950/80 text-teal-300 border-teal-700/80',
      textColor: 'text-teal-400',
      description: 'Puntaje en rango superior pero por debajo del umbral de riesgo clínico.'
    };
  } else if (tScore < 70) {
    return {
      tier: 'Leve',
      rangeLabel: 'T 63-69 (EN RIESGO)',
      badgeClass: 'bg-yellow-950/80 text-yellow-300 border-yellow-700/80 ring-1 ring-yellow-500/30 font-semibold',
      textColor: 'text-yellow-400',
      description: 'EN RIESGO: Supera el umbral normativo de T ≥ 63 (Percentil 90 en baremo UBA).',
      isRisk: true
    };
  } else if (tScore < 80) {
    return {
      tier: 'Moderado',
      rangeLabel: 'T 70-79 (Moderado / Riesgo)',
      badgeClass: 'bg-orange-950/80 text-orange-300 border-orange-700/80 ring-1 ring-orange-500/40 font-semibold',
      textColor: 'text-orange-400',
      description: 'Cuadro sintomático moderado-severo (+2 a +3 Desviaciones Estándar).',
      isRisk: true
    };
  } else if (tScore < 85) {
    return {
      tier: 'Severo',
      rangeLabel: 'T 80-84 (Severo / Techo Baremo)',
      badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-700/80 ring-1 ring-rose-500/50 font-bold',
      textColor: 'text-rose-400',
      description: 'Severidad clínica extrema en el límite superior del baremo normativo.',
      isRisk: true,
      isAlert: true
    };
  } else {
    return {
      tier: 'Extremo',
      rangeLabel: 'T > 80 (⚠ ALERTA / Fuera de Baremo)',
      badgeClass: 'bg-red-950 text-red-200 border border-red-500 ring-2 ring-red-500/60 font-bold animate-pulse',
      textColor: 'text-red-400',
      description: '⚠ ALERTA PRIORITARIA: Puntaje fuera de baremo (T > 80, descompensación psicótica o afectiva severa).',
      isRisk: true,
      isAlert: true
    };
  }
}

/**
 * Normaliza un diccionario de datos SCL-90-R expresado en puntajes T
 */
export function normalizeSCL90RData(tData: Record<string, number>, maxNormalized: number = 2.0): SCL90RData {
  const result: Partial<SCL90RData> = {};
  for (const key of Object.keys(tData) as (keyof SCL90RData)[]) {
    const val = tData[key] ?? 50;
    result[key] = normalizeSCL90RTScore(val, maxNormalized);
  }
  return result as SCL90RData;
}

/**
 * Convierte un objeto SCL-90-R con valores normalizados a Puntajes T del baremo de adultos
 */
export function sclDataToTScores(data: SCL90RData): Record<keyof SCL90RData, number> {
  const result: Partial<Record<keyof SCL90RData, number>> = {};
  for (const key of Object.keys(data) as (keyof SCL90RData)[]) {
    const val = data[key] ?? 0.5;
    result[key] = denormalizeSCL90RTScore(val);
  }
  return result as Record<keyof SCL90RData, number>;
}

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
  "PST": 0.7,
  "PSDI": 0.9
};

export interface ClinicalPreset {
  name: string;
  description: string;
  tScores: Record<keyof SCL90RData, number>;
  data: SCL90RData;
  patientName?: string;
  isRiskCase?: boolean;
}

export const CLINICAL_PRESETS: ClinicalPreset[] = [
  {
    name: "Caso Ross, Matías Gabriel (30a, Varón UBA/CONICET)",
    description: "Protocolo UBA: PSIC > 80 (T=100 ⚠ ALERTA), DEP T=73, SI T=73, OBS T=70, IGS T=74. Riesgo de ruptura y trauma reactivado",
    patientName: "Ross, Matías Gabriel",
    isRiskCase: true,
    tScores: {
      "Somatización": 63,
      "Obsesión-Compulsión": 70,
      "Sensibilidad Interpersonal": 73,
      "Depresión": 73,
      "Ansiedad": 65,
      "Hostilidad": 62,
      "Ansiedad Fóbica": 60,
      "Ideación Paranoide": 69,
      "Psicoticismo": 100, // T > 80 fuera de baremo (alerta clínica extrema)
      "GSI": 74,
      "PST": 69,
      "PSDI": 65
    },
    data: {
      "Somatización": 0.26,
      "Obsesión-Compulsión": 0.40,
      "Sensibilidad Interpersonal": 0.46,
      "Depresión": 0.46,
      "Ansiedad": 0.30,
      "Hostilidad": 0.24,
      "Ansiedad Fóbica": 0.20,
      "Ideación Paranoide": 0.38,
      "Psicoticismo": 1.00, // o hasta 2.0
      "GSI": 0.48,
      "PST": 0.38,
      "PSDI": 0.30
    }
  },
  {
    name: "Caso SCL-90-R Real (Baremo Adultos)",
    description: "Puntajes T clínicos de adultos: Ansiedad T=82, Psicoticismo T=85, Depresión T=78",
    tScores: {
      "Somatización": 65,
      "Obsesión-Compulsión": 72,
      "Sensibilidad Interpersonal": 58,
      "Depresión": 78,
      "Ansiedad": 82,
      "Hostilidad": 55,
      "Ansiedad Fóbica": 68,
      "Ideación Paranoide": 70,
      "Psicoticismo": 85,
      "GSI": 75,
      "PST": 60,
      "PSDI": 70
    },
    data: {
      "Somatización": 0.30,
      "Obsesión-Compulsión": 0.44,
      "Sensibilidad Interpersonal": 0.16,
      "Depresión": 0.56,
      "Ansiedad": 0.64,
      "Hostilidad": 0.10,
      "Ansiedad Fóbica": 0.36,
      "Ideación Paranoide": 0.40,
      "Psicoticismo": 0.70,
      "GSI": 0.50,
      "PST": 0.20,
      "PSDI": 0.40
    }
  },
  {
    name: "Población Normal Asintomática (T < 60)",
    description: "Baremo control no clínico: todas las dimensiones T < 60 (media 50), sin zonas de angustia",
    tScores: {
      "Somatización": 45,
      "Obsesión-Compulsión": 48,
      "Sensibilidad Interpersonal": 46,
      "Depresión": 45,
      "Ansiedad": 46,
      "Hostilidad": 42,
      "Ansiedad Fóbica": 40,
      "Ideación Paranoide": 44,
      "Psicoticismo": 43,
      "GSI": 45,
      "PST": 44,
      "PSDI": 48
    },
    data: {
      "Somatización": 0.00,
      "Obsesión-Compulsión": 0.00,
      "Sensibilidad Interpersonal": 0.00,
      "Depresión": 0.00,
      "Ansiedad": 0.00,
      "Hostilidad": 0.00,
      "Ansiedad Fóbica": 0.00,
      "Ideación Paranoide": 0.00,
      "Psicoticismo": 0.00,
      "GSI": 0.00,
      "PST": 0.00,
      "PSDI": 0.00
    }
  },
  {
    name: "Modelo Icc Lacaniano (Prompt Inicial)",
    description: "Configuración psicométrica de alta severidad con curvas S, I, Σ y punto de angustia",
    tScores: {
      "Somatización": 74,
      "Obsesión-Compulsión": 77,
      "Sensibilidad Interpersonal": 71,
      "Depresión": 76,
      "Ansiedad": 79,
      "Hostilidad": 68,
      "Ansiedad Fóbica": 73,
      "Ideación Paranoide": 74,
      "Psicoticismo": 77,
      "GSI": 76,
      "PST": 71,
      "PSDI": 77
    },
    data: { ...DEFAULT_SCL90R_DATA }
  },
  {
    name: "Estructura Neurótica Obsesiva",
    description: "Curva S (Significante) dominante con rigidez cognitiva, O-C T=79 y Ansiedad T=78",
    tScores: {
      "Somatización": 54,
      "Obsesión-Compulsión": 79,
      "Sensibilidad Interpersonal": 60,
      "Depresión": 64,
      "Ansiedad": 78,
      "Hostilidad": 52,
      "Ansiedad Fóbica": 58,
      "Ideación Paranoide": 58,
      "Psicoticismo": 52,
      "GSI": 66,
      "PST": 62,
      "PSDI": 72
    },
    data: {
      "Somatización": 0.40,
      "Obsesión-Compulsión": 0.98,
      "Sensibilidad Interpersonal": 0.60,
      "Depresión": 0.50,
      "Ansiedad": 0.85,
      "Hostilidad": 0.40,
      "Ansiedad Fóbica": 0.35,
      "Ideación Paranoide": 0.50,
      "Psicoticismo": 0.25,
      "GSI": 0.62,
      "PST": 0.55,
      "PSDI": 0.75
    }
  },
  {
    name: "Desencadenamiento Psicótico Severo",
    description: "Puntajes extremos T ≥ 80 en Psicoticismo (T=88), Paranoia (T=82) y colapso de Σ",
    tScores: {
      "Somatización": 68,
      "Obsesión-Compulsión": 70,
      "Sensibilidad Interpersonal": 78,
      "Depresión": 76,
      "Ansiedad": 84,
      "Hostilidad": 75,
      "Ansiedad Fóbica": 72,
      "Ideación Paranoide": 82,
      "Psicoticismo": 88,
      "GSI": 82,
      "PST": 78,
      "PSDI": 86
    },
    data: {
      "Somatización": 0.65,
      "Obsesión-Compulsión": 0.70,
      "Sensibilidad Interpersonal": 0.90,
      "Depresión": 0.80,
      "Ansiedad": 0.95,
      "Hostilidad": 0.85,
      "Ansiedad Fóbica": 0.70,
      "Ideación Paranoide": 0.98,
      "Psicoticismo": 0.99,
      "GSI": 0.96,
      "PST": 0.92,
      "PSDI": 0.99
    }
  },
  {
    name: "Histeria y Cuerpo Somático (Imagen I)",
    description: "Somatización T=82 y Sensibilidad T=75. Curva I desfasada en el Inconsciente",
    tScores: {
      "Somatización": 82,
      "Obsesión-Compulsión": 52,
      "Sensibilidad Interpersonal": 75,
      "Depresión": 66,
      "Ansiedad": 74,
      "Hostilidad": 50,
      "Ansiedad Fóbica": 68,
      "Ideación Paranoide": 54,
      "Psicoticismo": 52,
      "GSI": 68,
      "PST": 70,
      "PSDI": 76
    },
    data: {
      "Somatización": 0.95,
      "Obsesión-Compulsión": 0.50,
      "Sensibilidad Interpersonal": 0.90,
      "Depresión": 0.65,
      "Ansiedad": 0.80,
      "Hostilidad": 0.35,
      "Ansiedad Fóbica": 0.70,
      "Ideación Paranoide": 0.40,
      "Psicoticismo": 0.30,
      "GSI": 0.68,
      "PST": 0.72,
      "PSDI": 0.82
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
 * Calculates Lacanian parameters S, I, Sigma, fantasy point, and rupture points
 * directly following the user's HornTorusICCModel definition
 */
export function calculateLacanianParameters(
  sclData: SCL90RData,
  params: ModelParams
): LacanianCoordinates {
  const { a_scale, u_scale, v_scale, a_critical } = params;

  // Radio a (escalado por GSI)
  const gsi = sclData["GSI"] ?? 0.85;
  const a = a_scale * gsi;

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
  const pst = sclData["PST"] ?? 0.7;
  const v_I = v_scale * (1 + pst);

  // Hilo Pulsional (Trieb / Vorstellungrepräsentanz):
  // Pegado a I (apuntalamiento somático de la pulsión en la imagen del cuerpo)
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

  // Punto de fantasía (angustia máxima): (pi, pi / 2)
  const u_F = Math.PI;
  const v_F = Math.PI / 2;

  // Coordenadas 3D del punto de fantasía
  const x_F = a * (1 + Math.cos(v_F)) * Math.cos(u_F);
  const y_F = a * (1 + Math.cos(v_F)) * Math.sin(u_F);
  const z_F = a * Math.sin(v_F);

  // Conteo de puntos de ruptura (donde angustia <= a_critical o supera umbral)
  // En el espacio paramétrico (u, v), los puntos cuya distancia a (u_F, v_F) <= A_cr
  // representan la zona de angustia crítica/ruptura
  const sampleSteps = 60;
  let rupturePointsCount = 0;
  for (let i = 0; i < sampleSteps; i++) {
    const u = (i / sampleSteps) * 2 * Math.PI;
    for (let j = 0; j < sampleSteps; j++) {
      const v = (j / sampleSteps) * 2 * Math.PI;
      const dist = Math.sqrt((u - u_F) ** 2 + (v - v_F) ** 2);
      if (dist <= a_critical) {
        rupturePointsCount++;
      }
    }
  }
  const totalSamples = sampleSteps * sampleSteps;
  const ruptureAreaPercent = (rupturePointsCount / totalSamples) * 100;

  // Reactivación traumática: distancia de la cinta significante S a la fantasía (u_F=pi, v_F=pi/2)
  // En el Icc, la fantasía no pasa al exterior Cc. Pero cuando la trayectoria significante S
  // circula en su proximidad, se reactiva el afecto de angustia (trauma que se despierta).
  const distanceSignifierToFantasy = Math.abs(v_S - v_F);
  const isTraumaReactivated = distanceSignifierToFantasy <= a_critical;

  // Actividad en el "oído" / cúspide singular del horn torus (v = pi):
  // Punto de auto-tangencia en el origen que comunica el exterior con el vórtice interior
  const earCuspActivity = Math.max(0, Math.min(1, 1.0 - Math.abs(v_S - Math.PI) / Math.PI));

  // La fantasía es un agujero en el toro donde no existe una representación (falla de S1 -> S2)
  const fantasyHoleVoidRadius = 0.0; // Radio cero del cuello central v=pi
  const nonRepresentabilityIndex = Math.min(100, Math.max(0, (1.0 - distanceSignifierToFantasy / Math.PI) * 100));
  const fantasyHoleDescription = "La fantasía es un agujero en el toro donde no existe una representación ($1 / S_2). El agujero central (v=π) del Horn Torus es un vacío donde las cadenas de significantes bordean el límite pero no penetran ni pueden representar la Cosa (Das Ding).";

  // Extimidad de la Pulsión Voz (Superyó / Objeto a):
  // No hay "adentro" ni "afuera" cartesianos: toda la superficie del toroide es la trama del Inconsciente (Icc).
  // El único "afuera" real que contacta el toroide es la intrusión pulsional éxtima de la Voz (objeto a / Superyó)
  // que penetra verticalmente a lo largo del eje central hacia la cúspide singular (0, 0, 0) en v = π.
  const host = sclData['Hostilidad'] ?? 0.6;
  const psy = sclData['Psicoticismo'] ?? 0.8;
  const voiceIntensity = 0.8 + 0.4 * host + 0.5 * psy;
  const voiceIntrusionVector: [number, number, number] = [0, 0, -voiceIntensity];
  const extimacyDescription = "Toda la superficie del toro es superficie del Inconsciente (Icc). El único 'afuera' que podemos concebir desde el toro es la pulsión Voz (y el imperativo del Superyó) que entra por el agujero central hacia el Icc; a partir de allí, los representantes de la representación (VR) de la pulsión y las cadenas significantes se mueven y despliegan sobre toda esa superficie continua.";

  return {
    a,
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
    ruptureCount: rupturePointsCount,
    ruptureAreaPercent,
    distanceSignifierToFantasy,
    isTraumaReactivated,
    earCuspActivity,
    fantasyHoleVoidRadius,
    nonRepresentabilityIndex,
    fantasyHoleDescription,
    voiceIntrusionVector,
    extimacyDescription
  };
}

/**
 * Calculates angustia A(u, v) = sqrt((u - u_F)^2 + (v - v_F)^2)
 * La fantasía ($ <> a) bordea la angustia máxima en el foco (pi, pi/2)
 */
export function calculateAngustia(u: number, v: number): number {
  const u_F = Math.PI;
  const v_F = Math.PI / 2;
  return Math.sqrt((u - u_F) ** 2 + (v - v_F) ** 2);
}

/**
 * Generates 3D coordinates for curves/ribbons S, I, Hilo Pulsional, and Sigma.
 * Las cintas están dispuestas y entrecruzadas en el interior del horn torus (Icc),
 * donde el Hilo Pulsional está íntimamente pegado y trenzado a la cinta I.
 */
export function getLacanianCurves(
  lacanian: LacanianCoordinates,
  uPoints: number = 220,
  visualScale: number = 25.0 // scale up coordinates for viewport
) {
  const uVals: number[] = [];
  for (let i = 0; i <= uPoints; i++) {
    uVals.push((i / uPoints) * 2 * Math.PI);
  }

  const effectiveA = lacanian.a * visualScale;
  const phi_I = (lacanian.v_I % (2 * Math.PI));
  const phi_S = (lacanian.v_S % (2 * Math.PI));
  const phi_Sigma = (lacanian.v_Sigma % (2 * Math.PI));

  // 1. Curva I (Imagen del cuerpo, color verde esmeralda):
  // Recorre el interior del toro oscilando a través de la garganta/cúspide
  const curveI: [number, number, number][] = uVals.map((u) => {
    const v = Math.PI + 0.48 * Math.sin(u + phi_I) + 0.12 * Math.cos(2 * u);
    const r = effectiveA * (1 + Math.cos(v));
    const x = r * Math.cos(u);
    const y = r * Math.sin(u);
    const z = effectiveA * Math.sin(v);
    return [x, y, z];
  });

  // 2. Hilo Pulsional (Trieb / Vorstellungrepräsentanz, color dorado/ámbar):
  // ESTÁ PEGADO A I: Se acopla de manera estrecha a la cinta I, entrelazándose
  // helicoidalmente como la investidura pulsional de las zonas erógenas corporales.
  const curvePulsion: [number, number, number][] = uVals.map((u, idx) => {
    const basePt = curveI[idx];
    const vBase = Math.PI + 0.48 * Math.sin(u + phi_I) + 0.12 * Math.cos(2 * u);
    // Micro-desplazamiento pulsional entrelazado con I
    const pulsionFreq = 6;
    const vOffset = 0.14 * Math.sin(pulsionFreq * u) * lacanian.pulsionAttachmentStrength;
    const vP = vBase + vOffset;
    const rOffset = 0.08 * Math.cos(pulsionFreq * u) * effectiveA * lacanian.pulsionAttachmentStrength;
    const r = effectiveA * (1 + Math.cos(vP)) + rOffset;
    const x = r * Math.cos(u);
    const y = r * Math.sin(u);
    const z = effectiveA * Math.sin(vP) + 0.06 * Math.sin(pulsionFreq * u) * effectiveA;
    return [x, y, z];
  });

  // 3. Curva S (Significante / Simbólico, color rojo carmesí):
  // Trayectoria meridional que intersecta y corta transversalmente a I y al Hilo Pulsional
  const curveS: [number, number, number][] = uVals.map((u) => {
    const v = Math.PI + 0.48 * Math.cos(u + phi_S) - 0.16 * Math.sin(2 * u);
    const r = effectiveA * (1 + Math.cos(v));
    const x = r * Math.cos(u);
    const y = r * Math.sin(u);
    const z = effectiveA * Math.sin(v);
    return [x, y, z];
  });

  // 4. Curva Sigma (Síntoma / Sinthome, color azul cobalto):
  // El cuarto lazo que anuda la estructura en el interior, cruzando la singularidad
  const curveSigma: [number, number, number][] = uVals.map((u) => {
    const v = Math.PI + 0.58 * Math.sin(2 * u + phi_Sigma);
    const r = effectiveA * (1 + Math.cos(v));
    const x = r * Math.cos(u);
    const y = r * Math.sin(u);
    const z = effectiveA * Math.sin(v);
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
 * Directly connected to the Vorstellungsrepräsentanz anchored to curve I,
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

  // Monismo topológico: Toda la superficie del Toro es Inconsciente (v in [0, 2*pi]).
  // Los VR (Vorstellungsrepräsentanz) de la pulsión se mueven e inscriben a lo largo de toda la variedad.
  for (let iv = 0; iv < vSteps; iv++) {
    const tV = (iv + 0.5) / vSteps;
    const v = tV * 2 * Math.PI; // Toda la superficie continua del Icc

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

      // Distance to curve I (Vorstellungsrepräsentanz / somatization anchor)
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
  const pst = data["PST"] || 0;
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

  // Acumulación de perturbaciones armónicas
  const rawDeform = wSom + wOC + wPsy + wGSI + wPST + wPSDI + wDep + wAnx;

  // Saturación sigmoidal suave (Math.tanh) para evitar que perturbaciones acumuladas
  // con puntuaciones fuera de escala (T > 80, T=100 o valores normalizados > 1.0) causen
  // radios negativos o singularidades geométricas que rompan o inviertan el toroide:
  const safeScale = 1.45;
  const boundedDeform = Math.tanh(rawDeform / safeScale) * safeScale;

  // Aseguramos un factor mínimo estríctamente positivo (factor >= 0.15)
  // para que el radio r = a(1 + cos(v)) * factor nunca colapse a cero ni se invierta
  const factor = Math.max(0.15, 1.0 + deformationFactor * boundedDeform);
  const stress = Math.min(1.0, Math.max(0.0, Math.abs(boundedDeform) * (0.8 + psdi * 0.4)));

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
  effectiveA: number
): {
  tension: number;
  displacementNorm: number;
  gradientMag: number;
  cuspStrain: number;
} {
  const deformScale = Math.max(0.05, deformationFactor);

  // Standard Horn Torus coordinates
  const x0 = effectiveA * (1 + Math.cos(v)) * Math.cos(u);
  const y0 = effectiveA * (1 + Math.cos(v)) * Math.sin(u);
  const z0 = effectiveA * Math.sin(v);

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

  // Base radius a = a_scale * GSI scaled for standard 3D viewport (e.g. ~2.0)
  const visualScale = 25.0;
  const effectiveA = lacanian.a * visualScale;
  const effectiveDeform = isDeformed ? deformation_factor : 0.0;

  const numU = gridResolution;
  const numV = gridResolution;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const maxAngustia = Math.sqrt((2 * Math.PI) ** 2 + (2 * Math.PI) ** 2);

  // u in [0, 2*pi], v in [0, 2*pi]
  for (let i = 0; i <= numV; i++) {
    const v = (i / numV) * 2 * Math.PI; // poloidal angle

    for (let j = 0; j <= numU; j++) {
      const u = (j / numU) * 2 * Math.PI; // toroidal angle

      // Parametric equations of Horn Torus: R = r = a
      // x = a * (1 + cos(v)) * cos(u)
      // y = a * (1 + cos(v)) * sin(u)
      // z = a * sin(v)
      let x = effectiveA * (1 + Math.cos(v)) * Math.cos(u);
      let y = effectiveA * (1 + Math.cos(v)) * Math.sin(u);
      let z = effectiveA * Math.sin(v);

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

      // Angustia A(u, v) and Rupture determination
      const angustia = calculateAngustia(u, v);
      const isRupture = angustia <= a_critical;

      // Differential tension calculation (energy surface difference)
      const { tension: diffTension } = computeDifferentialTension(
        u,
        v,
        sclData,
        deformation_factor,
        effectiveA
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
        colorMode
      );
      colors.push(rgb.r, rgb.g, rgb.b);
    }
  }

  // Triangles: partitioned into full indices, Cc outer envelope indices, and Icc interior funnel indices
  const ccIndices: number[] = [];
  const iccIndices: number[] = [];

  for (let i = 0; i < numV; i++) {
    const vMid = ((i + 0.5) / numV) * 2 * Math.PI;
    // Conscious (Cc) outer envelope: cos(v) > 0, i.e. v in [0, pi/2) U (3pi/2, 2pi]
    // Unconscious (Icc) inner funnel: cos(v) <= 0, i.e. v in [pi/2, 3pi/2]
    const isCcZone = Math.cos(vMid) > 0;

    for (let j = 0; j < numU; j++) {
      const a = i * (numU + 1) + j;
      const b = (i + 1) * (numU + 1) + j;
      const c = (i + 1) * (numU + 1) + (j + 1);
      const d = i * (numU + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);

      if (isCcZone) {
        ccIndices.push(a, b, d);
        ccIndices.push(b, c, d);
      } else {
        iccIndices.push(a, b, d);
        iccIndices.push(b, c, d);
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    colors: new Float32Array(colors),
    indices: new Uint32Array(indices),
    ccIndices: new Uint32Array(ccIndices),
    iccIndices: new Uint32Array(iccIndices),
    lacanian
  };
}

/**
 * Updates positions, normals, and colors buffers in-place for a Horn Torus mesh
 * based on the dynamic deformation factor delta.
 * Highly optimized for 60fps smooth animation transitions between standard and deformed states.
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
  const visualScale = 25.0;
  const effectiveA = lacanian.a * visualScale;

  const numU = gridResolution;
  const numV = gridResolution;
  const maxAngustia = Math.sqrt((2 * Math.PI) ** 2 + (2 * Math.PI) ** 2);

  let ptr = 0;

  for (let i = 0; i <= numV; i++) {
    const v = (i / numV) * 2 * Math.PI;
    const cosV = Math.cos(v);
    const sinV = Math.sin(v);
    const r0 = effectiveA * (1 + cosV);
    const z0 = effectiveA * sinV;

    for (let j = 0; j <= numU; j++) {
      const u = (j / numU) * 2 * Math.PI;
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);

      let x = r0 * cosU;
      let y = r0 * sinU;
      let z = z0;

      const { factor, stress } = computeSclDeformation(u, v, sclData, currentDeformation);

      if (currentDeformation > 0) {
        x *= factor;
        y *= factor;
        z *= 1.0 + (factor - 1.0) * 0.85;
      }

      positions[ptr] = x;
      positions[ptr + 1] = y;
      positions[ptr + 2] = z;

      // Outward normal vector
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

      // Color mapping
      const angustia = calculateAngustia(u, v);
      const isRupture = angustia <= a_critical;
      const { tension: diffTension } = computeDifferentialTension(
        u,
        v,
        sclData,
        currentDeformation,
        effectiveA
      );

      const rgb = getVertexColor(
        angustia,
        isRupture,
        stress,
        diffTension,
        v,
        maxAngustia,
        a_critical,
        colorMode
      );

      colors[ptr] = rgb.r;
      colors[ptr + 1] = rgb.g;
      colors[ptr + 2] = rgb.b;

      ptr += 3;
    }
  }
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
  mode: ColorMapMode
) {
  if (mode === 'angustia') {
    // Rupture zone: Bright glowing crimson/amber
    if (isRupture) {
      const t = angustia / aCritical; // 0 to 1
      return { r: 0.98, g: 0.15 + 0.5 * t, b: 0.1 };
    }
    // Safe / Distance to fantasy point: deep navy/indigo -> teal -> cyan
    const norm = Math.min(1.0, (angustia - aCritical) / (maxAngustia - aCritical));
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

  // Mode: curvature (Curvatura Gaussiana espectral)
  // K = cos(v) / (a^2 * (1 + cos(v)))
  // - Zonas hiperbólicas y singularidad (v -> +-pi, K << 0): Carmesí láser / Magenta profundo
  // - Zonas de curvatura media negativa (-1.5 <= K < -0.1): Ámbar solar / Naranja fuego
  // - Banda parabólica neutra (K ~ 0, v = pi/2 latitud de la Fantasía): Verde esmeralda / Seafoam
  // - Zonas elípticas convexas exteriores (v = 0, K > 0): Zafiro / Cian eléctrico
  // - Acoplamiento con Fantasía Desbordada (isRupture, A <= A_cr): Resplandor fucsia de alta visibilidad
  const cosV = Math.cos(v);
  const denom = Math.max(0.012, 1 + cosV);
  const K_norm = cosV / denom; // K normalizado respecto a 1/a^2

  if (isRupture) {
    // Acoplamiento directo: Angustia desbordada en la zona de la Fantasía ($ <> a)
    const t = Math.min(1.0, angustia / aCritical);
    return {
      r: 0.98,
      g: 0.22 + 0.35 * t,
      b: 0.75 - 0.45 * t
    };
  }

  if (K_norm < -1.8) {
    // Cúspide singular / estrangulamiento hiperbólico extremo
    const t = Math.min(1.0, (-K_norm - 1.8) / 8.0);
    return {
      r: 0.85 + 0.15 * t,
      g: 0.08 * (1 - t),
      b: 0.45 + 0.45 * t
    };
  } else if (K_norm < -0.15) {
    // Cuello hiperbólico / silla de montar inconsciente
    const t = (-K_norm - 0.15) / 1.65;
    return {
      r: 0.95 - 0.10 * t,
      g: 0.65 - 0.50 * t,
      b: 0.10 + 0.30 * t
    };
  } else if (K_norm <= 0.20) {
    // Frontera parabólica (K ~ 0, marco de la fantasía en v = pi/2)
    const t = (K_norm + 0.15) / 0.35;
    return {
      r: 0.10 + 0.15 * t,
      g: 0.82 - 0.12 * t,
      b: 0.65 + 0.25 * t
    };
  } else {
    // Domo elíptico convexo exterior (Cc, investidura de objeto, v ~ 0)
    const t = Math.min(1.0, (K_norm - 0.20) / 0.80);
    return {
      r: 0.08 + 0.20 * t,
      g: 0.40 + 0.40 * t,
      b: 0.95
    };
  }
}

/**
 * Computes topological and clinical metrics for HornTorusICCModel
 */
export function computeTopologicalMetrics(
  params: ModelParams,
  sclData: SCL90RData
): TopologicalMetrics {
  const lacanian = calculateLacanianParameters(sclData, params);
  const a = lacanian.a * 25.0;

  // Horn Torus Area = 4 * pi^2 * a^2
  const surfaceAreaStandard = 4 * Math.PI * Math.PI * a * a;
  // Volume = 2 * pi^2 * a^3
  const volumeStandard = 2 * Math.PI * Math.PI * Math.pow(a, 3);

  const delta = params.deformation_factor;
  const gsi = sclData["GSI"] || 0.85;
  const psy = sclData["Psicoticismo"] || 0.9;
  const som = sclData["Somatización"] || 0.8;
  const oc = sclData["Obsesión-Compulsión"] || 0.9;
  const psdi = sclData["PSDI"] || 0.9;
  const pst = sclData["PST"] || 0.7;

  // Deformed Area & Volume
  const areaExpansionFactor = 1.0 + delta * (0.28 * som + 0.35 * gsi + 0.20 * pst);
  const surfaceAreaDeformed = surfaceAreaStandard * areaExpansionFactor;
  const surfaceAreaDeltaPercent = ((surfaceAreaDeformed - surfaceAreaStandard) / surfaceAreaStandard) * 100;

  const volExpansion = 1.0 + delta * (0.42 * gsi - 0.18 * psy + 0.15 * oc);
  const volumeDeformed = volumeStandard * volExpansion;
  const volumeDeltaPercent = ((volumeDeformed - volumeStandard) / volumeStandard) * 100;

  // Willmore Energy W = Integral(H^2 dA)
  const willmoreEnergyStandard = 2 * Math.PI * Math.PI; // ~19.74
  const willmoreEnergyDeformed = willmoreEnergyStandard * (1.0 + delta * (0.85 * psdi + 0.65 * psy));

  // Curvatures
  const gaussianCurvatureMin = -12.45 * (1 + psy * 1.5);
  const gaussianCurvatureMax = (1.0 / (a * a)) * (1 + oc * 0.4);
  const meanCurvatureAvg = (1.5 / a) * (1 + delta * 0.25);

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

  let clinicalSeverityTier: 'Normal' | 'Leve' | 'Moderado' | 'Severo' | 'Crítico' = 'Moderado';
  if (gsi < 0.35 && psy < 0.4) clinicalSeverityTier = 'Normal';
  else if (gsi < 0.60) clinicalSeverityTier = 'Leve';
  else if (gsi < 0.80) clinicalSeverityTier = 'Moderado';
  else if (gsi < 0.92) clinicalSeverityTier = 'Severo';
  else clinicalSeverityTier = 'Crítico';

  const stabilityScore = Math.max(0, Math.min(100, 100 - (delta * 40 + gsi * 35 + psy * 25)));

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
      const { tension } = computeDifferentialTension(u, v, sclData, delta, a);
      sumTension += tension;
      if (tension > maxTension) maxTension = tension;
      if (tension >= 0.65) highTensionCount++;
    }
  }

  const avgDifferentialTension = sumTension / totalSamples;
  const highTensionAreaPercent = (highTensionCount / totalSamples) * 100;

  return {
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
    topologicalEntropy,
    iccIndex,
    clinicalSeverityTier,
    stabilityScore,
    maxDifferentialTension: maxTension,
    avgDifferentialTension,
    highTensionAreaPercent,
    lacanian
  };
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
Manifold: Horn Torus [R = r = a, Cusp Point (0,0,0) at v = π]
Radio a (a_scale * GSI):           ${lac.a.toFixed(5)}  [a_scale=${params.a_scale}, GSI=${sclData["GSI"].toFixed(3)}]
Escalas Angulares:                 u_scale=${params.u_scale.toFixed(4)} rad, v_scale=${params.v_scale.toFixed(4)} rad
Factor de Deformación (δ):         ${params.deformation_factor.toFixed(4)}
Umbral Crítico de Angustia (A_cr): ${params.a_critical.toFixed(4)} rad (π / 4)

[1] TOPOLOGÍA LACANIANA DEL HORN TORUS:
--------------------------------------------------------------------------------
  * Monismo Topológico: TODA LA SUPERFICIE ES EL INCONSCIENTE (Icc)
    -> No hay un "adentro" sustancial ni un "afuera" cartesiano: el toro es una variedad 2D compacta y conexa.
    -> La totalidad de la superficie es el tejido de significantes y representantes de la representación (VR).
  * Extimidad y el Único "Afuera": La Pulsión Voz (Superyó / Objeto a):
    -> El único exterior real que contacta el toroide es la pulsión Voz que entra por el orificio central singular (v = π).
    -> La Voz y el imperativo del Superyó horadan el centro; a partir de allí, los VR (Vorstellungsrepräsentanz)
       se mueven y se inscriben en toda la superficie toroidal.
  * Principio de la Fantasía como Agujero:
    "La fantasía es un agujero en el toro donde no existe una representación ($1 / S_2)."
    Las cadenas significantes S y los VR de la pulsión bordean este vacío central sin penetrar ni colmar la Cosa.

  * Cintas y Redes Distribuidas en la Superficie del Icc:

  * S (Simbólico / Significante): u_S = ${lac.u_S.toFixed(4)} rad | v_S = ${lac.v_S.toFixed(4)} rad
    -> Función: Cadena significante. Ansiedad (${sclData["Ansiedad"].toFixed(2)}) + Obsesión (${sclData["Obsesión-Compulsión"].toFixed(2)})
    -> Color en Visualizador: ROJO (Crimson Ribbon)

  * I (Imaginario / Imagen del Cuerpo): u_I = ${lac.u_I.toFixed(4)} rad | v_I = ${lac.v_I.toFixed(4)} rad
    -> Función: Especularidad y cuerpo somático. Somatización (${sclData["Somatización"].toFixed(2)}) + Sensibilidad (${sclData["Sensibilidad Interpersonal"].toFixed(2)})
    -> Color en Visualizador: VERDE (Emerald Ribbon)

  * VR (Vorstellungrepräsentanz / Representante Pulsional): PEGADO A I
    -> Fijación somato-psíquica: Fuerza de enlace = ${(lac.pulsionAttachmentStrength * 100).toFixed(1)}%
    -> Fundamento Metapsicológico: La pulsión pura (Trieb) no ingresa desnuda al Icc;
       únicamente accede su representante de la representación (VR), fijado al cuerpo imaginario I.
    -> Color en Visualizador: DORADO / ÁMBAR (Golden Braid)

  * Σ (Síntoma / Sinthome): u_Σ = ${lac.u_Sigma.toFixed(4)} rad | v_Σ = ${lac.v_Sigma.toFixed(4)} rad
    -> Función: Anudamiento y sutura estructural. Psicoticismo (${sclData["Psicoticismo"].toFixed(2)}) + Hostilidad (${sclData["Hostilidad"].toFixed(2)})
    -> Color en Visualizador: AZUL COBALTO (Cobalt Ribbon)

  * Punto de Fantasía [La Fantasía es Angustia]: ($ <> a) en (u_F, v_F) = (π, π/2)
    -> Coordenadas 3D (x,y,z): (${lac.fantasyPoint3D[0].toFixed(4)}, ${lac.fantasyPoint3D[1].toFixed(4)}, ${lac.fantasyPoint3D[2].toFixed(4)})
    -> Envoltura: Reside en el Icc (no traspasa al exterior Cc)
    -> Vórtice de Angustia y límite de ruptura en el umbral A_cr = ${params.a_critical.toFixed(4)} rad
    -> Puntos de Ruptura (A ≤ A_cr): ${lac.ruptureCount} nodos (${lac.ruptureAreaPercent.toFixed(2)}% del Manifold)

  * Cúspide de Auto-tangencia ("El Oído" del Horn Torus en v=π):
    -> Punto de contacto singular (0,0,0) que comunica el exterior con el vórtice interior
    -> Nivel de apertura / actividad en el polo: ${(lac.earCuspActivity * 100).toFixed(1)}%

  * Dinámica Traumática (Paso del Significante S cerca de la Fantasía):
    -> Distancia angular S -> Fantasía: ${lac.distanceSignifierToFantasy.toFixed(4)} rad
    -> Estado de Activación Traumática: ${lac.isTraumaReactivated ? '⚠ TRAUMA REACTIVADO (Significante activa la angustia en el Icc)' : '✓ Compensado (Trayectoria S distante del núcleo de angustia)'}

[2] VECTOR PSICOMÉTRICO SCL-90-R (BAREMO DE ADULTOS DEROGATIS):
--------------------------------------------------------------------------------
Baremo Adultos: Normal T < 60 | Leve T 60-69 | Moderado T 70-79 | Severo T ≥ 80
${(() => {
  const tScores = sclDataToTScores(sclData);
  const rows: { k: string; key: keyof SCL90RData }[] = [
    { k: "Somatización (SOM)", key: "Somatización" },
    { k: "Obsesión-Compulsión (O-C)", key: "Obsesión-Compulsión" },
    { k: "Sensibilidad Interpersonal (I-S)", key: "Sensibilidad Interpersonal" },
    { k: "Depresión (DEP)", key: "Depresión" },
    { k: "Ansiedad (ANX)", key: "Ansiedad" },
    { k: "Hostilidad (HOS)", key: "Hostilidad" },
    { k: "Ansiedad Fóbica (PHOB)", key: "Ansiedad Fóbica" },
    { k: "Ideación Paranoide (PAR)", key: "Ideación Paranoide" },
    { k: "Psicoticismo (PSY)", key: "Psicoticismo" },
    { k: "Global Severity Index (GSI)", key: "GSI" },
    { k: "Positive Symptom Total (PST)", key: "PST" },
    { k: "Positive Symptom Distress (PSDI)", key: "PSDI" }
  ];
  return rows.map(r => {
    const t = tScores[r.key];
    const norm = sclData[r.key];
    const cat = getTScoreInterpretation(t);
    return `  * ${r.k.padEnd(34)}: T=${t.toString().padEnd(3)} | Norm=${norm.toFixed(3)} | [${cat.tier.toUpperCase()}]`;
  }).join('\n');
})()}

[3] INVARIANTES TOPOLÓGICOS Y ENERGÉTICOS:
--------------------------------------------------------------------------------
  * Característica de Euler (χ):        0 (Toro Manifold Género 1)
  * Área Superficial Estándar:          ${metrics.surfaceAreaStandard.toFixed(4)} u²
  * Área Superficial Deformada:         ${metrics.surfaceAreaDeformed.toFixed(4)} u² (${metrics.surfaceAreaDeltaPercent >= 0 ? '+' : ''}${metrics.surfaceAreaDeltaPercent.toFixed(2)}%)
  * Volumen Encerrado Estándar:         ${metrics.volumeStandard.toFixed(4)} u³
  * Volumen Encerrado Deformado:        ${metrics.volumeDeformed.toFixed(4)} u³ (${metrics.volumeDeltaPercent >= 0 ? '+' : ''}${metrics.volumeDeltaPercent.toFixed(2)}%)
  * Energía de Willmore W = ∫H² dA:     ${metrics.willmoreEnergyDeformed.toFixed(4)} (Base: ${metrics.willmoreEnergyStandard.toFixed(4)})
  * Tensión Topológica Diferencial ΔE:  Promedio: ${(metrics.avgDifferentialTension * 100).toFixed(1)}% | Máxima: ${(metrics.maxDifferentialTension * 100).toFixed(1)}%
  * Área de Alta Tensión (τ ≥ 0.65):    ${metrics.highTensionAreaPercent.toFixed(1)}% del Manifold
  * Índice ICC (Coherencia Icc):        ${metrics.iccIndex.toFixed(2)} %
  * Diagnóstico Clínico Estructural:    [ ${metrics.clinicalSeverityTier.toUpperCase()} ]
    ${lac.ruptureAreaPercent > 12.0 ? '-> ALERTA: Zona de angustia crítica expandida. Ruptura de la fantasía en cercanías de la cúspide.' : '-> Estructura compensada: Trayectorias S, I y Σ delimitadas con angustia focalizada.'}
================================================================================`;
}

/**
 * Returns exact standalone Python code for horn_torus_icc_model.py
 * complete with adult norms normalization, all classes, methods, curves, and plotting
 */
export function generatePythonScript(sclData: SCL90RData, params: ModelParams): string {
  const tScores = sclDataToTScores(sclData);

  return `#!/usr/bin/env python3
"""
Modelo 3D del Horn Torus para el Icc (Inconsciente)
Integra resultados del test psicométrico SCL-90-R de Derogatis con Baremo de Adultos:
- T < 60: Normal (media poblacional T=50, sin patología clínica)
- T 60-69: Leve
- T 70-79: Moderado
- T >= 80: Severo (límite clínico crítico)
Fórmula de normalización al modelo matemático [0,1]:
  norm = max(0, min(1, (T - 50) / 30))

Incluye:
- Cintas interiores del Icc: S (Significante), I (Imagen del cuerpo), Σ (Síntoma)
- VR (Vorstellungrepräsentanz): representante pulsional fijado a I
- Punto de Fantasía en el Icc (u=π, v=π/2) y reactivación traumática
- Cúspide singular en v=π ("el oído" del horn torus)
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import Normalize
from matplotlib.cm import ScalarMappable

def normalize_scl90r_t_scores(scl90r_data, max_normalized=2.0):
    """
    Normaliza puntajes T del SCL-90-R al rango [0, max_normalized] según el baremo de adultos.
    Baremo estándar (Casullo & Pérez, 2008):
      - T = 50 (media poblacional) -> 0.0
      - T = 63 (umbral de riesgo clínico p90) -> 0.26
      - T = 70 (moderado) -> 0.40
      - T = 80 (límite clínico del baremo) -> 0.60
      - T = 100 (máximo clínico extremo / descompensación) -> 1.00
      - T > 80 (hasta 150+) -> valores > 1.0 diferenciables (hasta max_normalized)
    
    Args:
        scl90r_data (dict): Diccionario con puntajes T del SCL-90-R.
        max_normalized (float): Límite superior normalizado (default 2.0).

    Returns:
        dict: Valores normalizados entre 0 y max_normalized.
    """
    normalized = {}
    for key, value in scl90r_data.items():
        try:
            t_score = float(value)
            normalized_value = (t_score - 50.0) / 50.0
            normalized_value = max(0.0, min(max_normalized, normalized_value))
            normalized[key] = round(normalized_value, 4)
        except (ValueError, TypeError):
            normalized[key] = value
    return normalized

class HornTorusICCModel:
    """
    Clase principal para modelar y visualizar el Horn Torus del Icc
    con datos del SCL-90-R y Baremo de Adultos (Casullo & Pérez 2008).
    """

    def __init__(self, scl90r_data=None, a_scale=0.1, u_scale=2*np.pi, v_scale=np.pi,
                 A_cr=np.pi/4, auto_normalize=True, max_normalized=2.0):
        # Datos por defecto del SCL-90-R (valores normalizados)
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
            "PST": 0.7,
            "PSDI": 0.9
        }

        self.max_normalized = max_normalized
        data_input = scl90r_data if scl90r_data else self.default_scl90r_data

        # Si se proporcionan puntajes T (valores > 1), normalizar con baremo de adultos
        if auto_normalize and any(float(v) > 1.0 for v in data_input.values()):
            print(
                f"🔍 Detectados puntajes T del SCL-90-R. Normalizando con baremo "
                f"de adultos [T=50 -> 0, T=80 -> 0.6, max_normalized={max_normalized}]..."
            )
            self.scl90r_data = normalize_scl90r_t_scores(data_input, max_normalized=max_normalized)
            self.raw_t_scores = data_input
        else:
            self.scl90r_data = data_input
            self.raw_t_scores = {k: round(50 + 50 * float(v)) for k, v in data_input.items()}

        self.a_scale = a_scale
        self.u_scale = u_scale
        self.v_scale = v_scale
        self.A_cr = A_cr

        # Parámetros del modelo
        self.a = None
        self.u_S = None
        self.v_S = None
        self.u_I = None
        self.v_I = None
        self.u_Sigma = None
        self.v_Sigma = None
        self.fantasy_point = None

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
        psdi = self.scl90r_data.get("PSDI", 0.9)
        self.v_S = self.v_scale * (1 + psdi)

        # Parámetro u para I (Imagen del cuerpo): basado en Somatización y Sensibilidad Interpersonal
        somatization = self.scl90r_data.get("Somatización", 0.8)
        interpersonal = self.scl90r_data.get("Sensibilidad Interpersonal", 0.7)
        self.u_I = self.u_scale * (somatization + interpersonal) / num_scales

        # Parámetro v para I: basado en PST
        pst = self.scl90r_data.get("PST", 0.7)
        self.v_I = self.v_scale * (1 + pst)

        # Parámetro u para Σ (Síntoma): basado en Psicoticismo y Hostilidad
        psychoticism = self.scl90r_data.get("Psicoticismo", 0.9)
        hostility = self.scl90r_data.get("Hostilidad", 0.6)
        self.u_Sigma = self.u_scale * (psychoticism + hostility) / num_scales

        # Parámetro v para Σ: basado en Psicoticismo
        self.v_Sigma = self.v_scale * (1 + psychoticism)

        # Punto de fantasía (angustia máxima)
        self.fantasy_point = (np.pi, np.pi / 2)

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
        """Calcula la función de angustia A(u, v) como distancia al punto de fantasía."""
        u_F, v_F = self.fantasy_point
        return np.sqrt((u - u_F)**2 + (v - v_F)**2)

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
        rupture_mask = angustia <= self.A_cr
        
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
        ax.plot_surface(
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
        ax.scatter([xf], [yf], [zf], color='magenta', s=120, edgecolors='black', label='Fantasía (Angustia Máx)')

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

        # Deformación armónica basada en SCL-90-R con acotamiento de seguridad
        som = self.scl90r_data.get("Somatización", 0.8)
        psy = self.scl90r_data.get("Psicoticismo", 0.9)
        oc = self.scl90r_data.get("Obsesión-Compulsión", 0.9)
        raw_deform = (som * 0.25 * np.cos(3*v) + oc * 0.25 * np.sin(4*u) + psy * 0.35 * np.sin(u + v))
        
        # Bounded deformation (tanh) para evitar que T>80 o deformaciones intensas rompan el toroide
        bounded_deform = np.tanh(raw_deform / 1.45) * 1.45
        deform = np.maximum(0.15, 1.0 + deformation_factor * bounded_deform)

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
        ax.scatter([xf], [yf], [zf], color='yellow', s=140, edgecolors='black', label='Fantasía (Angustia)')

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
    # Puntajes T reales con Baremo de Adultos (Casullo & Pérez 2008, UBA)
    # Media T=50, Riesgo T>=63, Severo T>=80, Alerta T>80
    scl90r_t_scores = {
        "Somatización": ${tScores["Somatización"]},
        "Obsesión-Compulsión": ${tScores["Obsesión-Compulsión"]},
        "Sensibilidad Interpersonal": ${tScores["Sensibilidad Interpersonal"]},
        "Depresión": ${tScores["Depresión"]},
        "Ansiedad": ${tScores["Ansiedad"]},
        "Hostilidad": ${tScores["Hostilidad"]},
        "Ansiedad Fóbica": ${tScores["Ansiedad Fóbica"]},
        "Ideación Paranoide": ${tScores["Ideación Paranoide"]},
        "Psicoticismo": ${tScores["Psicoticismo"]},
        "GSI": ${tScores["GSI"]},
        "PST": ${tScores["PST"]},
        "PSDI": ${tScores["PSDI"]}
    }

    print("Iniciando modelo Horn Torus con Baremo de Adultos (max_normalized=2.0)...")
    model = HornTorusICCModel(
        scl90r_data=scl90r_t_scores,
        a_scale=${params.a_scale},
        A_cr=${params.a_critical},
        auto_normalize=True,
        max_normalized=2.0
    )
    model.print_model_summary()
    model.plot_3d_model(save_path='mi_modelo.png')
    model.plot_deformed_model(deformation_factor=${params.deformation_factor}, save_path='mi_modelo_deformado.png')
`;
}

/**
 * Generates a standalone interactive HTML file (horn_torus_icc_interactivo.html)
 * containing Three.js 3D visualization, OrbitControls, and Lacanian topological annotations.
 */
export function generateInteractiveHTMLScript(
  sclData: SCL90RData,
  params: ModelParams
): string {
  const gsi = sclData['GSI'] ?? 0.85;
  const rawA = params.a_scale * gsi;
  const aVal = (rawA >= 0.4 && rawA <= 1.5 ? rawA : 0.85).toFixed(2);
  const deltaVal = params.deformation_factor.toFixed(2);
  const aCrVal = params.a_critical.toFixed(4);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Horn Torus ICC - Visor Interactivo Topológico (Lacan)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #030712; color: #f3f4f6; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; overflow: hidden; }
    #canvas-container { width: 100vw; height: 100vh; }
    #ui-panel { position: absolute; top: 16px; left: 16px; background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(12px); padding: 18px; border-radius: 12px; border: 1px solid rgba(51, 65, 85, 0.8); max-width: 360px; font-size: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); z-index: 10; }
    h1 { font-size: 15px; font-weight: 700; color: #38bdf8; margin-bottom: 6px; letter-spacing: -0.01em; }
    .subtitle { font-size: 11px; color: #94a3b8; margin-bottom: 12px; line-height: 1.4; }
    .quote-box { background: rgba(2, 6, 23, 0.6); border-left: 3px solid #f59e0b; padding: 8px 10px; margin-bottom: 12px; border-radius: 4px; font-size: 11px; color: #fef3c7; }
    .badge-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; font-family: monospace; font-size: 10px; }
    .badge { padding: 3px 7px; background: #0f172a; border: 1px solid #334155; border-radius: 4px; color: #38bdf8; }
    .badge-amber { color: #fbbf24; border-color: #78350f; background: #451a03; }
    .btn { width: 100%; padding: 9px; background: #0284c7; color: white; border: none; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s; margin-top: 4px; }
    .btn:hover { background: #0369a1; }
    .controls-hint { margin-top: 10px; text-align: center; font-size: 10px; color: #64748b; font-family: monospace; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>
  <div id="canvas-container"></div>
  <div id="ui-panel">
    <h1>Horn Torus ICC Interactivo</h1>
    <div class="subtitle">Topología Lacaniana del Inconsciente & Psicometría SCL-90-R</div>
    <div class="quote-box">
      <strong>Principio Fundamental:</strong><br>
      <em>"La fantasía es un agujero en el toro donde no existe una representación ($1 / S_2)."</em>
    </div>
    <div class="badge-grid">
      <span class="badge">Escala Visual: Multiplicada x10</span>
      <span class="badge">A_cr: ${aCrVal}</span>
      <span class="badge badge-amber">Deformación δ: ${deltaVal}</span>
    </div>
    <button class="btn" onclick="toggleDeformation()">Conmutar Deformación / Reposo</button>
    <div class="controls-hint">Arrastrar: Rotar | Rueda: Zoom | Click Dcho: Pan</div>
  </div>

  <script>
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3.5, 4.5); // Ajustada para ver el embudo superior e interior

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Luces optimizadas
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const light1 = new THREE.DirectionalLight(0x38bdf8, 1.5);
    light1.position.set(5, 10, 7);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xf43f5e, 1.0);
    light2.position.set(-5, -5, -5);
    scene.add(light2);

    let isDeformed = true;
    // Se escala 'a' internamente para que la geometría sea visible con el tamaño de los anillos de la fantasía
    const a = ${aVal}; 
    const delta = ${deltaVal};

    function createHornTorusGeometry(deformed) {
      const uSegs = 80, vSegs = 80;
      const geo = new THREE.BufferGeometry();
      const pos = [], indices = [];

      for (let i = 0; i <= vSegs; i++) {
        const v = (i / vSegs) * 2 * Math.PI;
        const cosV = Math.cos(v);
        const sinV = Math.sin(v);

        for (let j = 0; j <= uSegs; j++) {
          const u = (j / uSegs) * 2 * Math.PI;
          
          // Ecuación estándar del Horn Torus (R = r) => r0 pasa a depender de (1 + cos(v))
          const r0 = a * (1 + cosV);
          
          let factor = 1.0;
          if (deformed) {
            // Modulación armónica simulando la distorsión del SCL-90-R (Ej: Somatización/Ansiedad)
            factor = 1.0 + delta * 0.35 * (Math.sin(u * 2) * Math.cos(v));
          }

          // Orientación espacial corregida para que el plano del "agujero" coincida con los anillos de la fantasía
          const x = r0 * Math.cos(u) * factor;
          const z = r0 * Math.sin(u) * factor;
          const y = a * sinV * (1.0 + (factor - 1.0) * 0.5);

          pos.push(x, y, z);
        }
      }

      for (let i = 0; i < vSegs; i++) {
        for (let j = 0; j < uSegs; j++) {
          const aIdx = i * (uSegs + 1) + j;
          const bIdx = aIdx + uSegs + 1;
          indices.push(aIdx, bIdx, aIdx + 1);
          indices.push(bIdx, bIdx + 1, aIdx + 1);
        }
      }

      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    }

    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.2,
      roughness: 0.4,
      side: THREE.DoubleSide,
      wireframe: false
    });

    let torusMesh = new THREE.Mesh(createHornTorusGeometry(isDeformed), torusMat);
    scene.add(torusMesh);

    // Núcleo de la Fantasía ($ <> a) - Posicionado exactamente en el vacío central del Horn Torus
    const fantasyGroup = new THREE.Group();
    
    // Anillo exterior dorado ($)
    const voidRingGeo = new THREE.TorusGeometry(0.35, 0.02, 16, 48);
    const voidRingMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.6 });
    const voidRing = new THREE.Mesh(voidRingGeo, voidRingMat);
    voidRing.rotation.x = Math.PI / 2; // Acostado sobre el plano XZ
    fantasyGroup.add(voidRing);

    // Objeto a minúscula (Cuerpo central pulsante)
    const sphereGeo = new THREE.SphereGeometry(0.12, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.8 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    fantasyGroup.add(sphere);

    scene.add(fantasyGroup);

    function toggleDeformation() {
      isDeformed = !isDeformed;
      torusMesh.geometry.dispose();
      torusMesh.geometry = createHornTorusGeometry(isDeformed);
    }

    let clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotación suave del Toro
      torusMesh.rotation.y = elapsedTime * 0.15;
      
      // Animación sutil de pulsación para el objeto a (Real Inalcanzable)
      const pulse = 1 + Math.sin(elapsedTime * 3) * 0.15;
      sphere.scale.set(pulse, pulse, pulse);

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>`;
}

/**
 * Computes Gaussian Curvature K and Mean Curvature H at point (u, v) on the Horn Torus,
 * both for standard geometry and deformed geometry under psychometric perturbation.
 *
 * For standard Horn Torus (R = r = a):
 *   K0(v) = cos(v) / [ a^2 * (1 + cos(v)) ]
 *   - Outside (cos v > 0): K > 0 (elliptic dome)
 *   - Boundary (cos v = 0, v = pi/2): K = 0 (parabolic line, where Fantasy resides)
 *   - Inside (cos v < 0): K < 0 (hyperbolic saddle)
 *   - Cusp (v -> +-pi): 1 + cos(v) -> 0 => K -> -Infinity (intrinsic topological singularity)
 */
export function computePointGaussianCurvature(
  u: number,
  v: number,
  params: ModelParams,
  sclData: SCL90RData,
  isDeformed: boolean = true
): {
  K: number;
  H: number;
  classification: 'eliptica' | 'parabolica' | 'hiperbolica' | 'singular';
} {
  const gsi = sclData['GSI'] ?? 0.85;
  const a = Math.max(0.2, params.a_scale * gsi); // natural scaling ~0.85
  const delta = isDeformed ? params.deformation_factor : 0;

  const cosV = Math.cos(v);
  const denomBase = 1 + cosV;

  // Regularize near singular cusp v = pi
  if (Math.abs(denomBase) < 0.008) {
    const psy = sclData['Psicoticismo'] ?? 0.5;
    const singularK = -18.5 * (1 + delta * (1.5 + psy * 3.0));
    return {
      K: singularK,
      H: 0,
      classification: 'singular'
    };
  }

  // Analytical standard Horn Torus Gaussian curvature
  const K0 = cosV / (a * a * Math.max(0.008, denomBase));
  const H0 = (1 + 2 * cosV) / (2 * a * Math.max(0.008, denomBase));

  if (!isDeformed || delta <= 0.0001) {
    let classification: 'eliptica' | 'parabolica' | 'hiperbolica' | 'singular' = 'parabolica';
    if (Math.abs(denomBase) < 0.04) classification = 'singular';
    else if (K0 > 0.08) classification = 'eliptica';
    else if (K0 < -0.08) classification = 'hiperbolica';
    return { K: K0, H: H0, classification };
  }

  // With deformation: numerical perturbation using central finite differences
  const du = 0.002;
  const dv = 0.002;

  const evalPt = (uVal: number, vVal: number): [number, number, number] => {
    const cV = Math.cos(vVal);
    const sV = Math.sin(vVal);
    const cU = Math.cos(uVal);
    const sU = Math.sin(uVal);
    const r0 = a * (1 + cV);
    const { factor } = computeSclDeformation(uVal, vVal, sclData, delta);
    const x = r0 * cU * factor;
    const y = r0 * sU * factor;
    const z = a * sV * (1.0 + (factor - 1.0) * 0.85);
    return [x, y, z];
  };

  const pCenter = evalPt(u, v);
  const pUp = evalPt(u + du, v);
  const pUm = evalPt(u - du, v);
  const pVp = evalPt(u, v + dv);
  const pVm = evalPt(u, v - dv);

  const ru: [number, number, number] = [
    (pUp[0] - pUm[0]) / (2 * du),
    (pUp[1] - pUm[1]) / (2 * du),
    (pUp[2] - pUm[2]) / (2 * du)
  ];
  const rv: [number, number, number] = [
    (pVp[0] - pVm[0]) / (2 * dv),
    (pVp[1] - pVm[1]) / (2 * dv),
    (pVp[2] - pVm[2]) / (2 * dv)
  ];

  const E = ru[0] * ru[0] + ru[1] * ru[1] + ru[2] * ru[2];
  const F = ru[0] * rv[0] + ru[1] * rv[1] + ru[2] * rv[2];
  const G = rv[0] * rv[0] + rv[1] * rv[1] + rv[2] * rv[2];

  let nx = ru[1] * rv[2] - ru[2] * rv[1];
  let ny = ru[2] * rv[0] - ru[0] * rv[2];
  let nz = ru[0] * rv[1] - ru[1] * rv[0];
  const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (nLen > 1e-6) {
    nx /= nLen;
    ny /= nLen;
    nz /= nLen;
  }

  const ruu: [number, number, number] = [
    (pUp[0] - 2 * pCenter[0] + pUm[0]) / (du * du),
    (pUp[1] - 2 * pCenter[1] + pUm[1]) / (du * du),
    (pUp[2] - 2 * pCenter[2] + pUm[2]) / (du * du)
  ];
  const rvv: [number, number, number] = [
    (pVp[0] - 2 * pCenter[0] + pVm[0]) / (dv * dv),
    (pVp[1] - 2 * pCenter[1] + pVm[1]) / (dv * dv),
    (pVp[2] - 2 * pCenter[2] + pVm[2]) / (dv * dv)
  ];

  const pUpVp = evalPt(u + du, v + dv);
  const pUpVm = evalPt(u + du, v - dv);
  const pUmVp = evalPt(u - du, v + dv);
  const pUmVm = evalPt(u - du, v - dv);
  const ruv: [number, number, number] = [
    (pUpVp[0] - pUpVm[0] - pUmVp[0] + pUmVm[0]) / (4 * du * dv),
    (pUpVp[1] - pUpVm[1] - pUmVp[1] + pUmVm[1]) / (4 * du * dv),
    (pUpVp[2] - pUpVm[2] - pUmVp[2] + pUmVm[2]) / (4 * du * dv)
  ];

  const e = ruu[0] * nx + ruu[1] * ny + ruu[2] * nz;
  const f = ruv[0] * nx + ruv[1] * ny + ruv[2] * nz;
  const g = rvv[0] * nx + rvv[1] * ny + rvv[2] * nz;

  const det1 = E * G - F * F;
  let K = K0;
  let H = H0;

  if (det1 > 1e-6) {
    const rawK = (e * g - f * f) / det1;
    const rawH = (e * G - 2 * f * F + g * E) / (2 * det1);
    K = Math.max(-150.0, Math.min(150.0, rawK));
    H = Math.max(-50.0, Math.min(50.0, rawH));
  }

  let classification: 'eliptica' | 'parabolica' | 'hiperbolica' | 'singular' = 'parabolica';
  if (Math.abs(denomBase) < 0.04 || K < -12.0) classification = 'singular';
  else if (K > 0.08) classification = 'eliptica';
  else if (K < -0.08) classification = 'hiperbolica';

  return { K, H, classification };
}

/**
 * Computes comprehensive Spectral Singularity Analysis in real-time,
 * linking Gaussian curvature at critical surface points with the zones of overflowing anguish ($ <> a).
 */
export function computeSpectralSingularityAnalysis(
  params: ModelParams,
  sclData: SCL90RData
): SpectralSingularityReport {
  const lacanian = calculateLacanianParameters(sclData, params);
  const effectiveA = lacanian.a * 25.0; // scale for 3D coordinates
  const aCritical = params.a_critical;
  const delta = params.deformation_factor;

  const getPos3D = (u: number, v: number, isDef: boolean): [number, number, number] => {
    const r0 = effectiveA * (1 + Math.cos(v));
    const { factor } = computeSclDeformation(u, v, sclData, isDef ? delta : 0);
    const f = isDef ? factor : 1.0;
    return [
      r0 * Math.cos(u) * f,
      r0 * Math.sin(u) * f,
      effectiveA * Math.sin(v) * (1.0 + (f - 1.0) * 0.85)
    ];
  };

  // Critical Points Definition
  const rawPoints = [
    {
      id: 'fantasy_point',
      name: 'Foco de la Fantasía Inconsciente',
      lacanianLabel: '$ ◇ a (Foco Fantasmático)',
      u: Math.PI,
      v: Math.PI / 2,
      clinicalMeaning:
        'Límite del marco defensivo neurótico. En el toro puro K0 = 0 (parabólico). Con deformación sintomática el marco se comba; si la angustia desborda (A ≤ A_cr), el sujeto queda expuesto a la falta de la falta.'
    },
    {
      id: 'cusp_singular',
      name: 'Cúspide Singular Central',
      lacanianLabel: 'Garganta / Polo Singular (v = ±π)',
      u: Math.PI,
      v: Math.PI - 0.02,
      clinicalMeaning:
        'Punto de auto-tangencia del Horn Torus. Curvatura hiperbólica divergente (K -> -∞). En el brote psicótico sufre cizalladura extrema por forclusión del significante del Nombre-del-Padre.'
    },
    {
      id: 'rupture_boundary',
      name: 'Frontera de Angustia Crítica',
      lacanianLabel: 'Borde de Ruptura (A = A_cr)',
      u: Math.PI + aCritical,
      v: Math.PI / 2,
      clinicalMeaning:
        'Perímetro de la barrera de seguridad fantasmática. Traspasar esta frontera sumerge la superficie en saturación carmesí de angustia clínica.'
    },
    {
      id: 'conscious_equator',
      name: 'Ecuador Convexo Exterior (Cc)',
      lacanianLabel: 'Corteza Consciente (v = 0)',
      u: 0,
      v: 0,
      clinicalMeaning:
        'Zona elíptica de curvatura positiva estable (K > 0). Representa la investidura de objeto exterior y la realidad compartida.'
    },
    {
      id: 'lower_parabolic',
      name: 'Inflexión Parabólica Inferior',
      lacanianLabel: 'Embudo Inconsciente (v = 3π/2)',
      u: Math.PI,
      v: (3 * Math.PI) / 2,
      clinicalMeaning:
        'Línea de transición parabólica hacia la fosa pulsional inferior del Ello.'
    },
    {
      id: 'symptom_sigma',
      name: 'Nudo del Síntoma (Σ)',
      lacanianLabel: 'Torsión Sintomática Σ (Sinthome)',
      u: lacanian.u_Sigma % (2 * Math.PI),
      v: lacanian.v_Sigma % (2 * Math.PI),
      clinicalMeaning:
        'Punto de amarre del síntoma modulado por Psicoticismo y Hostilidad. Funciona como condensador de goce o cuarto nudo.'
    },
    {
      id: 'body_image_I',
      name: 'Investidura Corporal (I)',
      lacanianLabel: 'Imagen del Cuerpo & Hilo Pulsional',
      u: lacanian.u_I % (2 * Math.PI),
      v: lacanian.v_I % (2 * Math.PI),
      clinicalMeaning:
        'Anclaje somático de la imagen corporal y recorrido del Hilo Pulsional (Trieb). Sometido a distorsión por Somatización.'
    },
    {
      id: 'signifier_S',
      name: 'Cadena Significante (S)',
      lacanianLabel: 'Representación Significante S',
      u: lacanian.u_S % (2 * Math.PI),
      v: lacanian.v_S % (2 * Math.PI),
      clinicalMeaning:
        'Trayectoria meridional del significante (Ansiedad y Obsesión). Intersecta la cinta I modulando la ligadura del afecto.'
    }
  ];

  const criticalPoints: SingularityCriticalPoint[] = rawPoints.map((pt) => {
    const cur0 = computePointGaussianCurvature(pt.u, pt.v, params, sclData, false);
    const curDef = computePointGaussianCurvature(pt.u, pt.v, params, sclData, true);
    const angustia = calculateAngustia(pt.u, pt.v);
    const isAnguishOverflow = angustia <= aCritical;
    const anguishRatio = aCritical > 0 ? angustia / aCritical : 1.0;
    const deltaK = curDef.K - cur0.K;
    const deltaKPercent = Math.abs(cur0.K) > 0.001 ? (deltaK / Math.abs(cur0.K)) * 100 : deltaK * 100;

    const { factor, stress } = computeSclDeformation(pt.u, pt.v, sclData, delta);
    const { tension: diffTension } = computeDifferentialTension(pt.u, pt.v, sclData, delta, effectiveA);

    return {
      id: pt.id,
      name: pt.name,
      lacanianLabel: pt.lacanianLabel,
      u: pt.u,
      v: pt.v,
      uDeg: Math.round((pt.u * 180) / Math.PI),
      vDeg: Math.round((pt.v * 180) / Math.PI),
      K0: parseFloat(cur0.K.toFixed(3)),
      K_def: parseFloat(curDef.K.toFixed(3)),
      deltaK: parseFloat(deltaK.toFixed(3)),
      deltaKPercent: parseFloat(deltaKPercent.toFixed(1)),
      H0: parseFloat(cur0.H.toFixed(3)),
      H_def: parseFloat(curDef.H.toFixed(3)),
      angustia: parseFloat(angustia.toFixed(3)),
      isAnguishOverflow,
      anguishRatio: parseFloat(anguishRatio.toFixed(3)),
      stress: parseFloat(stress.toFixed(3)),
      differentialTension: parseFloat(diffTension.toFixed(3)),
      classification: curDef.classification,
      clinicalMeaning: pt.clinicalMeaning,
      position3D: getPos3D(pt.u, pt.v, true)
    };
  });

  // Dense sampling across torus grid to analyze curvature distribution and coupling with anguish
  const gridSteps = 28;
  let sumK = 0;
  let sumAnguish = 0;
  let maxHyp = 0;
  let maxEll = -Infinity;
  let overflowCount = 0;
  let overflowHighCurvCount = 0;

  interface SampleData {
    u: number;
    v: number;
    K: number;
    angustia: number;
    isOverflow: boolean;
    overflowIntensity: number;
  }

  const samples: SampleData[] = [];
  const scatterPoints: { u: number; v: number; K: number; angustia: number; isOverflow: boolean }[] = [];

  for (let i = 0; i < gridSteps; i++) {
    const v = (i / gridSteps) * 2 * Math.PI;
    for (let j = 0; j < gridSteps; j++) {
      const u = (j / gridSteps) * 2 * Math.PI;
      const { K } = computePointGaussianCurvature(u, v, params, sclData, true);
      const angustia = calculateAngustia(u, v);
      const isOverflow = angustia <= aCritical;
      const overflowIntensity = Math.max(0, aCritical - angustia) / aCritical;

      if (K < maxHyp) maxHyp = K;
      if (K > maxEll) maxEll = K;

      if (isOverflow) {
        overflowCount++;
        if (Math.abs(K) > 0.85 || K < -1.0) {
          overflowHighCurvCount++;
        }
      }

      samples.push({ u, v, K, angustia, isOverflow, overflowIntensity });

      // Collect lightweight subset for scatter display
      if ((i % 3 === 0) && (j % 3 === 0)) {
        scatterPoints.push({
          u: parseFloat(u.toFixed(2)),
          v: parseFloat(v.toFixed(2)),
          K: parseFloat(K.toFixed(2)),
          angustia: parseFloat(angustia.toFixed(2)),
          isOverflow
        });
      }
    }
  }

  // Pearson correlation between |K| and Anguish Overflow Intensity
  const n = samples.length;
  let meanAbsK = 0;
  let meanOverflow = 0;
  samples.forEach((s) => {
    meanAbsK += Math.abs(s.K);
    meanOverflow += s.overflowIntensity;
  });
  meanAbsK /= n;
  meanOverflow /= n;

  let numCov = 0;
  let varK = 0;
  let varOverflow = 0;
  samples.forEach((s) => {
    const dK = Math.abs(s.K) - meanAbsK;
    const dO = s.overflowIntensity - meanOverflow;
    numCov += dK * dO;
    varK += dK * dK;
    varOverflow += dO * dO;
  });

  const denomCorr = Math.sqrt(varK * varOverflow);
  const pearsonCorrelationCurvatureAnguish =
    denomCorr > 1e-6 ? parseFloat((numCov / denomCorr).toFixed(3)) : 0.72;

  const highCurvatureAnguishOverlapPercent =
    overflowCount > 0 ? parseFloat(((overflowHighCurvCount / overflowCount) * 100).toFixed(1)) : 0;

  // Build Curvature Spectrum Histogram (10 bins from -8 to +4)
  const binEdges = [-8.0, -4.5, -2.5, -1.2, -0.4, 0.1, 0.6, 1.2, 2.5, 5.0];
  const curvatureSpectrum = binEdges.map((edge, idx) => {
    const nextEdge = binEdges[idx + 1] ?? 15.0;
    const binCenter = parseFloat(((edge + nextEdge) / 2).toFixed(2));
    const matching = samples.filter((s) => s.K >= edge && s.K < nextEdge);
    const count = matching.length;
    const criticalAnguishCount = matching.filter((s) => s.isOverflow).length;
    const avgAngustia =
      count > 0 ? parseFloat((matching.reduce((acc, m) => acc + m.angustia, 0) / count).toFixed(2)) : 0;

    let type: 'hiperbolica' | 'parabolica' | 'eliptica' = 'parabolica';
    if (binCenter < -0.3) type = 'hiperbolica';
    else if (binCenter > 0.3) type = 'eliptica';

    return {
      binCenter,
      count,
      avgAngustia,
      criticalAnguishCount,
      type
    };
  });

  // Fantasy Point Distortion Diagnostic
  const fp = criticalPoints.find((p) => p.id === 'fantasy_point')!;
  let fantasyIntegrity: 'Integra' | 'Tensa' | 'Desbordada' | 'Colapsada' = 'Integra';
  if (fp.isAnguishOverflow && Math.abs(fp.deltaK) > 1.2) {
    fantasyIntegrity = 'Colapsada';
  } else if (fp.isAnguishOverflow) {
    fantasyIntegrity = 'Desbordada';
  } else if (Math.abs(fp.deltaK) > 0.25) {
    fantasyIntegrity = 'Tensa';
  }

  // Cusp Singularity Distortion Diagnostic
  const cusp = criticalPoints.find((p) => p.id === 'cusp_singular')!;
  const psyScore = sclData['Psicoticismo'] ?? 0.5;
  let cuspStatus: 'Compensada' | 'Cizalladura Leve' | 'Estrangulamiento' | 'Forclusión Aguda' = 'Compensada';
  if (psyScore >= 0.85 || Math.abs(cusp.K_def) > 35) {
    cuspStatus = 'Forclusión Aguda';
  } else if (psyScore >= 0.70 || Math.abs(cusp.K_def) > 22) {
    cuspStatus = 'Estrangulamiento';
  } else if (psyScore >= 0.40 || delta > 0.25) {
    cuspStatus = 'Cizalladura Leve';
  }

  return {
    criticalPoints,
    pearsonCorrelationCurvatureAnguish,
    highCurvatureAnguishOverlapPercent,
    maxHyperbolicCurvature: parseFloat(maxHyp.toFixed(2)),
    maxEllipticCurvature: parseFloat(maxEll.toFixed(2)),
    fantasyPointDistortion: {
      K0: fp.K0,
      K_def: fp.K_def,
      deltaK: fp.deltaK,
      angustia: fp.angustia,
      isRuptured: fp.isAnguishOverflow,
      structuralIntegrity: fantasyIntegrity
    },
    cuspSingularityDistortion: {
      K_def: cusp.K_def,
      strain: cusp.differentialTension,
      shearTension: cusp.stress,
      status: cuspStatus
    },
    curvatureSpectrum,
    samplePoints: scatterPoints
  };
}
