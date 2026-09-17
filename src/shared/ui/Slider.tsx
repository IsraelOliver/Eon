import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useColors } from '@/shared/theme/colors';

const BOLINHA = 24;

type Props = {
  min: number;
  max: number;
  step: number;
  value: number;
  /** Chamado só ao soltar o dedo (ou num toque na trilha). */
  onRelease: (value: number) => void;
  accessibilityLabel: string;
};

/** Controle deslizante simples. Mostra o valor enquanto arrasta; avisa só ao soltar. */
export function Slider({ min, max, step, value, onRelease, accessibilityLabel }: Props) {
  const c = useColors();
  const [largura, setLargura] = useState(0);
  const [arrastando, setArrastando] = useState<number | null>(null);

  const casas = (String(step).split('.')[1] ?? '').length;
  const atual = arrastando ?? value;
  const fracao = (atual - min) / (max - min);

  // posição do dedo (px) → valor arredondado no passo
  const valorEm = (px: number) => {
    const t = Math.min(1, Math.max(0, (px - BOLINHA / 2) / Math.max(1, largura - BOLINHA)));
    return Number((min + Math.round((t * (max - min)) / step) * step).toFixed(casas));
  };

  const arrastar = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onUpdate((e) => setArrastando(valorEm(e.x)))
    .onEnd((e) => onRelease(valorEm(e.x)))
    .onFinalize(() => setArrastando(null));
  const tocar = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => onRelease(valorEm(e.x)));

  const ajustar = (delta: number) =>
    onRelease(Number(Math.min(max, Math.max(min, value + delta)).toFixed(casas)));

  return (
    <View style={styles.linha}>
      <GestureDetector gesture={Gesture.Exclusive(arrastar, tocar)}>
        <View
          style={styles.area}
          onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={accessibilityLabel}
          accessibilityValue={{ text: atual.toFixed(casas) }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => ajustar(e.nativeEvent.actionName === 'increment' ? step : -step)}
        >
          <View style={[styles.trilha, { backgroundColor: c.line }]} />
          <View
            style={[
              styles.bolinha,
              { left: fracao * Math.max(0, largura - BOLINHA), backgroundColor: c.panel, borderColor: c.ink },
            ]}
          />
        </View>
      </GestureDetector>
      <Text style={[styles.valor, { color: c.ink }]}>{atual.toFixed(casas)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  area: { flex: 1, height: 44, justifyContent: 'center' },
  trilha: { height: 6, borderRadius: 3, marginHorizontal: BOLINHA / 2 },
  bolinha: { position: 'absolute', width: BOLINHA, height: BOLINHA, borderRadius: BOLINHA / 2, borderWidth: 2 },
  valor: { width: 44, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
