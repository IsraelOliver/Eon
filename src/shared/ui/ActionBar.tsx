import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';

import type { Icon } from './icons';

/** Distância da cápsula até a safe area de baixo. */
export const MARGEM_ACTION_BAR = 12;

const PADDING = 5;
const GAP = 4;
const ITEM_LARGURA = 60;
const ITEM_ALTURA = 46;

/** Altura da cápsula. */
export const ALTURA_ACTION_BAR = ITEM_ALTURA + PADDING * 2;
/** Quanto a barra ocupa na borda de baixo, fora a safe area. */
export const ESPACO_ACTION_BAR = ALTURA_ACTION_BAR + MARGEM_ACTION_BAR;

export interface AcaoDaBarra {
  chave: string;
  icone: Icon;
  /** Lida pelo leitor de tela; a barra é só de ícones. */
  rotulo: string;
  onPress: () => void;
}

type Tela = { width: number; height: number };

/**
 * Centro de um item, em coordenadas da tela.
 * Serve para animações que precisam partir de um botão (ex.: o feed crescendo
 * do celular). Fica aqui porque é esta barra que decide o próprio layout.
 */
export function centroDoItem(indice: number, total: number, tela: Tela, insetBottom: number) {
  const largura = total * ITEM_LARGURA + (total - 1) * GAP + PADDING * 2;
  const esquerda = (tela.width - largura) / 2;
  return {
    x: esquerda + PADDING + indice * (ITEM_LARGURA + GAP) + ITEM_LARGURA / 2,
    y: tela.height - insetBottom - MARGEM_ACTION_BAR - ALTURA_ACTION_BAR / 2,
    tamanho: ITEM_ALTURA,
  };
}

/**
 * Barra de ações: uma cápsula flutuante, centralizada, que não ocupa a largura
 * da tela. Ela vale para o app inteiro, então fica acima de todas as camadas.
 *
 * `ativo` marca onde o jogador está (cápsula interna), quando isso faz sentido.
 */
export function ActionBar({ itens, ativo }: { itens: readonly AcaoDaBarra[]; ativo?: string }) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.area, { bottom: insets.bottom + MARGEM_ACTION_BAR }]}>
      <View style={[styles.capsula, { backgroundColor: c.barra, borderColor: c.line }]}>
        {itens.map((item) => {
          const selecionado = item.chave === ativo;
          return (
            <Pressable
              key={item.chave}
              accessibilityRole="button"
              accessibilityLabel={item.rotulo}
              accessibilityState={{ selected: selecionado }}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.item,
                selecionado && { backgroundColor: c.barraAtivo },
                pressed && !selecionado && { backgroundColor: c.barraPressionado },
              ]}
            >
              {typeof item.icone === 'string' ? (
                <Text style={[styles.icone, { color: selecionado ? c.barraTextoAtivo : c.barraTexto }]}>
                  {item.icone}
                </Text>
              ) : (
                <Image source={item.icone} style={styles.imagem} resizeMode="contain" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  capsula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
    padding: PADDING,
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  item: {
    width: ITEM_LARGURA,
    height: ITEM_ALTURA,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  icone: { fontSize: 22, lineHeight: 26 },
  imagem: { width: 26, height: 26 },
});
