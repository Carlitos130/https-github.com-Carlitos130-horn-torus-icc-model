export interface SCL90RData {
  "Somatización": number;
  "Obsesión-Compulsión": number;
  "Psicoticismo": number;
  "GSI": number; // Global Severity Index
  "PST": number; // Positive Symptom Total
  "PSDI": number; // Positive Symptom Distress Index
  // Extended dimensions
  "Depresión"?: number;
  "Ansiedad"?: number;
  "Hostilidad"?: number;
  "Sensibilidad Interpersonal"?: number;
  "Ansiedad Fóbica"?: number;
  "Ideación Paranoide"?: number;
}

export interface ModelParams {
  a_scale: number; // Scale factor, default 0.1
  deformation_factor: number; // Default 0.3
  gridResolution: number; // e.g., 64 or 96
  r_major: number; // for horn torus, r_major == r_minor
  r_minor: number;
}

export type ViewMode = 'standard' | 'deformed' | 'comparison' | 'cross_section';

export type ColorMapMode = 'stress' | 'curvature' | 'elevation' | 'vortex_flow' | 'clinical_thermal';

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
}
