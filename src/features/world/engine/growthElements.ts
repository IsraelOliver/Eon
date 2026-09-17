// =====================================================================
// ELEMENTOS DE CRESCIMENTO — eventos abstratos viram elementos concretos
// Funções puras: recebem a lista atual e devolvem uma nova.
// Nada aqui conhece ThemeKey: a categoria é sempre o tipo de evento.
// =====================================================================
import { colocarCrescimento } from './growthPlacement';
import type {
  GrowthElement,
  GrowthResult,
  Rng,
  World,
  WorldGrowthEvent,
  WorldGrowthKind,
  WorldGrowthPlacement,
  WorldOccupant,
} from './types';

/** Colocação → elemento. Não altera a colocação. */
export function criarElementoDeCrescimento(colocacao: WorldGrowthPlacement): GrowthElement {
  const { evento, tipo, x, y, intensidade } = colocacao;
  return { evento, tipo, x, y, intensidade };
}

/** Elemento → ocupante (só evento e posição; é o que as regras de lugar precisam). */
export function comoOcupante({ evento, x, y }: GrowthElement): WorldOccupant {
  return { evento, x, y };
}

/**
 * Processa os eventos na ordem recebida. Cada elemento colocado já conta como
 * ocupante para os eventos seguintes (é o que faz as casas formarem vilarejo e a
 * infraestrutura nascer perto delas). Um evento sem lugar não interrompe os outros.
 * A lista recebida não é alterada.
 */
export function aplicarEventosDeCrescimento(
  mundo: World,
  elementosAtuais: readonly GrowthElement[],
  eventos: readonly WorldGrowthEvent[],
  rng: Rng,
): GrowthResult {
  const ocupantes: WorldOccupant[] = elementosAtuais.map(comoOcupante);
  const adicionados: GrowthElement[] = [];
  const semLugar: WorldGrowthKind[] = [];

  for (const evento of eventos) {
    const resultado = colocarCrescimento(mundo, ocupantes, evento, rng);
    if (resultado.status === 'semLugar') {
      semLugar.push(resultado.evento);
      continue;
    }
    const elemento = criarElementoDeCrescimento(resultado.colocacao);
    adicionados.push(elemento);
    ocupantes.push(comoOcupante(elemento)); // o próximo evento já enxerga este
  }

  return { elementos: [...elementosAtuais, ...adicionados], adicionados, semLugar };
}
