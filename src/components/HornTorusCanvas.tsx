import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ModelParams, SCL90RData, ViewMode, ColorMapMode } from '../types';
import { generateHornTorusGeometry } from '../utils/hornTorusMath';
import { Camera, RotateCcw, Eye, Play, Pause, Scissors, Layers, Sparkles, Download, Info } from 'lucide-react';

interface HornTorusCanvasProps {
  sclData: SCL90RData;
  params: ModelParams;
  viewMode: ViewMode;
  colorMap: ColorMapMode;
  showWireframe: boolean;
  showNormals: boolean;
  showVortexFlow: boolean;
  onCapturePng: (type: 'standard' | 'deformed', dataUrl: string) => void;
}

export const HornTorusCanvas: React.FC<HornTorusCanvasProps> = ({
  sclData,
  params,
  viewMode,
  colorMap,
  showWireframe,
  showNormals,
  showVortexFlow,
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
  const wireframeStandardRef = useRef<THREE.LineSegments | null>(null);
  const wireframeDeformedRef = useRef<THREE.LineSegments | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const clippingPlaneRef = useRef<THREE.Plane | null>(null);

  // Interaction state
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [activeCrossSection, setActiveCrossSection] = useState<boolean>(viewMode === 'cross_section');
  const [pointInfo, setPointInfo] = useState<{ x: number; y: number; z: number; stress?: number } | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Orbit rotation angles
  const rotationAngles = useRef({ theta: 0.5, phi: 0.6, radius: 8.5 });
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  // Update clipping plane when viewMode changes
  useEffect(() => {
    setActiveCrossSection(viewMode === 'cross_section');
  }, [viewMode]);

  // Setup Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d14);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // Renderer with high quality & preserved buffer for screenshot exports
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Clipping plane along Y=0 to expose the central self-touching cusp point
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    clippingPlaneRef.current = clipPlane;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(10, 15, 12);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x60a5fa, 0.8);
    dirLight2.position.set(-10, -10, -8);
    scene.add(dirLight2);

    const pointLightCenter = new THREE.PointLight(0xf59e0b, 1.5, 6);
    pointLightCenter.position.set(0, 0, 0); // illuminates the inner cusp
    scene.add(pointLightCenter);

    // Subtle helper grid floor
    const grid = new THREE.GridHelper(14, 28, 0x1e293b, 0x0f172a);
    grid.position.y = -3.2;
    scene.add(grid);

    // Dynamic Horn Torus Particle Flow (Vortex streamlines through the cusp)
    const particleCount = 1800;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeed = new Float32Array(particleCount);
    const particleAngles = new Float32Array(particleCount * 2); // theta, phi

    for (let i = 0; i < particleCount; i++) {
      particleAngles[i * 2] = (Math.random() * 2 - 1) * Math.PI; // theta
      particleAngles[i * 2 + 1] = Math.random() * 2 * Math.PI; // phi
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

    // Window Resize Observer
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

      // Auto rotation
      if (isRotating) {
        rotationAngles.current.phi += delta * 0.35;
        updateCameraPosition();
      }

      // Update particle stream circulating along the Horn Torus
      if (particlesRef.current && showVortexFlow) {
        particlesRef.current.visible = true;
        const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const positionsArr = posAttr.array as Float32Array;
        const R = 2.0 * (params.a_scale / 0.1);

        for (let i = 0; i < particleCount; i++) {
          let theta = particleAngles[i * 2];
          let phi = particleAngles[i * 2 + 1];
          const spd = particleSpeed[i];

          // Geodesic flow: particles spiral through the inner cusp (theta -> pi) and outward around equator
          theta += spd * 1.5;
          phi += spd * 0.8;
          if (theta > Math.PI) theta = -Math.PI;
          if (phi > Math.PI * 2) phi = 0;

          particleAngles[i * 2] = theta;
          particleAngles[i * 2 + 1] = phi;

          const dist = R * (1 + Math.cos(theta));
          positionsArr[i * 3] = dist * Math.cos(phi);
          positionsArr[i * 3 + 1] = dist * Math.sin(phi);
          positionsArr[i * 3 + 2] = R * Math.sin(theta);
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

  // Update camera coordinates from spherical angles
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

  // Re-generate Horn Torus Geometries when parameters, SCL-90-R, or view settings change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old meshes
    if (standardMeshRef.current) scene.remove(standardMeshRef.current);
    if (deformedMeshRef.current) scene.remove(deformedMeshRef.current);
    if (wireframeStandardRef.current) scene.remove(wireframeStandardRef.current);
    if (wireframeDeformedRef.current) scene.remove(wireframeDeformedRef.current);

    const isCut = activeCrossSection || viewMode === 'cross_section';
    const clippingPlanes = isCut && clippingPlaneRef.current ? [clippingPlaneRef.current] : [];

    // 1. Standard Horn Torus
    const stdData = generateHornTorusGeometry(params, sclData, false);
    const stdGeo = new THREE.BufferGeometry();
    stdGeo.setAttribute('position', new THREE.BufferAttribute(stdData.positions, 3));
    stdGeo.setAttribute('normal', new THREE.BufferAttribute(stdData.normals, 3));
    stdGeo.setAttribute('color', new THREE.BufferAttribute(stdData.colors, 3));
    stdGeo.setAttribute('uv', new THREE.BufferAttribute(stdData.uvs, 2));
    stdGeo.setIndex(new THREE.BufferAttribute(stdData.indices, 1));

    const stdMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      metalness: 0.15,
      roughness: 0.35,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      side: THREE.DoubleSide,
      clippingPlanes,
      clipShadows: true,
      transparent: viewMode === 'comparison',
      opacity: viewMode === 'comparison' ? 0.35 : 1.0,
      wireframe: false
    });

    const stdMesh = new THREE.Mesh(stdGeo, stdMat);
    stdMesh.castShadow = true;
    stdMesh.receiveShadow = true;
    standardMeshRef.current = stdMesh;

    // 2. Deformed Horn Torus
    const defData = generateHornTorusGeometry(params, sclData, true);
    const defGeo = new THREE.BufferGeometry();
    defGeo.setAttribute('position', new THREE.BufferAttribute(defData.positions, 3));
    defGeo.setAttribute('normal', new THREE.BufferAttribute(defData.normals, 3));
    defGeo.setAttribute('color', new THREE.BufferAttribute(defData.colors, 3));
    defGeo.setAttribute('uv', new THREE.BufferAttribute(defData.uvs, 2));
    defGeo.setIndex(new THREE.BufferAttribute(defData.indices, 1));

    const defMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      metalness: 0.25,
      roughness: 0.30,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
      side: THREE.DoubleSide,
      clippingPlanes,
      clipShadows: true,
      wireframe: false
    });

    const defMesh = new THREE.Mesh(defGeo, defMat);
    defMesh.castShadow = true;
    defMesh.receiveShadow = true;
    deformedMeshRef.current = defMesh;

    // 3. Wireframe Overlays
    const wireGeo = new THREE.WireframeGeometry(defGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.22,
      clippingPlanes
    });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    wireframeDeformedRef.current = wireMesh;

    // Add to scene according to view mode
    if (viewMode === 'standard') {
      scene.add(stdMesh);
      if (showWireframe) {
        const stdWire = new THREE.LineSegments(
          new THREE.WireframeGeometry(stdGeo),
          new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25, clippingPlanes })
        );
        wireframeStandardRef.current = stdWire;
        scene.add(stdWire);
      }
    } else if (viewMode === 'deformed' || viewMode === 'cross_section') {
      scene.add(defMesh);
      if (showWireframe) scene.add(wireMesh);
    } else if (viewMode === 'comparison') {
      scene.add(stdMesh);
      scene.add(defMesh);
      if (showWireframe) scene.add(wireMesh);
    }
  }, [sclData, params, viewMode, showWireframe, activeCrossSection, colorMap]);

  // Mouse / Touch Orbit Controls
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

  // Reset Camera View
  const handleResetCamera = () => {
    rotationAngles.current = { theta: 0.65, phi: 0.75, radius: 8.5 };
    updateCameraPosition();
  };

  // Capture PNG function mirroring model.plot_3d_model and model.plot_deformed_model
  const handleExportPng = (type: 'standard' | 'deformed') => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    setIsCapturing(true);

    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;

    // Temporarily configure visibility for exact mode
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

    // Restore visibility
    if (standardMeshRef.current && prevStdVis !== undefined) standardMeshRef.current.visible = prevStdVis;
    if (deformedMeshRef.current && prevDefVis !== undefined) deformedMeshRef.current.visible = prevDefVis;
    renderer.render(scene, camera);

    // Trigger download
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

  return (
    <div className="relative w-full h-full min-h-[480px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none">
      {/* 3D WebGL Canvas Viewport */}
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
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Manifold Identity Badge */}
        <div className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg text-xs shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono font-semibold text-slate-100">
            {viewMode === 'standard' ? 'Horn Torus [R = r]' : 'Deformed ICC Horn Torus'}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-cyan-300 font-mono">
            a_scale={params.a_scale.toFixed(2)}
          </span>
          {viewMode !== 'standard' && (
            <span className="text-amber-300 font-mono">
              δ={params.deformation_factor.toFixed(2)}
            </span>
          )}
        </div>

        {/* Quick Camera & Export Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 rounded-lg shadow-lg">
          <button
            id="toggle-rotation-btn"
            onClick={() => setIsRotating(!isRotating)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isRotating ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50' : 'text-slate-400 hover:text-slate-200'
            }`}
            title={isRotating ? 'Pausar rotación' : 'Reanudar rotación automática'}
          >
            {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRotating ? 'Auto' : 'Fijo'}</span>
          </button>

          <button
            id="reset-view-btn"
            onClick={handleResetCamera}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
            title="Centrar vista"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-1" />

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

      {/* Bottom Floating Visual Diagnostics Legend */}
      <div className="absolute bottom-4 left-4 pointer-events-none flex flex-col gap-2">
        <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 shadow-xl max-w-xs space-y-1">
          <div className="flex items-center justify-between font-semibold text-slate-200 border-b border-slate-800 pb-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Singularidad Cúspide Horn</span>
            </span>
            <span className="text-cyan-400">θ = ±π → (0, 0, 0)</span>
          </div>
          <p className="text-slate-400 leading-tight text-[10px]">
            El radio mayor R coincide exactamente con el radio menor r (R = r). El conducto interior se cierra tangencialmente en un punto único.
          </p>
          <div className="flex items-center justify-between pt-1 text-[10px]">
            <span className="text-slate-400">Estrés Psicométrico:</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-blue-500" title="Bajo" />
              <span className="w-2 h-2 rounded-sm bg-emerald-500" title="Moderado" />
              <span className="w-2 h-2 rounded-sm bg-amber-500" title="Elevado" />
              <span className="w-2 h-2 rounded-sm bg-rose-600" title="Severo / Psicótico" />
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Interaction Guide Hint */}
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <div className="bg-slate-900/75 backdrop-blur-sm border border-slate-800/80 px-2.5 py-1 rounded text-[10px] text-slate-400 font-mono">
          Arrastrar: rotar | Rueda: zoom | Clic derecho: paneo
        </div>
      </div>
    </div>
  );
};
