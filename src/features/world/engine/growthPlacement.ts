// =====================================================================
// COLOCAÇÃO DO CRESCIMENTO — evento abstrato → lugar válido + sprite
//
// Estratégia (a mesma ideia do protótipo em placement.ts, sem reaproveitar
// o código dele): sorteia candidatos, rejeita lugares proibidos, dá nota,
// soma um pouco de acaso do Rng e fica com o melhor.
//
// Pura, determinística para a mesma sequência de Rng, não altera nada
// do que recebe. Indexada por WorldGrowthKind (não usa ThemeKey).
// =====================================================================
import { H, W } from './rules';
import type {
  Rng,
  SpriteKey,
  TileType,
  World,
  WorldGrowthEvent,
  WorldGrowthKind,
  WorldGrowthPlacementResult,
  WorldOccupant,
} from './types';

const TENTATIVAS = 400;
const ACASO = 0.8; // quanto o Rng mexe na nota, para não ficar robótico

/** Distância mínima (em tiles) até outro elemento; entre dois tipos usa-se a média. */
const DISTANCIA_MINIMA: Record<WorldGrowthKind, number> = {
  crescerVegetacao: 2,
  desenvolverPovoamento: 2.5,
  melhorarInfraestrutura: 3,
  ampliarExploracao: 3,
  desenvolverObservacao: 3.5,
};

/** Terreno onde nada se constrói nem cresce. */
const CONSTRUIVEL_PROIBIDO: TileType[] = ['praia', 'montanha', 'neve'];

const PLANTA_POR_BIOMA: Partial<Record<TileType, SpriteKey>> = {
  floresta: 'arvore',
  planicie: 'arvore',
  tundra: 'pinheiro',
  savana: 'acacia',
  deserto: 'cacto',
};

/** Um lugar candidato, já com as distâncias que as regras precisam. */
interface Candidato {
  x: number;
  y: number;
  tipo: TileType;
  alt: number;
  distAgua: number;
  distMont: number;
  /** Distância até o elemento mais próximo de cada tipo de evento (Infinity se não houver). */
  perto: Record<WorldGrowthKind, number>;
}

interface RegraDeCrescimento {
  /** null = lugar proibido; número = nota (maior é melhor). */
  pontuar(c: Candidato): number | null;
  sprite(c: Candidato): SpriteKey | null;
}

const REGRAS_CRESCIMENTO: Record<WorldGrowthKind, RegraDeCrescimento> = {
  crescerVegetacao: {
    pontuar(c) {
      const bases: Partial<Record<TileType, number>> = { floresta: 2, tundra: 2, planicie: 1, savana: 1, deserto: 0.6 };
      const base = bases[c.tipo];
      if (base === undefined) return null;
      return base + (c.perto.crescerVegetacao < 6 ? 1 : 0); // agrupamento moderado
    },
    sprite: (c) => PLANTA_POR_BIOMA[c.tipo] ?? null,
  },

  desenvolverPovoamento: {
    pontuar(c) {
      if (CONSTRUIVEL_PROIBIDO.includes(c.tipo)) return null;
      const bases: Partial<Record<TileType, number>> = { planicie: 2, savana: 1.5, floresta: 0.5, deserto: 0.3, tundra: 0.3 };
      const base = bases[c.tipo] ?? 0;
      return c.perto.desenvolverPovoamento < Infinity
        ? base + 4 - Math.min(c.perto.desenvolverPovoamento, 14) * 0.35 // vira vilarejo
        : base + 2 - Math.min(c.distAgua, 10) * 0.2; // o primeiro nasce perto da água
    },
    sprite: () => 'casa',
  },

  // Provisório: infraestrutura ainda não vira estrada nem melhora uma casa existente.
  // Por enquanto acrescenta uma construção mais desenvolvida perto do povoamento.
  melhorarInfraestrutura: {
    pontuar(c) {
      if (CONSTRUIVEL_PROIBIDO.includes(c.tipo)) return null;
      const bases: Partial<Record<TileType, number>> = { planicie: 1.5, savana: 1.2, floresta: 0.5, deserto: 0.3, tundra: 0.3 };
      const base = bases[c.tipo] ?? 0;
      const perto = Math.min(c.perto.desenvolverPovoamento, c.perto.melhorarInfraestrutura);
      return base + (perto < Infinity ? 4 - Math.min(perto, 12) * 0.4 : 0);
    },
    sprite: () => 'casa_upgrade',
  },

  ampliarExploracao: {
    pontuar(c) {
      if (c.tipo === 'neve') return null;
      if (c.distMont > 4) return null; // só junto às montanhas
      const perto = 4 - c.distMont * 0.8;
      const centroDeVila = Math.max(0, 4 - c.perto.desenvolverPovoamento) * 0.8; // evita o meio das casas
      return perto - centroDeVila;
    },
    sprite: () => 'mina',
  },

  desenvolverObservacao: {
    pontuar(c) {
      if (c.tipo === 'neve') return null;
      if (c.distMont > 6 && c.alt < 0.66) return null; // precisa estar alto ou perto das montanhas
      const montanha = c.distMont <= 6 ? 2 - c.distMont * 0.3 : 0;
      const isolamento = Math.min(c.perto.desenvolverPovoamento, 15) * 0.2;
      return c.alt * 4 + montanha + isolamento;
    },
    sprite: () => 'observatorio',
  },
};

const VAZIO: Record<WorldGrowthKind, number> = {
  crescerVegetacao: Infinity,
  desenvolverPovoamento: Infinity,
  melhorarInfraestrutura: Infinity,
  ampliarExploracao: Infinity,
  desenvolverObservacao: Infinity,
};

/**
 * Escolhe um lugar para o evento. Devolve a colocação ou o motivo de não achar lugar.
 * Nada do que entra é alterado. A intensidade é preservada, mas ainda não muda nada.
 */
export function colocarCrescimento(
  mundo: World,
  ocupantes: readonly WorldOccupant[],
  evento: WorldGrowthEvent,
  rng: Rng,
): WorldGrowthPlacementResult {
  const regra = REGRAS_CRESCIMENTO[evento.tipo];
  const minimoNovo = DISTANCIA_MINIMA[evento.tipo];
  let melhor: Candidato | null = null;
  let nota = -Infinity;

  for (let t = 0; t < TENTATIVAS; t++) {
    const x = 2 + Math.floor(rng() * (W - 4));
    const y = 3 + Math.floor(rng() * (H - 4));
    const i = y * W + x;
    if (mundo.agua[i]) continue; // nunca na água

    const perto = { ...VAZIO };
    let bloqueado = false;
    for (const o of ocupantes) {
      const d = Math.hypot(o.x - x, o.y - y);
      if (d < (minimoNovo + DISTANCIA_MINIMA[o.evento]) / 2) {
        bloqueado = true; // sobreposição visual
        break;
      }
      if (d < perto[o.evento]) perto[o.evento] = d;
    }
    if (bloqueado) continue;

    const c: Candidato = {
      x,
      y,
      tipo: mundo.tipo[i],
      alt: mundo.alt[i],
      distAgua: mundo.distAgua[i],
      distMont: mundo.distMont[i],
      perto,
    };
    const s = regra.pontuar(c);
    if (s === null || regra.sprite(c) === null) continue;
    const comAcaso = s + rng() * ACASO;
    if (comAcaso > nota) {
      nota = comAcaso;
      melhor = c;
    }
  }

  const tipo = melhor && regra.sprite(melhor);
  if (!melhor || !tipo) {
    return { status: 'semLugar', evento: evento.tipo, motivo: 'Nenhum lugar deste mundo atende às regras do evento.' };
  }
  return {
    status: 'colocado',
    colocacao: { evento: evento.tipo, tipo, x: melhor.x, y: melhor.y, intensidade: evento.intensidade },
  };
}
