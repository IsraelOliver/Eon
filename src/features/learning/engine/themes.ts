import type { ThemeKey } from '../../../shared/domain/themeKey';

/**
 * Nome de exibição de cada tema no feed e na leitura.
 * Fica aqui porque `learning` não pode importar `world` (que tem os seus TEMAS,
 * com regras de onde cada tema faz algo surgir no mapa).
 */
export const NOMES_DE_TEMA: Record<ThemeKey, string> = {
  astronomia: 'Astronomia',
  historia: 'História',
  geologia: 'Geologia',
  natureza: 'Natureza',
};
