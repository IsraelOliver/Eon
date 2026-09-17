import type { TileType } from '../engine/types';

export type RGB = [number, number, number];

// Cores do terreno
export const COR: Record<TileType, string> = {
  oceano: '#2a6fd6',
  raso: '#3b8ae6',
  lago: '#6cc0ee',
  praia: '#e4cc92',
  deserto: '#d8b676',
  savana: '#b9b56b',
  planicie: '#8c9c4b',
  floresta: '#5d7b3a',
  tundra: '#45603f',
  montanha: '#ad8e69',
  neve: '#eef1ec',
};

// Pintinhas de textura sobre o terreno
export const PINTA: Partial<Record<TileType, string>> = {
  deserto: '#c79f62',
  savana: '#8f8d4c',
  planicie: '#6f803c',
  floresta: '#46612c',
  tundra: '#33502e',
  montanha: '#8a6d50',
  praia: '#d3b87c',
};

export const LINHA_COSTA = '#1d4a9e';
export const ONDA = '#5b9ef0';
export const BORDA_AREIA = '#c7a66a';

// Paleta dos sprites: cada letra do desenho vira uma cor
export const SPAL: Record<string, string> = {
  R: '#8a3a2b', r: '#b5523b', w: '#efe2c4', d: '#5a3a2a', g: '#8fa6bd', s: '#ffd84a', b: '#8a5a34',
  k: '#3b2a22', t: '#3d6838', T: '#5f8f49', n: '#6b4a2e', c: '#6f9e4a', p: '#2e5a44', o: '#a39e96', e: '#7b5b3f',
};

export const TINTA = '#2a1e18'; // contorno dos sprites
export const NEVOA = '#cfd6d6'; // cor para onde os elementos esquecidos desbotam
const TELHADOS = new Set(['#8a3a2b', '#b5523b']);

export const hexRgb = (h: string): RGB => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

export const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export const LUZ = hexRgb('#fff3b0'); // brilho da revisão

// Modo pergaminho: tudo vira tons de tinta sobre papel
const PAPEL = hexRgb('#f1e0b8');
const TINTA_S = hexRgb('#4a3526');

function pal(hex: string, pergaminho: boolean): RGB {
  const c = hexRgb(hex);
  if (!pergaminho) return c;
  const lum = (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) / 255;
  const sep = mix(TINTA_S, PAPEL, Math.pow(lum, 0.8));
  return TELHADOS.has(hex) ? mix(sep, c, 0.55) : sep; // telhados mantêm um pouco de cor
}

/** Devolve um conversor hex → RGB com cache, no modo normal ou pergaminho. */
export function criarPaleta(pergaminho: boolean): (hex: string) => RGB {
  const cache = new Map<string, RGB>();
  return (hex) => {
    let c = cache.get(hex);
    if (!c) {
      c = pal(hex, pergaminho);
      cache.set(hex, c);
    }
    return c;
  };
}
