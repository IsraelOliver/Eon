// =====================================================================
// PREFERÊNCIAS DO APLICATIVO — separadas da jornada, de propósito.
//
// A aparência (Automático / Claro / Escuro) é do APP, não do mundo: não entra
// no save da jornada, não sobe a versão dele e sobrevive a "Recomeçar jornada",
// que só mexe em `@eon/save`. Por isso tem chave própria.
// =====================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

import { lerPreferencia, type ThemePreference } from '../shared/theme/temas';

/** Único lugar onde a chave existe. Diferente da do save, e nunca apagada por ele. */
const CHAVE = '@eon/preferences';

export interface Preferencias {
  aparencia: ThemePreference;
}

/**
 * As preferências guardadas. Nunca lança: sem nada gravado, com conteúdo
 * estranho ou erro de leitura, volta ao padrão (Automático).
 */
export async function carregarPreferencias(): Promise<Preferencias> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE);
    const valor: unknown = bruto ? JSON.parse(bruto) : null;
    const aparencia =
      typeof valor === 'object' && valor !== null ? (valor as { aparencia?: unknown }).aparencia : undefined;
    return { aparencia: lerPreferencia(aparencia) };
  } catch {
    return { aparencia: lerPreferencia(undefined) };
  }
}

/**
 * Escritas em fila, como as do save: tocar Claro → Escuro → Claro rápido não
 * pode deixar a gravação do meio terminar por último e vencer.
 */
let fila: Promise<void> = Promise.resolve();

/** Grava as preferências. Falhar aqui não pode derrubar a interface. */
export function salvarPreferencias(preferencias: Preferencias): Promise<void> {
  fila = fila.then(async () => {
    try {
      await AsyncStorage.setItem(CHAVE, JSON.stringify(preferencias));
    } catch {
      // Sem gravar, a escolha vale até fechar o app — nada quebra.
    }
  });
  return fila;
}
