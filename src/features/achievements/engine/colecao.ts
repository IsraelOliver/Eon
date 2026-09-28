// =====================================================================
// A COLEÇÃO — o que a tela de Conquistas mostra.
// Pura: catálogo + desbloqueadas entram, a coleção sai. Não guarda nada.
// =====================================================================
import type { AchievementId } from './regras';

export interface ItemDaColecao {
  id: AchievementId;
  desbloqueada: boolean;
}

export interface Colecao {
  itens: ItemDaColecao[];
  desbloqueadas: number;
  /** Quantas existem no catálogo — nunca um número escrito à mão. */
  total: number;
}

/**
 * A coleção é uma **projeção**, não um estado: o catálogo diz o que existe, a
 * jornada diz o que foi alcançado. Não há uma segunda lista para a tela, então
 * não há o que sair de sincronia — recomeçar a jornada bloqueia tudo na hora, e
 * a hidratação desbloqueia o que veio do save sem nenhum passo extra.
 *
 * A ordem é a do catálogo, fixa: cada conquista mora sempre no mesmo lugar da
 * prateleira, desbloqueada ou não.
 *
 * Uma conquista bloqueada não revela nada além de existir: nem nome, nem
 * condição. Isso já deixa espaço para conquistas secretas sem campo novo.
 */
/**
 * O que o leitor de tela diz de cada item. A bloqueada não diz o nome: o que
 * ainda não foi descoberto fica escondido para todos, não só para quem vê.
 */
export function rotuloAcessivel(titulo: string, desbloqueada: boolean): string {
  if (!desbloqueada) return 'Conquista bloqueada.';
  // "Primeira casa!" vira "Primeira casa, conquista desbloqueada."
  return `${titulo.replace(/[!?.]+$/, '')}, conquista desbloqueada.`;
}

export function montarColecao(
  catalogo: readonly AchievementId[],
  desbloqueadas: readonly AchievementId[],
): Colecao {
  const itens = catalogo.map((id) => ({ id, desbloqueada: desbloqueadas.includes(id) }));
  return {
    itens,
    desbloqueadas: itens.filter((item) => item.desbloqueada).length,
    total: itens.length,
  };
}
