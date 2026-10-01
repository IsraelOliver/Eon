// =====================================================================
// O QUE MOSTRAR DEPOIS DE APRENDER — escolhe a novidade mais importante
// e a frase que a anuncia. Pura: não sabe de câmera nem de tela.
// =====================================================================
import type { AssuntoDoMundo } from '../../../shared/domain/assunto';
import { definicaoDoMarco, FRASE_DA_ERA, type DefinicaoDeMarco } from './marcos';
import type { AcontecimentoDoMarco, GrowthElement, SpriteKey } from './types';

/**
 * Ordem de importância. Um aprendizado pode criar mais de uma coisa; a câmera
 * vai para a primeira desta lista que tiver nascido.
 */
const PRIORIDADE: readonly SpriteKey[] = [
  'posto_de_observacao', 'telescopio', 'fogueira', 'cabana', 'observatorio', 'mina', 'fonte', 'casa_maior', 'casa',
];

/** Quem não está na lista entra no fim, mas continua valendo como novidade. */
function posicao(tipo: SpriteKey): number {
  const i = PRIORIDADE.indexOf(tipo);
  return i === -1 ? PRIORIDADE.length : i;
}

/**
 * Frase por tipo. Fala do mundo, não do sistema: nada de "elemento",
 * "crescimento" ou nome de evento.
 */
const FRASE: Partial<Record<SpriteKey, string>> = {
  observatorio: 'Um observatório foi construído.',
  mina: 'Uma mina apareceu nas redondezas.',
  fonte: 'Sua vila ganhou uma fonte.',
  casa_maior: 'Uma construção maior foi erguida.',
  casa: 'Uma nova casa surgiu em sua vila.',
};

const FRASE_PADRAO = 'Algo novo brotou no seu mundo.';
const TITULO = 'Seu mundo cresceu';

/**
 * O que dizer sobre uma coisa que acabou de nascer.
 *
 * É a MESMA frase do destaque, exposta sozinha para as notícias do feed não
 * precisarem de um segundo catálogo de textos. Uma fonte, duas telas. O que
 * veio da progressão fala pela frase do degrau — o da última evolução, se houve.
 */
export function fraseDeCrescimento(elemento: GrowthElement): string {
  // o ÚLTIMO acontecimento da construção: a evolução mais recente, ou a criação
  const ultima = elemento.evolucoes?.[elemento.evolucoes.length - 1];
  const degrau = ultima ? ultima.marco : elemento.marco?.id;
  const definicao = degrau ? definicaoDoMarco(degrau) : null;
  return definicao?.frase ?? FRASE[elemento.tipo] ?? FRASE_PADRAO;
}

const ASSUNTO: Record<SpriteKey, AssuntoDoMundo> = {
  casa: 'casa',
  casa_maior: 'casa',
  fonte: 'fonte',
  cabana: 'cabana',
  fogueira: 'fogueira',
  // as especializações de Astronomia falam do céu, como o observatório
  telescopio: 'observatorio',
  posto_de_observacao: 'observatorio',
  observatorio: 'observatorio',
  mina: 'mina',
  arvore: 'natureza',
  pinheiro: 'natureza',
  cacto: 'natureza',
  acacia: 'natureza',
  pedra: 'natureza',
  arbusto: 'natureza',
};

/** Sobre o que a notícia desta construção fala — é o que escolhe o ícone dela. */
export function assuntoDeCrescimento(elemento: GrowthElement): AssuntoDoMundo {
  return ASSUNTO[elemento.tipo];
}

/** A manchete de um aprendizado: UMA frase, e sobre o que ela fala (o ícone). */
export interface Manchete {
  texto: string;
  assunto: AssuntoDoMundo;
}

/**
 * Quanto um acontecimento pesa para virar manchete (menor = mais importante):
 * especialização > construção criada/evoluída > a era > caminhos. Empate entre
 * construções: a `PRIORIDADE` do destaque, a mesma da câmera.
 */
const PESO_DA_ERA = 2;
function peso(definicao: DefinicaoDeMarco, elemento: GrowthElement | undefined): number {
  if (definicao.condicao.tipo === 'especializacao') return 0;
  if (elemento) return 1 + posicao(elemento.tipo) / (PRIORIDADE.length + 1);
  return 3; // caminhos
}

/**
 * A manchete do que UM aprendizado fez no mundo, ou null se ele não mudou nada
 * visível (só afinidade) — aí o World Pulse fica como está. Vem dos
 * acontecimentos reais de `aplicarMarcos`, nunca de olhar o mapa depois. O
 * texto é a `frase` do degrau: a fonte única das notícias.
 */
export function manchetePrincipal(
  acontecimentos: readonly AcontecimentoDoMarco[],
  eraAbriu: boolean,
): Manchete | null {
  let melhor: { peso: number; manchete: Manchete } | null = eraAbriu
    ? { peso: PESO_DA_ERA, manchete: { texto: FRASE_DA_ERA, assunto: 'casa' } }
    : null;
  for (const { marco, elemento } of acontecimentos) {
    const definicao = definicaoDoMarco(marco);
    if (!definicao) continue;
    const p = peso(definicao, elemento);
    if (melhor && melhor.peso <= p) continue; // empate: o primeiro do catálogo
    melhor = {
      peso: p,
      manchete: { texto: definicao.frase, assunto: elemento ? assuntoDeCrescimento(elemento) : 'caminho' },
    };
  }
  return melhor?.manchete ?? null;
}

export interface Destaque {
  /** Tile da novidade. Quem converte para pixels de arte é o desenho. */
  x: number;
  y: number;
  tipo: SpriteKey;
  titulo: string;
  subtitulo: string;
}

/**
 * A novidade que merece a atenção do jogador, ou `null` quando nada nasceu.
 *
 * Com mais de uma, escolhe a mais importante e anuncia essa — melhor uma frase
 * que o jogador entende do que uma contagem.
 */
export function escolherDestaque(adicionados: readonly GrowthElement[]): Destaque | null {
  if (adicionados.length === 0) return null;

  let melhor = adicionados[0];
  for (const elemento of adicionados) {
    if (posicao(elemento.tipo) < posicao(melhor.tipo)) melhor = elemento;
  }

  return {
    x: melhor.x,
    y: melhor.y,
    tipo: melhor.tipo,
    titulo: TITULO,
    subtitulo: fraseDeCrescimento(melhor),
  };
}
