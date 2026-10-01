import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';

/** Distância do canto, igual nas duas direções. */
const MARGEM = 16;

/**
 * O acesso a "Seu conhecimento", no topo do Mundo: discreto, para não brigar
 * com o mapa. Não é um destino da ActionBar — é uma tela secundária do Mundo.
 */
export function KnowledgeButton({ onPress }: { onPress: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Seu conhecimento"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.botao,
        { top: insets.top + 8, backgroundColor: c.panel, borderColor: c.line },
        pressed && styles.pressionado,
      ]}
    >
      <View style={[styles.ponto, { backgroundColor: c.accent }]} />
      <Text style={[styles.texto, { color: c.ink }]}>Seu conhecimento</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    position: 'absolute',
    left: MARGEM,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  ponto: { width: 6, height: 6, borderRadius: 3 },
  texto: { fontSize: 13, fontWeight: '600' },
  pressionado: { opacity: 0.6 },
});
