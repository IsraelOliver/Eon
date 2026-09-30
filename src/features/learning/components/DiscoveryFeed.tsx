import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList, StyleSheet, Text, useWindowDimensions, View,
  type NativeScrollEvent, type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';
import { ESPACO_ACTION_BAR } from '@/shared/ui/ActionBar';

import type { CuriosityEntry } from '../data/curiosities';
import type { CuriosityId } from '../engine/types';
import {
  FOLGA_DO_TOPO, medidasDoFeed, paradasDoFeed, posicaoDoPost,
} from '../presentation/feedLayout';
import { DiscoveryPost } from './DiscoveryPost';

/**
 * Quanto o header ocupa abaixo da safe area, só para a status bar saber quando
 * ele saiu antes da primeira medida. O tamanho do primeiro post não depende
 * disto: ele ocupa, com `flex`, o que o header deixa da página.
 */
const HEADER_ESTIMADO = 110;

type Props = {
  /** Só as ainda não descobertas — quem filtra é a tela. */
  curiosidades: readonly CuriosityEntry[];
  /** Éon + World Pulse. Mora na primeira página, acima do primeiro post, e rola com ela. */
  cabecalho: ReactElement;
  /**
   * Avisa quando o header sai de baixo da status bar (e quando volta): dali
   * em diante o alto da tela é fotografia, e a barra de status precisa de
   * ícones claros.
   */
  onHeaderFora?: (fora: boolean) => void;
  onLer: (id: CuriosityId) => void;
  /** Muda de valor para pedir a volta ao topo, rolando suave. `0` = nenhum pedido ainda. */
  voltarAoTopo?: number;
};

/**
 * O Discovery Feed: uma descoberta por página, a página do tamanho da tela.
 *
 * O header NÃO é fixo: ele é o alto da primeira página, acima do primeiro post
 * (header termina, post começa — duas regiões, sem degradê entre elas), e sobe
 * junto quando a pessoa passa para a próxima curiosidade. As outras páginas
 * são um post de borda a borda. Toda página mede a altura da lista (medida com
 * `onLayout`), então toda página começa num múltiplo exato dela (`paradasDoFeed`).
 *
 * **Nenhum padding no conteúdo da lista.** Com posts de uma viewport cada, o fim
 * da rolagem coincide exatamente com a última parada. Um padding quebraria isso.
 */
export function DiscoveryFeed({
  curiosidades, cabecalho, onHeaderFora, onLer, voltarAoTopo = 0,
}: Props) {
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
  const [cabecalhoMedido, setCabecalhoMedido] = useState<number | null>(null);
  const alturaDoCabecalho = cabecalhoMedido ?? insets.top + HEADER_ESTIMADO;

  const { alturaDaPagina, recuoTopo, recuoBase } = medidasDoFeed(
    alturaMedida ?? janela.height,
    insets,
    ESPACO_ACTION_BAR,
  );

  const paradas = useMemo(
    () => paradasDoFeed(alturaDaPagina, curiosidades.length),
    [alturaDaPagina, curiosidades.length],
  );

  const medirItem = useCallback(
    (_: unknown, index: number) => ({
      length: alturaDaPagina,
      offset: posicaoDoPost(alturaDaPagina, index),
      index,
    }),
    [alturaDaPagina],
  );

  const desenharItem = useCallback(
    ({ item, index }: { item: CuriosityEntry; index: number }) => {
      if (index !== 0) {
        return (
          <DiscoveryPost
            curiosidade={item}
            altura={alturaDaPagina}
            recuoTopo={recuoTopo}
            recuoBase={recuoBase}
            primeiro={false}
            onLer={() => onLer(item.id)}
          />
        );
      }

      // A primeira página: o header em cima, o primeiro post no resto dela.
      return (
        <View style={{ height: alturaDaPagina }}>
          <View onLayout={(e) => setCabecalhoMedido(e.nativeEvent.layout.height)}>{cabecalho}</View>
          <DiscoveryPost
            curiosidade={item}
            recuoTopo={FOLGA_DO_TOPO}
            recuoBase={recuoBase}
            primeiro
            onLer={() => onLer(item.id)}
          />
        </View>
      );
    },
    [alturaDaPagina, cabecalho, recuoTopo, recuoBase, onLer],
  );

  /*
   * O header sai de baixo da status bar quando a rolagem passa da altura dele
   * menos a safe area. Só avisa quando o estado MUDA: a rolagem dispara muitos
   * eventos, a tela não precisa renderizar a cada um.
   */
  const headerFora = useRef(false);
  const aoRolar = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const fora = e.nativeEvent.contentOffset.y > alturaDoCabecalho - insets.top;
      if (fora === headerFora.current) return;
      headerFora.current = fora;
      onHeaderFora?.(fora);
    },
    [alturaDoCabecalho, insets.top, onHeaderFora],
  );

  return (
    <FlatList
      ref={lista}
      style={styles.lista}
      onLayout={(e) => setAlturaMedida(e.nativeEvent.layout.height)}
      data={curiosidades}
      keyExtractor={(curiosidade) => curiosidade.id}
      renderItem={desenharItem}
      onScroll={aoRolar}
      scrollEventThrottle={16}
      ListEmptyComponent={
        <View style={{ height: alturaDaPagina }}>
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
  lista: { flex: 1 },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  vazioMarca: { fontSize: 48, lineHeight: 56 },
  vazioTitulo: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  vazioTexto: { fontSize: 15, lineHeight: 21, textAlign: 'center' },
});
