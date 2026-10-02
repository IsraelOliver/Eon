// =====================================================================
// TERRENO CONSTRUÍVEL — onde uma construção pode pisar.
//
// A âncora não basta: o sprite ocupa um retângulo (footprint.ts) que sobe a
// partir dela. Aqui se confere o TERRENO sob esse retângulo inteiro — ou, para
// as árvores, sob a base do tronco (baseDaArvore).
// Medidas em TILES (o PNG não cresce com o mundo).
// =====================================================================
import { baseDaArvore, retanguloDe } from './footprint';
import { H, W } from './rules';
import type { SpriteKey, TileType, World } from './types';

/** O que a checagem de terreno precisa do mundo (a natureza usa antes de o World existir). */
export type Terreno = Pick<World, 'tipo' | 'distAgua'>;

/**
 * - `firme`: pode ficar sob uma construção.
 * - `entorno`: só pode ficar em volta (areia, rocha), nunca sob a construção.
 * - `invalido`: água — nem sob, nem perto demais (ver MARGEM_AGUA).
 */
export type Solo = 'firme' | 'entorno' | 'invalido';

const SOLO: Record<TileType, Solo> = {
  planicie: 'firme',
  savana: 'firme',
  floresta: 'firme',
  deserto: 'firme',
  tundra: 'firme',
  praia: 'entorno',
  montanha: 'entorno',
  neve: 'entorno',
  oceano: 'invalido',
  raso: 'invalido',
  lago: 'invalido',
};

/**
 * Distância mínima (em tiles) entre QUALQUER tile sob a construção e a água.
 * 2 = sobra pelo menos 1 tile de terra entre a construção e a água.
 * Tipos sem entrada usam 1 (só não pisar na água).
 */
export const MARGEM_AGUA: Partial<Record<SpriteKey, number>> = {
  casa: 2,
  casa_maior: 4, // construção importante: mais longe da borda
  fonte: 3,
  cabana: 2,
  fogueira: 2,
  telescopio: 2,
  posto_de_observacao: 2,
  // árvores: um anel inteiro de terra em volta do tronco. A distância é em passos
  // retos (generate.ts), então 2 ainda deixaria a água encostar na diagonal.
  arvore: 3,
  pinheiro: 3,
  acacia: 3,
  cacto: 3,
};

export function soloDoTile(mundo: Terreno, x: number, y: number): Solo {
  if (x < 0 || y < 0 || x >= W || y >= H) return 'invalido';
  return SOLO[mundo.tipo[y * W + x]];
}

/** Este tipo de terreno pode ficar sob uma construção? */
export function tipoConstruivel(tipo: TileType): boolean {
  return SOLO[tipo] === 'firme';
}

/** O tile pode ficar sob uma construção? */
export function tileConstruivel(mundo: Terreno, x: number, y: number): boolean {
  return soloDoTile(mundo, x, y) === 'firme';
}

/** Tiles até a água mais próxima (0 = é água). Pré-calculado na geração do mundo. */
export function distanciaDaAgua(mundo: Terreno, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= W || y >= H) return 0;
  return mundo.distAgua[y * W + x];
}

/**
 * Todos os tiles tocados pelo retângulo da construção (ou pela base da árvore)
 * são firmes e estão a pelo menos MARGEM_AGUA da água? Firme exclui água, praia,
 * montanha e neve. Sprites sem footprint nem tronco (mina, observatório, pedra…)
 * passam: para eles vale só a checagem da âncora.
 */
export function footprintEmTerrenoValido(mundo: Terreno, tipo: SpriteKey, x: number, y: number): boolean {
  const r = retanguloDe(tipo, x, y) ?? baseDaArvore(tipo, x, y);
  if (!r) return true;
  const margem = MARGEM_AGUA[tipo] ?? 1;
  // arredonda para fora: um tile tocado em parte também conta
  for (let ty = Math.floor(r.topo); ty < Math.ceil(r.base); ty++) {
    for (let tx = Math.floor(r.esquerda); tx < Math.ceil(r.direita); tx++) {
      if (!tileConstruivel(mundo, tx, ty)) return false;
      if (distanciaDaAgua(mundo, tx, ty) < margem) return false;
    }
  }
  return true;
}
