import { useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';

import { NOMES_DE_TEMA } from '../engine/themes';
import type { Curiosity, CuriositySource, LearningResult } from '../engine/types';

/** Abrir e recolher o "Aprofundar": curto, só para a mudança não ser um salto. */
const EXPANDIR_MS = 220;
const transicao = LinearTransition.duration(EXPANDIR_MS);

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

/** Parágrafos do texto do catálogo: separados por uma linha em branco. */
function paragrafos(texto: string): string[] {
  return texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Leitura em tela cheia, em duas camadas: o resumo ("Em poucas palavras") à
 * vista, e o texto completo recolhido atrás de "Aprofundar". Sem barra de
 * navegação, sem distração — a composição esconde a ActionBar enquanto ela está
 * aberta.
 *
 *   tema · título
 *   Em poucas palavras        `resumo`, ou o `preview` quando não há resumo
 *   Aprofundar ↓              abre o `conteudo` aqui mesmo (Recolher ↑)
 *   O que fica dessa descoberta   `pontosPrincipais`, só se existirem
 *   Fontes e verificação
 *   Registrar descoberta      o mesmo aprender de sempre
 *
 * Só apresentação: registrar continua sendo `onAprender`, exatamente como antes.
 */
export function CuriosityReader({ curiosidade, aprendida, onVoltar, onAprender, onVerMundo }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [acabouDeAprender, setAcabouDeAprender] = useState(false);
  /** Toda curiosidade abre com o texto completo recolhido. */
  const [aprofundada, setAprofundada] = useState(false);

  const aprender = () => {
    const resultado = onAprender(curiosidade);
    if (resultado.status === 'aprendida') setAcabouDeAprender(true);
  };

  const resumo = curiosidade.resumo ?? curiosidade.preview;
  const pontos = curiosidade.pontosPrincipais ?? [];

  return (
    <View style={[styles.tela, { backgroundColor: c.fundoFeed, paddingTop: insets.top }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onVoltar} hitSlop={12} style={styles.voltar}>
        <Text style={[styles.voltarTexto, { color: c.ink }]}>← Voltar</Text>
      </Pressable>

      <ScrollView
        // Sem a ActionBar na leitura: o fim do texto só precisa da safe area.
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cabeca}>
          <Text style={[styles.tema, { color: c.muted }]}>{NOMES_DE_TEMA[curiosidade.tema].toUpperCase()}</Text>
          <Text style={[styles.titulo, { color: c.ink }]}>{curiosidade.titulo}</Text>
        </View>

        <Secao titulo="Em poucas palavras">
          {paragrafos(resumo).map((p, i) => (
            <Text key={i} style={[styles.resumo, { color: c.ink }]}>
              {p}
            </Text>
          ))}
        </Secao>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: aprofundada }}
          accessibilityLabel={aprofundada ? 'Recolher o texto completo' : 'Aprofundar: ler o texto completo'}
          onPress={() => setAprofundada((a) => !a)}
          hitSlop={8}
          style={({ pressed }) => [
            styles.aprofundar,
            { borderColor: c.line, backgroundColor: pressed ? c.pressed : 'transparent' },
          ]}
        >
          <Text style={[styles.aprofundarTexto, { color: c.ink }]}>
            {aprofundada ? 'Recolher ↑' : 'Aprofundar ↓'}
          </Text>
        </Pressable>

        {aprofundada && (
          <Animated.View
            entering={FadeIn.duration(EXPANDIR_MS)}
            exiting={FadeOut.duration(EXPANDIR_MS / 2)}
            style={styles.blocoTexto}
          >
            {paragrafos(curiosidade.conteudo).map((p, i) => (
              <Text key={i} style={[styles.texto, { color: c.ink }]}>
                {p}
              </Text>
            ))}
          </Animated.View>
        )}

        {/* O resto desce (ou sobe) junto com o texto, em vez de pular. */}
        <Animated.View layout={transicao} style={styles.resto}>
          {pontos.length > 0 && (
            <Secao titulo="O que fica dessa descoberta" separada>
              {pontos.map((ponto, i) => (
                <View key={i} style={styles.ponto}>
                  {/* O laranja como destaque, e só aqui: um ponto pequeno. */}
                  <View style={[styles.marcador, { backgroundColor: c.accent }]} />
                  <Text style={[styles.pontoTexto, { color: c.ink }]}>{ponto}</Text>
                </View>
              ))}
            </Secao>
          )}

          <Secao titulo="Fontes e verificação" separada discreta>
            {curiosidade.fontes.map((fonte, i) => (
              <Fonte key={`${fonte.titulo}-${i}`} fonte={fonte} />
            ))}
            {curiosidade.verificadoEm && (
              <Text style={[styles.verificado, { color: c.muted }]}>Verificado em {curiosidade.verificadoEm}</Text>
            )}
          </Secao>

          {acabouDeAprender ? (
            <View style={styles.feedback}>
              <Text style={[styles.feedbackTexto, { color: c.ink }]}>✓ Descoberta registrada.</Text>
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
                // A ação que faz o mundo crescer: o laranja da marca. Já registrada,
                // vira estado desabilitado — derivado por alpha, sem cor nova.
                { backgroundColor: aprendida ? c.line : pressed ? c.accentStrong : c.accent },
              ]}
            >
              <Text style={[styles.principalTexto, { color: aprendida ? c.muted : c.accentTexto }]}>
                {aprendida ? 'Descoberta registrada' : 'Registrar descoberta'}
              </Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/** Uma seção da leitura: rótulo pequeno e o conteúdo. `separada` = fio fino acima. */
function Secao({
  titulo, separada = false, discreta = false, children,
}: { titulo: string; separada?: boolean; discreta?: boolean; children: ReactNode }) {
  const c = useColors();
  return (
    <View style={[styles.secao, separada && [styles.separada, { borderTopColor: c.line }]]}>
      <Text
        accessibilityRole="header"
        style={[styles.rotulo, discreta && styles.rotuloDiscreto, { color: c.muted }]}
      >
        {titulo.toUpperCase()}
      </Text>
      {children}
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
  conteudo: { paddingHorizontal: 24, paddingTop: 8, gap: 28, maxWidth: 680, width: '100%', alignSelf: 'center' },
  cabeca: { gap: 10 },
  tema: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  titulo: { fontSize: 30, fontWeight: '700', lineHeight: 38 },
  secao: { gap: 12 },
  separada: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 24 },
  rotulo: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  rotuloDiscreto: { fontSize: 11 },
  resumo: { fontSize: 19, lineHeight: 30 },
  aprofundar: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  aprofundarTexto: { fontSize: 15, fontWeight: '600' },
  blocoTexto: { gap: 18 },
  texto: { fontSize: 17, lineHeight: 28 },
  resto: { gap: 28 },
  ponto: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  // Alinhado com o meio da primeira linha (lineHeight 25).
  marcador: { width: 6, height: 6, borderRadius: 3, marginTop: 10 },
  pontoTexto: { flex: 1, fontSize: 16, lineHeight: 25 },
  fonte: { gap: 2 },
  fonteTitulo: { fontSize: 14, fontWeight: '600' },
  fonteAutor: { fontSize: 13 },
  verificado: { fontSize: 13, marginTop: 2 },
  principal: { marginTop: 8, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  principalTexto: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  feedback: { marginTop: 8, gap: 12 },
  feedbackTexto: { fontSize: 17, fontWeight: '600' },
  acoes: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  botao: { borderWidth: 2, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, flexGrow: 1, alignItems: 'center' },
  botaoTexto: { fontSize: 15, fontWeight: '600' },
});
