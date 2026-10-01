// =====================================================================
// AS REGRAS DAS CONQUISTAS — o que desbloqueia cada uma.
// Puro: sem React, sem imagem, sem saber de onde os fatos vieram.
// =====================================================================
import type { AssuntoDoMundo } from '../../../shared/domain/assunto';

/**
 * Ids estáveis: são eles que vão para o save. Renomear um id é mudar o formato
 * gravado — quem já tinha a conquista a perderia.
 */
export type AchievementId = 'first-house' | 'era-das-especializacoes';

/**
 * O que acabou de nascer no mundo, no vocabulário comum (`shared/domain`).
 *
 * `achievements` não importa `world`: quem traduz uma construção em assunto é a
 * composição. Assim a regra fala de "casa" sem conhecer sprite, tile ou vila.
 */
export type Nascidos = readonly AssuntoDoMundo[];

/**
 * O que aconteceu na jornada, no vocabulário das conquistas. Cada campo é um
 * fato que a composição traduziu de outra feature — `achievements` não importa
 * `world` nem `learning`. Ausente = não é sobre isso.
 */
export interface FatosDaJornada {
  /** O que acabou de nascer no mundo. */
  nascidos?: Nascidos;
  /** A fase base da civilização terminou (world/engine/marcos.ts). */
  especializacoesDesbloqueadas?: boolean;
}

interface Regra {
  id: AchievementId;
  alcancada: (fatos: FatosDaJornada) => boolean;
}

/**
 * As regras, na ordem em que as conquistas são anunciadas quando várias chegam
 * juntas. Uma conquista nova é uma linha aqui e uma entrada no catálogo.
 *
 * "Primeira" não precisa estar escrito na regra: uma conquista só desbloqueia
 * se ainda não estava desbloqueada, e o estado zera a cada jornada. Então a
 * primeira casa que nascer numa jornada é a que conta — as seguintes não.
 */
const REGRAS: readonly Regra[] = [
  // `casa` inclui a casa maior: o mundo traduz as duas para o mesmo assunto.
  // "Primeira casa!" é o primeiro abrigo: a cabana (o marco da 1ª curiosidade)
  // ou uma casa, o que nascer primeiro.
  {
    id: 'first-house',
    alcancada: ({ nascidos = [] }) => nascidos.includes('cabana') || nascidos.includes('casa'),
  },
  // A vila amadureceu: a Era das Especializações começou (uma vez por jornada).
  { id: 'era-das-especializacoes', alcancada: (fatos) => fatos.especializacoesDesbloqueadas === true },
];

export const ORDEM_DAS_CONQUISTAS: readonly AchievementId[] = REGRAS.map((regra) => regra.id);

/** Confere um id vindo do disco. Id desconhecido (versão futura, dado velho) é ignorado. */
export function ehAchievementId(valor: unknown): valor is AchievementId {
  return typeof valor === 'string' && (ORDEM_DAS_CONQUISTAS as readonly string[]).includes(valor);
}

/**
 * Quais conquistas **novas** estes fatos desbloqueiam.
 *
 * Nunca devolve uma que já estava desbloqueada — é isso que garante "uma vez
 * por jornada" sem precisar de flag nenhuma: o mesmo fato chegando de novo
 * (a 21ª curiosidade, a 22ª…) não faz nada.
 */
export function conquistasAlcancadas(
  fatos: FatosDaJornada,
  desbloqueadas: readonly AchievementId[],
): AchievementId[] {
  return REGRAS.filter((regra) => !desbloqueadas.includes(regra.id) && regra.alcancada(fatos)).map(
    (regra) => regra.id,
  );
}

/**
 * A próxima conquista para a vitrine do World Pulse: a primeira, na ordem do
 * catálogo, que já está desbloqueada e ainda não foi mostrada lá.
 */
export function proximaNaoVista(
  desbloqueadas: readonly AchievementId[],
  vistas: readonly AchievementId[],
): AchievementId | null {
  return ORDEM_DAS_CONQUISTAS.find((id) => desbloqueadas.includes(id) && !vistas.includes(id)) ?? null;
}
