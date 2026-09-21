import { useCallback, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { cancelAnimation, useDerivedValue, useSharedValue, withDecay } from 'react-native-reanimated';

const ZOOM_MAXIMO = 8; // em relação ao zoom mínimo

/**
 * Menor e maior deslocamento permitidos num eixo.
 * Se o mapa é maior que a tela, dá para arrastar até a borda; senão fica centralizado.
 */
function limites(tela: number, conteudo: number): [number, number] {
  'worklet';
  if (conteudo <= tela) {
    const centro = (tela - conteudo) / 2;
    return [centro, centro];
  }
  return [tela - conteudo, 0];
}

function prender(valor: number, [min, max]: [number, number]): number {
  'worklet';
  return Math.min(max, Math.max(min, valor));
}

/**
 * Câmera do mapa: arrastar, pinça e inércia.
 * Só muda a transformação (shared values); o buffer de pixels não é tocado.
 * largura/altura = tamanho do mapa em pixels de arte.
 */
export function useMapCamera(largura: number, altura: number) {
  const tela = useWindowDimensions();
  const zoomMin = tela.height / altura; // a altura do mapa preenche a tela
  const zoomMax = zoomMin * ZOOM_MAXIMO;

  const escala = useSharedValue(zoomMin);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const pincando = useSharedValue(false);
  /** Contador de pedidos de repintar. Veja `repintar()` lá embaixo. */
  const revisao = useSharedValue(0);

  // Ao abrir (ou mudar o tamanho da tela): zoom mínimo, centralizado.
  useEffect(() => {
    escala.set(zoomMin);
    x.set((tela.width - largura * zoomMin) / 2);
    y.set(0);
  }, [tela.width, tela.height, largura, altura, zoomMin, escala, x, y]);

  const pararInercia = () => {
    'worklet';
    cancelAnimation(x);
    cancelAnimation(y);
  };

  const arrastar = Gesture.Pan()
    .maxPointers(1)
    .onBegin(pararInercia)
    .onChange((e) => {
      if (pincando.value) return;
      x.value = prender(x.value + e.changeX, limites(tela.width, largura * escala.value));
      y.value = prender(y.value + e.changeY, limites(tela.height, altura * escala.value));
    })
    .onEnd((e) => {
      if (pincando.value) return;
      const lx = limites(tela.width, largura * escala.value);
      const ly = limites(tela.height, altura * escala.value);
      if (lx[0] < lx[1]) x.value = withDecay({ velocity: e.velocityX, clamp: lx });
      if (ly[0] < ly[1]) y.value = withDecay({ velocity: e.velocityY, clamp: ly });
    });

  // Guarda o foco anterior para os dois dedos também moverem o mapa.
  const focoX = useSharedValue(0);
  const focoY = useSharedValue(0);

  const pinca = Gesture.Pinch()
    .onStart((e) => {
      pararInercia();
      pincando.value = true;
      focoX.value = e.focalX;
      focoY.value = e.focalY;
    })
    .onChange((e) => {
      const antes = escala.value;
      const depois = Math.min(zoomMax, Math.max(zoomMin, antes * e.scaleChange));
      const fator = depois / antes;
      // o ponto do mapa que estava sob os dedos continua sob os dedos
      const nx = e.focalX - (focoX.value - x.value) * fator;
      const ny = e.focalY - (focoY.value - y.value) * fator;
      escala.value = depois;
      x.value = prender(nx, limites(tela.width, largura * depois));
      y.value = prender(ny, limites(tela.height, altura * depois));
      focoX.value = e.focalX;
      focoY.value = e.focalY;
    })
    .onFinalize(() => {
      pincando.value = false;
    });

  const gesto = Gesture.Simultaneous(arrastar, pinca);

  // Tela = deslocamento + escala × ponto do mapa
  const transformacao = useDerivedValue(() => {
    // `revisao` entra na conta de propósito. Somar zero mantém a câmera
    // idêntica, mas faz este valor derivado ser reescrito — e é isso que o
    // Skia observa para reenviar a cena. Veja `repintar()`.
    const repinte = revisao.value * 0;
    return [
      { translateX: x.value + repinte },
      { translateY: y.value },
      { scale: escala.value },
    ];
  });

  /**
   * Pede um repintar sem mexer na câmera.
   *
   * O Skia não redesenha porque a view voltou a aparecer: ele redesenha quando a
   * cena é reenviada ao nativo (`setJsiProperty("picture")`). Isso acontece por
   * dois caminhos — os children do `Canvas` mudarem de identidade (o React
   * Compiler memoiza os nossos, então isso não acontece sozinho) ou um shared
   * value observado mudar. Este é o segundo caminho: exatamente o mesmo que um
   * arrastar dispara, que é o que hoje faz o mapa voltar.
   *
   * `redraw()` do `useCanvasRef` NÃO serve: ele só pede à view que redesenhe a
   * picture que já tem.
   */
  const repintar = useCallback(() => {
    revisao.set(revisao.get() + 1);
  }, [revisao]);

  /** Converte um ponto da tela para pixels de arte do mapa (desfaz a transformação). */
  const paraMapa = (px: number, py: number) => ({
    x: (px - x.get()) / escala.get(),
    y: (py - y.get()) / escala.get(),
  });

  return { gesto, transformacao, paraMapa, repintar };
}
