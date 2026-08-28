/**
 * audio.js
 * 程序化音效合成（WebAudio），无外部音频资源。
 * 若浏览器不支持 AudioContext，则静默降级。
 */
window.RDL = window.RDL || {};

RDL.audio = (function() {
  let ctx = null;
  let masterGain = null;
  let enabled = true;

  function init() {
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) throw new Error('AudioContext not supported');
      ctx = new AudioCtor();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.6;
      masterGain.connect(ctx.destination);
    } catch (e) {
      console.warn('[audio] WebAudio unavailable, sound disabled.', e);
      ctx = null;
      masterGain = null;
      enabled = false;
    }
  }

  function playTone(freq, duration, type, volume, sweepTo) {
    if (!enabled || !ctx || !masterGain) return;

    try {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, now);
      if (sweepTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), now + duration);
      }

      gainNode.gain.setValueAtTime(volume || 0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gainNode);
      gainNode.connect(masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (e) {}
  }

  const sfx = {
    attack: function() { playTone(180, 0.12, 'square', 0.3, 80); },
    hurt: function() { playTone(110, 0.2, 'sawtooth', 0.25, 50); },
    pickup: function() { playTone(660, 0.08, 'sine', 0.25, 880); },
    equip: function() { playTone(520, 0.1, 'triangle', 0.25, 700); },
    stair: function() { playTone(300, 0.2, 'sine', 0.3, 600); },
    levelup: function() { playTone(440, 0.1, 'square', 0.3, 660); playTone(660, 0.1, 'square', 0.3, 880); },
    death: function() { playTone(200, 0.5, 'sawtooth', 0.3, 30); }
  };

  function play(name) {
    if (!enabled || !ctx) return;
    const fn = sfx[name];
    if (fn) {
      fn();
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(function() {});
    }
  }

  function suspend() {
    if (ctx && ctx.state === 'running') {
      ctx.suspend().catch(function() {});
    }
  }

  init();

  return {
    init: init,
    play: play,
    resume: resume,
    suspend: suspend,
    get enabled() { return enabled; }
  };
})();