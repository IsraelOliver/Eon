import { useState } from 'react';

import { CURIOSIDADES_DE_TESTE } from '../data/fixtures';
import { criarPerfilVazio, registrarAprendizado } from '../engine/profile';
import type { Curiosity, CuriosityId, KnowledgeProfile, LearningResult } from '../engine/types';

/** O que a interface precisa para mostrar e registrar aprendizado. */
export interface Aprendizado {
  curiosidades: readonly Curiosity[];
  perfil: KnowledgeProfile;
  jaAprendeu: (id: CuriosityId) => boolean;
  aprender: (curiosidade: Curiosity) => LearningResult;
}

/**
 * Estado de aprendizagem: o perfil vive aqui enquanto o app está aberto.
 *
 * `perfilInicial` vem do save quando existe um. O objeto recebido não é
 * alterado: `registrarAprendizado` é puro e sempre devolve um perfil novo.
 *
 * Quem decide se uma curiosidade dá progresso continua sendo o engine
 * (`registrarAprendizado`): aqui só se guarda o perfil que ele devolve.
 */
export function useLearning(perfilInicial?: KnowledgeProfile | null): Aprendizado {
  const [perfil, setPerfil] = useState<KnowledgeProfile>(() => perfilInicial ?? criarPerfilVazio());
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
