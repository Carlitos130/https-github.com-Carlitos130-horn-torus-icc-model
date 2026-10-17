/**
 * Tests del contrato psicométrico del motor — SCL-90-R y baremos Casullo–Pérez.
 *
 * Qué protegen: las identidades que sostienen todo lo demás. Si alguien toca
 * `derivePsdi`, `pstRangeForGsi`, la tabla de baremos o el umbral de ruptura,
 * estos tests fallan ANTES de que el error llegue al visor o a una figura.
 *
 * No fijan números clínicos nuevos: verifican relaciones internas (IGS = PST·PSDI/90,
 * PSDI ∈ [1,4], T=60 ↔ t60Gsi, umbral = 3× corte) y las invariantes de las tablas
 * publicadas (12 escalas, T 30–80, PD no decreciente en T).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  BAREMOS,
  BAREMO_IDS,
  DEFAULT_BAREMO_ID,
  getBaremo,
  publishedRange,
  ruptureThresholdGsi,
  tDeEscalaCon,
  type BaremoId,
  type EscalaKey,
} from '../src/utils/baremos';
import {
  CLINICAL_PRESETS,
  DEFAULT_SCL90R_DATA,
  PSYCHOTIC_RUPTURE_THRESHOLD_GSI,
  SCL90R_ADDITIONAL_ITEMS,
  SCL90R_ITEM_COUNTS,
  SCL90R_TOTAL_ITEMS,
  WEGREITE_MIN_DELTA,
  checkScl90rConsistency,
  derivePsdi,
  gsiRangeFromDimensions,
  isPsychoticRupture,
  pstRangeForGsi,
} from '../src/utils/hornTorusMath';
import type { ModelParams, SCL90RData } from '../src/types';

const EPS = 1e-9;

const profile = (over: Partial<SCL90RData> = {}): SCL90RData => ({
  ...DEFAULT_SCL90R_DATA,
  ...over,
});

/** δ = 0.55 es la Wegbreite del preset de ruptura (≥ π/6). */
const paramsRuptura = (over: Partial<ModelParams> = {}): ModelParams => ({
  a_scale: 0.1,
  u_scale: 2 * Math.PI,
  v_scale: Math.PI,
  deformation_factor: 0.55,
  gridResolution: 16,
  a_critical: Math.PI / 4,
  rOverR: 1,
  baremoId: 'm_adultos',
  ...over,
});

const GSI_RUPTURA = 3.3; // 3 × 1.10 (corte T=60, masculino adultos)

describe('SCL-90-R · identidades psicométricas', () => {
  it('PSDI derivado cumple IGS = PST·PSDI/90', () => {
    assert.equal(derivePsdi(0.9, 54), 1.5);
    assert.equal(derivePsdi(1.0, 45), 2.0);
    assert.equal(derivePsdi(0, 0), 0, 'sin síntomas positivos no hay PSDI');
    // 3.30 × 90 / 88 = 3.375
    assert.ok(Math.abs(derivePsdi(3.3, 88) - 3.375) < 1e-12);

    for (const [gsi, pst] of [[0.9, 54], [0.85, 45], [3.3, 88], [1.2, 60]] as const) {
      assert.ok(
        Math.abs((pst * derivePsdi(gsi, pst)) / SCL90R_TOTAL_ITEMS - gsi) < 1e-12,
        `la identidad no cierra para GSI ${gsi} / PST ${pst}`,
      );
    }
  });

  it('el rango admisible de PST mantiene PSDI dentro de [1, 4]', () => {
    for (const gsi of [0.05, 0.3, 0.85, 1.1, 2, 3.3, 4]) {
      const [lo, hi] = pstRangeForGsi(gsi);
      assert.ok(Number.isInteger(lo) && Number.isInteger(hi), 'PST es un conteo entero');
      assert.ok(lo <= hi, `rango invertido para GSI ${gsi}: [${lo}, ${hi}]`);
      assert.ok(lo >= 0 && hi <= SCL90R_TOTAL_ITEMS);
      if (lo > 0) assert.ok(derivePsdi(gsi, lo) <= 4 + EPS, `PSDI(${lo}) > 4`);
      if (hi > 0) assert.ok(derivePsdi(gsi, hi) >= 1 - EPS, `PSDI(${hi}) < 1`);
    }
  });

  it('el rango de IGS compatible con las dimensiones deja 7 ítems libres', () => {
    const [lo, hi] = gsiRangeFromDimensions(DEFAULT_SCL90R_DATA);
    const sumaDimensiones = Object.entries(SCL90R_ITEM_COUNTS).reduce(
      (acc, [k, n]) => acc + (DEFAULT_SCL90R_DATA[k as EscalaKey] ?? 0) * (n as number),
      0,
    );
    assert.ok(Math.abs(lo - sumaDimensiones / SCL90R_TOTAL_ITEMS) < 1e-12);
    assert.ok(Math.abs(hi - (sumaDimensiones + 4 * SCL90R_ADDITIONAL_ITEMS) / SCL90R_TOTAL_ITEMS) < 1e-12);
    const gsi = DEFAULT_SCL90R_DATA['GSI'];
    assert.ok(gsi >= lo - EPS && gsi <= hi + EPS, 'el preset default tiene IGS incompatible con sus dimensiones');
  });

  it('el preset default y todos los presets clínicos son internamente consistentes', () => {
    assert.deepEqual(checkScl90rConsistency(DEFAULT_SCL90R_DATA), []);
    for (const preset of CLINICAL_PRESETS) {
      assert.deepEqual(
        checkScl90rConsistency(preset.data),
        [],
        `el preset "${preset.name}" es inconsistente`,
      );
    }
  });

  it('detecta PST imposible e IGS que no cierra con PST·PSDI/90', () => {
    assert.ok(checkScl90rConsistency(profile({ PST: 999 })).length > 0, 'PST fuera de 0–90 no se detectó');
    assert.ok(
      checkScl90rConsistency(profile({ GSI: 2.0 })).length > 0,
      'un IGS 2.00 con PST 45 / PSDI 1.70 debe marcarse inconsistente',
    );
  });
});

describe('Baremos Casullo–Pérez · estructura de las tablas publicadas', () => {
  it('hay cuatro poblaciones con las 12 escalas y 12 filas T 30–80', () => {
    assert.deepEqual([...BAREMO_IDS].sort(), ['f_adolescentes', 'f_adultas', 'm_adolescentes', 'm_adultos']);
    for (const id of BAREMO_IDS) {
      const b = BAREMOS[id];
      assert.equal(Object.keys(b.tabla).length, 12, `${id}: faltan escalas`);
      for (const [k, filas] of Object.entries(b.tabla)) {
        assert.equal(filas.length, 12, `${id}/${k}: se esperaban 12 filas`);
        const tValues = filas.map(([, t]) => t);
        assert.deepEqual(tValues, [30, 35, 40, 45, 50, 55, 60, 63, 65, 70, 75, 80], `${id}/${k}: T fuera de orden`);
      }
    }
  });

  it('la PD de cada escala no decrece al crecer T', () => {
    for (const id of BAREMO_IDS) {
      for (const [k, filas] of Object.entries(BAREMOS[id].tabla)) {
        for (let i = 1; i < filas.length; i++) {
          assert.ok(
            filas[i][0] >= filas[i - 1][0] - EPS,
            `${id}/${k}: PD decrece entre T=${filas[i - 1][1]} y T=${filas[i][1]}`,
          );
        }
      }
    }
  });

  it('t60Gsi es exactamente la PD del IGS en T = 60', () => {
    for (const id of BAREMO_IDS) {
      const fila60 = BAREMOS[id].tabla['GSI'].find(([, t]) => t === 60);
      assert.ok(fila60, `${id}: no hay fila T=60 para GSI`);
      assert.equal(fila60[0], BAREMOS[id].t60Gsi, `${id}: t60Gsi no coincide con la tabla`);
    }
  });

  it('tDeEscalaCon reproduce cada nodo de la tabla', () => {
    for (const id of BAREMO_IDS) {
      for (const [k, filas] of Object.entries(BAREMOS[id].tabla)) {
        for (let i = 0; i < filas.length; i++) {
          const [pd, t] = filas[i];
          // PD repetida (efecto piso): PD->T no es inyectivo, se salta el nodo.
          if (i > 0 && Math.abs(pd - filas[i - 1][0]) < 1e-12) continue;
          const { t: interpolado, lado } = tDeEscalaCon(BAREMOS[id], k as EscalaKey, pd);
          assert.ok(
            Math.abs(interpolado - t) < 1e-9,
            `${id}/${k}: PD ${pd} debería dar T=${t}, dio ${interpolado}`,
          );
          assert.equal(lado, undefined, `${id}/${k}: ${pd} está dentro de tabla`);
        }
      }
    }
  });

  it('tDeEscalaCon acota fuera de la tabla en vez de extrapolar', () => {
    const b = BAREMOS['m_adultos'];
    const [piso] = publishedRange('m_adultos', 'GSI')!;
    const [, techo] = publishedRange('m_adultos', 'GSI')!;

    const bajo = tDeEscalaCon(b, 'GSI', piso - 0.5);
    assert.equal(bajo.t, 30, 'por debajo del piso se acota a T=30');
    assert.equal(bajo.lado, 'bajo');

    const alto = tDeEscalaCon(b, 'GSI', techo + 0.5);
    assert.equal(alto.t, 80, 'por encima del techo se acota a T=80 (no se extrapola)');
    assert.equal(alto.lado, 'alto');
    assert.ok(Number.isFinite(alto.t));
  });

  it('el umbral de ruptura es 3× el corte T=60 de la población, redondeado', () => {
    for (const id of BAREMO_IDS) {
      const esperado = Math.round(3 * BAREMOS[id].t60Gsi * 100) / 100;
      assert.equal(ruptureThresholdGsi(id), esperado, `${id}: umbral de ruptura`);
    }
    assert.equal(ruptureThresholdGsi('m_adultos'), 3.3);
    assert.equal(PSYCHOTIC_RUPTURE_THRESHOLD_GSI, 3.3);
    assert.equal(ruptureThresholdGsi('f_adolescentes'), 4.59);
  });

  it('getBaremo cae al default con un id inválido', () => {
    assert.equal(getBaremo(undefined), BAREMOS[DEFAULT_BAREMO_ID]);
    assert.equal(getBaremo('no_existe' as BaremoId), BAREMOS[DEFAULT_BAREMO_ID]);
  });

  it('publishedRange devuelve piso y techo publicados', () => {
    const rango = publishedRange('m_adultos', 'GSI');
    assert.ok(rango);
    assert.deepEqual(rango, [BAREMOS['m_adultos'].tabla['GSI'][0][0], BAREMOS['m_adultos'].tabla['GSI'][11][0]]);
  });
});

describe('Ruptura del modelo · cantidad (IGS) + anchura (Wegbreite)', () => {
  it('π/6 es la anchura mínima de cruce', () => {
    assert.equal(WEGREITE_MIN_DELTA, Math.PI / 6);
  });

  it('por debajo del umbral no hay ruptura aunque δ sea suficiente', () => {
    assert.equal(isPsychoticRupture(profile({ GSI: 3.29 }), paramsRuptura()), false);
  });

  it('con IGS en el umbral, δ < π/6 disipa el cruce', () => {
    assert.equal(isPsychoticRupture(profile({ GSI: GSI_RUPTURA }), paramsRuptura({ deformation_factor: 0.3 })), false);
  });

  it('con IGS en el umbral y δ ≥ π/6 la ruptura se abre', () => {
    assert.equal(isPsychoticRupture(profile({ GSI: GSI_RUPTURA }), paramsRuptura()), true);
    assert.equal(
      isPsychoticRupture(profile({ GSI: GSI_RUPTURA }), paramsRuptura({ deformation_factor: Math.PI / 6 })),
      true,
      'δ exactamente en el mínimo debe alcanzar',
    );
  });

  it('el umbral depende de la población del baremo', () => {
    // Femenino adolescentes: corte T=60 = 1.53 → umbral 4.59
    assert.equal(isPsychoticRupture(profile({ GSI: 3.3 }), paramsRuptura({ baremoId: 'f_adolescentes' })), false);
    assert.equal(isPsychoticRupture(profile({ GSI: 4.6 }), paramsRuptura({ baremoId: 'f_adolescentes' })), true);
  });

  it('el preset de ruptura dispara y los demás no', () => {
    const ruptura = CLINICAL_PRESETS.find((p) => p.name === 'Ruptura del modelo (IGS extremo)');
    assert.ok(ruptura, 'falta el preset de ruptura');
    assert.equal(ruptura.data['GSI'], 3.3);
    assert.equal(isPsychoticRupture(ruptura.data, paramsRuptura()), true);

    for (const preset of CLINICAL_PRESETS.filter((p) => p !== ruptura)) {
      assert.equal(
        isPsychoticRupture(preset.data, paramsRuptura({ deformation_factor: 0.3 })),
        false,
        `"${preset.name}" no debería disparar la ruptura`,
      );
    }
  });
});
