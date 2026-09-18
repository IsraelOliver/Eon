import type { RenderElement } from './renderElements';

/**
 * PNGs do mundo — ÚNICO lugar que liga uma construção/planta ao arquivo.
 * Os require são estáticos de propósito: o Metro precisa vê-los para empacotar.
 *
 * O engine pensa em papéis (`casa`, `casa_maior`, `fonte`) + orientação + variante;
 * `imagemDoElemento` traduz isso na chave de imagem abaixo.
 * Sprites sem PNG (torre, observatorio, escavacao, pedra, arbusto) usam o desenho
 * antigo em caracteres (spriteBuffers.ts).
 */
export const IMAGENS = {
  arvore: require('../../../../assets/images/world/sprites/arvore.png'),
  pinheiro: require('../../../../assets/images/world/sprites/pinheiro.png'),
  cacto: require('../../../../assets/images/world/sprites/cacto.png'),
  acacia: require('../../../../assets/images/world/sprites/acacia.png'),
  mina: require('../../../../assets/images/world/sprites/mina.png'),
  fonte: require('../../../../assets/images/world/sprites/fonte.png'),

  // Casa frontal antiga: só para o protótipo (Element), que não tem orientação.
  // As vilas usam sempre as diagonais abaixo.
  casa: require('../../../../assets/images/world/sprites/casa.png'),

  // Casa pequena (residência comum)
  casa_frente_v1: require('../../../../assets/images/world/sprites/casa-diagonal_ menor-frente.png'),
  casa_tras_v1: require('../../../../assets/images/world/sprites/casa-diagonal_ menor-tras.png'),
  casa_frente_v2: require('../../../../assets/images/world/sprites/casa-diagonal_ menor-frente_v2.png'),
  casa_tras_v2: require('../../../../assets/images/world/sprites/casa-diagonal_ menor-tras_v2.png'),

  // Casa maior (resultado de melhorarInfraestrutura; substitui a antiga casa_upgrade)
  casa_maior_frente_v1: require('../../../../assets/images/world/sprites/casa-diagonal_maior - frente.png'),
  casa_maior_tras_v1: require('../../../../assets/images/world/sprites/casa-diagonal_maior - tras.png'),
  casa_maior_frente_v2: require('../../../../assets/images/world/sprites/casa_diagonal_maior-frente_v2.png'),
  casa_maior_tras_v2: require('../../../../assets/images/world/sprites/casa_diagonal_maior-tras_v2.png'),
};

export type ImagemKey = keyof typeof IMAGENS;

/** Qual PNG desenha este elemento (null = não tem PNG; usa o desenho em caracteres). */
export function imagemDoElemento(el: RenderElement): ImagemKey | null {
  if (el.tipo === 'casa' || el.tipo === 'casa_maior') {
    if (el.orientacao && el.variante) return `${el.tipo}_${el.orientacao}_${el.variante}`;
    // casa maior sem aparência definida: a arte padrão da construção maior
    if (el.tipo === 'casa_maior') return 'casa_maior_frente_v1';
    return 'casa'; // protótipo
  }
  return el.tipo in IMAGENS ? (el.tipo as ImagemKey) : null;
}
