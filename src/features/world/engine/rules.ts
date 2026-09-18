// =====================================================================
// REGRAS DO MUNDO — mexa aqui para mudar a geração
// =====================================================================
import type { Biome, TileType } from './types';

/** Tamanho do mundo em tiles. */
export const W = 480;
export const H = 320;

/**
 * Escala em relação ao mundo do protótipo (150x100).
 * Tudo que é medido em tiles (praia, distâncias de colocação) cresce junto, e as
 * frequências do ruído diminuem na mesma proporção: assim o mundo ganha ilhas
 * MAIORES em tiles, e não mais ilhas do mesmo tamanho. É o que dá "respiro" ao
 * terreno e faz os sprites parecerem proporcionais.
 */
export const ESCALA_MUNDO = W / 150;

const tiles = (unidades: number) => Math.round(unidades * ESCALA_MUNDO);

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
  // largura base da praia por bioma, em tiles (o 3º ruído varia essa largura)
  praia: {
    deserto: 0,
    savana: tiles(3),
    planicie: tiles(3),
    floresta: tiles(1),
    tundra: tiles(1),
  } as Record<Biome, number>,
  aguaRasa: tiles(2), // distância da terra que ainda conta como água rasa
  /** Frequências dos ruídos, divididas pela escala (ver ESCALA_MUNDO). */
  frequencia: {
    altitude: 0.045 / ESCALA_MUNDO,
    umidade: 0.03 / ESCALA_MUNDO,
    detalhe: 0.2 / ESCALA_MUNDO,
  },
};

/**
 * Faixa de oceano garantida em volta do mapa, em tiles.
 * Nenhuma terra encosta na borda: a altitude é empurrada para baixo do nível do
 * mar de forma suave dentro dessa faixa, então a costa some sem virar moldura.
 */
export const MARGEM_OCEANO = tiles(8);

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
