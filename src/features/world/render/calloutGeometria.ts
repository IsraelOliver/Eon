// =====================================================================
// GEOMETRIA DA ETIQUETA — onde o balão fica e por onde a linha o alcança.
//
// Tudo nasce de UM ponto: a âncora, que é o centro da bolinha sobre a
// construção. Nada aqui tem offset feito para um caso; o resto é derivado.
// Puro: sem React, sem tela, testável direto.
//
// Regra visual (HUD de estratégia): a linha SEMPRE entra por uma LATERAL do
// balão. Se o balão precisou subir ou descer para caber na tela, quem resolve o
// desnível é um cotovelo ortogonal — nunca uma entrada por cima ou por baixo.
// =====================================================================

export interface Ponto {
  x: number;
  y: number;
}

export interface Retangulo {
  /** Canto superior esquerdo. */
  x: number;
  y: number;
  largura: number;
  altura: number;
}

/** Onde o balão pode ficar: a tela menos safe area, margens e a barra de baixo. */
export interface Limites {
  esquerda: number;
  direita: number;
  topo: number;
  base: number;
}

/** De que lado da âncora o balão ficou. A linha entra pela lateral oposta. */
export type Lado = 'direita' | 'esquerda';

export interface Balao extends Retangulo {
  lado: Lado;
}

function prender(valor: number, min: number, max: number): number {
  // Com o espaço menor que o balão, `min > max`: aí vale a borda de cima/esquerda.
  if (max < min) return min;
  return Math.min(max, Math.max(min, valor));
}

/**
 * Onde colocar o balão, dado o ponto da construção.
 *
 * O lado sai do **espaço livre de verdade**, comparado com a largura medida —
 * não de "está na metade esquerda da tela". Cabendo dos dois, fica no que tem
 * mais espaço. Verticalmente ele tenta se centrar na âncora (o que deixa a
 * linha reta); o clamp é que o faz subir ou descer perto das bordas, e daí nasce
 * o cotovelo.
 */
export function posicionarBalao(
  ancora: Ponto,
  balao: { largura: number; altura: number },
  limites: Limites,
  vao: number,
): Balao {
  const espacoDireita = limites.direita - (ancora.x + vao);
  const espacoEsquerda = ancora.x - vao - limites.esquerda;

  const cabeDireita = espacoDireita >= balao.largura;
  const cabeEsquerda = espacoEsquerda >= balao.largura;
  const paraDireita = cabeDireita ? !cabeEsquerda || espacoDireita >= espacoEsquerda : !cabeEsquerda && espacoDireita >= espacoEsquerda;

  /*
   * Num telefone estreito, uma construção no meio da tela não deixa o balão
   * caber em nenhum dos lados. Ele então desce (ou sobe) para não cobrir a
   * bolinha — mas a conexão continua lateral: quem liga os dois é o cotovelo.
   */
  if (!cabeDireita && !cabeEsquerda) {
    const cabeEmbaixo = ancora.y + vao + balao.altura <= limites.base;
    const yPreferido = cabeEmbaixo ? ancora.y + vao : ancora.y - vao - balao.altura;
    return {
      x: prender(ancora.x - balao.largura / 2, limites.esquerda, limites.direita - balao.largura),
      y: prender(yPreferido, limites.topo, limites.base - balao.altura),
      largura: balao.largura,
      altura: balao.altura,
      lado: paraDireita ? 'direita' : 'esquerda',
    };
  }

  const xPreferido = paraDireita ? ancora.x + vao : ancora.x - vao - balao.largura;

  return {
    x: prender(xPreferido, limites.esquerda, limites.direita - balao.largura),
    y: prender(ancora.y - balao.altura / 2, limites.topo, limites.base - balao.altura),
    largura: balao.largura,
    altura: balao.altura,
    lado: paraDireita ? 'direita' : 'esquerda',
  };
}

export interface OpcoesDaLigacao {
  /** Folga nas pontas da lateral, para a linha não chegar no canto arredondado. */
  margemInterna: number;
  /** Desnível menor que isto conta como "mesma altura": linha reta. */
  tolerancia: number;
  /** Trecho horizontal mínimo de cada lado do cotovelo. */
  trechoMinimo: number;
}

export interface Ligacao {
  /** Onde a linha toca o balão. Sempre numa LATERAL. */
  destino: Ponto;
  /** X do trecho vertical. Só faz sentido com cotovelo. */
  cotoveloX: number;
  comCotovelo: boolean;
}

/**
 * Por onde a linha entra no balão e onde dobra.
 *
 * O ponto de entrada é a lateral **oposta ao lado** em que o balão ficou: balão
 * à direita entra pela borda esquerda, e vice-versa. O `y` é a própria âncora,
 * presa dentro da lateral — então a linha fica reta sempre que possível.
 */
export function ligacaoLateral(ancora: Ponto, balao: Balao, opcoes: OpcoesDaLigacao): Ligacao {
  const destinoX = balao.lado === 'direita' ? balao.x : balao.x + balao.largura;
  const destinoY = prender(
    ancora.y,
    balao.y + opcoes.margemInterna,
    balao.y + balao.altura - opcoes.margemInterna,
  );

  const comCotovelo = Math.abs(ancora.y - destinoY) > opcoes.tolerancia;

  // O cotovelo fica perto do meio, mas nunca deixa um trecho horizontal ridículo.
  const total = destinoX - ancora.x;
  const sentido = total >= 0 ? 1 : -1;
  const minimo = Math.min(opcoes.trechoMinimo, Math.abs(total) / 2);
  let cotoveloX = ancora.x + total * 0.45;
  if (Math.abs(cotoveloX - ancora.x) < minimo) cotoveloX = ancora.x + sentido * minimo;
  if (Math.abs(destinoX - cotoveloX) < minimo) cotoveloX = destinoX - sentido * minimo;

  return { destino: { x: destinoX, y: destinoY }, cotoveloX, comCotovelo };
}

export interface OpcoesDosTrechos extends OpcoesDaLigacao {
  espessura: number;
  /** Quanto a linha entra sob a bolinha e sob a borda do balão. */
  folga: number;
}

/**
 * Os retângulos que desenham a linha: um só (reta) ou três (cotovelo
 * horizontal → vertical → horizontal). Cada um vira uma `View` absoluta.
 */
export function trechosDaLinha(ancora: Ponto, balao: Balao, opcoes: OpcoesDosTrechos): Retangulo[] {
  const { destino, cotoveloX, comCotovelo } = ligacaoLateral(ancora, balao, opcoes);
  const { espessura, folga } = opcoes;
  const meia = espessura / 2;

  /** Trecho horizontal entre dois x, na altura y. `folgas` estica as pontas. */
  const horizontal = (x1: number, x2: number, y: number, inicio: number, fim: number): Retangulo => {
    const esquerda = Math.min(x1, x2) - (x1 <= x2 ? inicio : fim);
    const direita = Math.max(x1, x2) + (x1 <= x2 ? fim : inicio);
    return { x: esquerda, y: y - meia, largura: direita - esquerda, altura: espessura };
  };

  if (!comCotovelo) {
    // Reta: entra um pouco na bolinha de um lado e sob a borda do outro.
    return [horizontal(ancora.x, destino.x, ancora.y, folga, folga)];
  }

  const topo = Math.min(ancora.y, destino.y) - meia;
  const base = Math.max(ancora.y, destino.y) + meia;

  return [
    // Sai da bolinha e vai até a dobra; o canto é fechado pela espessura.
    horizontal(ancora.x, cotoveloX, ancora.y, folga, meia),
    { x: cotoveloX - meia, y: topo, largura: espessura, altura: base - topo },
    // Da dobra até a lateral do balão, entrando um pouco sob a borda.
    horizontal(cotoveloX, destino.x, destino.y, meia, folga),
  ];
}
