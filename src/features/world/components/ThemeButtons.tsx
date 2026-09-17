import { StyleSheet, View } from 'react-native';

import { useColors, type Colors } from '@/shared/theme/colors';
import { Button } from '@/shared/ui/Button';

import type { ThemeKey } from '../engine/types';

type Props = {
  temas: { chave: ThemeKey; nome: string; quantidade: number }[];
  onAprender: (chave: ThemeKey) => void;
};

const COR_DO_TEMA: Record<ThemeKey, keyof Colors> = {
  astronomia: 'astro',
  historia: 'hist',
  geologia: 'geo',
  natureza: 'nat',
};

export function ThemeButtons({ temas, onAprender }: Props) {
  const c = useColors();
  return (
    <View style={styles.grade}>
      {temas.map((t) => (
        <Button
          key={t.chave}
          label={t.nome}
          badge={t.quantidade}
          color={c[COR_DO_TEMA[t.chave]]}
          swatch={c[COR_DO_TEMA[t.chave]]}
          onPress={() => onAprender(t.chave)}
          style={styles.celula}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  celula: { flexBasis: '45%', flexGrow: 1 },
});
