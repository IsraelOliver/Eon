import { NOMES } from '../engine/rules';
import type { TileType } from '../engine/types';
import { COR, criarPaleta } from './palette';

export interface ItemLegenda {
  tipo: TileType;
  nome: string;
  /** Cor pronta para estilo, ex.: "rgb(42,111,214)". */
  cor: string;
}

/** Nome e cor de cada tipo de tile, na mesma cor usada no mapa. */
export function montarLegenda(pergaminho = false): ItemLegenda[] {
  const P = criarPaleta(pergaminho);
  return (Object.keys(NOMES) as TileType[]).map((tipo) => {
    const [r, g, b] = P(COR[tipo]).map(Math.round);
    return { tipo, nome: NOMES[tipo], cor: `rgb(${r},${g},${b})` };
  });
}
