/**
 * Línea de tiempo de la secuencia de ruptura psicótica.
 *
 * Fuente única de verdad para las constantes temporales del episodio: el canvas
 * anima exactamente esta línea de tiempo y el scrub del usuario la navega. El
 * umbral clínico del disparo (IGS ≥ 3× corte T=60) vive en el motor
 * (hornTorusMath: isPsychoticRupture — IGS ≥ 3× corte T=60 de la población más
 * Wegbreite suficiente, Corolario I: δ ≥ π/6); aquí solo el desenvolvimiento
 * visual, en segundos del reloj de la secuencia.
 *
 * Fases (t = reloj de la secuencia):
 *
 *   0 ─────────────► collapseEndsAt ────────► fantasyMergesAt ────► reconfigurationAt
 *   │   EYECCIÓN        │      INTEGRACIÓN      │   RECONFIGURACIÓN
 *   │  S, I y Pulsión   │  la Fantasía (angustia)│  las cintas cubren
 *   │  colapsan hacia   │  se disuelve en la    │  toda la superficie:
 *   │  el orificio      │  voz que sale por el  │  el toro ya es otra
 *   │  (cúspide v = π)  │  orificio             │  cosa (ver POST-EPISODIO
 *   │                   │                       │  en el resumen del motor)
 *
 * El reloj es determinista y pausable (scrub temporal): el mismo t produce
 * siempre el mismo estado de la escena.
 */
export const RUPTURE_TIMELINE = {
  /** Fin del colapso de S, I y Pulsión hacia el orificio (cúspide v = π). */
  collapseEndsAt: 1.4,
  /** Ventana de integración: la fantasía se disuelve en la voz (inicio → fin). */
  fantasyMergeStart: 2.0,
  fantasyMergeEnd: 2.8,
  /** La reconfiguración cubre toda la superficie (fin de la eyección). */
  reconfigurationAt: 6.0,
} as const;

/**
 * Parámetros visuales del episodio (para pensarlo, con su justificación):
 *
 * - Voz como penacho, no como superficie: el haz de partículas escala con el
 *   toro dilatado pero con tope (×3) — si escalara proporcional a `a` engulle
 *   la escena y tapa el orificio, que es el punto de la secuencia.
 * - Cámara: durante la ruptura la cámara se auto-encuadra a la envolvente real
 *   de la geometría (el modelo dilatado llega a radio ≈ 2·a·25 y la cámara por
 *   defecto queda DENTRO). 'Ver orificio' acercan a ≈ a·3.2; el zoom manual se
 *   respeta (el auto-encuadre no pisa lo que el usuario fijó).
 * - Después de reconfigurationAt el estado persiste hasta que el perfil salga
 *   del umbral: el toro reconfigurado no vuelve solo (ver computePostEpisodeState
 *   en hornTorusMath para el estado post-episodio del modelo).
 */
export const RUPTURE_VISUAL_PARAMS = {
  /** Tope de escala del haz de la voz relativo a su tamaño base. */
  voiceScaleCap: 3,
  /** Margen del auto-encuadre sobre la distancia teórica (FOV 45°). */
  autoFrameMargin: 1.15,
  /** Distancia de 'Ver orificio' en unidades de a (radio del modelo). */
  orificeViewDistanceFactor: 3.2,
} as const;

/** Fase de la secuencia en un instante dado (para HUD/etiquetas). */
export type RuptureTimelinePhase =
  | 'colapso'
  | 'integracion-fantasia'
  | 'voz-libre'
  | 'reconfiguracion';

export function rupturePhaseAt(t: number): RuptureTimelinePhase {
  if (t >= RUPTURE_TIMELINE.reconfigurationAt) return 'reconfiguracion';
  if (t >= RUPTURE_TIMELINE.fantasyMergeStart) return 'integracion-fantasia';
  if (t > RUPTURE_TIMELINE.collapseEndsAt) return 'voz-libre';
  return 'colapso';
}
