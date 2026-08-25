// Web Audio API Order Alert Synthesizer
// Works reliably in all modern browsers without external asset dependencies

export function playNewOrderSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Pleasant 4-note ascending chime melody: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
    const notes = [
      { freq: 523.25, start: 0, duration: 0.15 },
      { freq: 659.25, start: 0.12, duration: 0.15 },
      { freq: 783.99, start: 0.24, duration: 0.18 },
      { freq: 1046.5, start: 0.38, duration: 0.4 }
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      // Envelope: Fast attack, exponential decay
      gain.gain.setValueAtTime(0.01, now + start);
      gain.gain.linearRampToValueAtTime(0.3, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (err) {
    console.error('Audio playback failed:', err);
  }
}
