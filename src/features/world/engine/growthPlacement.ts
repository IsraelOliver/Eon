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
import { footprintEmTerrenoValido, tipoConstruivel } from './buildable';
import type { PreferenciaGeografica } from './marcos';
import { arvoresSeTocam, centroVisual, construcoesSeTocam, retanguloDe, retanguloTocaCirculo } from './footprint';
import { tilesDeCaminho } from './paths';
import { ESCALA_MUNDO, H, W } from './rules';
import {
  MARGEM_PRACA_ANTES_DA_FONTE,
  RAIO_PRACA,
  VILA,
  anelIdeal,
  areaDaPraca,
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
 * visual: casas formam vila, construções grandes e isoladas pedem mais respiro. Entre dois elementos vale a média das exigências,
 * salvo quando o par tem regra própria (DISTANCIA_ENTRE).
 *
 * Entre duas CONSTRUÇÕES (casa, casa maior, fonte) quem decide é o footprint
 * (footprint.ts: retângulo ancorado na base); entre duas ÁRVORES, a base do
 * tronco (footprint.ts: arvoresSeTocam). Estes valores só valem para os outros
 * pares (árvore × construção, mina, observatório, protótipo).
 */
const DISTANCIA_MINIMA_SPRITE: Partial<Record<SpriteKey, number>> = {
  arvore: 1.4,
  pinheiro: 1.4,
  cacto: 1.4,
  acacia: 1.6,
  casa: 2.2, // casa diagonal pequena: vila compacta sem sobrepor
  casa_maior: 2.6,
  fonte: 2,
  cabana: 2.2,
  fogueira: 1.6,
  telescopio: 3,
  posto_de_observacao: 3.5,
  mina: 4,
  observatorio: 5,
};

/**
 * Pares com distância própria entre âncoras (em unidades). Hoje vazio: os pares
 * entre construções passaram a ser decididos pelo footprint (FOLGA_ENTRE).
 */
const DISTANCIA_ENTRE: Partial<Record<`${SpriteKey}|${SpriteKey}`, number>> = {};

/** Fallback para sprites sem entrada na tabela acima. */
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
      if (tipoConstruivel(mundo.tipo[py * W + px])) bons++;
    }
  }
  return bons / total;
}

/** O retângulo da construção cobre algum tile de caminho? */
function retanguloSobreARede(r: { esquerda: number; direita: number; topo: number; base: number }, naRede: Set<number>): boolean {
  for (let y = Math.floor(r.topo); y < Math.ceil(r.base); y++) {
    for (let x = Math.floor(r.esquerda); x < Math.ceil(r.direita); x++) {
      if (naRede.has(y * W + x)) return true;
    }
  }
  return false;
}

/**
 * O que pode ocupar o CORAÇÃO da vila — a praça reservada. A fonte, e a fogueira,
 * que é o primeiro sinal de núcleo antes de a fonte existir. Todo o resto desvia.
 */
const NO_CORACAO: ReadonlySet<SpriteKey> = new Set(['fonte', 'fogueira']);

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
  if (!tipoConstruivel(c.tipo) || !c.vila) return null;
  const v = c.vila; // a praça já foi garantida em procurarLugar (restrição dura)
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
      if (!tipoConstruivel(c.tipo)) return null;
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
  const praca = vila ? areaDaPraca(vila.assentamento) : null;
  const naRede = vila?.assentamento.caminhos.length ? tilesDeCaminho(vila.assentamento.caminhos) : null;
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

    // terreno: todo o retângulo da construção (ou o tronco da árvore) em terra firme, longe da água
    if (!footprintEmTerrenoValido(mundo, sprite, x, y)) continue;

    // praça: restrição dura — nenhuma construção invade a área livre da fonte
    const meuRetangulo = retanguloDe(sprite, x, y);
    // nem a rua: nesta versão a casa desvia do caminho, não o contrário
    if (naRede && meuRetangulo && retanguloSobreARede(meuRetangulo, naRede)) continue;
    if (praca && meuRetangulo && !NO_CORACAO.has(sprite) && retanguloTocaCirculo(meuRetangulo, praca)) continue;
    // a própria fonte precisa da praça inteira livre em volta dela
    const minhaPraca = sprite === 'fonte' ? { ...centroVisual('fonte', x, y), raio: RAIO_PRACA } : null;

    const perto = { ...VAZIO };
    let bloqueado = false;
    for (const o of ocupantes) {
      const d = unidades(Math.hypot(o.x - x, o.y - y));
      // construção × construção: retângulos; árvore × árvore: troncos;
      // nos outros pares, distância entre âncoras
      const tocam =
        construcoesSeTocam({ tipo: sprite, x, y }, o) ??
        arvoresSeTocam({ tipo: sprite, x, y }, o) ??
        d < distanciaEntre(sprite, evento, o.tipo, o.evento);
      const retanguloDoOutro = minhaPraca ? retanguloDe(o.tipo, o.x, o.y) : null;
      const invadePraca = minhaPraca !== null && retanguloDoOutro !== null && retanguloTocaCirculo(retanguloDoOutro, minhaPraca);
      if (tocam || invadePraca) {
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

/**
 * Onde nasce uma construção NOVA da progressão (engine/marcos.ts). Quem decide
 * QUANDO é a regra dos degraus; aqui só se escolhe ONDE, sempre para o sprite
 * real — o espaço no chão é o dele. A vila já precisa existir — quem a funda,
 * quando é o caso, é growthElements (com as mesmas regras da primeira vila).
 *
 * - `fundaVila` / `anelDasCasas`: no anel das casas pequenas.
 * - `anelDasMaiores`: no anel das casas maiores, logo fora da praça.
 * - `centroDaVila`: o mais perto possível do centro, dentro da praça reservada.
 * - `periferiaDaVila`: um anel além das casas (`colocarNaPeriferia`).
 * - `especializado`: pela `preferencia` geográfica (`colocarComPreferencia`).
 */
export function colocarMarco(
  mundo: World,
  ocupantes: readonly WorldOccupant[],
  sprite: SpriteKey,
  lugar: 'fundaVila' | 'centroDaVila' | 'anelDasCasas' | 'anelDasMaiores' | 'periferiaDaVila' | 'especializado',
  assentamento: Settlement,
  rng: Rng,
  preferencia?: PreferenciaGeografica,
): { x: number; y: number } | null {
  if (lugar === 'especializado' && preferencia) {
    return colocarComPreferencia(mundo, ocupantes, sprite, assentamento, preferencia, rng);
  }
  if (lugar === 'periferiaDaVila' || lugar === 'especializado') {
    return colocarNaPeriferia(mundo, ocupantes, sprite, assentamento, rng);
  }
  const noCentro = lugar === 'centroDaVila';
  const construcao = lugar === 'anelDasMaiores' ? 'casa_maior' : 'casa';
  const anel = noCentro ? { ideal: 0, tolerancia: 1 } : anelIdeal(assentamento, construcao);
  const bases = construcao === 'casa_maior' ? BASE_CASA_MAIOR : BASE_CASA;
  const achado = procurarLugar(
    mundo,
    ocupantes,
    {
      evento: construcao === 'casa_maior' ? 'melhorarInfraestrutura' : 'desenvolverPovoamento',
      regra: {
        pontuar: noCentro
          ? (c) => (tipoConstruivel(c.tipo) && c.vila ? -c.vila.distanciaCentro * 2 : null)
          : (c) => notaNaVila(c, bases, construcao),
        sprite: () => sprite,
      },
      vila: {
        assentamento,
        anel,
        raioDisco: noCentro ? MARGEM_PRACA_ANTES_DA_FONTE + 2 : raioDeAmostragem(assentamento, anel),
      },
      pesoCentro: 0,
    },
    rng,
  );
  return achado && { x: achado.x, y: achado.y };
}

/**
 * Onde nasce uma construção ESPECIALIZADA: pela preferência geográfica que o
 * ramo declarou (marcos.ts) — nada aqui sabe de Astronomia. Fallback
 * progressivo, para o marco nunca sumir num mapa sem a configuração perfeita:
 *
 *   1. a preferência inteira (faixa de distância + montanha + terreno);
 *   2. só a distância, numa faixa mais larga (a periferia distante);
 *   3. a periferia da vila, logo além das casas — qualquer lugar seguro fora do núcleo.
 *
 * Todas as tentativas são o `procurarLugar` de sempre: terreno firme e longe da
 * água (footprint), fora da praça e da rua, sem colidir. Determinístico pelo rng
 * da execução (semente do mundo + sequência).
 */
function colocarComPreferencia(
  mundo: World,
  ocupantes: readonly WorldOccupant[],
  sprite: SpriteKey,
  assentamento: Settlement,
  preferencia: PreferenciaGeografica,
  rng: Rng,
): { x: number; y: number } | null {
  const { minima, maxima } = preferencia.distanciaDaVila;
  const tentativas: { minima: number; maxima: number; montanha: boolean }[] = [
    { minima, maxima, montanha: true },
    { minima: minima * 0.6, maxima: maxima * 1.5, montanha: false },
  ];
  for (const t of tentativas) {
    const achado = procurarLugar(
      mundo,
      ocupantes,
      {
        evento: 'desenvolverObservacao',
        regra: {
          pontuar: (c) => notaGeografica(c, preferencia, t.minima, t.maxima, t.montanha),
          sprite: () => sprite,
        },
        // o disco de sorteio cobre a faixa inteira (raio em tiles)
        vila: { assentamento, anel: { ideal: 0, tolerancia: 1 }, raioDisco: t.maxima * 1.15 },
        pesoCentro: 0,
      },
      rng,
    );
    if (achado) return { x: achado.x, y: achado.y };
  }
  return colocarNaPeriferia(mundo, ocupantes, sprite, assentamento, rng);
}

/** Quanto a nota cai por tile além da distância máxima ideal. */
const QUEDA_ALEM_DA_MAXIMA = 0.12;

/**
 * A nota de um lugar pela preferência geográfica. Distâncias em TILES (o
 * candidato as traz em unidades). null = recusado.
 */
function notaGeografica(
  c: Candidato,
  preferencia: PreferenciaGeografica,
  minima: number,
  maxima: number,
  comMontanha: boolean,
): number | null {
  if (!tipoConstruivel(c.tipo) || !c.vila) return null;
  const daVila = c.vila.distancia * ESCALA_MUNDO;
  if (daVila < minima) return null; // não se amontoa com as casas
  let nota = (preferencia.terreno[c.tipo] ?? 0) - Math.max(0, daVila - maxima) * QUEDA_ALEM_DA_MAXIMA;
  const montanha = preferencia.perto?.montanha;
  if (comMontanha && montanha) {
    const ateMontanha = c.distMont * ESCALA_MUNDO;
    nota += montanha.peso * Math.max(0, 1 - Math.abs(ateMontanha - montanha.ideal) / montanha.tolerancia);
  }
  return nota;
}

/** Quantas unidades a periferia fica além do anel das casas. */
const ALEM_DAS_CASAS = 3;

/**
 * A periferia da vila: um anel além das casas, fora do centro, sem colisão. É o
 * último recurso das especializações, quando nenhuma faixa da preferência
 * geográfica tem lugar (`colocarComPreferencia`).
 */
function colocarNaPeriferia(
  mundo: World,
  ocupantes: readonly WorldOccupant[],
  sprite: SpriteKey,
  assentamento: Settlement,
  rng: Rng,
): { x: number; y: number } | null {
  const casas = anelIdeal(assentamento, 'casa');
  const anel = { ideal: casas.ideal + ALEM_DAS_CASAS, tolerancia: casas.tolerancia };
  const achado = procurarLugar(
    mundo,
    ocupantes,
    {
      evento: 'desenvolverObservacao',
      regra: {
        pontuar: (c) => (tipoConstruivel(c.tipo) && c.vila ? notaRadial(c.vila.distancia, anel) : null),
        sprite: () => sprite,
      },
      vila: { assentamento, anel, raioDisco: raioDeAmostragem(assentamento, anel) },
      pesoCentro: 0,
    },
    rng,
  );
  return achado && { x: achado.x, y: achado.y };
}

/** Os dois retângulos se cruzam de verdade (sem folga)? */
function retangulosSeCruzam(
  a: { esquerda: number; direita: number; topo: number; base: number },
  b: { esquerda: number; direita: number; topo: number; base: number },
): boolean {
  return a.esquerda < b.direita && b.esquerda < a.direita && a.topo < b.base && b.topo < a.base;
}

/**
 * Uma construção pode crescer para `tipo` NO MESMO LUGAR? (A evolução nunca
 * muda de posição.) O espaço novo é o do sprite novo, e tem de:
 * - pisar em terreno firme, longe o bastante da água (`footprintEmTerrenoValido`);
 * - não cruzar nenhuma outra construção — aqui sem folga: crescer um pouco
 *   para perto da vizinha é aceitável, subir por cima dela não;
 * - ficar fora da praça (salvo quem mora no coração da vila).
 *
 * A rua não entra: na progressão a rede é refeita logo depois (em volta da
 * construção nova), então crescer por cima de uma trilha só a faz desviar.
 *
 * `outros` são os ocupantes SEM a própria construção.
 */
export function cabeEvoluir(
  mundo: World,
  outros: readonly WorldOccupant[],
  tipo: SpriteKey,
  x: number,
  y: number,
  assentamento?: Settlement,
): boolean {
  if (!footprintEmTerrenoValido(mundo, tipo, x, y)) return false;
  const meu = retanguloDe(tipo, x, y);
  for (const o of outros) {
    const dele = retanguloDe(o.tipo, o.x, o.y);
    if (meu && dele) {
      if (retangulosSeCruzam(meu, dele)) return false;
    } else if (unidades(Math.hypot(o.x - x, o.y - y)) < distanciaEntre(tipo, o.evento, o.tipo, o.evento)) {
      return false;
    }
  }
  if (assentamento && meu && !NO_CORACAO.has(tipo) && retanguloTocaCirculo(meu, areaDaPraca(assentamento))) {
    return false;
  }
  return true;
}

/** Fonte: o mais perto possível do centro lógico, dentro da praça reservada para ela. */
const REGRA_FONTE: RegraDeCrescimento = {
  pontuar(c) {
    if (!tipoConstruivel(c.tipo) || !c.vila) return null;
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
        anel: { ideal: 0, tolerancia: 1 }, // a fonte não usa anel, só a distância ao centro
        // perto do centro: a margem da reserva mais um pouco (em tiles)
        raioDisco: MARGEM_PRACA_ANTES_DA_FONTE + 2,
      },
      pesoCentro: 0,
    },
    rng,
  );
  return lugar && { x: lugar.x, y: lugar.y };
}
