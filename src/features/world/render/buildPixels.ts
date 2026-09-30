// =====================================================================
// TERRENO EM PIXELS — monta o buffer RGBA (4 bytes por pixel) do mapa.
// Só depende do mundo: é calculado uma vez por mundo e memoizado.
// Os sprites NÃO entram aqui; são desenhados à parte (spriteBuffers + Skia).
//
// O terreno é desenhado PIXEL A PIXEL, não tile a tile. Cada tile ocupa
// PIXELS_POR_TILE × PIXELS_POR_TILE pixels (engine/escala.ts), mas nenhum deles é
// um bloco chapado: a altitude e a umidade — campos contínuos do mundo — são
// interpoladas dentro do tile, então a costa segue a curva real do relevo e as
// manchas de bioma seguem a da umidade, lida num ponto levemente deslocado (o
// que desmancha as bordas retas). É resolução de verdade, não upscale.
//
// Duas passadas: 1) cada pixel ganha um tipo de terreno; 2) cada pixel ganha a
// cor, olhando os vizinhos (linha de costa, areia) e a textura em manchas.
//
// Custo: é o laço mais pesado do app (1920×1280 px hoje). Por isso a conta
// completa só é feita perto de FRONTEIRA: um tile "calmo" (tudo em volta do mesmo
// tipo) preenche seus pixels de uma vez. Oceano aberto e miolo de bioma — a
// maior parte do mapa — saem quase de graça. O desenho não muda o MUNDO: tipos
// de tile, colocação e save continuam exatamente os mesmos.
// =====================================================================
import { PIXELS_POR_TILE } from '../engine/escala';
import { distancia } from '../engine/generate';
import { hash2 } from '../engine/noise';
import { H, REGRAS, W } from '../engine/rules';
import type { TileType, World } from '../engine/types';
import { BORDA_AREIA, LINHA_COSTA, ONDA, TEXTURA, criarPaleta, tonsDoTile, type RGB } from './palette';

/** Pixels de arte por tile. Vem da escala do mundo — mexa lá, não aqui. */
export const ART = PIXELS_POR_TILE;

export const ART_W = W * ART;
export const ART_H = H * ART;

/**
 * Quanto a costa pode fugir da curva da altitude, em altitude. É o que deixa a
 * borda irregular em escala de pixel (enseadas, pontas) em vez de lisa demais.
 */
const JITTER_DA_COSTA = 0.006;
/** Quanto a borda entre biomas treme em escala de pixel, em umidade. */
const JITTER_DO_BIOMA = 0.035;
/**
 * Quanto a leitura da umidade e do tipo do tile (praia, água rasa…) é
 * deslocada, em tiles, por um campo suave de alguns tiles. É o que desmancha as
 * bordas retas que o próprio ruído do mundo às vezes forma. Tem de ficar abaixo
 * de RAIO_DA_FRONTEIRA, senão a borda deslocada cai fora da faixa calculada.
 */
const DISTORCAO = 1.6;
/** Escala do campo de distorção, em tiles: ondas de borda desse tamanho. */
const ESCALA_DA_DISTORCAO = 3;
/** Raio (tiles) em volta de cada fronteira onde o pixel é calculado por inteiro. */
const RAIO_DA_FRONTEIRA = 2;
/** Tamanho das manchas de tom dentro do bioma, em tiles. Maior = manchas maiores. */
const MANCHA = 3.5;
/** Ruído fino da borda das manchas: uma tabela fixa (lado potência de 2), em vez de um hash por pixel. */
const LADO_DO_FINO = 256;

const TIPOS = Object.keys(TEXTURA) as TileType[];
const INDICE = new Map(TIPOS.map((t, i) => [t, i]));
const AGUA: ReadonlySet<TileType> = new Set(['oceano', 'raso', 'lago']);
const EH_AGUA = Uint8Array.from(TIPOS, (t) => (AGUA.has(t) ? 1 : 0));
const I_PRAIA = INDICE.get('praia')!;
const I_NEVE = INDICE.get('neve')!;
const I_MONTANHA = INDICE.get('montanha')!;
const I_RASO = INDICE.get('raso')!;
const I_OCEANO = INDICE.get('oceano')!;
const I_LAGO = INDICE.get('lago')!;
/** Faixa de umidade → índice do bioma, e se ele tem praia (REGRAS.praia > 0). */
const I_BIOMA = REGRAS.umidade.map(([, b]) => INDICE.get(b)!);
const TEM_PRAIA = REGRAS.umidade.map(([, b]) => REGRAS.praia[b] > 0);

/** Qual faixa de umidade (índice em REGRAS.umidade). */
function faixaDeUmidade(u: number): number {
  const faixas = REGRAS.umidade;
  for (let i = 0; i < faixas.length; i++) if (u < faixas[i][0]) return i;
  return faixas.length - 1;
}

/** Um valor sorteado por tile (−0,5 a 0,5). Interpolado, vira um tremor suave de 1 tile. */
function campoDoTile(seed: number): Float32Array {
  const campo = new Float32Array(W * H);
  for (let i = 0; i < campo.length; i++) campo[i] = hash2(i % W, (i / W) | 0, seed) - 0.5;
  return campo;
}

/**
 * Ruído suave (0 a 1) com um valor por tile, em ondas de `escala` tiles. É o
 * `valueNoise(x/escala, y/escala)` de sempre, mas com o hash só nos pontos da
 * grade dele — cada tile só interpola. Mesmo resultado, dezenas de vezes menos hash.
 */
function campoSuave(seed: number, escala: number): Float32Array {
  const gw = Math.ceil(W / escala) + 2;
  const gh = Math.ceil(H / escala) + 2;
  const grade = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) grade[j * gw + i] = hash2(i, j, seed);

  const campo = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    const gy = y / escala;
    const j = Math.floor(gy);
    const fy = gy - j;
    const v = fy * fy * (3 - 2 * fy);
    for (let x = 0; x < W; x++) {
      const gx = x / escala;
      const i = Math.floor(gx);
      const fx = gx - i;
      const u = fx * fx * (3 - 2 * fx);
      const g = j * gw + i;
      const a = grade[g];
      const b = grade[g + 1];
      const c = grade[g + gw];
      const d = grade[g + gw + 1];
      campo[y * W + x] = a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
  }
  return campo;
}

/**
 * Tiles longe de qualquer fronteira: todo tile a até RAIO_DA_FRONTEIRA é do
 * mesmo tipo. Os pixels deles não têm o que decidir.
 */
function tilesCalmos(idx: Uint8Array): Uint8Array {
  const calmo = new Uint8Array(W * H).fill(1);
  const r = RAIO_DA_FRONTEIRA;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const fronteira = (x < W - 1 && idx[i] !== idx[i + 1]) || (y < H - 1 && idx[i] !== idx[i + W]);
      if (!fronteira) continue;
      // a fronteira fica entre este tile e o da direita/de baixo: a faixa vai um além
      for (let yy = Math.max(0, y - r); yy <= Math.min(H - 1, y + r + 1); yy++) {
        for (let xx = Math.max(0, x - r); xx <= Math.min(W - 1, x + r + 1); xx++) calmo[yy * W + xx] = 0;
      }
    }
  }
  return calmo;
}

/**
 * Onde cada coluna (ou linha) de pixels cai na grade de tiles: o tile da
 * esquerda da interpolação e a fração até o próximo. O centro do tile é .5.
 */
function grade(pixels: number, tiles: number): { base: Int32Array; fracao: Float32Array } {
  const base = new Int32Array(pixels);
  const fracao = new Float32Array(pixels);
  for (let p = 0; p < pixels; p++) {
    const f = (p + 0.5) / ART - 0.5;
    const b = Math.max(0, Math.min(tiles - 2, Math.floor(f)));
    base[p] = b;
    fracao[p] = Math.max(0, Math.min(1, f - b));
  }
  return { base, fracao };
}

type Grade = ReturnType<typeof grade>;

/**
 * Passada 1: o tipo de terreno de cada pixel (índice em TIPOS).
 *
 * - água ou terra: a altitude interpolada (mais um pouco de jitter) contra o
 *   nível do mar — a costa é a curva do relevo, não a escada dos tiles;
 * - neve e montanha: a mesma altitude contra os limites de REGRAS;
 * - bioma: a umidade interpolada, lida no ponto deslocado, contra as faixas;
 * - praia e lago: lidos do tile no ponto deslocado — a faixa fica ondulada em
 *   vez de degrau;
 * - mar raso ou fundo: a MESMA regra da geração (perto da terra, ou quase na
 *   altura do mar), mas com a distância até a terra interpolada por pixel — a
 *   fronteira entre os dois azuis vira curva.
 */
function classificar(mundo: World, idx: Uint8Array, calmo: Uint8Array, colunas: Grade, linhas: Grade): Uint8Array {
  const { alt, umi, agua, nivelMar } = mundo;
  // distância (tiles) até a terra: a mesma conta da geração, para o mar raso
  const distTerra = distancia((i) => !agua[i]);
  const jitter = campoDoTile(mundo.seed + 71);
  const distX = campoSuave(mundo.seed + 83, ESCALA_DA_DISTORCAO);
  const distY = campoSuave(mundo.seed + 97, ESCALA_DA_DISTORCAO);
  const cls = new Uint8Array(ART_W * ART_H);

  for (let ty = 0; ty < H; ty++) {
    for (let tx = 0; tx < W; tx++) {
      const tile = ty * W + tx;

      // tile calmo: os pixels dele são dele, de uma vez
      if (calmo[tile]) {
        const t = idx[tile];
        for (let sy = 0; sy < ART; sy++) {
          const inicio = (ty * ART + sy) * ART_W + tx * ART;
          for (let sx = 0; sx < ART; sx++) cls[inicio + sx] = t;
        }
        continue;
      }

      for (let sy = 0; sy < ART; sy++) {
        const ay = ty * ART + sy;
        const y0 = linhas.base[ay];
        const fry = linhas.fracao[ay];
        const fy = (ay + 0.5) / ART - 0.5;
        for (let sx = 0; sx < ART; sx++) {
          const ax = tx * ART + sx;
          const x0 = colunas.base[ax];
          const frx = colunas.fracao[ax];
          const i00 = y0 * W + x0;
          const i10 = i00 + 1;
          const i01 = i00 + W;
          const i11 = i01 + 1;
          const w00 = (1 - frx) * (1 - fry);
          const w10 = frx * (1 - fry);
          const w01 = (1 - frx) * fry;
          const w11 = frx * fry;
          const k = ay * ART_W + ax;

          const j = jitter[i00] * w00 + jitter[i10] * w10 + jitter[i01] * w01 + jitter[i11] * w11;
          const a = alt[i00] * w00 + alt[i10] * w10 + alt[i01] * w01 + alt[i11] * w11 + j * JITTER_DA_COSTA * 2;

          // o ponto deslocado: é nele que a umidade e o tipo do tile são lidos
          const dx = distX[i00] * w00 + distX[i10] * w10 + distX[i01] * w01 + distX[i11] * w11 - 0.5;
          const dy = distY[i00] * w00 + distY[i10] * w10 + distY[i01] * w01 + distY[i11] * w11 - 0.5;
          // (contas com | 0 em vez de Math.*: aqui os valores são sempre ≥ 0, e
          // este trecho roda centenas de milhares de vezes)
          const fx = (ax + 0.5) / ART - 0.5;
          let px = fx + dx * DISTORCAO * 2;
          let py = fy + dy * DISTORCAO * 2;
          px = px < 0 ? 0 : px > W - 1.001 ? W - 1.001 : px;
          py = py < 0 ? 0 : py > H - 1.001 ? H - 1.001 : py;
          const lido = idx[((py + 0.5) | 0) * W + ((px + 0.5) | 0)];

          if (a < nivelMar) {
            // que água: a do ponto lido; se ele caiu em terra, a do tile de água mais perto
            let t = EH_AGUA[lido] ? lido : -1;
            if (t < 0) {
              let peso = -1;
              if (EH_AGUA[idx[i00]] && w00 > peso) { t = idx[i00]; peso = w00; }
              if (EH_AGUA[idx[i10]] && w10 > peso) { t = idx[i10]; peso = w10; }
              if (EH_AGUA[idx[i01]] && w01 > peso) { t = idx[i01]; peso = w01; }
              if (EH_AGUA[idx[i11]] && w11 > peso) { t = idx[i11]; peso = w11; }
            }
            if (t === I_LAGO) {
              cls[k] = I_LAGO;
            } else {
              const d = distTerra[i00] * w00 + distTerra[i10] * w10 + distTerra[i01] * w01 + distTerra[i11] * w11;
              const raso = d + j * 2 <= REGRAS.aguaRasa || a > nivelMar - 0.05;
              cls[k] = raso ? I_RASO : I_OCEANO;
            }
          } else if (a >= REGRAS.neve) {
            cls[k] = I_NEVE;
          } else if (a >= REGRAS.montanha) {
            cls[k] = I_MONTANHA;
          } else if (lido === I_PRAIA) {
            cls[k] = I_PRAIA;
          } else {
            // a umidade no ponto deslocado (interpolada nos quatro tiles de lá)
            const bx = px < W - 2 ? px | 0 : W - 2;
            const by = py < H - 2 ? py | 0 : H - 2;
            const ux = px - bx;
            const uy = py - by;
            const b = by * W + bx;
            const u =
              (umi[b] * (1 - ux) + umi[b + 1] * ux) * (1 - uy) + (umi[b + W] * (1 - ux) + umi[b + W + 1] * ux) * uy;
            const faixa = faixaDeUmidade(u + j * JITTER_DO_BIOMA * 2);
            // terra que o tile dizia ser água: é beira; vira praia onde o bioma tem praia
            cls[k] = EH_AGUA[lido] && TEM_PRAIA[faixa] ? I_PRAIA : I_BIOMA[faixa];
          }
        }
      }
    }
  }
  return cls;
}

/** RGB → um pixel RGBA opaco, como Uint32 little-endian (a ordem de todo iPhone e de todo navegador). */
function empacotar([r, g, b]: RGB): number {
  return ((255 << 24) | (Math.round(b) << 16) | (Math.round(g) << 8) | Math.round(r)) >>> 0;
}

export function desenharTerreno(mundo: World, pergaminho = false): Uint8Array {
  const px = new Uint8Array(ART_W * ART_H * 4);
  // Cada cor já empacotada num inteiro de 32 bits: um pixel é UMA escrita, não
  // quatro. A ordem dos bytes é a da memória (RGBA), lida como little-endian.
  const px32 = new Uint32Array(px.buffer);
  const P = criarPaleta(pergaminho);
  const seed = mundo.seed;

  const idx = Uint8Array.from(mundo.tipo, (t) => INDICE.get(t)!);
  const calmo = tilesCalmos(idx);
  const colunas = grade(ART_W, W);
  const linhas = grade(ART_H, H);
  const cls = classificar(mundo, idx, calmo, colunas, linhas);
  const manchas = campoSuave(seed + 131, MANCHA);

  const fino = new Float32Array(LADO_DO_FINO * LADO_DO_FINO);
  for (let i = 0; i < fino.length; i++) {
    fino[i] = (hash2(i % LADO_DO_FINO, (i / LADO_DO_FINO) | 0, seed + 17) - 0.5) * 0.1;
  }
  const mascara = LADO_DO_FINO - 1;

  const tons = TIPOS.map((t) => {
    const { base, claro, escuro } = tonsDoTile(t, P);
    return { base: empacotar(base), claro: empacotar(claro), escuro: empacotar(escuro) };
  });
  const costa = empacotar(P(LINHA_COSTA));
  const areia = empacotar(P(BORDA_AREIA));
  const onda = empacotar(P(ONDA));

  for (let ty = 0; ty < H; ty++) {
    for (let tx = 0; tx < W; tx++) {
      // tile calmo: não há outro tipo a menos de RAIO_DA_FRONTEIRA — nem costa por perto
      const semCosta = calmo[ty * W + tx] === 1;
      for (let sy = 0; sy < ART; sy++) {
        const ay = ty * ART + sy;
        const y0 = linhas.base[ay];
        const fry = linhas.fracao[ay];
        const linhaDoFino = (ay & mascara) * LADO_DO_FINO;
        for (let sx = 0; sx < ART; sx++) {
          const ax = tx * ART + sx;
          const k = ay * ART_W + ax;
          const t = cls[k];
          const meu = tons[t];

          if (EH_AGUA[t]) {
            // faixa escura só na água logo ABAIXO da terra: sugere a face da ilha
            // vista em top-down inclinado. Laterais e topo ficam sem ela.
            if (!semCosta && ay > 0 && !EH_AGUA[cls[k - ART_W]]) {
              px32[k] = costa;
            } else if (t === I_OCEANO && fino[linhaDoFino + ((ax >> 1) & mascara)] > 0.0496) {
              px32[k] = onda; // espuma rara no mar aberto, em pares de pixels
            } else {
              px32[k] = meu.base;
            }
            continue;
          }

          // terra: linha de areia em todo pixel que encosta na água — a costa nítida
          if (
            !semCosta &&
            ((ax > 0 && EH_AGUA[cls[k - 1]]) ||
              (ax < ART_W - 1 && EH_AGUA[cls[k + 1]]) ||
              (ay > 0 && EH_AGUA[cls[k - ART_W]]) ||
              (ay < ART_H - 1 && EH_AGUA[cls[k + ART_W]]))
          ) {
            px32[k] = areia;
            continue;
          }

          // manchas de tom: o campo suave decide claro / base / escuro, com um pouco
          // de ruído fino só na fronteira das manchas (pontilhado, não borrão)
          const x0 = colunas.base[ax];
          const frx = colunas.fracao[ax];
          const i00 = y0 * W + x0;
          const m =
            (manchas[i00] * (1 - frx) + manchas[i00 + 1] * frx) * (1 - fry) +
            (manchas[i00 + W] * (1 - frx) + manchas[i00 + W + 1] * frx) * fry;
          const v = m + fino[linhaDoFino + (ax & mascara)];
          // poucas manchas, e mais escuras que claras: textura, não camuflagem
          px32[k] = v > 0.74 ? meu.escuro : v < 0.19 ? meu.claro : meu.base;
        }
      }
    }
  }

  // motivos: um detalhe pequeno a cada vários tiles, longe da costa (como antes)
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = idx[y * W + x];
      const t = TIPOS[i];
      const textura = TEXTURA[t];
      if (EH_AGUA[i] || hash2(x, y, seed + 23) >= textura.chance) continue;
      const lista = textura.motivos;
      const motivo = lista[Math.floor(hash2(x, y, seed + 29) * lista.length) % lista.length];
      const cor = textura.tom === 'claro' ? tons[i].claro : tons[i].escuro;
      // o motivo só entra onde o pixel ainda é deste tipo (a costa pode ter avançado)
      for (const [mx, my] of motivo) {
        const k = (y * ART + my) * ART_W + x * ART + mx;
        if (cls[k] === i) px32[k] = cor;
      }
    }
  }
  return px;
}
