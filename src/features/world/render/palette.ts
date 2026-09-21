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

/** Terra batida dos caminhos da vila (camada própria, por cima do terreno). */
export const CAMINHO = '#a8834f';

export const LINHA_COSTA = '#1d4a9e';
export const ONDA = '#5b9ef0';
export const BORDA_AREIA = '#c7a66a';

/**
 * Motivo: desenho pequeno dentro de um tile, em coordenadas de pixel de arte
 * (0 a ART-1). São poucos pixels, colocados de propósito — nada de ruído fino.
 */
export type Motivo = ReadonlyArray<readonly [number, number]>;

const TUFO: Motivo = [[1, 1], [1, 2]]; // grama em pé
const FOLHAS: Motivo = [[0, 2], [2, 1]]; // duas folhas caídas
const CAPIM: Motivo = [[0, 2], [1, 1], [2, 2]]; // capim seco em leque
const PEDRINHA: Motivo = [[1, 2], [2, 2]];
const RACHADURA: Motivo = [[0, 0], [1, 1], [2, 2]];
const RACHADURA_INV: Motivo = [[2, 0], [1, 1], [0, 2]]; // a outra diagonal, para não virar padrão
const MARCA: Motivo = [[1, 1], [2, 1]];
const ONDA_CURTA: Motivo = [[0, 1], [1, 1]];

/**
 * Textura do terreno. A leitura do bioma vem da cor e da forma da região;
 * a base de cada bioma é uma cor só, e o detalhe é secundário e esparso.
 *
 * - `chance` + `motivos`: chance de o tile receber UM motivo, sorteado entre os
 *   da lista. É o único detalhe dentro do bioma, e aparece a cada poucos tiles.
 * - `tom`: se o motivo é mais claro ou mais escuro que o terreno.
 * - `mistura`: chance de a borda do tile pegar a cor do bioma vizinho, sorteada
 *   em blocos de 2x2 pixels — a fronteira fica dentada, não granulada.
 */
export interface Textura {
  chance: number;
  motivos: readonly Motivo[];
  tom: 'claro' | 'escuro';
  mistura: number;
}

export const TEXTURA: Record<TileType, Textura> = {
  oceano: { chance: 0.02, motivos: [ONDA_CURTA], tom: 'claro', mistura: 0 },
  raso: { chance: 0.03, motivos: [ONDA_CURTA], tom: 'claro', mistura: 0 },
  lago: { chance: 0.02, motivos: [ONDA_CURTA], tom: 'claro', mistura: 0 },
  praia: { chance: 0.05, motivos: [PEDRINHA], tom: 'escuro', mistura: 0.2 },
  deserto: { chance: 0.06, motivos: [PEDRINHA, MARCA], tom: 'escuro', mistura: 0.25 },
  savana: { chance: 0.12, motivos: [CAPIM, TUFO], tom: 'escuro', mistura: 0.28 },
  planicie: { chance: 0.12, motivos: [TUFO, FOLHAS], tom: 'escuro', mistura: 0.28 },
  floresta: { chance: 0.14, motivos: [FOLHAS, TUFO], tom: 'escuro', mistura: 0.28 },
  tundra: { chance: 0.1, motivos: [PEDRINHA, MARCA], tom: 'escuro', mistura: 0.28 },
  montanha: { chance: 0.18, motivos: [RACHADURA, RACHADURA_INV, PEDRINHA], tom: 'escuro', mistura: 0.25 },
  neve: { chance: 0.04, motivos: [MARCA], tom: 'escuro', mistura: 0.25 },
};

// Paleta dos sprites: cada letra do desenho vira uma cor
export const SPAL: Record<string, string> = {
  R: '#8a3a2b', r: '#b5523b', w: '#efe2c4', d: '#5a3a2a', g: '#8fa6bd', s: '#ffd84a', b: '#8a5a34',
  k: '#3b2a22', t: '#3d6838', T: '#5f8f49', n: '#6b4a2e', c: '#6f9e4a', p: '#2e5a44', o: '#a39e96', e: '#7b5b3f',
};

export const TINTA = '#2a1e18'; // contorno dos sprites
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

const BRANCO: RGB = [255, 255, 255];
const PRETO: RGB = [0, 0, 0];

/**
 * Três tons de cada tipo de tile: base, um mais claro e um mais escuro.
 * O tom escuro usa a cor de PINTA quando existe (ela já foi calibrada à mão).
 */
export function tonsDoTile(tipo: TileType, P: (hex: string) => RGB): { base: RGB; claro: RGB; escuro: RGB } {
  const base = P(COR[tipo]);
  const pinta = PINTA[tipo];
  return {
    base,
    claro: mix(base, BRANCO, 0.14),
    escuro: pinta ? P(pinta) : mix(base, PRETO, 0.14),
  };
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
