import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';

/** Largura da coluna do botão voltar; a direita repete, e o título fica no centro da tela. */
const CANTO = 44;

/** O topo das telas cheias de Configurações: ‹ à esquerda, título no centro. */
export function TopoDaTela({ titulo, onVoltar }: { titulo: string; onVoltar: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.topo, { paddingTop: insets.top + 6 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        onPress={onVoltar}
        hitSlop={12}
        style={({ pressed }) => [styles.canto, pressed && styles.pressionado]}
      >
        <Text style={[styles.voltar, { color: c.ink }]}>‹</Text>
      </Pressable>
      <Text style={[styles.titulo, { color: c.ink }]} accessibilityRole="header" numberOfLines={1}>
        {titulo}
      </Text>
      <View style={styles.canto} />
    </View>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8 },
  canto: { width: CANTO, alignItems: 'center', justifyContent: 'center' },
  voltar: { fontSize: 34, lineHeight: 38, fontWeight: '300' },
  titulo: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  pressionado: { opacity: 0.6 },
});
