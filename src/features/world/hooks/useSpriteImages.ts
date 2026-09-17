import { useImage, type SkImage } from '@shopify/react-native-skia';

import { SPRITE_PNG, type SpriteComPng } from '../render/spriteAssets';

/**
 * Carrega os PNGs dos sprites. Um useImage por arquivo, em ordem fixa
 * (regra dos hooks). Devolve null enquanto a imagem ainda não carregou.
 */
export function useSpriteImages(): Record<SpriteComPng, SkImage | null> {
  return {
    arvore: useImage(SPRITE_PNG.arvore),
    pinheiro: useImage(SPRITE_PNG.pinheiro),
    cacto: useImage(SPRITE_PNG.cacto),
    acacia: useImage(SPRITE_PNG.acacia),
    casa: useImage(SPRITE_PNG.casa),
    casa_upgrade: useImage(SPRITE_PNG.casa_upgrade),
    mina: useImage(SPRITE_PNG.mina),
  };
}
