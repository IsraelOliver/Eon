import { hash2 } from '../engine/noise';
import type { RenderElement } from './renderElements';

/**
 * PNGs do mundo — ÚNICO lugar que liga uma construção/planta ao arquivo.
 * Os require são estáticos de propósito: o Metro precisa vê-los para empacotar.
 *
 * Pastas em assets/images/world/sprites/: `arvores/`, `casas/`, `marcos/`,
 * `construcoes/` — e `old/`, onde fica todo sprite substituído (nada ali é
 * carregado; o Metro só empacota o que tem require).
 *
 * O engine pensa em papéis (`arvore`, `casa`, `casa_maior`, `fonte`) + orientação
 * + variante; `imagemDoElemento` traduz isso na chave de imagem abaixo, que tem
 * o nome da ARTE (a árvore do papel `arvore` é a `oak_tree`). Trocar a arte de
 * um papel não mexe no engine nem no save.
 * Sprites sem PNG (observatorio, pedra, arbusto) usam o desenho em caracteres
 * (spriteBuffers.ts).
 */
export const IMAGENS = {
  oak_tree: require('../../../../assets/images/world/sprites/arvores/oak_tree.png'),
  oak_tree_v2: require('../../../../assets/images/world/sprites/arvores/oak_tree_v2.png'),
  oak_tree_v3: require('../../../../assets/images/world/sprites/arvores/oak_tree_v3.png'),
  pinheiro: require('../../../../assets/images/world/sprites/arvores/pinheiro.png'),
  cacto: require('../../../../assets/images/world/sprites/arvores/cacto.png'),
  acacia: require('../../../../assets/images/world/sprites/arvores/acacia.png'),
  mina: require('../../../../assets/images/world/sprites/construcoes/mina.png'),
  fonte: require('../../../../assets/images/world/sprites/construcoes/fonte.png'),

  // Marcos da vila (engine/marcos.ts)
  cabana: require('../../../../assets/images/world/sprites/marcos/cabana.png'),
  fogueira: require('../../../../assets/images/world/sprites/marcos/fogueira.png'),

  // Casa frontal: fallback para uma residência que chegue sem orientação/variante.
  // As vilas usam sempre as diagonais abaixo.
  casa: require('../../../../assets/images/world/sprites/casas/casa.png'),

  // Casa pequena (residência comum)
  casa_frente_v1: require('../../../../assets/images/world/sprites/casas/casa-diagonal_ menor-frente.png'),
  casa_tras_v1: require('../../../../assets/images/world/sprites/casas/casa-diagonal_ menor-tras.png'),
  casa_frente_v2: require('../../../../assets/images/world/sprites/casas/casa-diagonal_ menor-frente_v2.png'),
  casa_tras_v2: require('../../../../assets/images/world/sprites/casas/casa-diagonal_ menor-tras_v2.png'),

  // Casa maior (resultado de melhorarInfraestrutura; substitui a antiga casa_upgrade)
  casa_maior_frente_v1: require('../../../../assets/images/world/sprites/casas/casa-diagonal_maior - frente.png'),
  casa_maior_tras_v1: require('../../../../assets/images/world/sprites/casas/casa-diagonal_maior - tras.png'),
  casa_maior_frente_v2: require('../../../../assets/images/world/sprites/casas/casa_diagonal_maior-frente_v2.png'),
  casa_maior_tras_v2: require('../../../../assets/images/world/sprites/casas/casa_diagonal_maior-tras_v2.png'),
};

export type ImagemKey = keyof typeof IMAGENS;

/**
 * Papéis cuja arte tem outro nome — e, quando há mais de uma, as variantes com o
 * peso de cada uma (somam 1). Os outros papéis usam a imagem com o próprio nome.
 *
 * A variante sai da POSIÇÃO do elemento (hash), nunca de sorteio: a mesma
 * árvore é sempre a mesma arte, em qualquer render e depois de reabrir o app.
 */
const ARTE_DO_PAPEL: Partial<Record<RenderElement['tipo'], readonly (readonly [ImagemKey, number])[]>> = {
  // o carvalho é a arte principal; v2 e v3 são variações, para a mata não
  // parecer carimbada
  arvore: [
    ['oak_tree', 0.5],
    ['oak_tree_v2', 0.25],
    ['oak_tree_v3', 0.25],
  ],
};

/** A variante deste elemento, escolhida pela posição dele. */
function varianteDaArte(variantes: readonly (readonly [ImagemKey, number])[], el: RenderElement): ImagemKey {
  const sorteio = hash2(el.x, el.y, 7717);
  let acumulado = 0;
  for (const [arte, peso] of variantes) {
    acumulado += peso;
    if (sorteio < acumulado) return arte;
  }
  return variantes[variantes.length - 1][0];
}

/** Qual PNG desenha este elemento (null = não tem PNG; usa o desenho em caracteres). */
export function imagemDoElemento(el: RenderElement): ImagemKey | null {
  if (el.tipo === 'casa' || el.tipo === 'casa_maior') {
    if (el.orientacao && el.variante) return `${el.tipo}_${el.orientacao}_${el.variante}`;
    // casa maior sem aparência definida: a arte padrão da construção maior
    if (el.tipo === 'casa_maior') return 'casa_maior_frente_v1';
    return 'casa'; // protótipo
  }
  const variantes = ARTE_DO_PAPEL[el.tipo];
  if (variantes) return varianteDaArte(variantes, el);
  return el.tipo in IMAGENS ? (el.tipo as ImagemKey) : null;
}
