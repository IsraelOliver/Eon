// =====================================================================
// ESCALA DO MUNDO — o ÚNICO lugar para deixar o mapa maior ou menor.
//
// A referência é a CABANA (a arte de 22×15 px, o primeiro marco): sprites têm
// tamanho fixo em pixels de arte e não mudam aqui. O que muda é quanto mundo
// existe em volta deles.
//
//   PIXELS_POR_TILE  quantos pixels de arte um tile ocupa. Mais pixels por tile
//                    = relevo (ilhas, lagos, biomas) maior em relação à cabana,
//                    sem gerar um tile a mais. O terreno é desenhado pixel a
//                    pixel (render/buildPixels.ts), então isto NÃO vira bloco:
//                    é resolução de verdade.
//   TILES_LARGURA/   quantos tiles o mundo tem. Mais tiles = mais mundo (mais
//   TILES_ALTURA     ilhas, mais espaço), mas geração, colocação e memória
//                    crescem junto.
//
// Custo, para decidir: o mapa vira UMA imagem de
// (TILES × PIXELS_POR_TILE)² × 4 bytes — 1920×1280 hoje, 9,8 MB — e o iPhone
// já fechou o app por memória na recriação do mundo. Suba devagar.
// =====================================================================

/** Pixels de arte por tile. Era 3; em 4, o mundo é 33% maior em volta da cabana. */
export const PIXELS_POR_TILE = 4;

/** Tamanho do mundo, em tiles. */
export const TILES_LARGURA = 480;
export const TILES_ALTURA = 320;

/**
 * Largura do mundo do protótipo, em tiles. As regras de distância (colocação,
 * vilas, praia…) foram calibradas nele e são escritas em "unidades" deste
 * tamanho; `ESCALA_MUNDO` (rules.ts) converte.
 */
export const TILES_DO_PROTOTIPO = 150;

/** Um tamanho da ARTE (px) em tiles. É assim que o espaço de cada construção sai do PNG. */
export function emTiles(pixels: number): number {
  return pixels / PIXELS_POR_TILE;
}
