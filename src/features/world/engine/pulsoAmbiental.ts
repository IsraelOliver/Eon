// =====================================================================
// O MUNDO EM DIA COMUM — notícia de ambientação quando nada novo aconteceu.
// Pura: lê o estado salvo do mundo e escolhe uma frase. Sem relógio, sem sorteio.
// =====================================================================
import type { AssuntoDoMundo } from '../../../shared/domain/assunto';
import type { SpriteKey, WorldSnapshot } from './types';

export interface NoticiaAmbiental {
  assunto: AssuntoDoMundo;
  texto: string;
}

/**
 * As frases, por assunto.
 *
 * A regra de ouro: **só fala do que existe no mapa.** O jogo não tem população,
 * família, economia nem política — então nenhuma frase fala de nascimento,
 * eleição, comércio ou mudança. E nenhuma diz "nova": novidade de verdade é
 * notícia de progressão, não ambientação.
 *
 * Cada assunto só entra na conta quando o mundo tem aquilo (veja `presentes`).
 * É esse portão que impede a frase falsa — o vocabulário sozinho não bastaria.
 */
export const MODELOS_AMBIENTAIS: Record<AssuntoDoMundo, readonly string[]> = {
  observatorio: [
    'O observatório teve uma noite movimentada.',
    'O observatório passou a noite de olho no céu.',
  ],
  mina: [
    'Algumas pedras perto da mina chamaram atenção.',
    'A mina seguiu em atividade hoje.',
  ],
  fonte: [
    'A praça ficou movimentada nesta manhã.',
    'A área perto da fonte ficou movimentada hoje.',
    'Moradores se reuniram perto da fonte.',
  ],
  caminho: [
    'Os caminhos da vila foram bem percorridos hoje.',
    'A estrada já virou rota frequente da vila.',
  ],
  natureza: ['As árvores plantadas pelo conhecimento deram sombra hoje.'],
  casa: [
    'A vila amanheceu tranquila.',
    'A vila seguiu seu ritmo calmo hoje.',
    'Há movimento entre as casas da vila.',
  ],
  paisagem: [
    'Nenhuma construção ainda. Só natureza, por enquanto.',
    'A paisagem segue intocada. Aprender pode mudá-la.',
    'O mundo segue selvagem, à espera do primeiro conhecimento.',
  ],
};

/** Ordem fixa dos assuntos: é ela que intercala as frases (veja `intercalar`). */
const ORDEM: readonly AssuntoDoMundo[] = [
  'observatorio', 'mina', 'fonte', 'caminho', 'natureza', 'casa', 'paisagem',
];

const CONSTRUCOES: readonly SpriteKey[] = ['casa', 'casa_maior', 'fonte', 'observatorio', 'mina'];
const NATURAIS: readonly SpriteKey[] = ['arvore', 'pinheiro', 'cacto', 'acacia', 'pedra', 'arbusto'];

/**
 * Os assuntos sobre os quais é verdade falar, agora, neste mundo.
 *
 * Nunca volta vazio: sem construção nenhuma, sobra a paisagem; com qualquer
 * construção, o próprio tipo dela (casa, fonte, observatório ou mina) entra.
 */
export function assuntosPresentes(mundo: WorldSnapshot): AssuntoDoMundo[] {
  const tipos = new Set(mundo.crescimento.map((elemento) => elemento.tipo));
  const tem = (tipo: SpriteKey) => tipos.has(tipo);
  const construido = CONSTRUCOES.some(tem);

  const presentes: Record<AssuntoDoMundo, boolean> = {
    observatorio: tem('observatorio'),
    mina: tem('mina'),
    fonte: tem('fonte') || mundo.settlements.some((vila) => vila.fonte !== undefined),
    caminho: mundo.settlements.some((vila) => vila.caminhos.length > 0),
    natureza: NATURAIS.some(tem),
    casa: tem('casa') || tem('casa_maior'),
    // "Intocada" só é verdade enquanto nada foi construído.
    paisagem: !construido,
  };

  return ORDEM.filter((assunto) => presentes[assunto]);
}

/**
 * Todas as frases possíveis, uma de cada assunto por vez:
 * céu, mina, fonte, céu, mina, fonte…
 *
 * É o que faz duas entradas seguidas quase sempre mudarem de assunto — e não só
 * de frase — sem precisar lembrar de nada além de um contador.
 */
function intercalar(assuntos: readonly AssuntoDoMundo[]): NoticiaAmbiental[] {
  const maior = Math.max(...assuntos.map((a) => MODELOS_AMBIENTAIS[a].length));
  const lista: NoticiaAmbiental[] = [];
  for (let i = 0; i < maior; i += 1) {
    for (const assunto of assuntos) {
      const texto = MODELOS_AMBIENTAIS[assunto][i];
      if (texto !== undefined) lista.push({ assunto, texto });
    }
  }
  return lista;
}

export interface EscolhaAmbiental {
  /** Muda de mundo para mundo e de dia para dia: a primeira frase não é sempre a mesma. */
  semente: number;
  /** Quantas notícias ambientais já apareceram nesta sessão. */
  vez: number;
  /** A última frase mostrada. Nunca sai duas vezes seguidas. */
  anterior: string | null;
}

/** A notícia de um dia comum neste mundo. Determinística: mesma entrada, mesma frase. */
export function noticiaAmbiental(mundo: WorldSnapshot, escolha: EscolhaAmbiental): NoticiaAmbiental {
  const lista = intercalar(assuntosPresentes(mundo));
  const n = lista.length;
  let i = (((escolha.semente + escolha.vez) % n) + n) % n;
  if (n > 1 && lista[i].texto === escolha.anterior) i = (i + 1) % n;
  return lista[i];
}
