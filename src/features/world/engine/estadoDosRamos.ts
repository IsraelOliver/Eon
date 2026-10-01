// =====================================================================
// O ESTADO DOS RAMOS — o que cada especialização já fez neste mundo.
//
// Só LEITURA: deriva do catálogo (`ESPECIALIZACOES`), das construções e da
// jornada. Nada aqui é salvo e nada decide crescimento. Quem lê é a tela
// "Seu conhecimento" (pela composição), que não pode saber dos limiares: por
// isso o "perto" sai daqui pronto, sem dizer quantas faltam.
// =====================================================================
import type { ThemeKey } from '../../../shared/domain/themeKey';
import {
  degrausQueJaAconteceram, especializacoesDesbloqueadas, ESPECIALIZACOES, type ProgressoDaJornada,
} from './marcos';
import { ARTIGO_DA_CONSTRUCAO, NOME_DA_CONSTRUCAO } from './selecao';
import type { GrowthElement } from './types';

/** Quantas curiosidades do tema antes do próximo tier já contam como "em breve". */
const PERTO_DO_PROXIMO = 2;

export interface EstadoDoRamo {
  tema: ThemeKey;
  /** Quantos tiers do ramo já aconteceram neste mundo. */
  feitos: number;
  /** Quantos tiers o ramo tem no catálogo. */
  total: number;
  /**
   * A construção do ramo como está hoje — o nome que o jogador vê ao tocá-la, e
   * o gênero dele. null enquanto nenhum tier construiu nada.
   */
  construcao: { nome: string; artigo: 'o' | 'a' | null } | null;
  /** A era está aberta e o próximo tier está a poucas curiosidades do tema (ou a uma só). */
  proximoPerto: boolean;
}

/** Um estado por ramo de `ESPECIALIZACOES`, na ordem do catálogo. */
export function estadoDosRamos(
  crescimento: readonly GrowthElement[],
  progresso: ProgressoDaJornada,
): EstadoDoRamo[] {
  const eraAberta = especializacoesDesbloqueadas(progresso);
  const aconteceram = degrausQueJaAconteceram(crescimento);
  return ESPECIALIZACOES.map((ramo) => {
    const ids = new Set(ramo.tiers.map((t) => t.id));
    // a construção do ramo: a que um tier criou, ou a que um tier evoluiu
    const elemento = crescimento.find(
      (e) => (e.marco && ids.has(e.marco.id)) || e.evolucoes?.some((ev) => ids.has(ev.marco)),
    );
    const nome = elemento && NOME_DA_CONSTRUCAO[elemento.tipo];
    const proximo = ramo.tiers.find((t) => !aconteceram.has(t.id));
    const falta =
      proximo?.condicao.tipo === 'especializacao'
        ? proximo.condicao.afinidade - (progresso.porTema?.[ramo.tema] ?? 0)
        : Infinity;
    return {
      tema: ramo.tema,
      feitos: ramo.tiers.filter((t) => aconteceram.has(t.id)).length,
      total: ramo.tiers.length,
      construcao: elemento && nome ? { nome, artigo: ARTIGO_DA_CONSTRUCAO[elemento.tipo] ?? null } : null,
      proximoPerto: eraAberta && falta <= PERTO_DO_PROXIMO,
    };
  });
}
