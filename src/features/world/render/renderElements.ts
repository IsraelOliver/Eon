import type { Element, GrowthElement } from '../engine/types';
import type { SpriteKey } from '../engine/types';

/**
 * O que o desenho precisa saber de um elemento — só propriedades visuais.
 * Serve tanto para o Element legado quanto para o GrowthElement do novo sistema.
 */
export interface RenderElement {
  tipo: SpriteKey;
  x: number;
  y: number;
  desbotado?: boolean;
  brilha?: boolean;
}

/**
 * Junta os dois sistemas só para desenhar, ordenando por y para que quem está
 * mais abaixo apareça por cima. Não altera as listas recebidas nem a ordem
 * guardada no engine. Elementos de crescimento ainda não desbotam nem brilham.
 */
export function combinarParaDesenho(
  legados: readonly Element[],
  crescimento: readonly GrowthElement[],
): RenderElement[] {
  return [...legados, ...crescimento].sort((a, b) => a.y - b.y);
}
