import type { SpriteKey } from '../engine/types';

/**
 * PNGs dos sprites — ÚNICO lugar que liga uma SpriteKey ao arquivo.
 * Os require são estáticos de propósito: o Metro precisa vê-los para empacotar.
 *
 * Chaves sem PNG (torre, observatorio, escavacao) continuam usando o desenho
 * antigo em caracteres (spriteBuffers.ts). Basta adicionar a linha aqui quando
 * o arquivo existir.
 */
export const SPRITE_PNG = {
  arvore: require('../../../../assets/images/world/sprites/arvore.png'),
  pinheiro: require('../../../../assets/images/world/sprites/pinheiro.png'),
  cacto: require('../../../../assets/images/world/sprites/cacto.png'),
  acacia: require('../../../../assets/images/world/sprites/acacia.png'),
  casa: require('../../../../assets/images/world/sprites/casa.png'),
  casa_upgrade: require('../../../../assets/images/world/sprites/casa_upgrade.png'),
  mina: require('../../../../assets/images/world/sprites/mina.png'),
} satisfies Partial<Record<SpriteKey, unknown>>;

export type SpriteComPng = keyof typeof SPRITE_PNG;

/** Ordem fixa: o hook que carrega as imagens precisa chamar useImage sempre igual. */
export const SPRITES_COM_PNG = Object.keys(SPRITE_PNG) as SpriteComPng[];
