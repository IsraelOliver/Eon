import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { useColors } from '@/shared/theme/colors';
import { deslocamentoDoDiscovery } from '@/shared/ui/navegacao';

import type { LearningResult } from '../engine/types';
import type { Aprendizado } from '../hooks/useLearning';
import type { WorldPulseItem } from '../presentation/worldPulse';
import { LearningScreen } from './LearningScreen';

type Props = {
  /** O DESTINO lógico. É ele que decide quem recebe toque. */
  aberto: boolean;
  /**
   * O caminho visual até o destino (0 = Mundo, 1 = Discovery). Vem da
   * composição, que o divide com o Mundo e com o seletor da ActionBar.
   */
  progresso: SharedValue<number>;
  /** Estado de aprendizagem da composição (o save precisa enxergá-lo). */
  aprendizado: Aprendizado;
  onFechar: () => void;
  /** Conhecimento novo registrado: a composição faz o mundo crescer. */
  onAprendido?: (resultado: LearningResult) => void;
  /** As configurações só abrem daqui — o mundo não tem botão para elas. */
  onConfiguracoes?: () => void;
  /**
   * O estado do World Pulse desta entrada, decidido pela composição. Passa por
   * aqui de mão em mão: `learning` mostra, mas não sabe de onde veio.
   */
  pulso?: WorldPulseItem | null;
  /**
   * Muda de valor quando a pessoa toca de novo no Discovery já aberto: o feed
   * rola até o topo. `learning` não sabe que foi a ActionBar.
   */
  voltarAoTopo?: number;
  /** A ordem do feed nesta sessão (ids), decidida pela composição. Só passa adiante. */
  ordem?: readonly string[];
};

/**
 * O Discovery como a página vizinha do Mundo: ele espera à direita e desliza
 * por cima quando a pessoa vai aprender.
 *
 * Fica **sempre montado** — fechado, apenas espera fora da tela, sem receber
 * toque. Assim a posição do feed sobrevive às idas e vindas, nada é medido de
 * novo, e nenhum ciclo de vida é disparado à toa.
 *
 * Não anima nada sozinho: só LÊ o progresso. A animação (e a guarda do
 * `onFechado`) mora em `useProgressoDaNavegacao`, na composição. A transição é
 * só `transform`: nada de layout durante o movimento.
 */
export function LearningOverlay({
  aberto, progresso, aprendizado, onFechar, onAprendido, onConfiguracoes, pulso, voltarAoTopo, ordem,
}: Props) {
  const c = useColors();
  const tela = useWindowDimensions();
  const largura = tela.width;

  const deslize = useAnimatedStyle(() => ({
    transform: [{ translateX: deslocamentoDoDiscovery(progresso.value, largura) }],
  }));

  return (
    <Animated.View
      // O destino recebe o toque; a outra página, nunca. Nunca as duas ao mesmo tempo.
      pointerEvents={aberto ? 'auto' : 'none'}
      accessibilityElementsHidden={!aberto}
      importantForAccessibility={aberto ? 'auto' : 'no-hide-descendants'}
      style={[StyleSheet.absoluteFill, { backgroundColor: c.fundoFeed }, deslize]}
    >
      {/* "Ver no mundo" é o mesmo voltar de sempre: com a mesma animação. */}
      <LearningScreen
        aprendizado={aprendizado}
        onAprendido={onAprendido}
        onVerMundo={onFechar}
        onConfiguracoes={onConfiguracoes}
        pulso={pulso}
        voltarAoTopo={voltarAoTopo}
        ordem={ordem}
        visivel={aberto}
      />
    </Animated.View>
  );
}
