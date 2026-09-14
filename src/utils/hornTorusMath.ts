import { SCL90RData, ModelParams, TopologicalMetrics, LacanianCoordinates } from '../types';

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

export const CLINICAL_PRESETS: { name: string; description: string; data: SCL90RData }[] = [
  {
    name: "Modelo Icc Lacaniano (Código Python)",
    description: "Configuración psicométrica completa con curvas S, I, Σ y punto de angustia en la fantasía",
    data: { ...DEFAULT_SCL90R_DATA }
  },
  {
    name: "Caso SCL-90-R (Prompt Inicial)",
    description: "GSI 0.90, Psicoticismo 0.95, Obsesión 0.85, Somatización 0.75",
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
      "PST": 0.75,
      "PSDI": 0.95
    }
  },
  {
    name: "Estructura Neurótica Obsesiva",
    description: "Curva S (Significante) dominante con alta resonancia y fijación sin ruptura",
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
    name: "Desencadenamiento Psicótico (Ruptura)",
    description: "Curva Σ (Síntoma) en colapso e invasión masiva del punto de fantasía",
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
    name: "Histeria y Cuerpo (Imagen I)",
    description: "Curva I (Imagen corporal) desfasada con alta somatización y sensibilidad interpersonal",
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

  return {
    a,
    u_S,
    v_S,
    u_I,
    v_I,
    u_Sigma,
    v_Sigma,
    fantasyPointUV: [u_F, v_F],
    fantasyPoint3D: [x_F, y_F, z_F],
    ruptureCount: rupturePointsCount,
    ruptureAreaPercent
  };
}

/**
 * Calculates angustia A(u, v) = sqrt((u - u_F)^2 + (v - v_F)^2)
 */
export function calculateAngustia(u: number, v: number): number {
  const u_F = Math.PI;
  const v_F = Math.PI / 2;
  return Math.sqrt((u - u_F) ** 2 + (v - v_F) ** 2);
}

/**
 * Generates 3D coordinates for curves S, I, and Sigma
 */
export function getLacanianCurves(
  lacanian: LacanianCoordinates,
  uPoints: number = 180,
  visualScale: number = 25.0 // scale up coordinates for viewport
) {
  const uVals: number[] = [];
  for (let i = 0; i <= uPoints; i++) {
    uVals.push((i / uPoints) * 2 * Math.PI);
  }

  const effectiveA = lacanian.a * visualScale;

  // Curva S (Significante, color rojo)
  const curveS: [number, number, number][] = uVals.map((u) => {
    const x = effectiveA * (1 + Math.cos(lacanian.v_S)) * Math.cos(u);
    const y = effectiveA * (1 + Math.cos(lacanian.v_S)) * Math.sin(u);
    const z = effectiveA * Math.sin(lacanian.v_S);
    return [x, y, z];
  });

  // Curva I (Imagen del cuerpo, color verde)
  const curveI: [number, number, number][] = uVals.map((u) => {
    const x = effectiveA * (1 + Math.cos(lacanian.v_I)) * Math.cos(u);
    const y = effectiveA * (1 + Math.cos(lacanian.v_I)) * Math.sin(u);
    const z = effectiveA * Math.sin(lacanian.v_I);
    return [x, y, z];
  });

  // Curva Sigma (Síntoma, color azul)
  const curveSigma: [number, number, number][] = uVals.map((u) => {
    const x = effectiveA * (1 + Math.cos(lacanian.v_Sigma)) * Math.cos(u);
    const y = effectiveA * (1 + Math.cos(lacanian.v_Sigma)) * Math.sin(u);
    const z = effectiveA * Math.sin(lacanian.v_Sigma);
    return [x, y, z];
  });

  // Punto de fantasía en 3D escalado
  const fantasy3D: [number, number, number] = [
    lacanian.fantasyPoint3D[0] * visualScale,
    lacanian.fantasyPoint3D[1] * visualScale,
    lacanian.fantasyPoint3D[2] * visualScale,
  ];

  return { curveS, curveI, curveSigma, fantasy3D };
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

  const rawDeform = wSom + wOC + wPsy + wGSI + wPST + wPSDI + wDep + wAnx;
  const factor = 1.0 + deformationFactor * rawDeform;
  const stress = Math.min(1.0, Math.max(0.0, Math.abs(rawDeform) * (1 + psdi * 0.5)));

  return { factor, stress };
}

/**
 * Generates mesh vertex and index data for standard or deformed Horn Torus
 */
export function generateHornTorusGeometry(
  params: ModelParams,
  sclData: SCL90RData,
  isDeformed: boolean,
  colorMode: 'angustia' | 'stress' | 'curvature' | 'elevation' = 'angustia'
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

      positions.push(x, y, z);
      normals.push(nx, ny, nz);
      uvs.push(j / numU, i / numV);

      // Color mapping
      const rgb = getVertexColor(angustia, isRupture, stress, v, maxAngustia, a_critical, colorMode);
      colors.push(rgb.r, rgb.g, rgb.b);
    }
  }

  // Triangles
  for (let i = 0; i < numV; i++) {
    for (let j = 0; j < numU; j++) {
      const a = i * (numU + 1) + j;
      const b = (i + 1) * (numU + 1) + j;
      const c = (i + 1) * (numU + 1) + (j + 1);
      const d = i * (numU + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    colors: new Float32Array(colors),
    indices: new Uint32Array(indices),
    lacanian
  };
}

/**
 * Color mapper based on Angustia A(u, v), Rupture zones, and Stress
 */
function getVertexColor(
  angustia: number,
  isRupture: boolean,
  stress: number,
  v: number,
  maxAngustia: number,
  aCritical: number,
  mode: 'angustia' | 'stress' | 'curvature' | 'elevation'
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

  // Default: curvature / geometric
  const cosV = Math.cos(v);
  const curvNorm = 0.5 + 0.5 * cosV;
  return { r: 0.2 + 0.4 * curvNorm, g: 0.5 + 0.4 * (1 - curvNorm), b: 0.8 };
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

[1] VARIABLES LACANIANAS TOPOLÓGICAS (S, I, Σ & FANTASÍA):
--------------------------------------------------------------------------------
  * S (Significante):      u_S = ${lac.u_S.toFixed(4)} rad | v_S = ${lac.v_S.toFixed(4)} rad
    -> Función: Basado en Ansiedad (${sclData["Ansiedad"].toFixed(2)}) + Obsesión (${sclData["Obsesión-Compulsión"].toFixed(2)}) & PSDI (${sclData["PSDI"].toFixed(2)})
    -> Color en Visualizador: ROJO (Crimson)

  * I (Imagen del Cuerpo): u_I = ${lac.u_I.toFixed(4)} rad | v_I = ${lac.v_I.toFixed(4)} rad
    -> Función: Basado en Somatización (${sclData["Somatización"].toFixed(2)}) + Sensibilidad Interpersonal (${sclData["Sensibilidad Interpersonal"].toFixed(2)}) & PST (${sclData["PST"].toFixed(2)})
    -> Color en Visualizador: VERDE (Emerald)

  * Σ (Síntoma):           u_Σ = ${lac.u_Sigma.toFixed(4)} rad | v_Σ = ${lac.v_Sigma.toFixed(4)} rad
    -> Función: Basado en Psicoticismo (${sclData["Psicoticismo"].toFixed(2)}) + Hostilidad (${sclData["Hostilidad"].toFixed(2)}) & Psicoticismo
    -> Color en Visualizador: AZUL (Cobalt)

  * Punto de Fantasía (F): (u_F, v_F) = (π, π/2) = (${lac.fantasyPointUV[0].toFixed(3)}, ${lac.fantasyPointUV[1].toFixed(3)})
    -> Coordenadas 3D (x,y,z): (${lac.fantasyPoint3D[0].toFixed(4)}, ${lac.fantasyPoint3D[1].toFixed(4)}, ${lac.fantasyPoint3D[2].toFixed(4)})
    -> Angustia Máxima en el Manifold y Cúspide de Torsión

  * Puntos de Ruptura (A ≤ A_cr): ${lac.ruptureCount} nodos muestrales (${lac.ruptureAreaPercent.toFixed(2)}% del Manifold)

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

[3] INVARIANTES TOPOLÓGICOS Y ENERGÉTICOS:
--------------------------------------------------------------------------------
  * Característica de Euler (χ):        0 (Toro Manifold Género 1)
  * Área Superficial Estándar:          ${metrics.surfaceAreaStandard.toFixed(4)} u²
  * Área Superficial Deformada:         ${metrics.surfaceAreaDeformed.toFixed(4)} u² (${metrics.surfaceAreaDeltaPercent >= 0 ? '+' : ''}${metrics.surfaceAreaDeltaPercent.toFixed(2)}%)
  * Volumen Encerrado Estándar:         ${metrics.volumeStandard.toFixed(4)} u³
  * Volumen Encerrado Deformado:        ${metrics.volumeDeformed.toFixed(4)} u³ (${metrics.volumeDeltaPercent >= 0 ? '+' : ''}${metrics.volumeDeltaPercent.toFixed(2)}%)
  * Energía de Willmore W = ∫H² dA:     ${metrics.willmoreEnergyDeformed.toFixed(4)} (Base: ${metrics.willmoreEnergyStandard.toFixed(4)})
  * Índice ICC (Coherencia Icc):        ${metrics.iccIndex.toFixed(2)} %
  * Diagnóstico Clínico Estructural:    [ ${metrics.clinicalSeverityTier.toUpperCase()} ]
    ${lac.ruptureAreaPercent > 12.0 ? '-> ALERTA: Zona de angustia crítica expandida. Ruptura de la fantasía en cercanías de la cúspide.' : '-> Estructura compensada: Trayectorias S, I y Σ delimitadas con angustia focalizada.'}
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

    def __init__(self, scl90r_data=None, a_scale=0.1, u_scale=2*np.pi, v_scale=np.pi):
        # Datos por defecto del SCL-90-R (valores normalizados entre 0 y 1)
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

        self.scl90r_data = scl90r_data if scl90r_data else self.default_scl90r_data
        self.a_scale = a_scale
        self.u_scale = u_scale
        self.v_scale = v_scale

        # Parámetros del modelo
        self.a = None
        self.u_S = None
        self.v_S = None
        self.u_I = None
        self.v_I = None
        self.u_Sigma = None
        self.v_Sigma = None
        self.fantasy_point = None

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

    model = HornTorusICCModel(scl90r_data=scl90r_data, a_scale=${params.a_scale})
    model.print_model_summary()
    model.plot_3d_model(save_path='mi_modelo.png')
    model.plot_deformed_model(deformation_factor=${params.deformation_factor}, save_path='mi_modelo_deformado.png')
`;
}
