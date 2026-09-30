// =====================================================================
// CRESCIMENTO COMUM — interpreta influências do conhecimento como intenções
// abstratas do mundo. Não escolhe lugar, sprite nem altera elementos.
// Função pura e determinística: mesma entrada, mesma saída, sem mutação.
//
// Desde a progressão da vila (engine/marcos.ts), o APRENDIZADO não passa mais
// por aqui: a civilização cresce por marcos acumulados, e não um prédio por
// curiosidade. Isto continua sendo o crescimento por evento — usado pelo modo
// dev e base dos futuros marcos temáticos e evoluções.
// =====================================================================
import type { InfluenceKey, KnowledgeInfluence } from '../../../shared/domain/influence';
import type { WorldGrowthEvent, WorldGrowthKind } from './types';

/**
 * Nome curto de cada tipo de crescimento, para mensagens e botões.
 *
 * TEMPORÁRIO: `crescerVegetacao` não é a forma final de representar conhecimento
 * de natureza. Árvores selvagens agora nascem com o mundo (engine/nature.ts).
 * Conhecimento de natureza deve virar coisas construídas — jardim, pomar, horta,
 * viveiro, estufa, reserva, centro ecológico —, ainda não implementadas. O evento
 * continua existindo só enquanto serve de teste no modo desenvolvedor.
 */
export const NOMES_DE_CRESCIMENTO: Record<WorldGrowthKind, string> = {
  crescerVegetacao: 'Vegetação',
  desenvolverPovoamento: 'Povoamento',
  melhorarInfraestrutura: 'Infraestrutura',
  ampliarExploracao: 'Exploração',
  desenvolverObservacao: 'Observação',
};

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
