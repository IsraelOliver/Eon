// =====================================================================
// PROGRESSÃO DA VILA — o crescimento acumulado da civilização.
//
// O mundo começa selvagem, e a civilização surge aos poucos, por DEGRAUS: cada
// um acontece uma vez, quando a jornada acumula o bastante. Não é mais "cada
// curiosidade vira um prédio do tema dela".
//
// A vila cresce de dois jeitos, e cada degrau diz qual é o seu (`efeito`):
//   - para os lados: CRIAR uma construção nova;
//   - para cima: EVOLUIR uma construção que já existe, no mesmo lugar, sem
//     apagar a história dela.
// E o chão entre elas amadurece junto: os CAMINHOS nascem e se firmam por
// degraus — acampamento (sem caminho) → assentamento (trilhas) → vila (rede).
//
// Aqui fica o CATÁLOGO (o que existe e quando) e a REGRA (quais degraus a
// jornada alcançou e ainda não aconteceram). Onde cada coisa nasce e se cabe
// crescer é growthPlacement; quem muda o mapa é growthElements. Puro: sem
// React, sem sorteio, sem relógio.
// =====================================================================
import type { ThemeKey } from '../../../shared/domain/themeKey';
import { assentamentoAlvo } from './settlements';
import type {
  EvolucaoDaConstrucao, GrowthElement, MarcoId, NivelDosCaminhos, OrigemDoMarco, Settlement, SpriteKey, TileType,
} from './types';

/**
 * As famílias de crescimento do mundo.
 *
 * - `marco-inicial`: os marcos únicos do começo da vila — cabana, fogueira.
 * - `comum`: o crescimento comum da vila por limiar de aprendizado — cabanas,
 *   casas. (O crescimento por evento de `aplicarEventosDeCrescimento` — mina,
 *   observatório… — é outro caminho, hoje só do modo dev.)
 * - `evolucao`: uma construção existente sobe de estágio (tier) no mesmo lugar.
 * - `marco-tematico`: futuro — desbloqueado por afinidade com um tema, ou por
 *   combinação de temas, em vez de um prédio por curiosidade.
 */
export type CategoriaDeCrescimento = 'comum' | 'marco-inicial' | 'marco-tematico' | 'evolucao';

/**
 * Quando um degrau é alcançado. União discriminada: condição nova é um caso
 * novo aqui e em `alcancou`, sem mexer em quem chama.
 *
 * Futuro, por exemplo:
 *   | { tipo: 'afinidade'; tema: ThemeKey; quantidade: number }
 *   | { tipo: 'combinacao'; temas: ThemeKey[] }
 *   | { tipo: 'depoisDe'; marco: MarcoId }
 * (Esses vão pedir mais do que a lista de ids em `ProgressoDaJornada`.)
 */
export type CondicaoDeMarco =
  | { tipo: 'totalAprendido'; quantidade: number }
  /**
   * Uma especialização (ESPECIALIZACOES, abaixo): a afinidade do `tema` chegou a
   * `afinidade`, a Era das Especializações já estava aberta ANTES deste
   * aprendizado, e a curiosidade que acabou de ser aprendida é do tema.
   */
  | { tipo: 'especializacao'; tema: ThemeKey; afinidade: number };

/**
 * Onde uma construção NOVA nasce.
 * - `fundaVila`: se ainda não há vila, escolhe onde ela nasce (as mesmas regras
 *   da primeira vila) e se põe no anel das casas; se há, entra nesse anel.
 * - `centroDaVila`: o mais perto possível do coração da vila existente.
 * - `anelDasCasas` / `anelDasMaiores`: a colocação de sempre das casas pequenas
 *   e das casas maiores na vila (anéis, footprint, colisão, orientação).
 * - `periferiaDaVila`: um anel além das casas, fora do centro.
 * - `especializado`: onde a `geografia` do efeito mandar (preferência
 *   geográfica própria, com fallback até a periferia) — as especializações.
 */
export type LugarDoMarco =
  | 'fundaVila'
  | 'centroDaVila'
  | 'anelDasCasas'
  | 'anelDasMaiores'
  | 'periferiaDaVila'
  | 'especializado';

/**
 * Custo de atravessar cada terreno numa trilha. Ausente = proibido (a água é
 * sempre proibida, e construção também). Andar sobre caminho existente é
 * sempre quase de graça: é o que faz uma trilha nova aproveitar a rede.
 */
export type CustosDeTerreno = Partial<Record<TileType, number>>;

/**
 * Onde uma construção especializada prefere nascer. É NOTA, não regra: o lugar
 * ainda tem de ser terreno firme, fora d'água, da praça, da rua e das outras
 * construções. Distâncias em TILES, contadas do centro da vila.
 */
export interface PreferenciaGeografica {
  /** Abaixo de `minima`, recusado (nada de amontoar com as casas); além de `maxima`, a nota cai. */
  distanciaDaVila: { minima: number; maxima: number };
  /**
   * Gostar de estar perto de montanha — aos PÉS dela, nunca em cima (montanha
   * não é terreno firme). `ideal` e `tolerancia` em tiles até a montanha.
   */
  perto?: { montanha?: { ideal: number; tolerancia: number; peso: number } };
  /** Nota por tipo de terreno: mais alta onde é aberto (planície), mais baixa onde é fechado. */
  terreno: Partial<Record<TileType, number>>;
}

/** Como um trecho de trilha é desenhado (os mesmos campos de `PathTile`). */
export interface TracoDaTrilha {
  espessura: number;
  cobertura: number;
  opacidade: number;
}

/** A trilha própria de uma construção especializada, da porta até a vila. */
export interface RotaDeAcesso {
  /** Por onde a trilha pode passar, e quanto custa. */
  custos: CustosDeTerreno;
  /** Quanto o traçado ondula, em tiles (mais = mais irregular). */
  curva: number;
  /**
   * O traço em cada estágio da construção: [criação, 1ª evolução, …]. Amadurece
   * devagar, e nunca chega à largura dos caminhos da vila.
   */
  estagios: readonly TracoDaTrilha[];
}

/** O que uma especialização declara sobre o mundo: onde nasce e como se chega lá. */
export interface GeografiaDaEspecializacao {
  preferencia: PreferenciaGeografica;
  acesso: RotaDeAcesso;
}

/**
 * Qual construção existente uma evolução pega. Sempre determinístico: nada de
 * sorteio — a mesma jornada escolhe sempre a mesma construção.
 * - `criadaPor`: a construção que aquele degrau de criação fez nascer. É a
 *   identidade dela, e não muda quando ela evolui.
 * - `maisAntiga`: a mais antiga do tipo `de`, na ordem de criação (a ordem da
 *   lista do mundo, que vai para o save), entre as que CABEM no tipo novo.
 */
export type AlvoDaEvolucao = { tipo: 'criadaPor'; marco: MarcoId } | { tipo: 'maisAntiga' };

/**
 * O que o degrau faz no mapa. Efeito novo (demolir, mover, fundir…) é um caso
 * novo aqui e em `aplicarMarcos`.
 * - `criar`: uma construção nova (`sprite`) num `lugar` da vila.
 * - `evoluir`: uma construção do tipo `de` vira `para`, no MESMO lugar. Serve
 *   para qualquer tier: cabana → casa, casa → casa grande, e no futuro
 *   observatório → observatório avançado, mina → complexo mineiro, fogueira →
 *   fonte (a vila passa a ter praça: veja `aplicarMarcos`)…
 * - `caminhos`: a rede de caminhos da vila sobe para `nivel` (1 a 4). Quanto
 *   cada nível desenha é de `NIVEIS_DA_REDE`, em paths.ts.
 */
export type EfeitoDoMarco =
  | { tipo: 'criar'; sprite: SpriteKey; lugar: LugarDoMarco; geografia?: GeografiaDaEspecializacao }
  | { tipo: 'evoluir'; de: SpriteKey; para: SpriteKey; alvo: AlvoDaEvolucao }
  | { tipo: 'caminhos'; nivel: Exclude<NivelDosCaminhos, 0> };

export interface DefinicaoDeMarco {
  id: MarcoId;
  categoria: CategoriaDeCrescimento;
  condicao: CondicaoDeMarco;
  efeito: EfeitoDoMarco;
  /**
   * Acontece uma vez por jornada. Todo degrau de hoje é único — cada limiar é
   * um degrau próprio. Um degrau repetível vai precisar de uma regra de
   * ocorrência antes de poder existir.
   */
  unico: true;
  /**
   * O nome do degrau — é o rótulo da linha do tempo do modo dev. O balão ao
   * tocar mostra o nome da CONSTRUÇÃO (selecao.ts), não este.
   */
  nome: string;
  /** A notícia: o aviso do mundo e o World Pulse. */
  frase: string;
  /** A história, mostrada ao tocar na construção (a da criação, ou a da última evolução). */
  historia: string;
}

/**
 * O catálogo. A ordem é a de avaliação: quem funda a vila vem antes de quem
 * precisa dela, e quem cria vem antes de quem evolui o que foi criado.
 *
 * PROVISÓRIO — a sequência do playtest de 20 curiosidades:
 *   1 cabana · 3 fogueira · 5 segunda cabana          (acampamento: sem caminho)
 *   8 casa + primeiras trilhas                        (assentamento)
 *   12 1ª cabana → casa + trilhas mais marcadas
 *   16 2ª cabana → casa + a rede liga o assentamento  (vila)
 *   20 casa → casa grande + caminhos maduros
 * Os degraus de caminho vêm DEPOIS da construção do mesmo limiar: a rede é
 * refeita já com ela.
 */
export const MARCOS: readonly DefinicaoDeMarco[] = [
  {
    id: 'primeira-cabana',
    categoria: 'marco-inicial',
    condicao: { tipo: 'totalAprendido', quantidade: 1 },
    efeito: { tipo: 'criar', sprite: 'cabana', lugar: 'fundaVila' },
    unico: true,
    nome: 'Cabana',
    frase: 'Uma cabana surgiu no seu mundo.',
    historia: 'Seu primeiro aprendizado deu origem ao primeiro abrigo deste mundo.',
  },
  {
    id: 'primeira-fogueira',
    categoria: 'marco-inicial',
    condicao: { tipo: 'totalAprendido', quantidade: 3 },
    efeito: { tipo: 'criar', sprite: 'fogueira', lugar: 'centroDaVila' },
    unico: true,
    nome: 'Fogueira',
    frase: 'Uma fogueira foi acesa perto da cabana.',
    historia: 'Novos conhecimentos fizeram este lugar começar a ganhar vida.',
  },
  {
    id: 'segunda-cabana',
    categoria: 'comum',
    condicao: { tipo: 'totalAprendido', quantidade: 5 },
    efeito: { tipo: 'criar', sprite: 'cabana', lugar: 'anelDasCasas' },
    unico: true,
    nome: 'Segunda cabana',
    frase: 'Uma segunda cabana surgiu na vila.',
    historia: 'Mais aprendizados trouxeram um novo abrigo para a vila.',
  },
  {
    id: 'vila-casa-8',
    categoria: 'comum',
    condicao: { tipo: 'totalAprendido', quantidade: 8 },
    efeito: { tipo: 'criar', sprite: 'casa', lugar: 'anelDasCasas' },
    unico: true,
    nome: 'Casa pequena',
    frase: 'Uma nova casa surgiu no assentamento.',
    historia: 'Seu conhecimento fez o assentamento crescer.',
  },
  {
    id: 'trilhas-8',
    categoria: 'comum',
    condicao: { tipo: 'totalAprendido', quantidade: 8 },
    efeito: { tipo: 'caminhos', nivel: 1 },
    unico: true,
    nome: 'Primeiras trilhas',
    frase: 'Surgiram as primeiras trilhas entre as casas.',
    historia: 'De tanto ir e vir, o chão da vila começou a marcar os caminhos.',
  },
  {
    id: 'evolucao-primeira-cabana',
    categoria: 'evolucao',
    condicao: { tipo: 'totalAprendido', quantidade: 12 },
    efeito: { tipo: 'evoluir', de: 'cabana', para: 'casa', alvo: { tipo: 'criadaPor', marco: 'primeira-cabana' } },
    unico: true,
    nome: 'Primeira cabana evolui',
    frase: 'A primeira cabana cresceu e virou uma casa.',
    historia: 'Este foi o primeiro abrigo do seu mundo. Com novos conhecimentos, ele cresceu.',
  },
  {
    id: 'trilhas-12',
    categoria: 'evolucao',
    condicao: { tipo: 'totalAprendido', quantidade: 12 },
    efeito: { tipo: 'caminhos', nivel: 2 },
    unico: true,
    nome: 'Trilhas marcadas',
    frase: 'As trilhas da vila ficaram mais marcadas.',
    historia: 'O chão em volta do fogo e entre as casas já está gasto de tanto uso.',
  },
  {
    id: 'evolucao-segunda-cabana',
    categoria: 'evolucao',
    condicao: { tipo: 'totalAprendido', quantidade: 16 },
    efeito: { tipo: 'evoluir', de: 'cabana', para: 'casa', alvo: { tipo: 'criadaPor', marco: 'segunda-cabana' } },
    unico: true,
    nome: 'Segunda cabana evolui',
    frase: 'A segunda cabana cresceu e virou uma casa.',
    historia: 'Esta foi a segunda cabana do seu mundo. Com novos conhecimentos, ela cresceu.',
  },
  {
    id: 'trilhas-16',
    categoria: 'evolucao',
    condicao: { tipo: 'totalAprendido', quantidade: 16 },
    efeito: { tipo: 'caminhos', nivel: 3 },
    unico: true,
    nome: 'Rede de caminhos',
    frase: 'Os caminhos passaram a ligar todo o assentamento.',
    historia: 'As casas agora se ligam umas às outras, não só ao fogo.',
  },
  {
    id: 'evolucao-casa-grande-20',
    categoria: 'evolucao',
    condicao: { tipo: 'totalAprendido', quantidade: 20 },
    efeito: { tipo: 'evoluir', de: 'casa', para: 'casa_maior', alvo: { tipo: 'maisAntiga' } },
    unico: true,
    nome: 'Casa pequena → casa grande',
    frase: 'Uma casa cresceu e virou uma casa grande.',
    historia: 'Com ainda mais conhecimento, esta casa cresceu mais uma vez.',
  },
  {
    id: 'trilhas-20',
    categoria: 'evolucao',
    condicao: { tipo: 'totalAprendido', quantidade: 20 },
    efeito: { tipo: 'caminhos', nivel: 4 },
    unico: true,
    nome: 'Caminhos maduros',
    frase: 'Os caminhos da vila amadureceram.',
    historia: 'Os caminhos já são de uma vila de verdade.',
  },
];

/**
 * Degraus de sequências antigas do playtest, que não acontecem mais mas podem
 * estar num save: as construções continuam contando a própria história. Nunca
 * são avaliados — só lidos.
 */
const LEGADO: readonly DefinicaoDeMarco[] = [
  { id: 'vila-casa-5', qtd: 5, sprite: 'casa' as const },
  { id: 'vila-casa-grande-12', qtd: 12, sprite: 'casa_maior' as const },
  { id: 'vila-casa-16', qtd: 16, sprite: 'casa' as const },
  { id: 'vila-casa-grande-20', qtd: 20, sprite: 'casa_maior' as const },
].map(({ id, qtd, sprite }) => ({
  id: id as MarcoId,
  categoria: 'comum' as const,
  condicao: { tipo: 'totalAprendido' as const, quantidade: qtd },
  efeito: {
    tipo: 'criar' as const,
    sprite,
    lugar: sprite === 'casa' ? ('anelDasCasas' as const) : ('anelDasMaiores' as const),
  },
  unico: true as const,
  nome: sprite === 'casa' ? 'Casa' : 'Casa grande',
  frase: sprite === 'casa' ? 'Uma nova casa surgiu no assentamento.' : 'Uma casa grande foi erguida no assentamento.',
  historia: 'Seu conhecimento fez o assentamento crescer.',
}));

/**
 * O que o mundo precisa saber da jornada para avaliar os degraus. Vem da
 * composição, que traduz o perfil do aprendizado — o mundo não conhece `learning`.
 */
export interface ProgressoDaJornada {
  /**
   * Os ids das curiosidades aprendidas, NA ORDEM em que foram aprendidas. Uma
   * curiosidade repetida nunca entra duas vezes (quem garante é o learning).
   */
  aprendidas: readonly string[];
  /** A afinidade de cada tema: o `porTema` do perfil, a fonte de verdade. */
  porTema?: Partial<Record<ThemeKey, number>>;
  /**
   * Os ids aprendidos de cada tema, na ordem — a MEMÓRIA das especializações
   * (quem contribuiu). Derivado pela composição do perfil + catálogo; não é salvo.
   */
  aprendidasPorTema?: Partial<Record<ThemeKey, readonly string[]>>;
}

// ---------------------------------------------------------------------
// A ERA DAS ESPECIALIZAÇÕES
//
// As primeiras curiosidades constroem a BASE da civilização (o catálogo
// acima: cabana, fogueira, casas, evoluções, caminhos). Ao concluir essa fase,
// a Era das Especializações é desbloqueada: dali em diante, afinidades
// temáticas poderão criar e evoluir ramos especializados da vila.
//
// Não é um degrau do catálogo (não nasce sprite nenhum) e não é estado salvo:
// é DERIVADA da jornada, que já está no save. Nada para sair de sincronia.
// ---------------------------------------------------------------------

/** Quantas curiosidades fecham a fase base da civilização. */
export const FIM_DA_FASE_BASE = 20;

/**
 * A vila já pode desenvolver especializações temáticas? A fonte única que os
 * tiers de `ESPECIALIZACOES` consultam (condição `especializacao`), somada à
 * afinidade do tema.
 */
export function especializacoesDesbloqueadas(progresso: ProgressoDaJornada): boolean {
  return progresso.aprendidas.length >= FIM_DA_FASE_BASE;
}

/** A era abriu NESTE aprendizado (o último da lista): o fato que vira manchete uma vez só. */
export function eraAbriuAgora(progresso: ProgressoDaJornada): boolean {
  return (
    especializacoesDesbloqueadas(progresso) &&
    !especializacoesDesbloqueadas({ aprendidas: progresso.aprendidas.slice(0, -1) })
  );
}

/** A manchete do mundo quando a era abre. Não é um degrau: nenhuma construção nasce. */
export const FRASE_DA_ERA = 'Sua vila está pronta para seguir novos caminhos.';

// ---------------------------------------------------------------------
// AS ESPECIALIZAÇÕES — os ramos temáticos da vila, depois da fase base.
//
// Cada ramo é um tema com TIERS em ordem. Cada tier é um degrau comum do motor
// (`DefinicaoDeMarco`): condição `especializacao` (afinidade do tema) e efeito
// `criar` ou `evoluir` — o mesmo motor da vila, a mesma memória de origem.
// Prédios especializados EVOLUEM (tier 1 → tier 2, no mesmo lugar); não se
// multiplicam. Tema novo (Geologia, Natureza, História…) é um ramo novo aqui.
//
// Os limiares são PROVISÓRIOS, para calibrar no playtest.
// ---------------------------------------------------------------------

export interface RamoDeEspecializacao {
  tema: ThemeKey;
  nome: string;
  /** Em ordem: só o próximo ainda não feito é avaliado a cada aprendizado. */
  tiers: readonly DefinicaoDeMarco[];
}

/**
 * A geografia da Astronomia: céu limpo, longe das casas, aos pés da montanha —
 * e uma trilha pouco usada até lá. Valores para calibrar.
 */
const GEOGRAFIA_DA_ASTRONOMIA: GeografiaDaEspecializacao = {
  preferencia: {
    // longe o bastante para ser outra instalação; perto o bastante para a trilha
    // não atravessar o mapa
    distanciaDaVila: { minima: 30, maxima: 60 },
    // aos pés da montanha: a ~6 tiles dela, tolerando uns 8 de diferença
    perto: { montanha: { ideal: 6, tolerancia: 8, peso: 4 } },
    // céu aberto: planície e savana; floresta fechada vale pouco
    terreno: { planicie: 2, savana: 1.8, tundra: 1.2, deserto: 1, floresta: 0.3 },
  },
  acesso: {
    // montanha e neve fora: a trilha contorna o relevo; floresta custa caro
    custos: { planicie: 4, savana: 4, deserto: 6, tundra: 7, floresta: 12, praia: 24 },
    curva: 2.4,
    estagios: [
      // tier 1: trilha pouco usada
      { espessura: 0.42, cobertura: 0.52, opacidade: 0.64 },
      // tier 2: trilha estabelecida — ainda mais fina que os caminhos da vila
      { espessura: 0.5, cobertura: 0.68, opacidade: 0.76 },
    ],
  },
};

export const ESPECIALIZACOES: readonly RamoDeEspecializacao[] = [
  {
    tema: 'astronomia',
    nome: 'Astronomia',
    tiers: [
      {
        id: 'astronomia-tier-1',
        categoria: 'marco-tematico',
        condicao: { tipo: 'especializacao', tema: 'astronomia', afinidade: 5 },
        efeito: { tipo: 'criar', sprite: 'telescopio', lugar: 'especializado', geografia: GEOGRAFIA_DA_ASTRONOMIA },
        unico: true,
        nome: 'Telescópio',
        frase: 'Um ponto de observação surgiu no seu mundo.',
        historia: 'Seus estudos sobre o céu começaram aqui, com um pequeno telescópio.',
      },
      {
        id: 'astronomia-tier-2',
        categoria: 'evolucao',
        condicao: { tipo: 'especializacao', tema: 'astronomia', afinidade: 10 },
        efeito: {
          tipo: 'evoluir',
          de: 'telescopio',
          para: 'posto_de_observacao',
          alvo: { tipo: 'criadaPor', marco: 'astronomia-tier-1' },
        },
        unico: true,
        nome: 'Posto de observação',
        frase: 'O ponto de observação cresceu.',
        historia:
          'Seus estudos sobre o céu começaram aqui com um pequeno telescópio. Novas descobertas fizeram o lugar crescer.',
      },
    ],
  },
];

/** Um degrau que a jornada alcançou e ainda não aconteceu, com a origem já montada. */
export interface MarcoAlcancado {
  definicao: DefinicaoDeMarco;
  origem: OrigemDoMarco;
}

/** A condição foi cumprida? Devolve quem a cumpriu (em ordem; o último é o gatilho), ou null. */
function alcancou(condicao: CondicaoDeMarco, progresso: ProgressoDaJornada): string[] | null {
  switch (condicao.tipo) {
    case 'totalAprendido':
      // As N primeiras formam o degrau — mesmo que ele aconteça depois (sem
      // lugar da primeira vez, ou um save anterior): a origem é a verdade da
      // jornada, não o momento em que o mapa conseguiu mostrá-la.
      return progresso.aprendidas.length >= condicao.quantidade
        ? progresso.aprendidas.slice(0, condicao.quantidade)
        : null;
    case 'especializacao': {
      const doTema = progresso.aprendidasPorTema?.[condicao.tema] ?? [];
      const afinidade = progresso.porTema?.[condicao.tema] ?? doTema.length;
      const agora = progresso.aprendidas[progresso.aprendidas.length - 1];
      // a era já estava aberta ANTES deste aprendizado: chegar a 20 não constrói nada
      const eraAntes = especializacoesDesbloqueadas({ aprendidas: progresso.aprendidas.slice(0, -1) });
      // quem dispara é uma curiosidade DO TEMA, aprendida agora
      if (!eraAntes || afinidade < condicao.afinidade || agora === undefined || !doTema.includes(agora)) {
        return null;
      }
      // as do tema até aqui (a de agora é a última: o gatilho)
      return [...doTema.slice(0, doTema.indexOf(agora)), agora];
    }
  }
}

/**
 * Quantos tiers de cada ramo ainda não aconteceram neste mundo (temas sem
 * nenhum pendente ficam de fora). Para o simulador da jornada (modo dev): cada
 * tier pede uma curiosidade do tema aprendida depois da fase base.
 */
export function tiersPendentes(crescimento: readonly GrowthElement[]): Partial<Record<ThemeKey, number>> {
  const feitos = degrausQueJaAconteceram(crescimento);
  const pendentes: Partial<Record<ThemeKey, number>> = {};
  for (const ramo of ESPECIALIZACOES) {
    const n = ramo.tiers.filter((t) => !feitos.has(t.id)).length;
    if (n > 0) pendentes[ramo.tema] = n;
  }
  return pendentes;
}

/** Todo degrau que já aconteceu neste mundo: as criações e as evoluções. */
export function degrausQueJaAconteceram(crescimento: readonly GrowthElement[]): Set<MarcoId> {
  const ids = new Set<MarcoId>();
  for (const e of crescimento) {
    if (e.marco) ids.add(e.marco.id);
    for (const ev of e.evolucoes ?? []) ids.add(ev.marco);
  }
  return ids;
}

/**
 * Os degraus alcançados que ainda não aconteceram, na ordem do catálogo.
 *
 * **Idempotente:** o que já aconteceu (criado, evoluído, ou a rede que já chegou
 * àquele nível) nunca volta, então chamar de novo com o mesmo progresso —
 * reabrir o app, reprocessar, aprender de novo uma repetida — não duplica nada.
 * E um degrau sem lugar (ou sem construção para evoluir, ou sem vila para ter
 * caminho) continua pendente: a próxima avaliação tenta outra vez.
 */
export function marcosPendentes(
  progresso: ProgressoDaJornada,
  crescimento: readonly GrowthElement[],
  settlements: readonly Settlement[],
): MarcoAlcancado[] {
  const aconteceu = quemJaAconteceu(crescimento, settlements);
  const pendentes: MarcoAlcancado[] = [];
  const avaliar = (definicao: DefinicaoDeMarco) => {
    const contribuintes = alcancou(definicao.condicao, progresso);
    if (!contribuintes) return;
    pendentes.push({
      definicao,
      origem: { id: definicao.id, gatilho: contribuintes[contribuintes.length - 1], contribuintes },
    });
  };
  for (const definicao of MARCOS) if (!aconteceu(definicao)) avaliar(definicao);
  // Especializações: de cada ramo, só o PRÓXIMO tier — um aprendizado avança no
  // máximo um estágio, mesmo com afinidade sobrando para os dois.
  for (const ramo of ESPECIALIZACOES) {
    const proximo = ramo.tiers.find((tier) => !aconteceu(tier));
    if (proximo) avaliar(proximo);
  }
  return pendentes;
}

/**
 * A pergunta "este degrau já aconteceu neste mundo?", pronta para fazer várias
 * vezes. Construção e evolução se lembram pelo id; caminho não deixa construção
 * para lembrar — quem lembra é o nível da rede.
 */
export function quemJaAconteceu(
  crescimento: readonly GrowthElement[],
  settlements: readonly Settlement[],
): (definicao: DefinicaoDeMarco) => boolean {
  const ids = degrausQueJaAconteceram(crescimento);
  const nivelAtual = assentamentoAlvo(settlements)?.nivelDosCaminhos ?? 0;
  return (definicao) =>
    definicao.efeito.tipo === 'caminhos' ? nivelAtual >= definicao.efeito.nivel : definicao.unico && ids.has(definicao.id);
}

/** Um limiar da jornada e os degraus dele (a linha do tempo do modo dev). */
export interface EtapaDaJornada {
  /** Quantas curiosidades aprendidas. */
  quantidade: number;
  degraus: DefinicaoDeMarco[];
}

/**
 * O catálogo agrupado por limiar, em ordem. É o catálogo real — a linha do
 * tempo do modo dev sai daqui, não de uma lista à parte.
 */
export function etapasDaJornada(): EtapaDaJornada[] {
  const etapas = new Map<number, DefinicaoDeMarco[]>();
  for (const definicao of MARCOS) {
    if (definicao.condicao.tipo !== 'totalAprendido') continue;
    const n = definicao.condicao.quantidade;
    etapas.set(n, [...(etapas.get(n) ?? []), definicao]);
  }
  return [...etapas].map(([quantidade, degraus]) => ({ quantidade, degraus })).sort((a, b) => a.quantidade - b.quantidade);
}

/** A definição de um degrau pelo id (do catálogo, ou do legado). `null` se ninguém o conhece. */
export function definicaoDoMarco(id: MarcoId): DefinicaoDeMarco | null {
  return (
    MARCOS.find((m) => m.id === id) ??
    ESPECIALIZACOES.flatMap((r) => r.tiers).find((m) => m.id === id) ??
    LEGADO.find((m) => m.id === id) ??
    null
  );
}

/**
 * Todos os tipos que a construção criada por `marcoId` vai ter ao longo da vida:
 * o de agora e os das evoluções do catálogo que a pegam pela identidade
 * (`criadaPor`). É o que a reserva de espaço usa: quem nasce já guarda lugar
 * para crescer, e o tier 2 nunca fica sem espaço por causa do tier 1.
 */
export function linhagemDaConstrucao(marcoId: MarcoId, sprite: SpriteKey): SpriteKey[] {
  const todos = [...MARCOS, ...ESPECIALIZACOES.flatMap((r) => r.tiers)];
  const futuros = todos.flatMap((d) =>
    d.efeito.tipo === 'evoluir' && d.efeito.alvo.tipo === 'criadaPor' && d.efeito.alvo.marco === marcoId
      ? [d.efeito.para]
      : [],
  );
  return [sprite, ...futuros];
}

/**
 * A geografia da especialização que criou esta construção (onde nasce, como se
 * chega), ou null se ela não é especializada. A identidade é o degrau da criação.
 */
export function geografiaDaConstrucao(elemento: GrowthElement): GeografiaDaEspecializacao | null {
  const definicao = elemento.marco ? definicaoDoMarco(elemento.marco.id) : null;
  return definicao?.efeito.tipo === 'criar' ? (definicao.efeito.geografia ?? null) : null;
}

/** Um acontecimento da vida de uma construção, com a definição que o explica. */
export interface CapituloDaConstrucao {
  marco: MarcoId;
  gatilho: string;
  contribuintes: string[];
  definicao: DefinicaoDeMarco | null;
}

/**
 * A história inteira de uma construção da progressão: a criação e cada
 * evolução, em ordem. `atual` é o último capítulo — o que o balão conta ao
 * tocar ("Este foi o primeiro abrigo do seu mundo. Com novos conhecimentos, ele
 * cresceu."). `null` se a construção não veio da progressão.
 */
export function historiaDoElemento(elemento: GrowthElement): {
  criacao: CapituloDaConstrucao;
  evolucoes: (CapituloDaConstrucao & Pick<EvolucaoDaConstrucao, 'de' | 'para'>)[];
  atual: CapituloDaConstrucao;
} | null {
  if (!elemento.marco) return null;
  const criacao: CapituloDaConstrucao = { ...elemento.marco, marco: elemento.marco.id, definicao: definicaoDoMarco(elemento.marco.id) };
  const evolucoes = (elemento.evolucoes ?? []).map((ev) => ({ ...ev, definicao: definicaoDoMarco(ev.marco) }));
  return { criacao, evolucoes, atual: evolucoes[evolucoes.length - 1] ?? criacao };
}
