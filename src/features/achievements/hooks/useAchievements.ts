import { useCallback, useState } from 'react';

import {
  anuncioAtual, concluirAnuncio, estadoInicial, registrarFatos, reiniciarConquistas,
  type Anuncio,
} from '../engine/estado';
import type { AchievementId, FatosDaJornada } from '../engine/regras';

export interface Conquistas {
  /** O que a jornada já conquistou. É isto, e só isto, que vai para o save. */
  desbloqueadas: readonly AchievementId[];
  /** O que o banner mostra agora. Efêmero: nunca é salvo. */
  anuncio: Anuncio | null;
  /**
   * Algo aconteceu na jornada: nasceu no mundo (o ponto de verdade é
   * `r.adicionados` do engine) ou a fase base terminou. Repetir um fato não faz nada.
   */
  registrarFatos: (fatos: FatosDaJornada) => void;
  /** O banner terminou de sair. */
  concluirAnuncio: (serie: number) => void;
  /** Jornada nova: apaga tudo, inclusive o que estava na fila. */
  reiniciar: () => void;
}

/**
 * Estado das conquistas enquanto o app está aberto.
 *
 * Não decide nada: cada ação é uma função pura de `engine/estado.ts`, aplicada
 * dentro do updater — duas chamadas seguidas nunca se atropelam, e o updater
 * pode rodar duas vezes em desenvolvimento sem efeito colateral.
 *
 * As três ações têm identidade fixa, para os efeitos da composição que
 * dependem delas não re-rodarem sem motivo.
 */
export function useAchievements(salvas?: readonly unknown[] | null): Conquistas {
  const [estado, setEstado] = useState(() => estadoInicial(salvas));

  const registrar = useCallback((fatos: FatosDaJornada) => {
    setEstado((atual) => registrarFatos(atual, fatos));
  }, []);

  const concluir = useCallback((serie: number) => {
    setEstado((atual) => concluirAnuncio(atual, serie));
  }, []);

  const reiniciar = useCallback(() => setEstado(reiniciarConquistas), []);

  return {
    desbloqueadas: estado.desbloqueadas,
    anuncio: anuncioAtual(estado),
    registrarFatos: registrar,
    concluirAnuncio: concluir,
    reiniciar,
  };
}
