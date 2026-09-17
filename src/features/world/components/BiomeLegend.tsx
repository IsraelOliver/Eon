import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/shared/theme/colors';

import type { ItemLegenda } from '../render/legend';

/** Legenda das cores do mapa, em duas colunas. */
export function BiomeLegend({ itens }: { itens: ItemLegenda[] }) {
  const c = useColors();
  return (
    <View style={styles.grade}>
      {itens.map((item) => (
        <View key={item.tipo} style={styles.item}>
          <View style={[styles.cor, { backgroundColor: item.cor, borderColor: c.ink }]} />
          <Text style={[styles.nome, { color: c.ink }]}>{item.nome}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grade: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 },
  item: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 6 },
  cor: { width: 14, height: 14, borderWidth: 1 },
  nome: { fontSize: 13, flexShrink: 1 },
});
