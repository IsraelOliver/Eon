import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';
import { ESPACO_ACTION_BAR } from '@/shared/ui/ActionBar';

import type { Aprendizado } from '../hooks/useLearning';
import type { Curiosity, CuriosityId, LearningResult } from '../engine/types';
import { CuriosityCard } from './CuriosityCard';
import { CuriosityReader } from './CuriosityReader';

type Props = {
  /** Estado de aprendizagem, criado pela composição (o save precisa dele). */
  aprendizado: Aprendizado;
  /** Avisa quem contém a tela quando a leitura abre ou fecha (o ✕ some durante a leitura). */
  onLeitura?: (lendo: boolean) => void;
  /**
   * Conhecimento NOVO acabou de ser registrado. Só dispara em `'aprendida'` —
   * quem decide o que é repetição é o engine de learning.
   * A composição usa isso para fazer o mundo crescer; `learning` não conhece o mundo.
   */
  onAprendido?: (resultado: LearningResult) => void;
  /** Mostra "Ver no mundo" no fim da leitura. */
  onVerMundo?: () => void;
};

/** Aba Aprender: o feed e, por cima dele, a leitura em tela cheia. */
export function LearningScreen({ aprendizado, onLeitura, onAprendido, onVerMundo }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [abertaId, setAbertaId] = useState<CuriosityId | null>(null);

  const aberta = aprendizado.curiosidades.find((cu) => cu.id === abertaId) ?? null;
  useEffect(() => onLeitura?.(aberta !== null), [aberta, onLeitura]);

  // O engine registra; aqui só avisamos quem ligou, e só quando houve progresso.
  const aprender = (curiosidade: Curiosity): LearningResult => {
    const resultado = aprendizado.aprender(curiosidade);
    if (resultado.status === 'aprendida') onAprendido?.(resultado);
    return resultado;
  };

  // Ao ir ver o mundo, o aparelho fecha e a leitura volta para o feed.
  const verMundo = onVerMundo
    ? () => {
        setAbertaId(null);
        onVerMundo();
      }
    : undefined;

  return (
    <View style={[styles.tela, { backgroundColor: c.fundoFeed }]}>
      <ScrollView
        contentContainerStyle={[
          styles.conteudo,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + ESPACO_ACTION_BAR + 12 },
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
          onAprender={aprender}
          onVerMundo={verMundo}
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
