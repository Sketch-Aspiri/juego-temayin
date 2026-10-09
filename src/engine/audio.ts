export type SfxName =
  | 'jump' | 'coin' | 'stomp' | 'bump' | 'brk' | 'power' | 'hurt' | 'die' | 'life'
  | 'flag' | 'roar' | 'fire' | 'warn' | 'quills' | 'tick' | 'firework';

type Wave = OscillatorType;

/** Sintetizador de efectos de sonido retro (sin archivos de audio). */
export class AudioEngine {
  muted = false;
  volume = 1;
  private ctx: AudioContext | null = null;

  beep(freq: number, dur: number, type: Wave = 'square', vol = 0.08, slide = 0, delay = 0): void {
    if (this.muted || this.volume <= 0) return;
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new Ctor();
      }
      const ctx = this.ctx;
      if (ctx.state === 'suspended') void ctx.resume();
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slide) osc.frequency.linearRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
      gain.gain.setValueAtTime(vol * this.volume, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur);
    } catch {
      // Sin audio disponible: el juego sigue funcionando en silencio.
    }
  }

  private seq(freqs: number[], dur: number, stepMs: number, type: Wave = 'square', vol = 0.06): void {
    freqs.forEach((f, i) => this.beep(f, dur, type, vol, 0, (i * stepMs) / 1000));
  }

  play(name: SfxName): void {
    switch (name) {
      case 'jump': return this.beep(320, 0.18, 'square', 0.06, 380);
      case 'coin': return this.seq([988, 1319], 0.2, 70);
      case 'stomp': return this.beep(220, 0.15, 'triangle', 0.15, -150);
      case 'bump': return this.beep(140, 0.1, 'triangle', 0.15);
      case 'brk': return this.beep(90, 0.2, 'sawtooth', 0.08, -60);
      case 'power': return this.seq([523, 659, 784, 1047], 0.12, 70);
      case 'hurt': return this.beep(400, 0.3, 'sawtooth', 0.07, -300);
      case 'die': return this.seq([494, 466, 440, 392, 330, 262], 0.18, 130, 'square', 0.07);
      case 'life': return this.seq([660, 880, 990, 1320], 0.1, 80);
      case 'flag': return this.seq([392, 523, 659, 784, 1047, 784, 1047], 0.16, 120);
      case 'roar':
        this.beep(110, 0.6, 'sawtooth', 0.12, -60);
        return this.beep(80, 0.5, 'sawtooth', 0.1, -40, 0.15);
      case 'fire': return this.beep(700, 0.12, 'square', 0.05, -400);
      case 'warn': return this.beep(180, 0.25, 'sawtooth', 0.06, 120);
      case 'quills': return this.beep(600, 0.2, 'square', 0.05, -400);
      case 'tick': return this.beep(1200, 0.03, 'square', 0.03);
      case 'firework': return this.beep(200 + Math.random() * 200, 0.3, 'triangle', 0.05, -150);
    }
  }
}

export const audio = new AudioEngine();
