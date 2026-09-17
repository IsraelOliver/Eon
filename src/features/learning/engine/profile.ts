// =====================================================================
// PERFIL DE CONHECIMENTO — funções puras
// Recebem o perfil atual e devolvem um novo, sem alterar o anterior.
// =====================================================================
import type { Curiosity, KnowledgeProfile, LearningResult } from './types';

export function criarPerfilVazio(): KnowledgeProfile {
  return {
    aprendidas: [],
    porTema: { astronomia: 0, historia: 0, geologia: 0, natureza: 0 },
    porTag: {},
    porInfluencia: {},
  };
}

/** Registra a curiosidade como aprendida. A mesma curiosidade só dá progresso uma vez. */
export function registrarAprendizado(perfil: KnowledgeProfile, curiosidade: Curiosity): LearningResult {
  const { id, tema, tags, influencias } = curiosidade;

  if (perfil.aprendidas.includes(id)) {
    return { status: 'repetida', perfil, curiosidadeId: id };
  }

  const porTag = { ...perfil.porTag };
  for (const tag of new Set(tags)) porTag[tag] = (porTag[tag] ?? 0) + 1; // tag repetida conta uma vez

  const porInfluencia = { ...perfil.porInfluencia };
  for (const { chave, peso } of influencias) porInfluencia[chave] = (porInfluencia[chave] ?? 0) + peso;

  return {
    status: 'aprendida',
    perfil: {
      aprendidas: [...perfil.aprendidas, id],
      porTema: { ...perfil.porTema, [tema]: perfil.porTema[tema] + 1 },
      porTag,
      porInfluencia,
    },
    curiosidadeId: id,
    tema,
    influencias,
  };
}
