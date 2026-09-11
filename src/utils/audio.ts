export class SoundController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    try {
      const savedMute = localStorage.getItem('flappy_sound_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
    } catch {
      // fallback
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('flappy_sound_muted', String(this.isMuted));
    } catch {
      // ignore
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playFlap() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Aquatic bloop / water jet pulse
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Pitch sweeps upward with quick water resonant bloop
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.1);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch {
      // ignore audio errors
    }
  }

  public playScore() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      
      // Aquatic pearl bell: high crystalline sine chime
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.19);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, now + 0.07); // E6
      gain2.gain.setValueAtTime(0.28, now + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.33);
    } catch {
      // ignore
    }
  }

  public playHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Deep water thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch {
      // ignore
    }
  }

  public playDie() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Submergence bubble splash
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.28);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.29);
    } catch {
      // ignore
    }
  }

  public playHighScore() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.2, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.22);
      });
    } catch {
      // ignore
    }
  }

  public playLevelClear() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      // Aquatic victory flourish: Abyssal chime arpeggio (C5, E5, G5, B5, C6)
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51];
      const now = this.ctx.currentTime;
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.26, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.36);
      });
    } catch {
      // ignore
    }
  }

  public playSwoosh() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.1);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch {
      // ignore
    }
  }

  public playShieldActivate() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Shimmering bubble shield activation chord
      const freqs = [587.33, 880, 1174.66]; // D5, A5, D6
      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.04);
        osc.frequency.exponentialRampToValueAtTime(f * 1.25, now + idx * 0.04 + 0.22);
        gain.gain.setValueAtTime(0.25, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.31);
      });
    } catch {
      // ignore
    }
  }

  public playShieldPop() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Soft bubble pop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // ignore
    }
  }

  public playDash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Hydrodynamic water whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.2);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    } catch {
      // ignore
    }
  }

  public playSeahorseSwitch(isUp: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Crisp directional aquatic chirp
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const startF = isUp ? 350 : 650;
      const endF = isUp ? 700 : 320;
      osc.frequency.setValueAtTime(startF, now);
      osc.frequency.exponentialRampToValueAtTime(endF, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // ignore
    }
  }

  public playFragmentCollect() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Sparkling aquatic crystal chime arpeggio
      const notes = [659.25, 880, 1174.66, 1760]; // E5, A5, D6, A6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);
        gain.gain.setValueAtTime(0.2, now + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.19);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Deep, satisfying tactile UX thump when a flying fragment docks into the record column.
   * Combines an initial crisp tactile click with a resonant warm sub-bass drop and glassy resonance.
   */
  public playFragmentThump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Initial crisp transient "tap"
      const tapOsc = this.ctx.createOscillator();
      const tapGain = this.ctx.createGain();
      tapOsc.type = 'triangle';
      tapOsc.frequency.setValueAtTime(280, now);
      tapOsc.frequency.exponentialRampToValueAtTime(70, now + 0.04);
      tapGain.gain.setValueAtTime(0.32, now);
      tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      tapOsc.connect(tapGain);
      tapGain.connect(this.ctx.destination);
      tapOsc.start(now);
      tapOsc.stop(now + 0.05);

      // 2. Resonant warm sub-bass body thump
      const bodyOsc = this.ctx.createOscillator();
      const bodyGain = this.ctx.createGain();
      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(140, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
      bodyGain.gain.setValueAtTime(0.38, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      bodyOsc.connect(bodyGain);
      bodyGain.connect(this.ctx.destination);
      bodyOsc.start(now);
      bodyOsc.stop(now + 0.23);

      // 3. High-pitch glassy harmonic ping (subtle dock chime)
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(1174.66, now + 0.01); // D6
      chimeGain.gain.setValueAtTime(0.14, now + 0.01);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      chimeOsc.start(now + 0.01);
      chimeOsc.stop(now + 0.15);
    } catch {
      // ignore
    }
  }

  /**
   * Extra intense, multi-layered sound effect when a fragment lands beyond the prior record.
   * Features:
   * - Punchy high-energy transient snap
   * - Heavy visceral sub-bass drop (175Hz -> 36Hz)
   * - Filtered mid-punch body with rich acoustic weight
   * - Radiant ascending 4-note celestial chime arpeggio (C6 -> E6 -> G6 -> C7)
   * - Shimmering harmonic crystal resonance tail
   */
  public playRecordBreakThump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Crisp high-energy transient snap
      const snapOsc = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(380, now);
      snapOsc.frequency.exponentialRampToValueAtTime(75, now + 0.045);
      snapGain.gain.setValueAtTime(0.48, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      snapOsc.connect(snapGain);
      snapGain.connect(this.ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.055);

      // 2. Heavy resonant sub-bass drop (visceral punch)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(175, now);
      subOsc.frequency.exponentialRampToValueAtTime(36, now + 0.32);
      subGain.gain.setValueAtTime(0.55, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.4);

      // 3. Mid-body warmth punch with lowpass filter
      const midOsc = this.ctx.createOscillator();
      const midGain = this.ctx.createGain();
      midOsc.type = 'sawtooth';
      midOsc.frequency.setValueAtTime(130, now);
      midOsc.frequency.exponentialRampToValueAtTime(55, now + 0.16);
      midGain.gain.setValueAtTime(0.2, now);
      midGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.18);
      midOsc.connect(filter);
      filter.connect(midGain);
      midGain.connect(this.ctx.destination);
      midOsc.start(now);
      midOsc.stop(now + 0.19);

      // 4. Radiant ascending celestial arpeggio (C6, E6, G6, C7)
      const notes = [1046.5, 1318.51, 1567.98, 2093.0];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + 0.018 + idx * 0.042;
        const chimeOsc = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(freq, noteTime);
        chimeGain.gain.setValueAtTime(0.2, noteTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.32);
        chimeOsc.connect(chimeGain);
        chimeGain.connect(this.ctx.destination);
        chimeOsc.start(noteTime);
        chimeOsc.stop(noteTime + 0.34);
      });

      // 5. High sparkle shimmer (harmonic chime ring)
      const shimmerOsc = this.ctx.createOscillator();
      const shimmerGain = this.ctx.createGain();
      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.setValueAtTime(2637.02, now + 0.14); // E7
      shimmerGain.gain.setValueAtTime(0.14, now + 0.14);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(this.ctx.destination);
      shimmerOsc.start(now + 0.14);
      shimmerOsc.stop(now + 0.4);
    } catch {
      // ignore
    }
  }

  /**
   * Extra juicy sound effect when a new fish level would be achieved upon completing the level.
   * Continues the harmonic progression upward from iteration two's record-breaking arpeggio:
   * Iteration 2 finished on: C7 (2093.0 Hz) and E7 (2637.02 Hz).
   * This continuation ascends into:
   * - G7 (3135.96 Hz)
   * - B7 (3951.07 Hz)
   * - C8 (4186.01 Hz)
   * - E8 (5274.04 Hz)
   * - G8 (6271.93 Hz)
   * Layered with:
   * - A triumphant Cmaj9 celestial chord sustain pad (C7 + E7 + G7 + B7 + C8)
   * - An oceanic "+1" water splash swoosh (bandpass filtered noise sweep from 1200Hz to 3600Hz)
   * - Warm sub-resonant anchor pulse (140Hz -> 42Hz) giving the giant splash physical weight
   */
  public playFishLevelUpSplash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Water splash whoosh (synthesized bubbly splash texture)
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
      }
      const noiseSrc = this.ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1100, now);
      bandpass.frequency.exponentialRampToValueAtTime(3400, now + 0.18);
      bandpass.Q.setValueAtTime(2.2, now);

      const splashGain = this.ctx.createGain();
      splashGain.gain.setValueAtTime(0.24, now);
      splashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      noiseSrc.connect(bandpass);
      bandpass.connect(splashGain);
      splashGain.connect(this.ctx.destination);
      noiseSrc.start(now);
      noiseSrc.stop(now + 0.35);

      // 2. Warm sub-resonant punch anchor (gives the giant +1 visceral presence)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(42, now + 0.28);
      subGain.gain.setValueAtTime(0.38, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.36);

      // 3. Ascending High-Octave Harmonic Progression:
      // Continues the scale upward from C7/E7 into G7 -> B7 -> C8 -> E8 -> G8!
      const highChimes = [
        { freq: 3135.96, timeOffset: 0.000, dur: 0.42 }, // G7
        { freq: 3951.07, timeOffset: 0.045, dur: 0.45 }, // B7
        { freq: 4186.01, timeOffset: 0.090, dur: 0.50 }, // C8
        { freq: 5274.04, timeOffset: 0.140, dur: 0.55 }, // E8
        { freq: 6271.93, timeOffset: 0.190, dur: 0.65 }, // G8
      ];

      highChimes.forEach((note) => {
        if (!this.ctx) return;
        const noteTime = now + note.timeOffset;
        const chimeOsc = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(note.freq, noteTime);
        chimeGain.gain.setValueAtTime(0.18, noteTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, noteTime + note.dur);
        chimeOsc.connect(chimeGain);
        chimeGain.connect(this.ctx.destination);
        chimeOsc.start(noteTime);
        chimeOsc.stop(noteTime + note.dur + 0.02);
      });

      // 4. Shimmering Triumphant Chord Pad (Cmaj9 celestial voicing)
      const padFreqs = [2093.0, 2637.02, 3135.96, 3951.07, 4186.01];
      padFreqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const chordTime = now + 0.08;
        const padOsc = this.ctx.createOscillator();
        const padGain = this.ctx.createGain();
        padOsc.type = 'sine';
        // Subtle detune for shimmer chorus
        padOsc.frequency.setValueAtTime(freq + (idx % 2 === 0 ? 1.5 : -1.5), chordTime);
        padGain.gain.setValueAtTime(0.08, chordTime);
        padGain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.75);
        padOsc.connect(padGain);
        padGain.connect(this.ctx.destination);
        padOsc.start(chordTime);
        padOsc.stop(chordTime + 0.8);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Fourth Iteration: Rhythmic, aquatic pulsing sound effect synchronized with
   * the extra pulsing bubbling ghosted spot when about to break the old record.
   * Supports double speed for upcoming fish level-up milestone.
   * Features:
   * - Warm suspense heartbeat sub-pulse
   * - Resonant bubbly plop/ping upward sweep
   * - High harmonic crystal shimmer tail
   */
  public playAnticipationPulse(isDoubleSpeed: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const decay = isDoubleSpeed ? 0.52 : 1.0;

      // 1. Warm suspense heartbeat ping (low-mid resonant anchor)
      const pulseOsc = this.ctx.createOscillator();
      const pulseGain = this.ctx.createGain();
      pulseOsc.type = 'sine';
      pulseOsc.frequency.setValueAtTime(isDoubleSpeed ? 285 : 240, now);
      pulseOsc.frequency.exponentialRampToValueAtTime(isDoubleSpeed ? 135 : 110, now + 0.18 * decay);
      pulseGain.gain.setValueAtTime(isDoubleSpeed ? 0.28 : 0.24, now);
      pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22 * decay);
      pulseOsc.connect(pulseGain);
      pulseGain.connect(this.ctx.destination);
      pulseOsc.start(now);
      pulseOsc.stop(now + 0.23 * decay);

      // 2. Rising water bubble plop sweep
      const bubbleOsc = this.ctx.createOscillator();
      const bubbleGain = this.ctx.createGain();
      bubbleOsc.type = 'sine';
      bubbleOsc.frequency.setValueAtTime(isDoubleSpeed ? 540 : 460, now);
      bubbleOsc.frequency.exponentialRampToValueAtTime(isDoubleSpeed ? 1060 : 920, now + 0.05 * decay);
      bubbleOsc.frequency.exponentialRampToValueAtTime(isDoubleSpeed ? 780 : 680, now + 0.14 * decay);
      bubbleGain.gain.setValueAtTime(isDoubleSpeed ? 0.21 : 0.18, now);
      bubbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16 * decay);
      bubbleOsc.connect(bubbleGain);
      bubbleGain.connect(this.ctx.destination);
      bubbleOsc.start(now);
      bubbleOsc.stop(now + 0.17 * decay);

      // 3. Subtle harmonic shimmer
      const shimmerOsc = this.ctx.createOscillator();
      const shimmerGain = this.ctx.createGain();
      shimmerOsc.type = 'triangle';
      shimmerOsc.frequency.setValueAtTime(isDoubleSpeed ? 1520 : 1320, now + 0.02 * decay);
      shimmerGain.gain.setValueAtTime(isDoubleSpeed ? 0.09 : 0.07, now + 0.02 * decay);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18 * decay);
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(this.ctx.destination);
      shimmerOsc.start(now + 0.02 * decay);
      shimmerOsc.stop(now + 0.19 * decay);
    } catch {
      // ignore
    }
  }
}

export const sound = new SoundController();
