import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Degradê linear vertical — ÚNICO lugar que sabe como o React Native desenha um
 * degradê.
 *
 * Usa `experimental_backgroundImage` (React Native 0.86, nova arquitetura) em vez
 * de uma biblioteca nova. Se um dia isso mudar de nome ou virar `expo-linear-gradient`,
 * só este arquivo muda.
 *
 * `paradas` é o miolo do CSS, sem a direção. Exemplo:
 *   'rgba(0,0,0,0) 40%, rgba(0,0,0,0.9) 100%'
 */
export function Gradient({ paradas, style }: { paradas: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { experimental_backgroundImage: `linear-gradient(to bottom, ${paradas})` }, style]}
    />
  );
}
