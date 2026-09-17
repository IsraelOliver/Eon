// =====================================================================
// SPRITES EM PIXELS — monta o RGBA de UM sprite, com contorno e transparência.
// Pequeno de propósito: o terreno não é redesenhado quando um elemento muda.
// Puro: sem React, sem Skia.
// =====================================================================
import type { SpriteKey } from '../engine/types';
import { LUZ, NEVOA, SPAL, TINTA, criarPaleta, mix, type RGB } from './palette';
import { SPRITES } from './sprites';

/** Um sprite pronto para virar imagem. deslocX/Y: onde encostar no tile (em pixels de arte). */
export interface SpriteBuffer {
  pixels: Uint8Array;
  largura: number;
  altura: number;
  deslocX: number;
  deslocY: number;
}

export interface EstadoDoSprite {
  desbotado?: boolean;
  /** 0 a 1; só tem efeito em elementos marcados para brilhar. */
  brilho?: number;
  pergaminho?: boolean;
}

export function construirSprite(tipo: SpriteKey, estado: EstadoDoSprite = {}): SpriteBuffer {
  const { desbotado = false, brilho = 0, pergaminho = false } = estado;
  const rows = SPRITES[tipo];
  const h = rows.length;
  const w = rows[0].length;

  // 1 pixel de margem em volta, onde entra o contorno
  const largura = w + 2;
  const altura = h + 2;
  const pixels = new Uint8Array(largura * altura * 4); // começa transparente

  const P = criarPaleta(pergaminho);
  const tinta = P(TINTA);
  const nevoa = P(NEVOA);
  const cheio = (r: number, c: number) => r >= 0 && c >= 0 && r < h && c < w && rows[r][c] !== '.';
  const put = (c: number, r: number, cor: RGB) => {
    const k = ((r + 1) * largura + (c + 1)) * 4;
    pixels[k] = Math.round(cor[0]);
    pixels[k + 1] = Math.round(cor[1]);
    pixels[k + 2] = Math.round(cor[2]);
    pixels[k + 3] = 255;
  };

  // contorno de 1 pixel em volta do desenho
  const contorno = desbotado ? mix(tinta, nevoa, 0.6) : tinta;
  for (let r = -1; r <= h; r++) {
    for (let c = -1; c <= w; c++) {
      if (cheio(r, c)) continue;
      if (cheio(r - 1, c) || cheio(r + 1, c) || cheio(r, c - 1) || cheio(r, c + 1)) put(c, r, contorno);
    }
  }

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const ch = rows[r][c];
      if (ch === '.') continue;
      let cor = P(SPAL[ch]);
      if (desbotado) cor = mix(cor, nevoa, 0.7);
      if (brilho > 0) cor = mix(cor, LUZ, brilho * 0.8);
      put(c, r, cor);
    }
  }

  // mesma ancoragem de sempre: base do sprite no tile, já contando a margem
  return { pixels, largura, altura, deslocX: -Math.floor(w / 2), deslocY: 2 - h };
}
