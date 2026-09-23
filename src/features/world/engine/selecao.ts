// =====================================================================
// TOCAR NUMA CONSTRUÇÃO — qual delas está sob o dedo.
//
// A área tocável é VISUAL: existe só para seleção e não tem nada a ver com as
// regras de colisão. Mexer aqui não muda onde as construções cabem.
// =====================================================================
import { retanguloDe } from './footprint';
import type { GrowthElement, SpriteKey } from './types';

/** Só a civilização é inspecionável por enquanto; natureza e caminhos não. */
export const INSPECIONAVEIS: ReadonlySet<SpriteKey> = new Set<SpriteKey>([
  'casa',
  'casa_maior',
  'fonte',
  'mina',
  'observatorio',
]);

/** Nome que o jogador vê. Fica aqui para não espalhar texto pelos componentes. */
export const NOME_DA_CONSTRUCAO: Partial<Record<SpriteKey, string>> = {
  casa: 'Casa da vila',
  casa_maior: 'Casa maior',
  fonte: 'Fonte da vila',
  mina: 'Mina',
  observatorio: 'Observatório',
};

/**
 * Tamanho tocável de quem não tem footprint, medido pela ARTE (px ÷ ART):
 * `mina.png` tem 17x9 px; o observatório é desenhado em caracteres, 9x8 px com
 * a margem do contorno.
 */
const ALVO_SEM_FOOTPRINT: Partial<Record<SpriteKey, { largura: number; altura: number }>> = {
  mina: { largura: 5.7, altura: 3 },
  observatorio: { largura: 3, altura: 2.7 },
};

/** Folga para o dedo, em tiles. Sprites pequenos ficariam impossíveis sem isto. */
const TOLERANCIA = 1;

/** Retângulo tocável (em tiles), ou null se o tipo não é inspecionável. */
function areaTocavel(elemento: GrowthElement) {
  if (!INSPECIONAVEIS.has(elemento.tipo)) return null;

  const doChao = retanguloDe(elemento.tipo, elemento.x, elemento.y);
  if (doChao) return doChao;

  const alvo = ALVO_SEM_FOOTPRINT[elemento.tipo];
  if (!alvo) return null;
  // Mesma ancoragem do desenho: meio do tile na horizontal, base no pé do tile.
  const meio = elemento.x + 0.5;
  return {
    esquerda: meio - alvo.largura / 2,
    direita: meio + alvo.largura / 2,
    topo: elemento.y + 1 - alvo.altura,
    base: elemento.y + 1,
  };
}

/**
 * A construção sob o ponto (em tiles), ou `null` para chão, natureza e caminho.
 *
 * Com mais de uma candidata, vence a que está **visualmente por cima**: o
 * desenho ordena por `y`, então quem tem o pé mais embaixo é desenhado depois.
 */
export function construcaoEm(
  construcoes: readonly GrowthElement[],
  x: number,
  y: number,
): GrowthElement | null {
  let escolhida: GrowthElement | null = null;

  for (const elemento of construcoes) {
    const area = areaTocavel(elemento);
    if (!area) continue;
    const dentro =
      x >= area.esquerda - TOLERANCIA &&
      x <= area.direita + TOLERANCIA &&
      y >= area.topo - TOLERANCIA &&
      y <= area.base + TOLERANCIA;
    if (!dentro) continue;
    // `>=` para que, com dois no mesmo y, o último da lista (desenhado depois) ganhe.
    if (!escolhida || elemento.y >= escolhida.y) escolhida = elemento;
  }

  return escolhida;
}
