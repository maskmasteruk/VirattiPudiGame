export class AudioManager {
  constructor() {
    this.ctx = null;
    this.engineOscillator = null;
    this.engineGain = null;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Engine sound setup
    this.engineOscillator = this.ctx.createOscillator();
    this.engineOscillator.type = 'sawtooth';
    this.engineOscillator.frequency.value = 50; // Low hum
    
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0; // muted initially
    
    // Lowpass filter for engine
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    this.engineOscillator.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    
    this.engineOscillator.start();
  }

  startEngine() {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.engineGain.gain.setTargetAtTime(0.1, this.ctx.currentTime, 0.5);
  }

  stopEngine() {
    if (this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    }
  }

  updateEngine(speedMultiplier) {
    if (this.engineOscillator) {
      this.engineOscillator.frequency.setTargetAtTime(50 + (speedMultiplier - 1) * 30, this.ctx.currentTime, 0.1);
    }
  }

  playCrash() {
    if (!this.ctx) this.init();
    
    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.4);
    
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    noiseSource.start();
  }

  playBark() {
    if (!this.ctx) this.init();
    
    // Simple bark synth
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    
    const gainNode = this.ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    const now = this.ctx.currentTime;
    
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }
}
