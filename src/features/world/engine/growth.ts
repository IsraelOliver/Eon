// =====================================================================
// CRESCIMENTO — interpreta influências do conhecimento como intenções
// abstratas do mundo. Não escolhe lugar, sprite nem altera elementos.
// Função pura e determinística: mesma entrada, mesma saída, sem mutação.
// =====================================================================
import type { InfluenceKey, KnowledgeInfluence } from '../../../shared/domain/influence';
import type { WorldGrowthEvent, WorldGrowthKind } from './types';

/** Record completo: uma InfluenceKey nova não compila até ganhar um destino aqui. */
const EVENTO_POR_INFLUENCIA: Record<InfluenceKey, WorldGrowthKind> = {
  vegetacao: 'crescerVegetacao',
  povoamento: 'desenvolverPovoamento',
  infraestrutura: 'melhorarInfraestrutura',
  exploracao: 'ampliarExploracao',
  observacao: 'desenvolverObservacao',
};

/**
 * Influências → eventos de crescimento.
 * - Influências que levam ao mesmo tipo de evento são somadas em um só evento.
 * - A ordem segue a primeira aparição de cada tipo.
 * - Peso zero, negativo ou inválido não gera evento.
 */
export function gerarEventosDeCrescimento(influencias: readonly KnowledgeInfluence[]): WorldGrowthEvent[] {
  const intensidades = new Map<WorldGrowthKind, number>(); // Map mantém a ordem de inserção
  for (const { chave, peso } of influencias) {
    if (!Number.isFinite(peso) || peso <= 0) continue;
    const tipo = EVENTO_POR_INFLUENCIA[chave];
    intensidades.set(tipo, (intensidades.get(tipo) ?? 0) + peso);
  }
  return Array.from(intensidades, ([tipo, intensidade]) => ({ tipo, intensidade }));
}
