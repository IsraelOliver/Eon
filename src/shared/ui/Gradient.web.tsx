import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Degradê linear vertical — versão WEB do `Gradient.tsx`.
 *
 * O Metro escolhe este arquivo só na web; o iPhone e o Android continuam com o
 * `Gradient.tsx`, intocado. Os dois têm a mesma assinatura, então quem usa
 * `<Gradient paradas=… />` não sabe qual está rodando.
 *
 * Por que existe: o `Gradient.tsx` usa `experimental_backgroundImage`, recurso
 * da nova arquitetura do React Native. O react-native-web descarta essa
 * propriedade em silêncio — e na web nenhum degradê do app aparecia: nem a
 * atmosfera do topo, nem o rodapé que protege o título. Aqui o mesmo degradê
 * vira o `background-image` do CSS, que o navegador desenha nativamente.
 */
export function Gradient({ paradas, style }: { paradas: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        // `backgroundImage` não existe no tipo do React Native: é CSS puro, e o
        // react-native-web o repassa ao navegador.
        { backgroundImage: `linear-gradient(to bottom, ${paradas})` } as ViewStyle,
        style,
      ]}
    />
  );
}
