import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/shared/ui/Button';
import { FloatingButton } from '@/shared/ui/FloatingButton';
import { ICONS } from '@/shared/ui/icons';
import { Window } from '@/shared/ui/Window';

import type { ThemeKey } from '../engine/types';
import { ThemeButtons } from './ThemeButtons';

type Props = {
  temas: { chave: ThemeKey; nome: string; quantidade: number }[];
  onAprender: (chave: ThemeKey) => void;
  onEsquecer: () => void;
  onRevisar: () => void;
};

/** Botão de menu (inferior esquerdo) + janela "Aprender". Cada ação fecha a janela. */
export function LearnMenu({ temas, onAprender, onEsquecer, onRevisar }: Props) {
  const [aberto, setAberto] = useState(false);
  // Fecha a janela e executa a ação, para o jogador ver o resultado no mapa.
  const fecharEFazer = (acao: () => void) => {
    setAberto(false);
    acao();
  };

  return (
    <>
      <FloatingButton icon={ICONS.menu} corner="bottom-left" accessibilityLabel="Abrir menu" onPress={() => setAberto(true)} />
      <Window visible={aberto} title="Aprender" onClose={() => setAberto(false)}>
        <ThemeButtons temas={temas} onAprender={(chave) => fecharEFazer(() => onAprender(chave))} />
        <View style={styles.linha}>
          <Button label="Ficar 3 dias sem revisar" onPress={() => fecharEFazer(onEsquecer)} style={styles.flex} />
          <Button label="Revisar agora" onPress={() => fecharEFazer(onRevisar)} style={styles.flex} />
        </View>
      </Window>
    </>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
});
