// =====================================================================
// DESENHO — monta o buffer RGBA (4 bytes por pixel) do mapa
// Separado em duas etapas: o terreno só muda quando o mundo muda,
// os elementos são redesenhados por cima de uma cópia dele.
// =====================================================================
import { hash2 } from '../engine/noise';
import { H, W } from '../engine/rules';
import type { Element, World } from '../engine/types';
import {
  BORDA_AREIA, COR, LINHA_COSTA, LUZ, NEVOA, ONDA, PINTA, SPAL, TINTA, criarPaleta, mix, type RGB,
} from './palette';
import { SPRITES } from './sprites';

/** Cada tile vira ART x ART pixels de arte (para os sprites terem detalhe). */
export const ART = 3;
export const ART_W = W * ART; // 450
export const ART_H = H * ART; // 300

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

/** brilho: 0 a 1, intensidade do brilho dos elementos recém-revisados. */
export function desenharElementos(
  terreno: Uint8Array,
  elementos: Element[],
  brilho: number,
  pergaminho = false,
): Uint8Array {
  const px = terreno.slice();
  const P = criarPaleta(pergaminho);
  const tinta = P(TINTA);
  const nevoa = P(NEVOA);

  for (const el of elementos) {
    const rows = SPRITES[el.tipo];
    const h = rows.length;
    const w = rows[0].length;
    const x0 = el.x * ART + 1 - Math.floor(w / 2);
    const y0 = el.y * ART + 2 - (h - 1);
    const cheio = (r: number, c: number) => r >= 0 && c >= 0 && r < h && c < w && rows[r][c] !== '.';

    // contorno de 1 pixel em volta do sprite
    const contorno = el.desbotado ? mix(tinta, nevoa, 0.6) : tinta;
    for (let r = -1; r <= h; r++) {
      for (let c = -1; c <= w; c++) {
        if (cheio(r, c)) continue;
        if (cheio(r - 1, c) || cheio(r + 1, c) || cheio(r, c - 1) || cheio(r, c + 1)) put(px, x0 + c, y0 + r, contorno);
      }
    }

    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const ch = rows[r][c];
        if (ch === '.') continue;
        let cor = P(SPAL[ch]);
        if (el.desbotado) cor = mix(cor, nevoa, 0.7);
        if (el.brilha) cor = mix(cor, LUZ, brilho * 0.8);
        put(px, x0 + c, y0 + r, cor);
      }
    }
  }
  return px;
}
