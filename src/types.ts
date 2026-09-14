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
  a_critical: number; // Critical anguish threshold A_cr = Math.PI / 4
}

export interface LacanianCoordinates {
  a: number; // a = a_scale * GSI
  u_S: number;
  v_S: number;
  u_I: number;
  v_I: number;
  u_Sigma: number;
  v_Sigma: number;
  fantasyPointUV: [number, number]; // (pi, pi / 2)
  fantasyPoint3D: [number, number, number];
  ruptureCount: number;
  ruptureAreaPercent: number;
}

export type ViewMode = 'standard' | 'deformed' | 'comparison' | 'cross_section';

export type ColorMapMode = 'angustia' | 'stress' | 'curvature' | 'elevation';

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
  lacanian: LacanianCoordinates;
}

