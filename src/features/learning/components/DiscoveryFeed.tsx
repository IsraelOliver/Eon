import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';
import { ESPACO_ACTION_BAR } from '@/shared/ui/ActionBar';

import type { CuriosityEntry } from '../data/curiosities';
import type { CuriosityId } from '../engine/types';
import { medidasDoFeed, paradasDoFeed, posicaoDoPost } from '../presentation/feedLayout';
import { DiscoveryPost } from './DiscoveryPost';

/**
 * Quanto o header ocupa abaixo da safe area, só para estimar a timeline antes
 * da primeira medida. Vale por um quadro: o `onLayout` da lista corrige logo depois.
 */
const HEADER_ESTIMADO = 110;

type Props = {
  /** Só as ainda não descobertas — quem filtra é a tela. */
  curiosidades: readonly CuriosityEntry[];
  onLer: (id: CuriosityId) => void;
  /** Muda de valor para pedir a volta ao topo, rolando suave. `0` = nenhum pedido ainda. */
  voltarAoTopo?: number;
};

/**
 * O Discovery Feed: a timeline, uma descoberta por vez, ocupando toda a área
 * abaixo do header.
 *
 * O header é uma região própria, fixa, FORA da lista: o header termina, a
 * timeline começa. Cada post mede exatamente a altura da lista (medida com
 * `onLayout`), então todo post começa num múltiplo exato dela (`paradasDoFeed`).
 *
 * **Nenhum padding no conteúdo da lista.** Com posts de uma viewport cada, o fim
 * da rolagem coincide exatamente com a última parada. Um padding quebraria isso.
 */
export function DiscoveryFeed({ curiosidades, onLer, voltarAoTopo = 0 }: Props) {
  const lista = useRef<FlatList<CuriosityEntry>>(null);

  // Só rola a lista que já existe: nada remonta, nenhum estado do feed muda.
  // O topo (0) é a primeira parada do snap, então a rolagem assenta nele.
  const ultimoPedido = useRef(voltarAoTopo);
  useEffect(() => {
    if (voltarAoTopo === ultimoPedido.current) return;
    ultimoPedido.current = voltarAoTopo;
    lista.current?.scrollToOffset({ offset: 0, animated: true });
  }, [voltarAoTopo]);

  const janela = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [alturaMedida, setAlturaMedida] = useState<number | null>(null);
  const alturaDaTimeline = alturaMedida ?? janela.height - insets.top - HEADER_ESTIMADO;

  const { alturaDoPost, recuoTopo, recuoBase } = medidasDoFeed(
    alturaDaTimeline,
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
    ({ item, index }: { item: CuriosityEntry; index: number }) => (
      <DiscoveryPost
        curiosidade={item}
        altura={alturaDoPost}
        recuoTopo={recuoTopo}
        recuoBase={recuoBase}
        primeiro={index === 0}
        onLer={() => onLer(item.id)}
      />
    ),
    [alturaDoPost, recuoTopo, recuoBase, onLer],
  );

  return (
    <FlatList
      ref={lista}
      style={styles.lista}
      onLayout={(e) => setAlturaMedida(e.nativeEvent.layout.height)}
      data={curiosidades}
      keyExtractor={(curiosidade) => curiosidade.id}
      renderItem={desenharItem}
      ListEmptyComponent={
        <View style={{ height: alturaDoPost }}>
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
  lista: { flex: 1 },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  vazioMarca: { fontSize: 48, lineHeight: 56 },
  vazioTitulo: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  vazioTexto: { fontSize: 15, lineHeight: 21, textAlign: 'center' },
});
