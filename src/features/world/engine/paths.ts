// =====================================================================
// CAMINHOS — a rede de terra batida da vila.
//
// Começa na praça (em volta da fonte) e cresce por reaproveitamento: cada
// construção nova procura a rota mais barata até QUALQUER caminho que já exista,
// e não até a fonte. É isso que evita tentáculos saindo do centro.
//
// Puro e determinístico: só hash2 com a seed do mundo. Medidas em tiles.
// =====================================================================
import { tipoConstruivel } from './buildable';
import { retanguloDe } from './footprint';
import { hash2 } from './noise';
import { H, W } from './rules';
import type { PathKind, PathTile, Settlement, TileType, World, WorldOccupant } from './types';

/** Largura da faixa, em tiles. */
export const LARGURA_CAMINHO: Record<PathKind, number> = {
  principal: 3,
  secundario: 2,
  acesso: 1,
};

/** Custo de atravessar cada terreno. Ausente = proibido (água). */
const CUSTO_TERRENO: Partial<Record<TileType, number>> = {
  planicie: 4,
  savana: 4,
  floresta: 6,
  tundra: 6,
  deserto: 6,
  praia: 20, // evita, mas atravessa se for o único jeito
  montanha: 60,
  neve: 60,
};

const CUSTO_CAMINHO = 1; // andar por caminho existente é quase de graça
const PENALIDADE_CURVA = 3; // segue reto quando dá
const RUIDO = 2; // acaso determinístico por tile: tira a régua da rota
const MARGEM_BUSCA = 20; // tiles além da vila onde a rota pode procurar caminho

/** Raio da praça em volta da fonte, em tiles (cabe dentro da área já reservada). */
const RAIO_DA_PRACA = 5.5;
/** Quantas rotas iniciais viram eixo principal da vila. */
const VIAS_PRINCIPAIS = 2;
/** Tiles finais de uma rota que contam como acesso da casa. */
const TILES_DE_ACESSO = 3;

const chave = (x: number, y: number) => y * W + x;

/** Tiles ocupados por construções: caminho nunca passa por dentro. */
function tilesBloqueados(ocupantes: readonly WorldOccupant[]): Set<number> {
  const bloqueados = new Set<number>();
  for (const o of ocupantes) {
    const r = retanguloDe(o.tipo, o.x, o.y);
    if (!r) continue;
    for (let y = Math.floor(r.topo); y < Math.ceil(r.base); y++) {
      for (let x = Math.floor(r.esquerda); x < Math.ceil(r.direita); x++) bloqueados.add(chave(x, y));
    }
  }
  return bloqueados;
}

export function tilesDeCaminho(caminhos: readonly PathTile[]): Set<number> {
  const s = new Set<number>();
  for (const c of caminhos) s.add(chave(c.x, c.y));
  return s;
}

function custoDoTile(mundo: World, x: number, y: number, naRede: Set<number>): number | null {
  if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return null;
  const i = chave(x, y);
  if (naRede.has(i)) return CUSTO_CAMINHO;
  if (mundo.agua[i]) return null;
  const custo = CUSTO_TERRENO[mundo.tipo[i]];
  if (custo === undefined) return null;
  return custo + hash2(x, y, mundo.seed + 907) * RUIDO;
}

const VIZINHOS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** Fila de prioridade mínima (heap binário) — o bastante para a caixa da vila. */
class Fila {
  private itens: { custo: number; estado: number }[] = [];

  inserir(custo: number, estado: number): void {
    this.itens.push({ custo, estado });
    let i = this.itens.length - 1;
    while (i > 0) {
      const pai = (i - 1) >> 1;
      if (this.itens[pai].custo <= this.itens[i].custo) break;
      [this.itens[pai], this.itens[i]] = [this.itens[i], this.itens[pai]];
      i = pai;
    }
  }

  retirar(): { custo: number; estado: number } | undefined {
    const topo = this.itens[0];
    const ultimo = this.itens.pop();
    if (this.itens.length && ultimo) {
      this.itens[0] = ultimo;
      let i = 0;
      for (;;) {
        const e = i * 2 + 1;
        const d = e + 1;
        let menor = i;
        if (e < this.itens.length && this.itens[e].custo < this.itens[menor].custo) menor = e;
        if (d < this.itens.length && this.itens[d].custo < this.itens[menor].custo) menor = d;
        if (menor === i) break;
        [this.itens[menor], this.itens[i]] = [this.itens[i], this.itens[menor]];
        i = menor;
      }
    }
    return topo;
  }

  get vazia(): boolean {
    return this.itens.length === 0;
  }
}

/**
 * Rota mais barata da entrada até o caminho existente mais próximo (a praça
 * inclusive). Devolve a linha central, do caminho até a casa, ou null.
 * O estado inclui a direção, para penalizar curvas sem virar zigue-zague.
 */
function rotaAteARede(
  mundo: World,
  origem: { x: number; y: number },
  naRede: Set<number>,
  bloqueados: Set<number>,
  area: { x0: number; y0: number; x1: number; y1: number },
): { x: number; y: number }[] | null {
  const largura = area.x1 - area.x0 + 1;
  const altura = area.y1 - area.y0 + 1;
  const total = largura * altura * 4; // tile × direção
  const indice = (x: number, y: number, dir: number) => ((y - area.y0) * largura + (x - area.x0)) * 4 + dir;
  const custos = new Float64Array(total).fill(Infinity);
  const veioDe = new Int32Array(total).fill(-1);
  const fila = new Fila();

  for (let dir = 0; dir < 4; dir++) {
    const i = indice(origem.x, origem.y, dir);
    custos[i] = 0;
    fila.inserir(0, i);
  }

  let chegada = -1;
  while (!fila.vazia) {
    const atual = fila.retirar();
    if (!atual || atual.custo > custos[atual.estado]) continue;
    const plano = (atual.estado / 4) | 0;
    const x = area.x0 + (plano % largura);
    const y = area.y0 + ((plano / largura) | 0);
    const dirAtual = atual.estado % 4;

    if (naRede.has(chave(x, y))) {
      chegada = atual.estado;
      break;
    }

    for (let dir = 0; dir < 4; dir++) {
      const nx = x + VIZINHOS[dir][0];
      const ny = y + VIZINHOS[dir][1];
      if (nx < area.x0 || ny < area.y0 || nx > area.x1 || ny > area.y1) continue;
      if (bloqueados.has(chave(nx, ny))) continue;
      const custo = custoDoTile(mundo, nx, ny, naRede);
      if (custo === null) continue;
      const curva = dir === dirAtual || atual.custo === 0 ? 0 : PENALIDADE_CURVA;
      const novo = atual.custo + custo + curva;
      const destino = indice(nx, ny, dir);
      if (novo < custos[destino]) {
        custos[destino] = novo;
        veioDe[destino] = atual.estado;
        fila.inserir(novo, destino);
      }
    }
  }
  if (chegada < 0) return null;

  const rota: { x: number; y: number }[] = [];
  for (let e = chegada; e >= 0; e = veioDe[e]) {
    const plano = (e / 4) | 0;
    rota.push({ x: area.x0 + (plano % largura), y: area.y0 + ((plano / largura) | 0) });
    if (veioDe[e] === -1) break;
  }
  return rota; // do caminho existente até a entrada da casa
}

/**
 * Engrossa a linha central numa faixa de bordas irregulares.
 * A faixa também respeita as construções: alargar não pode invadir uma casa.
 */
function engrossar(
  mundo: World,
  centro: readonly { x: number; y: number }[],
  tipo: PathKind,
  seed: number,
  bloqueados: Set<number>,
): PathTile[] {
  const raio = (LARGURA_CAMINHO[tipo] - 1) / 2;
  const alcance = Math.ceil(raio + 0.5);
  const tiles = new Map<number, PathTile>();
  for (const c of centro) {
    for (let dy = -alcance; dy <= alcance; dy++) {
      for (let dx = -alcance; dx <= alcance; dx++) {
        const x = c.x + dx;
        const y = c.y + dy;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        // o raio varia um pouco por tile: a borda não sai reta
        const variacao = (hash2(x, y, seed + 1301) - 0.5) * 0.8;
        if (Math.hypot(dx, dy) > raio + 0.5 + variacao) continue;
        const i = chave(x, y);
        if (mundo.agua[i] || !tipoConstruivel(mundo.tipo[i]) || bloqueados.has(i)) continue;
        tiles.set(i, { x, y, tipo });
      }
    }
  }
  return [...tiles.values()];
}

/** A praça: disco irregular em volta da fonte, menos a fonte e as construções. */
export function criarPraca(
  mundo: World,
  fonte: { x: number; y: number },
  ocupantes: readonly WorldOccupant[] = [],
): PathTile[] {
  const bloqueados = tilesBloqueados(ocupantes);
  const r = retanguloDe('fonte', fonte.x, fonte.y);
  const centro = { x: fonte.x + 0.5, y: fonte.y + 1 - 2 };
  const alcance = Math.ceil(RAIO_DA_PRACA) + 1;
  const tiles: PathTile[] = [];
  for (let dy = -alcance; dy <= alcance; dy++) {
    for (let dx = -alcance; dx <= alcance; dx++) {
      const x = fonte.x + dx;
      const y = fonte.y + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const variacao = (hash2(x, y, mundo.seed + 1499) - 0.5) * 1.6; // borda oval irregular
      if (Math.hypot(x + 0.5 - centro.x, y + 0.5 - centro.y) > RAIO_DA_PRACA + variacao) continue;
      const i = chave(x, y);
      if (mundo.agua[i] || !tipoConstruivel(mundo.tipo[i]) || bloqueados.has(i)) continue;
      if (r && x >= Math.floor(r.esquerda) && x < Math.ceil(r.direita) && y >= Math.floor(r.topo) && y < Math.ceil(r.base)) {
        continue; // o tile da própria fonte não é chão de praça
      }
      tiles.push({ x, y, tipo: 'principal' });
    }
  }
  return tiles;
}

/** Junta tiles novos aos existentes; o tipo mais "importante" ganha. */
export function mesclarCaminhos(atuais: readonly PathTile[], novos: readonly PathTile[]): PathTile[] {
  const ordem: Record<PathKind, number> = { acesso: 0, secundario: 1, principal: 2 };
  const mapa = new Map<number, PathTile>();
  for (const t of [...atuais, ...novos]) {
    const i = chave(t.x, t.y);
    const antigo = mapa.get(i);
    if (!antigo || ordem[t.tipo] > ordem[antigo.tipo]) mapa.set(i, t);
  }
  return [...mapa.values()];
}

/**
 * Liga a entrada de uma construção à rede existente. O trecho junto da casa vira
 * `acesso`; o resto vira `principal` enquanto a vila ainda não tem os eixos, e
 * `secundario` depois. Devolve null quando não há rota possível.
 */
export function conectarARede(
  mundo: World,
  vila: Settlement,
  ocupantes: readonly WorldOccupant[],
  entrada: { x: number; y: number },
  viasPrincipais: number,
): PathTile[] | null {
  if (!vila.caminhos.length) return null;
  const naRede = tilesDeCaminho(vila.caminhos);
  if (naRede.has(chave(entrada.x, entrada.y))) return []; // a casa já está na beira da rede

  const alcance = Math.ceil(vila.raio) + MARGEM_BUSCA;
  const area = {
    x0: Math.max(1, vila.x - alcance),
    y0: Math.max(1, vila.y - alcance),
    x1: Math.min(W - 2, vila.x + alcance),
    y1: Math.min(H - 2, vila.y + alcance),
  };
  const bloqueados = tilesBloqueados(ocupantes);
  bloqueados.delete(chave(entrada.x, entrada.y));

  const rota = rotaAteARede(mundo, entrada, naRede, bloqueados, area);
  if (!rota || rota.length < 2) return rota ? [] : null;

  // rota vem da rede até a casa: o fim é o acesso, o resto é via
  const corte = Math.max(1, rota.length - TILES_DE_ACESSO);
  const via = rota.slice(0, corte);
  const acesso = rota.slice(Math.max(0, corte - 1));
  const tipoVia: PathKind = viasPrincipais < VIAS_PRINCIPAIS ? 'principal' : 'secundario';
  return [
    ...engrossar(mundo, via, tipoVia, mundo.seed, bloqueados),
    ...engrossar(mundo, acesso, 'acesso', mundo.seed, bloqueados),
  ];
}

/** Quantas rotas ainda faltam para a vila ter os dois eixos principais. */
export const VIAS_PRINCIPAIS_DA_VILA = VIAS_PRINCIPAIS;
