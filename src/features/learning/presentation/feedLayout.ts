// =====================================================================
// A CONTA DO DISCOVERY FEED — onde cada post começa e quanto ele ocupa.
// Pura: números entram, números saem. Sem React e sem medir nada.
// =====================================================================

/** Piso de segurança: nenhum aparelho real chega perto. */
const ALTURA_MINIMA = 320;

export interface MedidasDoFeed {
  /**
   * Altura de um post: a **área da timeline** inteira — da linha que fecha o
   * header até o pé da tela. A foto sangra até as bordas dessa área.
   */
  alturaDoPost: number;
  /** De onde o conteúdo pode começar: logo abaixo do header, com folga. */
  recuoTopo: number;
  /**
   * Onde o conteúdo tem de parar. A ActionBar flutua por cima do post: a
   * imagem passa por baixo dela de propósito, o texto nunca.
   */
  recuoBase: number;
}

/**
 * `alturaDaTimeline` é a altura medida da lista. O header é fixo e fica fora
 * dela, então a safe area de cima já foi consumida por ele: aqui só a de baixo
 * conta.
 */
export function medidasDoFeed(
  alturaDaTimeline: number,
  insets: { bottom: number },
  espacoDaBarra: number,
): MedidasDoFeed {
  return {
    alturaDoPost: Math.max(ALTURA_MINIMA, alturaDaTimeline),
    recuoTopo: 14,
    recuoBase: insets.bottom + espacoDaBarra + 14,
  };
}

/**
 * Onde começa o post `indice`, em pixels de rolagem.
 *
 * O header (Éon + World Pulse) fica FORA da lista, fixo acima dela. Então todo
 * post começa num múltiplo exato da altura da timeline — nenhuma medida de
 * header entra na conta.
 */
export function posicaoDoPost(alturaDoPost: number, indice: number): number {
  return indice * alturaDoPost;
}

/** As paradas do snap: uma por post, cada uma ocupando a timeline inteira. */
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
