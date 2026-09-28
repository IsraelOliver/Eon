import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';
import { ESPACO_ACTION_BAR } from '@/shared/ui/ActionBar';

import type { CuriosityEntry } from '../data/curiosities';
import type { CuriosityId } from '../engine/types';
import { medidasDoFeed, paradasDoFeed, posicaoDoPost } from '../presentation/feedLayout';
import { DiscoveryPost } from './DiscoveryPost';

/**
 * Altura do cabeçalho antes da primeira medida (safe area + Éon + World Pulse).
 * Só vale por um quadro: o `onLayout` do próprio cabeçalho corrige logo depois.
 */
const CABECALHO_ESTIMADO = 150;

type Props = {
  /** Só as ainda não descobertas — quem filtra é a tela. */
  curiosidades: readonly CuriosityEntry[];
  /** Éon + World Pulse. Flutua sobre a primeira curiosidade e sobe com ela. */
  cabecalho: ReactElement;
  onLer: (id: CuriosityId) => void;
};

/**
 * O Discovery Feed: uma descoberta por vez, ocupando a tela inteira.
 *
 * **A primeira curiosidade é a própria tela.** O cabeçalho não é mais um bloco
 * acima dela: ele flutua SOBRE a foto, que começa no topo físico da tela, e a
 * atmosfera da curiosidade junta os dois numa composição só. Sem "interface em
 * cima, fotografia embaixo".
 *
 * Isso também simplificou o snap: como o cabeçalho não ocupa espaço próprio,
 * todo post começa num múltiplo exato da viewport (`paradasDoFeed`). A altura
 * medida do cabeçalho só serve para o PRIMEIRO post saber até onde deixar a
 * atmosfera densa e onde pôr o chip do tema.
 *
 * **Nenhum padding no conteúdo da lista.** Com posts de uma viewport cada, o fim
 * da rolagem coincide exatamente com a última parada. Um padding quebraria isso.
 */
export function DiscoveryFeed({ curiosidades, cabecalho, onLer }: Props) {
  const janela = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [alturaMedida, setAlturaMedida] = useState<number | null>(null);
  const alturaDoCabecalho = alturaMedida ?? insets.top + CABECALHO_ESTIMADO;

  const { alturaDoPost, recuoTopo, recuoBase } = medidasDoFeed(
    janela,
    insets,
    ESPACO_ACTION_BAR,
  );

  const paradas = useMemo(
    () => paradasDoFeed(alturaDoPost, curiosidades.length),
    [alturaDoPost, curiosidades.length],
  );

  const medirItem = useCallback(
    (_: unknown, index: number) => ({
      length: alturaDoPost,
      offset: posicaoDoPost(alturaDoPost, index),
      index,
    }),
    [alturaDoPost],
  );

  const desenharItem = useCallback(
    ({ item, index }: { item: CuriosityEntry; index: number }) => {
      const post = (
        <DiscoveryPost
          curiosidade={item}
          altura={alturaDoPost}
          recuoTopo={recuoTopo}
          recuoBase={recuoBase}
          alturaDoCabecalho={index === 0 ? alturaDoCabecalho : undefined}
          onLer={() => onLer(item.id)}
        />
      );
      if (index !== 0) return post;

      /*
       * O primeiro post leva o cabeçalho POR CIMA, como irmão — não dentro do
       * post. Assim um toque no World Pulse não abre a curiosidade: ele cai no
       * cabeçalho, que não é o botão do post.
       */
      return (
        <View style={{ height: alturaDoPost }}>
          {post}
          <View
            style={[styles.sobreAFoto, { paddingTop: insets.top }]}
            onLayout={(e) => setAlturaMedida(e.nativeEvent.layout.height)}
          >
            {cabecalho}
          </View>
        </View>
      );
    },
    [alturaDoPost, recuoTopo, recuoBase, alturaDoCabecalho, cabecalho, insets.top, onLer],
  );

  return (
    <FlatList
      data={curiosidades}
      keyExtractor={(curiosidade) => curiosidade.id}
      renderItem={desenharItem}
      ListEmptyComponent={
        // Sem curiosidade não há foto: o cabeçalho volta a pousar no fundo da
        // paleta, como qualquer tela do app.
        <View style={{ height: alturaDoPost, paddingTop: insets.top }}>
          {cabecalho}
          <TudoDescoberto recuoBase={recuoBase} />
        </View>
      }
      getItemLayout={medirItem}
      snapToOffsets={paradas}
      // Encaixa sem prender: arrasta, solta, o próximo post assenta — e nunca
      // dois de uma vez, mesmo num gesto rápido.
      decelerationRate="fast"
      disableIntervalMomentum
      showsVerticalScrollIndicator={false}
      // Fotografia em tela cheia é cara: poucas vivas ao mesmo tempo.
      initialNumToRender={2}
      maxToRenderPerBatch={2}
      windowSize={3}
    />
  );
}

/** Quando não sobrou nada para descobrir. Não inventa conteúdo: só avisa. */
function TudoDescoberto({ recuoBase }: { recuoBase: number }) {
  const c = useColors();

  return (
    <View style={[styles.vazio, { paddingBottom: recuoBase }]}>
      <Text style={[styles.vazioMarca, { color: c.line }]}>◍</Text>
      <Text style={[styles.vazioTitulo, { color: c.ink }]}>Você descobriu tudo por enquanto.</Text>
      <Text style={[styles.vazioTexto, { color: c.muted }]}>
        Seu mundo guarda o que você já aprendeu.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sobreAFoto: { position: 'absolute', top: 0, left: 0, right: 0 },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  vazioMarca: { fontSize: 48, lineHeight: 56 },
  vazioTitulo: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  vazioTexto: { fontSize: 15, lineHeight: 21, textAlign: 'center' },
});
