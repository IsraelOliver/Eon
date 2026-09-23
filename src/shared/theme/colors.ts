// =====================================================================
// O TEMA EM USO — a paleta ativa e as cores que os componentes leem.
// Os dados das paletas ficam em paletas.ts, sem React, para serem testáveis.
// =====================================================================
import { useSyncExternalStore } from 'react';
import { useColorScheme } from 'react-native';

import { PALETAS, PALETA_PADRAO, type Colors, type PaletteKey } from './paletas';

export { CHAVES_DE_PALETA, PALETAS, PALETA_PADRAO } from './paletas';
export type { Colors, Paleta, PaletteKey } from './paletas';

// ---------------------------------------------------------------------
// A escolha do momento.
//
// Uma store minúscula em vez de Context: nada precisa envolver a árvore, e
// `useSyncExternalStore` já re-renderiza quem usa `useColors()`. Some junto com
// o seletor quando a identidade final for decidida.
// ---------------------------------------------------------------------

let ativa: PaletteKey = PALETA_PADRAO;
const ouvintes = new Set<() => void>();

function inscrever(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

/** (dev) Troca a paleta na hora. Só apresentação: não toca em save nem no mundo. */
export function definirPaleta(chave: PaletteKey): void {
  if (chave === ativa) return;
  ativa = chave;
  for (const ouvinte of ouvintes) ouvinte();
}

export function usePaletaAtiva(): PaletteKey {
  return useSyncExternalStore(
    inscrever,
    () => ativa,
    () => ativa,
  );
}

/** Cores da interface: da paleta ativa e, só na Atual, do modo do sistema. */
export function useColors(): Colors {
  const paleta = PALETAS[usePaletaAtiva()];
  const escuro = useColorScheme() === 'dark';
  return paleta.seguirSistema && escuro ? paleta.escuro : paleta.claro;
}

/**
 * Estilo dos ícones da barra de status para a paleta ativa.
 * Na Atual continua `light`, como sempre foi: ali a barra fica sobre o mapa.
 */
export function useEstiloDaStatusBar(): 'light' | 'dark' {
  return PALETAS[usePaletaAtiva()].statusBar;
}
