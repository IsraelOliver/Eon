// =====================================================================
// COLOCAÇÃO DO CRESCIMENTO — evento abstrato → lugar válido + sprite
//
// Estratégia (a mesma ideia do protótipo em placement.ts, sem reaproveitar
// o código dele): sorteia candidatos, rejeita lugares proibidos, dá nota,
// soma um pouco de acaso do Rng e fica com o melhor.
//
// Pura, determinística para a mesma sequência de Rng, não altera nada
// do que recebe. Indexada por WorldGrowthKind (não usa ThemeKey).
// =====================================================================
import { ESCALA_MUNDO, H, W } from './rules';
import {
  VILA,
  anelIdeal,
  notaDeVizinhanca,
  notaRadial,
  raioDeAmostragem,
  referenciaDaVila,
} from './settlements';
import type {
  Rng,
  Settlement,
  SpriteKey,
  TileType,
  World,
  WorldGrowthEvent,
  WorldGrowthKind,
  WorldGrowthPlacementResult,
  WorldOccupant,
} from './types';

const TENTATIVAS = 400;
const ACASO = 0.8; // quanto o Rng mexe na nota, para não ficar robótico

/**
 * Distâncias aqui são em UNIDADES, não em tiles: 1 unidade = 1 tile do mundo do
 * protótipo (150x100). Assim, aumentar o mundo não muda a calibração das regras.
 */
const unidades = (tilesDeDistancia: number) => tilesDeDistancia / ESCALA_MUNDO;

/**
 * Espaço que cada SPRITE pede em volta de si. É o que decide o espaçamento
 * visual: árvores quase se encostam, casas formam vila, construções grandes e
 * isoladas pedem mais respiro. Entre dois elementos vale a média das exigências,
 * salvo quando o par tem regra própria (DISTANCIA_ENTRE).
 */
const DISTANCIA_MINIMA_SPRITE: Partial<Record<SpriteKey, number>> = {
  arvore: 1.4,
  pinheiro: 1.4,
  cacto: 1.4,
  acacia: 1.6,
  casa: 2.2, // casa diagonal pequena: vila compacta sem sobrepor
  casa_maior: 2.6,
  fonte: 2,
  mina: 4,
  observatorio: 5,
};

/**
 * Pares com distância própria (em unidades). Duas casas maiores precisam de mais
 * respiro; casa maior e casa pequena só precisam não se sobrepor (metade da largura
 * de cada PNG), para a maior caber no vão entre casas perto do núcleo.
 */
const DISTANCIA_ENTRE: Partial<Record<`${SpriteKey}|${SpriteKey}`, number>> = {
  'casa_maior|casa_maior': 3.6,
  'casa_maior|casa': 2.25,
  'casa|casa_maior': 2.25,
};

/** Fallback para sprites sem entrada acima (torre, escavacao: só o protótipo usa). */
const DISTANCIA_MINIMA_EVENTO: Record<WorldGrowthKind, number> = {
  crescerVegetacao: 1.6,
  desenvolverPovoamento: 2.2,
  melhorarInfraestrutura: 2.6,
  ampliarExploracao: 4,
  desenvolverObservacao: 5,
};

function distanciaMinima(sprite: SpriteKey | undefined, evento: WorldGrowthKind): number {
  return (sprite && DISTANCIA_MINIMA_SPRITE[sprite]) ?? DISTANCIA_MINIMA_EVENTO[evento];
}

/** Distância mínima entre dois elementos: regra do par, ou a média das duas exigências. */
function distanciaEntre(
  a: SpriteKey | undefined,
  eventoA: WorldGrowthKind,
  b: SpriteKey | undefined,
  eventoB: WorldGrowthKind,
): number {
  const doPar = a && b ? DISTANCIA_ENTRE[`${a}|${b}`] : undefined;
  return doPar ?? (distanciaMinima(a, eventoA) + distanciaMinima(b, eventoB)) / 2;
}

/**
 * Agrupamento: peso máximo (bem em cima do vizinho) e alcance em unidades.
 * A atração cai de forma linear até zero no alcance.
 * (Construções de vila se organizam pelas regras de settlements.ts.)
 */
const AGRUPAMENTO = {
  vegetacao: { peso: 2.5, alcance: 5 }, // forte: forma bosquezinhos
};

const atracao = (distancia: number, { peso, alcance }: { peso: number; alcance: number }) =>
  distancia === Infinity ? 0 : peso * Math.max(0, 1 - distancia / alcance);

/**
 * Onde nasce a PRIMEIRA vila: perto da água, mas não colada na costa, e com
 * terreno construível em volta — um centro na beira do mar deixaria metade do
 * anel no mar e esticaria a vila pelo litoral. Depois que a vila existe, a água
 * não pesa mais.
 */
const PRIMEIRA_VILA = {
  distanciaAguaIdeal: 3,
  pesoAgua: 0.3,
  /** Raio (unidades) do espaço que a vila vai ocupar quando crescer. */
  raioEspaco: 8,
  /** Peso da fração de terreno construível em volta (0 a 1). */
  pesoEspaco: 4,
};

/** Pontos de amostra por círculo ao medir o espaço em volta. */
const AMOSTRAS_ESPACO = 16;

/**
 * Quanto a centralidade do MUNDO pesa na nota, quando não há vila envolvida.
 * Para povoamento, isso só decide onde a PRIMEIRA vila nasce; depois as casas
 * seguem a vila. Vegetação tem um empurrãozinho; exploração e observação seguem
 * a geografia.
 */
const PESO_CENTRO: Record<WorldGrowthKind, number> = {
  crescerVegetacao: 0.4,
  desenvolverPovoamento: 2.5,
  melhorarInfraestrutura: 0,
  ampliarExploracao: 0,
  desenvolverObservacao: 0,
};

/**
 * Centralidade habitável: 1 no centro da massa de terra habitável, caindo até 0
 * a duas distâncias médias dali. É uma preferência, nunca uma proibição.
 */
export function centralidadeHabitavel(mundo: World, x: number, y: number): number {
  const { centro } = mundo;
  const d = Math.hypot(x - centro.x, y - centro.y);
  return Math.max(0, 1 - d / (2 * centro.raio));
}

/** Terreno onde nada se constrói nem cresce. */
const CONSTRUIVEL_PROIBIDO: TileType[] = ['praia', 'montanha', 'neve'];

const PLANTA_POR_BIOMA: Partial<Record<TileType, SpriteKey>> = {
  floresta: 'arvore',
  planicie: 'arvore',
  tundra: 'pinheiro',
  savana: 'acacia',
  deserto: 'cacto',
};

/**
 * Fração (0 a 1) de terreno construível em volta de (x, y): amostra dois círculos
 * (metade e todo o raio do espaço da vila). Perto da costa, metade dá mar e a nota cai.
 */
function espacoEmVolta(mundo: World, x: number, y: number): number {
  let bons = 0;
  let total = 0;
  for (const fracao of [0.5, 1]) {
    const r = PRIMEIRA_VILA.raioEspaco * fracao * ESCALA_MUNDO;
    for (let k = 0; k < AMOSTRAS_ESPACO; k++) {
      const angulo = (k / AMOSTRAS_ESPACO) * Math.PI * 2;
      const px = Math.round(x + Math.cos(angulo) * r);
      const py = Math.round(y + Math.sin(angulo) * r);
      total++;
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      const i = py * W + px;
      if (!mundo.agua[i] && !CONSTRUIVEL_PROIBIDO.includes(mundo.tipo[i])) bons++;
    }
  }
  return bons / total;
}

/** Terreno para construir em vila: planície e savana primeiro. */
const BASE_CASA: Partial<Record<TileType, number>> = { planicie: 2, savana: 1.5, floresta: 0.5, deserto: 0.3, tundra: 0.3 };
const BASE_CASA_MAIOR: Partial<Record<TileType, number>> = { planicie: 1.5, savana: 1.2, floresta: 0.5, deserto: 0.3, tundra: 0.3 };

/** Informações da vila para um candidato (distâncias em unidades). */
interface NaVila {
  /** Até a referência da vila (fonte ou centro): é o que o anel usa. */
  distancia: number;
  /** Até o centro lógico: é o que o núcleo reservado usa. */
  distanciaCentro: number;
  anel: { ideal: number; tolerancia: number };
  temFonte: boolean;
  /** Construção da vila mais próxima (casa, casa maior ou fonte). */
  construcaoMaisProxima: number;
}

/** Um lugar candidato, já com as distâncias (em unidades) que as regras precisam. */
interface Candidato {
  x: number;
  y: number;
  tipo: TileType;
  alt: number;
  distAgua: number;
  distMont: number;
  /** Distância até o elemento mais próximo de cada tipo de evento (Infinity se não houver). */
  perto: Record<WorldGrowthKind, number>;
  /** 1 no miolo do território habitável, 0 na periferia. */
  centralidade: number;
  vila: NaVila | null;
  /** Fração de terreno construível em volta (só medida ao escolher a primeira vila). */
  espaco: number;
}

interface RegraDeCrescimento {
  /** null = lugar proibido; número = nota (maior é melhor). */
  pontuar(c: Candidato): number | null;
  /** Qual sprite nasceria neste terreno (null = terreno não serve). */
  sprite(tile: TileType): SpriteKey | null;
}

/**
 * Nota de uma construção de vila no anel dado, respeitando as zonas:
 * núcleo só para a fonte; anel logo em volta só para casas maiores.
 */
function notaNaVila(
  c: Candidato,
  bases: Partial<Record<TileType, number>>,
  construcao: 'casa' | 'casa_maior',
): number | null {
  if (CONSTRUIVEL_PROIBIDO.includes(c.tipo) || !c.vila) return null;
  const v = c.vila;
  if (!v.temFonte && v.distanciaCentro < VILA.nucleoReservado) return null; // lugar da fonte
  if (construcao === 'casa' && v.distancia < VILA.limiteCasasPequenas) return null; // anel das maiores
  return (bases[c.tipo] ?? 0) + notaRadial(v.distancia, v.anel) + notaDeVizinhanca(v.construcaoMaisProxima);
}

const REGRAS_CRESCIMENTO: Record<WorldGrowthKind, RegraDeCrescimento> = {
  crescerVegetacao: {
    pontuar(c) {
      const bases: Partial<Record<TileType, number>> = { floresta: 2, tundra: 2, planicie: 1, savana: 1, deserto: 0.6 };
      const base = bases[c.tipo];
      if (base === undefined) return null;
      return base + atracao(c.perto.crescerVegetacao, AGRUPAMENTO.vegetacao);
    },
    sprite: (tile) => PLANTA_POR_BIOMA[tile] ?? null,
  },

  desenvolverPovoamento: {
    pontuar(c) {
      if (c.vila) return notaNaVila(c, BASE_CASA, 'casa');
      // sem vila: escolhe onde a primeira nasce
      if (CONSTRUIVEL_PROIBIDO.includes(c.tipo)) return null;
      const agua = 2 - Math.abs(c.distAgua - PRIMEIRA_VILA.distanciaAguaIdeal) * PRIMEIRA_VILA.pesoAgua;
      return (BASE_CASA[c.tipo] ?? 0) + agua + c.espaco * PRIMEIRA_VILA.pesoEspaco;
    },
    sprite: () => 'casa',
  },

  // Infraestrutura ainda não vira estrada nem melhora uma casa existente:
  // acrescenta uma casa maior no anel interno da vila. Nunca isolada na natureza.
  melhorarInfraestrutura: {
    pontuar: (c) => notaNaVila(c, BASE_CASA_MAIOR, 'casa_maior'),
    sprite: () => 'casa_maior',
  },

  ampliarExploracao: {
    pontuar(c) {
      if (c.tipo === 'neve') return null;
      if (c.distMont > 4) return null; // só junto às montanhas
      const perto = 4 - c.distMont * 0.8;
      const centroDeVila = Math.max(0, 4 - c.perto.desenvolverPovoamento) * 0.8; // evita o meio das casas
      return perto - centroDeVila;
    },
    sprite: () => 'mina',
  },

  desenvolverObservacao: {
    pontuar(c) {
      if (c.tipo === 'neve') return null;
      if (c.distMont > 6 && c.alt < 0.66) return null; // precisa estar alto ou perto das montanhas
      const montanha = c.distMont <= 6 ? 2 - c.distMont * 0.3 : 0;
      const isolamento = Math.min(c.perto.desenvolverPovoamento, 15) * 0.2;
      return c.alt * 4 + montanha + isolamento;
    },
    sprite: () => 'observatorio',
  },
};

const VAZIO: Record<WorldGrowthKind, number> = {
  crescerVegetacao: Infinity,
  desenvolverPovoamento: Infinity,
  melhorarInfraestrutura: Infinity,
  ampliarExploracao: Infinity,
  desenvolverObservacao: Infinity,
};

interface Busca {
  evento: WorldGrowthKind;
  regra: RegraDeCrescimento;
  /** Vila e anel, quando a construção é de uma vila. */
  vila?: { assentamento: Settlement; anel: { ideal: number; tolerancia: number }; raioDisco: number };
  /** Peso da centralidade do mundo (0 quando há vila: aí quem manda é ela). */
  pesoCentro: number;
  /** Medir o espaço construível em volta (custa 32 consultas por candidato). */
  medirEspaco?: boolean;
}

/**
 * O laço de sempre: sorteia candidatos (no mapa todo, ou num disco em volta da
 * vila), rejeita o que é proibido ou sobrepõe, dá nota e fica com o melhor.
 */
function procurarLugar(
  mundo: World,
  ocupantes: readonly WorldOccupant[],
  busca: Busca,
  rng: Rng,
): { x: number; y: number; sprite: SpriteKey } | null {
  const { evento, regra, vila } = busca;
  const referencia = vila ? referenciaDaVila(vila.assentamento) : null;
  let melhor: { x: number; y: number; sprite: SpriteKey } | null = null;
  let nota = -Infinity;

  for (let t = 0; t < TENTATIVAS; t++) {
    let x: number;
    let y: number;
    if (vila && referencia) {
      const r = Math.sqrt(rng()) * vila.raioDisco; // √ espalha por igual na área do disco
      const angulo = rng() * Math.PI * 2;
      x = Math.round(referencia.x + Math.cos(angulo) * r);
      y = Math.round(referencia.y + Math.sin(angulo) * r);
      if (x < 2 || y < 3 || x > W - 3 || y > H - 2) continue;
    } else {
      x = 2 + Math.floor(rng() * (W - 4));
      y = 3 + Math.floor(rng() * (H - 4));
    }
    const i = y * W + x;
    if (mundo.agua[i]) continue; // nunca na água

    // o sprite depende do terreno e decide quanto espaço este elemento pede
    const sprite = regra.sprite(mundo.tipo[i]);
    if (!sprite) continue;

    const perto = { ...VAZIO };
    let bloqueado = false;
    for (const o of ocupantes) {
      const d = unidades(Math.hypot(o.x - x, o.y - y));
      if (d < distanciaEntre(sprite, evento, o.tipo, o.evento)) {
        bloqueado = true; // sobreposição visual
        break;
      }
      if (d < perto[o.evento]) perto[o.evento] = d;
    }
    if (bloqueado) continue;

    const c: Candidato = {
      x,
      y,
      tipo: mundo.tipo[i],
      alt: mundo.alt[i],
      distAgua: unidades(mundo.distAgua[i]),
      distMont: unidades(mundo.distMont[i]),
      perto,
      centralidade: centralidadeHabitavel(mundo, x, y),
      vila:
        vila && referencia
          ? {
              distancia: unidades(Math.hypot(x - referencia.x, y - referencia.y)),
              distanciaCentro: unidades(Math.hypot(x - vila.assentamento.x, y - vila.assentamento.y)),
              anel: vila.anel,
              temFonte: vila.assentamento.fonte !== undefined,
              construcaoMaisProxima: Math.min(perto.desenvolverPovoamento, perto.melhorarInfraestrutura),
            }
          : null,
      espaco: busca.medirEspaco ? espacoEmVolta(mundo, x, y) : 0,
    };
    const s = regra.pontuar(c);
    if (s === null) continue;
    const comAcaso = s + c.centralidade * busca.pesoCentro + rng() * ACASO;
    if (comAcaso > nota) {
      nota = comAcaso;
      melhor = { x, y, sprite };
    }
  }
  return melhor;
}

/**
 * Escolhe um lugar para o evento. Devolve a colocação ou o motivo de não achar lugar.
 * Nada do que entra é alterado. A intensidade é preservada, mas ainda não muda nada.
 */
export function colocarCrescimento(
  mundo: World,
  ocupantes: readonly WorldOccupant[],
  evento: WorldGrowthEvent,
  rng: Rng,
  /** Vila que deve receber a construção (casas e casas maiores). */
  assentamento?: Settlement,
): WorldGrowthPlacementResult {
  if (evento.tipo === 'melhorarInfraestrutura' && !assentamento) {
    return { status: 'semLugar', evento: evento.tipo, motivo: 'Ainda não existe vila para receber infraestrutura.' };
  }

  // casas maiores miram o anel em volta do núcleo; casas pequenas, o anel da vez
  const construcao = evento.tipo === 'melhorarInfraestrutura' ? 'casa_maior' : 'casa';
  const anel = assentamento ? anelIdeal(assentamento, construcao) : null;
  const lugar = procurarLugar(
    mundo,
    ocupantes,
    {
      evento: evento.tipo,
      regra: REGRAS_CRESCIMENTO[evento.tipo],
      vila: assentamento && anel ? { assentamento, anel, raioDisco: raioDeAmostragem(assentamento, anel) } : undefined,
      // centralidade do MUNDO só vale sem vila; com vila, quem manda é a vila
      pesoCentro: assentamento ? 0 : PESO_CENTRO[evento.tipo],
      // escolhendo onde nasce a primeira vila: quer espaço construível em volta
      medirEspaco: !assentamento && evento.tipo === 'desenvolverPovoamento',
    },
    rng,
  );

  if (!lugar) {
    return { status: 'semLugar', evento: evento.tipo, motivo: 'Nenhum lugar deste mundo atende às regras do evento.' };
  }
  return {
    status: 'colocado',
    colocacao: { evento: evento.tipo, tipo: lugar.sprite, x: lugar.x, y: lugar.y, intensidade: evento.intensidade },
  };
}

/** Fonte: o mais perto possível do centro lógico, dentro do núcleo reservado para ela. */
const REGRA_FONTE: RegraDeCrescimento = {
  pontuar(c) {
    if (CONSTRUIVEL_PROIBIDO.includes(c.tipo) || !c.vila) return null;
    return -c.vila.distanciaCentro * 2;
  },
  sprite: () => 'fonte',
};

/**
 * Coloca a fonte da vila (marco central). Quem decide QUANDO é growthElements;
 * aqui só se escolhe ONDE. Devolve null se o núcleo não tiver espaço.
 */
export function colocarFonte(
  mundo: World,
  ocupantes: readonly WorldOccupant[],
  assentamento: Settlement,
  rng: Rng,
): { x: number; y: number } | null {
  const lugar = procurarLugar(
    mundo,
    ocupantes,
    {
      evento: 'desenvolverPovoamento', // a fonte nasce do crescimento da vila
      regra: REGRA_FONTE,
      vila: {
        assentamento,
        anel: { ideal: 0, tolerancia: VILA.nucleoReservado },
        raioDisco: VILA.nucleoReservado * 1.5 * ESCALA_MUNDO,
      },
      pesoCentro: 0,
    },
    rng,
  );
  return lugar && { x: lugar.x, y: lugar.y };
}
