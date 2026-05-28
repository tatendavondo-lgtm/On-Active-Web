let audioContext: AudioContext | null = null;

async function getAudioContext(): Promise<AudioContext | null> {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    return audioContext;
  } catch (e) {
    console.warn('AudioContext error:', e);
    return null;
  }
}

// Keep audio context alive — resume on ANY user interaction (not just the first)
if (typeof window !== 'undefined') {
  const resumeAudio = () => {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
  };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('touchstart', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
}

async function playTone(freq: number, duration: number, volume: number = 0.15, type: OscillatorType = 'sine') {
  try {
    const ctx = await getAudioContext();
    if (!ctx) return;
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
  init: async () => {
    // Force creation and resume of AudioContext during user interaction
    const ctx = await getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }
  },
  tap: () => {
    // Very short, low pitch click mimicking a mechanical keyboard switch or iPad keyboard click
    playTone(300, 0.03, 0.05, 'sine');
  },
  swipe: () => {
    // Soft low-frequency swoosh
    playTone(150, 0.1, 0.03, 'sine');
  },
  addToCart: () => {
    // Luxurious soft chime
    playTone(880, 0.3, 0.08, 'sine');
    setTimeout(() => playTone(1108.73, 0.4, 0.08, 'sine'), 100); // C#6
  },
  newIncomingOrder: () => {
    // Distinct 3-beep chime for incoming orders
    playTone(880, 0.2, 0.2, 'triangle');
    setTimeout(() => playTone(1100, 0.2, 0.15, 'triangle'), 220);
    setTimeout(() => playTone(1320, 0.3, 0.15, 'triangle'), 440);
  },
  newOnlineOrder: () => {
    // Double alert tone
    playTone(660, 0.4, 0.2, 'square');
    setTimeout(() => playTone(880, 0.4, 0.15, 'square'), 300);
  },
  paymentComplete: () => {
    // Success ding
    playTone(1046.50, 0.5, 0.15, 'sine'); // C6
    setTimeout(() => playTone(1318.51, 0.5, 0.1, 'sine'), 200); // E6
  },
  error: () => {
    // Error tone
    playTone(220, 0.4, 0.15, 'sawtooth');
  }
};
