import { useEffect, useRef } from 'react';
import {
  Easing, runOnJS, useSharedValue, withTiming, type SharedValue,
} from 'react-native-reanimated';

import { avisaFechado, planejarTransicao } from './navegacao';

/**
 * O progresso visual da navegação Mundo (0) ↔ Discovery (1).
 *
 * **Uma fonte de verdade para cada coisa:** o destino é o estado React `aberto`,
 * da composição; este shared value é só o CAMINHO visual até ele. Mundo,
 * Discovery e o seletor da ActionBar leem o mesmo valor — não existem três
 * animações que possam sair de sincronia.
 *
 * **Inversão no meio:** um destino novo substitui a animação em curso a partir
 * da posição atual. Nada de fila, bloqueio ou debounce — trinta toques seguidos
 * são só trinta substituições. A animação substituída termina com
 * `terminou === false`.
 *
 * **`onFechado` só depois de uma volta REAL ao Mundo que terminou.** Ele avisa
 * o mapa que ficou descoberto (a composição pede um `repintar()` ao Skia — a
 * correção do mapa em branco). Duas guardas, ambas herdadas do overlay:
 *
 * - sem mudança de direção, nada anima. Um `withTiming(0)` com o progresso já em
 *   0 terminaria com `terminou === true` e passaria por "fechamento concluído" —
 *   o callback fantasma de quando um render re-roda o efeito;
 * - o `destino` que o callback confere é o DESTA animação, não o do render atual.
 */
export function useProgressoDaNavegacao(aberto: boolean, onFechado?: () => void): SharedValue<number> {
  const progresso = useSharedValue(aberto ? 1 : 0);
  /** Direção mostrada por último. Só transição real move a animação. */
  const estavaAberto = useRef(aberto);

  useEffect(() => {
    const eraAberto = estavaAberto.current;
    estavaAberto.current = aberto;

    const plano = planejarTransicao(eraAberto, aberto, progresso.get());
    if (!plano) return;

    const { destino, duracao } = plano;
    progresso.set(
      withTiming(
        destino,
        {
          // Proporcional ao que falta: inverter no meio não fica mais lento.
          duration: duracao,
          // Sai rápido e desacelera ao chegar. Sem mola, sem quique.
          easing: Easing.out(Easing.cubic),
        },
        (terminou) => {
          'worklet';
          if (avisaFechado(terminou === true, destino) && onFechado) runOnJS(onFechado)();
        },
      ),
    );
  }, [aberto, onFechado, progresso]);

  return progresso;
}
