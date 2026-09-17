import { H, NOMES, W } from './rules';
import type { World } from './types';

/** Texto com bioma, altitude e umidade do tile (x, y), ou null se estiver fora do mundo. */
export function descreverTile(mundo: World, x: number, y: number): string | null {
  if (x < 0 || y < 0 || x >= W || y >= H) return null;
  const i = y * W + x;
  return `Pixel (${x}, ${y}): ${NOMES[mundo.tipo[i]]}, altitude ${mundo.alt[i].toFixed(2)}, umidade ${mundo.umi[i].toFixed(2)}`;
}
