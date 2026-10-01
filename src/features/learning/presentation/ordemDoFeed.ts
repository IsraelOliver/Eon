// =====================================================================
// A ORDEM DO DISCOVERY — em que ordem as curiosidades aparecem no feed.
//
// Decidida UMA vez por sessão do app (quando ele abre de verdade) e fixa até
// fechar: navegar, abrir Configurações ou remontar a tela não mexe nela. Cobre
// o catálogo inteiro; quem tira as aprendidas continua sendo `paraDescobrir`,
// pelo perfil — então aprender uma curiosidade só a tira da lista, e as outras
// seguem na mesma ordem relativa.
//
// Hoje a estratégia é embaralhar por sessão. Amanhã pode ser recomendação ou
// rankeamento: basta trocar `ordemDaSessao` por outra `EstrategiaDeOrdem` — o
// feed não precisa mudar. Puro: sem React, sem relógio, sem Math.random.
// =====================================================================
import type { CuriosityId } from '../engine/types';

/** O que a estratégia sabe ao decidir a ordem da sessão. */
export interface ContextoDaOrdem {
  /** A semente da jornada (a do mundo): jornadas diferentes, ordens diferentes. */
  semente: number;
  /** Quantas vezes o app já abriu: cada abertura, uma ordem nova. */
  sessao: number;
  /** O que já foi aprendido — para saber qual será a primeira de fato. */
  aprendidas: readonly CuriosityId[];
  /** A primeira curiosidade da sessão anterior: se houver outra, ela não abre de novo. */
  evitarPrimeira: CuriosityId | null;
}

/** Uma estratégia de ordem: recebe o catálogo e devolve TODOS os ids, na ordem do feed. */
export type EstrategiaDeOrdem = (catalogo: readonly { id: CuriosityId }[], contexto: ContextoDaOrdem) => CuriosityId[];

/** Mistura duas sementes numa terceira. Determinístico: mesma dupla, mesma saída. */
function combinar(a: number, b: number): number {
  let h = Math.imul(a ^ 0x9e3779b9, 2654435761) ^ Math.imul(b + 0x85ebca6b, 1597334677);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h ^= h >>> 13;
  return h | 0;
}

/** Gerador pequeno e determinístico (mulberry32): mesma semente, mesma sequência. */
function gerador(semente: number): () => number {
  let a = semente;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Embaralha o catálogo com a semente da jornada + o número da abertura
 * (Fisher–Yates). Se a primeira curiosidade ainda não aprendida for a mesma
 * que abriu a sessão anterior e houver outra disponível, as duas trocam de lugar.
 */
export const embaralharPorSessao: EstrategiaDeOrdem = (catalogo, { semente, sessao, aprendidas, evitarPrimeira }) => {
  const ids = catalogo.map((c) => c.id);
  const aleatorio = gerador(combinar(semente, sessao));
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  if (evitarPrimeira) {
    const jaFoi = new Set(aprendidas);
    const disponiveis = ids.map((id, i) => [id, i] as const).filter(([id]) => !jaFoi.has(id));
    if (disponiveis.length > 1 && disponiveis[0][0] === evitarPrimeira) {
      const a = disponiveis[0][1];
      const b = disponiveis[1][1];
      [ids[a], ids[b]] = [ids[b], ids[a]];
    }
  }
  return ids;
};

/** A estratégia em uso. Trocar por recomendação/rankeamento é mudar esta linha. */
export const ordemDaSessao: EstrategiaDeOrdem = embaralharPorSessao;

/**
 * Os itens na ordem dada. Quem não estiver na ordem (uma curiosidade nova no
 * catálogo, por exemplo) vai para o fim, na ordem do catálogo — nada some.
 */
export function aplicarOrdem<T extends { id: CuriosityId }>(itens: readonly T[], ordem: readonly CuriosityId[]): T[] {
  const posicao = new Map(ordem.map((id, i) => [id, i]));
  const fora = ordem.length;
  return itens
    .map((item, i) => ({ item, chave: posicao.get(item.id) ?? fora + i }))
    .sort((a, b) => a.chave - b.chave)
    .map(({ item }) => item);
}
