import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';
import { ALTURA_TAB_BAR, MARGEM_TAB_BAR } from '@/shared/ui/TabBar';

import { useLearning } from '../hooks/useLearning';
import type { CuriosityId } from '../engine/types';
import { CuriosityCard } from './CuriosityCard';
import { CuriosityReader } from './CuriosityReader';

type Props = {
  /** Avisa a composição quando a leitura abre ou fecha (a barra some durante a leitura). */
  onLeitura?: (lendo: boolean) => void;
};

/** Aba Aprender: o feed e, por cima dele, a leitura em tela cheia. */
export function LearningScreen({ onLeitura }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const aprendizado = useLearning();
  const [abertaId, setAbertaId] = useState<CuriosityId | null>(null);

  const aberta = aprendizado.curiosidades.find((cu) => cu.id === abertaId) ?? null;
  useEffect(() => onLeitura?.(aberta !== null), [aberta, onLeitura]);

  return (
    <View style={[styles.tela, { backgroundColor: c.fundoFeed }]}>
      <ScrollView
        contentContainerStyle={[
          styles.conteudo,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + ALTURA_TAB_BAR + MARGEM_TAB_BAR * 2 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cabecalho}>
          <Text style={[styles.titulo, { color: c.ink }]}>Aprender</Text>
          <Text style={[styles.subtitulo, { color: c.muted }]}>Descubra algo novo.</Text>
        </View>

        {aprendizado.curiosidades.map((curiosidade) => (
          <CuriosityCard
            key={curiosidade.id}
            curiosidade={curiosidade}
            aprendida={aprendizado.jaAprendeu(curiosidade.id)}
            onLer={() => setAbertaId(curiosidade.id)}
          />
        ))}
      </ScrollView>

      {aberta && (
        <CuriosityReader
          curiosidade={aberta}
          aprendida={aprendizado.jaAprendeu(aberta.id)}
          onVoltar={() => setAbertaId(null)}
          onAprender={aprendizado.aprender}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  // gap generoso: um pôster por vez, com ar entre eles.
  conteudo: { paddingHorizontal: 18, gap: 22, maxWidth: 680, width: '100%', alignSelf: 'center' },
  cabecalho: { gap: 4, paddingHorizontal: 2, marginBottom: 2 },
  titulo: { fontSize: 36, fontWeight: '700', letterSpacing: -0.5 },
  subtitulo: { fontSize: 16 },
});
