// =====================================================================
// A COR ATMOSFÉRICA — o ambiente de cada curiosidade.
// Pura: lê o que foi cadastrado, nunca analisa pixel de imagem.
// =====================================================================
import type { ThemeKey } from '../../../shared/domain/themeKey';
import { ehHexDeCor, escurecerAte } from '../../../shared/theme/cor';
import { CAPA_DO_TEMA } from './coverTheme';

/**
 * O teto de luminância do topo. Com ele, o alto do post fica escuro o bastante
 * para o chip e a foto se lerem, mesmo que a cor cadastrada seja um
 * amarelo-claro. (O header não usa atmosfera: ele é sempre a cor do tema.)
 */
export const LUMINANCIA_MAXIMA_DO_TOPO = 0.1;

export interface Atmosfera {
  /** A cor cadastrada (ou a do tema), antes de escurecer. */
  base: string;
  /** A base escurecida o bastante para texto branco. É a que pinta o topo. */
  topo: string;
  /** De onde veio: do catálogo, ou do fallback do tema. */
  origem: 'catalogo' | 'tema';
}

/**
 * A atmosfera de uma curiosidade, pronta para desenhar.
 *
 * A cor é **editorial**: escolhida à mão, junto com a capa, no catálogo. Não há
 * cor dominante calculada no aparelho — zero custo por imagem, e a cor mais
 * frequente de uma foto raramente é a mais bonita.
 *
 * Sem cor cadastrada (ou com uma inválida), cai na cor da capa provisória do
 * tema — o sistema que já existe. Curiosidade antiga não quebra.
 *
 * Atmosfera ≠ tema: a atmosfera é o AMBIENTE da composição; a cor do tema segue
 * sendo a identidade editorial do assunto (o chip). Uma não substitui a outra.
 */
export function resolverAtmosfera(curiosidade: {
  tema: ThemeKey;
  corAtmosfera?: string;
}): Atmosfera {
  const cadastrada = ehHexDeCor(curiosidade.corAtmosfera) ? curiosidade.corAtmosfera : null;
  const base = (cadastrada ?? CAPA_DO_TEMA[curiosidade.tema].de).toLowerCase();
  return {
    base,
    topo: escurecerAte(base, LUMINANCIA_MAXIMA_DO_TOPO),
    origem: cadastrada ? 'catalogo' : 'tema',
  };
}
