import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';
import { ESPACO_ACTION_BAR } from '@/shared/ui/ActionBar';

import { NOMES_DE_TEMA } from '../engine/themes';
import type { Curiosity, CuriositySource, LearningResult } from '../engine/types';

type Props = {
  curiosidade: Curiosity;
  aprendida: boolean;
  onVoltar: () => void;
  /** Registra no perfil da sessão; quem decide se dá progresso é o engine. */
  onAprender: (curiosidade: Curiosity) => LearningResult;
  /**
   * Próxima etapa: levar ao mapa depois de aprender. Enquanto a composição não
   * passar esta ação, o feedback mostra só "Continuar".
   */
  onVerMundo?: () => void;
};

/** Leitura em tela cheia: sem barra de navegação, sem distração. */
export function CuriosityReader({ curiosidade, aprendida, onVoltar, onAprender, onVerMundo }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [acabouDeAprender, setAcabouDeAprender] = useState(false);

  const aprender = () => {
    const resultado = onAprender(curiosidade);
    if (resultado.status === 'aprendida') setAcabouDeAprender(true);
  };

  return (
    <View style={[styles.tela, { backgroundColor: c.fundoFeed, paddingTop: insets.top }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onVoltar} hitSlop={12} style={styles.voltar}>
        <Text style={[styles.voltarTexto, { color: c.ink }]}>← Voltar</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + ESPACO_ACTION_BAR + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.tema, { color: c.muted }]}>{NOMES_DE_TEMA[curiosidade.tema].toUpperCase()}</Text>
        <Text style={[styles.titulo, { color: c.ink }]}>{curiosidade.titulo}</Text>

        <View style={[styles.risco, { backgroundColor: c.line }]} />
        <Text style={[styles.texto, { color: c.ink }]}>{curiosidade.conteudo}</Text>
        <View style={[styles.risco, { backgroundColor: c.line }]} />

        <Text style={[styles.secao, { color: c.ink }]}>Fontes</Text>
        {curiosidade.fontes.map((fonte, i) => (
          <Fonte key={`${fonte.titulo}-${i}`} fonte={fonte} />
        ))}
        {curiosidade.verificadoEm && (
          <Text style={[styles.verificado, { color: c.muted }]}>Verificado em {curiosidade.verificadoEm}</Text>
        )}

        {acabouDeAprender ? (
          <View style={styles.feedback}>
            <Text style={[styles.feedbackTexto, { color: c.ink }]}>✓ Conhecimento adquirido.</Text>
            <View style={styles.acoes}>
              {onVerMundo && (
                <Pressable accessibilityRole="button" onPress={onVerMundo} style={[styles.botao, { borderColor: c.ink }]}>
                  <Text style={[styles.botaoTexto, { color: c.ink }]}>Ver no mundo</Text>
                </Pressable>
              )}
              <Pressable accessibilityRole="button" onPress={onVoltar} style={[styles.botao, { borderColor: c.ink }]}>
                <Text style={[styles.botaoTexto, { color: c.ink }]}>Continuar aprendendo</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: aprendida }}
            disabled={aprendida}
            onPress={aprender}
            style={({ pressed }) => [
              styles.principal,
              { backgroundColor: aprendida ? c.line : c.ink, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.principalTexto, { color: aprendida ? c.muted : c.cartao }]}>
              {aprendida ? 'APRENDIDA' : 'APRENDI'}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function Fonte({ fonte }: { fonte: CuriositySource }) {
  const c = useColors();
  const abrir = fonte.url ? () => Linking.openURL(fonte.url as string) : undefined;
  return (
    <Pressable accessibilityRole={abrir ? 'link' : 'text'} disabled={!abrir} onPress={abrir} style={styles.fonte}>
      <Text style={[styles.fonteTitulo, { color: c.ink }]}>
        {fonte.titulo}
        {fonte.url ? ' ↗' : ''}
      </Text>
      {fonte.autor && <Text style={[styles.fonteAutor, { color: c.muted }]}>{fonte.autor}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tela: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 },
  voltar: { paddingHorizontal: 20, paddingVertical: 12 },
  voltarTexto: { fontSize: 16, fontWeight: '600' },
  conteudo: { paddingHorizontal: 20, gap: 14, maxWidth: 680, width: '100%', alignSelf: 'center' },
  tema: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  titulo: { fontSize: 30, fontWeight: '700', lineHeight: 38 },
  risco: { height: 1, marginVertical: 6 },
  texto: { fontSize: 17, lineHeight: 27 },
  secao: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  fonte: { gap: 2 },
  fonteTitulo: { fontSize: 15, fontWeight: '600' },
  fonteAutor: { fontSize: 13 },
  verificado: { fontSize: 13, marginTop: 4 },
  principal: { marginTop: 24, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  principalTexto: { fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  feedback: { marginTop: 24, gap: 12 },
  feedbackTexto: { fontSize: 17, fontWeight: '600' },
  acoes: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  botao: { borderWidth: 2, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, flexGrow: 1, alignItems: 'center' },
  botaoTexto: { fontSize: 15, fontWeight: '600' },
});
