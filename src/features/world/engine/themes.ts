// =====================================================================
// REGRAS DOS TEMAS — onde cada curiosidade faz algo surgir
// pontuar() devolve null (lugar proibido) ou uma nota (maior = melhor)
// =====================================================================
import type { SpriteKey, Theme, ThemeKey, TileType } from './types';

const NA: Partial<Record<TileType, string>> = {
  deserto: 'no deserto',
  savana: 'na savana',
  planicie: 'na planície',
  floresta: 'na floresta',
  tundra: 'na tundra',
};

const PLANTA: Partial<Record<TileType, SpriteKey>> = {
  floresta: 'arvore',
  tundra: 'pinheiro',
  planicie: 'arvore',
  savana: 'acacia',
  deserto: 'cacto',
};

export const TEMAS: Record<ThemeKey, Theme> = {
  astronomia: {
    nome: 'Astronomia',
    min: 3.2,
    pontuar(c) {
      if (c.tipo === 'neve') return null;
      if (c.distMont > 6 && c.e < 0.66) return null; // precisa estar alto ou perto das montanhas
      return c.e * 4 + Math.min(c.maisPerto, 15) * 0.3; // quanto mais alto e isolado, melhor
    },
    sprite: () => 'observatorio',
    motivo: (c) =>
      `um observatório surgiu isolado, ${c.distMont === 0 ? 'no alto da montanha' : 'perto das montanhas'}`,
  },
  historia: {
    nome: 'História',
    min: 2.4,
    pontuar(c) {
      if (c.tipo === 'montanha' || c.tipo === 'neve' || c.tipo === 'praia') return null;
      const bases: Partial<Record<TileType, number>> = { planicie: 2, savana: 1.5, floresta: 0.5, deserto: 0.3, tundra: 0.3 };
      let s = bases[c.tipo] ?? 0;
      if (c.pertoHist < Infinity) s += 4 - Math.min(c.pertoHist, 14) * 0.35; // vilas concentradas
      else s += 2 - Math.min(c.distAgua, 10) * 0.2; // a primeira nasce perto da água
      return s;
    },
    sprite: (_c, n) => (n % 5 === 4 ? 'torre' : 'casa'),
    motivo: (c) =>
      c.pertoHist < Infinity ? 'uma casa se juntou à vila medieval' : 'uma vila começou perto da água',
  },
  geologia: {
    nome: 'Geologia',
    min: 2.6,
    pontuar(c) {
      if (c.tipo === 'neve') return null;
      const grupo = c.pertoGeo < 6 ? 1 : 0;
      if (c.tipo === 'deserto') return 2.5 + grupo;
      if (c.distMont <= 3) return 3.5 - c.distMont * 0.6 + grupo;
      return null;
    },
    sprite: (c) => (c.tipo === 'deserto' ? 'escavacao' : 'mina'),
    motivo: (c) =>
      c.tipo === 'deserto' ? 'um campo de escavação abriu no deserto' : 'uma mina abriu na montanha',
  },
  natureza: {
    nome: 'Natureza',
    min: 2.0,
    pontuar(c) {
      const bases: Partial<Record<TileType, number>> = { floresta: 2, tundra: 2, planicie: 1, savana: 1, deserto: 0.6 };
      const base = bases[c.tipo];
      if (base === undefined) return null;
      return base + (c.pertoNat < 4 ? 1.5 : 0);
    },
    sprite: (c) => PLANTA[c.tipo] ?? 'arvore',
    motivo: (c) => `uma planta nativa cresceu ${NA[c.tipo]}`,
  },
};

export const CHAVES_TEMAS = Object.keys(TEMAS) as ThemeKey[];
