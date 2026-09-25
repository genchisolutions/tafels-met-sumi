// audio.js — small synthesized sound effects (no external audio files) + Dutch TTS.
const AudioFx = (() => {
  let ctx = null;
  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type = 'sine', gainPeak = 0.18) {
    const c = ensureCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + start);
    gain.gain.setValueAtTime(0, c.currentTime + start);
    gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur + 0.05);
  }

  function enabled() { return Storage.getPlayer().settings.soundEffects; }

  return {
    unlock() { try { ensureCtx(); } catch (e) {} },
    correct() { if (!enabled()) return; tone(523, 0, 0.18); tone(784, 0.12, 0.22); },
    incorrect() { if (!enabled()) return; tone(300, 0, 0.28, 'sine', 0.12); },
    paw() { if (!enabled()) return; tone(880, 0, 0.08, 'triangle', 0.14); },
    reward() { if (!enabled()) return; tone(660, 0, 0.12); tone(880, 0.1, 0.12); tone(1046, 0.2, 0.2); },
    perfect() { if (!enabled()) return; [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.13, 0.2)); },
    click() { if (!enabled()) return; tone(440, 0, 0.06, 'triangle', 0.08); }
  };
})();

const Speech = (() => {
  function say(text) {
    const player = Storage.getPlayer();
    if (!player.settings.spokenQuestions) return;
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'nl-BE';
      utter.rate = 0.95;
      utter.pitch = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const nlVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('nl'));
      if (nlVoice) utter.voice = nlVoice;
      window.speechSynthesis.speak(utter);
    } catch (e) { console.warn('Speech failed', e); }
  }
  function askQuestion(a, b) { say(`Hoeveel is ${a} keer ${b}?`); }
  return { say, askQuestion };
})();
