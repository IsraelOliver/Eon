import { Image, Platform, Pressable, StyleSheet, Text, View, type ImageStyle } from 'react-native';

import { useColors, useTemaEfetivo } from '@/shared/theme/colors';
import { ICONS } from '@/shared/ui/icons';

/** Altura da linha e lado da área da engrenagem: o mínimo de toque do iOS. */
const LINHA = 44;
/** A engrenagem em pixel art (22×22): nas telas 2x e 3x, cada pixel da arte cai inteiro. */
const TAMANHO_DA_ENGRENAGEM = 22;
/** Só na web, que não escolhe densidade: ampliar sem suavizar a pixel art. */
const PIXELADO =
  Platform.OS === 'web' ? ({ imageRendering: 'pixelated' } as unknown as ImageStyle) : null;

type Props = {
  /** A engrenagem é o único caminho para as Configurações. */
  onConfiguracoes?: () => void;
};

/**
 * A linha de navegação do header: Éon à esquerda, engrenagem à direita, na
 * mesma altura. Éon é a identidade da tela; a engrenagem, a navegação.
 */
export function TopBar({ onConfiguracoes }: Props) {
  const c = useColors();
  // O header pousa no fundo do tema: claro pede a engrenagem escura, e vice-versa.
  const engrenagem = useTemaEfetivo() === 'light' ? ICONS.gearEscura : ICONS.gear;

  return (
    <View style={styles.linha}>
      <Text style={[styles.nome, { color: c.ink }]} accessibilityRole="header" numberOfLines={1}>
        Éon
      </Text>

      {/* Sem círculo, sem borda, sem fundo: o ícone e mais nada. Encostado na
          margem direita, na mesma coluna do ícone do World Pulse. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir configurações"
        disabled={!onConfiguracoes}
        onPress={onConfiguracoes}
        hitSlop={12}
        style={({ pressed }) => [styles.engrenagem, pressed && styles.pressionado]}
      >
        {onConfiguracoes && (
          // Sprite colorido: desenhado como foi feito, sem tint.
          <Image source={engrenagem} style={[styles.icone, PIXELADO]} resizeMode="contain" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: LINHA },
  nome: { flexShrink: 1, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  engrenagem: { width: LINHA, height: LINHA, alignItems: 'flex-end', justifyContent: 'center' },
  pressionado: { opacity: 0.5 },
  icone: { width: TAMANHO_DA_ENGRENAGEM, height: TAMANHO_DA_ENGRENAGEM },
});
