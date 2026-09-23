import type { ImageSourcePropType } from 'react-native';

import type { AssuntoDoMundo } from '../domain/assunto';

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
  mundo: '◉',
  /** Provisório: o aparelho que abre o feed. Vira pixel art depois. */
  celular: '▯',
} satisfies Record<string, Icon>;

/** O que pode aparecer no canto do World Pulse. */
export type IconeDoPulso = AssuntoDoMundo | 'conquista' | 'descoberta';

/**
 * O micro-ícone do World Pulse: um por assunto.
 *
 * Todos viram sprite pixel art de 24–32 px depois — é para isso que o card
 * reserva o canto direito. O `︎` (U+FE0E) pede a versão de TEXTO do glifo,
 * senão o iOS desenha alguns como emoji colorido.
 */
export const ICONS_DO_PULSO = {
  casa: '⌂',
  fonte: '◍',
  caminho: '⋯',
  observatorio: '☾',
  mina: '◆',
  natureza: '♣︎',
  paisagem: '∿',
  conquista: '✦',
  descoberta: '✺',
} satisfies Record<IconeDoPulso, Icon>;
