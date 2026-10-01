import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors, useEstiloDaStatusBar } from '@/shared/theme/colors';
import { TopoDaTela } from '@/shared/ui/TopoDaTela';

import type { ResumoDoConhecimento, TemaNoConhecimento } from '../presentation/resumoDoConhecimento';

const FADE_MS = 200;
const MARGEM = 20;

type Props = {
  aberta: boolean;
  /** Já derivado do estado real pela composição (`obterResumoDoConhecimento`). */
  resumo: ResumoDoConhecimento;
  onFechar: () => void;
  /** A saída terminou e o mundo voltou à vista: é a hora de o mapa reenviar a cena. */
  onFechado: () => void;
};

/**
 * "Seu conhecimento": que tipo de conhecimento está moldando o mundo. Uma tela
 * secundária do Mundo, por cima dele — o mapa continua montado embaixo, com a
 * câmera onde estava.
 *
 * Um registro, não um painel: tema, quantas descobertas e uma frase. Sem
 * barras, sem limiares, sem ordenar pelo maior.
 */
export function KnowledgeScreen({ aberta, resumo, onFechar, onFechado }: Props) {
  const c = useColors();
  const estiloDaStatusBar = useEstiloDaStatusBar();
  const insets = useSafeAreaInsets();

  // Voltar do Android fecha a tela.
  useEffect(() => {
    if (!aberta) return;
    const assinatura = BackHandler.addEventListener('hardwareBackPress', () => {
      onFechar();
      return true;
    });
    return () => assinatura.remove();
  }, [aberta, onFechar]);

  if (!aberta) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(FADE_MS)}
      // o mapa ficou coberto: só depois que a tela some ele reenvia a cena
      // (veja "Por que o mapa voltava em branco" no ARCHITECTURE.md)
      exiting={FadeOut.duration(FADE_MS).withCallback((terminou) => {
        'worklet';
        if (terminou) runOnJS(onFechado)();
      })}
      accessibilityViewIsModal
      style={[StyleSheet.absoluteFill, styles.tela, { backgroundColor: c.fundoFeed }]}
    >
      <StatusBar style={estiloDaStatusBar} />
      <TopoDaTela titulo="Seu conhecimento" onVoltar={onFechar} />
      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.descobertas, { color: c.muted }]}>{resumo.descobertas}</Text>
        {resumo.temas.map((tema) => (
          <CartaoDoTema key={tema.tema} tema={tema} />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

/** Um tema: nome e afinidade na mesma linha, a frase embaixo. */
function CartaoDoTema({ tema }: { tema: TemaNoConhecimento }) {
  const c = useColors();
  return (
    <View
      accessible
      accessibilityLabel={`${tema.nome}, ${tema.afinidade}. ${tema.frase}`}
      style={[styles.cartao, { backgroundColor: c.cartao, borderColor: c.line }]}
    >
      <View style={styles.linha}>
        <Text style={[styles.nome, { color: c.ink }]}>{tema.nome}</Text>
        {/* o laranja só marca quem já mudou o mapa */}
        <Text style={[styles.numero, { color: tema.marcouOMundo ? c.accentLegivel : c.ink }]}>
          {tema.afinidade}
        </Text>
      </View>
      <Text style={[styles.frase, { color: c.muted }]}>{tema.frase}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Acima do mundo e da barra de ações, como a coleção de conquistas; abaixo da
  // apresentação e do banner de conquista.
  tela: { zIndex: 40 },
  conteudo: {
    paddingHorizontal: MARGEM,
    gap: 12,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  descobertas: { textAlign: 'center', fontSize: 14, paddingTop: 2, paddingBottom: 18, fontVariant: ['tabular-nums'] },
  cartao: { borderWidth: 1, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18, gap: 6 },
  linha: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  nome: { fontSize: 17, fontWeight: '700' },
  numero: { fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] },
  frase: { fontSize: 14, lineHeight: 20 },
});
