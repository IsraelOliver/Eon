import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';

/** Distância da cápsula até a safe area de baixo. */
export const MARGEM_TAB_BAR = 12;
/** Altura aproximada da cápsula: as telas usam isso para não esconder conteúdo. */
export const ALTURA_TAB_BAR = 52;

export interface ItemDeNavegacao<T extends string> {
  chave: T;
  rotulo: string;
  icone: string;
}

type Props<T extends string> = {
  itens: readonly ItemDeNavegacao<T>[];
  ativo: T;
  onSelecionar: (chave: T) => void;
};

/**
 * Barra de navegação principal: uma cápsula flutuante, centralizada, que não
 * ocupa a largura da tela. O item ativo ganha uma cápsula interna.
 */
export function TabBar<T extends string>({ itens, ativo, onSelecionar }: Props<T>) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.area, { bottom: insets.bottom + MARGEM_TAB_BAR }]}>
      <View style={[styles.capsula, { backgroundColor: c.barra, borderColor: c.line }]}>
        {itens.map((item) => {
          const selecionado = item.chave === ativo;
          return (
            <Pressable
              key={item.chave}
              accessibilityRole="tab"
              accessibilityState={{ selected: selecionado }}
              accessibilityLabel={item.rotulo}
              onPress={() => onSelecionar(item.chave)}
              style={({ pressed }) => [
                styles.item,
                selecionado && { backgroundColor: c.barraAtivo },
                pressed && !selecionado && { opacity: 0.6 },
              ]}
            >
              <Text style={[styles.icone, { color: selecionado ? c.barraTextoAtivo : c.barraTexto }]}>
                {item.icone}
              </Text>
              <Text style={[styles.rotulo, { color: selecionado ? c.barraTextoAtivo : c.barraTexto }]}>
                {item.rotulo}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 30 },
  capsula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 5,
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  icone: { fontSize: 15 },
  rotulo: { fontSize: 15, fontWeight: '600' },
});
