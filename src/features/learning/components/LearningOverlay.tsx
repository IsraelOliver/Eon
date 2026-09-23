import { useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing, Extrapolation, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming,
} from 'react-native-reanimated';

import { useColors } from '@/shared/theme/colors';

import type { LearningResult } from '../engine/types';
import type { Aprendizado } from '../hooks/useLearning';
import type { WorldPulseItem } from '../presentation/worldPulse';
import { LearningScreen } from './LearningScreen';

const ABRIR_MS = 320;
const FECHAR_MS = 240;

/** Raio do painel aberto. Fechado é maior porque a escala o encolhe junto. */
const RAIO_ABERTO = 30;
const RAIO_FECHADO = 64;

type Props = {
  aberto: boolean;
  /** Estado de aprendizagem da composição (o save precisa enxergá-lo). */
  aprendizado: Aprendizado;
  /** Ponto e tamanho do botão de onde o painel cresce (coordenadas da tela). */
  origem: { x: number; y: number; tamanho: number };
  onFechar: () => void;
  /**
   * Chamado quando a animação de fechar **termina** e o mapa está descoberto.
   * A composição usa isso para pedir ao mapa que reenvie a cena ao Skia.
   */
  onFechado?: () => void;
  /** Conhecimento novo registrado: a composição faz o mundo crescer. */
  onAprendido?: (resultado: LearningResult) => void;
  /** As configurações só abrem daqui — o mundo não tem botão para elas. */
  onConfiguracoes?: () => void;
  /**
   * O estado do World Pulse desta entrada, decidido pela composição. Passa por
   * aqui de mão em mão: `learning` mostra, mas não sabe de onde veio.
   */
  pulso?: WorldPulseItem | null;
};

/**
 * O feed como um aparelho que abre sobre o mapa: o botão cresce e vira o painel.
 *
 * Fica **sempre montado** — fechado, ele apenas some (opacidade 0, sem receber
 * toque). Assim o que já foi aprendido não se perde ao fechar, e o feed não
 * precisa ser medido de novo ao reabrir.
 *
 * A animação é só `transform` + `opacity`, num shared value só: nada de layout
 * durante o movimento.
 */
export function LearningOverlay({
  aberto, aprendizado, origem, onFechar, onFechado, onAprendido, onConfiguracoes,
  pulso,
}: Props) {
  const c = useColors();
  const tela = useWindowDimensions();
  const progresso = useSharedValue(aberto ? 1 : 0);
  /** Direção mostrada por último. Só transição real move a animação. */
  const estavaAberto = useRef(aberto);

  useEffect(() => {
    const eraAberto = estavaAberto.current;
    estavaAberto.current = aberto;

    /*
     * Sem mudança de direção, nada a fazer. Esta saída é o que impede um ciclo:
     * se o efeito re-rodar só porque uma prop trocou de identidade, ele não
     * anima — e sem animação não há callback, não há `onFechado`, não há novo
     * render. (Antes, um `withTiming(0)` com o progresso já em 0 terminava com
     * `finished === true` e passava por "fechamento concluído".)
     */
    if (eraAberto === aberto) return;

    const destino = aberto ? 1 : 0;
    progresso.set(
      withTiming(
        destino,
        { duration: aberto ? ABRIR_MS : FECHAR_MS, easing: Easing.out(Easing.cubic) },
        (terminou) => {
          'worklet';
          // `destino` é desta animação, não do render atual. Uma animação
          // substituída (o jogador inverteu no meio) chega com terminou=false.
          if (terminou && destino === 0 && onFechado) runOnJS(onFechado)();
        },
      ),
    );
  }, [aberto, onFechado, progresso]);

  // Escala inicial: o painel (do tamanho da tela) reduzido ao tamanho do botão.
  const escalaX = origem.tamanho / tela.width;
  const escalaY = origem.tamanho / tela.height;

  const painel = useAnimatedStyle(() => ({
    // some por completo só no fim do fechamento, para não piscar sobre o mapa
    opacity: interpolate(progresso.value, [0, 0.02], [0, 1], Extrapolation.CLAMP),
    borderRadius: interpolate(progresso.value, [0, 1], [RAIO_FECHADO, RAIO_ABERTO]),
    transform: [
      { scaleX: interpolate(progresso.value, [0, 1], [escalaX, 1]) },
      { scaleY: interpolate(progresso.value, [0, 1], [escalaY, 1]) },
    ],
  }));

  // O conteúdo entra depois, já perto do tamanho final: não se vê texto esticado.
  const conteudo = useAnimatedStyle(() => ({
    opacity: interpolate(progresso.value, [0.35, 0.85], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View
      pointerEvents={aberto ? 'auto' : 'none'}
      accessibilityElementsHidden={!aberto}
      importantForAccessibility={aberto ? 'auto' : 'no-hide-descendants'}
      style={StyleSheet.absoluteFill}
    >
      <Animated.View
        style={[
          styles.painel,
          { backgroundColor: c.fundoFeed, transformOrigin: [origem.x, origem.y, 0] },
          painel,
        ]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, conteudo]}>
          {/* "Ver no mundo" é o mesmo fechar de sempre: com animação. */}
          <LearningScreen
            aprendizado={aprendizado}
            onAprendido={onAprendido}
            onVerMundo={onFechar}
            onConfiguracoes={onConfiguracoes}
            pulso={pulso}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  painel: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
});
