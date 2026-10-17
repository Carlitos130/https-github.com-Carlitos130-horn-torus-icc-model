/**
 * Tests del modelo geométrico — familia de toros r/R, caso límite horn torus
 * (r = R, el agujero se cierra en el punto de autotangencia p).
 *
 * Qué protegen: las invariantes topológicas y geométricas que el manual y la
 * tesis afirman como verificables — cúspide que colapsa en UN punto, χ y rango
 * de H1 por régimen (0/2 en el miembro suave, 1/1 en el límite), área y volumen
 * exactos, curvatura gaussiana con signo por cara, y ausencia de NaN en todo el
 * pipeline de malla / curvatura / espectro.
 *
 * No comparan contra números "clínicos": comparan contra fórmulas cerradas de la
 * superficie y contra la estructura que el visor consume.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  CLINICAL_PRESETS,
  DEFAULT_SCL90R_DATA,
  MAX_ANGUSTIA_DISTANCE,
  SCL90R_TOTAL_ITEMS,
  calculateAngustia,
  calculateLacanianParameters,
  computePointGaussianCurvature,
  computeSpectralSingularityAnalysis,
  computeTopologicalMetrics,
  generateHornTorusGeometry,
  pstGeom,
} from '../src/utils/hornTorusMath';
import type { ModelParams, SCL90RData } from '../src/types';

/** Parámetros default del visor (App.tsx), con grilla chica para que los tests vuelen.
 *  a_scale=0.1, u_scale=2π, v_scale=π, A_cr=π/4, δ=0.3, r/R=1 (horn torus). */
const params = (over: Partial<ModelParams> = {}): ModelParams => ({
  a_scale: 0.1,
  u_scale: 2 * Math.PI,
  v_scale: Math.PI,
  deformation_factor: 0.3,
  gridResolution: 16,
  a_critical: Math.PI / 4,
  rOverR: 1,
  fantasyMarkCount: 1,
  baremoId: 'm_adultos',
  wegbreiteAplicada: false,
  sigmaPantalla: false,
  configAxioma2: 'a',
  ...over,
});

const data = (over: Partial<SCL90RData> = {}): SCL90RData => ({ ...DEFAULT_SCL90R_DATA, ...over });

const close = (actual: number, expected: number, tol = 1e-9, msg?: string) =>
  assert.ok(Math.abs(actual - expected) <= tol, msg ?? `esperado ${expected}, fue ${actual}`);

// R = R_visual = a_scale · GSI · 25 = 0.1 · 0.85 · 25
const R_VISUAL = 0.1 * 0.85 * 25;
const R_ANGUSTIA_MAX = Math.hypot(Math.PI, Math.PI);

describe('Parámetros lacanianos · radios de la familia', () => {
  it('en el límite horn torus r = R = a_scale·GSI', () => {
    const lac = calculateLacanianParameters(data(), params());
    close(lac.R, lac.a);
    close(lac.r, lac.a);
    close(lac.a, 0.1 * DEFAULT_SCL90R_DATA['GSI']);
    assert.equal(lac.rOverR, 1);
  });

  it('en el miembro suave r = (r/R)·R', () => {
    const lac = calculateLacanianParameters(data(), params({ rOverR: 0.6 }));
    close(lac.r, 0.6 * lac.R);
    assert.equal(lac.rOverR, 0.6);
  });

  it('r/R inválido cae al horn torus en vez de romper la geometría', () => {
    for (const invalido of [0, -1, 2, Number.NaN, Number.POSITIVE_INFINITY]) {
      const lac = calculateLacanianParameters(data(), params({ rOverR: invalido }));
      assert.equal(lac.rOverR, 1, `rOverR=${invalido} debería caer a 1`);
      assert.ok(Number.isFinite(lac.r));
    }
  });
});

describe('Parámetros lacanianos · S, I, Σ, pulsión y marcas', () => {
  it('u y v de cada cinta salen de las dimensiones declaradas', () => {
    const d = data();
    const lac = calculateLacanianParameters(d, params());

    close(lac.u_S, (2 * Math.PI * (d['Ansiedad'] + d['Obsesión-Compulsión'])) / 9);
    close(lac.u_I, (2 * Math.PI * (d['Somatización'] + d['Sensibilidad Interpersonal'])) / 9);
    close(lac.u_Sigma, (2 * Math.PI * (d['Psicoticismo'] + d['Hostilidad'])) / 9);
    close(lac.v_S, Math.PI * (1 + d['PSDI']));
    close(lac.v_I, Math.PI * (1 + pstGeom(d['PST'])));
  });

  it('el hilo pulsional queda pegado al borde de I', () => {
    const lac = calculateLacanianParameters(data(), params());
    assert.equal(lac.u_Pulsion, lac.u_I);
    assert.equal(lac.v_Pulsion, lac.v_I);
    assert.ok(lac.pulsionAttachmentStrength >= 0.3 && lac.pulsionAttachmentStrength <= 1.0);
  });

  it('la marca de fantasía principal está en (π, 3π/4), lejos del orificio', () => {
    const lac = calculateLacanianParameters(data(), params());
    assert.equal(lac.fantasyMarks.length, 1);
    assert.deepEqual(lac.fantasyMarks[0], { u: Math.PI, v: (3 * Math.PI) / 4 });
    // No está en la cúspide v = π (el orificio): la angustia ocurre por proximidad.
    assert.ok(Math.abs(lac.fantasyMarks[0].v - Math.PI) > 0.5);
  });

  it('fantasyMarkCount se acota a [1, 12]', () => {
    assert.equal(calculateLacanianParameters(data(), params({ fantasyMarkCount: 0 })).fantasyMarks.length, 1);
    assert.equal(calculateLacanianParameters(data(), params({ fantasyMarkCount: 99 })).fantasyMarks.length, 12);
    assert.equal(calculateLacanianParameters(data(), params({ fantasyMarkCount: 4 })).fantasyMarks.length, 4);
  });

  it('todas las marcas caen sobre la superficie del toro', () => {
    const lac = calculateLacanianParameters(data(), params({ fantasyMarkCount: 5 }));
    lac.fantasyMarks.forEach(({ u, v }, i) => {
      const [x, y, z] = lac.fantasyMarks3D[i];
      // x = (R + r·cos v)·cos u · y = (R + r·cos v)·sin u · z = r·sin v
      close(Math.hypot(x, y), Math.abs(lac.R + lac.r * Math.cos(v)), 1e-9, `marca ${i}: radio`);
      close(z, lac.r * Math.sin(v), 1e-9, `marca ${i}: z`);
      close(Math.hypot(Math.hypot(x, y) - lac.R, z), lac.r, 1e-9, `marca ${i}: distancia al eje del tubo`);
      void u;
    });
  });

  it('la zona de angustia y el conteo de rupturas son finitos y en rango', () => {
    const lac = calculateLacanianParameters(data(), params());
    assert.ok(Number.isFinite(lac.ruptureCount));
    assert.ok(lac.ruptureAreaPercent >= 0 && lac.ruptureAreaPercent <= 100);
  });
});

describe('Angustia A(u, v) · máximo sobre las marcas, cero lejos', () => {
  const marca = { u: Math.PI, v: (3 * Math.PI) / 4 };

  it('A = A_max en la marca y A_max = π√2', () => {
    close(MAX_ANGUSTIA_DISTANCE, R_ANGUSTIA_MAX);
    close(calculateAngustia(marca.u, marca.v, [marca]), MAX_ANGUSTIA_DISTANCE);
  });

  it('decrece al alejarse de la marca', () => {
    const d1 = calculateAngustia(marca.u, marca.v + 0.5, [marca]);
    const d2 = calculateAngustia(marca.u, marca.v + 1.0, [marca]);
    const d3 = calculateAngustia(marca.u, marca.v + 2.0, [marca]);
    assert.ok(d1 > d2 && d2 > d3 && d3 > 0, `no decrece: ${d1}, ${d2}, ${d3}`);
    // A(m) = A_max − d_per: distancia v pura de 1.0 → A = A_max − 1
    close(d2, MAX_ANGUSTIA_DISTANCE - 1.0);
  });

  it('se anula en el punto antípoda (d_per = A_max)', () => {
    const antípoda = { u: 0, v: marca.v + Math.PI };
    assert.ok(calculateAngustia(antípoda.u, antípoda.v, [marca]) < 1e-9);
  });

  it('con varias marcas toma el máximo de las vecindades', () => {
    const segunda = { u: 0, v: 0 };
    const enPrimera = calculateAngustia(marca.u, marca.v, [marca, segunda]);
    const enSegunda = calculateAngustia(segunda.u, segunda.v, [marca, segunda]);
    assert.ok(enPrimera >= calculateAngustia(marca.u, marca.v, [segunda]));
    close(enSegunda, MAX_ANGUSTIA_DISTANCE);
  });
});

describe('Malla del horn torus · la cúspide colapsa en UN punto', () => {
  const geo = generateHornTorusGeometry(params(), data(), false);
  const nVerts = geo.positions.length / 3;
  const nU = params().gridResolution;

  it('genera (N+1)² vértices y 2·N² triángulos', () => {
    assert.equal(nVerts, (nU + 1) * (nU + 1));
    assert.equal(geo.indices.length, nU * nU * 2 * 3);
    assert.equal(geo.indices.length % 3, 0);
    assert.equal(geo.prccIndices.length + geo.outerFaceIndices.length, geo.indices.length);
  });

  it('todos los índices apuntan a vértices existentes', () => {
    for (const idx of geo.indices) assert.ok(idx >= 0 && idx < nVerts, `índice ${idx} fuera de rango`);
  });

  it('posiciones y normales son finitas y las normales unitarias', () => {
    for (let i = 0; i < geo.positions.length; i++) assert.ok(Number.isFinite(geo.positions[i]), `posición ${i} no finita`);
    for (let i = 0; i < geo.normals.length; i += 3) {
      const len = Math.hypot(geo.normals[i], geo.normals[i + 1], geo.normals[i + 2]);
      close(len, 1, 1e-5, `normal no unitaria en ${i / 3}`);
    }
  });

  it('exactamente N+1 vértices caen en el origen (el anillo v=π colapsado)', () => {
    const enCuspide: number[] = [];
    for (let i = 0; i < nVerts; i++) {
      const x = geo.positions[i * 3];
      const y = geo.positions[i * 3 + 1];
      const z = geo.positions[i * 3 + 2];
      if (Math.hypot(x, y) < 1e-6) enCuspide.push(i);
      else assert.ok(Math.hypot(x, y) > 0, `vértice ${i} sin colapsar ni radio positivo`);
    }
    assert.equal(enCuspide.length, nU + 1, 'la cúspide debe ser un único punto de autotangencia');
    for (const i of enCuspide) assert.ok(Math.abs(geo.positions[i * 3 + 2]) < 1e-9);
  });

  it('en el horn torus el radio máximo es 2R y el mínimo 0', () => {
    let maxRadio = 0;
    let minRadio = Infinity;
    for (let i = 0; i < nVerts; i++) {
      const r = Math.hypot(geo.positions[i * 3], geo.positions[i * 3 + 1]);
      maxRadio = Math.max(maxRadio, r);
      minRadio = Math.min(minRadio, r);
    }
    close(maxRadio, 2 * R_VISUAL, 1e-4);
    assert.ok(minRadio < 1e-6);
  });

  it('fuera del límite (r/R = 0.6) la superficie no se autotangencia', () => {
    const geoSuave = generateHornTorusGeometry(params({ rOverR: 0.6 }), data(), false);
    let minRadio = Infinity;
    for (let i = 0; i < geoSuave.positions.length; i += 3) {
      minRadio = Math.min(minRadio, Math.hypot(geoSuave.positions[i], geoSuave.positions[i + 1]));
    }
    close(minRadio, R_VISUAL * 0.4, 1e-4);
    assert.ok(minRadio > 0.1, 'un toro suave no puede tocar el eje');
  });
});

describe('Métricas topológicas · régimen de la familia', () => {
  it('en el límite r=R: objeto no variedad, χ=1, rango H₁=1, Willmore y K_mín divergen', () => {
    const m = computeTopologicalMetrics(params(), data(), 'm_adultos');
    assert.equal(m.esVariedad, false);
    assert.equal(m.eulerCharacteristic, 1);
    assert.equal(m.rangoH1, 1);
    assert.equal(m.willmoreEnergyStandard, Infinity);
    assert.equal(m.gaussianCurvatureMin, -Infinity);
    assert.ok(Number.isFinite(m.gaussianCurvatureMax));
    assert.ok(Number.isFinite(m.meanCurvatureAvg));
  });

  it('en el miembro suave r<R: variedad, χ=0, rango H₁=2', () => {
    const m = computeTopologicalMetrics(params({ rOverR: 0.6 }), data(), 'm_adultos');
    assert.equal(m.esVariedad, true);
    assert.equal(m.eulerCharacteristic, 0);
    assert.equal(m.rangoH1, 2);
    assert.ok(Number.isFinite(m.willmoreEnergyStandard));
  });

  it('área, volumen, Willmore y curvaturas coinciden con las fórmulas cerradas', () => {
    const lac = calculateLacanianParameters(data(), params({ rOverR: 0.6 }));
    const R = lac.a * 25;
    const r = R * 0.6;
    const m = computeTopologicalMetrics(params({ rOverR: 0.6 }), data(), 'm_adultos');

    close(m.surfaceAreaStandard, 4 * Math.PI ** 2 * R * r, 1e-6);
    close(m.volumeStandard, 2 * Math.PI ** 2 * R * r * r, 1e-6);
    const rho = R / r;
    close(m.willmoreEnergyStandard, (Math.PI ** 2 * rho ** 2) / Math.sqrt(rho ** 2 - 1), 1e-6);
    close(m.gaussianCurvatureMax, 1 / (r * (R + r)), 1e-9);
    close(m.gaussianCurvatureMin, -1 / (r * (R - r)), 1e-9);
    close(m.meanCurvatureAvg, 1 / (2 * r), 1e-9);
  });

  it('los T de las escalas quedan dentro del baremo publicado y marcan las clínicas', () => {
    const m = computeTopologicalMetrics(params(), data(), 'm_adultos');
    const tValues = Object.values(m.tScores);
    assert.ok(tValues.length >= 9, 'faltan escalas en tScores');
    for (const t of tValues) assert.ok(t >= 30 - 1e-9 && t <= 80 + 1e-9, `T=${t} fuera de 30–80`);
    for (const escala of m.escalasClinicas) {
      assert.ok(m.tScores[escala] >= 60 - 1e-9, `${escala} está en escalasClinicas con T<60`);
    }
  });

  it('el preset de ruptura produce eyección y estado post-episodio', () => {
    const preset = CLINICAL_PRESETS.find((p) => p.name === 'Ruptura del modelo (IGS extremo)');
    assert.ok(preset);
    const m = computeTopologicalMetrics(params({ deformation_factor: 0.55 }), preset.data, 'm_adultos');
    assert.equal(m.psychoticRupture, true);
    assert.equal(m.ruptureGsiThreshold, 3.3);
    assert.ok(m.postEpisode, 'la ruptura debe derivar un estado post-episodio');
    assert.ok(m.postEpisode.coveragePercent >= 0 && m.postEpisode.coveragePercent <= 100);
    assert.equal(m.postEpisode.fantasyIntegrated, true);
  });

  it('el perfil default no dispara la ruptura', () => {
    const m = computeTopologicalMetrics(params(), data(), 'm_adultos');
    assert.equal(m.psychoticRupture, false);
    assert.equal(m.postEpisode, null);
  });
});

describe('Curvatura gaussiana K(u, v)', () => {
  it('positiva en el ecuador exterior, nula en los hombros, singular en la cúspide', () => {
    const exterior = computePointGaussianCurvature(0, 0, params(), data(), false);
    assert.ok(exterior.K > 0, `K exterior debería ser > 0, fue ${exterior.K}`);
    assert.equal(exterior.classification, 'eliptica');

    const hombro = computePointGaussianCurvature(0, Math.PI / 2, params(), data(), false);
    close(hombro.K, 0, 1e-12);
    assert.equal(hombro.classification, 'parabolica');

    const cuspide = computePointGaussianCurvature(0, Math.PI, params(), data(), false);
    assert.equal(cuspide.classification, 'singular');
  });

  it('la curvatura media en el ecuador coincide con la fórmula del toro', () => {
    const lac = calculateLacanianParameters(data(), params());
    // OJO: computePointGaussianCurvature normaliza los radios a >= 0.2 por estabilidad
    // numerica, asi que K y H se reportan sobre un objeto reescalado, NO en la escala
    // visual (x25) que usan las metricas topologicas. El test fija ESE contrato.
    const R = Math.max(0.2, lac.R);
    const r = Math.max(0.2 * lac.rOverR, lac.r);
    const { K, H } = computePointGaussianCurvature(0, 0, params(), data(), false);
    close(H, (R + 2 * r) / (2 * r * (R + r)), 1e-9);
    close(K, 1 / (r * (R + r)), 1e-9);
  });

  it('con deformación sintomática K y H son finitos y acotados en toda la grilla', () => {
    for (let i = 0; i <= 8; i++) {
      for (let j = 0; j <= 8; j++) {
        const u = (i / 8) * 2 * Math.PI;
        const v = (j / 8) * 2 * Math.PI;
        const { K, H } = computePointGaussianCurvature(u, v, params({ deformation_factor: 0.55 }), data(), true);
        assert.ok(Number.isFinite(K) && Math.abs(K) <= 150, `K no finita/acotada en (${u}, ${v})`);
        assert.ok(Number.isFinite(H) && Math.abs(H) <= 50, `H no finita/acotada en (${u}, ${v})`);
      }
    }
  });
});

describe('Espectro de singularidades · contrato que consume el panel', () => {
  const rep = computeSpectralSingularityAnalysis(params(), data());

  it('reporta puntos críticos con valores finitos', () => {
    assert.ok(rep.criticalPoints.length >= 5, `solo ${rep.criticalPoints.length} puntos críticos`);
    const clasificaciones = new Set(['eliptica', 'parabolica', 'hiperbolica', 'singular']);
    for (const p of rep.criticalPoints) {
      for (const campo of ['K0', 'K_def', 'deltaK', 'H0', 'H_def', 'angustia', 'stress', 'differentialTension'] as const) {
        assert.ok(Number.isFinite(p[campo]), `${p.id}: ${campo} no finito`);
      }
      assert.ok(Number.isFinite(p.deltaKPercent), `${p.id}: deltaKPercent no finito`);
      assert.ok(clasificaciones.has(p.classification), `${p.id}: clasificación desconocida`);
      assert.ok(p.position3D.every(Number.isFinite), `${p.id}: posición 3D no finita`);
    }
  });

  it('la correlación curvatura–angustia es un coeficiente válido', () => {
    assert.ok(Number.isFinite(rep.pearsonCorrelationCurvatureAnguish));
    assert.ok(rep.pearsonCorrelationCurvatureAnguish >= -1 && rep.pearsonCorrelationCurvatureAnguish <= 1);
    assert.ok(rep.highCurvatureAnguishOverlapPercent >= 0 && rep.highCurvatureAnguishOverlapPercent <= 100);
  });

  it('el espectro cubre muestras finitas y distorsiona en la fantasía', () => {
    assert.ok(rep.samplePoints.length > 0);
    for (const s of rep.samplePoints) {
      assert.ok(Number.isFinite(s.K) && Number.isFinite(s.angustia));
      assert.ok(Number.isFinite(s.u) && Number.isFinite(s.v));
    }
    const totalBins = rep.curvatureSpectrum.reduce((acc, b) => acc + b.count, 0);
    assert.ok(totalBins > 0, 'el espectro quedó vacío');
    assert.ok(Number.isFinite(rep.fantasyPointDistortion.K_def));
    assert.ok(Number.isFinite(rep.fantasyPointDistortion.deltaK));
    assert.ok(['Integra', 'Tensa', 'Desbordada', 'Colapsada'].includes(rep.fantasyPointDistortion.structuralIntegrity));
    assert.ok(Number.isFinite(rep.cuspSingularityDistortion.K_def));
    assert.ok(['Compensada', 'Cizalladura Leve', 'Estrangulamiento', 'Tensión extrema'].includes(rep.cuspSingularityDistortion.status));
  });
});
