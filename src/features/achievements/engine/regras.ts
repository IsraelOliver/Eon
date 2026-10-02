// =====================================================================
// AS REGRAS DAS CONQUISTAS — o que desbloqueia cada uma.
// Puro: sem React, sem imagem, sem saber de onde os fatos vieram.
// =====================================================================
import type { AssuntoDoMundo } from '../../../shared/domain/assunto';
import type { LugarNoMundo } from '../../../shared/domain/lugar';

/**
 * Ids estáveis: são eles que vão para o save. Renomear um id é mudar o formato
 * gravado — quem já tinha a conquista a perderia.
 */
export type AchievementId = 'first-house' | 'era-das-especializacoes';

/**
 * Algo que acabou de nascer no mundo, no vocabulário comum (`shared/domain`):
 * sobre o que é, e onde está.
 *
 * `achievements` não importa `world`: quem traduz uma construção em assunto e
 * lugar é a composição. Assim a regra fala de "casa" sem conhecer sprite ou vila,
 * e o lugar é só um ponto que a conquista guarda para o "Ver no mundo".
 */
export interface Nascido extends LugarNoMundo {
  assunto: AssuntoDoMundo;
}

export type Nascidos = readonly Nascido[];

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
  /**
   * Onde, no mundo, está o que esta conquista celebra — é para lá que o "Ver no
   * mundo" do banner leva a câmera. Ausente = conquista sem lugar (a Era das
   * Especializações): o toque só abre o Mundo, sem forçar foco.
   */
  lugar?: (fatos: FatosDaJornada) => LugarNoMundo | undefined;
}

/** O primeiro abrigo entre os nascidos: a cabana ou uma casa. */
const primeiroAbrigo = ({ nascidos = [] }: FatosDaJornada): Nascido | undefined =>
  nascidos.find((n) => n.assunto === 'cabana' || n.assunto === 'casa');

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
    alcancada: (fatos) => primeiroAbrigo(fatos) !== undefined,
    lugar: (fatos) => {
      const abrigo = primeiroAbrigo(fatos);
      return abrigo && { x: abrigo.x, y: abrigo.y };
    },
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

/** Onde está o que a conquista celebra, segundo estes fatos (ou undefined). */
export function lugarDaConquista(id: AchievementId, fatos: FatosDaJornada): LugarNoMundo | undefined {
  return REGRAS.find((regra) => regra.id === id)?.lugar?.(fatos);
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
