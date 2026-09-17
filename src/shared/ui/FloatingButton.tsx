import { Image, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';

import type { Icon } from './icons';

/** Tamanho e distância da borda, compartilhados com quem precisa desviar do botão. */
export const FLOATING_SIZE = 48;
export const FLOATING_MARGIN = 12;

type Props = {
  icon: Icon;
  corner: 'top-left' | 'bottom-left';
  accessibilityLabel: string;
  onPress: () => void;
};

/** Botão quadrado que flutua sobre o mapa, num canto, respeitando a safe area. */
export function FloatingButton({ icon, corner, accessibilityLabel, onPress }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const posicao =
    corner === 'top-left'
      ? { top: insets.top + FLOATING_MARGIN }
      : { bottom: insets.bottom + FLOATING_MARGIN };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.botao,
        posicao,
        { left: insets.left + FLOATING_MARGIN, backgroundColor: c.panel, borderColor: c.ink, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {typeof icon === 'string' ? (
        <Text style={[styles.texto, { color: c.ink }]}>{icon}</Text>
      ) : (
        <Image source={icon} style={styles.imagem} resizeMode="contain" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    position: 'absolute',
    width: FLOATING_SIZE,
    height: FLOATING_SIZE,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  texto: { fontSize: 24, lineHeight: 28 },
  imagem: { width: FLOATING_SIZE - 12, height: FLOATING_SIZE - 12 },
});
