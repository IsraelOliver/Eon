import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';
import { ESPACO_ACTION_BAR } from '@/shared/ui/ActionBar';

import { posicionarBalao, trechosDaLinha } from '../render/calloutGeometria';

/** Bolinha sobre a construção. A âncora é o CENTRO dela. */
const PONTO = 9;
const ESPESSURA = 1.5;
/** Distância entre a bolinha e o balão. */
const VAO = 26;
/** A linha entra um pouco sob a bolinha e sob a borda, para não sobrar fresta. */
const FOLGA = 2;
/** Folga nas pontas da lateral do balão: o raio é 12, então a linha não pega o canto. */
const MARGEM_INTERNA = 14;
/** Desnível menor que isto vira linha reta. */
const TOLERANCIA = 3;
/** Trecho horizontal mínimo de cada lado do cotovelo. */
const TRECHO_MINIMO = 14;
const LARGURA = 210;
const MARGEM = 16;
const ENTRADA_MS = 170;

type Props = {
  /** Ponto da construção na tela, medido no toque. É o centro da bolinha. */
  x: number;
  y: number;
  titulo: string;
  /** Linha de ligação, ex.: "Surgiu quando você aprendeu:". Opcional. */
  texto?: string;
  /** O título da curiosidade, quando existe. */
  destaque?: string;
};

/**
 * Identifica UMA construção no mapa: bolinha, traço e uma etiqueta pequena.
 *
 * Toda a geometria sai da âncora `(x, y)` e do tamanho REAL do balão, medido no
 * `onLayout` — nada de offset pensado para um caso. Por isso funciona igual com
 * a construção à esquerda, à direita, colada no topo ou perto da barra.
 *
 * Não é um modal, e não recebe toque: tocar noutra construção troca a seleção e
 * tocar no chão fecha.
 */
export function BuildingCallout({ x, y, titulo, texto, destaque }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const tela = useWindowDimensions();
  /** Altura só existe depois do layout; até lá o balão fica invisível. */
  const [altura, setAltura] = useState<number | null>(null);

  const medir = (e: LayoutChangeEvent) => {
    const nova = e.nativeEvent.layout.height;
    if (nova > 0 && nova !== altura) setAltura(nova);
  };

  const ancora = { x, y };
  const limites = {
    esquerda: insets.left + MARGEM,
    direita: tela.width - insets.right - MARGEM,
    topo: insets.top + MARGEM,
    base: tela.height - insets.bottom - ESPACO_ACTION_BAR - MARGEM,
  };

  // Primeiro quadro: ainda sem altura. Desenha só o balão, invisível, para medir.
  if (altura === null) {
    return (
      <View pointerEvents="none" style={styles.camada}>
        <View style={[styles.etiqueta, styles.medindo, { borderColor: c.line }]} onLayout={medir}>
          <Conteudo titulo={titulo} texto={texto} destaque={destaque} cores={c} />
        </View>
      </View>
    );
  }

  const balao = posicionarBalao(ancora, { largura: LARGURA, altura }, limites, VAO);
  const trechos = trechosDaLinha(ancora, balao, {
    margemInterna: MARGEM_INTERNA,
    tolerancia: TOLERANCIA,
    trechoMinimo: TRECHO_MINIMO,
    espessura: ESPESSURA,
    folga: FOLGA,
  });

  return (
    <Animated.View
      pointerEvents="none"
      entering={FadeIn.duration(ENTRADA_MS)}
      exiting={FadeOut.duration(130)}
      style={styles.camada}
    >
      {/* Ordem = camadas: a linha entra por baixo da bolinha e da borda do balão. */}
      {trechos.map((trecho, i) => (
        <View
          key={i}
          style={[
            styles.trecho,
            {
              left: trecho.x,
              top: trecho.y,
              width: trecho.largura,
              height: trecho.altura,
              backgroundColor: c.ink,
            },
          ]}
        />
      ))}
      <View
        style={[
          styles.ponto,
          { left: x - PONTO / 2, top: y - PONTO / 2, backgroundColor: c.ink, borderColor: c.panel },
        ]}
      />
      <View
        style={[
          styles.etiqueta,
          { left: balao.x, top: balao.y, backgroundColor: c.panel, borderColor: c.line },
        ]}
        onLayout={medir}
      >
        <Conteudo titulo={titulo} texto={texto} destaque={destaque} cores={c} />
      </View>
    </Animated.View>
  );
}

function Conteudo({
  titulo,
  texto,
  destaque,
  cores,
}: {
  titulo: string;
  texto?: string;
  destaque?: string;
  cores: ReturnType<typeof useColors>;
}) {
  return (
    <>
      <Text style={[styles.titulo, { color: cores.ink }]}>{titulo}</Text>
      {texto && <Text style={[styles.texto, { color: cores.muted }]}>{texto}</Text>}
      {destaque && (
        <Text style={[styles.destaque, { color: cores.ink }]} numberOfLines={3}>
          {destaque}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  camada: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 22 },
  trecho: { position: 'absolute' },
  ponto: {
    position: 'absolute',
    width: PONTO,
    height: PONTO,
    borderRadius: PONTO / 2,
    borderWidth: 1,
  },
  etiqueta: {
    position: 'absolute',
    width: LARGURA,
    gap: 3,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  /** Fora da vista enquanto mede: sem piscada, sem teletransporte. */
  medindo: { left: 0, top: 0, opacity: 0 },
  titulo: { fontSize: 15, fontWeight: '700' },
  texto: { fontSize: 12 },
  destaque: { fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
});
