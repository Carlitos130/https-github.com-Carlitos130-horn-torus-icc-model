# Horn Torus ICC Model

Visor interactivo de un modelo topológico del inconsciente (Icc) sobre un **horn torus** —el toro de revolución en el caso límite en que el agujero central se cierra en un punto—, alimentado con puntajes del inventario **SCL-90-R**.

> **No es una herramienta diagnóstica.** Las asignaciones entre escalas del SCL-90-R y la geometría son construcciones del modelo (marcadas como **AXIOMA**), no resultados validados. Un puntaje de malestar no determina una estructura clínica.

## Qué muestra

- **Ding / horn torus:** toda la superficie es el Icc. Su pared es la **censura** Icc/Prcc.
- **p, el punto de autotangencia:** el único orificio fijo, de doble sentido: por él entra lo oído y sale la voz.
- **Prcc:** el campo de representaciones-palabra que entra por p, concentrado en el embudo del eje y **sin borde**. La **Cc** no es un lugar sino un umbral de sobreinvestidura dentro de ese campo.
- **Cinta S-I-Σ** sobre la cara interna (significante, imagen del cuerpo, síntoma), con el hilo pulsional pegado al borde de I.
- **Marcas de fantasía:** marcas de trauma sobre la cara interna; la angustia surge por proximidad (aproximación → señal; pasaje → situación traumática).
- **Ruptura del modelo:** con IGS ≥ 3× el corte T=60 de la población y anchura de cruce suficiente (Wegbreite), la cinta sale por la voz y se reconfigura sobre la superficie. Es una secuencia del modelo, no un diagnóstico.

La descripción completa, con qué es cita, qué es lectura y qué es axioma, está en [docs/modelo.md](docs/modelo.md).

## Carga del SCL-90-R

Dos modos, con el baremo de **Casullo – Pérez** (UBA; adultos y adolescentes, por sexo):

- **Puntajes directos (PD):** dimensiones 0–4, PST 0–90, PSDI derivado. Valida la consistencia interna (IGS = PST·PSDI/90 y el rango de IGS compatible con las dimensiones).
- **Puntajes T:** para protocolos que solo informan T. Se convierten a PD con el baremo elegido; por encima de T = 80 (fuera de la tabla publicada) se extrapola el último tramo y se marca "fuera de baremo".

Los presets en T incluyen un caso clínico **anonimizado**.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre en http://localhost:3000. `npm run lint` corre el chequeo de tipos.

## Estructura

| Archivo | Contenido |
|---|---|
| `src/utils/hornTorusMath.ts` | Motor: geometría de la familia r/R, marcas y angustia, campo Prcc, curvatura, singularidades espectrales, resumen, exportación Python y HTML |
| `src/utils/baremos.ts` | Baremos del SCL-90-R por población |
| `src/components/HornTorusCanvas.tsx` | Visor 3D (Three.js): superficie, cintas, marcas, Prcc, voz, secuencia de ruptura, animación de δ |
| `src/components/Scl90rForm.tsx` | Carga del SCL-90-R (PD / T), parámetros y presets |
| `src/components/SpectralSingularityPanel.tsx` | Curvatura gaussiana en puntos críticos |
| `src/components/TheoreticalManualModal.tsx` | Manual teórico y de uso |
| `public/horn_torus_icc_interactivo.html` | Visor HTML autónomo (Three.js por CDN) |
| `docs/` | Descripción del modelo y figuras |

## Privacidad

No se deben cargar en este repositorio datos de pacientes identificables. Los casos de ejemplo están anonimizados.

## Licencia

MIT — ver [LICENSE](LICENSE).
