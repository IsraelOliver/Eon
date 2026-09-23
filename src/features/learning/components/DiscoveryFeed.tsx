import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';
import { ESPACO_ACTION_BAR } from '@/shared/ui/ActionBar';

import type { CuriosityEntry } from '../data/curiosities';
import type { CuriosityId } from '../engine/types';
import { medidasDoFeed, paradasDoFeed, posicaoDoPost } from '../presentation/feedLayout';
import { DiscoveryPost } from './DiscoveryPost';

type Props = {
  /** Só as ainda não descobertas — quem filtra é a tela. */
  curiosidades: readonly CuriosityEntry[];
  /** Éon + World Pulse. Abre a sessão e sobe junto com o feed. */
  cabecalho: ReactElement;
  onLer: (id: CuriosityId) => void;
};

/**
 * O Discovery Feed: uma descoberta por vez, ocupando a tela inteira.
 *
 * **Cada post vale uma viewport cheia** (`medidasDoFeed`): a fotografia sangra
 * de borda a borda e passa por baixo da status bar e da ActionBar. Só o texto
 * respeita essas áreas, pelos recuos.
 *
 * **O snap é por offsets, não por intervalo**, porque o cabeçalho tem altura
 * própria (medida no layout) e desalinharia um `snapToInterval` a partir do
 * segundo post. A parada `0` é de propósito: é a abertura da sessão.
 *
 * **Nenhum padding no conteúdo da lista.** A safe area do topo vive dentro do
 * cabeçalho, e embaixo não há padding nenhum — é isso que faz a última parada
 * coincidir exatamente com o fim da rolagem. Um padding aqui empurraria todos
 * os posts e quebraria a conta do snap.
 */
export function DiscoveryFeed({ curiosidades, cabecalho, onLer }: Props) {
  const c = useColors();
  const janela = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [alturaCabecalho, setAlturaCabecalho] = useState(0);

  const { alturaDoPost, recuoTopo, recuoBase } = medidasDoFeed(
    janela,
    insets,
    ESPACO_ACTION_BAR,
  );

  const paradas = useMemo(
    () => paradasDoFeed(alturaCabecalho, alturaDoPost, curiosidades.length),
    [alturaCabecalho, alturaDoPost, curiosidades.length],
  );

  const medirItem = useCallback(
    (_: unknown, index: number) => ({
      length: alturaDoPost,
      // Conta o cabeçalho: é assim que a virtualização sabe onde cada post está
      // de verdade. Errar aqui deixa áreas em branco na rolagem.
      offset: posicaoDoPost(alturaCabecalho, alturaDoPost, index),
      index,
    }),
    [alturaDoPost, alturaCabecalho],
  );

  const desenharItem = useCallback(
    ({ item, index }: { item: CuriosityEntry; index: number }) => (
      <DiscoveryPost
        curiosidade={item}
        altura={alturaDoPost}
        recuoTopo={recuoTopo}
        recuoBase={recuoBase}
        // Só o primeiro nasce colado na interface; os outros encontram o
        // degradê do post de cima.
        primeiro={index === 0}
        corDaInterface={c.fundoFeed}
        onLer={() => onLer(item.id)}
      />
    ),
    [alturaDoPost, recuoTopo, recuoBase, c.fundoFeed, onLer],
  );

  return (
    <FlatList
      data={curiosidades}
      keyExtractor={(curiosidade) => curiosidade.id}
      renderItem={desenharItem}
      ListHeaderComponent={
        <View
          style={{ paddingTop: insets.top }}
          onLayout={(e) => setAlturaCabecalho(e.nativeEvent.layout.height)}
        >
          {cabecalho}
        </View>
      }
      ListEmptyComponent={<TudoDescoberto altura={alturaDoPost} recuoBase={recuoBase} />}
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
function TudoDescoberto({ altura, recuoBase }: { altura: number; recuoBase: number }) {
  const c = useColors();

  return (
    <View style={[styles.vazio, { height: altura, paddingBottom: recuoBase }]}>
      <Text style={[styles.vazioMarca, { color: c.line }]}>◍</Text>
      <Text style={[styles.vazioTitulo, { color: c.ink }]}>Você descobriu tudo por enquanto.</Text>
      <Text style={[styles.vazioTexto, { color: c.muted }]}>
        Seu mundo guarda o que você já aprendeu.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  vazio: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  vazioMarca: { fontSize: 48, lineHeight: 56 },
  vazioTitulo: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  vazioTexto: { fontSize: 15, lineHeight: 21, textAlign: 'center' },
});
