// =====================================================================
// O QUE MOSTRAR DEPOIS DE APRENDER — escolhe a novidade mais importante
// e a frase que a anuncia. Pura: não sabe de câmera nem de tela.
// =====================================================================
import type { AssuntoDoMundo } from '../../../shared/domain/assunto';
import type { GrowthElement, SpriteKey } from './types';

/**
 * Ordem de importância. Um aprendizado pode criar mais de uma coisa; a câmera
 * vai para a primeira desta lista que tiver nascido.
 */
const PRIORIDADE: readonly SpriteKey[] = ['observatorio', 'mina', 'fonte', 'casa_maior', 'casa'];

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
 * precisarem de um segundo catálogo de textos. Uma fonte, duas telas.
 */
export function fraseDeCrescimento(elemento: GrowthElement): string {
  return FRASE[elemento.tipo] ?? FRASE_PADRAO;
}

const ASSUNTO: Record<SpriteKey, AssuntoDoMundo> = {
  casa: 'casa',
  casa_maior: 'casa',
  fonte: 'fonte',
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
