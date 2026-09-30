// =====================================================================
// A CONTA DO DISCOVERY FEED — onde cada post começa e quanto ele ocupa.
// Pura: números entram, números saem. Sem React e sem medir nada.
// =====================================================================

/** Piso de segurança: nenhum aparelho real chega perto. */
const ALTURA_MINIMA = 320;

/** A folga entre a borda de cima de um post e o chip do tema. */
export const FOLGA_DO_TOPO = 14;

export interface MedidasDoFeed {
  /**
   * Altura de uma página do feed: a **lista inteira** (a tela). A primeira
   * página é o header + o primeiro post; as outras, um post de borda a borda.
   */
  alturaDaPagina: number;
  /**
   * De onde o conteúdo de um post de tela cheia pode começar: abaixo da status
   * bar, com folga. (O primeiro post começa logo abaixo do header: só a folga.)
   */
  recuoTopo: number;
  /**
   * Onde o conteúdo tem de parar. A ActionBar flutua por cima do post: a
   * imagem passa por baixo dela de propósito, o texto nunca.
   */
  recuoBase: number;
}

/** `alturaDaLista` é a altura medida da lista — a tela, já que o header rola dentro dela. */
export function medidasDoFeed(
  alturaDaLista: number,
  insets: { top: number; bottom: number },
  espacoDaBarra: number,
): MedidasDoFeed {
  return {
    alturaDaPagina: Math.max(ALTURA_MINIMA, alturaDaLista),
    recuoTopo: insets.top + FOLGA_DO_TOPO,
    recuoBase: insets.bottom + espacoDaBarra + 14,
  };
}

/**
 * Onde começa o post `indice`, em pixels de rolagem.
 *
 * Toda página mede a lista inteira — a primeira também, porque o header e o
 * primeiro post DIVIDEM a primeira página. Então toda página começa num
 * múltiplo exato da altura da lista — nenhuma medida de header entra na conta.
 */
export function posicaoDoPost(alturaDoPost: number, indice: number): number {
  return indice * alturaDoPost;
}

/** As paradas do snap: uma por página, cada uma ocupando a lista inteira. */
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
