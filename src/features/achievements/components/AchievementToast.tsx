import { useEffect } from 'react';
import { AccessibilityInfo, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { comAlfa, OURO_DE_CONQUISTA } from '@/shared/theme/cor';
import { useColors } from '@/shared/theme/colors';

import { CONQUISTAS } from '../data/achievements';
import type { Anuncio } from '../engine/estado';

const ENTRADA_MS = 460;
const VISIVEL_MS = 3400;
const SAIDA_MS = 340;
/** Folga acima do topo seguro quando o banner está parado. */
const MARGEM = 8;
/** O suficiente para o banner inteiro começar escondido acima da tela. */
const FORA_DA_TELA = 180;
/** A arte em pontos: 64 × a densidade = exatamente o arquivo @Nx, pixel por pixel. */
const ARTE = 64;

type Props = {
  anuncio: Anuncio | null;
  /** O banner terminou de sair: a composição tira este anúncio da fila. */
  onFim: (serie: number) => void;
};

/**
 * Banner global de conquista: desce do topo, fica um pouco e sobe.
 *
 * Fica **acima de qualquer tela** porque a composição o desenha por último, na
 * raiz — e o app não tem `Modal` nativo, então nada abre numa janela à parte
 * que pudesse cobri-lo.
 *
 * Não recebe toque: quem estava lendo, rolando ou mexendo no mapa continua, sem
 * precisar fechar nada.
 */
export function AchievementToast({ anuncio, onFim }: Props) {
  if (!anuncio) return null;
  // `key` por anúncio: cada conquista monta um banner novo, e a animação é só
  // "do nascimento ao fim" — sem estado de reinício para gerenciar.
  return <Faixa key={anuncio.serie} anuncio={anuncio} onFim={onFim} />;
}

function Faixa({ anuncio, onFim }: { anuncio: Anuncio; onFim: (serie: number) => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const conquista = CONQUISTAS[anuncio.id];
  const deslocamento = useSharedValue(-(insets.top + FORA_DA_TELA));

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`Nova conquista: ${conquista.titulo}`);

    const fora = -(insets.top + FORA_DA_TELA);
    const serie = anuncio.serie;
    /*
     * Tudo numa sequência só, na UI thread: entra, espera, sai, avisa. Sem
     * `setTimeout` — não há timer para limpar, e se o banner for desmontado no
     * meio (jornada recomeçada) a animação é cancelada e o fim nunca dispara.
     */
    deslocamento.set(
      withSequence(
        withTiming(0, { duration: ENTRADA_MS, easing: Easing.out(Easing.back(1.1)) }),
        withDelay(
          VISIVEL_MS,
          withTiming(fora, { duration: SAIDA_MS, easing: Easing.in(Easing.cubic) }, (terminou) => {
            'worklet';
            if (terminou) runOnJS(onFim)(serie);
          }),
        ),
      ),
    );
  }, [anuncio.serie, conquista.titulo, deslocamento, insets.top, onFim]);

  const movimento = useAnimatedStyle(() => ({
    transform: [{ translateY: deslocamento.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityRole="alert"
      style={[styles.faixa, { top: insets.top + MARGEM }, movimento]}
    >
      <View
        style={[
          styles.cartao,
          { backgroundColor: c.panel, borderColor: comAlfa(OURO_DE_CONQUISTA, 0.55) },
        ]}
      >
        {/* Recorte arredondado, como uma miniatura. A arte é exibida no tamanho
            exato do arquivo da densidade do aparelho: nada é esticado. */}
        <View style={[styles.moldura, { borderColor: comAlfa(OURO_DE_CONQUISTA, 0.4) }]}>
          <Image source={conquista.imagem} style={styles.arte} />
        </View>

        <View style={styles.textos}>
          <Text style={[styles.rotulo, { color: OURO_DE_CONQUISTA }]}>✦  NOVA CONQUISTA</Text>
          <Text style={[styles.titulo, { color: c.ink }]} numberOfLines={1}>
            {conquista.titulo}
          </Text>
          <Text style={[styles.descricao, { color: c.muted }]} numberOfLines={2}>
            {conquista.descricao}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  faixa: {
    position: 'absolute',
    left: 12,
    right: 12,
    alignItems: 'center',
    // Acima de tudo: mundo, aparelho, configurações e apresentação.
    zIndex: 1000,
    elevation: 24,
  },
  cartao: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    paddingRight: 16,
    borderRadius: 24,
    borderWidth: 1,
    // Um brilho dourado curto por baixo: recompensa, não alerta.
    shadowColor: OURO_DE_CONQUISTA,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  // A borda fica POR FORA da arte: no React Native ela come a largura por dentro,
  // e uma moldura de 64 cortaria um pixel de cada lado da imagem.
  moldura: {
    width: ARTE + 2,
    height: ARTE + 2,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  arte: { width: ARTE, height: ARTE },
  textos: { flex: 1, gap: 2 },
  rotulo: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  titulo: { fontSize: 19, fontWeight: '800', letterSpacing: -0.2 },
  descricao: { fontSize: 13, lineHeight: 17 },
});
