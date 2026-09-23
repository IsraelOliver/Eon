// =====================================================================
// ELEMENTOS DE CRESCIMENTO — eventos abstratos viram elementos concretos
// Funções puras: recebem a lista atual e devolvem uma nova.
// Nada aqui conhece ThemeKey: a categoria é sempre o tipo de evento.
// =====================================================================
import { escolherOrientacaoCasa, escolherVariante } from './appearance';
import { pontoDeEntrada } from './footprint';
import { colocarCrescimento, colocarFonte } from './growthPlacement';
import { combinarSementes, mulberry32 } from './noise';
import { conectarARede, criarPraca, mesclarCaminhos } from './paths';
import {
  VILA,
  assentamentoAlvo,
  criarAssentamento,
  incluirNoAssentamento,
  referenciaDaVila,
} from './settlements';
import type {
  GrowthElement,
  GrowthResult,
  Rng,
  Settlement,
  SpriteKey,
  World,
  WorldGrowthEvent,
  WorldGrowthKind,
  WorldGrowthPlacement,
  WorldOccupant,
} from './types';

/** Eventos que constroem dentro de uma vila. Mina, observatório e vegetação ficam de fora. */
const EVENTOS_DE_VILA: ReadonlySet<WorldGrowthKind> = new Set(['desenvolverPovoamento', 'melhorarInfraestrutura']);

/** Construções de vila que são moradia: têm orientação e variante, e contam para a fonte. */
const RESIDENCIAS: ReadonlySet<SpriteKey> = new Set(['casa', 'casa_maior']);

/** Colocação → elemento. Não altera a colocação. */
export function criarElementoDeCrescimento(
  colocacao: WorldGrowthPlacement,
  settlementId?: string,
  origemConhecimentoId?: string,
): GrowthElement {
  const { evento, tipo, x, y, intensidade } = colocacao;
  const base: GrowthElement = { evento, tipo, x, y, intensidade };
  if (settlementId) base.settlementId = settlementId;
  if (origemConhecimentoId) base.origemConhecimentoId = origemConhecimentoId;
  return base;
}

/** Elemento → ocupante (evento, sprite e posição: o que as regras de lugar precisam). */
export function comoOcupante({ evento, tipo, x, y }: GrowthElement): WorldOccupant {
  return { evento, tipo, x, y };
}

/** Residência de vila ganha orientação (espacial) e variante (pseudoaleatória). */
function comAparencia(elemento: GrowthElement, vila: Settlement, seed: number): GrowthElement {
  if (!RESIDENCIAS.has(elemento.tipo)) return elemento;
  return {
    ...elemento,
    orientacao: escolherOrientacaoCasa(elemento, referenciaDaVila(vila), seed),
    variante: escolherVariante(elemento.x, elemento.y, seed),
  };
}

/** Liga a entrada de uma construção à rede da vila (e conta os eixos principais). */
function comCaminhoAte(
  mundo: World,
  vila: Settlement,
  ocupantes: readonly WorldOccupant[],
  construcao: GrowthElement,
): Settlement {
  const tiles = conectarARede(mundo, vila, ocupantes, pontoDeEntrada(construcao), vila.viasPrincipais);
  if (!tiles || !tiles.length) return vila;
  return {
    ...vila,
    caminhos: mesclarCaminhos(vila.caminhos, tiles),
    viasPrincipais: vila.viasPrincipais + (tiles.some((t) => t.tipo === 'principal') ? 1 : 0),
  };
}

function substituir(settlements: readonly Settlement[], vila: Settlement): Settlement[] {
  return settlements.some((s) => s.id === vila.id)
    ? settlements.map((s) => (s.id === vila.id ? vila : s))
    : [...settlements, vila];
}

/**
 * Processa os eventos na ordem recebida. Cada elemento colocado já conta como
 * ocupante para os eventos seguintes (é o que faz as casas formarem vila e as
 * casas maiores nascerem perto delas). Um evento sem lugar não interrompe os outros.
 * Quando a vila chega a VILA.residenciasParaFonte moradias, ela ganha a fonte.
 * A lista recebida não é alterada.
 */
/**
 * O gerador de UMA execução de crescimento — o único jeito de criá-lo.
 *
 * Não depende do relógio: sai da semente do mundo mais quantas execuções aquele
 * mundo já teve (`growthSequence`). Por isso, depois de restaurar um save, a
 * próxima execução continua exatamente a sequência que teria continuado.
 */
export function rngDeCrescimento(seedDoMundo: number, sequencia: number): Rng {
  return mulberry32(combinarSementes(seedDoMundo, sequencia));
}

export function aplicarEventosDeCrescimento(
  mundo: World,
  elementosAtuais: readonly GrowthElement[],
  settlementsAtuais: readonly Settlement[],
  eventos: readonly WorldGrowthEvent[],
  rng: Rng,
  /** Identificador OPACO do conhecimento que pediu este crescimento (se houver). */
  origemConhecimentoId?: string,
): GrowthResult {
  const ocupantes: WorldOccupant[] = elementosAtuais.map(comoOcupante);
  const adicionados: GrowthElement[] = [];
  const semLugar: WorldGrowthKind[] = [];
  let settlements: Settlement[] = [...settlementsAtuais];
  const residenciasDa = (id: string) =>
    [...elementosAtuais, ...adicionados].filter((e) => e.settlementId === id && RESIDENCIAS.has(e.tipo)).length;

  for (const evento of eventos) {
    const pertenceAVila = EVENTOS_DE_VILA.has(evento.tipo);
    let vila = pertenceAVila ? assentamentoAlvo(settlements) : undefined;

    // primeiro povoamento: escolhe onde nasce a vila (planície/savana, a uma
    // distância razoável da água, centralidade do mundo) e só então a cria
    if (evento.tipo === 'desenvolverPovoamento' && !vila) {
      const nucleo = colocarCrescimento(mundo, ocupantes, evento, rng);
      if (nucleo.status === 'semLugar') {
        semLugar.push(evento.tipo);
        continue;
      }
      vila = criarAssentamento(settlements, nucleo.colocacao.x, nucleo.colocacao.y);
    }

    const resultado = colocarCrescimento(mundo, ocupantes, evento, rng, vila);
    if (resultado.status === 'semLugar') {
      semLugar.push(resultado.evento);
      continue; // se a vila acabou de ser criada e a casa não coube, ela não entra
    }

    const base = criarElementoDeCrescimento(resultado.colocacao, vila?.id, origemConhecimentoId);
    const elemento = vila ? comAparencia(base, vila, mundo.seed) : base;
    adicionados.push(elemento);
    ocupantes.push(comoOcupante(elemento)); // o próximo evento já enxerga este
    if (!vila) continue;

    vila = incluirNoAssentamento(vila, elemento.x, elemento.y);
    // com a rede já existindo, a construção nova se liga ao caminho mais próximo
    if (vila.fonte) vila = comCaminhoAte(mundo, vila, ocupantes, elemento);
    settlements = substituir(settlements, vila);

    // a vila amadureceu: ganha a fonte, uma só, perto do centro
    if (!vila.fonte && residenciasDa(vila.id) >= VILA.residenciasParaFonte) {
      const lugar = colocarFonte(mundo, ocupantes, vila, rng);
      if (lugar) {
        // a fonte nasce junto: mesma origem de tudo o que veio nesta execução
        const fonte: GrowthElement = {
          evento: 'desenvolverPovoamento',
          tipo: 'fonte',
          x: lugar.x,
          y: lugar.y,
          intensidade: evento.intensidade,
          settlementId: vila.id,
          ...(origemConhecimentoId ? { origemConhecimentoId } : {}),
        };
        adicionados.push(fonte);
        ocupantes.push(comoOcupante(fonte));
        vila = incluirNoAssentamento(vila, fonte.x, fonte.y, true);

        // a fonte abre a praça e, com ela, a rede: as construções que já existiam
        // se ligam da mais perto para a mais longe (as 2 primeiras viram eixos)
        vila = { ...vila, caminhos: criarPraca(mundo, lugar, ocupantes) };
        const daVila = [...elementosAtuais, ...adicionados]
          .filter((e) => e.settlementId === vila!.id && e.tipo !== 'fonte')
          .sort((a, b) => Math.hypot(a.x - lugar.x, a.y - lugar.y) - Math.hypot(b.x - lugar.x, b.y - lugar.y));
        for (const construcao of daVila) vila = comCaminhoAte(mundo, vila, ocupantes, construcao);

        settlements = substituir(settlements, vila);
      }
      // sem espaço agora: tenta de novo na próxima construção da vila
    }
  }

  return { elementos: [...elementosAtuais, ...adicionados], adicionados, semLugar, settlements };
}
