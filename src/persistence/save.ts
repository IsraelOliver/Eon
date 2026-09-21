// =====================================================================
// CONTRATO DO SAVE — o que é gravado no aparelho, e como se confere.
//
// Camada de composição, como `app/`: pode conhecer as duas features, e só
// `app/` e a infraestrutura de gravação (storage.ts) podem importá-la. Não fica
// em `shared/` porque lá nada pode importar `features/`.
// =====================================================================
import type { KnowledgeProfile } from '../features/learning/engine/types';
import type { WorldSnapshot } from '../features/world/engine/types';

/** Sobe quando o formato mudar. Migração só quando houver o que migrar. */
export const VERSAO_DO_SAVE = 1 as const;

/**
 * O mundo salvo. Só o que **não** dá para recalcular.
 *
 * Terreno, biomas, altitude, umidade, distâncias, natureza e as camadas de
 * pixels voltam de `gerarMundo(seed, nivelMar)`, que é determinístico. Câmera,
 * zoom, avisos e estado de telas são de sessão e não entram aqui.
 */
export type MundoSalvo = WorldSnapshot;

/** O que a pessoa aprendeu. O perfil já é dado puro e serializável. */
export interface AprendizadoSalvo {
  perfil: KnowledgeProfile;
}

export interface SaveV1 {
  version: typeof VERSAO_DO_SAVE;
  world: MundoSalvo;
  learning: AprendizadoSalvo;
}

/** Hoje só existe a V1; quando houver V2, isto vira uma união. */
export type SaveData = SaveV1;

// ---------------------------------------------------------------------
// Conferência do que veio do disco.
//
// O que está gravado pode ter sido escrito por uma versão antiga do app, ter
// sido truncado ou simplesmente não ser nosso. Nada aqui confia no arquivo: se
// algo não bater, o app começa um estado novo em vez de quebrar.
//
// Não é validação contra dado hostil — é contra dado velho ou corrompido. Por
// isso conferimos a forma, não cada coordenada de cada tile.
// ---------------------------------------------------------------------

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function ehInteiroNaoNegativo(v: unknown): boolean {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0;
}

/** Mapa de contagens (porTema, porTag, porInfluencia): objeto simples. */
function ehMapaDeNumeros(v: unknown): boolean {
  return ehObjeto(v) && Object.values(v).every((n) => typeof n === 'number');
}

function ehPerfil(v: unknown): boolean {
  if (!ehObjeto(v)) return false;
  return (
    Array.isArray(v.aprendidas) &&
    v.aprendidas.every((id) => typeof id === 'string') &&
    ehMapaDeNumeros(v.porTema) &&
    ehMapaDeNumeros(v.porTag) &&
    ehMapaDeNumeros(v.porInfluencia)
  );
}

/** Confere se o que veio do disco é um save V1 utilizável. */
export function ehSaveV1(valor: unknown): valor is SaveV1 {
  if (!ehObjeto(valor)) return false;
  if (valor.version !== VERSAO_DO_SAVE) return false;

  const world = valor.world;
  if (!ehObjeto(world)) return false;
  if (typeof world.seed !== 'number' || !Number.isFinite(world.seed)) return false;
  if (typeof world.nivelMar !== 'number' || !Number.isFinite(world.nivelMar)) return false;
  if (!ehInteiroNaoNegativo(world.growthSequence)) return false;
  if (!Array.isArray(world.crescimento) || !Array.isArray(world.settlements)) return false;

  const learning = valor.learning;
  if (!ehObjeto(learning) || !ehPerfil(learning.perfil)) return false;

  return true;
}
