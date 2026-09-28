// =====================================================================
// O TEMA EM USO — a preferência de aparência e as cores que os componentes leem.
// Os dois temas ficam em temas.ts, sem React, para serem testáveis.
// =====================================================================
import { useSyncExternalStore } from 'react';
import { useColorScheme } from 'react-native';

import {
  coresDoTema, estiloDaStatusBar, PREFERENCIA_PADRAO, resolverTema,
  type Colors, type TemaEfetivo, type ThemePreference,
} from './temas';

export type { Colors, TemaEfetivo, ThemePreference } from './temas';

// ---------------------------------------------------------------------
// A preferência (Automático / Claro / Escuro).
//
// Uma store minúscula em vez de Context: nada precisa envolver a árvore, e
// `useSyncExternalStore` re-renderiza só quem usa `useColors()`. Trocar de tema
// não toca no mundo, no Skia nem no feed — apenas repinta quem lê cor.
//
// Quem grava a escolha no aparelho é a composição (`persistence/preferencias`);
// aqui só fica o valor em uso.
// ---------------------------------------------------------------------

let preferencia: ThemePreference = PREFERENCIA_PADRAO;
const ouvintes = new Set<() => void>();

function inscrever(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

/** Troca a aparência na hora. Não grava — isso é com quem chamou. */
export function definirAparencia(nova: ThemePreference): void {
  if (nova === preferencia) return;
  preferencia = nova;
  for (const ouvinte of ouvintes) ouvinte();
}

export function usePreferenciaDeAparencia(): ThemePreference {
  return useSyncExternalStore(
    inscrever,
    () => preferencia,
    () => preferencia,
  );
}

/**
 * O tema na tela agora. Em Automático, acompanha o iOS ao vivo (`useColorScheme`
 * re-renderiza quando o sistema muda); em Claro ou Escuro, ignora o sistema.
 */
export function useTemaEfetivo(): TemaEfetivo {
  const escolha = usePreferenciaDeAparencia();
  const doSistema = useColorScheme();
  return resolverTema(escolha, doSistema === 'dark' || doSistema === 'light' ? doSistema : null);
}

/** Cores da interface no tema efetivo. */
export function useColors(): Colors {
  return coresDoTema(useTemaEfetivo());
}

/** Ícones da barra de status que leem sobre o fundo do tema efetivo. */
export function useEstiloDaStatusBar(): 'light' | 'dark' {
  return estiloDaStatusBar(useTemaEfetivo());
}
