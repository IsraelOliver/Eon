import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors, useEstiloDaStatusBar, type ThemePreference } from '@/shared/theme/colors';
import { Button } from '@/shared/ui/Button';
import { TopoDaTela } from '@/shared/ui/TopoDaTela';
import { Window } from '@/shared/ui/Window';

import { AboutScreen } from './AboutScreen';

const FADE_MS = 200;
const MARGEM = 20;

type Props = {
  /** Quem abre é a engrenagem do Discovery, na composição. */
  aberto: boolean;
  onFechar: () => void;
  /**
   * Gerar outro mundo mantendo o resto. Só existe **antes** da primeira
   * curiosidade aprendida: depois disso o mundo é a jornada da pessoa, e a
   * composição deixa de passar esta ação.
   */
  onNovoMundo?: () => void;
  /** Apaga mundo e conhecimento juntos, e começa outra jornada. */
  onRecomecarJornada: () => void;
  /**
   * Abre a coleção de conquistas POR CIMA desta tela. Configurações só
   * DISPARA: quem sabe o que são conquistas e qual tela abrir é a composição.
   */
  onConquistas: () => void;
  /** Progresso já em texto ("1/1"), montado pela composição. */
  resumoDasConquistas: string;
  /** A aparência escolhida. É do APP, não da jornada: recomeçar não a muda. */
  aparencia: ThemePreference;
  /** Configurações só dispara: quem aplica e grava é a composição. */
  onAparencia: (aparencia: ThemePreference) => void;
  devAtivo: boolean;
  /** Cada toque no enfeite do rodapé (5 seguidos alternam o modo desenvolvedor). */
  onToqueSecreto: () => void;
  /** Conteúdo da seção "Desenvolvedor", mostrado só com o modo ativo. */
  ferramentasDev: ReactNode;
};

/** Automático primeiro: é o padrão, e o que a maioria deve usar. */
const OPCOES_DE_APARENCIA: readonly { valor: ThemePreference; rotulo: string }[] = [
  { valor: 'system', rotulo: 'Automático' },
  { valor: 'light', rotulo: 'Claro' },
  { valor: 'dark', rotulo: 'Escuro' },
];

/**
 * A tela "Configurações": tela cheia, com o próprio "voltar" no topo.
 *
 * Poucas caixas e bastante respiro: as opções do dia a dia em cima, separadas
 * só por fios; a zona de perigo no fim, longe delas. A confirmação de
 * recomeçar é uma janela por cima da tela — o único diálogo que sobrou.
 */
export function SettingsMenu({
  aberto, onFechar, onNovoMundo, onRecomecarJornada, onConquistas, resumoDasConquistas,
  aparencia, onAparencia, devAtivo, onToqueSecreto, ferramentasDev,
}: Props) {
  const c = useColors();
  const estiloDaStatusBar = useEstiloDaStatusBar();
  const insets = useSafeAreaInsets();
  const [confirmando, setConfirmando] = useState(false);
  const [sobreAberto, setSobreAberto] = useState(false);

  // Fechar e reabrir a tela nunca deve cair direto na confirmação nem no "Sobre".
  useEffect(() => {
    if (aberto) return;
    setConfirmando(false);
    setSobreAberto(false);
  }, [aberto]);

  // Voltar do Android fecha a tela. A confirmação e a coleção, quando abertas,
  // registram o próprio voltar depois deste — e por isso são atendidas antes.
  useEffect(() => {
    if (!aberto) return;
    const assinatura = BackHandler.addEventListener('hardwareBackPress', () => {
      onFechar();
      return true;
    });
    return () => assinatura.remove();
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(FADE_MS)}
      exiting={FadeOut.duration(FADE_MS)}
      accessibilityViewIsModal
      style={[StyleSheet.absoluteFill, styles.tela, { backgroundColor: c.fundoFeed }]}
    >
      {/* Aberta sobre o feed, que pode ter pedido ícones claros para a foto. */}
      <StatusBar style={estiloDaStatusBar} />
      <TopoDaTela titulo="Configurações" onVoltar={onFechar} />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Coisa do dia a dia, então vem primeiro. A coleção abre POR CIMA
            desta tela: o "voltar" dela devolve a pessoa para cá. */}
        <LinhaDeNavegacao rotulo="Conquistas" resumo={resumoDasConquistas} onPress={onConquistas} />

        <View style={styles.grupo}>
          <Text style={[styles.opcao, { color: c.ink }]} accessibilityRole="header">
            Aparência
          </Text>
          {/* Troca na hora, com a tela aberta: nada de reiniciar. */}
          <View accessibilityRole="radiogroup" style={[styles.segmentos, { borderColor: c.line }]}>
            {OPCOES_DE_APARENCIA.map((opcao) => {
              const escolhida = opcao.valor === aparencia;
              return (
                <Pressable
                  key={opcao.valor}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: escolhida }}
                  onPress={() => onAparencia(opcao.valor)}
                  style={({ pressed }) => [
                    styles.segmento,
                    escolhida
                      ? { backgroundColor: c.accent }
                      : pressed && { backgroundColor: c.pressed },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentoTexto,
                      { color: escolhida ? c.accentTexto : c.ink },
                      escolhida && styles.segmentoEscolhido,
                    ]}
                  >
                    {opcao.rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.depoisDaAparencia}>
          <LinhaDeNavegacao rotulo="Sobre o Éon" onPress={() => setSobreAberto(true)} />
        </View>

        {onNovoMundo && (
          <Button
            label="Novo mundo"
            onPress={() => {
              onFechar();
              onNovoMundo();
            }}
            style={styles.novoMundo}
          />
        )}

        {devAtivo && (
          <View style={[styles.secao, { borderTopColor: c.line }]}>
            <Text style={[styles.rotulo, { color: c.muted }]} accessibilityRole="header">
              Desenvolvedor
            </Text>
            {ferramentasDev}
          </View>
        )}

        {/* Empurra a zona de perigo para o fim, mesmo com pouco conteúdo acima. */}
        <View style={styles.respiro} />

        {/* Longe dos controles do dia a dia, para ninguém tocar sem querer. */}
        {!onNovoMundo && (
          <View style={[styles.secao, { borderTopColor: c.line }]}>
            <Text style={[styles.rotulo, { color: c.muted }]} accessibilityRole="header">
              Zona de perigo
            </Text>
            <Text style={[styles.opcao, { color: c.ink }]}>Recomeçar jornada</Text>
            <Text style={[styles.texto, { color: c.muted }]}>
              Começar outro mundo significa deixar para trás este e tudo que você aprendeu aqui.
            </Text>
            <Button
              label="Recomeçar jornada"
              variant="destructive"
              onPress={() => setConfirmando(true)}
              style={styles.recomecar}
            />
          </View>
        )}

        {/* Parece só um enfeite no pé da tela. */}
        <Pressable onPress={onToqueSecreto} hitSlop={12} style={styles.enfeite} accessibilityLabel="Enfeite">
          <Text style={[styles.enfeiteTexto, { color: c.line }]}>✦</Text>
        </Pressable>
      </ScrollView>

      {/* Por cima da tela; o "voltar" dela devolve a pessoa para cá. */}
      <AboutScreen aberta={sobreAberto} onFechar={() => setSobreAberto(false)} />

      {/* A mesma confirmação de sempre, agora por cima da tela. */}
      <Window visible={confirmando} title="Recomeçar jornada?" onClose={() => setConfirmando(false)}>
        <Text style={[styles.texto, { color: c.ink }]}>Você já começou a construir este mundo.</Text>
        <Text style={[styles.texto, { color: c.ink }]}>
          Ao recomeçar, este mundo, tudo que foi construído nele e tudo que você aprendeu nesta
          jornada serão apagados.
        </Text>
        <Text style={[styles.texto, { color: c.muted }]}>Não dá para desfazer.</Text>
        <View style={styles.botoes}>
          <Button label="Cancelar" onPress={() => setConfirmando(false)} style={styles.flex} />
          <Button
            label="Recomeçar"
            variant="destructive"
            onPress={() => {
              setConfirmando(false);
              onFechar();
              onRecomecarJornada();
            }}
            style={styles.flex}
          />
        </View>
      </Window>
    </Animated.View>
  );
}

/** Uma opção que leva a outra tela: nome, resumo opcional e `›`, com um fio embaixo. */
function LinhaDeNavegacao({
  rotulo, resumo, onPress,
}: {
  rotulo: string;
  resumo?: string;
  onPress: () => void;
}) {
  const c = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={resumo ? `${rotulo}, ${resumo}` : rotulo}
      onPress={onPress}
      style={({ pressed }) => [styles.linha, { borderBottomColor: c.line }, pressed && styles.pressionado]}
    >
      <Text style={[styles.opcao, { color: c.ink }]}>{rotulo}</Text>
      {resumo !== undefined && <Text style={[styles.resumo, { color: c.muted }]}>{resumo}</Text>}
      <Text style={[styles.seta, { color: c.muted }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Acima do mundo, do aparelho e da barra de ações; abaixo da coleção de
  // conquistas (40), que abre por cima desta tela.
  tela: { zIndex: 35 },
  pressionado: { opacity: 0.6 },

  conteudo: {
    flexGrow: 1,
    paddingHorizontal: MARGEM,
    paddingTop: 8,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  opcao: { flex: 1, fontSize: 17, fontWeight: '600' },
  resumo: { fontSize: 15, fontVariant: ['tabular-nums'] },
  seta: { fontSize: 22, lineHeight: 24, fontWeight: '300' },
  grupo: { gap: 12, paddingTop: 22 },
  segmentos: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 3, gap: 3 },
  segmento: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  segmentoTexto: { fontSize: 14 },
  segmentoEscolhido: { fontWeight: '700' },
  depoisDaAparencia: { marginTop: 22 },
  novoMundo: { marginTop: 28 },

  respiro: { flexGrow: 1, minHeight: 40 },
  secao: { gap: 10, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 20, marginTop: 28 },
  rotulo: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  texto: { fontSize: 15, lineHeight: 21 },
  recomecar: { marginTop: 6 },

  enfeite: { alignSelf: 'center', marginTop: 28 },
  enfeiteTexto: { fontSize: 12 },

  botoes: { flexDirection: 'row', gap: 8, marginTop: 4 },
  flex: { flex: 1 },
});
