import { useColorScheme } from 'react-native';

const light = {
  bg: '#dce8ea',
  panel: '#ffffff',
  ink: '#1c2a33',
  muted: '#51626d',
  line: '#b9cad0',
  pressed: 'rgba(28,42,51,0.08)',
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
  astro: '#8a8ef0',
  hist: '#e0806a',
  geo: '#c89464',
  nat: '#7fb46f',
};

/** Cores da interface, seguindo o modo claro/escuro do sistema. */
export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}
