// =====================================================================
// OS DEGRADÊS DO POST — a emenda entre uma fotografia e a seguinte.
// Puro: só strings de degradê. Quem desenha é o componente.
// =====================================================================
import { comAlfa } from '../../../shared/theme/cor';

/**
 * O quanto está escuro **exatamente na divisão** entre dois posts.
 *
 * Os dois lados saem daqui de propósito. Ter gradiente dos dois lados não basta:
 * se a base de um post termina em 0.93 e o topo do outro começa em 0.45, o olho
 * vê a emenda *clarear* — um degrau. Amarrando ambos ao mesmo valor, a passagem
 * fica contínua e a borda física some.
 */
export const ALFA_NA_EMENDA = 0.82;

/**
 * A base do post: escurece progressivamente até a emenda.
 *
 * Faz dois trabalhos — protege o título, o preview e o `Ler →`, e prepara o
 * encontro com o post de baixo. Nunca vira bloco sólido: começa transparente
 * em um terço da altura e só endurece no último quarto.
 */
export const DEGRADE_DA_BASE =
  'rgba(0,0,0,0) 34%, ' +
  'rgba(0,0,0,0.12) 54%, ' +
  'rgba(0,0,0,0.42) 72%, ' +
  'rgba(0,0,0,0.72) 88%, ' +
  `rgba(0,0,0,${ALFA_NA_EMENDA}) 100%`;

/**
 * O alto do post: começa na escuridão da emenda e revela a fotografia.
 *
 * Também é o que garante contraste ao chip do tema sobre uma foto clara.
 * Escuro **neutro**, nunca a cor da paleta: dentro do feed a experiência é
 * fotográfica, e um creme ou um violeta entre duas fotos quebraria isso.
 */
export const DEGRADE_DO_TOPO =
  `rgba(0,0,0,${ALFA_NA_EMENDA}) 0%, ` +
  'rgba(0,0,0,0.46) 28%, ' +
  'rgba(0,0,0,0.16) 60%, ' +
  'rgba(0,0,0,0) 100%';

/** Quanto do alto o degradê ocupa. Discreto: a fotografia continua mandando. */
export const ALTURA_DO_TOPO = '14%';

/** A ponte entre a interface e a primeira fotografia, em pixels. */
export const ALTURA_DA_PONTE = 108;

/**
 * A ponte do primeiro post: dissolve a cor da INTERFACE na fotografia.
 *
 * Só aqui a paleta entra num degradê do feed — é a passagem do World Pulse
 * (que é interface) para a foto. De um post para o outro, a emenda é sempre
 * escura e neutra.
 */
export function paradasDaPonte(corDaInterface: string): string {
  return (
    `${comAlfa(corDaInterface, 1)} 0%, ` +
    `${comAlfa(corDaInterface, 0.68)} 40%, ` +
    `${comAlfa(corDaInterface, 0)} 100%`
  );
}
