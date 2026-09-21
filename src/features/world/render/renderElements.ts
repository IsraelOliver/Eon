import type { GrowthElement, NaturalElement, Orientacao, PathTile, SpriteKey, Variante } from '../engine/types';

/**
 * O que o desenho precisa saber de um elemento — só propriedades visuais.
 * Serve para a natureza (NaturalElement) e para a civilização (GrowthElement).
 */
export interface RenderElement {
  tipo: SpriteKey;
  x: number;
  y: number;
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
/** Distância (tiles) de um caminho em que a natureza some, para a rua ficar limpa. */
export const MARGEM_CAMINHO = 1;

/** Tira do desenho a natureza que caiu sobre a rua (o domínio não muda). */
function limparCaminhos(
  natureza: readonly NaturalElement[],
  caminhos: readonly PathTile[],
): readonly NaturalElement[] {
  if (!caminhos.length) return natureza;
  const ocupados = new Set<string>();
  for (const c of caminhos) {
    for (let dy = -MARGEM_CAMINHO; dy <= MARGEM_CAMINHO; dy++) {
      for (let dx = -MARGEM_CAMINHO; dx <= MARGEM_CAMINHO; dx++) ocupados.add(`${c.x + dx},${c.y + dy}`);
    }
  }
  return natureza.filter((n) => !ocupados.has(`${n.x},${n.y}`));
}

export function combinarParaDesenho(
  natureza: readonly NaturalElement[],
  crescimento: readonly GrowthElement[],
  caminhos: readonly PathTile[] = [],
): RenderElement[] {
  const construcoes = crescimento.filter((e) => CONSTRUCOES.has(e.tipo));
  const naturezaVisivel = limparCaminhos(abrirClareiras(natureza, construcoes), caminhos);
  return [...naturezaVisivel, ...crescimento].sort((a, b) => a.y - b.y);
}
