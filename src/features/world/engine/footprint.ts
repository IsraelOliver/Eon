// =====================================================================
// FOOTPRINT — quanto espaço cada construção ocupa no chão.
//
// Os sprites são ancorados na BASE: a âncora (x, y) é o meio do pé do tile, e o
// desenho sobe a partir dela. Por isso o espaço de uma construção é um retângulo
// que vai da base para cima — e não um círculo em volta da âncora (um círculo
// deixava o telhado de uma casa de baixo passar por cima da construção de cima).
//
// Medidas em TILES, não em unidades: o PNG tem tamanho fixo em pixels de arte e
// não cresce quando o mundo cresce. Conta igual à do render (WorldSprites).
// =====================================================================
import { emTiles } from './escala';
import type { SpriteKey } from './types';

export interface BuildingFootprint {
  /** Largura do sprite, em tiles (o maior PNG do papel, em px, convertido pela escala). */
  largura: number;
  /** Altura do sprite, da base ao topo, em tiles. */
  altura: number;
  /** Espaço livre mínimo em volta, em tiles. Entre duas construções somam-se as folgas. */
  folga: number;
}

/**
 * O tamanho da ARTE de cada construção, em pixels — o MAIOR PNG de cada papel,
 * já com a sombra. É daqui que sai o espaço no chão: em tiles, pela escala do
 * mundo (`emTiles`), então mudar PIXELS_POR_TILE mantém as colisões certas.
 * Se uma arte mudar de tamanho, atualize aqui.
 */
const ARTE_PX: Partial<Record<SpriteKey, { largura: number; altura: number }>> = {
  casa: { largura: 21, altura: 16 },
  casa_maior: { largura: 31, altura: 22 },
  fonte: { largura: 22, altura: 12 },
  cabana: { largura: 22, altura: 15 },
  fogueira: { largura: 14, altura: 16 },
  telescopio: { largura: 15, altura: 18 },
  posto_de_observacao: { largura: 24, altura: 17 },
};

/** Folga em volta de cada construção, em tiles. */
const FOLGA: Partial<Record<SpriteKey, number>> = {
  casa: 0.5,
  casa_maior: 1,
  fonte: 0, // o respiro da fonte é a praça (settlements.ts)
  cabana: 0.5,
  fogueira: 0.5,
  telescopio: 0.5,
  posto_de_observacao: 0.5,
};

/** Construções com retângulo, em tiles. */
export const FOOTPRINT: Partial<Record<SpriteKey, BuildingFootprint>> = Object.fromEntries(
  Object.entries(ARTE_PX).map(([tipo, px]) => [
    tipo,
    { largura: emTiles(px!.largura), altura: emTiles(px!.altura), folga: FOLGA[tipo as SpriteKey] ?? 0 },
  ]),
);

/** Folga extra (tiles) para pares que pedem mais respiro que a soma das folgas. */
const FOLGA_ENTRE: Partial<Record<`${SpriteKey}|${SpriteKey}`, number>> = {
  'casa_maior|casa_maior': 3,
};

export interface Retangulo {
  esquerda: number;
  direita: number;
  topo: number;
  base: number;
}

export interface Circulo {
  x: number;
  y: number;
  raio: number;
}

/** Retângulo ocupado no chão (sem folga), ou null se o sprite não tem footprint. */
export function retanguloDe(tipo: SpriteKey | undefined, x: number, y: number): Retangulo | null {
  const f = tipo && FOOTPRINT[tipo];
  if (!f) return null;
  const meio = x + 0.5;
  return { esquerda: meio - f.largura / 2, direita: meio + f.largura / 2, topo: y + 1 - f.altura, base: y + 1 };
}

/**
 * Onde fica a "porta" da construção no chão: o tile logo abaixo da base, do lado
 * da parede com a porta (`frente` = esquerda, `tras` = direita). É até aqui que o
 * caminho precisa chegar — nunca até o centro do PNG.
 * Quando a construção não tem orientação (fonte, protótipo), vale o tile de baixo.
 */
export function pontoDeEntrada(
  construcao: { x: number; y: number; orientacao?: 'frente' | 'tras' },
): { x: number; y: number } {
  const lado = construcao.orientacao === 'frente' ? -1 : construcao.orientacao === 'tras' ? 1 : 0;
  return { x: construcao.x + lado, y: construcao.y + 1 };
}

/** Centro visual do sprite (metade da altura acima da base). */
export function centroVisual(tipo: SpriteKey, x: number, y: number): { x: number; y: number } {
  const f = FOOTPRINT[tipo];
  return { x: x + 0.5, y: y + 1 - (f ? f.altura / 2 : 0.5) };
}

/**
 * As duas construções ficam perto demais? Os retângulos não podem chegar a menos
 * de (folga de uma + folga da outra + folga extra do par). Devolve null se alguma
 * delas não tem footprint — aí vale a distância entre âncoras de growthPlacement.
 */
export function construcoesSeTocam(
  a: { tipo?: SpriteKey; x: number; y: number },
  b: { tipo?: SpriteKey; x: number; y: number },
): boolean | null {
  const ra = retanguloDe(a.tipo, a.x, a.y);
  const rb = retanguloDe(b.tipo, b.x, b.y);
  if (!ra || !rb || !a.tipo || !b.tipo) return null;
  const folga = FOOTPRINT[a.tipo]!.folga + FOOTPRINT[b.tipo]!.folga + (FOLGA_ENTRE[`${a.tipo}|${b.tipo}`] ?? 0);
  return (
    ra.esquerda - folga < rb.direita &&
    rb.esquerda < ra.direita + folga &&
    ra.topo - folga < rb.base &&
    rb.topo < ra.base + folga
  );
}

/** O retângulo invade o círculo? (ponto do retângulo mais perto do centro está dentro) */
export function retanguloTocaCirculo(r: Retangulo, c: Circulo): boolean {
  const px = Math.min(Math.max(c.x, r.esquerda), r.direita);
  const py = Math.min(Math.max(c.y, r.topo), r.base);
  return (px - c.x) ** 2 + (py - c.y) ** 2 < c.raio * c.raio;
}
