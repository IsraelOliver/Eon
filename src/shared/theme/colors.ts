import { useColorScheme } from 'react-native';

const light = {
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
  /** Fundo do feed e dos cards de leitura. */
  fundoFeed: '#eef3f4',
  cartao: '#ffffff',
  /** Ação destrutiva (recomeçar jornada). */
  perigo: '#b3261e',
  perigoTexto: '#ffffff',
  astro: '#5b5fc7',
  hist: '#b5523b',
  geo: '#8a5a34',
  nat: '#3f6b3a',
};

export type Colors = typeof light;

const dark: Colors = {
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
  fundoFeed: '#0c1826',
  cartao: '#152537',
  perigo: '#d15b52',
  perigoTexto: '#1a0b09',
  astro: '#8a8ef0',
  hist: '#e0806a',
  geo: '#c89464',
  nat: '#7fb46f',
};

/** Cores da interface, seguindo o modo claro/escuro do sistema. */
export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}
