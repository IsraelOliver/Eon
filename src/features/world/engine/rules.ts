// =====================================================================
// REGRAS DO MUNDO — mexa aqui para mudar a geração
// =====================================================================
import type { Biome, TileType } from './types';

/** Tamanho do mundo em tiles. */
export const W = 300;
export const H = 200;

export const REGRAS = {
  nivelMar: 0.42, // altitude abaixo disso é água
  montanha: 0.76, // acima disso é montanha
  neve: 0.86, // acima disso é pico nevado
  queda: 0.36, // quanto a altitude cai nas bordas (forma de ilha)
  // umidade (0 a 1) decide o bioma
  umidade: [
    [0.22, 'deserto'],
    [0.4, 'savana'],
    [0.62, 'planicie'],
    [0.82, 'floresta'],
    [1.01, 'tundra'],
  ] as ReadonlyArray<readonly [number, Biome]>,
  // largura base da praia por bioma (o 3º ruído varia essa largura)
  praia: { deserto: 0, savana: 3, planicie: 3, floresta: 1, tundra: 1 } as Record<Biome, number>,
  aguaRasa: 2, // distância da terra que ainda conta como água rasa
};

/** Faixa permitida para o nível do mar no modo desenvolvedor (REGRAS continua sendo o padrão). */
export const FAIXA_NIVEL_MAR = { min: 0.3, max: 0.55, passo: 0.01 };

/** Sementes válidas. */
export const FAIXA_SEMENTE = { min: 1, max: 999999 };

export const NOMES: Record<TileType, string> = {
  oceano: 'Oceano profundo',
  raso: 'Oceano raso',
  lago: 'Lago',
  praia: 'Praia',
  deserto: 'Deserto',
  savana: 'Savana',
  planicie: 'Planície',
  floresta: 'Floresta',
  tundra: 'Tundra',
  montanha: 'Montanha',
  neve: 'Neve',
};
