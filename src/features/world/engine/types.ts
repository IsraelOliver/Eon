export type Biome = 'deserto' | 'savana' | 'planicie' | 'floresta' | 'tundra';

export type TileType = Biome | 'oceano' | 'raso' | 'lago' | 'praia' | 'montanha' | 'neve';

export type SpriteKey =
  /** Residência da vila (PNG diagonal, com orientação e variante). */
  | 'casa'
  /** Residência maior, de mais importância (resultado de melhorarInfraestrutura). */
  | 'casa_maior'
  /** Marco central da vila (no máximo uma por Settlement). */
  | 'fonte'
  /** Marco inicial: o primeiro abrigo do mundo (engine/marcos.ts). */
  | 'cabana'
  /** Marco inicial: o lugar começa a virar núcleo (engine/marcos.ts). */
  | 'fogueira'
  | 'observatorio'
  | 'mina'
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
 * O que ele é vem do evento de crescimento, não de tema educacional.
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
  /**
   * Qual conhecimento fez isto existir. Para o mundo é um identificador OPACO:
   * ele não sabe o que significa. Quem traduz em título é a composição, que
   * conhece as duas features. Ausente em construções do modo dev e nas de saves
   * anteriores a este campo. Num marco, é o mesmo que `marco.gatilho`.
   */
  origemConhecimentoId?: string;
  /**
   * Presente só no que a PROGRESSÃO da vila criou (marcos e crescimento comum):
   * qual degrau é, e a memória de quem o formou. O nome ficou `marco` porque já
   * vai para o save.
   */
  marco?: OrigemDoMarco;
  /**
   * As vezes em que esta construção EVOLUIU, em ordem. Evoluir não apaga nada:
   * posição, `marco` (a criação) e `origemConhecimentoId` ficam; só `tipo` (e a
   * aparência) mudam, e o capítulo novo entra aqui. Ausente = nunca evoluiu.
   */
  evolucoes?: EvolucaoDaConstrucao[];
}

/** Um capítulo da vida de uma construção: ela subiu de estágio no mesmo lugar. */
export interface EvolucaoDaConstrucao {
  /** O degrau que causou a evolução (engine/marcos.ts). */
  marco: MarcoId;
  /** A curiosidade que completou esse degrau. Opaca para o mundo. */
  gatilho: string;
  /** As que contribuíram até ali, em ordem. */
  contribuintes: string[];
  /** O tipo antes e depois. */
  de: SpriteKey;
  para: SpriteKey;
}

/**
 * Os degraus da progressão da vila (engine/marcos.ts). Ids ESTÁVEIS: vão para o
 * save. Cada limiar é um id — é isso que impede o mesmo limiar de construir duas vezes.
 */
export type MarcoId =
  | 'primeira-cabana'
  | 'primeira-fogueira'
  | 'segunda-cabana'
  | 'vila-casa-8'
  | 'evolucao-primeira-cabana'
  | 'evolucao-segunda-cabana'
  | 'evolucao-casa-grande-20'
  | 'trilhas-8'
  | 'trilhas-12'
  | 'trilhas-16'
  | 'trilhas-20'
  // Legado: sequência anterior do playtest. Não acontecem mais, mas podem
  // estar num save — continuam sendo lidos (LEGADO, em marcos.ts).
  | 'vila-casa-5'
  | 'vila-casa-grande-12'
  | 'vila-casa-16'
  | 'vila-casa-grande-20';

/**
 * A memória de origem de um marco. Os ids das curiosidades são OPACOS para o
 * mundo, como `origemConhecimentoId`: quem os traduz em título é a composição.
 */
export interface OrigemDoMarco {
  id: MarcoId;
  /** A curiosidade que COMPLETOU o marco (a 1ª para a cabana, a 3ª para a fogueira). */
  gatilho: string;
  /** Todas as que contribuíram, na ordem em que foram aprendidas (o gatilho é a última). */
  contribuintes: string[];
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
  /**
   * Rede de caminhos da vila. Na progressão, é refeita por inteiro a cada
   * mudança, a partir do `nivelDosCaminhos` (engine/paths.ts, `redeDaVila`).
   */
  caminhos: PathTile[];
  /** Quantas rotas viraram eixo principal (as primeiras depois da praça). */
  viasPrincipais: number;
  /**
   * Quão madura é a rede de caminhos (0 a 4): 0 é acampamento, sem caminho;
   * depois trilhas, cada vez mais marcadas e ligadas. Quem sobe é a progressão
   * (efeito `caminhos`, engine/marcos.ts). Ausente = 0 (saves antigos).
   */
  nivelDosCaminhos?: NivelDosCaminhos;
}

/** Maturidade da rede de caminhos da vila. 0 = nenhum caminho (acampamento). */
export type NivelDosCaminhos = 0 | 1 | 2 | 3 | 4;

/** Função de cada trecho da rede: eixo da vila, ligação de grupo ou entrada de casa. */
export type PathKind = 'principal' | 'secundario' | 'acesso';

/** Um tile de caminho. Pertence à vila que o guarda, por isso não repete o id. */
export interface PathTile {
  x: number;
  y: number;
  tipo: PathKind;
  /**
   * Quão marcada é a terra aqui, de 0 a 1 — a OPACIDADE dos pixels de terra.
   * Ausente = 1 (os caminhos do crescimento por evento, que já nascem feitos).
   */
  forca?: number;
  /**
   * Largura VISUAL da trilha, em fração de tile (0 a 1). O traçado da
   * progressão tem sempre 1 tile; o desenho é que fica mais fino ou mais
   * cheio. Ausente = 1.
   */
  espessura?: number;
  /**
   * Quanto da trilha já é terra (0 a 1): o resto dos pixels continua grama. É o
   * "desgaste" — pouca cobertura parece grama gasta; muita, terra batida. A
   * terra aparece primeiro no meio da trilha. Ausente = 1.
   */
  cobertura?: number;
}

/**
 * O que precisa ser guardado de um mundo para ele voltar igual.
 * Tudo o mais (terreno, biomas, natureza, distâncias) sai de seed + nivelMar.
 */
export interface WorldSnapshot {
  seed: number;
  nivelMar: number;
  crescimento: GrowthElement[];
  settlements: Settlement[];
  /** Quantas execuções de crescimento este mundo já teve. */
  growthSequence: number;
}

/** Resultado de aplicar uma sequência de eventos de crescimento. */
export interface GrowthResult {
  /** Lista final: os que já existiam mais os novos. */
  elementos: GrowthElement[];
  /** Só os criados nesta execução, na ordem dos eventos. */
  adicionados: GrowthElement[];
  /** As construções que EVOLUÍRAM nesta execução, já no estágio novo (mesmo lugar). */
  evoluidos: GrowthElement[];
  /** O que mudou sem ser construção (a rede de caminhos, por exemplo), já em frase. */
  avisos?: string[];
  /** Eventos que não encontraram lugar, na ordem em que foram processados. */
  semLugar: WorldGrowthKind[];
  /** Assentamentos depois desta execução (lista nova; a recebida não muda). */
  settlements: Settlement[];
}
