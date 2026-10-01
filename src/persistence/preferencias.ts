// =====================================================================
// PREFERÊNCIAS DO APLICATIVO — separadas da jornada, de propósito.
//
// A aparência (Automático / Claro / Escuro) é do APP, não do mundo: não entra
// no save da jornada, não sobe a versão dele e sobrevive a "Recomeçar jornada",
// que só mexe em `@eon/save`. Por isso tem chave própria.
//
// Aqui também mora a memória das ABERTURAS do app (a ordem do Discovery muda a
// cada abertura real): também é do app, não da jornada.
// =====================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

import { lerPreferencia, type ThemePreference } from '../shared/theme/temas';

/** Único lugar onde a chave existe. Diferente da do save, e nunca apagada por ele. */
const CHAVE = '@eon/preferences';

export interface Preferencias {
  aparencia: ThemePreference;
  /** Quantas vezes o app já abriu de verdade. A ordem do Discovery sai daqui. */
  discoveryLaunchSequence: number;
  /** A curiosidade que abriu o Discovery na última sessão (para não repetir). */
  ultimaCuriosidadeInicialId: string | null;
}

const PADRAO: Preferencias = {
  aparencia: lerPreferencia(undefined),
  discoveryLaunchSequence: 0,
  ultimaCuriosidadeInicialId: null,
};

/**
 * O que está gravado agora (ou o padrão). As gravações MESCLAM com isto: trocar
 * a aparência não pode apagar o contador de aberturas, e vice-versa.
 */
let atuais: Preferencias = PADRAO;

/** Confere o que veio do disco, campo a campo; o que estiver estranho vira o padrão. */
function ler(valor: unknown): Preferencias {
  if (typeof valor !== 'object' || valor === null) return PADRAO;
  const v = valor as Record<string, unknown>;
  const sequencia = v.discoveryLaunchSequence;
  return {
    aparencia: lerPreferencia(v.aparencia),
    discoveryLaunchSequence:
      typeof sequencia === 'number' && Number.isInteger(sequencia) && sequencia >= 0 ? sequencia : 0,
    ultimaCuriosidadeInicialId: typeof v.ultimaCuriosidadeInicialId === 'string' ? v.ultimaCuriosidadeInicialId : null,
  };
}

/**
 * As preferências guardadas. Nunca lança: sem nada gravado, com conteúdo
 * estranho ou erro de leitura, volta ao padrão (Automático, nenhuma abertura).
 */
export async function carregarPreferencias(): Promise<Preferencias> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE);
    atuais = ler(bruto ? JSON.parse(bruto) : null);
  } catch {
    atuais = PADRAO;
  }
  return atuais;
}

/**
 * Escritas em fila, como as do save: tocar Claro → Escuro → Claro rápido não
 * pode deixar a gravação do meio terminar por último e vencer.
 */
let fila: Promise<void> = Promise.resolve();

/**
 * Grava uma ou mais preferências, mesclando com as outras. Falhar aqui não pode
 * derrubar a interface.
 */
export function salvarPreferencias(mudancas: Partial<Preferencias>): Promise<void> {
  atuais = { ...atuais, ...mudancas };
  const paraGravar = atuais;
  fila = fila.then(async () => {
    try {
      await AsyncStorage.setItem(CHAVE, JSON.stringify(paraGravar));
    } catch {
      // Sem gravar, a escolha vale até fechar o app — nada quebra.
    }
  });
  return fila;
}
