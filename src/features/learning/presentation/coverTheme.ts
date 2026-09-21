import type { ThemeKey } from '../../../shared/domain/themeKey';

export interface EstiloDeCapa {
  /** Cor do topo da capa. */
  de: string;
  /** Cor da base, onde o degradê escuro do card começa. */
  para: string;
  /** Marca grande e apagada ao fundo, só para a capa não ficar vazia. */
  simbolo: string;
}

/**
 * Capa provisória de cada tema, usada enquanto a curiosidade não tem imagem
 * própria em `coverImages.ts`. O card nunca fica branco, e a troca por uma foto
 * real não muda nada no layout.
 */
export const CAPA_DO_TEMA: Record<ThemeKey, EstiloDeCapa> = {
  astronomia: { de: '#2a2f6b', para: '#0c1030', simbolo: '✦' },
  historia: { de: '#6b3428', para: '#2a1109', simbolo: '⌘' },
  geologia: { de: '#6b4a24', para: '#2a1a08', simbolo: '◈' },
  natureza: { de: '#25562c', para: '#08200d', simbolo: '❧' },
};
