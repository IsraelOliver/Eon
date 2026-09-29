// =====================================================================
// OS DEGRADÊS DO POST — a atmosfera no alto, a emenda, o rodapé.
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
 * A base do post: escurece progressivamente até a emenda. Sempre **preta**,
 * nunca atmosférica: o rodapé tem um trabalho só, que é garantir a leitura do
 * título, do preview e do `Ler →` sobre qualquer fotografia.
 */
export const DEGRADE_DA_BASE =
  'rgba(0,0,0,0) 34%, ' +
  'rgba(0,0,0,0.12) 54%, ' +
  'rgba(0,0,0,0.42) 72%, ' +
  'rgba(0,0,0,0.72) 88%, ' +
  `rgba(0,0,0,${ALFA_NA_EMENDA}) 100%`;

/** Quanto do alto a atmosfera discreta ocupa nos posts depois do primeiro. */
export const ALTURA_DO_TOPO = '14%';

/**
 * O alto dos posts depois do primeiro: nasce na escuridão da emenda e passa
 * pela atmosfera da curiosidade antes de revelar a foto.
 *
 * A primeira parada é **preta**, igual ao fim do post de cima — é isso que
 * mantém a emenda sem degrau. A cor só aparece logo abaixo, então cada swipe
 * muda o ambiente sem riscar uma linha colorida na divisão.
 */
export function paradasDoTopo(corDoTopo: string): string {
  return (
    `rgba(0,0,0,${ALFA_NA_EMENDA}) 0%, ` +
    `${comAlfa(corDoTopo, 0.45)} 30%, ` +
    `${comAlfa(corDoTopo, 0.16)} 62%, ` +
    `${comAlfa(corDoTopo, 0)} 100%`
  );
}
