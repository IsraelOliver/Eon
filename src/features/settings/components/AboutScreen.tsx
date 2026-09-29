import Constants from 'expo-constants';
import { useEffect } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';

import { TopoDaTela } from './TopoDaTela';

const FADE_MS = 200;

/** A versão do app, lida da configuração do Expo (`app.json` → `version`). */
const VERSAO = Constants.expoConfig?.version ?? '—';

type Props = {
  aberta: boolean;
  onFechar: () => void;
};

/**
 * "Sobre o Éon": o nome, o que o app é, a versão e os créditos. Abre por cima
 * de Configurações, e o "voltar" devolve a pessoa para lá.
 */
export function AboutScreen({ aberta, onFechar }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  // Registrado depois do de Configurações: o voltar do Android fecha esta primeiro.
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
      exiting={FadeOut.duration(FADE_MS)}
      accessibilityViewIsModal
      style={[StyleSheet.absoluteFill, { backgroundColor: c.fundoFeed }]}
    >
      <TopoDaTela titulo="Sobre o Éon" onVoltar={onFechar} />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.marca}>
          <Text style={[styles.nome, { color: c.ink }]}>Éon</Text>
          <Text style={[styles.versao, { color: c.muted }]}>Versão {VERSAO}</Text>
        </View>

        <Text style={[styles.texto, { color: c.ink }]}>
          Éon é um mundo que cresce com o que você aprende. Cada curiosidade descoberta vira
          parte da sua jornada — e ganha lugar no seu mapa.
        </Text>

        <View style={[styles.secao, { borderTopColor: c.line }]}>
          <Text style={[styles.rotulo, { color: c.muted }]} accessibilityRole="header">
            Créditos
          </Text>
          <Text style={[styles.texto, { color: c.ink }]}>
            Criado por Israel Barroso de Oliveira.
          </Text>
          <Text style={[styles.texto, { color: c.muted }]}>
            Feito com Expo, React Native e Skia.
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  marca: { alignItems: 'center', gap: 4 },
  nome: { fontSize: 40, fontWeight: '800', letterSpacing: 0.5 },
  versao: { fontSize: 14, fontVariant: ['tabular-nums'] },
  texto: { fontSize: 15, lineHeight: 22 },
  secao: { gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 20 },
  rotulo: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
});
