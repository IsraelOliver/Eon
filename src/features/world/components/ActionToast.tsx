import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';
import { FLOATING_MARGIN, FLOATING_SIZE } from '@/shared/ui/FloatingButton';

const VISIVEL_MS = 3000;
const FADE_MS = 250;

// Espaço lateral igual dos dois lados, para centralizar sem cobrir o botão de menu.
const LATERAL = FLOATING_MARGIN + FLOATING_SIZE + FLOATING_MARGIN;

type Props = {
  mensagem: string;
  /** Muda a cada ação; faz o aviso aparecer de novo mesmo com o mesmo texto. */
  id: number;
};

/** Aviso pequeno com a última ação, embaixo no centro, que some sozinho. */
export function ActionToast({ mensagem, id }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const opacidade = useSharedValue(0);

  useEffect(() => {
    opacidade.set(
      withSequence(
        withTiming(1, { duration: FADE_MS }),
        withDelay(VISIVEL_MS, withTiming(0, { duration: FADE_MS })),
      ),
    );
  }, [id, opacidade]);

  const estiloAnimado = useAnimatedStyle(() => ({ opacity: opacidade.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.faixa,
        { bottom: insets.bottom + FLOATING_MARGIN, left: insets.left + LATERAL, right: insets.right + LATERAL },
        estiloAnimado,
      ]}
    >
      <Text
        style={[styles.texto, { color: c.ink, backgroundColor: c.panel, borderColor: c.ink }]}
        accessibilityLiveRegion="polite"
        numberOfLines={3}
      >
        {mensagem}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  faixa: { position: 'absolute', minHeight: FLOATING_SIZE, alignItems: 'center', justifyContent: 'center' },
  texto: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
