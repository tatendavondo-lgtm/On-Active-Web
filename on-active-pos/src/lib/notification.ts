let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

function playTone(freq: number, duration: number, volume: number = 0.1, type: OscillatorType = 'sine') {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio playback failed', e);
  }
}

export const playNotificationSound = {
  newIncomingOrder: () => {
    // Quick chime
    playTone(880, 0.3, 0.1, 'triangle');
    setTimeout(() => playTone(1320, 0.3, 0.05, 'triangle'), 100);
  },
  newOnlineOrder: () => {
    // Longer alert
    playTone(660, 0.5, 0.1, 'square');
    setTimeout(() => playTone(880, 0.5, 0.1, 'square'), 200);
  },
  paymentComplete: () => {
    // Success ding
    playTone(1046.50, 0.5, 0.1, 'sine'); // C6
  },
  error: () => {
    // Error tone
    playTone(220, 0.3, 0.1, 'sawtooth');
  }
};
