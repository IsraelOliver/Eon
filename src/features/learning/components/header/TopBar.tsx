import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/shared/theme/colors';
import { ICONS } from '@/shared/ui/icons';

/**
 * Largura das duas pontas. Iguais de propósito: é isso que deixa o nome no
 * centro da TELA, e não no centro do espaço que sobrou.
 */
const CANTO = 44;

type Props = {
  /** A engrenagem é o único caminho para as Configurações. */
  onConfiguracoes?: () => void;
};

/** A linha do nome: espaço vazio, Éon, engrenagem — nesta ordem, uma linha só. */
export function TopBar({ onConfiguracoes }: Props) {
  const c = useColors();

  return (
    <View style={styles.linha}>
      <View style={styles.canto} />

      <Text style={[styles.nome, { color: c.ink }]} numberOfLines={1}>
        Éon
      </Text>

      {/* Sem círculo, sem borda, sem fundo: o ícone e mais nada. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir configurações"
        disabled={!onConfiguracoes}
        onPress={onConfiguracoes}
        hitSlop={12}
        style={({ pressed }) => [styles.canto, styles.engrenagem, pressed && styles.pressionado]}
      >
        {onConfiguracoes && (
          <Text style={[styles.icone, { color: c.ink }]}>{ICONS.gear}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 40 },
  canto: { width: CANTO },
  engrenagem: { alignItems: 'flex-end', justifyContent: 'center', alignSelf: 'stretch' },
  pressionado: { opacity: 0.5 },
  nome: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', letterSpacing: 0.5 },
  // Um pouco maior que o texto de apoio, ainda sem moldura: só o ícone.
  icone: { fontSize: 23, lineHeight: 27 },
});
