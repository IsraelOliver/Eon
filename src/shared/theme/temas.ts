// =====================================================================
// OS DOIS TEMAS — a MESMA identidade aplicada a superfícies diferentes.
//
// Claro e escuro não são duas paletas: os dois saem só das cores de `MARCA`,
// com opacidade ou mistura entre elas. Nenhum hex novo nasce aqui.
// Puro: sem React, testável fora do app.
// =====================================================================
import { comAlfa, misturar } from './cor';
import { MARCA } from './marca';

/**
 * Os tokens que os componentes leem. Nenhum componente pergunta "claro ou
 * escuro?": ele pede `ink`, `line`, `accent`… e o tema responde.
 */
export interface Colors {
  /** Fundo base das telas (mundo carregando, raiz). */
  bg: string;
  /** Superfície elevada: janelas, cartões de diálogo. */
  panel: string;
  /** Texto principal e ícones fortes. */
  ink: string;
  /** Texto secundário. No claro é grafite translúcido: o cinza puro não passa em contraste. */
  muted: string;
  /** Divisores, bordas e detalhes decorativos. */
  line: string;
  /** Fundo de algo sob o dedo. */
  pressed: string;
  /** Véu por trás de janelas e da apresentação da jornada. */
  overlay: string;
  /** A barra de ações: um controle pequeno do mundo, não uma cápsula de sistema. */
  barra: string;
  barraBorda: string;
  /** O seletor que viaja pela barra. */
  barraAtivo: string;
  barraAtivoBorda: string;
  barraTexto: string;
  barraTextoAtivo: string;
  /** Fundo do Discovery e da leitura. */
  fundoFeed: string;
  /** Superfície sutil, um degrau abaixo do fundo: World Pulse, cartões. */
  cartao: string;
  /** Ação destrutiva. Só o vermelho de perigo — nunca o laranja. */
  perigo: string;
  perigoTexto: string;
  /** A identidade do Éon: ação, descoberta, destaque. */
  accent: string;
  /** O laranja escuro: pressionado, ênfase, recompensa. */
  accentStrong: string;
  /** Texto sobre o laranja. Grafite: branco sobre #F27927 fica em 2,6:1. */
  accentTexto: string;
  /**
   * O laranja usado COMO TEXTO sobre as superfícies do tema. O laranja claro
   * some sobre branco (2,6:1), então no claro este é o laranja escuro, um degrau
   * mais fundo; no escuro, o claro se lê bem sobre grafite.
   */
  accentLegivel: string;
  /** O cinza da marca: ícones, detalhes, placeholders — não texto pequeno no claro. */
  neutral: string;
  /** Cor das sombras. Preta; no escuro elas quase somem, e quem separa é a borda. */
  sombra: string;
}

const { grafite, laranja, laranjaEscuro, preto, branco, cinza, perigo } = MARCA;

/** Comum aos dois: a barra de ações e a marca são as mesmas em qualquer tema. */
const identidade = {
  // A barra é igual nos dois temas: grafite com fio laranja escuro, e um
  // seletor laranja pequeno — o controle pertence ao mundo, não ao tema.
  barra: grafite,
  barraBorda: laranjaEscuro,
  barraAtivo: laranja,
  barraAtivoBorda: laranjaEscuro,
  barraTexto: cinza,
  /** Grafite sobre o seletor laranja: 5,5:1. */
  barraTextoAtivo: grafite,
  // O vermelho da marca, um degrau mais fundo (10% de preto): texto branco sobre
  // o #E5484D puro fica em 3,9:1; assim passa de 4,5:1 sem sair da cor oficial.
  perigo: misturar(perigo, preto, 0.1),
  perigoTexto: branco,
  accent: laranja,
  accentStrong: laranjaEscuro,
  accentTexto: grafite,
  neutral: cinza,
  sombra: preto,
};

export const temaEscuro: Colors = {
  ...identidade,
  bg: grafite,
  // Grafite com 6% de branco: superfície elevada sem inventar outro cinza.
  panel: misturar(grafite, branco, 0.06),
  ink: branco,
  accentLegivel: laranja,
  // O cinza da marca sobre grafite passa de 6:1 — aqui ele serve como texto.
  muted: cinza,
  line: comAlfa(branco, 0.14),
  pressed: comAlfa(branco, 0.08),
  overlay: comAlfa(preto, 0.6),
  fundoFeed: grafite,
  // Um degrau mais fundo que o grafite, sem virar bloco de preto puro.
  cartao: misturar(grafite, preto, 0.35),
};

export const temaClaro: Colors = {
  ...identidade,
  bg: branco,
  panel: branco,
  ink: grafite,
  // Laranja escuro com 10% de preto: puro, ele fica em 4,0:1 sobre branco — pouco
  // para um rótulo de 11 px. Assim passa de 4,5:1 e continua sendo o laranja.
  accentLegivel: misturar(laranjaEscuro, preto, 0.1),
  muted: comAlfa(grafite, 0.65),
  line: comAlfa(grafite, 0.14),
  pressed: comAlfa(grafite, 0.06),
  overlay: comAlfa(preto, 0.45),
  fundoFeed: branco,
  // Grafite com 4% sobre branco: a superfície sutil do tema claro.
  cartao: misturar(branco, grafite, 0.04),
};

// ---------------------------------------------------------------------
// A preferência da pessoa e o tema que ela produz.
// ---------------------------------------------------------------------

/** O que a pessoa escolhe em Configurações → Aparência. */
export type ThemePreference = 'system' | 'light' | 'dark';

/** O tema que de fato está na tela. */
export type TemaEfetivo = 'light' | 'dark';

export const PREFERENCIA_PADRAO: ThemePreference = 'system';

/**
 * Lê uma preferência vinda do disco (ou de qualquer lugar). O que não for uma
 * das três vira `'system'` — instalação nova e dado estranho caem no mesmo
 * lugar seguro.
 */
export function lerPreferencia(valor: unknown): ThemePreference {
  return valor === 'light' || valor === 'dark' || valor === 'system' ? valor : PREFERENCIA_PADRAO;
}

/**
 * O tema efetivo. `'system'` segue o aparelho; escolha manual ignora o aparelho.
 * Se o sistema não disser nada (`null`), o Éon abre claro.
 */
export function resolverTema(
  preferencia: ThemePreference,
  doSistema: 'light' | 'dark' | null | undefined,
): TemaEfetivo {
  if (preferencia !== 'system') return preferencia;
  return doSistema === 'dark' ? 'dark' : 'light';
}

export function coresDoTema(tema: TemaEfetivo): Colors {
  return tema === 'dark' ? temaEscuro : temaClaro;
}

/** Ícones da barra de status que leem sobre o fundo do tema. */
export function estiloDaStatusBar(tema: TemaEfetivo): 'light' | 'dark' {
  return tema === 'dark' ? 'light' : 'dark';
}
