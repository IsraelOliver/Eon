// =====================================================================
// O QUE AINDA HÁ PARA DESCOBRIR — a regra do feed principal.
// Pura: uma lista e um perfil entram, a lista do feed sai.
// =====================================================================
import type { CuriosityId, KnowledgeProfile } from '../engine/types';

/**
 * As curiosidades que ainda não foram aprendidas.
 *
 * **Derivada, nunca guardada.** A fonte de verdade é o `KnowledgeProfile`, que
 * já é persistido: não existe (nem deve existir) uma segunda lista de
 * "escondidas do feed" para sair de sincronia. Consequências de graça:
 * fechar e abrir o app mantém o que foi aprendido fora do feed, e recomeçar a
 * jornada devolve tudo, porque o perfil volta vazio.
 *
 * Genérica de propósito: a futura tela de Aprendidas é o complemento desta
 * função sobre o mesmo catálogo, sem precisar de outra fonte de dados.
 */
export function paraDescobrir<T extends { id: CuriosityId }>(
  curiosidades: readonly T[],
  perfil: KnowledgeProfile,
): T[] {
  const aprendidas = new Set<CuriosityId>(perfil.aprendidas);
  return curiosidades.filter((curiosidade) => !aprendidas.has(curiosidade.id));
}
