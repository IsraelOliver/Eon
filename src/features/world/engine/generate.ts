// =====================================================================
// GERAÇÃO DO MUNDO
// =====================================================================
import { fbm, normalizar } from './noise';
import { gerarNatureza } from './nature';
import { H, MARGEM_OCEANO, REGRAS, W } from './rules';
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
      const f = REGRAS.frequencia;
      alt[i] = fbm(x * f.altitude, y * f.altitude, seed, 5);
      umi[i] = fbm(x * f.umidade, y * f.umidade, seed + 7919, 4);
      det[i] = fbm(x * f.detalhe, y * f.detalhe, seed + 31337, 2);
    }
  }
  normalizar(alt);
  normalizar(umi);
  normalizar(det);
  return { alt, umi, det };
}

/**
 * Fator de 0 a 1 que some perto da borda do mapa, com transição suave
 * (smoothstep). Garante a faixa de oceano de MARGEM_OCEANO tiles.
 */
function fatorDeBorda(x: number, y: number): number {
  const daBorda = Math.min(x, y, W - 1 - x, H - 1 - y);
  const t = Math.min(1, daBorda / MARGEM_OCEANO);
  return t * t * (3 - 2 * t);
}

/** Rebaixa as bordas para o mundo virar uma ilha cercada de oceano. */
function formarIlha(alt: Float32Array): void {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const dx = (x / (W - 1) - 0.5) * 2;
      const dy = (y / (H - 1) - 0.5) * 2;
      const base = alt[i] * 0.8 + 0.22 - (dx * dx + dy * dy) * REGRAS.queda;
      const f = fatorDeBorda(x, y);
      // longe da borda vale o terreno; colado nela afunda bem abaixo do nível do mar
      alt[i] = base * f - (1 - f) * 0.3;
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

/** Terreno onde dá para viver: terra que não é praia, montanha nem neve. */
const HABITAVEL: ReadonlySet<TileType> = new Set<TileType>(['deserto', 'savana', 'planicie', 'floresta', 'tundra']);

/**
 * Centro da massa habitável: média das posições habitáveis e distância média até
 * ela. Serve para o crescimento preferir o miolo do território, não as bordas.
 * Calculado uma vez por mundo.
 */
function calcularCentroHabitavel(tipo: TileType[]): World['centro'] {
  let somaX = 0;
  let somaY = 0;
  let n = 0;
  for (let i = 0; i < N; i++) {
    if (!HABITAVEL.has(tipo[i])) continue;
    somaX += i % W;
    somaY += (i / W) | 0;
    n++;
  }
  if (!n) return { x: W / 2, y: H / 2, raio: Math.min(W, H) / 4 }; // mundo sem terra habitável

  const x = somaX / n;
  const y = somaY / n;
  let somaDist = 0;
  for (let i = 0; i < N; i++) {
    if (!HABITAVEL.has(tipo[i])) continue;
    somaDist += Math.hypot((i % W) - x, ((i / W) | 0) - y);
  }
  return { x, y, raio: Math.max(1, somaDist / n) };
}

/** nivelMar vem como parâmetro (o modo desenvolvedor muda); o padrão é o das REGRAS. */
export function gerarMundo(seed: number, nivelMar: number = REGRAS.nivelMar): World {
  const { alt, umi, det } = gerarRuidos(seed);
  formarIlha(alt);

  const mar = nivelMar;
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
    nivelMar,
    alt,
    umi,
    agua,
    tipo,
    distAgua: distancia((i) => agua[i] === 1),
    distMont: distancia((i) => tipo[i] === 'montanha' || tipo[i] === 'neve'),
    centro: calcularCentroHabitavel(tipo),
    natureza: gerarNatureza(seed, tipo, agua),
  };
}
