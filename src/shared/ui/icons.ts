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
  /**
   * A engrenagem das Configurações (topo do Discovery): pixel art 22×22, com as
   * próprias cores — nunca recebe tint. Gerada com `-Escala3x 3`.
   */
  gear: require('../../../assets/ui/gear_configuration.png'),
  /** A mesma engrenagem com o miolo escuro: é a que contrasta sobre fundo claro. */
  gearEscura: require('../../../assets/ui/gear_configuration-dark.png'),
  /**
   * O ícone que leva ao Mundo: a casinha, pixel art 14×14 — par do ícone do
   * Discovery, mesmo tamanho e mesma escala. Nunca recebe tint. Gerada com
   * `-Escala3x 4`.
   */
  mundo: require('../../../assets/ui/letter_home.png'),
  /**
   * O ícone que abre o Discovery: pixel art 14×14, desenhada com as próprias
   * cores — nunca recebe tint. Arquivos gerados por `scripts/gerar-icone-ui.ps1`
   * (com `-Escala3x 4`).
   */
  discovery: require('../../../assets/ui/Letter_Discovery.png'),
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
  cabana: '⌂',
  fogueira: '♨︎',
  fonte: '◍',
  caminho: '⋯',
  observatorio: '☾',
  mina: '◆',
  natureza: '♣︎',
  paisagem: '∿',
  conquista: '✦',
  descoberta: '✺',
} satisfies Record<IconeDoPulso, Icon>;
