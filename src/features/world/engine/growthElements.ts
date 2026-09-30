// =====================================================================
// ELEMENTOS DE CRESCIMENTO — eventos abstratos viram elementos concretos
// Funções puras: recebem a lista atual e devolvem uma nova.
// Nada aqui conhece ThemeKey: a categoria é sempre o tipo de evento.
// =====================================================================
import { escolherOrientacaoCasa, escolherVariante } from './appearance';
import { pontoDeEntrada } from './footprint';
import { cabeEvoluir, colocarCrescimento, colocarFonte, colocarMarco } from './growthPlacement';
import type { EfeitoDoMarco, LugarDoMarco, MarcoAlcancado } from './marcos';
import { combinarSementes, mulberry32 } from './noise';
import { conectarARede, criarPraca, mesclarCaminhos, redeDaVila } from './paths';
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

  return { elementos: [...elementosAtuais, ...adicionados], adicionados, evoluidos: [], semLugar, settlements };
}

/** O coração da vila: quem pode ocupar a praça (a fogueira e, depois, a fonte). */
const CORACAO: ReadonlySet<SpriteKey> = new Set(['fogueira', 'fonte']);

/**
 * Refaz a rede de caminhos da vila no nível dela, com as construções de agora.
 * Nível 0 (acampamento): nenhum caminho. Determinístico — mesma vila, mesma rede.
 */
function comRedeRefeita(mundo: World, vila: Settlement, elementos: readonly GrowthElement[]): Settlement {
  const nivel = vila.nivelDosCaminhos ?? 0;
  const daVila = elementos.filter((e) => e.settlementId === vila.id);
  const nucleo = daVila.find((e) => CORACAO.has(e.tipo)) ?? null;
  const construcoes = daVila.filter((e) => e !== nucleo);
  return { ...vila, caminhos: redeDaVila(mundo, vila, nucleo, construcoes, elementos.map(comoOcupante), nivel) };
}

/** Qual evento cada lugar de criação representa (o `evento` guardado na construção). */
const EVENTO_DO_LUGAR: Record<LugarDoMarco, WorldGrowthKind> = {
  fundaVila: 'desenvolverPovoamento',
  centroDaVila: 'desenvolverPovoamento',
  anelDasCasas: 'desenvolverPovoamento',
  anelDasMaiores: 'melhorarInfraestrutura',
};

/**
 * Qual construção uma evolução pega — determinístico, na ordem da lista do
 * mundo (a ordem de criação, que vai para o save). Só vale quem ainda é do tipo
 * `de` e onde o tipo novo CABE no mesmo lugar.
 */
function alvoDaEvolucao(
  efeito: Extract<EfeitoDoMarco, { tipo: 'evoluir' }>,
  elementos: readonly GrowthElement[],
  cabe: (elemento: GrowthElement) => boolean,
): GrowthElement | null {
  const candidatos = elementos.filter((e) => {
    if (e.tipo !== efeito.de) return false;
    // `criadaPor`: a identidade da construção é o degrau que a criou
    return efeito.alvo.tipo === 'criadaPor' ? e.marco?.id === efeito.alvo.marco : true;
  });
  return candidatos.find(cabe) ?? null;
}

/**
 * Os degraus da progressão chegando ao mapa (engine/marcos.ts) — o crescimento
 * principal da civilização. Três efeitos:
 *
 * - **criar**: uma construção nova no lugar da vila que o degrau pede;
 * - **evoluir**: uma construção existente sobe de estágio NO MESMO LUGAR. Nada
 *   da história é apagado — posição, criação (`marco`) e `origemConhecimentoId`
 *   ficam; o tipo e a aparência mudam, e o capítulo entra em `evolucoes`. Se o
 *   novo estágio é a fonte, a vila passa a ter praça (`vila.fonte`);
 * - **caminhos**: a rede da vila sobe de nível.
 *
 * No fim, se a vila tem caminho e algo mudou, a rede é REFEITA inteira com as
 * construções de agora (paths.ts, `redeDaVila`) — é o que mantém trilha e casa
 * coerentes depois de uma evolução.
 *
 * Processa na ordem recebida (a do catálogo): a cabana funda a vila antes de a
 * fogueira procurar o centro dela, e quem cria vem antes de quem evolui o que
 * foi criado — então chegar a vários degraus de uma vez (um save antigo) dá o
 * mesmo resultado que chegar a um por um. Um degrau sem lugar, ou sem
 * construção que caiba evoluir, vai para `semLugar` e continua pendente. As
 * listas recebidas não são alteradas.
 */
export function aplicarMarcos(
  mundo: World,
  elementosAtuais: readonly GrowthElement[],
  settlementsAtuais: readonly Settlement[],
  pendentes: readonly MarcoAlcancado[],
  rng: Rng,
): GrowthResult {
  const elementos: GrowthElement[] = [...elementosAtuais];
  const adicionados: GrowthElement[] = [];
  const evoluidos: GrowthElement[] = [];
  const semLugar: WorldGrowthKind[] = [];
  const avisos: string[] = [];
  let settlements: Settlement[] = [...settlementsAtuais];
  /** Vilas que mudaram nesta execução: a rede delas é refeita no fim. */
  const mudaram = new Set<string>();

  for (const { definicao, origem } of pendentes) {
    const efeito = definicao.efeito;

    if (efeito.tipo === 'caminhos') {
      const vila = assentamentoAlvo(settlements);
      if (!vila) {
        semLugar.push('desenvolverPovoamento');
        continue; // sem vila ainda: o degrau espera
      }
      settlements = substituir(settlements, { ...vila, nivelDosCaminhos: efeito.nivel });
      mudaram.add(vila.id);
      avisos.push(definicao.frase);
      continue;
    }

    if (efeito.tipo === 'evoluir') {
      const alvo = alvoDaEvolucao(efeito, elementos, (e) => {
        const outros = elementos.filter((o) => o !== e).map(comoOcupante);
        const vila = settlements.find((s) => s.id === e.settlementId);
        return cabeEvoluir(mundo, outros, efeito.para, e.x, e.y, vila);
      });
      if (!alvo) {
        semLugar.push(efeito.para === 'casa_maior' ? 'melhorarInfraestrutura' : 'desenvolverPovoamento');
        continue;
      }
      const capitulo = {
        marco: origem.id,
        gatilho: origem.gatilho,
        contribuintes: [...origem.contribuintes],
        de: alvo.tipo,
        para: efeito.para,
      };
      // mesmo objeto conceitual: tudo o que ele era continua, com o tipo novo
      let evoluido: GrowthElement = { ...alvo, tipo: efeito.para, evolucoes: [...(alvo.evolucoes ?? []), capitulo] };
      const vila = settlements.find((s) => s.id === alvo.settlementId);
      if (vila) {
        evoluido = comAparencia(evoluido, vila, mundo.seed); // casa ganha orientação/variante
        // o coração virou fonte: a vila passa a ter praça, no lugar do fogo
        if (efeito.para === 'fonte') settlements = substituir(settlements, { ...vila, fonte: { x: alvo.x, y: alvo.y } });
        mudaram.add(vila.id);
      }
      elementos[elementos.indexOf(alvo)] = evoluido;
      evoluidos.push(evoluido);
      continue;
    }

    // criar: uma construção nova na vila
    const ocupantes = elementos.map(comoOcupante);
    let vila = assentamentoAlvo(settlements);

    // O primeiro sinal de civilização escolhe onde a vila nasce — com as mesmas
    // regras de sempre da primeira vila (terreno, água, espaço, centralidade).
    if (!vila && efeito.lugar === 'fundaVila') {
      const nucleo = colocarCrescimento(mundo, ocupantes, { tipo: 'desenvolverPovoamento', intensidade: 1 }, rng);
      if (nucleo.status === 'colocado') {
        vila = criarAssentamento(settlements, nucleo.colocacao.x, nucleo.colocacao.y);
      }
    }

    const evento = EVENTO_DO_LUGAR[efeito.lugar];
    const lugar = vila ? colocarMarco(mundo, ocupantes, efeito.sprite, efeito.lugar, vila, rng) : null;
    if (!vila || !lugar) {
      semLugar.push(evento);
      continue; // uma vila recém-escolhida sem o degrau não entra
    }

    const base: GrowthElement = {
      evento,
      tipo: efeito.sprite,
      x: lugar.x,
      y: lugar.y,
      intensidade: 1,
      settlementId: vila.id,
      origemConhecimentoId: origem.gatilho,
      marco: { id: origem.id, gatilho: origem.gatilho, contribuintes: [...origem.contribuintes] },
    };
    // casas ganham orientação e variante, como toda residência da vila
    const elemento = comAparencia(base, vila, mundo.seed);
    elementos.push(elemento);
    adicionados.push(elemento);

    vila = incluirNoAssentamento(vila, elemento.x, elemento.y);
    settlements = substituir(settlements, vila);
    mudaram.add(vila.id);
  }

  // a rede acompanha a vila: refeita por inteiro onde algo mudou
  settlements = settlements.map((s) =>
    mudaram.has(s.id) && (s.nivelDosCaminhos ?? 0) > 0 ? comRedeRefeita(mundo, s, elementos) : s,
  );

  return { elementos, adicionados, evoluidos, avisos, semLugar, settlements };
}
