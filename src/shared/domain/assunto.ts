/**
 * Sobre o que uma notícia do mundo fala. Vocabulário comum entre o mundo (que
 * escreve a notícia) e o feed (que desenha o ícone ao lado dela).
 * Fica em shared para que nenhuma feature precise importar a outra.
 */
export type AssuntoDoMundo =
  | 'casa'
  /** O primeiro abrigo do mundo (marco da vila). */
  | 'cabana'
  /** O primeiro núcleo da vila (marco da vila). */
  | 'fogueira'
  | 'fonte'
  | 'caminho'
  | 'observatorio'
  | 'mina'
  | 'natureza'
  /** O mundo ainda sem construção nenhuma: só terreno e natureza. */
  | 'paisagem';
