import type { Element, GrowthElement, NaturalElement, Orientacao, SpriteKey, Variante } from '../engine/types';

/**
 * O que o desenho precisa saber de um elemento — só propriedades visuais.
 * Serve para os três mundos: protótipo (Element), natureza (NaturalElement)
 * e civilização (GrowthElement).
 */
export interface RenderElement {
  tipo: SpriteKey;
  x: number;
  y: number;
  desbotado?: boolean;
  brilha?: boolean;
  /** Residências das vilas: escolhem qual PNG diagonal desenhar. */
  orientacao?: Orientacao;
  variante?: Variante;
}

/**
 * Raio (em tiles) da clareira em volta de cada construção: elementos naturais
 * dentro dele não são desenhados, para uma casa não aparecer em cima de uma árvore.
 * Temporário: um dia a urbanização vai mudar a natureza de verdade.
 */
export const RAIO_CLAREIRA = 6;

/** Sprites que abrem clareira. Plantas plantadas pelo jogador não abrem. */
const CONSTRUCOES: ReadonlySet<SpriteKey> = new Set([
  'casa',
  'casa_maior',
  'fonte',
  'mina',
  'observatorio',
  'torre',
  'escavacao',
]);

/**
 * Tira do DESENHO a natureza que ficou embaixo de construções.
 * `NaturalElement` no domínio não muda: continua a mesma lista da seed.
 */
function abrirClareiras(
  natureza: readonly NaturalElement[],
  construcoes: readonly { x: number; y: number }[],
): readonly NaturalElement[] {
  if (!construcoes.length) return natureza;
  const r2 = RAIO_CLAREIRA * RAIO_CLAREIRA;
  return natureza.filter((n) =>
    construcoes.every((c) => {
      const dx = n.x - c.x;
      const dy = n.y - c.y;
      return dx * dx + dy * dy > r2;
    }),
  );
}

/**
 * Junta as camadas só para desenhar, ordenando por y para que quem está mais
 * abaixo apareça por cima. Não altera as listas recebidas nem a ordem guardada
 * nos engines. Natureza e civilização continuam separadas no domínio.
 */
export function combinarParaDesenho(
  legados: readonly Element[],
  natureza: readonly NaturalElement[],
  crescimento: readonly GrowthElement[],
): RenderElement[] {
  const construcoes = [...legados, ...crescimento].filter((e) => CONSTRUCOES.has(e.tipo));
  const naturezaVisivel = abrirClareiras(natureza, construcoes);
  return [...legados, ...naturezaVisivel, ...crescimento].sort((a, b) => a.y - b.y);
}
