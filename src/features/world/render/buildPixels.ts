// =====================================================================
// TERRENO EM PIXELS — monta o buffer RGBA (4 bytes por pixel) do mapa.
// Só depende do mundo: é calculado uma vez por mundo e memoizado.
// Os sprites NÃO entram aqui; são desenhados à parte (spriteBuffers + Skia).
// =====================================================================
import { hash2 } from '../engine/noise';
import { H, W } from '../engine/rules';
import type { World } from '../engine/types';
import { BORDA_AREIA, COR, LINHA_COSTA, ONDA, PINTA, criarPaleta, type RGB } from './palette';

/** Cada tile vira ART x ART pixels de arte (para os sprites terem detalhe). */
export const ART = 3;
export const ART_W = W * ART;
export const ART_H = H * ART;

function put(px: Uint8Array, ax: number, ay: number, c: RGB): void {
  if (ax < 0 || ay < 0 || ax >= ART_W || ay >= ART_H) return;
  const k = (ay * ART_W + ax) * 4;
  px[k] = Math.round(c[0]);
  px[k + 1] = Math.round(c[1]);
  px[k + 2] = Math.round(c[2]);
  px[k + 3] = 255;
}

export function desenharTerreno(mundo: World, pergaminho = false): Uint8Array {
  const px = new Uint8Array(ART_W * ART_H * 4);
  const P = criarPaleta(pergaminho);
  const ehAgua = (x: number, y: number) =>
    x < 0 || y < 0 || x >= W || y >= H ? true : mundo.agua[y * W + x] === 1;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const t = mundo.tipo[i];
      const agua = mundo.agua[i] === 1;
      for (let sy = 0; sy < ART; sy++) {
        for (let sx = 0; sx < ART; sx++) {
          const ax = x * ART + sx;
          const ay = y * ART + sy;
          let cor = COR[t];
          // borda: pixel de arte que encosta no vizinho do outro tipo (água/terra)
          const borda =
            (sx === 0 && ehAgua(x - 1, y) !== agua) ||
            (sx === ART - 1 && ehAgua(x + 1, y) !== agua) ||
            (sy === 0 && ehAgua(x, y - 1) !== agua) ||
            (sy === ART - 1 && ehAgua(x, y + 1) !== agua);
          const pinta = PINTA[t];
          if (borda) cor = agua ? LINHA_COSTA : BORDA_AREIA;
          else if (pinta && hash2(ax, ay, mundo.seed + 5) < 0.08) cor = pinta;
          else if (t === 'oceano' && sy === 1 && hash2(x, y, mundo.seed + 9) < 0.02) cor = ONDA;
          put(px, ax, ay, P(cor));
        }
      }
    }
  }
  return px;
}
