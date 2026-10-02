/**
 * Um lugar do mapa, em TILES do mundo. Vocabulário comum: o mundo diz onde algo
 * nasceu, e quem não conhece o mundo (as conquistas) só guarda e devolve o ponto.
 * Quem converte para pixels ou para a câmera é o mundo.
 */
export interface LugarNoMundo {
  x: number;
  y: number;
}
