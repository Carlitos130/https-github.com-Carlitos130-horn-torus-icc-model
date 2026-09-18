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

export type SCL90RInputMode = 't_scores' | 'normalized';

export interface TScoreCategory {
  tier: 'Normal' | 'Leve' | 'Moderado' | 'Severo' | 'Extremo';
  rangeLabel: string;
  badgeClass: string;
  textColor: string;
  description: string;
  isRisk?: boolean;
  isAlert?: boolean;
}

export interface ModelParams {
  a_scale: number; // Scale factor, default 0.1
  u_scale: number; // default 2 * Math.PI
  v_scale: number; // default Math.PI
  deformation_factor: number; // default 0.3
  gridResolution: number; // e.g., 80
  a_critical: number; // Critical anguish threshold A_cr = Math.PI / 4
  max_normalized?: number; // Maximum normalization ceiling (default 2.0 to support T > 80)
}

export interface CasulloPerezNormRow {
  T: number;
  SOM: number;
  OBS: number;
  SI: number;
  DEP: number;
  ANS: number;
  HOS: number;
  FOB: number;
  PAR: number;
  PSIC: number;
  IGS: number;
  TSP: number;
  IMSP: number;
}

export interface LacanianCoordinates {
  a: number; // a = a_scale * GSI
  u_S: number;
  v_S: number;
  u_I: number;
  v_I: number;
  u_Pulsion: number; // Hilo Pulsional (Trieb / VR Vorstellungrepräsentanz) pegado a I
  v_Pulsion: number;
  pulsionAttachmentStrength: number;
  u_Sigma: number;
  v_Sigma: number;
  fantasyPointUV: [number, number]; // (pi, pi / 2) - La fantasía es angustia en el Icc
  fantasyPoint3D: [number, number, number];
  ruptureCount: number;
  ruptureAreaPercent: number;
  // Signifier-Fantasy proximity (Trauma / Anguish reactivation)
  distanceSignifierToFantasy: number;
  isTraumaReactivated: boolean;
  earCuspActivity: number; // Activity at the central hole (v=pi)
  // La fantasía es un agujero en el toro donde no existe representación
  fantasyHoleVoidRadius: number; // Radio cero/vacío del agujero central (v=pi)
  nonRepresentabilityIndex: number; // Índice de la imposibilidad de representación significante (S1->S2) en el agujero
  fantasyHoleDescription: string;
  // Extimidad: Intrusión de la pulsión Voz (Superyó / Objeto a) como único "afuera" que horada el toroide
  voiceIntrusionVector: [number, number, number];
  extimacyDescription: string;
}

export type ViewMode = 'standard' | 'deformed' | 'comparison' | 'cross_section' | 'interior_icc' | 'xray_icc';

export type ColorMapMode = 'angustia' | 'stress' | 'differential_stress' | 'curvature' | 'elevation';

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
  topologicalEntropy: number;
  iccIndex: number; // 0 - 100%
  clinicalSeverityTier: 'Normal' | 'Leve' | 'Moderado' | 'Severo' | 'Crítico';
  stabilityScore: number;
  maxDifferentialTension: number;
  avgDifferentialTension: number;
  highTensionAreaPercent: number;
  lacanian: LacanianCoordinates;
}

export interface SingularityCriticalPoint {
  id: string;
  name: string;
  lacanianLabel: string;
  u: number;
  v: number;
  uDeg: number;
  vDeg: number;
  K0: number; // Curvatura Gaussiana en el Toro Horn estándar
  K_def: number; // Curvatura Gaussiana con deformación sintomática
  deltaK: number; // K_def - K0
  deltaKPercent: number;
  H0: number; // Curvatura Media estándar
  H_def: number; // Curvatura Media deformada
  angustia: number;
  isAnguishOverflow: boolean; // angustia <= a_critical
  anguishRatio: number;
  stress: number;
  differentialTension: number;
  classification: 'eliptica' | 'parabolica' | 'hiperbolica' | 'singular';
  clinicalMeaning: string;
  position3D: [number, number, number];
}

export interface SpectralSingularityReport {
  criticalPoints: SingularityCriticalPoint[];
  pearsonCorrelationCurvatureAnguish: number;
  highCurvatureAnguishOverlapPercent: number;
  maxHyperbolicCurvature: number;
  maxEllipticCurvature: number;
  fantasyPointDistortion: {
    K0: number;
    K_def: number;
    deltaK: number;
    angustia: number;
    isRuptured: boolean;
    structuralIntegrity: 'Integra' | 'Tensa' | 'Desbordada' | 'Colapsada';
  };
  cuspSingularityDistortion: {
    K_def: number;
    strain: number;
    shearTension: number;
    status: 'Compensada' | 'Cizalladura Leve' | 'Estrangulamiento' | 'Forclusión Aguda';
  };
  curvatureSpectrum: {
    binCenter: number;
    count: number;
    avgAngustia: number;
    criticalAnguishCount: number;
    type: 'hiperbolica' | 'parabolica' | 'eliptica';
  }[];
  samplePoints: {
    u: number;
    v: number;
    K: number;
    angustia: number;
    isOverflow: boolean;
  }[];
}


