/**
 * BAREMOS SCL-90-R — Adaptación UBA (Casullo – Pérez).
 * Fuente: inventario_sintomas.pdf (Casullo, M.M. – Pérez, M., 2006/2008),
 * páginas "Normas Adolescentes" y "Normas Adultos", población general de
 * Buenos Aires y Conurbano. Cuatro poblaciones: sexo × {adolescentes 12–19,
 * adultos 25–60}.
 *
 * Cada tabla da la puntuación directa (PD) que corresponde a cada puntaje T
 * para los 9 indicadores clínicos y los 3 globales (IGS, TSP = PST, IMSP = PSDI).
 * Regla de lectura (decisión del usuario): T < 60 = rango normal ·
 * T >= 60 = sintomático · T >= 63 = en riesgo (criterio del propio documento).
 *
 * ÚNICA fuente de verdad: el motor y la UI importan de acá.
 */
import { SCL90RData } from '../types';

export type BaremoId = 'm_adultos' | 'f_adultas' | 'm_adolescentes' | 'f_adolescentes';

export type EscalaKey = keyof SCL90RData;

export interface Baremo {
  id: BaremoId;
  /** Etiqueta larga para tooltips. */
  label: string;
  /** Etiqueta corta para el selector. */
  corto: string;
  fuente: string;
  /** PD del IGS que corresponde a T = 60: el corte de la regla de lectura. */
  t60Gsi: number;
  /** Tabla T(PD): para cada escala, pares [PD, T] en orden creciente de T. */
  tabla: Record<EscalaKey, [number, number][]>;
}

type Fila = [number, number, number, number, number, number, number, number, number, number, number, number];
const ESCALAS: EscalaKey[] = [
  'Somatización', 'Obsesión-Compulsión', 'Sensibilidad Interpersonal', 'Depresión',
  'Ansiedad', 'Hostilidad', 'Ansiedad Fóbica', 'Ideación Paranoide', 'Psicoticismo',
  'GSI', 'PST', 'PSDI',
];

/** Convierte una fila del PDF (12 PD para T 30..80) en la tabla por escala. */
function tablaDeFilas(filas: [number, Fila][]): Record<EscalaKey, [number, number][]> {
  const out = {} as Record<EscalaKey, [number, number][]>;
  for (let c = 0; c < ESCALAS.length; c++) {
    out[ESCALAS[c]] = filas.map(([t, fila]) => [fila[c], t] as [number, number]);
  }
  return out;
}

// --- Normas Adultos (25–60 años), Casullo – Pérez (2008) --------------------

const FILAS_M_ADULTOS: [number, Fila][] = [
  [30, [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.11, 5.60, 1.05]],
  [35, [0.00, 0.20, 0.00, 0.08, 0.10, 0.00, 0.00, 0.00, 0.00, 0.17, 10.00, 1.22]],
  [40, [0.08, 0.30, 0.11, 0.23, 0.20, 0.17, 0.00, 0.17, 0.00, 0.29, 16.00, 1.36]],
  [45, [0.25, 0.50, 0.33, 0.38, 0.40, 0.33, 0.00, 0.33, 0.20, 0.41, 23.80, 1.56]],
  [50, [0.42, 0.80, 0.56, 0.69, 0.60, 0.67, 0.14, 0.67, 0.30, 0.61, 32.00, 1.75]],
  [55, [0.75, 1.30, 0.89, 1.02, 0.90, 1.00, 0.29, 1.17, 0.50, 0.88, 41.20, 2.00]],
  [60, [1.08, 1.70, 1.33, 1.38, 1.30, 1.33, 0.57, 1.50, 0.90, 1.10, 52.00, 2.25]],
  [63, [1.25, 1.90, 1.56, 1.62, 1.60, 1.67, 0.86, 1.83, 1.20, 1.32, 57.00, 2.40]],
  [65, [1.42, 2.20, 1.67, 1.77, 1.70, 1.83, 1.00, 2.07, 1.40, 1.49, 61.00, 2.53]],
  [70, [1.75, 2.60, 2.38, 2.42, 2.28, 2.57, 1.43, 2.67, 1.74, 1.84, 75.00, 2.91]],
  [75, [2.31, 3.40, 3.00, 2.88, 2.67, 3.17, 1.88, 2.95, 2.17, 2.17, 79.72, 3.30]],
  [80, [2.50, 3.60, 3.22, 3.15, 2.70, 3.83, 2.71, 3.17, 2.30, 2.22, 85.00, 3.65]],
];

const FILAS_F_ADULTAS: [number, Fila][] = [
  [30, [0.00, 0.00, 0.00, 0.05, 0.00, 0.00, 0.00, 0.00, 0.00, 0.15, 9.00, 1.12]],
  [35, [0.17, 0.20, 0.11, 0.23, 0.20, 0.00, 0.00, 0.00, 0.00, 0.28, 15.00, 1.25]],
  [40, [0.25, 0.40, 0.22, 0.38, 0.30, 0.17, 0.00, 0.17, 0.10, 0.37, 21.12, 1.43]],
  [45, [0.42, 0.70, 0.44, 0.62, 0.60, 0.33, 0.00, 0.33, 0.20, 0.52, 29.00, 1.59]],
  [50, [0.75, 1.00, 0.67, 0.85, 0.80, 0.67, 0.29, 0.67, 0.40, 0.73, 37.00, 1.85]],
  [55, [1.00, 1.40, 1.11, 1.23, 1.20, 1.00, 0.57, 1.17, 0.70, 1.04, 47.00, 2.12]],
  [60, [1.49, 1.80, 1.44, 1.77, 1.60, 1.50, 0.86, 1.67, 1.00, 1.36, 57.00, 2.41]],
  [63, [1.83, 2.10, 1.67, 2.00, 1.80, 1.67, 1.14, 2.00, 1.10, 1.62, 62.00, 2.53]],
  [65, [2.00, 2.20, 1.89, 2.23, 2.13, 1.83, 1.29, 2.17, 1.30, 1.74, 66.00, 2.67]],
  [70, [2.36, 2.90, 2.60, 2.80, 2.50, 2.56, 2.00, 3.00, 1.97, 2.18, 74.00, 2.99]],
  [75, [2.87, 3.41, 3.00, 3.31, 3.04, 3.17, 2.63, 3.78, 2.57, 2.46, 77.71, 3.15]],
  [80, [3.00, 3.50, 3.00, 3.69, 3.10, 3.33, 3.14, 4.00, 2.70, 2.54, 82.00, 3.27]],
];

// --- Normas Adolescentes (12–19 años), Casullo – Pérez (2006) ---------------

const FILAS_M_ADOLESCENTES: [number, Fila][] = [
  [30, [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.06, 3.56, 0.90]],
  [35, [0.00, 0.10, 0.11, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.12, 8.00, 1.00]],
  [40, [0.02, 0.30, 0.22, 0.15, 0.10, 0.17, 0.00, 0.00, 0.00, 0.19, 13.00, 1.17]],
  [45, [0.17, 0.50, 0.36, 0.35, 0.20, 0.33, 0.00, 0.33, 0.10, 0.33, 20.00, 1.33]],
  [50, [0.33, 0.90, 0.67, 0.54, 0.40, 0.67, 0.14, 0.67, 0.30, 0.52, 30.00, 1.54]],
  [55, [0.58, 1.30, 1.00, 0.77, 0.70, 1.17, 0.29, 1.00, 0.50, 0.71, 39.00, 1.80]],
  [60, [0.92, 1.80, 1.33, 1.23, 1.00, 1.67, 0.57, 1.50, 0.80, 0.97, 47.00, 2.14]],
  [63, [1.08, 2.01, 1.56, 1.46, 1.31, 2.02, 0.71, 1.83, 1.01, 1.10, 52.10, 2.29]],
  [65, [1.31, 2.20, 1.67, 1.62, 1.43, 2.33, 0.86, 2.00, 1.28, 1.27, 56.00, 2.47]],
  [70, [1.75, 2.72, 2.24, 2.11, 2.07, 3.21, 1.32, 2.71, 1.92, 1.60, 71.00, 2.81]],
  [75, [2.23, 3.48, 2.84, 2.83, 2.89, 3.62, 3.37, 3.49, 2.43, 2.26, 74.53, 3.72]],
  [80, [3.08, 3.89, 3.00, 3.00, 3.70, 3.67, 4.00, 4.83, 2.50, 2.39, 76.00, 4.00]],
];

const FILAS_F_ADOLESCENTES: [number, Fila][] = [
  [30, [0.00, 0.10, 0.11, 0.08, 0.00, 0.00, 0.00, 0.00, 0.00, 0.07, 7.00, 1.00]],
  [35, [0.08, 0.20, 0.22, 0.15, 0.10, 0.17, 0.00, 0.00, 0.00, 0.19, 13.00, 1.10]],
  [40, [0.25, 0.50, 0.44, 0.38, 0.30, 0.29, 0.00, 0.17, 0.10, 0.37, 22.00, 1.30]],
  [45, [0.42, 0.80, 0.78, 0.70, 0.50, 0.50, 0.14, 0.50, 0.20, 0.56, 32.13, 1.50]],
  [50, [0.75, 1.20, 1.11, 1.00, 0.90, 0.83, 0.29, 0.83, 0.60, 0.84, 43.00, 1.76]],
  [55, [1.18, 1.66, 1.56, 1.54, 1.40, 1.33, 0.57, 1.50, 0.90, 1.17, 52.00, 2.02]],
  [60, [1.58, 2.10, 2.00, 1.92, 1.90, 2.00, 1.00, 2.05, 1.40, 1.53, 63.00, 2.40]],
  [63, [1.89, 2.40, 2.33, 2.31, 2.20, 2.50, 1.29, 2.50, 1.60, 1.71, 69.70, 2.54]],
  [65, [2.08, 2.60, 2.44, 2.46, 2.40, 2.81, 1.57, 2.67, 1.80, 1.86, 72.39, 2.66]],
  [70, [2.84, 3.20, 3.11, 3.23, 3.15, 3.55, 2.57, 3.26, 2.50, 2.33, 80.62, 3.10]],
  [75, [3.34, 3.30, 3.57, 3.65, 4.02, 4.00, 2.89, 3.35, 3.01, 2.78, 88.06, 3.36]],
  [80, [3.42, 3.30, 3.78, 5.25, 4.38, 4.00, 3.43, 3.67, 3.20, 3.12, 89.00, 3.37]],
];

export const BAREMOS: Record<BaremoId, Baremo> = {
  m_adultos: {
    id: 'm_adultos',
    label: 'Masculino · adultos 25–60 (Casullo – Pérez 2008, N=379)',
    corto: 'M · adultos',
    fuente: 'Casullo – Pérez (2008), N=379, 25 a 60 años',
    t60Gsi: 1.10,
    tabla: tablaDeFilas(FILAS_M_ADULTOS),
  },
  f_adultas: {
    id: 'f_adultas',
    label: 'Femenino · adultos 25–60 (Casullo – Pérez 2008, N=381)',
    corto: 'F · adultos',
    fuente: 'Casullo – Pérez (2008), N=381, 25 a 60 años',
    t60Gsi: 1.36,
    tabla: tablaDeFilas(FILAS_F_ADULTAS),
  },
  m_adolescentes: {
    id: 'm_adolescentes',
    label: 'Masculino · adolescentes 12–19 (Casullo – Pérez 2006, N=275)',
    corto: 'M · adolesc.',
    fuente: 'Casullo – Pérez (2006), N=275, 12 a 19 años',
    t60Gsi: 0.97,
    tabla: tablaDeFilas(FILAS_M_ADOLESCENTES),
  },
  f_adolescentes: {
    id: 'f_adolescentes',
    label: 'Femenino · adolescentes 12–19 (Casullo – Pérez 2006, N=313)',
    corto: 'F · adolesc.',
    fuente: 'Casullo – Pérez (2006), N=313, 12 a 19 años',
    t60Gsi: 1.53,
    tabla: tablaDeFilas(FILAS_F_ADOLESCENTES),
  },
};

export const DEFAULT_BAREMO_ID: BaremoId = 'm_adultos';

export const BAREMO_IDS: BaremoId[] = ['m_adultos', 'f_adultas', 'm_adolescentes', 'f_adolescentes'];

/** Baremo pedido, con fallback al default si el id es inválido. */
export function getBaremo(id?: BaremoId): Baremo {
  return (id && BAREMOS[id]) || BAREMOS[DEFAULT_BAREMO_ID];
}

export interface TResultado { t: number; lado?: 'bajo' | 'alto' }

/**
 * T de una escala por interpolación lineal en la tabla publicada del baremo.
 * Fuera del rango publicado (T 30–80) NO se extrapola: el T se acota al
 * extremo y se marca el lado ('bajo' / 'alto').
 */
export function tDeEscalaCon(baremo: Baremo, k: EscalaKey, raw: number): TResultado {
  const tabla = baremo.tabla[k];
  if (!tabla) return { t: 50 };
  const [pFirst, tFirst] = tabla[0];
  const [pLast, tLast] = tabla[tabla.length - 1];
  if (raw <= pFirst) {
    return { t: tFirst, lado: raw < pFirst ? 'bajo' : undefined };
  }
  if (raw > pLast) {
    return { t: tLast, lado: 'alto' };
  }
  for (let i = 0; i < tabla.length - 1; i++) {
    const [pA, tA] = tabla[i];
    const [pB, tB] = tabla[i + 1];
    if (raw <= pB) return { t: pB > pA ? tA + ((raw - pA) / (pB - pA)) * (tB - tA) : tB };
  }
  return { t: tLast };
}

/** Rango de PD publicado en la tabla del baremo para una escala: [piso, techo]. */
export function publishedRange(baremoId: BaremoId | undefined, k: EscalaKey): [number, number] | null {
  const tabla = getBaremo(baremoId).tabla[k];
  if (!tabla || tabla.length === 0) return null;
  return [tabla[0][0], tabla[tabla.length - 1][0]];
}

/** Umbral de ruptura del modelo para un baremo: 3× el corte T=60 de esa población — AXIOMA. */
export function ruptureThresholdGsi(baremoId?: BaremoId): number {
  return Math.round(3 * getBaremo(baremoId).t60Gsi * 100) / 100;
}
