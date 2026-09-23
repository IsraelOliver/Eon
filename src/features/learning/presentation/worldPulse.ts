// =====================================================================
// WORLD PULSE — a vitrine viva do estado da jornada.
// Puro: sem React, sem tela e sem sorteio. O relógio entra como parâmetro.
// =====================================================================
import type { AssuntoDoMundo } from '../../../shared/domain/assunto';
import type { IconeDoPulso } from '../../../shared/ui/icons';

/**
 * A conquista que a vitrine mostra, já em texto.
 *
 * Declarada aqui, e não importada de `achievements`: `learning` mostra, mas não
 * conhece a feature que decide o que foi conquistado. Quem traduz é a composição.
 */
export interface ConquistaDoPulso {
  id: string;
  nome: string;
  descricao: string;
}

/**
 * Uma novidade real do mundo, já virada em texto.
 *
 * O formato é declarado **aqui**, no lado de `learning`: esta feature não pode
 * enxergar `world`. Quem traduz a construção em frase e assunto é a composição.
 */
export interface NoticiaDoMundo {
  id: number;
  texto: string;
  assunto: AssuntoDoMundo;
  criadoEm: number;
  /** Já apareceu no pulso. Vista uma vez, nunca mais toma a vez de ninguém. */
  vista: boolean;
}

/** Há quanto tempo, em palavras. Só existe para notícia com hora de verdade. */
export type Quando = 'agora' | 'há pouco' | 'hoje';

/**
 * O que o World Pulse mostra. Um item só, sempre — o pulso nunca fica vazio.
 *
 * `descoberta` já existe no contrato e tem estilo próprio no card, mas nada a
 * produz ainda: quando o mapa ganhar achados raros, basta a composição passar a
 * gerá-la. Nenhum componente precisa mudar.
 */
export type WorldPulseItem =
  | { tipo: 'noticia'; categoria: 'progressao'; texto: string; icone: IconeDoPulso; quando: Quando | null }
  | { tipo: 'noticia'; categoria: 'ambiental'; texto: string; icone: IconeDoPulso }
  | { tipo: 'conquista'; titulo: string; texto: string; icone: IconeDoPulso }
  | { tipo: 'descoberta'; titulo: string; texto: string; icone: IconeDoPulso };

export interface CandidatosDoPulso {
  conquistaNova: ConquistaDoPulso | null;
  /** A mais antiga ainda não vista (veja `proximaNoticia`), ou null. */
  noticiaDeProgressao: NoticiaDoMundo | null;
  /** Sempre existe: o mundo sempre tem algo a dizer sobre si mesmo. */
  noticiaAmbiental: { assunto: AssuntoDoMundo; texto: string };
  agora: number;
}

/**
 * A regra, num lugar só: conquista nova > notícia real > notícia ambiental.
 *
 * Conquista vem na frente porque é rara — marco acontece uma vez. Notícia real é
 * o mundo contando o que o conhecimento fez. A ambiental é o dia comum: nunca é
 * "vista", nunca acaba, e é por isso que o pulso nunca precisa ficar vazio.
 *
 * Sem `Math.random`, sem timer: os mesmos candidatos dão sempre o mesmo item.
 */
export function escolherWorldPulse({
  conquistaNova, noticiaDeProgressao, noticiaAmbiental, agora,
}: CandidatosDoPulso): WorldPulseItem {
  if (conquistaNova) {
    return {
      tipo: 'conquista',
      titulo: conquistaNova.nome,
      texto: conquistaNova.descricao,
      icone: 'conquista',
    };
  }
  if (noticiaDeProgressao) {
    return {
      tipo: 'noticia',
      categoria: 'progressao',
      texto: noticiaDeProgressao.texto,
      icone: noticiaDeProgressao.assunto,
      quando: quandoFoi(noticiaDeProgressao.criadoEm, agora),
    };
  }
  return {
    tipo: 'noticia',
    categoria: 'ambiental',
    texto: noticiaAmbiental.texto,
    icone: noticiaAmbiental.assunto,
  };
}

const MINUTO = 60_000;

/**
 * Há quanto tempo, sem inventar precisão: "agora", "há pouco" ou "hoje".
 * De outro dia (o app ficou aberto de madrugada) não diz nada — melhor calar
 * do que chamar ontem de hoje.
 */
export function quandoFoi(criadoEm: number, agora: number): Quando | null {
  const passou = agora - criadoEm;
  if (passou < 0) return null;
  if (new Date(criadoEm).toDateString() !== new Date(agora).toDateString()) return null;
  if (passou < 2 * MINUTO) return 'agora';
  if (passou < 60 * MINUTO) return 'há pouco';
  return 'hoje';
}

/**
 * A próxima da fila: a mais **antiga** ainda não vista.
 *
 * Uma por entrada, na ordem em que o mundo as viveu — quem chegou primeiro é
 * contado primeiro, e o pulso não vira uma parede de avisos.
 */
export function proximaNoticia(noticias: readonly NoticiaDoMundo[]): NoticiaDoMundo | null {
  return noticias.find((noticia) => !noticia.vista) ?? null;
}

/** Devolve a lista com uma notícia marcada como vista. Não muda a original. */
export function marcarNoticiaVista(
  noticias: readonly NoticiaDoMundo[],
  id: number,
): NoticiaDoMundo[] {
  return noticias.map((noticia) => (noticia.id === id ? { ...noticia, vista: true } : noticia));
}
