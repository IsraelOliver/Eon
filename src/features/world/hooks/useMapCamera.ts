import { useCallback, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  Easing, cancelAnimation, runOnJS, useDerivedValue, useSharedValue, withDecay, withTiming,
} from 'react-native-reanimated';

const ZOOM_MAXIMO = 8; // em relação ao zoom mínimo

/** Quanto a câmera aproxima ao ir ver uma novidade (múltiplo do zoom mínimo). */
const ZOOM_DO_FOCO = 3;
const DURACAO_DO_FOCO = 650; // ms

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
export function useMapCamera(largura: number, altura: number, aoMover?: () => void) {
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

  /*
   * Avisa (uma vez, no início do gesto) que o mapa vai se mexer. O gesto em si
   * continua na thread de UI — só este aviso cruza para o JS, porque quem ouve
   * é estado do React.
   */
  const avisarMovimento = () => {
    'worklet';
    if (aoMover) runOnJS(aoMover)();
  };

  const arrastar = Gesture.Pan()
    .maxPointers(1)
    .onBegin(() => {
      'worklet';
      pararInercia();
      avisarMovimento();
    })
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
      avisarMovimento();
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

  /**
   * Leva a câmera até um ponto do mapa (em pixels de arte), com aproximação.
   *
   * Anima em vez de pular: o jogador precisa entender que o mundo é o mesmo e
   * que ALGO ali mudou. Os limites são calculados com o zoom de destino, então
   * o ponto final respeita as bordas.
   */
  const focarEm = useCallback(
    (artX: number, artY: number) => {
      const destinoZoom = Math.min(zoomMax, zoomMin * ZOOM_DO_FOCO);
      const lx = limites(tela.width, largura * destinoZoom);
      const ly = limites(tela.height, altura * destinoZoom);
      const destinoX = prender(tela.width / 2 - artX * destinoZoom, lx);
      const destinoY = prender(tela.height / 2 - artY * destinoZoom, ly);

      cancelAnimation(x); // qualquer inércia em curso perde a vez
      cancelAnimation(y);
      const suave = { duration: DURACAO_DO_FOCO, easing: Easing.inOut(Easing.cubic) };
      escala.set(withTiming(destinoZoom, suave));
      x.set(withTiming(destinoX, suave));
      y.set(withTiming(destinoY, suave));
    },
    [tela.width, tela.height, largura, altura, zoomMin, zoomMax, escala, x, y],
  );

  /** Pixels de arte → coordenadas da tela, com a câmera de AGORA. */
  const paraTela = (artX: number, artY: number) => ({
    x: x.get() + artX * escala.get(),
    y: y.get() + artY * escala.get(),
  });

  /** Converte um ponto da tela para pixels de arte do mapa (desfaz a transformação). */
  const paraMapa = (px: number, py: number) => ({
    x: (px - x.get()) / escala.get(),
    y: (py - y.get()) / escala.get(),
  });

  return { gesto, transformacao, paraMapa, paraTela, repintar, focarEm };
}
