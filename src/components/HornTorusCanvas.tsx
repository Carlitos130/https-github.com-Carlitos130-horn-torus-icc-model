import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ModelParams, SCL90RData, ViewMode, ColorMapMode } from '../types';
import { generateHornTorusGeometry, getLacanianCurves, calculateLacanianParameters } from '../utils/hornTorusMath';
import { RotateCcw, Play, Pause, Download, Sparkles, AlertCircle, CircleDot } from 'lucide-react';

interface HornTorusCanvasProps {
  sclData: SCL90RData;
  params: ModelParams;
  viewMode: ViewMode;
  colorMap: ColorMapMode;
  showWireframe: boolean;
  showVortexFlow: boolean;
  showCurveS: boolean;
  showCurveI: boolean;
  showCurveSigma: boolean;
  showFantasyPoint: boolean;
  onCapturePng: (type: 'standard' | 'deformed', dataUrl: string) => void;
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
  showCurveSigma,
  showFantasyPoint,
  onCapturePng
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Mesh refs
  const standardMeshRef = useRef<THREE.Mesh | null>(null);
  const deformedMeshRef = useRef<THREE.Mesh | null>(null);
  const wireframeRef = useRef<THREE.LineSegments | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const clippingPlaneRef = useRef<THREE.Plane | null>(null);

  // Lacanian curves & Fantasy point refs
  const curveSRef = useRef<THREE.Line | null>(null);
  const curveIRef = useRef<THREE.Line | null>(null);
  const curveSigmaRef = useRef<THREE.Line | null>(null);
  const fantasyMeshRef = useRef<THREE.Group | null>(null);

  // Interaction state
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Camera spherical angles
  const rotationAngles = useRef({ theta: 0.65, phi: 0.75, radius: 9.0 });
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  // Scene initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
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

      if (isRotating) {
        rotationAngles.current.phi += delta * 0.35;
        updateCameraPosition();
      }

      // Update particle vortex flow
      if (particlesRef.current && showVortexFlow) {
        particlesRef.current.visible = true;
        const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const positionsArr = posAttr.array as Float32Array;
        const lac = calculateLacanianParameters(sclData, params);
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

  // Re-build Torus Meshes, Lacanian Curves (S, I, Sigma) & Fantasy Beacon
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean up previous meshes
    if (standardMeshRef.current) scene.remove(standardMeshRef.current);
    if (deformedMeshRef.current) scene.remove(deformedMeshRef.current);
    if (wireframeRef.current) scene.remove(wireframeRef.current);
    if (curveSRef.current) scene.remove(curveSRef.current);
    if (curveIRef.current) scene.remove(curveIRef.current);
    if (curveSigmaRef.current) scene.remove(curveSigmaRef.current);
    if (fantasyMeshRef.current) scene.remove(fantasyMeshRef.current);

    const isCut = viewMode === 'cross_section';
    const clippingPlanes = isCut && clippingPlaneRef.current ? [clippingPlaneRef.current] : [];

    // 1. Standard Horn Torus Geometry
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
      transparent: viewMode === 'comparison',
      opacity: viewMode === 'comparison' ? 0.35 : 0.92,
      wireframe: false
    });
    const stdMesh = new THREE.Mesh(stdGeo, stdMat);
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
      wireframe: false
    });
    const defMesh = new THREE.Mesh(defGeo, defMat);
    deformedMeshRef.current = defMesh;

    // 3. Wireframe Overlay
    if (showWireframe) {
      const targetGeo = viewMode === 'standard' ? stdGeo : defGeo;
      const wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(targetGeo),
        new THREE.LineBasicMaterial({
          color: 0x94a3b8,
          transparent: true,
          opacity: 0.25,
          clippingPlanes
        })
      );
      wireframeRef.current = wire;
      scene.add(wire);
    }

    // Add surface to scene
    if (viewMode === 'standard') {
      scene.add(stdMesh);
    } else if (viewMode === 'deformed' || viewMode === 'cross_section') {
      scene.add(defMesh);
    } else if (viewMode === 'comparison') {
      scene.add(stdMesh);
      scene.add(defMesh);
    }

    // 4. Lacanian Curves S, I, Sigma
    const lacanian = calculateLacanianParameters(sclData, params);
    const { curveS, curveI, curveSigma, fantasy3D } = getLacanianCurves(lacanian);

    // Curva S (Significante) - Red
    if (showCurveS) {
      const ptsS = curveS.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
      const geoS = new THREE.BufferGeometry().setFromPoints(ptsS);
      const matS = new THREE.LineBasicMaterial({
        color: 0xef4444, // Red
        linewidth: 3,
        clippingPlanes
      });
      const lineS = new THREE.Line(geoS, matS);
      curveSRef.current = lineS;
      scene.add(lineS);
    }

    // Curva I (Imagen del cuerpo) - Green
    if (showCurveI) {
      const ptsI = curveI.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
      const geoI = new THREE.BufferGeometry().setFromPoints(ptsI);
      const matI = new THREE.LineBasicMaterial({
        color: 0x10b981, // Green
        linewidth: 3,
        clippingPlanes
      });
      const lineI = new THREE.Line(geoI, matI);
      curveIRef.current = lineI;
      scene.add(lineI);
    }

    // Curva Sigma (Síntoma) - Blue
    if (showCurveSigma) {
      const ptsSigma = curveSigma.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
      const geoSigma = new THREE.BufferGeometry().setFromPoints(ptsSigma);
      const matSigma = new THREE.LineBasicMaterial({
        color: 0x3b82f6, // Blue
        linewidth: 3,
        clippingPlanes
      });
      const lineSigma = new THREE.Line(geoSigma, matSigma);
      curveSigmaRef.current = lineSigma;
      scene.add(lineSigma);
    }

    // 5. Fantasy Point (Punto de Angustia Máxima) - Magenta / Beacon
    if (showFantasyPoint) {
      const fantasyGroup = new THREE.Group();

      // Main glowing sphere
      const sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xe11d48,
        emissiveIntensity: 0.8,
        roughness: 0.2
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(fantasy3D[0], fantasy3D[1], fantasy3D[2]);
      fantasyGroup.add(sphere);

      // Outer pulsating ring
      const ringGeo = new THREE.RingGeometry(0.18, 0.24, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfb7185,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(fantasy3D[0], fantasy3D[1], fantasy3D[2]);
      ring.lookAt(0, 0, 0);
      fantasyGroup.add(ring);

      fantasyMeshRef.current = fantasyGroup;
      scene.add(fantasyGroup);
    }
  }, [
    sclData,
    params,
    viewMode,
    colorMap,
    showWireframe,
    showCurveS,
    showCurveI,
    showCurveSigma,
    showFantasyPoint
  ]);

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
    rotationAngles.current.radius = Math.max(3.5, Math.min(18.0, newRadius));
    updateCameraPosition();
  };

  const handleResetCamera = () => {
    rotationAngles.current = { theta: 0.65, phi: 0.75, radius: 9.0 };
    updateCameraPosition();
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
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono font-semibold text-slate-100">
            {viewMode === 'standard' ? 'Horn Torus Icc' : 'Horn Torus Deformado'}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-300 font-mono">
            a={(params.a_scale * sclData["GSI"]).toFixed(4)}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-300 font-mono">
            A_cr=π/4
          </span>
        </div>

        {/* Action Controls & PNG Export */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 rounded-lg shadow-lg">
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

      {/* Bottom Floating Lacanian Legend */}
      <div className="absolute bottom-3.5 left-3.5 pointer-events-none flex flex-col gap-2">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 shadow-2xl max-w-sm space-y-2">
          <div className="flex items-center justify-between font-semibold text-slate-200 border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Estructura del Icc (Inconsciente)</span>
            </span>
            <span className="text-[10px] text-cyan-400">R = r = a</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-1 rounded-full bg-red-500" />
              <span>S: Significante</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-1 rounded-full bg-emerald-500" />
              <span>I: Imagen Cuerpo</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-1 rounded-full bg-blue-500" />
              <span>Σ: Síntoma</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Fantasía (Angustia)</span>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-1.5 text-[10px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Punto Fantasía (u, v):</span>
              <span className="text-rose-300 font-bold">(π, π/2)</span>
            </div>
            <div className="flex justify-between">
              <span>Zona Ruptura (A ≤ A_cr):</span>
              <span className="text-amber-400 font-bold">{lacanian.ruptureAreaPercent.toFixed(1)}% del Manifold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interaction Hint */}
      <div className="absolute bottom-3.5 right-3.5 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 px-2.5 py-1 rounded text-[10px] text-slate-400 font-mono">
          Arrastrar: rotar | Rueda: zoom | Clic derecho: paneo
        </div>
      </div>
    </div>
  );
};
