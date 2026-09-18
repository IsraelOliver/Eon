// =====================================================================
// NATUREZA — decoração do mundo selvagem, gerada com a seed.
//
// Não é progresso: árvores, pedras e arbustos já existem antes de o jogador
// aprender qualquer coisa. Civilização (GrowthElement) é outra camada.
//
// Determinística sem Rng com estado: tudo sai de hash2(x, y, seed), a mesma
// função que dá textura ao terreno. Mesma seed → mesma natureza.
// =====================================================================
import { fbm, hash2 } from './noise';
import { ESCALA_MUNDO, H, W } from './rules';
import type { Biome, NaturalElement, NaturalSpriteKey, TileType } from './types';

/** Quanto o adensamento varia no espaço: valores baixos = bosques maiores. */
const FREQUENCIA_ADENSAMENTO = 0.09 / ESCALA_MUNDO;

interface RegraNatural {
  /** Lado da célula em tiles: cada célula tem no máximo um elemento, logo é a distância mínima. */
  espacamento: number;
  /** Chance de a célula receber algo, antes do adensamento local (0 a 1). */
  densidade: number;
  /** Expoente do adensamento: 1 espalha parelho, 3 faz mata fechada + clareiras. */
  agrupamento: number;
  /** Pesos dos sprites (somam 1). O primeiro é a planta do bioma; o resto é decoração. */
  sprites: ReadonlyArray<readonly [NaturalSpriteKey, number]>;
}

/** Paisagem de cada bioma — é aqui que se calibra a natureza, e em nenhum loop. */
const NATUREZA_POR_BIOMA: Record<Biome, RegraNatural> = {
  // mata fechada, com clareiras e muito arbusto
  floresta: { espacamento: 3, densidade: 0.95, agrupamento: 1.6, sprites: [['arvore', 0.76], ['arbusto', 0.2], ['pedra', 0.04]] },
  // pinheiros moderados e bastante pedra
  tundra: { espacamento: 5, densidade: 0.75, agrupamento: 1.4, sprites: [['pinheiro', 0.6], ['pedra', 0.32], ['arbusto', 0.08]] },
  // aberta: poucas árvores, em grupinhos
  planicie: { espacamento: 5, densidade: 0.4, agrupamento: 2.2, sprites: [['arvore', 0.28], ['arbusto', 0.5], ['pedra', 0.22]] },
  // acácias espaçadas, muito espaço livre entre grupos
  savana: { espacamento: 7, densidade: 0.5, agrupamento: 1.8, sprites: [['acacia', 0.5], ['arbusto', 0.3], ['pedra', 0.2]] },
  // grandes vazios; mais pedra do que cacto
  deserto: { espacamento: 8, densidade: 0.35, agrupamento: 1.3, sprites: [['cacto', 0.3], ['pedra', 0.7]] },
};

const BIOMAS = Object.keys(NATUREZA_POR_BIOMA) as Biome[];

/**
 * Adensamento local, de 0 a 1. O expoente `agrupamento` aumenta o contraste
 * entre regiões cheias e vazias, sem mexer na densidade média do bioma.
 */
function adensamento(x: number, y: number, seed: number, agrupamento: number): number {
  const v = fbm(x * FREQUENCIA_ADENSAMENTO, y * FREQUENCIA_ADENSAMENTO, seed + 4409, 3);
  const base = Math.min(1, Math.max(0, (v - 0.3) * 2.2));
  return Math.pow(base, agrupamento);
}

function escolherSprite(pesos: ReadonlyArray<readonly [NaturalSpriteKey, number]>, sorteio: number): NaturalSpriteKey {
  let acumulado = 0;
  for (const [sprite, peso] of pesos) {
    acumulado += peso;
    if (sorteio < acumulado) return sprite;
  }
  return pesos[pesos.length - 1][0];
}

/**
 * Espalha a decoração natural pelo mundo. Só em tiles de bioma: nunca em água,
 * praia, montanha ou neve.
 */
export function gerarNatureza(seed: number, tipo: TileType[], agua: Uint8Array): NaturalElement[] {
  const natureza: NaturalElement[] = [];

  // uma varredura por bioma, cada uma na sua grade: é isso que dá espaçamento próprio
  for (const bioma of BIOMAS) {
    const regra = NATUREZA_POR_BIOMA[bioma];
    const passo = regra.espacamento;

    for (let cy = 0; cy < H; cy += passo) {
      for (let cx = 0; cx < W; cx += passo) {
        // posição dentro da célula (evita alinhamento visível)
        const x = cx + Math.floor(hash2(cx, cy, seed + 101) * passo);
        const y = cy + Math.floor(hash2(cx, cy, seed + 211) * passo);
        if (x >= W || y >= H) continue;

        const i = y * W + x;
        if (agua[i] || tipo[i] !== bioma) continue;

        const chance = regra.densidade * adensamento(x, y, seed, regra.agrupamento);
        if (hash2(cx, cy, seed + 313) >= chance) continue;

        natureza.push({ tipo: escolherSprite(regra.sprites, hash2(cx, cy, seed + 419)), x, y });
      }
    }
  }
  return natureza;
}
