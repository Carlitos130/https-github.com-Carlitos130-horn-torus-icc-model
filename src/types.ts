export interface SCL90RData {
  "Somatización": number;
  "Obsesión-Compulsión": number;
  "Sensibilidad Interpersonal": number;
  "Depresión": number;
  "Ansiedad": number;
  "Hostilidad": number;
  "Ansiedad Fóbica": number;
  "Ideación Paranoide": number;
  "Psicoticismo": number;
  "GSI": number; // Global Severity Index
  "PST": number; // Positive Symptom Total
  "PSDI": number; // Positive Symptom Distress Index
}

export interface ModelParams {
  a_scale: number; // Scale factor, default 0.1
  u_scale: number; // default 2 * Math.PI
  v_scale: number; // default Math.PI
  deformation_factor: number; // default 0.3
  gridResolution: number; // e.g., 80
  a_critical: number; // Critical anguish threshold A_cr = Math.PI / 4 (radio de la vecindad de cada marca)
  rOverR: number; // r/R ratio in (0, 1]; 1 = horn torus (limit), < 1 = smooth torus
  /** Número de marcas de fantasía (Resumen §8: una o varias — default 1). */
  fantasyMarkCount?: number;
  /** Baremo de la población (sexo × edad) para todos los puntajes T. */
  baremoId?: BaremoId;
  /** Wegbreite (Corolario I al Axioma 4, tesis V22): anchura del cruce por el
   *  adelgazamiento de la pared (la censura Icc/Prcc). Sin anchura suficiente el
   *  cruce se disipa aunque la cantidad (IGS) alcance el umbral. Default false. */
  wegbreiteAplicada?: boolean;
}

export interface LacanianCoordinates {
  a: number; // a = a_scale * GSI
  rOverR: number; // r/R ratio in (0, 1]; 1 = horn torus (limit)
  R: number; // revolution radius = a (natural scale)
  r: number; // tube radius = rOverR * a (natural scale)
  u_S: number;
  v_S: number;
  u_I: number;
  v_I: number;
  u_Pulsion: number; // Hilo Pulsional (Trieb · Drang) pegado al borde de I
  v_Pulsion: number;
  pulsionAttachmentStrength: number;
  u_Sigma: number;
  v_Sigma: number;
  fantasyPointUV: [number, number]; // marca principal de fantasía (la primera de fantasyMarks)
  fantasyPoint3D: [number, number, number];
  /**
   * Marcas de fantasía en (u, v) — Resumen §8 resuelto: la fantasía son MARCAS
   * Icc de trauma, distintas entre sí (una o varias; el modelo admite N).
   * La angustia A(u,v) es el máximo sobre las vecindades (A_cr) de todas.
   */
  fantasyMarks: { u: number; v: number }[];
  fantasyMarks3D: [number, number, number][];
  ruptureCount: number;
  ruptureAreaPercent: number;
}

import type { BaremoId } from './utils/baremos';

export type ViewMode = 'standard' | 'deformed' | 'comparison' | 'cross_section' | 'interior_icc' | 'xray_icc';

export type { BaremoId } from './utils/baremos';

export type ColorMapMode = 'angustia' | 'stress' | 'differential_stress' | 'curvature' | 'elevation';

/**
 * Estado visual de la secuencia de ruptura psicótica de las cintas S, I y Pulsión:
 * 'idle' = estable · 'ejected' = eyectadas por el orificio (sale la voz) · 'covered' =
 * reconfiguradas cubriendo toda la superficie del horn torus.
 */
export type RuptureVisualState = 'idle' | 'ejected' | 'covered';

/**
 * Estado post-episodio: el toro reconfigurado "ya es otra cosa". La topología no
 * cambia (límite horn, χ=1) — cambia la estructura sobre ella: cintas cubriendo
 * toda la superficie, fantasía integrada a la voz que salió por el orificio.
 * La derivación de cada parámetro vive en hornTorusMath.computePostEpisodeState.
 */
export interface PostEpisodeState {
  topologyLabel: string;
  coveragePercent: number;
  fantasyIntegrated: boolean;
  voiceAsContinue: boolean;
  integrativeCapacity: number;
  episodeIntensity: number;
  clinicalLoad: number;
  /** Corolario II (Umbau): cadena de S reenganchada en orden nuevo tras el pasaje. */
  umbauCadenaS: { labels: string[]; reenganche: string };
  /** Corolario II (Umbau): cadena de I reenganchada en orden nuevo tras el pasaje. */
  umbauCadenaI: { labels: string[]; reenganche: string };
  postEpisodeLabel: string;
}

export interface TopologicalMetrics {
  surfaceAreaStandard: number;
  surfaceAreaDeformed: number;
  surfaceAreaDeltaPercent: number;
  volumeStandard: number;
  volumeDeformed: number;
  volumeDeltaPercent: number;
  willmoreEnergyStandard: number;
  willmoreEnergyDeformed: number;
  meanCurvatureAvg: number;
  gaussianCurvatureMin: number;
  gaussianCurvatureMax: number;
  // Family regime (r -> R): only exact for smooth members; the limit r = R
  // (horn torus) is T^2 / lambda_int, NOT a manifold and its genus is undefined.
  esVariedad: boolean; // false at the limit r = R
  eulerCharacteristic: number; // chi = 0 (smooth) | 1 (limit)
  rangoH1: number; // rank of H1 = Z^2<mu, lambda> (2) | Z<mu> (1)
  rOverR: number; // echo of params.rOverR, for reporting
  baremoId: BaremoId; // población del baremo usado para todos los T
  tScoreGsi: number; // T-score del IGS interpolado del baremo de la población elegida (60 = corte)
  tScores: Record<string, number>; // interpolated T score of every scale (same baremo), clamped to the published 30–80
  fueraDeBaremo: Record<string, 'bajo' | 'alto'>; // scales whose raw score falls below / above the published table
  escalasClinicas: string[]; // scales at or above T = 60 (symptomatic)
  escalaMasAlterada: string; // scale with the highest interpolated T score
  tScoreEscalaMasAlterada: number; // its T score
  topologicalEntropy: number;
  iccIndex: number; // 0 - 100%
  clinicalSeverityTier: 'Normal' | 'Leve' | 'Moderado' | 'Severo' | 'Crítico';
  stabilityScore: number;
  maxDifferentialTension: number;
  avgDifferentialTension: number;
  highTensionAreaPercent: number;
  // Ruptura psicótica fuera de baremo (IGS >= 3× corte T=60): las cintas S, I y
  // Pulsión se eyectan por el orificio (cúspide v = π, por donde sale la voz) y
  // luego se reconfiguran cubriendo toda la superficie.
  psychoticRupture: boolean;
  ruptureGsiThreshold: number; // IGS threshold: 3 × BAREMO_T60_GSI = 3.30
  gsiOverCutoff: number; // IGS / corte, capped at 9.99
  postEpisode: PostEpisodeState | null;
  lacanian: LacanianCoordinates;
}

