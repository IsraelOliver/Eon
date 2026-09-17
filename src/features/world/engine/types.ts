export type Biome = 'deserto' | 'savana' | 'planicie' | 'floresta' | 'tundra';

export type TileType = Biome | 'oceano' | 'raso' | 'lago' | 'praia' | 'montanha' | 'neve';

export type ThemeKey = 'astronomia' | 'historia' | 'geologia' | 'natureza';

export type SpriteKey =
  | 'casa'
  | 'torre'
  | 'observatorio'
  | 'mina'
  | 'escavacao'
  | 'arvore'
  | 'pinheiro'
  | 'cacto'
  | 'acacia';

/** Gerador de números aleatórios entre 0 e 1. */
export type Rng = () => number;

/** O mundo gerado. Arrays indexados por y * W + x. */
export interface World {
  seed: number;
  alt: Float32Array;
  umi: Float32Array;
  agua: Uint8Array;
  tipo: TileType[];
  distAgua: Int16Array;
  distMont: Int16Array;
}

/** Um lugar candidato, com tudo que as regras dos temas precisam para dar nota. */
export interface Tile {
  x: number;
  y: number;
  tipo: TileType;
  e: number;
  distMont: number;
  distAgua: number;
  maisPerto: number;
  pertoHist: number;
  pertoGeo: number;
  pertoNat: number;
}

/** Algo que surgiu no mapa por causa de uma curiosidade aprendida. */
export interface Element {
  tema: ThemeKey;
  tipo: SpriteKey;
  x: number;
  y: number;
  protegido: boolean;
  desbotado: boolean;
  brilha: boolean;
}

export interface Theme {
  nome: string;
  /** Distância mínima até outros elementos. */
  min: number;
  /** null = lugar proibido; número = nota (maior é melhor). */
  pontuar(c: Tile): number | null;
  sprite(c: Tile, quantosDoTema: number): SpriteKey;
  motivo(c: Tile): string;
}

/** Toda ação devolve a nova lista de elementos e o texto para o log. */
export interface Resultado {
  elementos: Element[];
  mensagem: string;
}
