// =====================================================================
// A NAVEGAÇÃO MUNDO ↔ DISCOVERY — onde cada coisa está num dado progresso.
// Pura: número entra, número sai. As funções marcadas 'worklet' também rodam
// na thread de UI, dentro dos estilos animados.
// =====================================================================

/** Quanto o Mundo recua quando o Discovery passa na frente: 10% da largura. */
export const PARALLAX_DO_MUNDO = 0.1;

/** A travessia inteira, de uma página à outra. Rápida, sem ser brusca. */
export const DURACAO_DA_NAVEGACAO = 280;

/** Piso da duração: uma inversão pertinho do fim ainda precisa se ver. */
export const DURACAO_MINIMA = 90;

function limitar(progresso: number): number {
  'worklet';
  return Math.min(1, Math.max(0, progresso));
}

/**
 * Onde o Discovery está. Em 0 (Mundo) ele espera inteiro à direita, fora da
 * tela; em 1 ele ocupa a viewport. A largura é a real do aparelho, nunca fixa.
 */
export function deslocamentoDoDiscovery(progresso: number, largura: number): number {
  'worklet';
  return (1 - limitar(progresso)) * largura;
}

/**
 * Onde o Mundo está. Ele não sai da tela: recua um pouco para a esquerda
 * enquanto o Discovery passa por cima — é o que dá a sensação de profundidade.
 */
export function deslocamentoDoMundo(progresso: number, largura: number): number {
  'worklet';
  return -PARALLAX_DO_MUNDO * largura * limitar(progresso);
}

/**
 * Onde o seletor branco da ActionBar está, medido a partir do primeiro item.
 * `passo` é a distância entre o começo de um item e o do seguinte.
 *
 * Sai do MESMO progresso que move as páginas: em 0,5 o seletor está no meio e
 * o Discovery está na metade do caminho. Não há como um chegar antes do outro.
 */
export function deslocamentoDoSeletor(
  progresso: number,
  indiceDe: number,
  indiceAte: number,
  passo: number,
): number {
  'worklet';
  return (indiceDe + (indiceAte - indiceDe) * limitar(progresso)) * passo;
}

/**
 * Quanto tempo leva ir de onde está até o destino.
 *
 * Proporcional ao que falta: inverter no meio do caminho leva metade do tempo,
 * então a volta tem a mesma velocidade da ida — em vez de parecer mais lenta.
 */
export function duracaoDaTransicao(distancia: number): number {
  const falta = Math.min(1, Math.abs(distancia));
  return Math.max(DURACAO_MINIMA, Math.round(DURACAO_DA_NAVEGACAO * falta));
}

export interface Transicao {
  destino: 0 | 1;
  duracao: number;
}

/**
 * Anima ou não? Só quando a DIREÇÃO muda.
 *
 * Esta é a guarda contra o `onFechado` fantasma: se um render re-rodar o efeito
 * sem o destino ter mudado, não há animação — e sem animação não há callback.
 * (Antes, um `withTiming(0)` com o progresso já em 0 terminava com "concluído"
 * e passava por fechamento real.)
 */
export function planejarTransicao(
  eraAberto: boolean,
  aberto: boolean,
  progressoAtual: number,
): Transicao | null {
  if (eraAberto === aberto) return null;
  const destino = aberto ? 1 : 0;
  return { destino, duracao: duracaoDaTransicao(destino - progressoAtual) };
}

/**
 * Avisar que o Mundo ficou descoberto? Só se a animação TERMINOU (não foi
 * substituída por uma inversão) e se ela ia PARA o Mundo. O `destino` é o da
 * própria animação, nunca o do render atual.
 */
export function avisaFechado(terminou: boolean, destino: number): boolean {
  'worklet';
  return terminou && destino === 0;
}
