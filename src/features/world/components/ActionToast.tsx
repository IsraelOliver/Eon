import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';
import { ESPACO_ACTION_BAR } from '@/shared/ui/ActionBar';

const FADE_MS = 250;

const MARGEM = 12;
/** Espaço lateral igual dos dois lados, para o aviso ficar centralizado e estreito. */
const LATERAL = 72;

type Props = {
  mensagem: string;
  /** Muda a cada ação; faz o aviso aparecer de novo mesmo com o mesmo texto. */
  id: number;
  /** Na altura dos botões de cima (engrenagem) ou de baixo (menu). */
  position?: 'top' | 'bottom';
  /** Quanto tempo o aviso fica visível, em ms. */
  duration?: number;
};

/** Aviso pequeno e centralizado que some sozinho. Fica acima das janelas. */
export function ActionToast({ mensagem, id, position = 'bottom', duration = 3000 }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const opacidade = useSharedValue(0);

  useEffect(() => {
    if (!mensagem) return; // nada para mostrar (ex.: nenhum aviso ainda)
    opacidade.set(
      withSequence(
        withTiming(1, { duration: FADE_MS }),
        withDelay(duration, withTiming(0, { duration: FADE_MS })),
      ),
    );
  }, [id, mensagem, duration, opacidade]);

  const estiloAnimado = useAnimatedStyle(() => ({ opacity: opacidade.value }));
  // Embaixo, o aviso fica acima da barra de ações.
  const vertical =
    position === 'top'
      ? { top: insets.top + MARGEM }
      : { bottom: insets.bottom + ESPACO_ACTION_BAR + MARGEM };

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.faixa,
        vertical,
        { left: insets.left + LATERAL, right: insets.right + LATERAL },
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
  faixa: {
    position: 'absolute',
    zIndex: 20, // acima das janelas (Window usa 10)
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
