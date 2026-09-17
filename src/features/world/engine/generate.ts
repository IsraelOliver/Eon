// =====================================================================
// GERAÇÃO DO MUNDO
// =====================================================================
import { fbm, normalizar } from './noise';
import { H, REGRAS, W } from './rules';
import type { Biome, TileType, World } from './types';

const N = W * H;

/** Distância (em tiles) até o tile mais próximo que satisfaz "cond". */
export function distancia(cond: (i: number) => boolean): Int16Array {
  const d = new Int16Array(N).fill(999);
  const q = new Int32Array(N);
  let ini = 0;
  let fim = 0;
  for (let i = 0; i < N; i++) {
    if (cond(i)) {
      d[i] = 0;
      q[fim++] = i;
    }
  }
  while (ini < fim) {
    const i = q[ini++];
    const x = i % W;
    const y = (i / W) | 0;
    const nd = d[i] + 1;
    if (x > 0 && d[i - 1] > nd) { d[i - 1] = nd; q[fim++] = i - 1; }
    if (x < W - 1 && d[i + 1] > nd) { d[i + 1] = nd; q[fim++] = i + 1; }
    if (y > 0 && d[i - W] > nd) { d[i - W] = nd; q[fim++] = i - W; }
    if (y < H - 1 && d[i + W] > nd) { d[i + W] = nd; q[fim++] = i + W; }
  }
  return d;
}

function bioma(u: number): Biome {
  for (const [ate, b] of REGRAS.umidade) if (u < ate) return b;
  return 'tundra';
}

/** Os três ruídos: altitude, umidade e detalhe das transições. */
function gerarRuidos(seed: number) {
  const alt = new Float32Array(N);
  const umi = new Float32Array(N);
  const det = new Float32Array(N);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      alt[i] = fbm(x * 0.045, y * 0.045, seed, 5);
      umi[i] = fbm(x * 0.03, y * 0.03, seed + 7919, 4);
      det[i] = fbm(x * 0.2, y * 0.2, seed + 31337, 2);
    }
  }
  normalizar(alt);
  normalizar(umi);
  normalizar(det);
  return { alt, umi, det };
}

/** Rebaixa as bordas para o mundo virar uma ilha. */
function formarIlha(alt: Float32Array): void {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const dx = (x / (W - 1) - 0.5) * 2;
      const dy = (y / (H - 1) - 0.5) * 2;
      alt[i] = alt[i] * 0.8 + 0.22 - (dx * dx + dy * dy) * REGRAS.queda;
    }
  }
}

/** Oceano = água ligada à borda; o resto da água vira lago. */
function marcarOceano(agua: Uint8Array): Uint8Array {
  const oceano = new Uint8Array(N);
  const pilha: number[] = [];
  for (let x = 0; x < W; x++) pilha.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) pilha.push(y * W, y * W + W - 1);
  while (pilha.length) {
    const i = pilha.pop()!;
    if (!agua[i] || oceano[i]) continue;
    oceano[i] = 1;
    const x = i % W;
    const y = (i / W) | 0;
    if (x > 0) pilha.push(i - 1);
    if (x < W - 1) pilha.push(i + 1);
    if (y > 0) pilha.push(i - W);
    if (y < H - 1) pilha.push(i + W);
  }
  return oceano;
}

export function gerarMundo(seed: number): World {
  const { alt, umi, det } = gerarRuidos(seed);
  formarIlha(alt);

  const mar = REGRAS.nivelMar;
  const agua = new Uint8Array(N);
  for (let i = 0; i < N; i++) agua[i] = alt[i] < mar ? 1 : 0;

  const oceano = marcarOceano(agua);
  const distOceano = distancia((i) => oceano[i] === 1);
  const distTerra = distancia((i) => !agua[i]);

  const tipo: TileType[] = new Array(N);
  for (let i = 0; i < N; i++) {
    if (agua[i]) {
      const raso = distTerra[i] <= REGRAS.aguaRasa || alt[i] > mar - 0.05;
      tipo[i] = oceano[i] ? (raso ? 'raso' : 'oceano') : 'lago';
    } else if (alt[i] >= REGRAS.neve) {
      tipo[i] = 'neve';
    } else if (alt[i] >= REGRAS.montanha) {
      tipo[i] = 'montanha';
    } else {
      const b = bioma(umi[i]);
      const base = REGRAS.praia[b];
      const largura = Math.round(base * (0.4 + det[i] * 1.2)); // o 3º ruído deixa a praia irregular
      tipo[i] = base > 0 && distOceano[i] <= largura ? 'praia' : b;
    }
  }

  return {
    seed,
    alt,
    umi,
    agua,
    tipo,
    distAgua: distancia((i) => agua[i] === 1),
    distMont: distancia((i) => tipo[i] === 'montanha' || tipo[i] === 'neve'),
  };
}
