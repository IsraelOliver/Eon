import type { ImageSourcePropType } from 'react-native';

import type { CuriosityId } from '../engine/types';

/**
 * Capa de cada curiosidade — ÚNICO lugar que liga uma curiosidade a um arquivo.
 *
 * Fica em `presentation/` de propósito: `learning/engine` é puro e não sabe que
 * existem imagens. Trocar todas as capas não toca em nenhuma regra.
 *
 * Para adicionar uma capa:
 *  1. coloque o arquivo em `assets/images/learning/covers/` (veja o README de lá);
 *  2. registre o `require` abaixo, com a chave igual ao `id` da curiosidade.
 *
 * Os `require` são estáticos porque o Metro precisa vê-los para empacotar, e
 * precisam apontar para arquivos que existem — senão o app não compila.
 *
 * As capas de hoje são provisórias, do mesmo jeito que as curiosidades de teste.
 */
const CAPAS: Partial<Record<CuriosityId, ImageSourcePropType>> = {
  'teste-natureza-1': require('../../../../assets/images/learning/covers/teste-natureza-1.jpg'),
  'teste-historia-1': require('../../../../assets/images/learning/covers/teste-historia-1.jpg'),
  'teste-astronomia-1': require('../../../../assets/images/learning/covers/teste-astronomia-1.jpg'),
};

/** A capa desta curiosidade, ou `undefined` enquanto ela ainda não tem arquivo. */
export function capaDe(id: CuriosityId): ImageSourcePropType | undefined {
  return CAPAS[id];
}
