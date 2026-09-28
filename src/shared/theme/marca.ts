// =====================================================================
// AS CORES OFICIAIS DO ÉON — a fonte única. Nenhum outro hex de interface.
//
// Estas são as cores BRUTAS da marca. Componentes não as usam direto: eles
// leem os tokens semânticos do tema (`useColors()`), que decidem como cada cor
// vira fundo, texto, borda ou destaque no claro e no escuro.
//
// Fora daqui, cor literal só em conteúdo com identidade própria: biomas do
// mapa, cores dos temas educacionais, `corAtmosfera` das curiosidades e sprites.
// =====================================================================

export const MARCA = {
  grafite: '#26252C',
  laranjaEscuro: '#C66320',
  laranja: '#F27927',
  preto: '#000000',
  branco: '#FFFFFF',
  cinza: '#9BADB7',
  /** A única exceção semântica: ação destrutiva. Nunca o laranja. */
  perigo: '#E5484D',
} as const;
