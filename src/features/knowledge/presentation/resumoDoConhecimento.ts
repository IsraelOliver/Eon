// =====================================================================
// O RESUMO DO CONHECIMENTO — o que a tela "Seu conhecimento" mostra.
//
// Puro e só de leitura: recebe a jornada (total e afinidade de cada tema) e o
// estado dos ramos do mundo, já projetados pela composição — esta feature não
// importa learning nem world. Nenhum limiar aparece aqui: quem sabe se o
// próximo tier está perto é o mundo (`proximoPerto`).
//
// A frase de cada tema sai de UM estado (`estadoDoTema`) e de UMA tabela de
// frases (`FRASE`). Um ramo novo em `ESPECIALIZACOES` passa a aparecer sozinho;
// tema novo só pede o assunto dele em `ASSUNTO_DO_TEMA`.
// =====================================================================
import type { ThemeKey } from '../../../shared/domain/themeKey';

/** A ordem editorial da tela. Fixa de propósito: a tela não é um ranking. */
const ORDEM_DOS_TEMAS: readonly ThemeKey[] = ['astronomia', 'historia', 'geologia', 'natureza'];

/** Do que cada tema fala, para as frases ("Seu conhecimento sobre o céu…"). */
const ASSUNTO_DO_TEMA: Record<ThemeKey, string> = {
  astronomia: 'o céu',
  historia: 'o passado',
  geologia: 'a Terra',
  natureza: 'o mundo natural',
};

/** Num tema sem especialização, a partir de quantas descobertas ele já "deixa marcas". */
const AFINIDADE_RELEVANTE = 3;

/** O que a tela precisa saber de um ramo do mundo (o `EstadoDoRamo` do world cabe aqui). */
export interface RamoNoMundo {
  tema: ThemeKey;
  feitos: number;
  total: number;
  construcao: { nome: string; artigo: 'o' | 'a' | null } | null;
  proximoPerto: boolean;
}

export interface EntradaDoConhecimento {
  /** Quantas curiosidades a jornada aprendeu (o perfil real). */
  descobertas: number;
  /** A afinidade de cada tema: o `porTema` do perfil. */
  afinidade: Readonly<Record<ThemeKey, number>>;
  /** O nome de exibição de cada tema. */
  nomeDoTema: Readonly<Record<ThemeKey, string>>;
  /** O estado de cada ramo de especialização que existe no catálogo. */
  ramos: readonly RamoNoMundo[];
}

export interface TemaNoConhecimento {
  tema: ThemeKey;
  nome: string;
  afinidade: number;
  frase: string;
  /** Uma especialização do tema já está no mapa. */
  marcouOMundo: boolean;
}

export interface ResumoDoConhecimento {
  /** "27 descobertas" (já em texto). */
  descobertas: string;
  temas: TemaNoConhecimento[];
}

/** Em que ponto o conhecimento de um tema está no mundo. */
type EstadoDoTema =
  | 'intocado' // nenhuma descoberta do tema
  | 'comecando' // sem especialização, pouca afinidade
  | 'deixandoMarcas' // sem especialização, afinidade relevante
  | 'crescendo' // com especialização, ainda longe (ou a era fechada)
  | 'emBreve' // com especialização, o próximo tier está perto
  | 'construido' // um tier já está no mapa, o próximo ainda longe
  | 'evoluindo' // um tier já está no mapa, o próximo está perto
  | 'completo' // todos os tiers do ramo aconteceram
  | 'marcado'; // um tier aconteceu, mas a construção não está no mapa

function estadoDoTema(afinidade: number, ramo: RamoNoMundo | undefined): EstadoDoTema {
  if (ramo && ramo.feitos > 0) {
    if (!ramo.construcao) return 'marcado';
    if (ramo.feitos >= ramo.total) return 'completo';
    return ramo.proximoPerto ? 'evoluindo' : 'construido';
  }
  if (afinidade === 0) return 'intocado';
  if (!ramo) return afinidade >= AFINIDADE_RELEVANTE ? 'deixandoMarcas' : 'comecando';
  return ramo.proximoPerto ? 'emBreve' : 'crescendo';
}

/** O que as frases usam: o assunto do tema e a construção já com o artigo. */
interface Contexto {
  assunto: string;
  /** "Um ponto de observação" (ou só o nome, sem gênero conhecido). */
  um: string;
  /** "Seu ponto de observação" (ou só o nome, sem gênero conhecido). */
  seu: string;
}

const FRASE: Record<EstadoDoTema, (c: Contexto) => string> = {
  intocado: () => 'Este tema ainda espera pela sua primeira descoberta.',
  comecando: () => 'Seu interesse por este tema ainda está começando.',
  deixandoMarcas: () => 'Este conhecimento está começando a deixar marcas na sua jornada.',
  crescendo: ({ assunto }) => `Seu conhecimento sobre ${assunto} está crescendo.`,
  emBreve: ({ assunto }) => `Seu conhecimento sobre ${assunto} pode transformar o mundo em breve.`,
  construido: ({ um }) => `${um} já faz parte do seu mundo.`,
  evoluindo: ({ seu }) => `${seu} continua evoluindo.`,
  completo: ({ seu, assunto }) => `${seu} continua refletindo tudo o que você aprendeu sobre ${assunto}.`,
  marcado: ({ assunto }) => `Seu conhecimento sobre ${assunto} já deixou marcas no mundo.`,
};

/** "Um ponto de observação" / "Seu ponto de observação" — o nome vem com maiúscula. */
function comArtigo(construcao: RamoNoMundo['construcao'], forma: 'um' | 'seu'): string {
  if (!construcao) return '';
  const { nome, artigo } = construcao;
  if (!artigo) return nome;
  const inicio = forma === 'um' ? (artigo === 'o' ? 'Um' : 'Uma') : artigo === 'o' ? 'Seu' : 'Sua';
  return `${inicio} ${nome.charAt(0).toLowerCase()}${nome.slice(1)}`;
}

function rotuloDasDescobertas(n: number): string {
  if (n === 0) return 'Nenhuma descoberta ainda';
  return n === 1 ? '1 descoberta' : `${n} descobertas`;
}

/** Tudo o que a tela mostra, derivado do estado real. Nada aqui é salvo. */
export function obterResumoDoConhecimento(entrada: EntradaDoConhecimento): ResumoDoConhecimento {
  return {
    descobertas: rotuloDasDescobertas(entrada.descobertas),
    temas: ORDEM_DOS_TEMAS.map((tema) => {
      const afinidade = entrada.afinidade[tema] ?? 0;
      const ramo = entrada.ramos.find((r) => r.tema === tema);
      const estado = estadoDoTema(afinidade, ramo);
      const construcao = ramo?.construcao ?? null;
      return {
        tema,
        nome: entrada.nomeDoTema[tema],
        afinidade,
        frase: FRASE[estado]({
          assunto: ASSUNTO_DO_TEMA[tema],
          um: comArtigo(construcao, 'um'),
          seu: comArtigo(construcao, 'seu'),
        }),
        marcouOMundo: (ramo?.feitos ?? 0) > 0,
      };
    }),
  };
}
