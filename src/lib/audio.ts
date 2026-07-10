// Web Audio API Sound Synthesizer for Retro Space Game Effects
let audioCtx: AudioContext | null = null;
let currentVolume = 0.5;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setAudioVolume(volume: number) {
  currentVolume = Math.max(0, Math.min(1, volume));
}

export function initAudio() {
  getAudioContext();
}

// Laser shoot sound: high-frequency sweep down quickly
export function playLaserSound() {
  const ctx = getAudioContext();
  if (!ctx || currentVolume <= 0) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = 'sawtooth';
  const now = ctx.currentTime;

  // Pitch sweeps down quickly from 880Hz to 220Hz
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

  gainNode.gain.setValueAtTime(currentVolume * 0.4, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.start(now);
  osc.stop(now + 0.16);
}

// Enemy shoot sound: slightly different pitch and speed
export function playEnemyShootSound() {
  const ctx = getAudioContext();
  if (!ctx || currentVolume <= 0) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = 'triangle';
  const now = ctx.currentTime;

  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

  gainNode.gain.setValueAtTime(currentVolume * 0.3, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.start(now);
  osc.stop(now + 0.26);
}

// Explosion sound using white noise or low square waves
export function playExplosionSound(isBoss = false) {
  const ctx = getAudioContext();
  if (!ctx || currentVolume <= 0) return;

  const duration = isBoss ? 1.2 : 0.4;
  const now = ctx.currentTime;

  // Create a noise buffer
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Fill buffer with random noise values
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  // Add low-pass filter to simulate combustion
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(isBoss ? 50 : 100, now + duration);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(currentVolume * 0.6, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Add a bass synth thump for heavy explosions
  if (isBoss) {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.8);
    oscGain.gain.setValueAtTime(currentVolume * 0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  noise.start(now);
  noise.stop(now + duration);
}

// Power-up collect chime: melodic major arpeggio
export function playCollectSound() {
  const ctx = getAudioContext();
  if (!ctx || currentVolume <= 0) return;

  const now = ctx.currentTime;
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
  
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.06);
    
    gainNode.gain.setValueAtTime(currentVolume * 0.3, now + idx * 0.06);
    gainNode.gain.setValueAtTime(currentVolume * 0.3, now + idx * 0.06 + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.2);
    
    osc.start(now + idx * 0.06);
    osc.stop(now + idx * 0.06 + 0.22);
  });
}

// Player hurt: sudden buzz down
export function playHurtSound() {
  const ctx = getAudioContext();
  if (!ctx || currentVolume <= 0) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = 'sawtooth';
  const now = ctx.currentTime;

  osc.frequency.setValueAtTime(150, now);
  osc.frequency.linearRampToValueAtTime(50, now + 0.15);

  gainNode.gain.setValueAtTime(currentVolume * 0.5, now);
  gainNode.gain.linearRampToValueAtTime(0.001, now + 0.15);

  osc.start(now);
  osc.stop(now + 0.16);
}

// Shield fully charged sound: futuristic shimmer
export function playShieldSound() {
  const ctx = getAudioContext();
  if (!ctx || currentVolume <= 0) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = 'sine';
  const now = ctx.currentTime;

  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);

  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.linearRampToValueAtTime(currentVolume * 0.4, now + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.start(now);
  osc.stop(now + 0.32);
}

// Boss Alert Siren
export function playBossAlertSound() {
  const ctx = getAudioContext();
  if (!ctx || currentVolume <= 0) return;

  const now = ctx.currentTime;
  
  // High low siren repeating twice
  for (let i = 0; i < 2; i++) {
    const t = now + i * 0.5;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(110, t + 0.4);
    
    gainNode.gain.setValueAtTime(currentVolume * 0.4, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    
    osc.start(t);
    osc.stop(t + 0.48);
  }
}
