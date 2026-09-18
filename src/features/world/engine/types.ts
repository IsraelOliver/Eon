export type Biome = 'deserto' | 'savana' | 'planicie' | 'floresta' | 'tundra';

export type TileType = Biome | 'oceano' | 'raso' | 'lago' | 'praia' | 'montanha' | 'neve';

import type { ThemeKey } from '../../../shared/domain/themeKey';

export type { ThemeKey };

export type SpriteKey =
  /** Residência. No protótipo (Element) é a casa frontal antiga; nas vilas, a diagonal. */
  | 'casa'
  /** Residência maior, de mais importância (resultado de melhorarInfraestrutura). */
  | 'casa_maior'
  /** Marco central da vila (no máximo uma por Settlement). */
  | 'fonte'
  | 'torre'
  | 'observatorio'
  | 'mina'
  | 'escavacao'
  | 'arvore'
  | 'pinheiro'
  | 'cacto'
  | 'acacia'
  // decoração natural (pedra e arbusto ainda não têm PNG: usam o desenho provisório)
  | 'pedra'
  | 'arbusto';

/** Sprites que o mundo natural usa. Subconjunto de SpriteKey. */
export type NaturalSpriteKey = Extract<SpriteKey, 'arvore' | 'pinheiro' | 'acacia' | 'cacto' | 'pedra' | 'arbusto'>;

/**
 * Decoração natural: nasce com o mundo, a partir da seed.
 * Não tem tema nem evento de crescimento — não é progresso, é ambiente.
 */
export interface NaturalElement {
  tipo: NaturalSpriteKey;
  x: number;
  y: number;
}

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
  /** Centro da massa habitável e distância média até ele (em tiles). */
  centro: { x: number; y: number; raio: number };
  /** Árvores, pedras e arbustos do mundo selvagem. Mesma seed, mesma natureza. */
  natureza: NaturalElement[];
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
  /** Sprite concreto: decide quanto espaço o elemento pede. Sem ele, vale o evento. */
  tipo?: SpriteKey;
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

/**
 * Elemento criado pelo novo sistema de crescimento.
 * Não tem ThemeKey: o que ele é vem do evento, não do tema educacional.
 * (O `Element` legado, com tema, continua sendo do protótipo.)
 */
/** Para que lado a casa está virada (qual parede tem a porta). */
export type Orientacao = 'frente' | 'tras';
/** Variação de desenho da mesma construção, para quebrar repetição. */
export type Variante = 'v1' | 'v2';

export interface GrowthElement {
  evento: WorldGrowthKind;
  /** Função estrutural (casa, casa_maior, fonte, mina…). Não é o nome do PNG. */
  tipo: SpriteKey;
  x: number;
  y: number;
  /** Metadado para progressão futura; um evento gera no máximo um elemento. */
  intensidade: number;
  /** Assentamento a que pertence (casas, casas maiores, fonte). Mina e observatório não têm. */
  settlementId?: string;
  /** Aparência das residências. O render escolhe o PNG a partir disto. */
  orientacao?: Orientacao;
  variante?: Variante;
}

/**
 * Assentamento: o núcleo lógico de uma vila. Não é desenhado; organiza onde as
 * construções nascem. Sem população nem economia por enquanto.
 */
export interface Settlement {
  /** 'vila-1', 'vila-2'…, na ordem de criação (determinístico). */
  id: string;
  /** Centro lógico, em tiles. Não precisa coincidir com nenhuma construção. */
  x: number;
  y: number;
  /** Distância (tiles) do elemento mais afastado até o centro. */
  raio: number;
  quantidadeElementos: number;
  /** Posição da fonte, quando a vila já tem uma (no máximo uma por vila). */
  fonte?: { x: number; y: number };
}

/** Resultado de aplicar uma sequência de eventos de crescimento. */
export interface GrowthResult {
  /** Lista final: os que já existiam mais os novos. */
  elementos: GrowthElement[];
  /** Só os criados nesta execução, na ordem dos eventos. */
  adicionados: GrowthElement[];
  /** Eventos que não encontraram lugar, na ordem em que foram processados. */
  semLugar: WorldGrowthKind[];
  /** Assentamentos depois desta execução (lista nova; a recebida não muda). */
  settlements: Settlement[];
}
