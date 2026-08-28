'use strict';

const Utils = {
  makeRng(seed) {
    let a = seed >>> 0;
    return function() {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  },
  randInt(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
  },
  randChoice(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  },
  clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  },
  hashSeed(seed) {
    let x = seed ^ 0x9e3779b9;
    x = Math.imul(x ^ x >>> 16, 0x85ebca6b);
    x = Math.imul(x ^ x >>> 13, 0xc2b2ae35);
    x ^= x >>> 16;
    return x >>> 0;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}