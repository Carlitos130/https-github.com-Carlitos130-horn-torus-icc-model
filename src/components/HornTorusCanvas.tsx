import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ModelParams, SCL90RData, ViewMode, ColorMapMode, RuptureVisualState } from '../types';
import {
  generateHornTorusGeometry,
  getLacanianCurves,
  calculateLacanianParameters,
  generateRibbonGeometryData,
  generatePulsionVectorFieldData,
  PulsionVectorItem,
  computeSclDeformation,
  isPsychoticRupture,
  ruptureThresholdGsi,
  PSYCHOTIC_RUPTURE_FACTOR,
  BAREMO_T60_GSI,
  RibbonMode,
  updateHornTorusVertices,
  generatePrccFieldPoints
} from '../utils/hornTorusMath';
import { RUPTURE_TIMELINE, RUPTURE_VISUAL_PARAMS, rupturePhaseAt } from '../utils/ruptureSequence';
import {
  RotateCcw,
  Play,
  Pause,
  Download,
  Sparkles,
  AlertCircle,
  CircleDot,
  Activity,
  Eye,
  Waves,
  ArrowRight,
  Radio,
  Scan,
  Flame,
  Repeat,
  Zap,
  Sliders
} from 'lucide-react';

/**
 * Reemplaza la geometría de un mesh/line de cinta con nuevos puntos. Usada por la
 * reconfiguración 'covered' y por la restauración 'stable' al hacer scrub hacia atrás.
 */
function applyCurveGeometry(obj: THREE.Object3D | null, pts: [number, number, number][]): void {
  if (!obj) return;
  const mesh = obj as THREE.Mesh;
  if (mesh.isMesh) {
    const gd = generateRibbonGeometryData(pts, 0.085);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(gd.positions, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(gd.normals, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(gd.uvs, 2));
    g.setIndex(new THREE.BufferAttribute(gd.indices, 1));
    mesh.geometry.dispose();
    mesh.geometry = g;
  } else {
    const g = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    (obj as THREE.Line).geometry.dispose();
    (obj as THREE.Line).geometry = g;
  }
}

/**
 * Creates a single combined BufferGeometry for a 3D directional arrow (shaft + conical head)
 * aligned along the +Y axis. Zero external dependencies.
 */
function createDirectionalArrowGeometry(): THREE.BufferGeometry {
  const shaftRadius = 0.013;
  const shaftHeight = 0.17;
  const headRadius = 0.044;
  const headHeight = 0.095;
  const radialSegments = 10;

  const cyl = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftHeight, radialSegments);
  cyl.translate(0, shaftHeight * 0.5, 0);

  const cone = new THREE.ConeGeometry(headRadius, headHeight, radialSegments);
  cone.translate(0, shaftHeight + headHeight * 0.5, 0);

  const cylPos = cyl.getAttribute('position').array as Float32Array;
  const cylNorm = cyl.getAttribute('normal').array as Float32Array;
  const cylIdx = cyl.getIndex()!.array;

  const conePos = cone.getAttribute('position').array as Float32Array;
  const coneNorm = cone.getAttribute('normal').array as Float32Array;
  const coneIdx = cone.getIndex()!.array;

  const totalVerts = cylPos.length / 3 + conePos.length / 3;
  const totalIndices = cylIdx.length + coneIdx.length;

  const mergedPos = new Float32Array(totalVerts * 3);
  mergedPos.set(cylPos, 0);
  mergedPos.set(conePos, cylPos.length);

  const mergedNorm = new Float32Array(totalVerts * 3);
  mergedNorm.set(cylNorm, 0);
  mergedNorm.set(coneNorm, cylNorm.length);

  const mergedIdx = totalVerts > 65535 ? new Uint32Array(totalIndices) : new Uint16Array(totalIndices);
  mergedIdx.set(cylIdx, 0);
  const offset = cylPos.length / 3;
  for (let i = 0; i < coneIdx.length; i++) {
    mergedIdx[cylIdx.length + i] = coneIdx[i] + offset;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
  merged.setIndex(new THREE.BufferAttribute(mergedIdx, 1));

  cyl.dispose();
  cone.dispose();
  return merged;
}

interface HornTorusCanvasProps {
  sclData: SCL90RData;
  params: ModelParams;
  viewMode: ViewMode;
  colorMap: ColorMapMode;
  showWireframe: boolean;
  showVortexFlow: boolean;
  showCurveS: boolean;
  showCurveI: boolean;
  showPulsion: boolean;
  showCurveSigma: boolean;
  showFantasyPoint: boolean;
  /** Campo Prcc: lo que entra por la voz (p), concentrado en el embudo del eje y sin borde. */
  showPrcc?: boolean;
  showRibbons: boolean;
  ccOpacity: number;
  isAnimatingDeformationExternal?: boolean;
  onCcOpacityChange?: (opacity: number) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  onDeformationFactorChange?: (factor: number) => void;
  onToggleDeformationAnimation?: () => void;
  onCapturePng: (type: 'standard' | 'deformed', dataUrl: string) => void;
  ruptureVisual?: RuptureVisualState;
  onRuptureVisualChange?: (state: RuptureVisualState) => void;
  onLaunchRupture?: () => void;
  /** Reloj de la secuencia (s), controlado desde la UI para hacerla replicable/explorable. */
  ruptureClock?: number;
  /** Play/pausa del reloj de la secuencia. */
  rupturePlaying?: boolean;
  /** El canvas reporta el reloj (~10 Hz) mientras la secuencia corre. */
  onRuptureTime?: (t: number) => void;
  /** La secuencia cruzó la reconfiguración (t ≥ 6 s): pausar el reloj al final. */
  onRuptureEnd?: () => void;
  /** Tiempo mostrado en el scrub (s), mantenido por la App (~10 Hz). */
  scrubTime?: number;
  /** Scrub: fijar el reloj de la secuencia. */
  onRuptureTimeChange?: (t: number) => void;
  /** Play/pausa desde la UI. */
  onRupturePlayingChange?: (playing: boolean) => void;
  /** Reiniciar la secuencia desde t = 0. */
  onRuptureReplay?: () => void;
  /** Volver al perfil estable (fuera de ruptura). */
  onResetToStable?: () => void;
}

/**
 * Crea el haz de partículas de la "voz" que sale por el orificio del horn torus
 * (cúspide v = π en el origen) durante la ruptura psicótica.
 */
function createVoiceStream(): { group: THREE.Group; phases: Float32Array; drifts: Float32Array; speeds: Float32Array; count: number } {
  const group = new THREE.Group();
  group.name = 'ruptureVoice';
  const count = 260;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const drifts = new Float32Array(count);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    phases[i] = Math.random();          // ciclo de vida desfasado 0..1
    drifts[i] = Math.random() * Math.PI * 2; // ángulo toroidal de eyección
    speeds[i] = 0.55 + Math.random() * 0.9;  // velocidad de emisión
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xfda4af,
    size: 0.11,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const points = new THREE.Points(geo, mat);
  points.renderOrder = 12;
  group.add(points);

  // Rótulo "voz" anclado sobre el orificio
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.font = 'bold 30px Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#fb7185';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#fecdd3';
  ctx.fillText('« voz »', 96, 32);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.scale.set(2.4, 0.8, 1);
  sprite.position.set(0, 0, 1.7);
  sprite.renderOrder = 13;
  group.add(sprite);

  return { group, phases, drifts, speeds, count };
}

export const HornTorusCanvas: React.FC<HornTorusCanvasProps> = ({
  sclData,
  params,
  viewMode,
  colorMap,
  showWireframe,
  showVortexFlow,
  showCurveS,
  showCurveI,
  showPulsion = true,
  showCurveSigma,
  showFantasyPoint,
  showPrcc = true,
  showRibbons = true,
  ccOpacity = 0.95,
  isAnimatingDeformationExternal,
  onCcOpacityChange,
  onViewModeChange,
  onCapturePng,
  ruptureVisual = 'idle',
  onRuptureVisualChange,
  onLaunchRupture,
  ruptureClock = 0,
  rupturePlaying = true,
  onRuptureTime,
  onRuptureEnd,
  scrubTime = 0,
  onRuptureTimeChange,
  onRupturePlayingChange,
  onRuptureReplay,
  onResetToStable,
  onDeformationFactorChange,
  onToggleDeformationAnimation
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Mesh refs
  const standardMeshRef = useRef<THREE.Mesh | null>(null);
  const deformedMeshRef = useRef<THREE.Mesh | null>(null);
  const standardMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const deformedMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const wireframeRef = useRef<THREE.LineSegments | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const clippingPlaneRef = useRef<THREE.Plane | null>(null);
  const interiorLightRef = useRef<THREE.PointLight | null>(null);

  // X-Ray Mode refs (cara externa de la superficie Icc semitransparente & cara interna de la pared)
  const xrayCcMeshRef = useRef<THREE.Mesh | null>(null);
  const xrayIccMeshRef = useRef<THREE.Mesh | null>(null);
  const xrayWireframeRef = useRef<THREE.LineSegments | null>(null);
  const xrayCcMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const xrayIccMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);

  // Lacanian curves / ribbons & Fantasy point refs
  const curveSRef = useRef<THREE.Object3D | null>(null);
  const curveIRef = useRef<THREE.Object3D | null>(null);
  const curvePulsionRef = useRef<THREE.Object3D | null>(null);
  const curveSigmaRef = useRef<THREE.Object3D | null>(null);
  const fantasyMeshRef = useRef<THREE.Group | null>(null);
  const prccPointsRef = useRef<THREE.Points | null>(null);

  // Hilo Pulsional Directional Flow Vector Field & Dynamic Tracers refs
  const pulsionGroupRef = useRef<THREE.Group | null>(null);
  const pulsionVectorFieldRef = useRef<THREE.InstancedMesh | null>(null);
  const pulsionTracersLinesRef = useRef<THREE.LineSegments | null>(null);
  const pulsionTracersPointsRef = useRef<THREE.Points | null>(null);
  const pulsionVectorsDataRef = useRef<PulsionVectorItem[]>([]);
  const pulsionTracersStateRef = useRef<{
    u: Float32Array;
    v: Float32Array;
    speeds: Float32Array;
    count: number;
  } | null>(null);
  // Intrusión éxtima de la Voz (Superyó / Objeto a) refs
  const voiceConeRef = useRef<THREE.Mesh | null>(null);
  const voiceRingsRef = useRef<THREE.Mesh[]>([]);

  // Temp vectors and matrices for zero-GC 60fps instance updates
  const dummyObjRef = useRef(new THREE.Object3D());
  const unitYVectorRef = useRef(new THREE.Vector3(0, 1, 0));
  const targetDirVectorRef = useRef(new THREE.Vector3());
  const quaternionRef = useRef(new THREE.Quaternion());

  // Interaction state
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // ViewMode Fluid Transition & Morphing State
  const [isTransitioningViewMode, setIsTransitioningViewMode] = useState<boolean>(false);
  const [displayViewMode, setDisplayViewMode] = useState<ViewMode>(viewMode);
  const viewModeTransitionProgressRef = useRef<number>(1.0);
  const fromViewModeRef = useRef<ViewMode>(viewMode);
  const targetViewModeRef = useRef<ViewMode>(viewMode);
  const transitionDurationRef = useRef<number>(0.65); // 650ms smooth transition
  const previousCcOpacityRef = useRef<number>(ccOpacity);

  // Trigger smooth transition whenever viewMode prop changes
  useEffect(() => {
    if (viewMode !== targetViewModeRef.current) {
      fromViewModeRef.current = targetViewModeRef.current;
      targetViewModeRef.current = viewMode;
      viewModeTransitionProgressRef.current = 0.0;
      setIsTransitioningViewMode(true);
      setDisplayViewMode(viewMode);
    }
  }, [viewMode]);

  // Reactive Prop Synchronizers for the Animation Frame Loop
  const showPulsionRef = useRef(showPulsion);
  const showVortexFlowRef = useRef(showVortexFlow);
  const isRotatingRef = useRef(isRotating);
  const sclDataRef = useRef(sclData);
  const paramsRef = useRef(params);
  const viewModeRef = useRef(viewMode);

  useEffect(() => {
    showPulsionRef.current = showPulsion;
    if (pulsionGroupRef.current) {
      pulsionGroupRef.current.visible = showPulsion;
    }
  }, [showPulsion]);

  useEffect(() => {
    showVortexFlowRef.current = showVortexFlow;
    if (particlesRef.current) {
      particlesRef.current.visible = showVortexFlow;
    }
  }, [showVortexFlow]);

  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  useEffect(() => {
    sclDataRef.current = sclData;
    paramsRef.current = params;
    viewModeRef.current = viewMode;
  }, [sclData, params, viewMode]);

  // --- Ruptura psicótica: estado de la secuencia visual de las cintas ---
  // La secuencia es una función pura del reloj de ruptura (scrub temporal):
  // pausable, explorable y repetible sin perder determinismo.
  const RUPTURE_COVER_AT = RUPTURE_TIMELINE.reconfigurationAt; // s: reconfiguración total
  const ruptureClockProp = ruptureClock;
  const isPlayingRef = useRef(true);
  const coveredRebuiltRef = useRef(false);
  const lastSyncedClockPropRef = useRef<number | null | 'unset'>('unset');
  const lastRuptureReportRef = useRef(0);
  const onRuptureTimeRef = useRef<((t: number) => void) | null>(null);
  const onRuptureEndRef = useRef<(() => void) | null>(null);
  useEffect(() => { onRuptureTimeRef.current = onRuptureTime ?? null; }, [onRuptureTime]);
  useEffect(() => { onRuptureEndRef.current = onRuptureEnd ?? null; }, [onRuptureEnd]);
  const rupturePhaseRef = useRef<RuptureVisualState>('idle');
  const ruptureTimerRef = useRef(0);
  const preRuptureRadiusRef = useRef<number | null>(null); // radio de cámara antes del auto-encuadre
  const userCameraRef = useRef(false); // el usuario fijó la cámara (rueda o Ver orificio): el auto-encuadre no la pisa
  const ribbonsDetachedRef = useRef(false); // S, I y Pulsión colapsando hacia el orificio
  const voiceGroupRef = useRef<THREE.Group | null>(null);
  const voiceStateRef = useRef<{ phases: Float32Array; drifts: Float32Array; speeds: Float32Array; count: number } | null>(null);
  // Posiciones originales de las cintas S, I y Pulsión al iniciar la eyección
  // (para animar el colapso hacia el orificio en vez de un salto instantáneo).
  const ruptureOrigRef = useRef<{ S: Float32Array | null; I: Float32Array | null; P: Float32Array | null }>({ S: null, I: null, P: null });

  // Máquina de estados: idle → ejected (eyección por el orificio + voz) → covered
  // (reconfiguración cubriendo toda la superficie). Todo el estado se deriva del
  // reloj de ruptura (ruptureClock), controlable desde la UI (scrub temporal).
  useEffect(() => {
    const rupturing = isPsychoticRupture(sclData, params);
    if (!rupturing) {
      if (rupturePhaseRef.current !== 'idle') {
        rupturePhaseRef.current = 'idle';
        ruptureTimerRef.current = 0;
        lastRuptureReportRef.current = 0;
        ribbonsDetachedRef.current = false;
        coveredRebuiltRef.current = false;
        lastSyncedClockPropRef.current = 'unset';
        userCameraRef.current = false;
        if (preRuptureRadiusRef.current !== null) {
          rotationAngles.current.radius = preRuptureRadiusRef.current;
          preRuptureRadiusRef.current = null;
          updateCameraPosition();
        }
        if (voiceGroupRef.current && sceneRef.current) {
          sceneRef.current.remove(voiceGroupRef.current);
          voiceGroupRef.current = null;
          voiceStateRef.current = null;
        }
        onRuptureVisualChange?.('idle');
      }
      return;
    }
    if (rupturePhaseRef.current === 'idle') {
      rupturePhaseRef.current = 'ejected';
      ruptureTimerRef.current = 0;
      lastRuptureReportRef.current = 0;
      ribbonsDetachedRef.current = true;
      coveredRebuiltRef.current = false;
      lastSyncedClockPropRef.current = 'unset';
      userCameraRef.current = false; // secuencia nueva: el auto-encuadre vuelve a mandar
      // El auto-encuadre por esfera envolvente vive en el efecto de reconstrucción
      // (allí se conoce la geometría real de cada modo de vista).
      const scene = sceneRef.current;
      if (scene && !voiceGroupRef.current) {
        const { group, phases, drifts, speeds, count } = createVoiceStream();
        // La voz es un penacho simbólico, no una superficie: escala con tope moderado
        // (×3) para crecer con el toro dilatado sin engullir la escena.
        const aScene = calculateLacanianParameters(sclData, params).a * 25.0;
        group.scale.setScalar(Math.min(RUPTURE_VISUAL_PARAMS.voiceScaleCap, Math.max(1, aScene / 2.1)));
        voiceGroupRef.current = group;
        voiceStateRef.current = { phases, drifts, speeds, count };
        scene.add(group);
      }
      onRuptureVisualChange?.('ejected');
    }
  }, [sclData, params, onRuptureVisualChange]);

  // Reflejar el reloj externo (App) en el reloj interno: pausa, scrub y replay.
  // Sincronización directa: los reportes propios (~10 Hz) son idempotentes y el
  // scrub fija el reloj exactamente donde el usuario lo puso.
  useEffect(() => {
    isPlayingRef.current = rupturePlaying;
    if (rupturePhaseRef.current === 'idle') return;
    if (lastSyncedClockPropRef.current !== 'unset' && Math.abs(ruptureClockProp - lastSyncedClockPropRef.current) < 1e-6) return;
    lastSyncedClockPropRef.current = ruptureClockProp;
    ruptureTimerRef.current = ruptureClockProp;
    lastRuptureReportRef.current = ruptureClockProp; // el reporte retoma 0.1 s después del punto de scrub

    // Transiciones discretas de fase, deterministas en el reloj (no dependen de
    // requestAnimationFrame: el scrub responde aunque la pestaña esté en segundo plano).
    if (rupturePhaseRef.current === 'ejected' && ruptureClockProp >= RUPTURE_COVER_AT - 1e-6 && !coveredRebuiltRef.current) {
      // Eyección → reconfiguración cubriendo toda la superficie
      coveredRebuiltRef.current = true;
      ribbonsDetachedRef.current = false;
      ruptureOrigRef.current = { S: null, I: null, P: null };
      rupturePhaseRef.current = 'covered';
      onRuptureVisualChange?.('covered');
      onRuptureEndRef.current?.();
      const lacC = calculateLacanianParameters(sclDataRef.current, paramsRef.current);
      const cov = getLacanianCurves(lacC, 220, 25.0, 'covered');
      applyCurveGeometry(curveSRef.current, cov.curveS);
      applyCurveGeometry(curveIRef.current, cov.curveI);
      applyCurveGeometry(curvePulsionRef.current, cov.curvePulsion);
    } else if (coveredRebuiltRef.current && ruptureClockProp < RUPTURE_COVER_AT - 1e-6) {
      // Scrub hacia atrás: restaurar cintas estables (regeneradas, la copia original
      // quedó inválida tras el rebuild 'covered')
      coveredRebuiltRef.current = false;
      ribbonsDetachedRef.current = true;
      if (
        ruptureOrigRef.current.S === null &&
        ruptureOrigRef.current.I === null &&
        ruptureOrigRef.current.P === null
      ) {
        const lacR = calculateLacanianParameters(sclDataRef.current, paramsRef.current);
        const st = getLacanianCurves(lacR, 220, 25.0, 'stable');
        applyCurveGeometry(curveSRef.current, st.curveS);
        applyCurveGeometry(curveIRef.current, st.curveI);
        applyCurveGeometry(curvePulsionRef.current, st.curvePulsion);
      }
      rupturePhaseRef.current = 'ejected';
      onRuptureVisualChange?.('ejected');
    }
  }, [ruptureClockProp, rupturePlaying]);

  // Deformation Animation State & Refs
  const [isAnimatingDeformation, setIsAnimatingDeformation] = useState<boolean>(false);
  const [animatedDeformFactor, setAnimatedDeformFactor] = useState<number>(params.deformation_factor);
  const [deformAnimMode, setDeformAnimMode] = useState<'loop' | 'once'>('loop');
  const [deformAnimSpeed, setDeformAnimSpeed] = useState<number>(1.0);
  const [showDeformPanel, setShowDeformPanel] = useState<boolean>(false);

  const isAnimatingDeformRef = useRef(false);
  const deformProgressRef = useRef(params.deformation_factor > 0 ? 1.0 : 0.0);
  const deformDirectionRef = useRef(1);
  const deformAnimModeRef = useRef<'loop' | 'once'>('loop');
  const deformAnimSpeedRef = useRef(1.0);
  const currentAnimatedDeltaRef = useRef(params.deformation_factor);
  const targetMaxDeformationRef = useRef(params.deformation_factor > 0.05 ? params.deformation_factor : 0.30);
  const lastStateSyncTimeRef = useRef(0);
  const colorMapRef = useRef(colorMap);
  const onDeformationFactorChangeRef = useRef(onDeformationFactorChange);
  const onViewModeChangeRef = useRef(onViewModeChange);
  const onToggleDeformationAnimationRef = useRef(onToggleDeformationAnimation);

  useEffect(() => {
    colorMapRef.current = colorMap;
  }, [colorMap]);

  useEffect(() => {
    onDeformationFactorChangeRef.current = onDeformationFactorChange;
    onViewModeChangeRef.current = onViewModeChange;
    onToggleDeformationAnimationRef.current = onToggleDeformationAnimation;
  }, [onDeformationFactorChange, onViewModeChange, onToggleDeformationAnimation]);

  useEffect(() => {
    deformAnimModeRef.current = deformAnimMode;
  }, [deformAnimMode]);

  useEffect(() => {
    deformAnimSpeedRef.current = deformAnimSpeed;
  }, [deformAnimSpeed]);

  useEffect(() => {
    if (!isAnimatingDeformRef.current) {
      if (params.deformation_factor > 0.05) {
        targetMaxDeformationRef.current = params.deformation_factor;
      }
      currentAnimatedDeltaRef.current = params.deformation_factor;
      setAnimatedDeformFactor(params.deformation_factor);
    }
  }, [params.deformation_factor]);

  // Synchronize external animation trigger from App header if provided
  useEffect(() => {
    if (
      isAnimatingDeformationExternal !== undefined &&
      isAnimatingDeformationExternal !== isAnimatingDeformRef.current
    ) {
      handleToggleDeformationAnimation();
    }
  }, [isAnimatingDeformationExternal]);

  const handleToggleDeformationAnimation = () => {
    const nextState = !isAnimatingDeformRef.current;
    setIsAnimatingDeformation(nextState);
    isAnimatingDeformRef.current = nextState;

    if (nextState) {
      // If at end or near top, restart from 0
      if (deformProgressRef.current >= 0.99) {
        deformProgressRef.current = 0.0;
        deformDirectionRef.current = 1;
      }
      // Ensure deformed or xray view is active so the morphing is clearly visible
      if (viewModeRef.current === 'standard' && onViewModeChangeRef.current) {
        onViewModeChangeRef.current('deformed');
      }
    } else {
      // Paused: sync final deformation factor to parent
      if (onDeformationFactorChangeRef.current) {
        onDeformationFactorChangeRef.current(currentAnimatedDeltaRef.current);
      }
    }

    if (onToggleDeformationAnimationRef.current) {
      onToggleDeformationAnimationRef.current();
    }
  };

  const handleResetToStandard = () => {
    isAnimatingDeformRef.current = false;
    setIsAnimatingDeformation(false);
    deformProgressRef.current = 0.0;
    deformDirectionRef.current = 1;
    currentAnimatedDeltaRef.current = 0.0;
    setAnimatedDeformFactor(0.0);

    if (deformedMeshRef.current) {
      const geo = deformedMeshRef.current.geometry;
      updateHornTorusVertices(
        geo.attributes.position.array as Float32Array,
        geo.attributes.normal.array as Float32Array,
        geo.attributes.color.array as Float32Array,
        paramsRef.current,
        sclDataRef.current,
        0.0,
        colorMapRef.current
      );
      geo.attributes.position.needsUpdate = true;
      geo.attributes.normal.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    }
    if (onDeformationFactorChangeRef.current) {
      onDeformationFactorChangeRef.current(0.0);
    }
  };

  const handleSetToDeformed = () => {
    isAnimatingDeformRef.current = false;
    setIsAnimatingDeformation(false);
    deformProgressRef.current = 1.0;
    deformDirectionRef.current = -1;
    const target = targetMaxDeformationRef.current > 0.05 ? targetMaxDeformationRef.current : 0.30;
    currentAnimatedDeltaRef.current = target;
    setAnimatedDeformFactor(target);

    if (deformedMeshRef.current) {
      const geo = deformedMeshRef.current.geometry;
      updateHornTorusVertices(
        geo.attributes.position.array as Float32Array,
        geo.attributes.normal.array as Float32Array,
        geo.attributes.color.array as Float32Array,
        paramsRef.current,
        sclDataRef.current,
        target,
        colorMapRef.current
      );
      geo.attributes.position.needsUpdate = true;
      geo.attributes.normal.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    }
    if (onDeformationFactorChangeRef.current) {
      onDeformationFactorChangeRef.current(target);
    }
  };

  const handleRestartDeformTransition = () => {
    deformProgressRef.current = 0.0;
    deformDirectionRef.current = 1;
    currentAnimatedDeltaRef.current = 0.0;
    setAnimatedDeformFactor(0.0);
    isAnimatingDeformRef.current = true;
    setIsAnimatingDeformation(true);
    if (viewModeRef.current === 'standard' && onViewModeChangeRef.current) {
      onViewModeChangeRef.current('deformed');
    }
  };

  // Camera spherical angles
  const rotationAngles = useRef({ theta: 0.65, phi: 0.75, radius: 9.0 });
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  // Camera adjustment for interior mode
  useEffect(() => {
    if (viewMode === 'interior_icc') {
      rotationAngles.current = { theta: 0.38, phi: 0.55, radius: 7.5 };
      updateCameraPosition();
    }
  }, [viewMode]);

  // Scene initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 600); // far amplio: el modelo dilatado visto desde r≈125 supera el 300
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    clippingPlaneRef.current = clipPlane;

    // Ambient and Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(12, 16, 14);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.9);
    dirLight2.position.set(-12, -10, -10);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xf43f5e, 2.0, 8);
    pointLight.position.set(0, 0, 0); // Inner cusp illumination
    scene.add(pointLight);

    // Grid Floor
    const grid = new THREE.GridHelper(16, 32, 0x1e293b, 0x0f172a);
    grid.position.y = -3.2;
    scene.add(grid);

    // Streamline particles (geodesic flow through the horn cusp)
    const particleCount = 1400;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleAngles = new Float32Array(particleCount * 2);
    const particleSpeed = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particleAngles[i * 2] = (Math.random() * 2 - 1) * Math.PI;
      particleAngles[i * 2 + 1] = Math.random() * 2 * Math.PI;
      particleSpeed[i] = 0.008 + Math.random() * 0.015;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.045,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let lastTime = performance.now();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isRotatingRef.current) {
        rotationAngles.current.phi += delta * 0.35;
        updateCameraPosition();
      }

      // --- Secuencia de ruptura psicótica: colapso de cintas, voz y reconfiguración ---
      // Función pura del reloj de ruptura: scrub/pausa/replay sin perder determinismo.
      if (rupturePhaseRef.current !== 'idle') {
        if (isPlayingRef.current) {
          ruptureTimerRef.current += delta;
        }
        const T = ruptureTimerRef.current;
        const phase = rupturePhaseRef.current;

        // 1) Eyección: S, I y Pulsión son succionadas por el orificio (cúspide v=π, origen)
        if (phase === 'ejected' && ribbonsDetachedRef.current) {
          const t = Math.min(1, T / RUPTURE_TIMELINE.collapseEndsAt);
          const k = 1 - t * t * (3 - 2 * t); // smoothstep invertido: 1 → 0
          const targets: (THREE.Object3D | null)[] = [curveSRef.current, curveIRef.current, curvePulsionRef.current];
          const origKeys: ('S' | 'I' | 'P')[] = ['S', 'I', 'P'];
          for (let ti = 0; ti < 3; ti++) {
            const obj = targets[ti];
            if (!obj) continue;
            const geo = (obj as THREE.Mesh).geometry;
            const posAttr = geo?.getAttribute('position') as THREE.BufferAttribute | undefined;
            if (!posAttr) continue;
            if (!ruptureOrigRef.current[origKeys[ti]]) {
              ruptureOrigRef.current[origKeys[ti]] = new Float32Array(posAttr.array as Float32Array);
            }
            const orig = ruptureOrigRef.current[origKeys[ti]]!;
            const arr = posAttr.array as Float32Array;
            for (let vi = 0; vi < arr.length; vi++) arr[vi] = orig[vi] * k;
            posAttr.needsUpdate = true;
          }

          // La transición eyección → 'covered' (reconfiguración cubriendo toda la
          // superficie) vive en el efecto de sync del reloj: determinista, independiente
          // de rAF, y única para no duplicar el rebuild.
        }

        // 2) Voz: partículas en espiral saliendo del orificio hacia arriba
        const vs = voiceStateRef.current;
        const vg = voiceGroupRef.current;
        if (vs && vg) {
          vg.visible = true;
          const pts = (vg.children[0] as THREE.Points).geometry.getAttribute('position') as THREE.BufferAttribute;
          const arr = pts.array as Float32Array;
          const label = vg.children[1] as THREE.Sprite;
          const labelMat = label.material as THREE.SpriteMaterial;
          const fadeIn = Math.min(1, T / 1.0);
          labelMat.opacity = 0.35 + 0.55 * fadeIn * (0.75 + 0.25 * Math.sin(currentTime * 0.006));
          for (let i = 0; i < vs.count; i++) {
            vs.phases[i] += delta * vs.speeds[i] * 0.45;
            if (vs.phases[i] > 1) {
              vs.phases[i] = 0;
              vs.drifts[i] = Math.random() * Math.PI * 2;
            }
            vs.drifts[i] += delta * 1.6;
            const t = vs.phases[i];
            const rise = t * 5.2;
            const spread = 0.12 + t * 1.05;
            arr[i * 3] = Math.cos(vs.drifts[i]) * spread;
            arr[i * 3 + 1] = Math.sin(vs.drifts[i]) * spread;
            arr[i * 3 + 2] = rise;
          }
          pts.needsUpdate = true;

          // Integración fantasía → voz: en su ventana, el beacon de la Fantasía
          // (angustia) se contrae hacia el orificio y se funde con el haz, que se
          // tiñe de ámbar. Determinista en el reloj: el scrub la deshace.
          const kM = Math.min(1, Math.max(0,
            (T - RUPTURE_TIMELINE.fantasyMergeStart) / (RUPTURE_TIMELINE.fantasyMergeEnd - RUPTURE_TIMELINE.fantasyMergeStart)
          ));
          const fg = fantasyMeshRef.current;
          if (fg) {
            fg.visible = kM < 1;
            // Escalar el grupo contrae el beacon hacia el origen (el orificio):
            // el viaje de la fantasía hacia la voz es la misma operación.
            fg.scale.setScalar(Math.max(0.001, 1 - kM));
          }
          const voiceMat = (vg.children[0] as THREE.Points)?.material as THREE.PointsMaterial | undefined;
          if (voiceMat) {
            // Rosa (0xfda4af) → ámbar de la fantasía (0xfbbf24)
            voiceMat.color.setRGB(
              0.992 + (0.984 - 0.992) * kM,
              0.643 + (0.749 - 0.643) * kM,
              0.686 + (0.141 - 0.686) * kM
            );
          }
        }

        // Reporte del reloj (~10 Hz) hacia la App (scrub/play en la UI)
        const reportT = ruptureTimerRef.current;
        if (reportT - lastRuptureReportRef.current >= 0.1) {
          lastRuptureReportRef.current = reportT;
          onRuptureTimeRef.current?.(Math.min(RUPTURE_COVER_AT, reportT));
        }
      } else if (voiceGroupRef.current) {
        voiceGroupRef.current.visible = false;
      }

      // Smooth Deformation Animation: Transitions Horn Torus between Standard Geometric shape (delta=0) and Deformed state
      if (isAnimatingDeformRef.current) {
        const speed = deformAnimSpeedRef.current;
        // Base transition duration: 2.8s at 1.0x speed
        const progressStep = (delta / 2.8) * speed;

        if (deformAnimModeRef.current === 'loop') {
          deformProgressRef.current += progressStep * deformDirectionRef.current;
          if (deformProgressRef.current >= 1.0) {
            deformProgressRef.current = 1.0;
            deformDirectionRef.current = -1;
          } else if (deformProgressRef.current <= 0.0) {
            deformProgressRef.current = 0.0;
            deformDirectionRef.current = 1;
          }
        } else {
          deformProgressRef.current += progressStep;
          if (deformProgressRef.current >= 1.0) {
            deformProgressRef.current = 1.0;
            isAnimatingDeformRef.current = false;
            setIsAnimatingDeformation(false);
            if (onToggleDeformationAnimationRef.current) {
              onToggleDeformationAnimationRef.current();
            }
          }
        }

        const t = Math.max(0.0, Math.min(1.0, deformProgressRef.current));
        // Sine ease-in-out interpolation: smooth acceleration & deceleration
        const easedT = 0.5 * (1.0 - Math.cos(Math.PI * t));
        const maxDelta = Math.max(0.15, targetMaxDeformationRef.current);
        const animatedDelta = easedT * maxDelta;
        currentAnimatedDeltaRef.current = animatedDelta;

        // In-place 60 FPS update of 3D geometry buffers
        if (deformedMeshRef.current) {
          const geo = deformedMeshRef.current.geometry;
          const posAttr = geo.attributes.position as THREE.BufferAttribute;
          const normAttr = geo.attributes.normal as THREE.BufferAttribute;
          const colAttr = geo.attributes.color as THREE.BufferAttribute;
          if (posAttr && normAttr && colAttr) {
            updateHornTorusVertices(
              posAttr.array as Float32Array,
              normAttr.array as Float32Array,
              colAttr.array as Float32Array,
              paramsRef.current,
              sclDataRef.current,
              animatedDelta,
              colorMapRef.current
            );
            posAttr.needsUpdate = true;
            normAttr.needsUpdate = true;
            colAttr.needsUpdate = true;
          }
        }

        if (xrayCcMeshRef.current && deformedMeshRef.current) {
          const geo = xrayCcMeshRef.current.geometry;
          if (geo.attributes.position) {
            geo.attributes.position.needsUpdate = true;
            geo.attributes.normal.needsUpdate = true;
            geo.attributes.color.needsUpdate = true;
          }
        }
        if (xrayIccMeshRef.current && deformedMeshRef.current) {
          const geo = xrayIccMeshRef.current.geometry;
          if (geo.attributes.position) {
            geo.attributes.position.needsUpdate = true;
            geo.attributes.normal.needsUpdate = true;
            geo.attributes.color.needsUpdate = true;
          }
        }

        // Throttled UI state synchronization (~18 fps)
        if (currentTime - lastStateSyncTimeRef.current > 55 || !isAnimatingDeformRef.current) {
          lastStateSyncTimeRef.current = currentTime;
          setAnimatedDeformFactor(animatedDelta);
          if (onDeformationFactorChangeRef.current) {
            onDeformationFactorChangeRef.current(animatedDelta);
          }
        }
      }

      // Smooth Fluid ViewMode Transition (Morphing / Cross-Fading between Standard, Deformed, X-Ray, Interior, etc.)
      if (viewModeTransitionProgressRef.current < 1.0) {
        viewModeTransitionProgressRef.current += delta / transitionDurationRef.current;
        if (viewModeTransitionProgressRef.current >= 1.0) {
          viewModeTransitionProgressRef.current = 1.0;
          setIsTransitioningViewMode(false);
        }

        const t = Math.max(0.0, Math.min(1.0, viewModeTransitionProgressRef.current));
        // Smooth Hermite / S-Curve Ease-in-out: 3t^2 - 2t^3
        const smoothT = t * t * (3.0 - 2.0 * t);

        const fromMode = fromViewModeRef.current;
        const toMode = targetViewModeRef.current;

        // Determine target base opacities according to mode specifications
        const getModeOpacities = (m: ViewMode) => {
          const isXRay = m === 'xray_icc';
          const isInt = m === 'interior_icc';
          const isStd = m === 'standard';
          const isDef = m === 'deformed' || m === 'cross_section';
          const isComp = m === 'comparison';

          const userCc = previousCcOpacityRef.current;
          const xrayCcTarget = isXRay ? Math.max(0.04, Math.min(1.0, userCc)) : 0.0;
          const xrayIccTarget = isXRay ? 0.36 : 0.0;
          const stdTarget = (isStd || isInt) ? (isInt ? Math.min(userCc, 0.22) : (isComp ? 0.35 : userCc)) : 0.0;
          const defTarget = isDef ? userCc : (isComp ? userCc : 0.0);
          const wireCcTarget = isXRay ? Math.max(0.06, Math.min(0.40, userCc * 0.45 + 0.08)) : 0.0;

          return { xrayCcTarget, xrayIccTarget, stdTarget, defTarget, wireCcTarget };
        };

        const fromVals = getModeOpacities(fromMode);
        const toVals = getModeOpacities(toMode);

        const currentStdOpacity = fromVals.stdTarget + (toVals.stdTarget - fromVals.stdTarget) * smoothT;
        const currentDefOpacity = fromVals.defTarget + (toVals.defTarget - fromVals.defTarget) * smoothT;
        const currentXrayCcOpacity = fromVals.xrayCcTarget + (toVals.xrayCcTarget - fromVals.xrayCcTarget) * smoothT;
        const currentXrayIccOpacity = fromVals.xrayIccTarget + (toVals.xrayIccTarget - fromVals.xrayIccTarget) * smoothT;
        const currentWireOpacity = fromVals.wireCcTarget + (toVals.wireCcTarget - fromVals.wireCcTarget) * smoothT;

        // Apply dynamic interpolated opacity and visibility to Standard Torus mesh
        if (standardMeshRef.current && standardMaterialRef.current) {
          standardMaterialRef.current.opacity = currentStdOpacity;
          standardMeshRef.current.visible = currentStdOpacity > 0.005;
        }

        // Apply dynamic interpolated opacity and visibility to Deformed Torus mesh
        if (deformedMeshRef.current && deformedMaterialRef.current) {
          deformedMaterialRef.current.opacity = currentDefOpacity;
          deformedMeshRef.current.visible = currentDefOpacity > 0.005;
        }

        // Apply dynamic interpolated opacity and visibility to X-Ray Cc Outer Shell
        if (xrayCcMeshRef.current && xrayCcMaterialRef.current) {
          xrayCcMaterialRef.current.opacity = currentXrayCcOpacity;
          xrayCcMeshRef.current.visible = currentXrayCcOpacity > 0.005;
        }

        // Apply dynamic interpolated opacity and visibility to X-Ray Outer Structural Wireframe
        if (xrayWireframeRef.current) {
          const wireMat = xrayWireframeRef.current.material as THREE.LineBasicMaterial;
          wireMat.opacity = currentWireOpacity;
          xrayWireframeRef.current.visible = currentWireOpacity > 0.005;
        }

        // Apply dynamic interpolated opacity and visibility to X-Ray Icc Inner Core
        if (xrayIccMeshRef.current && xrayIccMaterialRef.current) {
          xrayIccMaterialRef.current.opacity = currentXrayIccOpacity;
          xrayIccMeshRef.current.visible = currentXrayIccOpacity > 0.005;
        }

        // Dynamic light transition
        if (interiorLightRef.current) {
          const isFromGlow = fromMode === 'xray_icc' || fromMode === 'interior_icc';
          const isToGlow = toMode === 'xray_icc' || toMode === 'interior_icc';
          const fromIntensity = isFromGlow ? (fromMode === 'xray_icc' ? 3.0 : 2.2) : 0.0;
          const toIntensity = isToGlow ? (toMode === 'xray_icc' ? 3.0 : 2.2) : 0.0;
          const currentIntensity = fromIntensity + (toIntensity - fromIntensity) * smoothT;
          interiorLightRef.current.intensity = currentIntensity;
          interiorLightRef.current.visible = currentIntensity > 0.05;
        }
      }

      // Update particle vortex flow
      if (particlesRef.current && showVortexFlowRef.current) {
        particlesRef.current.visible = true;
        const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const positionsArr = posAttr.array as Float32Array;
        const lac = calculateLacanianParameters(sclDataRef.current, paramsRef.current);
        const a = lac.a * 25.0;

        for (let i = 0; i < particleCount; i++) {
          let v = particleAngles[i * 2];
          let u = particleAngles[i * 2 + 1];
          const spd = particleSpeed[i];

          v += spd * 1.5;
          u += spd * 0.8;
          if (v > Math.PI) v = -Math.PI;
          if (u > Math.PI * 2) u = 0;

          particleAngles[i * 2] = v;
          particleAngles[i * 2 + 1] = u;

          const dist = a * (1 + Math.cos(v));
          positionsArr[i * 3] = dist * Math.cos(u);
          positionsArr[i * 3 + 1] = dist * Math.sin(u);
          positionsArr[i * 3 + 2] = a * Math.sin(v);
        }
        posAttr.needsUpdate = true;
      } else if (particlesRef.current) {
        particlesRef.current.visible = false;
      }

      // Update Hilo Pulsional (Trieb) Directional Flow Vector Field & Tracers
      if (pulsionGroupRef.current) {
        if (showPulsionRef.current) {
          pulsionGroupRef.current.visible = true;
          const timeSec = currentTime * 0.001;

          // 1. Pulsate and orient directional vector field arrows across the interior surface
          if (pulsionVectorFieldRef.current && pulsionVectorsDataRef.current.length > 0) {
            const inst = pulsionVectorFieldRef.current;
            const vectors = pulsionVectorsDataRef.current;
            const dummy = dummyObjRef.current;
            const up = unitYVectorRef.current;
            const q = quaternionRef.current;
            const dirVec = targetDirVectorRef.current;

            for (let i = 0; i < vectors.length; i++) {
              const item = vectors[i];
              // Rhythmic Drang wave surge
              const pulse = 0.85 + 0.30 * Math.sin(timeSec * 3.4 - item.phase);
              const s = item.magnitude * pulse * 0.95;

              dummy.position.set(item.origin[0], item.origin[1], item.origin[2]);
              dirVec.set(item.direction[0], item.direction[1], item.direction[2]);
              q.setFromUnitVectors(up, dirVec);
              dummy.quaternion.copy(q);
              dummy.scale.set(s, s * 1.15, s);
              dummy.updateMatrix();
              inst.setMatrixAt(i, dummy.matrix);
            }
            inst.instanceMatrix.needsUpdate = true;
          }

          // 2. Animate Dynamic Directional Flow Tracers (moving across the interior surface)
          if (
            pulsionTracersStateRef.current &&
            pulsionTracersLinesRef.current &&
            pulsionTracersPointsRef.current
          ) {
            const { u, v, speeds, count } = pulsionTracersStateRef.current;
            const linesAttr = pulsionTracersLinesRef.current.geometry.attributes.position as THREE.BufferAttribute;
            const linesArr = linesAttr.array as Float32Array;
            const pointsAttr = pulsionTracersPointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
            const pointsArr = pointsAttr.array as Float32Array;

            const lac = calculateLacanianParameters(sclDataRef.current, paramsRef.current);
            const visualScale = 25.0;
            const effectiveA = lac.a * visualScale;
            const isDeform = (viewModeRef.current === 'deformed' || viewModeRef.current === 'comparison');
            const effectiveDeform = isDeform
              ? (isAnimatingDeformRef.current ? currentAnimatedDeltaRef.current : paramsRef.current.deformation_factor)
              : 0.0;
            const phi_I = lac.v_I % (2 * Math.PI);

            for (let i = 0; i < count; i++) {
              const spd = speeds[i];
              // Accelerates near the cusp throat v ~ pi
              const throatFactor = 1.0 + 0.55 * Math.sin(v[i]);
              v[i] += delta * spd * 1.65 * throatFactor;
              u[i] += delta * spd * 1.15;

              // Monismo de superficie: los VR circulan sobre toda la variedad del Icc (v in [0, 2*pi])
              if (v[i] > Math.PI * 2) {
                v[i] -= Math.PI * 2;
                u[i] = Math.random() * 2 * Math.PI;
              }
              if (u[i] > Math.PI * 2) {
                u[i] -= Math.PI * 2;
              }

              const ui = u[i];
              const vi = v[i];
              const cosV = Math.cos(vi);
              const sinV = Math.sin(vi);
              const cosU = Math.cos(ui);
              const sinU = Math.sin(ui);

              const r0 = effectiveA * (1 + cosV);
              let px = r0 * cosU;
              let py = r0 * sinU;
              let pz = effectiveA * sinV;

              if (effectiveDeform > 0) {
                const { factor } = computeSclDeformation(ui, vi, sclDataRef.current, effectiveDeform);
                px *= factor;
                py *= factor;
                pz *= 1.0 + (factor - 1.0) * 0.85;
              }

              // Local tangent velocity vector
              const tu_x = -sinU;
              const tu_y = cosU;
              const tu_z = 0;
              const tv_x = -sinV * cosU;
              const tv_y = -sinV * sinU;
              const tv_z = cosV;

              const v_I_at_u = Math.PI + 0.48 * Math.sin(ui + phi_I) + 0.12 * Math.cos(2 * ui);
              const weightI = Math.exp(-Math.pow(Math.abs(vi - v_I_at_u) / 0.55, 2));

              let vx = 0.72 * tu_x + 0.68 * tv_x + 0.35 * weightI * tu_x;
              let vy = 0.72 * tu_y + 0.68 * tv_y + 0.35 * weightI * tu_y;
              let vz = 0.68 * tv_z;
              const vLen = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1.0;
              vx /= vLen;
              vy /= vLen;
              vz /= vLen;

              // Glowing head position
              pointsArr[i * 3] = px;
              pointsArr[i * 3 + 1] = py;
              pointsArr[i * 3 + 2] = pz;

              // Directional stream tail
              const tailLen = 0.26 * (1.0 + weightI * 0.35);
              linesArr[i * 6] = px - vx * tailLen;
              linesArr[i * 6 + 1] = py - vy * tailLen;
              linesArr[i * 6 + 2] = pz - vz * tailLen;

              linesArr[i * 6 + 3] = px;
              linesArr[i * 6 + 4] = py;
              linesArr[i * 6 + 5] = pz;
            }

            pointsAttr.needsUpdate = true;
            linesAttr.needsUpdate = true;
          }

          // 3. Animate Extimate Voice Intrusion Waves (Pulsión Voz / Superyó descending along Z into the cusp)
          if (voiceConeRef.current && voiceRingsRef.current.length > 0) {
            const host = sclDataRef.current['Hostilidad'] ?? 0.6;
            const psy = sclDataRef.current['Psicoticismo'] ?? 0.8;
            const voicePulse = 1.0 + 0.30 * Math.sin(timeSec * (4.2 + 2.0 * host));

            // Pulsate voice cone scale along radial and vertical dimensions
            voiceConeRef.current.scale.set(voicePulse, voicePulse, 1.0 + 0.15 * Math.sin(timeSec * 3.0));

            // Animate rings descending into the cusp (0, 0, 0)
            voiceRingsRef.current.forEach((ring, idx) => {
              const phase = (timeSec * 0.9 + idx * 0.33) % 1.0;
              // Z position descends along central funnel toward the singularity
              const currentZ = 1.4 - phase * 1.3;
              ring.position.z = currentZ;
              const currentScale = 0.3 + phase * 0.75;
              ring.scale.set(currentScale, currentScale, currentScale);
              const mat = ring.material as THREE.MeshBasicMaterial;
              if (mat) {
                mat.opacity = Math.sin(phase * Math.PI) * (0.55 + 0.35 * psy);
              }
            });
          }
        } else {
          pulsionGroupRef.current.visible = false;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      resizeObserver.disconnect();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, []);

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = rotationAngles.current;
    const clampedTheta = Math.max(0.05, Math.min(Math.PI - 0.05, theta));
    rotationAngles.current.theta = clampedTheta;

    cameraRef.current.position.x = radius * Math.sin(clampedTheta) * Math.sin(phi);
    cameraRef.current.position.y = radius * Math.cos(clampedTheta);
    cameraRef.current.position.z = radius * Math.sin(clampedTheta) * Math.cos(phi);
    cameraRef.current.lookAt(0, 0, 0);
  };

  // Auto-encuadre de ruptura: distancia que contiene el vértice más lejano al origen
  // (la cámara mira a la cúspide v=π, en el origen, así el orificio queda en cuadro).
  const autoFrameRupture = () => {
    const meshes = [standardMeshRef.current, deformedMeshRef.current, xrayCcMeshRef.current, xrayIccMeshRef.current]
      .filter(Boolean) as THREE.Mesh[];
    let maxR = 0;
    for (const m of meshes) {
      m.geometry.computeBoundingSphere();
      const bs = m.geometry.boundingSphere;
      if (!bs) continue;
      maxR = Math.max(maxR, bs.center.length() + bs.radius);
    }
    if (maxR > 0) {
      const fovDeg = cameraRef.current?.fov ?? 45;
      const needed = (maxR / Math.tan((fovDeg / 2) * (Math.PI / 180))) * 1.15;
      if (preRuptureRadiusRef.current === null) preRuptureRadiusRef.current = rotationAngles.current.radius;
      rotationAngles.current.radius = Math.max(rotationAngles.current.radius, Math.min(150, needed));
      updateCameraPosition();
    }
  };

  // 'Ver orificio': acercarse al punto de ruptura (cúspide v=π, la voz) durante la secuencia.
  const handleViewOrifice = () => {
    const aScene = calculateLacanianParameters(sclDataRef.current, paramsRef.current).a * 25.0;
    if (preRuptureRadiusRef.current === null) preRuptureRadiusRef.current = rotationAngles.current.radius;
    rotationAngles.current.radius = Math.max(6.0, Math.min(120, aScene * 3.2));
    userCameraRef.current = true;
    updateCameraPosition();
  };

  // Re-build Torus Meshes, Lacanian Ribbons (S, I, Pulsión, Sigma) & Fantasy Beacon
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (isAnimatingDeformRef.current) return;

    // Clean up previous meshes
    if (standardMeshRef.current) scene.remove(standardMeshRef.current);
    if (deformedMeshRef.current) scene.remove(deformedMeshRef.current);
    if (wireframeRef.current) scene.remove(wireframeRef.current);
    if (xrayCcMeshRef.current) scene.remove(xrayCcMeshRef.current);
    if (xrayIccMeshRef.current) scene.remove(xrayIccMeshRef.current);
    if (xrayWireframeRef.current) scene.remove(xrayWireframeRef.current);
    if (curveSRef.current) scene.remove(curveSRef.current);
    if (curveIRef.current) scene.remove(curveIRef.current);
    if (curvePulsionRef.current) scene.remove(curvePulsionRef.current);
    if (pulsionGroupRef.current) scene.remove(pulsionGroupRef.current);
    if (curveSigmaRef.current) scene.remove(curveSigmaRef.current);
    if (fantasyMeshRef.current) scene.remove(fantasyMeshRef.current);
    if (prccPointsRef.current) {
      scene.remove(prccPointsRef.current);
      prccPointsRef.current.geometry.dispose();
      (prccPointsRef.current.material as THREE.Material).dispose();
      prccPointsRef.current = null;
    }
    if (interiorLightRef.current) scene.remove(interiorLightRef.current);

    const isCut = viewMode === 'cross_section';
    const clippingPlanes = isCut && clippingPlaneRef.current ? [clippingPlaneRef.current] : [];

    // Mode configurations
    const isXRayMode = viewMode === 'xray_icc';
    const isInteriorMode = viewMode === 'interior_icc';
    const effectiveCcOpacity = isXRayMode
      ? Math.max(0.04, Math.min(1.0, ccOpacity))
      : (isInteriorMode ? Math.min(ccOpacity, 0.22) : ccOpacity);
    const isTranslucent = isXRayMode || isInteriorMode || viewMode === 'comparison' || effectiveCcOpacity < 0.92;

    if (isInteriorMode || isXRayMode) {
      const glow = new THREE.PointLight(0x38bdf8, isXRayMode ? 3.0 : 2.2, 12);
      glow.position.set(0, 0, 0);
      interiorLightRef.current = glow;
      scene.add(glow);
    }

    // 1. Standard Horn Torus Geometry (superficie Icc completa)
    const stdData = generateHornTorusGeometry(params, sclData, false, colorMap);
    const stdGeo = new THREE.BufferGeometry();
    stdGeo.setAttribute('position', new THREE.BufferAttribute(stdData.positions, 3));
    stdGeo.setAttribute('normal', new THREE.BufferAttribute(stdData.normals, 3));
    stdGeo.setAttribute('color', new THREE.BufferAttribute(stdData.colors, 3));
    stdGeo.setAttribute('uv', new THREE.BufferAttribute(stdData.uvs, 2));
    stdGeo.setIndex(new THREE.BufferAttribute(stdData.indices, 1));

    const stdMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      metalness: 0.18,
      roughness: 0.32,
      clearcoat: 0.7,
      clearcoatRoughness: 0.15,
      side: THREE.DoubleSide,
      clippingPlanes,
      clipShadows: true,
      transparent: true,
      opacity: (viewMode === 'standard' || isInteriorMode)
        ? (isInteriorMode ? Math.min(effectiveCcOpacity, 0.22) : effectiveCcOpacity)
        : (viewMode === 'comparison' ? 0.35 : 0.0),
      depthWrite: !isTranslucent,
      wireframe: false
    });
    standardMaterialRef.current = stdMat;
    const stdMesh = new THREE.Mesh(stdGeo, stdMat);
    stdMesh.visible = (viewMode === 'standard' || isInteriorMode || viewMode === 'comparison');
    standardMeshRef.current = stdMesh;

    // 2. Deformed Horn Torus Geometry
    const defData = generateHornTorusGeometry(params, sclData, true, colorMap);
    const defGeo = new THREE.BufferGeometry();
    defGeo.setAttribute('position', new THREE.BufferAttribute(defData.positions, 3));
    defGeo.setAttribute('normal', new THREE.BufferAttribute(defData.normals, 3));
    defGeo.setAttribute('color', new THREE.BufferAttribute(defData.colors, 3));
    defGeo.setAttribute('uv', new THREE.BufferAttribute(defData.uvs, 2));
    defGeo.setIndex(new THREE.BufferAttribute(defData.indices, 1));

    const defMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      metalness: 0.22,
      roughness: 0.28,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide,
      clippingPlanes,
      clipShadows: true,
      transparent: true,
      opacity: (viewMode === 'deformed' || viewMode === 'cross_section' || viewMode === 'comparison')
        ? effectiveCcOpacity
        : 0.0,
      depthWrite: !isTranslucent,
      wireframe: false
    });
    deformedMaterialRef.current = defMat;
    const defMesh = new THREE.Mesh(defGeo, defMat);
    defMesh.visible = (viewMode === 'deformed' || viewMode === 'cross_section' || viewMode === 'comparison');
    deformedMeshRef.current = defMesh;

    // Surface and X-Ray Configuration:
    // We instantiate both the Standard/Deformed surfaces AND the X-Ray components
    // so mode changes cross-fade smoothly at 60 FPS without destroying/recreating meshes.
    const targetData = (params.deformation_factor > 0 ? defData : stdData);
    const xrayCcGeo = new THREE.BufferGeometry();
    xrayCcGeo.setAttribute('position', new THREE.BufferAttribute(targetData.positions, 3));
    xrayCcGeo.setAttribute('normal', new THREE.BufferAttribute(targetData.normals, 3));
    xrayCcGeo.setAttribute('color', new THREE.BufferAttribute(targetData.colors, 3));
    xrayCcGeo.setAttribute('uv', new THREE.BufferAttribute(targetData.uvs, 2));
    xrayCcGeo.setIndex(new THREE.BufferAttribute(targetData.outerFaceIndices, 1));

    const xrayCcMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      color: 0x38bdf8,
      metalness: 0.12,
      roughness: 0.20,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: isXRayMode ? effectiveCcOpacity : 0.0,
      depthWrite: false, // Fundamental: evita oclusión Z de las cintas interiores
      side: THREE.DoubleSide,
      clippingPlanes,
      clipShadows: true
    });
    xrayCcMaterialRef.current = xrayCcMat;

    const xrayCcMesh = new THREE.Mesh(xrayCcGeo, xrayCcMat);
    xrayCcMesh.renderOrder = 10;
    xrayCcMesh.visible = isXRayMode;
    xrayCcMeshRef.current = xrayCcMesh;
    scene.add(xrayCcMesh);

    // Crystalline structural wireframe outlining the conscious outer shell
    const wireCcGeo = new THREE.WireframeGeometry(xrayCcGeo);
    const wireCcMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: isXRayMode ? Math.max(0.06, Math.min(0.40, effectiveCcOpacity * 0.45 + 0.08)) : 0.0,
      clippingPlanes
    });
    const xrayWire = new THREE.LineSegments(wireCcGeo, wireCcMat);
    xrayWire.renderOrder = 11;
    xrayWire.visible = isXRayMode;
    xrayWireframeRef.current = xrayWire;
    scene.add(xrayWire);

    // Cara interna de la pared (la que mira al volumen), convergiendo a p (v = π). La superficie SIEMPRE es Icc.
    const xrayIccGeo = new THREE.BufferGeometry();
    xrayIccGeo.setAttribute('position', new THREE.BufferAttribute(targetData.positions, 3));
    xrayIccGeo.setAttribute('normal', new THREE.BufferAttribute(targetData.normals, 3));
    xrayIccGeo.setAttribute('color', new THREE.BufferAttribute(targetData.colors, 3));
    xrayIccGeo.setAttribute('uv', new THREE.BufferAttribute(targetData.uvs, 2));
    xrayIccGeo.setIndex(new THREE.BufferAttribute(targetData.prccIndices, 1));

    const xrayIccMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      metalness: 0.25,
      roughness: 0.35,
      clearcoat: 0.5,
      transparent: true,
      opacity: isXRayMode ? 0.36 : 0.0,
      depthWrite: false,
      side: THREE.DoubleSide,
      clippingPlanes,
      clipShadows: true
    });
    xrayIccMaterialRef.current = xrayIccMat;
    const xrayIccMesh = new THREE.Mesh(xrayIccGeo, xrayIccMat);
    xrayIccMesh.renderOrder = 1;
    xrayIccMesh.visible = isXRayMode;
    xrayIccMeshRef.current = xrayIccMesh;
    scene.add(xrayIccMesh);

    // 3. Wireframe Overlay
    if (showWireframe) {
      const targetGeo = (viewMode === 'standard' || isInteriorMode) ? stdGeo : defGeo;
      const wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(targetGeo),
        new THREE.LineBasicMaterial({
          color: 0x94a3b8,
          transparent: true,
          opacity: isInteriorMode ? 0.18 : 0.25,
          clippingPlanes
        })
      );
      wireframeRef.current = wire;
      scene.add(wire);
    }

    // Add standard and deformed meshes to scene (both persisted for instantaneous or smooth transitions)
    scene.add(stdMesh);
    scene.add(defMesh);

    // 4. Lacanian Ribbons & Curves: S, I, Hilo Pulsional, Sigma (entrecruzadas en el interior)
    // Tras la ruptura psicótica, la reconfiguración ('covered') persiste en las
    // reconstrucciones mientras el IGS siga fuera de baremo (≥ 3× el corte).
    const ribbonMode: RibbonMode = ruptureVisual === 'covered' ? 'covered' : 'stable';
    const lacanian = calculateLacanianParameters(sclData, params);
    const { curveS, curveI, curvePulsion, curveSigma, fantasy3D } = getLacanianCurves(lacanian, 220, 25.0, ribbonMode);

    const createRibbonOrLine = (
      points: [number, number, number][],
      colorHex: number,
      emissiveHex: number,
      ribbonWidth: number,
      isPulsion: boolean = false
    ): THREE.Object3D => {
      if (showRibbons) {
        const geoData = generateRibbonGeometryData(points, ribbonWidth);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(geoData.positions, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(geoData.normals, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(geoData.uvs, 2));
        geo.setIndex(new THREE.BufferAttribute(geoData.indices, 1));

        const mat = new THREE.MeshPhysicalMaterial({
          color: colorHex,
          emissive: emissiveHex,
          emissiveIntensity: isXRayMode ? (isPulsion ? 1.25 : 0.90) : (isPulsion ? 0.65 : 0.4),
          roughness: 0.25,
          metalness: isPulsion ? 0.5 : 0.2,
          clearcoat: 0.95,
          side: THREE.DoubleSide,
          clippingPlanes,
          depthWrite: !isXRayMode
        });
        const mesh = new THREE.Mesh(geo, mat);
        if (isXRayMode) mesh.renderOrder = 6;
        return mesh;
      } else {
        const pts = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({
          color: colorHex,
          linewidth: 3,
          clippingPlanes
        });
        const line = new THREE.Line(geo, mat);
        if (isXRayMode) line.renderOrder = 6;
        return line;
      }
    };

    // Curva S (Significante / Simbólico) - Red Ribbon
    if (showCurveS) {
      const objS = createRibbonOrLine(curveS, 0xef4444, 0x500707, 0.085);
      curveSRef.current = objS;
      scene.add(objS);
    }

    // Curva I (Imagen del cuerpo) - Green Ribbon
    if (showCurveI) {
      const objI = createRibbonOrLine(curveI, 0x10b981, 0x022c22, 0.085);
      curveIRef.current = objI;
      scene.add(objI);
    }

    // Hilo Pulsional (Trieb · Drang):
    // Animated directional flow vector field moving across the interior surface of the torus,
    // directly linked to the showPulsion toggle state, plus the golden ribbon anchored to I
    if (showPulsion) {
      const pulsionGroup = new THREE.Group();
      pulsionGroup.name = 'pulsionGroup';

      // 1. Central golden ribbon/braid pegado al borde de I
      const objPulsionRibbon = createRibbonOrLine(curvePulsion, 0xf59e0b, 0x78350f, 0.065, true);
      pulsionGroup.add(objPulsionRibbon);
      curvePulsionRef.current = objPulsionRibbon;

      // 2. Interior Directional Flow Vector Field (Quiver of 3D arrows)
      const isDeform = (viewMode === 'deformed' || viewMode === 'comparison');
      const vfData = generatePulsionVectorFieldData(lacanian, sclData, params, isDeform);
      pulsionVectorsDataRef.current = vfData.vectors;

      const arrowGeo = createDirectionalArrowGeometry();
      const arrowMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.85,
        roughness: 0.28,
        metalness: 0.32,
        side: THREE.DoubleSide,
        clippingPlanes,
        clipShadows: true
      });

      const instMesh = new THREE.InstancedMesh(arrowGeo, arrowMat, vfData.count);
      const dummy = dummyObjRef.current;
      const up = unitYVectorRef.current;
      const q = quaternionRef.current;
      const dirVec = targetDirVectorRef.current;

      for (let i = 0; i < vfData.count; i++) {
        const item = vfData.vectors[i];
        dummy.position.set(item.origin[0], item.origin[1], item.origin[2]);
        dirVec.set(item.direction[0], item.direction[1], item.direction[2]);
        q.setFromUnitVectors(up, dirVec);
        dummy.quaternion.copy(q);
        const s = item.magnitude * 0.95;
        dummy.scale.set(s, s * 1.15, s);
        dummy.updateMatrix();
        instMesh.setMatrixAt(i, dummy.matrix);
      }
      instMesh.instanceMatrix.needsUpdate = true;
      pulsionGroup.add(instMesh);
      pulsionVectorFieldRef.current = instMesh;

      // 3. Dynamic Animated Stream Tracers (moving directional vectors across interior surface)
      const tracerCount = 140;
      const tracerU = new Float32Array(tracerCount);
      const tracerV = new Float32Array(tracerCount);
      const tracerSpeeds = new Float32Array(tracerCount);

      for (let i = 0; i < tracerCount; i++) {
        tracerU[i] = Math.random() * 2 * Math.PI;
        // Monismo de superficie: los VR cubren toda la variedad del Icc (v in [0, 2*pi])
        tracerV[i] = Math.random() * 2 * Math.PI;
        tracerSpeeds[i] = 0.45 + Math.random() * 0.55;
      }
      pulsionTracersStateRef.current = {
        u: tracerU,
        v: tracerV,
        speeds: tracerSpeeds,
        count: tracerCount
      };

      // Tracers line segments (streamline tails)
      const linePositions = new Float32Array(tracerCount * 2 * 3);
      const linesGeo = new THREE.BufferGeometry();
      linesGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      const linesMat = new THREE.LineBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.9,
        linewidth: 2,
        clippingPlanes
      });
      const tracersLines = new THREE.LineSegments(linesGeo, linesMat);
      pulsionGroup.add(tracersLines);
      pulsionTracersLinesRef.current = tracersLines;

      // Tracers points (glowing forward heads)
      const pointPositions = new Float32Array(tracerCount * 3);
      const pointsGeo = new THREE.BufferGeometry();
      pointsGeo.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
      const pointsMat = new THREE.PointsMaterial({
        color: 0xfffbeb,
        size: 0.085,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        clippingPlanes
      });
      const tracersPoints = new THREE.Points(pointsGeo, pointsMat);
      pulsionGroup.add(tracersPoints);
      pulsionTracersPointsRef.current = tracersPoints;

      // 4. Intrusión Éxtima de la Pulsión Voz (Superyó / Objeto a):
      // El único "afuera" que contacta con el toro es la Voz penetrando verticalmente por el eje central hacia el origen (v = pi).
      const voiceConeGeo = new THREE.ConeGeometry(0.38, 1.4, 24, 1, true);
      voiceConeGeo.rotateX(Math.PI / 2); // Apunta hacia el centro singular (0, 0, 0)
      const voiceConeMat = new THREE.MeshBasicMaterial({
        color: 0xec4899,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        clippingPlanes
      });
      const voiceCone = new THREE.Mesh(voiceConeGeo, voiceConeMat);
      voiceCone.position.set(0, 0, 0.95);
      pulsionGroup.add(voiceCone);
      voiceConeRef.current = voiceCone;

      // Ondas acústicas concéntricas descendiendo hacia la cúspide
      const waveRings: THREE.Mesh[] = [];
      for (let w = 0; w < 3; w++) {
        const ringGeo = new THREE.RingGeometry(0.12 + w * 0.1, 0.16 + w * 0.1, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide,
          clippingPlanes
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(0, 0, 0.45 + w * 0.35);
        pulsionGroup.add(ringMesh);
        waveRings.push(ringMesh);
      }
      voiceRingsRef.current = waveRings;

      pulsionGroup.visible = showPulsion;
      if (isXRayMode) pulsionGroup.renderOrder = 6;
      pulsionGroupRef.current = pulsionGroup;
      scene.add(pulsionGroup);
    }

    // Curva Sigma (Síntoma) - Blue Ribbon
    if (showCurveSigma) {
      const objSigma = createRibbonOrLine(curveSigma, 0x3b82f6, 0x172554, 0.085);
      curveSigmaRef.current = objSigma;
      scene.add(objSigma);
    }

    // 5. Marcas de fantasía (la angustia surge por proximidad — N marcas, §8)
    if (showFantasyPoint) {
      const fantasyGroup = new THREE.Group();

      const marks = lacanian.fantasyMarks3D ?? [fantasy3D];
      for (let mi = 0; mi < marks.length; mi++) {
        const [mx, my, mz] = marks[mi];
        // Esfera incandescente (la marca misma)
        const sphereGeo = new THREE.SphereGeometry(0.13, 20, 20);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: 0xf43f5e,
          emissive: 0xe11d48,
          emissiveIntensity: 0.95,
          roughness: 0.15,
          depthWrite: !isXRayMode
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.set(mx, my, mz);
        fantasyGroup.add(sphere);

        // Anillo pulsante
        const ringGeo = new THREE.RingGeometry(0.18, 0.26, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xfb7185,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
          depthWrite: !isXRayMode
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(mx, my, mz);
        ring.lookAt(0, 0, 0);
        fantasyGroup.add(ring);

        // Halo: vecindad de angustia crítica (radio de proximidad A_cr = π/4)
        const haloGeo = new THREE.SphereGeometry(0.38, 16, 16);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
          transparent: true,
          opacity: 0.16,
          wireframe: true,
          depthWrite: !isXRayMode
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.set(mx, my, mz);
        fantasyGroup.add(halo);
      }

      if (isXRayMode) fantasyGroup.renderOrder = 7;
      fantasyMeshRef.current = fantasyGroup;
      scene.add(fantasyGroup);
    }

    // 6. Campo Prcc (tesis V22, AXIOMA): lo que entra por la voz. Nube de puntos fuera
    // del volumen interior, más densa en el embudo del eje alrededor de p y sin borde
    // (se degrada con la distancia). El brillo de cada punto sigue la intensidad del campo.
    // En la escena, el eje de revolución es z y p está en el origen.
    if (showPrcc) {
      const R = lacanian.a * 25.0;
      const { positions, intensities } = generatePrccFieldPoints(R, 1800);
      const cols = new Float32Array(positions.length);
      const base = new THREE.Color(0x2bb5c0);
      for (let k = 0; k < intensities.length; k++) {
        const f = 0.25 + 0.75 * intensities[k];
        cols[k * 3] = base.r * f;
        cols[k * 3 + 1] = base.g * f;
        cols[k * 3 + 2] = base.b * f;
      }
      const prccGeo = new THREE.BufferGeometry();
      prccGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      prccGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      const prccMat = new THREE.PointsMaterial({
        size: Math.max(0.035, R * 0.018),
        vertexColors: true,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        clippingPlanes
      });
      const prccPoints = new THREE.Points(prccGeo, prccMat);
      prccPoints.renderOrder = 2;
      prccPointsRef.current = prccPoints;
      scene.add(prccPoints);
    }

    // Auto-encuadre durante la ruptura (esfera envolvente real; se respeta el zoom
    // manual: rueda o 'Ver orificio' no se pisan).
    if (ruptureVisual !== 'idle' && !userCameraRef.current) autoFrameRupture();
  }, [
    sclData,
    params,
    viewMode,
    colorMap,
    showWireframe,
    showCurveS,
    showCurveI,
    showPulsion,
    showCurveSigma,
    showFantasyPoint,
    showPrcc,
    showRibbons,
    ccOpacity,
    ruptureVisual
  ]);

  // Real-time dynamic opacity adjustment for the outer skin of the Icc surface in X-Ray mode
  useEffect(() => {
    previousCcOpacityRef.current = ccOpacity;
    if (viewMode === 'xray_icc' && xrayCcMaterialRef.current) {
      xrayCcMaterialRef.current.opacity = Math.max(0.04, Math.min(1.0, ccOpacity));
      xrayCcMaterialRef.current.needsUpdate = true;
    }
    if (viewMode === 'xray_icc' && xrayWireframeRef.current) {
      const wireMat = xrayWireframeRef.current.material as THREE.LineBasicMaterial;
      wireMat.opacity = Math.max(0.06, Math.min(0.40, ccOpacity * 0.45 + 0.08));
      wireMat.needsUpdate = true;
    }
  }, [ccOpacity, viewMode]);

  // Mouse Interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    rotationAngles.current.phi += deltaX * 0.007;
    rotationAngles.current.theta -= deltaY * 0.007;
    updateCameraPosition();

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newRadius = rotationAngles.current.radius + e.deltaY * 0.006;
    rotationAngles.current.radius = Math.max(3.5, Math.min(200.0, newRadius));
    userCameraRef.current = true;
    updateCameraPosition();
  };

  const handleResetCamera = () => {
    rotationAngles.current = { theta: 0.65, phi: 0.75, radius: 9.0 };
    updateCameraPosition();
    // Durante la ruptura, 'Centrar vista' re-encuadra (el radio 9 quedaría dentro del modelo)
    if (rupturePhaseRef.current !== 'idle') {
      userCameraRef.current = false;
      autoFrameRupture();
    }
  };

  // Capture PNG matching model.plot_3d_model & model.plot_deformed_model
  const handleExportPng = (type: 'standard' | 'deformed') => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    setIsCapturing(true);

    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;

    const prevStdVis = standardMeshRef.current?.visible;
    const prevDefVis = deformedMeshRef.current?.visible;

    if (type === 'standard') {
      if (standardMeshRef.current) standardMeshRef.current.visible = true;
      if (deformedMeshRef.current) deformedMeshRef.current.visible = false;
    } else {
      if (standardMeshRef.current) standardMeshRef.current.visible = false;
      if (deformedMeshRef.current) deformedMeshRef.current.visible = true;
    }

    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');

    if (standardMeshRef.current && prevStdVis !== undefined) standardMeshRef.current.visible = prevStdVis;
    if (deformedMeshRef.current && prevDefVis !== undefined) deformedMeshRef.current.visible = prevDefVis;
    renderer.render(scene, camera);

    const filename = type === 'standard' ? 'mi_modelo.png' : 'mi_modelo_deformado.png';
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    onCapturePng(type, dataUrl);
    setTimeout(() => setIsCapturing(false), 500);
  };

  const lacanian = calculateLacanianParameters(sclData, params);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none">
      {/* 3D WebGL Viewport */}
      <div
        id="horn-torus-canvas-container"
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing flex-1"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Top Floating Action Bar */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Lacanian Identity Pill */}
        <div className="pointer-events-auto flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg text-xs shadow-lg">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              viewMode === 'xray_icc'
                ? 'bg-cyan-400 ring-2 ring-cyan-400/40'
                : viewMode === 'interior_icc'
                ? 'bg-amber-400'
                : colorMap === 'differential_stress'
                ? 'bg-fuchsia-400'
                : 'bg-cyan-400'
            } animate-pulse`}
          />
          <span className="font-mono font-semibold text-slate-100 flex items-center gap-1.5">
            {viewMode === 'xray_icc' ? (
              <>
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-cyan-300 font-bold">Rayos X: piel translúcida</span>
              </>
            ) : viewMode === 'interior_icc' ? (
              'Interior: cintas sobre la superficie Icc'
            ) : viewMode === 'standard' ? (
              'Horn Torus (superficie Icc · Cc = exterior)'
            ) : (
              'Horn Torus Deformado'
            )}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-300 font-mono">
            a={(params.a_scale * sclData["GSI"]).toFixed(4)}
          </span>
          {viewMode === 'xray_icc' ? (
            <>
              <span className="text-slate-500">|</span>
              <span className="text-cyan-300 font-mono flex items-center gap-1 font-semibold">
                <Scan className="w-3 h-3 text-cyan-400" />
                <span>Piel translúcida: {(ccOpacity * 100).toFixed(0)}%</span>
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-300 font-mono">
                Cara interna de la pared visible
              </span>
            </>
          ) : viewMode === 'interior_icc' ? (
            <>
              <span className="text-slate-500">|</span>
              <span className="text-amber-300 font-mono flex items-center gap-1">
                <Eye className="w-3 h-3 text-amber-400" />
                <span>Piel translúcida</span>
              </span>
            </>
          ) : colorMap === 'differential_stress' ? (
            <>
              <span className="text-slate-500">|</span>
              <span className="text-fuchsia-300 font-mono flex items-center gap-1 font-semibold">
                <Activity className="w-3 h-3 text-fuchsia-400" />
                <span>ΔE Tensión</span>
              </span>
            </>
          ) : (
            <>
              <span className="text-slate-500">|</span>
              <span className="text-rose-300 font-mono">
                Marca de fantasía
              </span>
            </>
          )}
          {showPulsion && (
            <>
              <span className="text-slate-500">|</span>
              <span className="text-amber-300 font-mono flex items-center gap-1 font-semibold">
                <Waves className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Flujo Pulsional (Drang)</span>
              </span>
            </>
          )}
          {ruptureVisual !== 'idle' && (
            <>
              <span className="text-slate-500">|</span>
              <span className={`font-mono flex items-center gap-1 font-bold ${
                ruptureVisual === 'ejected' ? 'text-rose-300 animate-pulse' : 'text-orange-300'
              }`}>
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span>
                  {ruptureVisual === 'ejected'
                    ? (rupturePhaseAt(ruptureClock) === 'integracion-fantasia'
                      ? 'COROLARIO II · EYECCIÓN: la fantasía se integra a la voz (orificio v=π)'
                      : 'COROLARIO II · EYECCIÓN: la cinta S-I sale por la voz (v=π)')
                    : 'COROLARIO II · UMBAU: cadenas de S e I reenganchadas en orden nuevo — cintas cubren toda la superficie'}
                </span>
              </span>
            </>
          )}
        </div>

        {/* Exploración temporal de la ruptura: scrub + play/pausa + repetir + volver a estable */}
        {ruptureVisual !== 'idle' && (onRuptureTimeChange || onRuptureReplay) && (
          <div className="pointer-events-auto w-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
            {onRupturePlayingChange && (
              <button
                id="rupture-scrub-play"
                onClick={() => onRupturePlayingChange(!rupturePlaying)}
                className="shrink-0 w-7 h-7 rounded-md bg-slate-800 border border-slate-600 text-slate-200 hover:text-white hover:border-slate-400 flex items-center justify-center transition-colors"
                title={rupturePlaying ? 'Pausar la secuencia' : 'Reanudar la secuencia'}
              >
                {rupturePlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            )}
            {onRuptureTimeChange && (
              <input
                id="rupture-scrub-slider"
                type="range"
                min={0}
                max={6}
                step={0.1}
                value={Math.min(6, scrubTime)}
                onChange={(e) => onRuptureTimeChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 accent-rose-500 cursor-pointer"
                title="Explorar la secuencia: 0–1.4 s colapso de cintas · voz saliendo del orificio (v=π) · 6 s reconfiguración cubriendo toda la superficie"
              />
            )}
            <span className="shrink-0 font-mono text-[10px] text-slate-300 w-20 text-right">
              {Math.min(6, scrubTime).toFixed(1)} / 6.0 s
            </span>
            <button
              id="rupture-view-orifice-btn"
              onClick={handleViewOrifice}
              className="shrink-0 px-2 py-1 rounded-md text-xs bg-slate-800 border border-rose-800/60 text-rose-200 hover:text-white hover:border-rose-500 flex items-center gap-1 transition-colors"
              title="Acercar la cámara al punto de ruptura: orificio/cúspide v=π (la voz)"
            >
              <CircleDot className="w-3 h-3 text-rose-400" />
              <span>Ver orificio</span>
            </button>
            {onRuptureReplay && (
              <button
                id="rupture-replay-btn"
                onClick={onRuptureReplay}
                className="shrink-0 px-2 py-1 rounded-md text-xs bg-slate-800 border border-slate-600 text-slate-200 hover:text-white hover:border-slate-400 flex items-center gap-1 transition-colors"
                title="Reiniciar la secuencia desde el colapso (t = 0)"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Repetir</span>
              </button>
            )}
            {onResetToStable && (
              <button
                id="rupture-reset-btn"
                onClick={onResetToStable}
                className="shrink-0 px-2 py-1 rounded-md text-xs bg-slate-800 border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 transition-colors"
                title="Volver al perfil estable (fuera de ruptura)"
              >
                <span>Volver a estable</span>
              </button>
            )}
          </div>
        )}

        {/* Action Controls & PNG Export */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 rounded-lg shadow-lg">
          {/* Lanzar ruptura psicótica (IGS 3× corte, fuera de baremo) */}
          {onLaunchRupture && (
            <button
              id="launch-rupture-btn"
              onClick={onLaunchRupture}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                ruptureVisual !== 'idle'
                  ? 'bg-rose-950 text-rose-200 border border-rose-500 font-semibold ring-1 ring-rose-500/40'
                  : 'text-rose-300 hover:text-white bg-slate-800 border border-rose-900/60 hover:border-rose-600'
              }`}
              title={`Ruptura psicótica fuera de baremo: IGS = ${ruptureThresholdGsi(params.baremoId).toFixed(2)} (3× el corte T=60 de la población elegida) + Wegbreite suficiente (Corolario I: δ ≥ π/6). S, I y Pulsión se eyectan por el orificio (v=π), sale la voz y las cadenas de S e I se reenganchan en un orden nuevo (Corolario II, Umbau) con las cintas cubriendo toda la superficie.`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Ruptura 3×</span>
            </button>
          )}

          {/* Quick Toggle for X-Ray of Icc */}
          {onViewModeChange && (
            <button
              id="quick-toggle-xray-btn"
              onClick={() => {
                if (viewMode === 'xray_icc') {
                  onViewModeChange('standard');
                } else {
                  onViewModeChange('xray_icc');
                  if (onCcOpacityChange && (ccOpacity > 0.45 || ccOpacity < 0.1)) {
                    onCcOpacityChange(0.20);
                  }
                }
              }}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'xray_icc'
                  ? 'bg-cyan-950 text-cyan-200 border border-cyan-400 shadow-sm font-semibold ring-1 ring-cyan-500/40'
                  : 'text-slate-300 hover:text-white bg-slate-800 border border-slate-700'
              }`}
              title="Alternar Rayos X: piel externa de la superficie Icc semitransparente que revela la pared Prcc y las cintas"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{viewMode === 'xray_icc' ? 'Salir Rayos X' : 'Rayos X Icc'}</span>
            </button>
          )}

          {/* Direct Quick Interior View Toggle Button */}
          {onViewModeChange && (
            <button
              id="quick-toggle-interior-btn"
              onClick={() => onViewModeChange(viewMode === 'interior_icc' ? 'standard' : 'interior_icc')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'interior_icc'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white bg-slate-800 border border-slate-700'
              }`}
              title="Alternar entre la vista exterior y el interior de la superficie Icc con las cintas"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>{viewMode === 'interior_icc' ? 'Ver Exterior' : 'Interior'}</span>
            </button>
          )}

          {/* Deformation Animation Controls */}
          <div className="relative flex items-center">
            <button
              id="btn-animate-deformation"
              onClick={handleToggleDeformationAnimation}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                isAnimatingDeformation
                  ? 'bg-amber-500 text-slate-950 border border-amber-300 ring-2 ring-amber-400/40 animate-pulse'
                  : 'bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-700/80 hover:border-amber-500'
              }`}
              title="Animar la transición suave del parámetro 'deformation_factor' desde el toro geométrico estándar (δ=0) hasta el estado deformado psicométrico"
            >
              {isAnimatingDeformation ? (
                <Pause className="w-3.5 h-3.5 text-slate-950 fill-current" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>
                {isAnimatingDeformation
                  ? `Pausar (δ: ${animatedDeformFactor.toFixed(2)})`
                  : `Animar δ (${animatedDeformFactor.toFixed(2)})`}
              </span>
            </button>

            <button
              id="btn-deformation-settings-toggle"
              onClick={() => setShowDeformPanel(!showDeformPanel)}
              className={`ml-0.5 p-1.5 rounded-md border text-xs transition-colors ${
                showDeformPanel
                  ? 'bg-amber-900 text-amber-200 border-amber-600'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
              title="Ajustes de animación: velocidad, modo bucle/único, saltos directos a δ=0 y δ nominal"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {/* Floating Dropdown / Settings Panel for Deformation Animation */}
            {showDeformPanel && (
              <div className="absolute top-full mt-1.5 right-0 bg-slate-900/98 backdrop-blur-md border border-amber-500/60 rounded-xl p-3 shadow-2xl text-xs font-mono text-slate-200 z-50 w-72 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Transición deformation_factor (δ)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-800">
                    δ: {animatedDeformFactor.toFixed(3)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Estándar (δ=0.0)</span>
                    <span>Deformado (δ={targetMaxDeformationRef.current.toFixed(2)})</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 rounded-full transition-all duration-75"
                      style={{
                        width: `${Math.min(100, Math.max(0, (animatedDeformFactor / (targetMaxDeformationRef.current || 0.3)) * 100))}%`
                      }}
                    />
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Modo de Animación:</label>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <button
                      onClick={() => setDeformAnimMode('loop')}
                      className={`py-1 px-2 rounded border flex items-center justify-center gap-1 transition-colors ${
                        deformAnimMode === 'loop'
                          ? 'bg-amber-950 text-amber-200 border-amber-600 font-semibold'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <Repeat className="w-3 h-3" />
                      <span>Bucle Continuo</span>
                    </button>
                    <button
                      onClick={() => setDeformAnimMode('once')}
                      className={`py-1 px-2 rounded border flex items-center justify-center gap-1 transition-colors ${
                        deformAnimMode === 'once'
                          ? 'bg-amber-950 text-amber-200 border-amber-600 font-semibold'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <span>Transición 1x</span>
                    </button>
                  </div>
                </div>

                {/* Speed Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Velocidad de Morfología:</label>
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    {[0.5, 1.0, 2.0].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setDeformAnimSpeed(spd)}
                        className={`py-1 rounded border transition-colors ${
                          deformAnimSpeed === spd
                            ? 'bg-cyan-950 text-cyan-200 border-cyan-500 font-semibold'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {spd}x {spd === 0.5 ? '(Lento)' : spd === 2.0 ? '(Rápido)' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instant Jump & Replay buttons */}
                <div className="pt-1 border-t border-slate-800 flex items-center justify-between gap-1 text-[10px]">
                  <button
                    onClick={handleResetToStandard}
                    className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors text-center"
                    title="Fijar δ = 0 inmediatamente (Toro Estándar puro)"
                  >
                    δ = 0 (Estándar)
                  </button>
                  <button
                    onClick={handleRestartDeformTransition}
                    className="flex-1 py-1 rounded bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-700 transition-colors text-center font-medium"
                    title="Reiniciar morfología suave desde 0 hasta el valor deformado"
                  >
                    0 ➔ δ (Animar)
                  </button>
                  <button
                    onClick={handleSetToDeformed}
                    className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors text-center"
                    title="Fijar δ = nominal (Deformado clínico)"
                  >
                    δ = Nominal
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            id="toggle-rotation-btn"
            onClick={() => setIsRotating(!isRotating)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isRotating
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={isRotating ? 'Pausar rotación' : 'Rotar automáticamente'}
          >
            {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRotating ? 'Auto' : 'Pausa'}</span>
          </button>

          <button
            id="reset-view-btn"
            onClick={handleResetCamera}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
            title="Centrar vista"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          {/* Direct PNG Export Buttons matching the Python method calls */}
          <button
            id="btn-export-standard-png"
            onClick={() => handleExportPng('standard')}
            disabled={isCapturing}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
            title="model.plot_3d_model(save_path='mi_modelo.png')"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>mi_modelo.png</span>
          </button>

          <button
            id="btn-export-deformed-png"
            onClick={() => handleExportPng('deformed')}
            disabled={isCapturing}
            className="px-2.5 py-1.5 bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 rounded-md text-xs font-mono flex items-center gap-1.5 transition-colors border border-amber-700/50"
            title="model.plot_deformed_model(save_path='mi_modelo_deformado.png')"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>mi_modelo_deformado.png</span>
          </button>
        </div>
      </div>

      {/* Live Deformation Morphing HUD Indicator when animation is active */}
      {isAnimatingDeformation && (
        <div className="absolute top-14 left-3.5 pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-amber-500/80 rounded-xl p-2.5 shadow-2xl text-xs font-mono z-30 max-w-xs animate-in fade-in duration-200 space-y-1.5">
          <div className="flex items-center justify-between text-amber-300 font-bold border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Morfología Psicométrica Activa</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-700 text-[10px]">
              δ = {animatedDeformFactor.toFixed(3)}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[9.5px] text-slate-400">
              <span className={animatedDeformFactor < 0.05 ? 'text-cyan-300 font-bold' : ''}>Toro Estándar (δ=0)</span>
              <span className={animatedDeformFactor > (targetMaxDeformationRef.current || 0.3) * 0.95 ? 'text-rose-400 font-bold' : ''}>
                Deformado (δ={(targetMaxDeformationRef.current || 0.3).toFixed(2)})
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 rounded-full transition-all duration-75"
                style={{
                  width: `${Math.min(100, Math.max(0, (animatedDeformFactor / (targetMaxDeformationRef.current || 0.3)) * 100))}%`
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[9.5px] text-slate-400 pt-0.5 border-t border-slate-800/80">
            <span>Modo: <span className="text-cyan-300">{deformAnimMode === 'loop' ? 'Bucle Continuo' : 'Paso Único'}</span></span>
            <span>Velocidad: <span className="text-amber-300">{deformAnimSpeed}x</span></span>
          </div>
        </div>
      )}

      {/* Fluid ViewMode Morphing HUD Badge (active during transition between Standard, X-Ray, etc.) */}
      {isTransitioningViewMode && (
        <div className="absolute top-14 right-3.5 pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-cyan-500/70 rounded-lg px-3 py-1.5 shadow-xl text-xs font-mono z-30 flex items-center gap-2 animate-in fade-in duration-150">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span className="text-cyan-200 font-semibold">Transición Fluida Topológica...</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            {displayViewMode === 'xray_icc' ? 'Rayos X' : displayViewMode === 'interior_icc' ? 'Interior Icc' : displayViewMode === 'standard' ? 'Estándar' : 'Deformado'}
          </span>
        </div>
      )}

      {/* Bottom Floating Lacanian & Differential Stress Legend */}
      <div className="absolute bottom-3.5 left-3.5 pointer-events-none flex flex-col gap-2">
        {colorMap === 'differential_stress' && (
          <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-fuchsia-800/80 rounded-xl p-3 text-xs font-mono text-slate-300 shadow-2xl max-w-sm space-y-2">
            <div className="flex items-center justify-between font-semibold text-fuchsia-300 border-b border-fuchsia-950 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Tensión Topológica Diferencial (ΔE)</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800">
                E_def vs E_0
              </span>
            </div>

            {/* Gradient Bar */}
            <div className="space-y-1">
              <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-blue-900 via-cyan-400 via-amber-400 via-fuchsia-500 to-rose-400 shadow-inner" />
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>Equilibrio (0.0)</span>
                <span>Moderada</span>
                <span>Elevada</span>
                <span className="text-fuchsia-300 font-bold">Cúspide / Singular (1.0)</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Compara la densidad energética de la superficie del toro estándar vs. deformado. Resalta zonas de alta cizalladura concentradas en la singularidad <span className="text-cyan-300">v=π</span>.
            </p>
          </div>
        )}

        {viewMode === 'xray_icc' && (
          <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-cyan-500/70 rounded-xl p-3 text-xs font-mono text-slate-300 shadow-2xl max-w-sm space-y-2">
            <div className="flex items-center justify-between font-semibold text-cyan-300 border-b border-cyan-900/60 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Rayos X: piel translúcida</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold">
                Superficie Icc
              </span>
            </div>

            <p className="text-[10px] text-slate-300 leading-relaxed">
              La piel externa de la <span className="text-cyan-300 font-semibold">superficie Icc</span> se atenúa mediante transparencia dinámica (<span className="text-cyan-400 font-bold">{(ccOpacity * 100).toFixed(0)}%</span>): quedan visibles la cara interna de la pared —la <span className="text-fuchsia-300 font-semibold">censura</span> Icc/Prcc— y las cintas <span className="text-red-400 font-bold">S</span>, <span className="text-emerald-400 font-bold">I</span>, el <span className="text-amber-300 font-bold">Hilo Pulsional</span> y el síntoma <span className="text-blue-400 font-bold">Σ</span>. Afuera, el campo <span className="text-teal-300 font-semibold">Prcc</span> entra por la voz; la <span className="text-cyan-300 font-semibold">Cc</span> es un umbral dentro de ese campo, no un lugar.
            </p>

            <div className="grid grid-cols-2 gap-1.5 text-[9.5px] bg-slate-950/80 p-2 rounded-lg border border-slate-800">
              <div className="text-slate-300">
                <span className="text-amber-400 font-bold">Icc:</span> toda la superficie
              </div>
              <div className="text-slate-300">
                <span className="text-emerald-400 font-bold">Prcc:</span> campo que entra por la voz, sin borde
              </div>
              <div className="text-slate-300">
                <span className="text-cyan-400 font-bold">Cc:</span> umbral de sobreinvestidura, no un lugar
              </div>
              <div className="text-slate-300">
                <span className="text-fuchsia-400 font-bold">Singularidad:</span> v = π (la voz · AXIOMA)
              </div>
              <div className="text-slate-300">
                <span className="text-rose-400 font-bold">Marcas de fantasía:</span> {lacanian.fantasyMarks.length} (§8: una por trauma)
              </div>
            </div>
          </div>
        )}

        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 shadow-2xl max-w-sm space-y-2">
          <div className="flex items-center justify-between font-semibold text-slate-200 border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cintas sobre la superficie Icc</span>
            </span>
            <span className="text-[10px] text-amber-400 font-semibold">Superficie = Icc</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-1.5 rounded-sm bg-red-500 shadow-sm" />
              <span>S: Significante</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-1.5 rounded-sm bg-emerald-500 shadow-sm" />
              <span>I: Imagen Cuerpo</span>
            </div>
            <div className={`flex items-center gap-1.5 ${showPulsion ? 'text-amber-300 font-semibold' : 'text-slate-500 line-through'}`}>
              <span className={`w-2.5 h-1.5 rounded-sm ${showPulsion ? 'bg-amber-400 shadow-sm animate-pulse' : 'bg-slate-700'}`} />
              <span>Hilo pulsional (borde de I)</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-1.5 rounded-sm bg-blue-500 shadow-sm" />
              <span>Σ: Síntoma</span>
            </div>
          </div>

          {showPulsion && (
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-2 space-y-1">
              <div className="flex items-center justify-between text-amber-300 font-semibold text-[10.5px]">
                <span className="flex items-center gap-1">
                  <Waves className="w-3.5 h-3.5 text-amber-400" />
                  <span>Campo vectorial Trieb (Drang)</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-700/60">
                  Superficie = Icc
                </span>
              </div>
              <p className="text-[9.5px] text-slate-300 leading-tight">
                Vectores de flujo direccional en el interior <span className="text-amber-400 font-mono">v ∈ [π/2, 3π/2]</span> convergiendo helicoidalmente hacia la cúspide <span className="text-cyan-300 font-mono">v=π</span> (la voz), pegados al borde de <span className="text-emerald-400 font-mono">I</span> (imagen del cuerpo) — AXIOMA. Por p, de doble sentido, entra lo oído: el campo <span className="text-teal-300 font-mono">Prcc</span>.
              </p>
              <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
                <span>Adherencia al borde de I: <span className="text-amber-300 font-bold">{(lacanian.pulsionAttachmentStrength * 100).toFixed(0)}%</span></span>
                <span>Empuje: <span className="text-rose-300 font-medium">Drang (constante)</span></span>
              </div>
            </div>
          )}

          <div className="border-t border-slate-800/80 pt-1.5 text-[10px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-rose-400 font-medium">Marcas de fantasía ({lacanian.fantasyMarks.length}):</span>
              <span className="text-rose-300 font-bold">(π, 3π/4) — pared</span>
            </div>
            <p className="text-[9.5px] text-slate-300 leading-tight">
              Marcas Icc de trauma sobre la cara interna de la pared: la angustia surge por proximidad (aproximación: señal; pasaje: situación traumática) — AXIOMA.
            </p>
            <div className="flex justify-between text-slate-400">
              <span>Adherencia al borde de I:</span>
              <span className="text-amber-300 font-bold">{(lacanian.pulsionAttachmentStrength * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Zona Ruptura (vecindad del foco, A ≥ A_max − A_cr):</span>
              <span className="text-amber-400 font-bold">{lacanian.ruptureAreaPercent.toFixed(1)}% del área</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interaction & Consciente/Inconsciente hint */}
      <div className="absolute bottom-3.5 right-3.5 pointer-events-none flex flex-col items-end gap-1.5">
        {onCcOpacityChange && (
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono shadow-xl">
            <span className="text-slate-400 text-[11px]">
              {viewMode === 'xray_icc' ? 'Transparencia de la piel:' : 'Opacidad de la piel:'}
            </span>
            <input
              type="range"
              min="0.04"
              max="1.0"
              step="0.02"
              value={ccOpacity}
              onChange={(e) => onCcOpacityChange(parseFloat(e.target.value))}
              className="w-20 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              title="Ajusta la opacidad de la cara externa de la superficie Icc para revelar la cara interna de la pared"
            />
            <span className="text-cyan-300 font-bold w-8 text-right">{(ccOpacity * 100).toFixed(0)}%</span>
          </div>
        )}

        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 px-2.5 py-1 rounded text-[10px] text-slate-400 font-mono">
          Superficie = Icc · pared = censura · Prcc = campo que entra por la voz · Cc = umbral | Arrastrar: rotar | Rueda: zoom
        </div>
      </div>
    </div>
  );
};
