// vortexSound.ts
// Motor de sonido del vórtice (28 de septiembre de 2026, espíritu V40).
// Síntesis pura con Web Audio — sin dependencias ni archivos de audio:
// dos osciladores (fundamental + quinta) con detune rotacional, filtro
// lowpass y LFO de amplitud. La fundamental sigue la escala del aparato:
// f0 = 110 · (GSI / 0.85) — grave y denso con GSI alto, agudo y tenue con
// GSI bajo. Durante la secuencia de ruptura, el synth desliza hacia abajo
// y se apaga al cubrirse la superficie (la voz queda sola).
//
// El AudioContext se crea en el primer gesto del usuario (política de
// autoplay de los navegadores): el toggle «Sonido» del panel es ese gesto.

export class VortexSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private oscA: OscillatorNode | null = null;
  private oscB: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private running = false;
  private f0 = 110;
  private cutoff = 700;

  /** Enciende el synth. Crea el AudioContext si no existe (primer click). */
  start(): boolean {
    if (this.running) return true;
    try {
      const Ctx =
        window.AudioContext ||
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return false;
      const ctx = new Ctx();

      const master = ctx.createGain();
      master.gain.value = 0;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = this.cutoff;
      filter.Q.value = 4;

      const oscA = ctx.createOscillator();
      oscA.type = 'sawtooth';
      oscA.frequency.value = this.f0;

      const oscB = ctx.createOscillator();
      oscB.type = 'sawtooth';
      oscB.frequency.value = this.f0 * 1.5;
      oscB.detune.value = 0;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.5;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.02;

      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(master);
      lfo.connect(lfoGain);
      lfoGain.connect(master.gain);
      master.connect(ctx.destination);

      oscA.start();
      oscB.start();
      lfo.start();

      this.ctx = ctx;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      this.master = master;
      this.filter = filter;
      this.oscA = oscA;
      this.oscB = oscB;
      this.lfo = lfo;
      this.running = true;

      master.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.5);
      return true;
    } catch {
      return false;
    }
  }

  /** Apaga el synth con un desvanecimiento corto y libera el contexto. */
  stop(): void {
    if (!this.running || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    try {
      this.master.gain.cancelScheduledValues(ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
    } catch {
      /* noop */
    }
    window.setTimeout(() => {
      try {
        this.oscA?.stop();
        this.oscB?.stop();
        this.lfo?.stop();
        void this.ctx?.close();
      } catch {
        /* noop */
      }
      this.ctx = null;
      this.master = null;
      this.filter = null;
      this.oscA = null;
      this.oscB = null;
      this.lfo = null;
      this.running = false;
    }, 350);
  }

  /** Intensidad del aparato (GSI): fundamental y apertura del filtro. */
  setIntensity(intensity: number): void {
    const g = Math.max(0, Math.min(3, intensity));
    this.f0 = 110 * (g / 0.85);
    this.cutoff = 250 + g * 780;
    if (!this.running || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.oscA?.frequency.setTargetAtTime(this.f0, now, 0.35);
    this.oscB?.frequency.setTargetAtTime(this.f0 * 1.5, now, 0.35);
    this.filter?.frequency.setTargetAtTime(this.cutoff, now, 0.4);
  }

  /** Rotación del vórtice: detune entre los osciladores y cadencia del LFO. */
  setRotation(speed: number): void {
    if (!this.running || !this.ctx) return;
    const s = Math.max(0, Math.min(3, speed));
    const now = this.ctx.currentTime;
    this.oscB?.detune.setTargetAtTime(s * 18, now, 0.2);
    this.lfo?.frequency.setTargetAtTime(0.35 + s * 0.4, now, 0.4);
  }

  /** Ruptura [0..1]: desliza la fundamental hacia abajo y cierra el filtro. */
  setRupture(ratio: number): void {
    if (!this.running || !this.ctx || !this.master) return;
    const k = Math.max(0, Math.min(1, ratio));
    const now = this.ctx.currentTime;
    const f = this.f0 * (1 - 0.6 * k);
    this.oscA?.frequency.setTargetAtTime(f, now, 0.25);
    this.oscB?.frequency.setTargetAtTime(f * 1.5, now, 0.25);
    this.filter?.frequency.setTargetAtTime(this.cutoff * (1 - 0.8 * k), now, 0.3);
    this.master.gain.setTargetAtTime(0.06 * (1 - k), now, 0.3);
  }

  get isRunning(): boolean {
    return this.running;
  }
}

/** Instancia única compartida por la app (el Canvas la alimenta por frame). */
export const vortexSynth = new VortexSynth();
