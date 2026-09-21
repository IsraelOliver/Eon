import { useState } from 'react';

import { CURIOSIDADES_DE_TESTE } from '../data/fixtures';
import { criarPerfilVazio, registrarAprendizado } from '../engine/profile';
import type { Curiosity, CuriosityId, LearningResult } from '../engine/types';

/**
 * Estado de aprendizagem da sessão: o perfil vive aqui, em memória, enquanto o
 * app estiver aberto (nada de persistência ainda).
 *
 * Quem decide se uma curiosidade dá progresso continua sendo o engine
 * (`registrarAprendizado`): aqui só se guarda o perfil que ele devolve.
 */
export function useLearning() {
  const [perfil, setPerfil] = useState(criarPerfilVazio);
  const aprendidas = new Set<CuriosityId>(perfil.aprendidas);

  return {
    /** Por enquanto, as curiosidades fictícias de data/fixtures.ts. */
    curiosidades: CURIOSIDADES_DE_TESTE as readonly Curiosity[],
    perfil,
    jaAprendeu: (id: CuriosityId) => aprendidas.has(id),
    aprender(curiosidade: Curiosity): LearningResult {
      const resultado = registrarAprendizado(perfil, curiosidade);
      setPerfil(resultado.perfil); // em 'repetida' é o mesmo perfil: nada muda
      return resultado;
    },
  };
}
