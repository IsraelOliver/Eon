import type { ImageSourcePropType } from 'react-native';

/**
 * Ícones da interface — ÚNICO lugar para trocá-los.
 *
 * Por enquanto são símbolos de texto (provisórios). Quando a pixel art existir,
 * troque a linha pelo require da imagem, por exemplo:
 *   gear: require('../../../assets/ui/gear.png'),
 *   menu: require('../../../assets/ui/menu.png'),
 * (o require precisa apontar para um arquivo que existe, senão o app não compila)
 */
export type Icon = string | ImageSourcePropType;

export const ICONS = {
  gear: '⚙︎',
  menu: '☰',
  aprender: '✦',
  mundo: '◉',
} satisfies Record<string, Icon>;
