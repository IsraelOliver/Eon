// =====================================================================
// CAMINHOS EM PIXELS — camada de terra batida por cima do terreno.
//
// Buffer próprio, só do tamanho da caixa da rede: acrescentar um caminho NÃO
// mexe no buffer do terreno. Refeito quando a rede muda (poucos ms).
//
// Desenhado PIXEL A PIXEL, como o terreno (buildPixels.ts): a presença de
// caminho em cada tile é interpolada dentro do tile, com um tremor fino, e o
// pixel é trilha onde ela passa de um limiar. Os degraus da grade viram curvas
// e a borda fica irregular sem parecer "comida".
//
// A trilha amadurece pela PRESENÇA, não pela largura. Três valores por tile
// (engine/paths.ts, NIVEIS_DA_REDE):
//   espessura  — o limiar: a mesma linha sai mais fina ou mais cheia (≤ 1 tile);
//   cobertura  — quantos pixels já são terra; o resto continua grama. A terra
//                aparece primeiro no MEIO da trilha, em tufos, não em chuvisco;
//   forca      — a opacidade da terra.
// Trilha nova é grama gasta; madura é terra batida legível — sempre fina.
// =====================================================================
import { hash2, valueNoise } from '../engine/noise';
import { H, W } from '../engine/rules';
import type { PathTile, World } from '../engine/types';
import { CAMINHO, criarPaleta, mix } from './palette';
import { ART } from './buildPixels';

/** Quanto a borda treme, em fração da presença (0,5 é o limite do caminho). */
const TREMOR_DA_BORDA = 0.22;
/** Tamanho do tremor suave da borda, em pixels: ondas, não pontilhado. */
const ESCALA_DO_TREMOR = 3;
/** Chance de um pixel do miolo receber outro tom (poeira, marca de pé). */
const GRAO = 0.12;
/** Tamanho dos tufos de desgaste, em pixels: a grama some em manchinhas, não pixel solto. */
const TUFO = 2.5;
/**
 * Quanto a beira da trilha tem de terra, relativo ao meio (0 a 1). Baixo: a
 * trilha é mais gasta no centro e se desfaz em grama nas bordas.
 */
const TERRA_NA_BEIRA = 0.4;

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
 * caminho nenhum (acampamento, ou vila sem rede ainda).
 */
export function desenharCaminhos(
  mundo: World,
  caminhos: readonly PathTile[],
  pergaminho = false,
): CamadaDeCaminhos | null {
  if (!caminhos.length) return null;

  // caixa da rede, com 1 tile de margem para a interpolação ter onde cair
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of caminhos) {
    if (c.x < minX) minX = c.x;
    if (c.y < minY) minY = c.y;
    if (c.x > maxX) maxX = c.x;
    if (c.y > maxY) maxY = c.y;
  }
  minX = Math.max(0, minX - 1);
  minY = Math.max(0, minY - 1);
  maxX = Math.min(W - 1, maxX + 1);
  maxY = Math.min(H - 1, maxY + 1);
  const tw = maxX - minX + 1;
  const th = maxY - minY + 1;

  // presença (0/1) e, por tile, força, espessura e cobertura
  const presenca = new Float32Array(tw * th);
  const forca = new Float32Array(tw * th);
  const espessura = new Float32Array(tw * th);
  const cobertura = new Float32Array(tw * th);
  for (const c of caminhos) {
    const i = (c.y - minY) * tw + (c.x - minX);
    presenca[i] = 1;
    forca[i] = Math.max(forca[i], c.forca ?? 1);
    espessura[i] = Math.max(espessura[i], c.espessura ?? 1);
    cobertura[i] = Math.max(cobertura[i], c.cobertura ?? 1);
  }

  const largura = tw * ART;
  const altura = th * ART;
  const pixels = new Uint8Array(largura * altura * 4); // começa transparente

  const P = criarPaleta(pergaminho);
  const base = P(CAMINHO);
  const claro = mix(base, [255, 255, 255], 0.12);
  const escuro = mix(base, [0, 0, 0], 0.14);

  for (let py = 0; py < altura; py++) {
    // centro do pixel em coordenadas de tile da caixa (o centro do tile é .5)
    const fy = (py + 0.5) / ART - 0.5;
    const y0 = Math.max(0, Math.min(th - 2, Math.floor(fy)));
    const ty = Math.max(0, Math.min(1, fy - y0));
    for (let px = 0; px < largura; px++) {
      const fx = (px + 0.5) / ART - 0.5;
      const x0 = Math.max(0, Math.min(tw - 2, Math.floor(fx)));
      const tx = Math.max(0, Math.min(1, fx - x0));
      const i00 = y0 * tw + x0;
      const w00 = (1 - tx) * (1 - ty);
      const w10 = tx * (1 - ty);
      const w01 = (1 - tx) * ty;
      const w11 = tx * ty;
      const p = presenca[i00] * w00 + presenca[i00 + 1] * w10 + presenca[i00 + tw] * w01 + presenca[i00 + tw + 1] * w11;
      if (p <= 0) continue;

      const ax = minX * ART + px;
      const ay = minY * ART + py;
      // tremor suave (ondas) + um pouco de fino: a borda não sai lisa nem granulada
      const tremor =
        (valueNoise(ax / ESCALA_DO_TREMOR, ay / ESCALA_DO_TREMOR, mundo.seed + 2113) - 0.5) * TREMOR_DA_BORDA +
        (hash2(ax, ay, mundo.seed + 2129) - 0.5) * 0.06;
      // os valores do lugar: médias ponderadas dos tiles de caminho em volta
      const media = (c: Float32Array) =>
        (c[i00] * w00 + c[i00 + 1] * w10 + c[i00 + tw] * w01 + c[i00 + tw + 1] * w11) / p;
      const e = Math.min(1, media(espessura));

      // a espessura é o limiar: 1 tile corta em 0,5 (4 px); meio tile, em 0,75 (≈2 px)
      const limiar = 1 - e / 2;
      const v = p + tremor;
      if (v < limiar) continue;

      // 0 na beira, 1 no meio da trilha
      const meio = Math.min(1, (v - limiar) / (1 - limiar));
      // desgaste em tufos: a terra aparece primeiro no meio, e a beira fica grama
      const tufo =
        valueNoise(ax / TUFO, ay / TUFO, mundo.seed + 2153) * 0.65 + hash2(ax, ay, mundo.seed + 2161) * 0.35;
      if (tufo > media(cobertura) * (TERRA_NA_BEIRA + (1 - TERRA_NA_BEIRA) * meio)) continue;

      const h = hash2(ax, ay, mundo.seed + 2141);
      // no meio, terra com grão; na beira, o tom mais claro da terra que mal se firmou
      const cor = meio < 0.3 ? claro : h > 1 - GRAO ? escuro : h < GRAO ? claro : base;
      const opacidade = Math.min(1, media(forca) * (0.8 + 0.2 * meio));

      const k = (py * largura + px) * 4;
      pixels[k] = Math.round(cor[0]);
      pixels[k + 1] = Math.round(cor[1]);
      pixels[k + 2] = Math.round(cor[2]);
      pixels[k + 3] = Math.round(255 * opacidade);
    }
  }

  return { pixels, largura, altura, x: minX * ART, y: minY * ART };
}
