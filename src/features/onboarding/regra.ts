// =====================================================================
// QUANDO AS BOAS-VINDAS AO MUNDO APARECEM.
// Regra pura: a composição só pergunta.
// =====================================================================

export interface EstadoDaJornada {
  /** Quantas curiosidades já foram aprendidas nesta jornada. */
  aprendidas: number;
  /**
   * As boas-vindas ao Mundo já foram vistas nesta jornada? (vem do save)
   * O nome é histórico: o campo já existia no SaveV2 com este significado de
   * "a apresentação da jornada já passou".
   */
  onboardingConcluida: boolean;
  /** O mundo está sendo recriado agora? */
  gerando: boolean;
  /** O Mundo é o destino agora (o Discovery está fechado)? */
  noMundo: boolean;
}

/**
 * As boas-vindas aparecem uma vez por jornada: na PRIMEIRA visita ao Mundo
 * depois do primeiro aprendizado — quando já há algo do conhecimento nele.
 *
 * - **Antes de aprender, nunca:** o primeiro uso começa no Discovery, e o Mundo
 *   ainda não tem nada a dizer.
 * - **Depois de vistas, não voltam** — nem ao reabrir o app, porque o estado é
 *   gravado no save e pertence à jornada.
 * - **Só no Mundo:** com o Discovery aberto, esperam a pessoa ir até lá.
 * - **Não aparecem durante uma recriação**: primeiro o mundo fica pronto.
 */
export function deveMostrarIntroDaJornada(estado: EstadoDaJornada): boolean {
  if (estado.aprendidas === 0) return false;
  if (estado.onboardingConcluida) return false;
  if (estado.gerando) return false;
  return estado.noMundo;
}
