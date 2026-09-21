// =====================================================================
// CAMINHOS EM PIXELS — camada de terra batida por cima do terreno.
//
// Buffer próprio, só do tamanho da caixa da rede: acrescentar um caminho NÃO
// mexe no buffer do terreno. Refeito quando a rede muda (poucos ms).
// =====================================================================
import { hash2 } from '../engine/noise';
import { W } from '../engine/rules';
import type { PathTile, World } from '../engine/types';
import { CAMINHO, criarPaleta, mix, type RGB } from './palette';
import { ART } from './buildPixels';

/** Chance de um pixel da borda ser comido: é o que tira a régua da margem. */
const EROSAO = 0.28;
/** Chance de um pixel da faixa receber um tom diferente (poeira, marca de roda). */
const GRAO = 0.14;

export interface CamadaDeCaminhos {
  pixels: Uint8Array;
  /** Tamanho e canto superior esquerdo, em pixels de arte. */
  largura: number;
  altura: number;
  x: number;
  y: number;
}

/**
 * Desenha a rede num buffer RGBA com transparência. Devolve null quando não há
 * caminho nenhum (vila sem fonte ainda).
 */
export function desenharCaminhos(
  mundo: World,
  caminhos: readonly PathTile[],
  pergaminho = false,
): CamadaDeCaminhos | null {
  if (!caminhos.length) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const naRede = new Set<number>();
  for (const c of caminhos) {
    naRede.add(c.y * W + c.x);
    if (c.x < minX) minX = c.x;
    if (c.y < minY) minY = c.y;
    if (c.x > maxX) maxX = c.x;
    if (c.y > maxY) maxY = c.y;
  }

  const tilesLargura = maxX - minX + 1;
  const tilesAltura = maxY - minY + 1;
  const largura = tilesLargura * ART;
  const altura = tilesAltura * ART;
  const pixels = new Uint8Array(largura * altura * 4); // começa transparente

  const P = criarPaleta(pergaminho);
  const base = P(CAMINHO);
  const claro = mix(base, [255, 255, 255], 0.12);
  const escuro = mix(base, [0, 0, 0], 0.12);
  const ehCaminho = (x: number, y: number) => naRede.has(y * W + x);

  for (const c of caminhos) {
    const vizinhoEsq = ehCaminho(c.x - 1, c.y);
    const vizinhoDir = ehCaminho(c.x + 1, c.y);
    const vizinhoCima = ehCaminho(c.x, c.y - 1);
    const vizinhoBaixo = ehCaminho(c.x, c.y + 1);

    for (let sy = 0; sy < ART; sy++) {
      for (let sx = 0; sx < ART; sx++) {
        const ax = (c.x - minX) * ART + sx;
        const ay = (c.y - minY) * ART + sy;

        // borda irregular: pixels na beira de um lado sem caminho podem sumir
        const naBeira =
          (sx === 0 && !vizinhoEsq) ||
          (sx === ART - 1 && !vizinhoDir) ||
          (sy === 0 && !vizinhoCima) ||
          (sy === ART - 1 && !vizinhoBaixo);
        const h = hash2(c.x * ART + sx, c.y * ART + sy, mundo.seed + 2113);
        if (naBeira && h < EROSAO) continue;

        const cor: RGB = h > 1 - GRAO ? escuro : h < GRAO ? claro : base;
        const k = (ay * largura + ax) * 4;
        pixels[k] = Math.round(cor[0]);
        pixels[k + 1] = Math.round(cor[1]);
        pixels[k + 2] = Math.round(cor[2]);
        pixels[k + 3] = 255;
      }
    }
  }

  return { pixels, largura, altura, x: minX * ART, y: minY * ART };
}
