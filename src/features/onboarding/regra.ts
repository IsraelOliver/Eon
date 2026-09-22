// =====================================================================
// QUANDO A APRESENTAÇÃO DA JORNADA APARECE.
// Regra pura: a composição só pergunta.
// =====================================================================

export interface EstadoDaJornada {
  /** Quantas curiosidades já foram aprendidas nesta jornada. */
  aprendidas: number;
  /** A apresentação já foi dispensada nesta jornada? (vem do save) */
  onboardingConcluida: boolean;
  /** O mundo está sendo recriado agora? */
  gerando: boolean;
}

/**
 * A apresentação aparece uma vez por jornada, antes da primeira descoberta.
 *
 * - **Depois de dispensada, não volta** — nem ao reabrir o app, nem ao trocar de
 *   mundo, porque o estado é gravado no save e pertence à jornada, não à semente.
 * - **Quem já aprendeu nunca a vê**, mesmo que o save diga o contrário: se existe
 *   conhecimento, a jornada já começou.
 * - **Não aparece durante uma recriação**: primeiro o mundo novo fica pronto,
 *   depois a pessoa é apresentada a ele.
 */
export function deveMostrarIntroDaJornada(estado: EstadoDaJornada): boolean {
  if (estado.aprendidas > 0) return false;
  if (estado.onboardingConcluida) return false;
  if (estado.gerando) return false;
  return true;
}
