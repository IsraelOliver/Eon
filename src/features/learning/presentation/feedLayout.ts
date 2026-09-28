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
 * O cabeçalho (Éon + World Pulse) não ocupa espaço próprio: ele flutua SOBRE o
 * primeiro post, que começa no topo da tela. Então todo post começa num
 * múltiplo exato da viewport — nenhuma medida de cabeçalho entra na conta.
 */
export function posicaoDoPost(alturaDoPost: number, indice: number): number {
  return indice * alturaDoPost;
}

/** As paradas do snap: uma por post, cada uma ocupando a tela inteira. */
export function paradasDoFeed(alturaDoPost: number, quantidade: number): number[] {
  return Array.from({ length: quantidade }, (_, i) => posicaoDoPost(alturaDoPost, i));
}

/**
 * Presença do título sem estourar em tela estreita: grande sempre, um pouco
 * menor só onde não caberia.
 */
export function tamanhoDoTitulo(largura: number): number {
  return largura < 380 ? 29 : 33;
}
