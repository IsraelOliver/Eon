import type { Rng } from './types';

/** Gerador aleatório simples a partir de uma semente. */
export function mulberry32(seed: number): Rng {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Número "aleatório" fixo (0 a 1) para cada (x, y, semente). */
export function hash2(x: number, y: number, s: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Interpola suavemente os hashes dos 4 cantos da célula. */
export function valueNoise(x: number, y: number, s: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s);
  const b = hash2(xi + 1, yi, s);
  const c = hash2(xi, yi + 1, s);
  const d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Soma várias camadas (oitavas) de ruído: detalhes grandes + pequenos. */
export function fbm(x: number, y: number, s: number, oitavas: number): number {
  let soma = 0;
  let amp = 1;
  let f = 1;
  let norm = 0;
  for (let i = 0; i < oitavas; i++) {
    soma += valueNoise(x * f, y * f, s + i * 101) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return soma / norm;
}

/** Estica os valores para ocuparem de 0 a 1 (altera o array). */
export function normalizar(arr: Float32Array): void {
  let mn = Infinity;
  let mx = -Infinity;
  for (const v of arr) {
    if (v < mn) mn = v;
    if (v > mx) mx = v;
  }
  const r = mx - mn || 1;
  for (let i = 0; i < arr.length; i++) arr[i] = (arr[i] - mn) / r;
}
