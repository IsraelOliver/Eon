export type Biome = 'deserto' | 'savana' | 'planicie' | 'floresta' | 'tundra';

export type TileType = Biome | 'oceano' | 'raso' | 'lago' | 'praia' | 'montanha' | 'neve';

import type { ThemeKey } from '../../../shared/domain/themeKey';

export type { ThemeKey };

export type SpriteKey =
  | 'casa'
  /** Construção mais desenvolvida (representação provisória de infraestrutura). */
  | 'casa_upgrade'
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
  nivelMar: number;
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

/** O que o mundo pode tentar desenvolver (sem dizer onde nem com qual sprite). */
export type WorldGrowthKind =
  | 'crescerVegetacao'
  | 'desenvolverPovoamento'
  | 'melhorarInfraestrutura'
  | 'ampliarExploracao'
  | 'desenvolverObservacao';

/** Intenção abstrata de crescimento. Ex.: { tipo: 'crescerVegetacao', intensidade: 2 }. */
export interface WorldGrowthEvent {
  tipo: WorldGrowthKind;
  intensidade: number;
}

/** Algo que já ocupa um ponto do mapa, visto pelo novo sistema de crescimento. */
export interface WorldOccupant {
  evento: WorldGrowthKind;
  x: number;
  y: number;
}

/** Onde e como um evento vai aparecer. (x, y) é a âncora: a base do sprite, um tile só. */
export interface WorldGrowthPlacement {
  evento: WorldGrowthKind;
  tipo: SpriteKey;
  x: number;
  y: number;
  /** Guardada para progressão futura; hoje não muda a colocação. */
  intensidade: number;
}

export type WorldGrowthPlacementResult =
  | { status: 'colocado'; colocacao: WorldGrowthPlacement }
  | { status: 'semLugar'; evento: WorldGrowthKind; motivo: string };
