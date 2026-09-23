import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';

const FADE_MS = 260;
const VISIVEL_MS = 3200;
const MARGEM = 12;

type Props = {
  titulo: string;
  subtitulo: string;
  /** Muda a cada novidade. É ele que faz o aviso aparecer. */
  id: number;
};

/**
 * Anuncia o que acabou de nascer no mundo.
 *
 * Some sozinho pela própria animação — sem `setTimeout`, então não há timer
 * para limpar. Não recebe toque: o jogador continua navegando enquanto lê.
 */
export function GrowthBanner({ titulo, subtitulo, id }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const opacidade = useSharedValue(0);
  const subida = useSharedValue(8);

  useEffect(() => {
    if (id === 0) return; // ainda não houve novidade nenhuma
    opacidade.set(
      withSequence(
        withTiming(1, { duration: FADE_MS }),
        withDelay(VISIVEL_MS, withTiming(0, { duration: FADE_MS })),
      ),
    );
    subida.set(withSequence(withTiming(0, { duration: FADE_MS }), withDelay(VISIVEL_MS, withTiming(8))));
  }, [id, opacidade, subida]);

  const animado = useAnimatedStyle(() => ({
    opacity: opacidade.value,
    transform: [{ translateY: subida.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.faixa,
        { top: insets.top + MARGEM, backgroundColor: c.panel, borderColor: c.line },
        animado,
      ]}
    >
      <Text style={[styles.titulo, { color: c.ink }]}>{titulo}</Text>
      <Text style={[styles.subtitulo, { color: c.muted }]}>{subtitulo}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  faixa: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxWidth: 420,
    alignSelf: 'center',
    gap: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    // Acima do mapa e da barra, abaixo das janelas e da apresentação.
    zIndex: 25,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  titulo: { fontSize: 16, fontWeight: '700' },
  subtitulo: { fontSize: 14, lineHeight: 19 },
});
