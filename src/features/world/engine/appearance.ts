// =====================================================================
// APARÊNCIA DAS CONSTRUÇÕES — orientação e variante.
//
// O engine decide só o papel (casa, casa_maior…) e estes dois detalhes;
// o render traduz para o PNG. Nada aqui conhece nome de arquivo.
// =====================================================================
import { hash2 } from './noise';
import type { Orientacao, Variante } from './types';

/**
 * Para que lado a casa olha. As artes diagonais mostram as duas paredes voltadas
 * para a câmera; `frente` tem a porta na parede da esquerda e `tras` na da direita.
 * Então: casa à direita da referência olha para a esquerda (`frente`); à esquerda,
 * olha para a direita (`tras`).
 *
 * `referencia` hoje é a fonte (ou o centro da vila). Quando existirem ruas, basta
 * passar o ponto do caminho mais próximo — a regra continua a mesma.
 */
export function escolherOrientacaoCasa(
  casa: { x: number; y: number },
  referencia: { x: number; y: number },
  seed: number,
): Orientacao {
  const dx = casa.x - referencia.x;
  if (dx > 0) return 'frente';
  if (dx < 0) return 'tras';
  return hash2(casa.x, casa.y, seed + 61) < 0.5 ? 'frente' : 'tras'; // bem em cima do eixo
}

/** v1 ou v2: pseudoaleatório pela posição e pela seed, para misturar sem repetir padrão. */
export function escolherVariante(x: number, y: number, seed: number): Variante {
  return hash2(x, y, seed + 67) < 0.5 ? 'v1' : 'v2';
}
