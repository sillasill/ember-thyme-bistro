// A small seeded random number generator (mulberry32) so a screenshot scene
// and a play-test replay come out the same every time from the same seed.
// Nothing in the game reads Math.random: every roll goes through this.

export function makeRng(seed) {
  let state = seed >>> 0;
  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    pick(list) {
      return list[Math.floor(this.next() * list.length)];
    },
  };
}
