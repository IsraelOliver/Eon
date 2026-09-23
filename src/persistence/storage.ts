// =====================================================================
// GRAVAÇÃO — o único lugar que fala com o armazenamento do aparelho.
// Nenhum componente importa AsyncStorage: todos passam por aqui.
// =====================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

import { migrarParaAtual, type SaveData } from './save';

/** Único lugar onde a chave existe. Trocá-la é começar do zero. */
const CHAVE = '@eon/save';

/**
 * Escritas em fila.
 *
 * `AsyncStorage.setItem` é assíncrono: dois saves disparados em sequência
 * poderiam terminar fora de ordem e o estado antigo venceria. Encadear garante
 * que terminem na ordem em que foram pedidos.
 */
let fila: Promise<void> = Promise.resolve();

/**
 * O save guardado, ou `null` quando não há nenhum, o conteúdo não é nosso, está
 * corrompido ou é de uma versão que este app não conhece.
 *
 * Nunca lança: em qualquer um desses casos o app começa um estado novo. Saves
 * de formatos antigos são convertidos por `migrarParaAtual`; versão que nem a
 * migração conhece é tratada como ausência de save.
 */
export async function carregarSave(): Promise<SaveData | null> {
  try {
    const texto = await AsyncStorage.getItem(CHAVE);
    if (texto === null) return null; // primeira vez no aparelho

    const valor: unknown = JSON.parse(texto);
    const save = migrarParaAtual(valor); // converte formatos antigos
    if (save === null) {
      console.warn('[eon] Save ignorado: formato inválido ou versão desconhecida.');
      return null;
    }
    return save;
  } catch (erro) {
    console.warn('[eon] Não foi possível ler o save:', erro);
    return null;
  }
}

/**
 * Grava o save. Não bloqueia a interface e não lança: se a gravação falhar, o
 * jogo continua com o estado que está na memória.
 */
export function salvarSave(save: SaveData): Promise<void> {
  fila = fila.then(async () => {
    try {
      await AsyncStorage.setItem(CHAVE, JSON.stringify(save));
    } catch (erro) {
      console.warn('[eon] Não foi possível gravar o save:', erro);
    }
  });
  return fila;
}

/** Apaga o save. Hoje só serve a ferramentas de desenvolvimento e testes. */
export async function apagarSave(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHAVE);
  } catch (erro) {
    console.warn('[eon] Não foi possível apagar o save:', erro);
  }
}
