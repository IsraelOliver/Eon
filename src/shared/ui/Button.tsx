import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '@/shared/theme/colors';

type Props = {
  label: string;
  onPress: () => void;
  /** Cor da borda (padrão: cor do texto). */
  color?: string;
  /** Quadradinho colorido à esquerda. */
  swatch?: string;
  /** Valor curto à direita, como um contador. */
  badge?: string | number;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, color, swatch, badge, style }: Props) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { borderColor: color ?? c.ink, backgroundColor: pressed ? c.pressed : 'transparent' },
        style,
      ]}
    >
      {swatch && <View style={[styles.swatch, { backgroundColor: swatch }]} />}
      <Text style={[styles.label, { color: c.ink }]}>{label}</Text>
      {badge !== undefined && <Text style={[styles.badge, { color: c.ink }]}>{badge}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  swatch: { width: 10, height: 10 },
  label: { flex: 1, fontSize: 15 },
  badge: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
