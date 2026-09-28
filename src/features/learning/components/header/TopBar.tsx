import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/shared/theme/colors';
import { MARCA } from '@/shared/theme/marca';
import { ICONS } from '@/shared/ui/icons';

/**
 * Largura das duas pontas. Iguais de propósito: é isso que deixa o nome no
 * centro da TELA, e não no centro do espaço que sobrou.
 */
const CANTO = 44;

type Props = {
  /** A engrenagem é o único caminho para as Configurações. */
  onConfiguracoes?: () => void;
  /**
   * Sobre a atmosfera de uma foto, o nome e a engrenagem ficam brancos: a
   * atmosfera é escurecida justamente para isso. Sem foto atrás, seguem a tinta
   * da paleta.
   */
  sobreAFoto?: boolean;
};

/** Branco sobre a atmosfera: ela é escurecida até o contraste passar de 7:1. */
const BRANCO = MARCA.branco;

/** A linha do nome: espaço vazio, Éon, engrenagem — nesta ordem, uma linha só. */
export function TopBar({ onConfiguracoes, sobreAFoto = false }: Props) {
  const c = useColors();
  const tinta = sobreAFoto ? BRANCO : c.ink;

  return (
    <View style={styles.linha}>
      <View style={styles.canto} />

      <Text style={[styles.nome, { color: tinta }]} numberOfLines={1}>
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
          <Text style={[styles.icone, { color: tinta }]}>{ICONS.gear}</Text>
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
