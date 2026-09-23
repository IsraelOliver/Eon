// =====================================================================
// A CONTA DO DISCOVERY FEED — onde cada post começa e quanto ele ocupa.
// Pura: números entram, números saem. Sem React e sem medir nada.
// =====================================================================

/** Piso de segurança: nenhum aparelho real chega perto. */
const ALTURA_MINIMA = 320;

export interface MedidasDoFeed {
  /** Altura de um post: a **viewport inteira**. A foto sangra até as bordas. */
  alturaDoPost: number;
  /** De onde o conteúdo pode começar: abaixo da status bar, com folga. */
  recuoTopo: number;
  /**
   * Onde o conteúdo tem de parar. A ActionBar flutua por cima do post: a
   * imagem passa por baixo dela de propósito, o texto nunca.
   */
  recuoBase: number;
}

export function medidasDoFeed(
  janela: { height: number },
  insets: { top: number; bottom: number },
  espacoDaBarra: number,
): MedidasDoFeed {
  return {
    alturaDoPost: Math.max(ALTURA_MINIMA, janela.height),
    recuoTopo: insets.top + 14,
    recuoBase: insets.bottom + espacoDaBarra + 14,
  };
}

/**
 * Onde começa o post `indice`, em pixels de rolagem.
 *
 * O cabeçalho (Éon + World Pulse) vem antes do primeiro post e tem altura
 * própria, medida no layout — é por isso que o feed usa `snapToOffsets` e não
 * `snapToInterval`: um passo fixo ignoraria o cabeçalho e desalinharia tudo a
 * partir do segundo post.
 */
export function posicaoDoPost(
  alturaDoCabecalho: number,
  alturaDoPost: number,
  indice: number,
): number {
  return alturaDoCabecalho + indice * alturaDoPost;
}

/**
 * As paradas do snap.
 *
 * A primeira é `0` de propósito: é a abertura da sessão, com o cabeçalho à
 * vista. Dali em diante, cada parada é um post inteiro ocupando a tela.
 */
export function paradasDoFeed(
  alturaDoCabecalho: number,
  alturaDoPost: number,
  quantidade: number,
): number[] {
  const posts = Array.from({ length: quantidade }, (_, i) =>
    posicaoDoPost(alturaDoCabecalho, alturaDoPost, i),
  );
  return [0, ...posts];
}

/**
 * Presença do título sem estourar em tela estreita: grande sempre, um pouco
 * menor só onde não caberia.
 */
export function tamanhoDoTitulo(largura: number): number {
  return largura < 380 ? 29 : 33;
}
