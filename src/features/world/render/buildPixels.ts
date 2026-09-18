// =====================================================================
// TERRENO EM PIXELS — monta o buffer RGBA (4 bytes por pixel) do mapa.
// Só depende do mundo: é calculado uma vez por mundo e memoizado.
// Os sprites NÃO entram aqui; são desenhados à parte (spriteBuffers + Skia).
// =====================================================================
import { hash2 } from '../engine/noise';
import { H, W } from '../engine/rules';
import type { TileType, World } from '../engine/types';
import { BORDA_AREIA, LINHA_COSTA, ONDA, TEXTURA, criarPaleta, tonsDoTile, type RGB } from './palette';

/** Cada tile vira ART x ART pixels de arte (para os sprites terem detalhe). */
export const ART = 3;

/** Linhas de pixel da faixa azul-escura na água logo abaixo da terra. */
const ESPESSURA_COSTA_INFERIOR = 1;
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
  const seed = mundo.seed;

  // três tons por tipo de tile, calculados uma vez só
  const tons = {} as Record<TileType, ReturnType<typeof tonsDoTile>>;
  for (const tipo of Object.keys(TEXTURA) as TileType[]) tons[tipo] = tonsDoTile(tipo, P);

  const costa = P(LINHA_COSTA);
  const areia = P(BORDA_AREIA);
  const onda = P(ONDA);
  const ehAgua = (x: number, y: number) =>
    x < 0 || y < 0 || x >= W || y >= H ? true : mundo.agua[y * W + x] === 1;
  const tipoEm = (x: number, y: number) =>
    x < 0 || y < 0 || x >= W || y >= H ? null : mundo.tipo[y * W + x];

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const t = mundo.tipo[i];
      const agua = mundo.agua[i] === 1;
      const textura = TEXTURA[t];
      const meu = tons[t];

      // vizinhos do tile, para as bordas (costa e transição entre biomas)
      const esq = tipoEm(x - 1, y);
      const dir = tipoEm(x + 1, y);
      const cima = tipoEm(x, y - 1);
      const baixo = tipoEm(x, y + 1);

      // quais lados do tile encostam no outro estado (água ↔ terra)
      const outroEsq = ehAgua(x - 1, y) !== agua;
      const outroDir = ehAgua(x + 1, y) !== agua;
      const outroCima = ehAgua(x, y - 1) !== agua;
      const outroBaixo = ehAgua(x, y + 1) !== agua;
      const costeiro = outroEsq || outroDir || outroCima || outroBaixo;

      for (let sy = 0; sy < ART; sy++) {
        for (let sx = 0; sx < ART; sx++) {
          const ax = x * ART + sx;
          const ay = y * ART + sy;

          if (agua) {
            // faixa escura só na água logo ABAIXO da terra: sugere a face da
            // ilha vista em top-down inclinado. Laterais e topo ficam sem ela.
            put(px, ax, ay, outroCima && sy < ESPESSURA_COSTA_INFERIOR ? costa : meu.base);
            continue;
          }

          // terra: borda de areia em todos os lados que encostam na água
          // (é a linha de costa nítida, que dá leitura ao mapa)
          const naCosta =
            (sx === 0 && outroEsq) ||
            (sx === ART - 1 && outroDir) ||
            (sy === 0 && outroCima) ||
            (sy === ART - 1 && outroBaixo);
          if (naCosta) {
            put(px, ax, ay, areia);
            continue;
          }

          // transição de bioma: sorteada em blocos de 2x2 pixels, para a borda
          // ficar dentada como forma e não granulada pixel a pixel
          const vizinho = sx === 0 ? esq : sx === ART - 1 ? dir : sy === 0 ? cima : sy === ART - 1 ? baixo : null;
          if (vizinho && vizinho !== t && hash2(ax >> 1, ay >> 1, seed + 5) < textura.mistura) {
            put(px, ax, ay, tons[vizinho].base);
            continue;
          }

          put(px, ax, ay, meu.base);
        }
      }

      // motivo: um detalhe pequeno, a cada vários tiles, longe da linha de costa
      if (!costeiro && hash2(x, y, seed + 23) < textura.chance) {
        const lista = textura.motivos;
        const motivo = lista[Math.floor(hash2(x, y, seed + 29) * lista.length) % lista.length];
        const corMotivo = textura.tom === 'claro' ? meu.claro : meu.escuro;
        for (const [mx, my] of motivo) put(px, x * ART + mx, y * ART + my, corMotivo);
      }

      // onda solta no mar aberto, como antes
      if (t === 'oceano' && !costeiro && hash2(x, y, seed + 9) < 0.02) {
        put(px, x * ART, y * ART + 1, onda);
        put(px, x * ART + 1, y * ART + 1, onda);
      }
    }
  }
  return px;
}
