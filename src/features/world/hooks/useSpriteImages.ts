import { useImage, type SkImage } from '@shopify/react-native-skia';

import { IMAGENS, type ImagemKey } from '../render/spriteAssets';

/**
 * Carrega os PNGs do mundo. Um useImage por arquivo, sempre na mesma ordem
 * (regra dos hooks). Devolve null enquanto a imagem ainda não carregou.
 * Ao acrescentar um PNG em spriteAssets.ts, acrescente a linha aqui também.
 */
export function useSpriteImages(): Record<ImagemKey, SkImage | null> {
  return {
    oak_tree: useImage(IMAGENS.oak_tree),
    oak_tree_v2: useImage(IMAGENS.oak_tree_v2),
    oak_tree_v3: useImage(IMAGENS.oak_tree_v3),
    pinheiro: useImage(IMAGENS.pinheiro),
    cacto: useImage(IMAGENS.cacto),
    acacia: useImage(IMAGENS.acacia),
    mina: useImage(IMAGENS.mina),
    fonte: useImage(IMAGENS.fonte),
    cabana: useImage(IMAGENS.cabana),
    fogueira: useImage(IMAGENS.fogueira),
    casa: useImage(IMAGENS.casa),
    casa_frente_v1: useImage(IMAGENS.casa_frente_v1),
    casa_tras_v1: useImage(IMAGENS.casa_tras_v1),
    casa_frente_v2: useImage(IMAGENS.casa_frente_v2),
    casa_tras_v2: useImage(IMAGENS.casa_tras_v2),
    casa_maior_frente_v1: useImage(IMAGENS.casa_maior_frente_v1),
    casa_maior_tras_v1: useImage(IMAGENS.casa_maior_tras_v1),
    casa_maior_frente_v2: useImage(IMAGENS.casa_maior_frente_v2),
    casa_maior_tras_v2: useImage(IMAGENS.casa_maior_tras_v2),
  };
}
