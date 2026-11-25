// All of the game's sound is synthesized with WebAudio: short oscillator
// blips and a little filtered noise for the grill. No audio files ship with
// the game, and every call is safe when no audio context exists yet (the
// browser only lets sound start after a first key press or click).

let context = null;
let sizzleNodes = null;

export function unlockAudio() {
  if (context) {
    if (context.state === 'suspended') context.resume();
    return;
  }
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    context = new AudioContext();
  } catch (error) {
    context = null;
  }
}

function tone(freq, seconds, type, gainValue, when = 0) {
  if (!context) return;
  const start = context.currentTime + when;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + seconds + 0.05);
}

export function playPickup() {
  tone(620, 0.09, 'sine', 0.12);
  tone(930, 0.08, 'sine', 0.08, 0.05);
}

export function playPlace() {
  tone(330, 0.08, 'triangle', 0.12);
}

export function playChop() {
  tone(190, 0.05, 'square', 0.07);
  tone(140, 0.05, 'square', 0.06, 0.07);
}

export function playServe() {
  tone(880, 0.12, 'sine', 0.14);
  tone(1318, 0.18, 'sine', 0.12, 0.09);
}

export function playError() {
  tone(160, 0.18, 'sawtooth', 0.1);
  tone(110, 0.22, 'sawtooth', 0.09, 0.1);
}

export function playOrder() {
  tone(520, 0.1, 'triangle', 0.1);
  tone(660, 0.12, 'triangle', 0.1, 0.09);
}

export function playWin() {
  [523, 659, 784, 1046].forEach((freq, index) => tone(freq, 0.22, 'sine', 0.13, index * 0.13));
}

export function playLose() {
  [392, 330, 262].forEach((freq, index) => tone(freq, 0.3, 'triangle', 0.11, index * 0.18));
}

// A soft looping hiss while anything cooks on the grill; it starts and stops
// with the grill, and it is silent when the tab has no audio yet.
export function setSizzle(on) {
  if (!context) return;
  if (on && !sizzleNodes) {
    const length = context.sampleRate;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 5200;
    filter.Q.value = 0.6;
    const gain = context.createGain();
    gain.gain.value = 0.035;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start();
    sizzleNodes = { source, gain };
  } else if (!on && sizzleNodes) {
    try {
      sizzleNodes.source.stop();
    } catch (error) {
      // Already stopped; nothing to do.
    }
    sizzleNodes = null;
  }
}
