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
  /**
   * 'primary': a ação principal — laranja da marca, escurece ao pressionar.
   * 'default': secundária — só borda, sobre a superfície.
   * 'destructive': ação que apaga coisas — o vermelho de perigo, nunca o laranja.
   */
  variant?: 'default' | 'primary' | 'destructive';
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, color, swatch, badge, variant = 'default', style }: Props) {
  const c = useColors();
  const destrutivo = variant === 'destructive';
  const primario = variant === 'primary';
  const corDoTexto = destrutivo ? c.perigoTexto : primario ? c.accentTexto : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        destrutivo
          ? { borderColor: c.perigo, backgroundColor: c.perigo, opacity: pressed ? 0.8 : 1 }
          : primario
            ? {
                borderColor: pressed ? c.accentStrong : c.accent,
                backgroundColor: pressed ? c.accentStrong : c.accent,
              }
            : { borderColor: color ?? c.line, backgroundColor: pressed ? c.pressed : 'transparent' },
        style,
      ]}
    >
      {swatch && <View style={[styles.swatch, { backgroundColor: swatch }]} />}
      <Text style={[styles.label, { color: corDoTexto }]}>{label}</Text>
      {badge !== undefined && <Text style={[styles.badge, { color: corDoTexto }]}>{badge}</Text>}
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
