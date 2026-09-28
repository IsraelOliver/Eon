import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import {
  BackHandler, FlatList, Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors, useEstiloDaStatusBar } from '@/shared/theme/colors';
import { comAlfa } from '@/shared/theme/cor';

import { CONQUISTAS } from '../data/achievements';
import { rotuloAcessivel, type Colecao, type ItemDaColecao } from '../engine/colecao';
import type { AchievementId } from '../engine/regras';

const FADE_MS = 200;
const MARGEM = 20;
/** Largura da coluna do botão voltar; a direita repete, e o título fica no centro da tela. */
const CANTO = 44;
/** A arte fica no tamanho exato dos arquivos (64 pt): cada pixel cai inteiro na tela. */
const ARTE = 64;
const TEXTO_BLOQUEADA = 'Ainda não descoberta.';

type Props = {
  aberta: boolean;
  /** Catálogo + estado da jornada, já projetados pela composição. */
  colecao: Colecao;
  onFechar: () => void;
};

/**
 * Uma linha da lista: o catálogo (aparência) junto com a jornada (se já foi
 * alcançada). `desbloqueada` nunca é escrita à mão — vem do save, pela coleção.
 */
interface ConquistaNaLista {
  id: AchievementId;
  titulo: string;
  descricao: string;
  imagem: ImageSourcePropType;
  imagemBloqueada: ImageSourcePropType;
  desbloqueada: boolean;
}

function paraALista(item: ItemDaColecao): ConquistaNaLista {
  return { id: item.id, ...CONQUISTAS[item.id], desbloqueada: item.desbloqueada };
}

/**
 * A coleção de marcos da jornada: uma lista vertical, como a de um jogo.
 *
 * É uma camada de tela cheia, e não um `Window`: a janela embrulha o conteúdo
 * num `ScrollView`, e uma `FlatList` lá dentro perderia a virtualização — que é
 * justamente o que deixa a coleção crescer para dezenas de conquistas.
 *
 * Nenhuma animação de celebração aqui: quem comemora é o banner, no instante do
 * desbloqueio. A coleção é o registro permanente.
 */
export function AchievementsScreen({ aberta, colecao, onFechar }: Props) {
  const c = useColors();
  const estiloDaStatusBar = useEstiloDaStatusBar();
  const insets = useSafeAreaInsets();

  // Voltar do Android fecha a coleção.
  useEffect(() => {
    if (!aberta) return;
    const assinatura = BackHandler.addEventListener('hardwareBackPress', () => {
      onFechar();
      return true;
    });
    return () => assinatura.remove();
  }, [aberta, onFechar]);

  if (!aberta) return null;

  const progresso = colecao.total > 0 ? colecao.desbloqueadas / colecao.total : 0;

  return (
    <Animated.View
      entering={FadeIn.duration(FADE_MS)}
      exiting={FadeOut.duration(FADE_MS)}
      accessibilityViewIsModal
      style={[StyleSheet.absoluteFill, styles.tela, { backgroundColor: c.fundoFeed }]}
    >
      {/* A coleção pousa no fundo do tema: a barra de status volta a ser a
          dela, mesmo que o feed (aberto por baixo) tenha pedido ícones claros. */}
      <StatusBar style={estiloDaStatusBar} />
      <View style={[styles.topo, { paddingTop: insets.top + 6 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={onFechar}
          hitSlop={12}
          style={({ pressed }) => [styles.canto, pressed && styles.pressionado]}
        >
          <Text style={[styles.voltar, { color: c.ink }]}>‹</Text>
        </Pressable>
        <Text style={[styles.titulo, { color: c.ink }]} accessibilityRole="header">
          Conquistas
        </Text>
        <View style={styles.canto} />
      </View>

      <FlatList
        data={colecao.itens}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={Separador}
        ListHeaderComponent={
          colecao.total > 0 ? (
            <View
              style={styles.cabecalho}
              accessible
              accessibilityLabel={`${colecao.desbloqueadas} de ${colecao.total} conquistas desbloqueadas`}
            >
              <Text style={[styles.subtitulo, { color: c.muted }]}>Marcos da sua jornada</Text>
              <Text style={[styles.contagem, { color: c.ink }]}>
                {colecao.desbloqueadas} de {colecao.total} desbloqueadas
              </Text>
              <View style={[styles.trilho, { backgroundColor: c.line }]}>
                <View
                  style={[styles.barra, { width: `${progresso * 100}%`, backgroundColor: c.accent }]}
                />
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <Text style={[styles.vazio, { color: c.muted }]}>Suas conquistas aparecerão aqui.</Text>
        }
        renderItem={({ item }) => <LinhaDaConquista conquista={paraALista(item)} />}
      />
    </Animated.View>
  );
}

function Separador() {
  return <View style={styles.separador} />;
}

/**
 * Uma conquista na lista: arte à esquerda, estado, nome e frase à direita.
 *
 * Desbloqueada: a arte como foi feita, nome e frase. Bloqueada: a silhueta,
 * "???" e "Ainda não descoberta." — não revela nome nem condição, o que já deixa
 * espaço para conquistas secretas sem campo novo.
 */
function LinhaDaConquista({ conquista }: { conquista: ConquistaNaLista }) {
  const c = useColors();
  const { desbloqueada } = conquista;

  return (
    <View
      accessible
      accessibilityLabel={
        desbloqueada
          ? `${rotuloAcessivel(conquista.titulo, true)} ${conquista.descricao}`
          : `${rotuloAcessivel(conquista.titulo, false)} ${TEXTO_BLOQUEADA}`
      }
      style={[
        styles.linha,
        {
          backgroundColor: c.cartao,
          borderColor: desbloqueada ? comAlfa(c.accent, 0.4) : c.line,
        },
      ]}
    >
      <View
        style={[
          styles.moldura,
          { borderColor: desbloqueada ? c.accent : c.line },
        ]}
      >
        {/* Tamanho exato do arquivo da densidade: nada é esticado, nada é tingido. */}
        <Image
          source={desbloqueada ? conquista.imagem : conquista.imagemBloqueada}
          style={styles.arte}
        />
      </View>

      <View style={styles.textos}>
        <Text style={[styles.estado, { color: desbloqueada ? c.accentLegivel : c.muted }]}>
          {desbloqueada ? 'Desbloqueada' : 'Bloqueada'}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.nome,
            desbloqueada ? { color: c.ink } : [styles.nomeBloqueado, { color: c.muted }],
          ]}
        >
          {desbloqueada ? conquista.titulo : '???'}
        </Text>
        <Text numberOfLines={2} style={[styles.descricao, { color: c.muted }]}>
          {desbloqueada ? conquista.descricao : TEXTO_BLOQUEADA}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Acima do mundo, do aparelho e da barra de ações; abaixo da apresentação e
  // do banner de conquista, que precisa aparecer por cima de qualquer tela.
  tela: { zIndex: 40 },
  topo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8 },
  canto: { width: CANTO, alignItems: 'center', justifyContent: 'center' },
  voltar: { fontSize: 34, lineHeight: 38, fontWeight: '300' },
  titulo: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  pressionado: { opacity: 0.6 },

  conteudo: {
    paddingHorizontal: MARGEM,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  cabecalho: { alignItems: 'center', gap: 6, paddingTop: 4, paddingBottom: 24 },
  subtitulo: { fontSize: 13 },
  contagem: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  trilho: { width: 140, height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  barra: { height: 4, borderRadius: 2 },
  vazio: { textAlign: 'center', fontSize: 15, paddingTop: 48 },

  separador: { height: 10 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  // Quadrada, cantos pouco arredondados: moldura de item de jogo, não medalhão.
  moldura: { borderWidth: 2, borderRadius: 8, overflow: 'hidden' },
  arte: { width: ARTE, height: ARTE },
  textos: { flex: 1, gap: 2 },
  estado: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nome: { fontSize: 16, lineHeight: 21, fontWeight: '700' },
  nomeBloqueado: { letterSpacing: 2 },
  descricao: { fontSize: 13, lineHeight: 18 },
});
