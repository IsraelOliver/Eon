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
import { pontoDeEntrada, retanguloDe } from './footprint';
import { hash2, valueNoise } from './noise';
import { H, W } from './rules';
import type {
  NivelDosCaminhos, PathKind, PathTile, Settlement, TileType, World, WorldOccupant,
} from './types';

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

// =====================================================================
// A REDE DA PROGRESSÃO — trilhas que nascem e amadurecem com a vila.
//
// Diferente da rede por evento acima (que cresce rota a rota a partir da
// praça da fonte), esta é REFEITA por inteiro a partir do estado da vila —
// construções + nível — sempre que ele muda. Determinística: mesma seed, mesmas
// construções, mesmo nível, mesma rede. Assim os caminhos sempre combinam com a
// vila de agora, inclusive depois de uma construção evoluir.
//
// O trajeto já nasce irregular: a rota anda em 8 direções sobre um campo de
// custo suave (colinas invisíveis de alguns tiles), então desvia em curvas
// largas em vez de seguir a régua. O desenho (render/pathPixels.ts) suaviza o
// resto em escala de pixel.
// =====================================================================

/**
 * Como a rede é em cada nível. O traçado tem SEMPRE um tile de largura: a
 * trilha amadurece pela presença — espessura visual, cobertura de terra,
 * opacidade e traçado mais calmo —, não por engrossar.
 */
export interface NivelDaRede {
  /** Largura visual das trilhas, em fração de tile (1 tile = 4 px). */
  espessura: number;
  /** Largura visual dos dois eixos (as trilhas mais perto do núcleo). Teto: 1. */
  espessuraDosEixos: number;
  /** Quanto da trilha já é terra (0 a 1): o resto continua grama gasta. */
  cobertura: number;
  /** Opacidade da terra (0 a 1). */
  opacidade: number;
  /** Quanto o traçado ondula, em tiles. Menos = mais organizado. */
  curva: number;
  /** Raio (tiles) do terreiro gasto em volta da fogueira. 0 = nenhum. */
  terreiro: number;
  /** Liga cada construção à vizinha mais próxima (a rede deixa de ser só estrela). */
  ligarVizinhas: boolean;
}

/**
 * A maturidade da rede, nível a nível — é aqui que se calibra como os caminhos
 * crescem. "Primeiro o caminho aparece, depois se firma, e só por último se
 * organiza": a largura quase não muda (≈2 px → 3,5 px, com teto de 1 tile); o
 * que muda é quanto da grama já virou terra, quão firme é essa terra e quão
 * calmo é o traçado.
 *
 * O terreiro em volta da fogueira é o embrião da praça: quando a fogueira
 * evoluir para fonte, a praça nasce de um chão que já existia. Cresce devagar.
 */
export const NIVEIS_DA_REDE: Record<Exclude<NivelDosCaminhos, 0>, NivelDaRede> = {
  // 8 — aparece: grama gasta, pontilhada, fina; ainda sinuosa
  1: { espessura: 0.55, espessuraDosEixos: 0.6, cobertura: 0.62, opacidade: 0.72, curva: 1.8, terreiro: 0, ligarVizinhas: false },
  // 12 — se firma: mais contínua, terra no meio; o chão perto do fogo começa a gastar
  2: { espessura: 0.62, espessuraDosEixos: 0.7, cobertura: 0.76, opacidade: 0.8, curva: 1.7, terreiro: 1.2, ligarVizinhas: false },
  // 16 — liga tudo: as casas também se ligam entre si; ainda fina
  3: { espessura: 0.7, espessuraDosEixos: 0.8, cobertura: 0.86, opacidade: 0.86, curva: 1.5, terreiro: 1.5, ligarVizinhas: true },
  // 20 — se organiza: terra batida legível, traçado mais calmo, largura no teto
  4: { espessura: 0.78, espessuraDosEixos: 0.9, cobertura: 0.95, opacidade: 0.92, curva: 1.2, terreiro: 1.8, ligarVizinhas: true },
};

/** O terreiro é mais ralo e mais claro que a trilha: chão gasto, não pátio. */
const TERREIRO = { cobertura: 0.7, opacidade: 0.75 };
/** A ligação entre casas vizinhas é um pouco mais fraca que a trilha até o fogo. */
const LIGACAO = 0.85;

/** Custo extra máximo das "colinas invisíveis" que fazem a trilha curvar. */
const ONDULACAO = 7;
/** Tamanho dessas colinas, em tiles: curvas largas, não zigue-zague. */
const ESCALA_DA_ONDULACAO = 6;
/** Raio (tiles) em volta do núcleo onde uma trilha já "chegou" ao fogo. */
const RAIO_DO_NUCLEO = 2.2;
/** Comprimento de uma "onda" da trilha, em tiles: curvas largas. (A amplitude é do nível: `curva`.) */
const ONDA_DA_CURVA = 7;

const PASSOS_8 = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
] as const;

/**
 * Pode pisar? Terra transitável pelos `custos` (o que não tem custo é proibido),
 * dentro do mapa, fora d'água e de construção.
 */
function pisavel(
  mundo: World,
  x: number,
  y: number,
  bloqueados: Set<number>,
  custos: Partial<Record<TileType, number>> = CUSTO_TERRENO,
): boolean {
  if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return false;
  const i = chave(x, y);
  return !mundo.agua[i] && !bloqueados.has(i) && custos[mundo.tipo[i]] !== undefined;
}

/**
 * A trilha mais barata da `origem` até QUALQUER tile de `alvo`, em 8 direções.
 * O custo do tile soma o terreno e um campo suave determinístico: é ele que
 * curva o trajeto. Andar sobre a rede que já existe (`reuso`) é quase de graça,
 * então as trilhas se juntam em vez de correr lado a lado. Diagonal só sem
 * cortar quina de construção. Devolve da origem até o alvo, ou null.
 *
 * `terreno` diz por onde se pode passar e quanto custa (o padrão é o da vila);
 * as rotas de acesso das especializações passam os seus — montanha proibida,
 * floresta cara.
 */
function trilha(
  mundo: World,
  origem: { x: number; y: number },
  alvo: Set<number>,
  reuso: Set<number>,
  bloqueados: Set<number>,
  area: { x0: number; y0: number; x1: number; y1: number },
  terreno: Partial<Record<TileType, number>> = CUSTO_TERRENO,
): { x: number; y: number }[] | null {
  const largura = area.x1 - area.x0 + 1;
  const altura = area.y1 - area.y0 + 1;
  if (origem.x < area.x0 || origem.y < area.y0 || origem.x > area.x1 || origem.y > area.y1) return null;
  const indice = (x: number, y: number) => (y - area.y0) * largura + (x - area.x0);
  const custos = new Float64Array(largura * altura).fill(Infinity);
  const veioDe = new Int32Array(largura * altura).fill(-1);
  const fila = new Fila();
  const custoDe = (x: number, y: number) =>
    reuso.has(chave(x, y))
      ? CUSTO_CAMINHO
      : (terreno[mundo.tipo[chave(x, y)]] ?? 60) +
        valueNoise(x / ESCALA_DA_ONDULACAO, y / ESCALA_DA_ONDULACAO, mundo.seed + 1709) * ONDULACAO;

  const inicio = indice(origem.x, origem.y);
  custos[inicio] = 0;
  fila.inserir(0, inicio);
  let chegada = -1;
  while (!fila.vazia) {
    const atual = fila.retirar();
    if (!atual || atual.custo > custos[atual.estado]) continue;
    const x = area.x0 + (atual.estado % largura);
    const y = area.y0 + ((atual.estado / largura) | 0);
    if (alvo.has(chave(x, y))) {
      chegada = atual.estado;
      break;
    }
    for (const [dx, dy, passo] of PASSOS_8) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < area.x0 || ny < area.y0 || nx > area.x1 || ny > area.y1) continue;
      if (!pisavel(mundo, nx, ny, bloqueados, terreno)) continue;
      // diagonal sem cortar quina: os dois vizinhos retos têm de ser pisáveis
      if (
        dx !== 0 &&
        dy !== 0 &&
        (!pisavel(mundo, x + dx, y, bloqueados, terreno) || !pisavel(mundo, x, y + dy, bloqueados, terreno))
      ) {
        continue;
      }
      const novo = atual.custo + custoDe(nx, ny) * passo;
      const destino = indice(nx, ny);
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
    rota.push({ x: area.x0 + (e % largura), y: area.y0 + ((e / largura) | 0) });
  }
  return rota.reverse();
}

/**
 * Passos diagonais viram dois passos retos (o tile da quina entra na trilha).
 * Sem isso, uma trilha fina em diagonal seria uma fila de tiles que só se
 * tocam pela ponta — e o desenho, que suaviza, a partiria em pedaços.
 */
function continua(
  mundo: World,
  rota: readonly { x: number; y: number }[],
  bloqueados: Set<number>,
): { x: number; y: number }[] {
  const saida: { x: number; y: number }[] = [];
  for (const p of rota) {
    const anterior = saida[saida.length - 1];
    if (anterior && anterior.x !== p.x && anterior.y !== p.y) {
      // qual quina: uma que dê para pisar; a escolha é da seed, não do acaso
      const a = { x: p.x, y: anterior.y };
      const b = { x: anterior.x, y: p.y };
      const preferida = hash2(p.x, p.y, mundo.seed + 1811) < 0.5 ? a : b;
      const outra = preferida === a ? b : a;
      saida.push(pisavel(mundo, preferida.x, preferida.y, bloqueados) ? preferida : outra);
    }
    saida.push(p);
  }
  return saida;
}

/**
 * Deixa a rota orgânica: suaviza a linha (tira os ângulos da grade) e a
 * desloca de lado por uma onda suave ao longo do comprimento — que some nas
 * pontas, para a trilha ainda encostar na porta e no fogo. Volta para tiles sem
 * entrar em construção nem na água: onde a onda não pode ir, fica a rota
 * original. Determinístico: a onda sai da seed e da origem da trilha.
 */
function ondular(
  mundo: World,
  rota: readonly { x: number; y: number }[],
  bloqueados: Set<number>,
  amplitude: number,
): { x: number; y: number }[] {
  const n = rota.length;
  if (n < 5) return continua(mundo, rota, bloqueados);

  // 1) suaviza: média de cinco pontos (as pontas ficam onde estão)
  const lisa = rota.map((p, i) => {
    if (i === 0 || i === n - 1) return { x: p.x, y: p.y };
    let sx = 0;
    let sy = 0;
    let k = 0;
    for (let d = -2; d <= 2; d++) {
      const q = rota[Math.max(0, Math.min(n - 1, i + d))];
      sx += q.x;
      sy += q.y;
      k++;
    }
    return { x: sx / k, y: sy / k };
  });

  // 2) ondula: desloca na perpendicular, com a onda indo a zero nas pontas
  const fase = hash2(rota[0].x, rota[0].y, mundo.seed + 1733) * 50;
  let percorrido = 0;
  const ondulada = lisa.map((p, i) => {
    if (i > 0) percorrido += Math.hypot(p.x - lisa[i - 1].x, p.y - lisa[i - 1].y);
    const a = lisa[Math.max(0, i - 1)];
    const b = lisa[Math.min(n - 1, i + 1)];
    const tam = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / tam;
    const ny = (b.x - a.x) / tam;
    const afina = Math.sin((Math.PI * i) / (n - 1)); // 0 nas pontas, 1 no meio
    const desvio = (valueNoise(percorrido / ONDA_DA_CURVA + fase, fase, mundo.seed + 1747) - 0.5) * 2;
    const d = desvio * amplitude * afina;
    return { x: p.x + nx * d, y: p.y + ny * d };
  });

  // 3) de volta para tiles, amostrando cada trecho em passos curtos
  const saida: { x: number; y: number }[] = [];
  const empurrar = (x: number, y: number, reserva: { x: number; y: number }) => {
    const tx = Math.round(x);
    const ty = Math.round(y);
    const tile = pisavel(mundo, tx, ty, bloqueados) ? { x: tx, y: ty } : reserva;
    const ultimo = saida[saida.length - 1];
    if (!ultimo || ultimo.x !== tile.x || ultimo.y !== tile.y) saida.push(tile);
  };
  for (let i = 0; i < n - 1; i++) {
    const a = ondulada[i];
    const b = ondulada[i + 1];
    const passos = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 0.3));
    for (let s = 0; s < passos; s++) {
      const t = s / passos;
      empurrar(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, rota[i]);
    }
  }
  empurrar(ondulada[n - 1].x, ondulada[n - 1].y, rota[n - 1]);
  return continua(mundo, saida, bloqueados);
}

/** Como um trecho é desenhado: força (opacidade), espessura e cobertura. */
type Traco = Required<Pick<PathTile, 'forca' | 'espessura' | 'cobertura'>> & { tipo: PathKind };

/**
 * Marca um tile da rede. Onde duas trilhas se cruzam, cada valor fica com o
 * mais marcado — cruzar não apaga nem afina ninguém.
 */
function marcar(rede: Map<number, PathTile>, x: number, y: number, traco: Traco): void {
  const i = chave(x, y);
  const antes = rede.get(i);
  if (!antes) {
    rede.set(i, { x, y, ...traco });
    return;
  }
  rede.set(i, {
    x,
    y,
    tipo: (antes.forca ?? 1) >= traco.forca ? antes.tipo : traco.tipo,
    forca: Math.max(antes.forca ?? 1, traco.forca),
    espessura: Math.max(antes.espessura ?? 1, traco.espessura),
    cobertura: Math.max(antes.cobertura ?? 1, traco.cobertura),
  });
}

/**
 * Marca a linha central — um tile de largura, sempre. Quem dá a largura
 * VISUAL é o desenho (`espessura`), por isso a trilha nunca vira faixa grossa.
 * Nunca invade água nem construção.
 */
function tracar(
  mundo: World,
  centro: readonly { x: number; y: number }[],
  traco: Traco,
  bloqueados: Set<number>,
  rede: Map<number, PathTile>,
): void {
  for (const c of centro) {
    if (!pisavel(mundo, c.x, c.y, bloqueados) || !tipoConstruivel(mundo.tipo[chave(c.x, c.y)])) continue;
    marcar(rede, c.x, c.y, traco);
  }
}

/**
 * A rede inteira da vila no nível dado. `nucleo` é o coração da vila (a
 * fogueira, ou a fonte), e `construcoes` são as da vila, sem ele.
 *
 * - toda construção ganha uma trilha da porta até o núcleo — ou até a rede que
 *   já existe, o que for mais barato (as trilhas se juntam em galhos);
 * - as duas mais perto do núcleo viram os eixos, um pouco mais legíveis;
 * - do nível 2 em diante, um terreiro gasto (pequeno) em volta do fogo;
 * - do nível 3 em diante, cada construção se liga também à vizinha mais
 *   próxima: a rede deixa de ser uma estrela.
 */
export function redeDaVila(
  mundo: World,
  vila: Settlement,
  nucleo: { x: number; y: number } | null,
  construcoes: readonly { x: number; y: number; orientacao?: 'frente' | 'tras' }[],
  ocupantes: readonly WorldOccupant[],
  nivel: NivelDosCaminhos,
): PathTile[] {
  if (nivel === 0) return [];
  const cfg = NIVEIS_DA_REDE[nivel];
  const bloqueados = tilesBloqueados(ocupantes);
  const rede = new Map<number, PathTile>();
  // o chão logo à frente do núcleo (ou o centro lógico, sem núcleo)
  const centro = nucleo ? { x: nucleo.x, y: nucleo.y + 1 } : { x: vila.x, y: vila.y };

  // o terreiro: disco irregular de terra batida em volta do fogo
  if (cfg.terreiro > 0) {
    const r = Math.ceil(cfg.terreiro) + 1;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x = centro.x + dx;
        const y = centro.y + dy - 1;
        const variacao = (hash2(x, y, mundo.seed + 1499) - 0.5) * 1.4;
        if (Math.hypot(dx, dy) > cfg.terreiro + variacao) continue;
        if (!pisavel(mundo, x, y, bloqueados) || !tipoConstruivel(mundo.tipo[chave(x, y)])) continue;
        marcar(rede, x, y, {
          tipo: 'principal',
          forca: cfg.opacidade * TERREIRO.opacidade,
          espessura: 1, // o terreiro é chão, não trilha: cobre o tile inteiro
          cobertura: cfg.cobertura * TERREIRO.cobertura,
        });
      }
    }
  }

  // onde uma trilha já "chegou" ao fogo
  const chegouAoNucleo = new Set<number>();
  const rn = Math.ceil(RAIO_DO_NUCLEO);
  for (let dy = -rn; dy <= rn; dy++) {
    for (let dx = -rn; dx <= rn; dx++) {
      if (Math.hypot(dx, dy) > RAIO_DO_NUCLEO) continue;
      if (pisavel(mundo, centro.x + dx, centro.y + dy, bloqueados)) {
        chegouAoNucleo.add(chave(centro.x + dx, centro.y + dy));
      }
    }
  }

  const alcance = Math.ceil(vila.raio) + MARGEM_BUSCA;
  const area = {
    x0: Math.max(1, vila.x - alcance),
    y0: Math.max(1, vila.y - alcance),
    x1: Math.min(W - 2, vila.x + alcance),
    y1: Math.min(H - 2, vila.y + alcance),
  };

  // da mais perto do fogo para a mais longe (empate pela posição: determinístico)
  const distancia = (c: { x: number; y: number }) => Math.hypot(c.x - centro.x, c.y - centro.y);
  const ordenadas = [...construcoes].sort((a, b) => distancia(a) - distancia(b) || a.y - b.y || a.x - b.x);
  const entradas = ordenadas.map((c) => pontoDeEntrada(c));
  // a porta é o começo da trilha: ela nunca está bloqueada
  for (const e of entradas) bloqueados.delete(chave(e.x, e.y));

  entradas.forEach((entrada, i) => {
    const naRede = new Set(rede.keys());
    const alvo = new Set([...naRede, ...chegouAoNucleo]);
    const rota = trilha(mundo, entrada, alvo, naRede, bloqueados, area);
    if (!rota) return;
    const eixo = i < VIAS_PRINCIPAIS;
    tracar(
      mundo,
      ondular(mundo, rota, bloqueados, cfg.curva),
      {
        tipo: eixo ? 'principal' : 'secundario',
        forca: cfg.opacidade,
        espessura: eixo ? cfg.espessuraDosEixos : cfg.espessura,
        cobertura: cfg.cobertura,
      },
      bloqueados,
      rede,
    );
  });

  // nível 3+: cada construção também se liga à vizinha mais próxima
  if (cfg.ligarVizinhas) {
    const feitos = new Set<string>();
    entradas.forEach((a, i) => {
      let j = -1;
      let menor = Infinity;
      entradas.forEach((b, k) => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (k !== i && d < menor) {
          menor = d;
          j = k;
        }
      });
      if (j < 0) return;
      const par = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (feitos.has(par)) return;
      feitos.add(par);
      const b = entradas[j];
      const rota = trilha(mundo, a, new Set([chave(b.x, b.y)]), new Set(rede.keys()), bloqueados, area);
      if (rota) {
        tracar(
          mundo,
          ondular(mundo, rota, bloqueados, cfg.curva),
          {
            tipo: 'secundario',
            forca: cfg.opacidade * LIGACAO,
            espessura: cfg.espessura * LIGACAO,
            cobertura: cfg.cobertura * LIGACAO,
          },
          bloqueados,
          rede,
        );
      }
    });
  }

  return [...rede.values()];
}

// =====================================================================
// ROTAS DE ACESSO — a trilha própria de uma construção especializada.
//
// Da porta da construção até a rede da vila (ou, sem rede, até o núcleo). Para
// no PRIMEIRO caminho que encontrar, então começa aproveitando a rede e só
// depois se separa. Calculada UMA vez, quando a construção nasce (quem guarda é
// `Settlement.acessos`); o estilo de cada estágio vem da especialização.
// =====================================================================

/** Margem (tiles) da caixa de busca em volta da construção e da vila. */
const MARGEM_DO_ACESSO = 16;

/**
 * A linha central da rota de acesso, da porta até a vila. Tenta primeiro com
 * os custos da especialização; se o relevo fechar todas as saídas, tenta com os
 * da vila (que atravessam montanha caro) — o acesso não some. null só se nem
 * assim houver caminho.
 */
export function rotaDeAcesso(
  mundo: World,
  vila: Settlement,
  porta: { x: number; y: number },
  ocupantes: readonly WorldOccupant[],
  custos: Partial<Record<TileType, number>>,
  curva: number,
): { x: number; y: number }[] | null {
  const bloqueados = tilesBloqueados(ocupantes);
  bloqueados.delete(chave(porta.x, porta.y));
  const naRede = tilesDeCaminho(vila.caminhos);
  // sem rede ainda: o chão em volta do centro da vila é o destino
  const alvo = new Set(naRede);
  if (alvo.size === 0) {
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (Math.hypot(dx, dy) <= 3) alvo.add(chave(vila.x + dx, vila.y + dy));
      }
    }
  }
  const area = {
    x0: Math.max(1, Math.min(porta.x, vila.x) - MARGEM_DO_ACESSO - Math.ceil(vila.raio)),
    y0: Math.max(1, Math.min(porta.y, vila.y) - MARGEM_DO_ACESSO - Math.ceil(vila.raio)),
    x1: Math.min(W - 2, Math.max(porta.x, vila.x) + MARGEM_DO_ACESSO + Math.ceil(vila.raio)),
    y1: Math.min(H - 2, Math.max(porta.y, vila.y) + MARGEM_DO_ACESSO + Math.ceil(vila.raio)),
  };
  const rota =
    trilha(mundo, porta, alvo, naRede, bloqueados, area, custos) ??
    trilha(mundo, porta, alvo, naRede, bloqueados, area, CUSTO_TERRENO);
  return rota ? ondular(mundo, rota, bloqueados, curva) : null;
}

/**
 * Os tiles de uma rota de acesso já guardada, no traço do estágio atual. Não
 * entra em construção (pode ter crescido) nem sobre a rede da vila — onde as
 * duas se encontram, quem aparece é o caminho da vila.
 */
export function tilesDoAcesso(
  mundo: World,
  linha: readonly { x: number; y: number }[],
  traco: { espessura: number; cobertura: number; opacidade: number },
  ocupantes: readonly WorldOccupant[],
  daVila: ReadonlySet<number>,
): PathTile[] {
  const bloqueados = tilesBloqueados(ocupantes);
  const saida: PathTile[] = [];
  for (const p of linha) {
    const i = chave(p.x, p.y);
    if (daVila.has(i) || bloqueados.has(i) || mundo.agua[i] || !tipoConstruivel(mundo.tipo[i])) continue;
    saida.push({
      x: p.x,
      y: p.y,
      tipo: 'acesso',
      forca: traco.opacidade,
      espessura: traco.espessura,
      cobertura: traco.cobertura,
    });
  }
  return saida;
}
