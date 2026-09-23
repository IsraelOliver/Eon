// =====================================================================
// CONTRATO DO SAVE — o que é gravado no aparelho, e como se confere.
//
// Camada de composição, como `app/`: pode conhecer todas as features, e só
// `app/` e a infraestrutura de gravação (storage.ts) podem importá-la. Não fica
// em `shared/` porque lá nada pode importar `features/`.
// =====================================================================
import type { ConquistasSalvas } from '../features/achievements/engine/estado';
import { conquistasAlcancadas } from '../features/achievements/engine/regras';
import type { KnowledgeProfile } from '../features/learning/engine/types';
import { assuntoDeCrescimento } from '../features/world/engine/destaque';
import type { WorldSnapshot } from '../features/world/engine/types';

/** Versão do formato gravado hoje. Sobe quando o formato muda. */
export const VERSAO_DO_SAVE = 3 as const;

/**
 * O mundo salvo. Só o que **não** dá para recalcular.
 *
 * Terreno, biomas, altitude, umidade, distâncias, natureza e as camadas de
 * pixels voltam de gerarMundo(seed, nivelMar), que é determinístico. Câmera,
 * zoom, avisos e estado de telas são de sessão e não entram aqui.
 */
export type MundoSalvo = WorldSnapshot;

/** O que a pessoa aprendeu. O perfil já é dado puro e serializável. */
export interface AprendizadoSalvo {
  perfil: KnowledgeProfile;
}

/** Formato antigo. Ainda é lido: `migrarParaAtual` converte até a atual. */
export interface SaveV1 {
  version: 1;
  world: MundoSalvo;
  learning: AprendizadoSalvo;
}

export interface SaveV2 {
  version: 2;
  world: MundoSalvo;
  learning: AprendizadoSalvo;
  /**
   * A jornada já passou pela apresentação de boas-vindas?
   * Pertence à jornada, não à semente: trocar de mundo antes de aprender não
   * mexe nisto, mas recomeçar a jornada volta para `false`.
   */
  onboardingConcluida: boolean;
}

export interface SaveV3 {
  version: 3;
  world: MundoSalvo;
  learning: AprendizadoSalvo;
  onboardingConcluida: boolean;
  /**
   * As conquistas da jornada: só as **desbloqueadas**. O que o banner está
   * anunciando agora é de sessão e nunca vem para cá — por isso abrir o app não
   * anuncia de novo uma conquista antiga.
   */
  achievements: ConquistasSalvas;
}

/** O formato atual. Quem escreve código novo usa este. */
export type SaveData = SaveV3;

// ---------------------------------------------------------------------
// O que é seguro gravar.
// ---------------------------------------------------------------------

export interface DecisaoDeSave {
  /** O último estado coerente. É o que o app grava se sair de cena agora. */
  seguro: SaveData;
  /** Gravar já? Só quando o estado está coerente. */
  gravar: boolean;
}

/**
 * Decide o que fazer com o estado atual.
 *
 * Enquanto o mundo está sendo recriado, o estado é incoerente **de propósito**:
 * ao recomeçar a jornada o conhecimento já foi apagado, mas o mundo antigo
 * ainda não foi trocado. Gravar esse meio do caminho deixaria no disco uma
 * jornada que nunca existiu — conhecimento vazio com uma civilização inteira,
 * ou o contrário.
 *
 * Então, durante a recriação, o último save seguro **não avança**: ele continua
 * apontando para a jornada coerente anterior, e é ela que vai para o disco se o
 * app for fechado no meio.
 */
export function decidirSave(atual: SaveData, seguroAnterior: SaveData, gerando: boolean): DecisaoDeSave {
  if (gerando) return { seguro: seguroAnterior, gravar: false };
  return { seguro: atual, gravar: true };
}

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

/** Mundo e aprendizado: a parte que não mudou entre as versões. */
function temCorpoValido(valor: Record<string, unknown>): boolean {
  const world = valor.world;
  if (!ehObjeto(world)) return false;
  if (typeof world.seed !== 'number' || !Number.isFinite(world.seed)) return false;
  if (typeof world.nivelMar !== 'number' || !Number.isFinite(world.nivelMar)) return false;
  if (!ehInteiroNaoNegativo(world.growthSequence)) return false;
  if (!Array.isArray(world.crescimento) || !Array.isArray(world.settlements)) return false;

  const learning = valor.learning;
  return ehObjeto(learning) && ehPerfil(learning.perfil);
}

/** Confere se o que veio do disco é um save V1 (o formato antigo). */
export function ehSaveV1(valor: unknown): valor is SaveV1 {
  return ehObjeto(valor) && valor.version === 1 && temCorpoValido(valor);
}

/** Confere se o que veio do disco é um save V2 utilizável. */
export function ehSaveV2(valor: unknown): valor is SaveV2 {
  if (!ehObjeto(valor) || valor.version !== 2) return false;
  if (typeof valor.onboardingConcluida !== 'boolean') return false;
  return temCorpoValido(valor);
}

/**
 * Confere se o que veio do disco é um save V3 utilizável.
 *
 * Das conquistas confere só a forma (lista de textos). Um id que esta versão
 * não conhece não invalida o save inteiro: quem o descarta é `estadoInicial`,
 * na hidratação — melhor perder uma conquista estranha do que a jornada toda.
 */
export function ehSaveV3(valor: unknown): valor is SaveV3 {
  if (!ehObjeto(valor) || valor.version !== 3) return false;
  if (typeof valor.onboardingConcluida !== 'boolean') return false;
  const conquistas = valor.achievements;
  if (!ehObjeto(conquistas) || !Array.isArray(conquistas.desbloqueadas)) return false;
  if (!conquistas.desbloqueadas.every((id) => typeof id === 'string')) return false;
  return temCorpoValido(valor);
}

/**
 * V1 → V2. A V1 não guardava se a apresentação da jornada já tinha sido vista,
 * então deduzimos pelo que ela guardava: **quem já aprendeu alguma coisa já
 * começou a jornada** e não deve ver a apresentação de novo. Save antigo com
 * perfil vazio volta a vê-la, que é o comportamento certo para quem ainda não
 * começou.
 */
export function migrarV1(antigo: SaveV1): SaveV2 {
  return {
    version: 2,
    world: antigo.world,
    learning: antigo.learning,
    onboardingConcluida: antigo.learning.perfil.aprendidas.length > 0,
  };
}

/**
 * V2 → V3. A V2 não guardava conquistas, mas guardava o mundo — e é pelo mundo
 * que deduzimos o que já foi conquistado: quem já tem uma casa já passou pela
 * primeira casa. Todo o crescimento salvo conta como "o que já nasceu".
 *
 * A conquista migrada entra **desbloqueada e sem anúncio**: ela aconteceu antes
 * desta versão existir, e anunciá-la ao abrir o app seria mentir o momento.
 */
export function migrarV2(antigo: SaveV2): SaveV3 {
  const jaNasceu = antigo.world.crescimento.map(assuntoDeCrescimento);
  return {
    ...antigo,
    version: 3,
    achievements: { desbloqueadas: conquistasAlcancadas(jaNasceu, []) },
  };
}

/**
 * O que veio do disco, no formato atual — ou `null` se não for utilizável.
 * É aqui que entram as migrações quando a versão sobe; elas se encadeiam, então
 * um save V1 passa pela V2 antes de chegar à V3.
 */
export function migrarParaAtual(valor: unknown): SaveData | null {
  if (ehSaveV3(valor)) return valor;
  if (ehSaveV2(valor)) return migrarV2(valor);
  if (ehSaveV1(valor)) return migrarV2(migrarV1(valor));
  return null;
}
