// =====================================================================
// CORES DA INTERFACE — e, por enquanto, o laboratório de paletas.
//
// Os componentes só conhecem os TOKENS abaixo; nenhum deles pergunta qual
// paleta está ativa. Trocar de paleta é trocar os valores por trás dos mesmos
// nomes, o que faz a interface inteira mudar sem duplicar componente nenhum.
//
// O seletor é ferramenta de DESENVOLVIMENTO: não entra no save da jornada e
// some quando a identidade final for escolhida.
// =====================================================================

const atualClaro = {
  bg: '#dce8ea',
  panel: '#ffffff',
  ink: '#1c2a33',
  muted: '#51626d',
  line: '#b9cad0',
  pressed: 'rgba(28,42,51,0.08)',
  /** Fundo escurecido por trás de janelas e da apresentação da jornada. */
  overlay: 'rgba(0,0,0,0.6)',
  /** Barra de navegação flutuante e destaque do item ativo. */
  barra: 'rgba(22,32,40,0.92)',
  barraAtivo: '#f2f6f7',
  barraTexto: '#c8d4da',
  barraTextoAtivo: '#16202a',
  /** Item da barra sob o dedo. Precisa contrastar com `barra`, não com o fundo. */
  barraPressionado: 'rgba(255,255,255,0.14)',
  /** Fundo do feed e dos cards de leitura. */
  fundoFeed: '#eef3f4',
  cartao: '#ffffff',
  /** Ação destrutiva (recomeçar jornada). Vermelho em qualquer paleta. */
  perigo: '#b3261e',
  perigoTexto: '#ffffff',
  /**
   * Cores dos TEMAS educacionais. Identidade do conteúdo, não da interface:
   * elas seguem a legibilidade (claro/escuro), não a personalidade da paleta.
   */
  astro: '#5b5fc7',
  hist: '#b5523b',
  geo: '#8a5a34',
  nat: '#3f6b3a',
};

export type Colors = typeof atualClaro;

const atualEscuro: Colors = {
  bg: '#0f1d2e',
  panel: '#172a40',
  ink: '#e6eef3',
  muted: '#9fb3c2',
  line: '#2c4560',
  pressed: 'rgba(230,238,243,0.08)',
  overlay: 'rgba(0,0,0,0.6)',
  barra: 'rgba(12,22,34,0.92)',
  barraAtivo: '#26405c',
  barraTexto: '#9fb3c2',
  barraTextoAtivo: '#e6eef3',
  barraPressionado: 'rgba(255,255,255,0.14)',
  fundoFeed: '#0c1826',
  cartao: '#152537',
  perigo: '#d15b52',
  perigoTexto: '#1a0b09',
  astro: '#8a8ef0',
  hist: '#e0806a',
  geo: '#c89464',
  nat: '#7fb46f',
};

/** Cores de tema que leem bem sobre fundo claro / sobre fundo escuro. */
const temasClaros = { astro: '#5b5fc7', hist: '#b5523b', geo: '#8a5a34', nat: '#3f6b3a' };
const temasEscuros = { astro: '#8a8ef0', hist: '#e0806a', geo: '#c89464', nat: '#7fb46f' };

// ---------------------------------------------------------------------
// As paletas em teste.
// ---------------------------------------------------------------------

const violetaPessego: Colors = {
  bg: '#fff8f0',
  panel: '#ffffff',
  ink: '#312c51',
  muted: '#6f6885',
  line: '#e6dacb',
  pressed: 'rgba(49,44,81,0.08)',
  overlay: 'rgba(49,44,81,0.6)',
  barra: 'rgba(49,44,81,0.94)',
  barraAtivo: '#f0c38e',
  barraTexto: '#ded7ea',
  barraTextoAtivo: '#312c51',
  barraPressionado: 'rgba(255,255,255,0.16)',
  fundoFeed: '#fbf2e8',
  cartao: '#ffffff',
  perigo: '#b3261e',
  perigoTexto: '#ffffff',
  ...temasClaros,
};

const midnightGold: Colors = {
  bg: '#12131a',
  panel: '#202128',
  ink: '#fff8f0',
  muted: '#a9aab5',
  line: '#30323c',
  pressed: 'rgba(255,248,240,0.08)',
  overlay: 'rgba(0,0,0,0.66)',
  barra: 'rgba(32,33,40,0.94)',
  barraAtivo: '#f8ab57',
  barraTexto: '#a9aab5',
  barraTextoAtivo: '#12131a',
  barraPressionado: 'rgba(255,255,255,0.12)',
  fundoFeed: '#171821',
  cartao: '#202128',
  perigo: '#e5484d',
  perigoTexto: '#ffffff',
  ...temasEscuros,
};

const ibizaSunset: Colors = {
  bg: '#17121f',
  panel: '#251a32',
  ink: '#ffffff',
  muted: '#d4c8da',
  line: '#3a2b4a',
  pressed: 'rgba(255,255,255,0.08)',
  overlay: 'rgba(23,18,31,0.7)',
  barra: 'rgba(37,26,50,0.94)',
  barraAtivo: '#ee0979',
  barraTexto: '#d4c8da',
  barraTextoAtivo: '#ffffff',
  barraPressionado: 'rgba(255,255,255,0.12)',
  fundoFeed: '#1d1628',
  cartao: '#251a32',
  // O rosa já é a identidade, então o perigo puxa para o vermelho, mais grave.
  perigo: '#d32029',
  perigoTexto: '#ffffff',
  ...temasEscuros,
};

const creamOrange: Colors = {
  bg: '#fff3e2',
  panel: '#ffffff',
  ink: '#222222',
  muted: '#68635e',
  line: '#e8d8c2',
  pressed: 'rgba(34,34,34,0.08)',
  overlay: 'rgba(34,34,34,0.6)',
  barra: 'rgba(34,34,34,0.94)',
  barraAtivo: '#f8ab57',
  barraTexto: '#e6ded3',
  barraTextoAtivo: '#222222',
  barraPressionado: 'rgba(255,255,255,0.14)',
  fundoFeed: '#fbecd8',
  cartao: '#ffffff',
  perigo: '#b3261e',
  perigoTexto: '#ffffff',
  ...temasClaros,
};

const deepViolet: Colors = {
  bg: '#211d35',
  panel: '#312c51',
  ink: '#fff8f0',
  muted: '#d6d0e4',
  line: '#48426d',
  pressed: 'rgba(255,248,240,0.08)',
  overlay: 'rgba(20,17,32,0.66)',
  barra: 'rgba(33,29,53,0.94)',
  barraAtivo: '#f0c38e',
  barraTexto: '#d6d0e4',
  barraTextoAtivo: '#211d35',
  barraPressionado: 'rgba(255,255,255,0.12)',
  fundoFeed: '#262138',
  cartao: '#312c51',
  perigo: '#d9534f',
  perigoTexto: '#ffffff',
  ...temasEscuros,
};

export type PaletteKey =
  | 'atual'
  | 'violetaPessego'
  | 'midnightGold'
  | 'ibizaSunset'
  | 'creamOrange'
  | 'deepViolet';

export interface Paleta {
  nome: string;
  /**
   * Só a paleta Atual acompanha o claro/escuro do aparelho — ela é a referência
   * e precisa continuar idêntica. As em teste são fixas de propósito: escolher
   * uma escura num aparelho em modo claro tem que mostrar a paleta escura, e não
   * metade de cada.
   */
  seguirSistema: boolean;
  claro: Colors;
  escuro: Colors;
  /** Ícones da barra de status que leem bem sobre o fundo desta paleta. */
  statusBar: 'light' | 'dark';
  /** Quatro cores para o seletor: fundo, principal, acento e tinta. */
  amostra: readonly [string, string, string, string];
}

export const PALETAS: Record<PaletteKey, Paleta> = {
  atual: {
    nome: 'Atual',
    seguirSistema: true,
    claro: atualClaro,
    escuro: atualEscuro,
    statusBar: 'light',
    amostra: ['#dce8ea', '#1c2a33', '#f2f6f7', '#51626d'],
  },
  violetaPessego: {
    nome: 'Violeta & Pêssego',
    seguirSistema: false,
    claro: violetaPessego,
    escuro: violetaPessego,
    statusBar: 'dark',
    amostra: ['#fff8f0', '#48426d', '#f0c38e', '#312c51'],
  },
  midnightGold: {
    nome: 'Midnight & Gold',
    seguirSistema: false,
    claro: midnightGold,
    escuro: midnightGold,
    statusBar: 'light',
    amostra: ['#12131a', '#f8ab57', '#fec674', '#fff8f0'],
  },
  ibizaSunset: {
    nome: 'Ibiza Sunset',
    seguirSistema: false,
    claro: ibizaSunset,
    escuro: ibizaSunset,
    statusBar: 'light',
    amostra: ['#17121f', '#ee0979', '#ff6a00', '#ffffff'],
  },
  creamOrange: {
    nome: 'Cream & Orange',
    seguirSistema: false,
    claro: creamOrange,
    escuro: creamOrange,
    statusBar: 'dark',
    amostra: ['#fff3e2', '#f8ab57', '#fec674', '#222222'],
  },
  deepViolet: {
    nome: 'Deep Violet',
    seguirSistema: false,
    claro: deepViolet,
    escuro: deepViolet,
    statusBar: 'light',
    amostra: ['#211d35', '#f0c38e', '#f1aa9b', '#fff8f0'],
  },
};

export const CHAVES_DE_PALETA = Object.keys(PALETAS) as PaletteKey[];

/** Com que paleta o app abre. Enquanto for experimento, é a Atual. */
export const PALETA_PADRAO: PaletteKey = 'atual';
