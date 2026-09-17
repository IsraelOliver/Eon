import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/shared/theme/colors';
import { Button } from '@/shared/ui/Button';
import { FloatingButton } from '@/shared/ui/FloatingButton';
import { ICONS } from '@/shared/ui/icons';
import { Window } from '@/shared/ui/Window';

type Props = {
  onNovoMundo: () => void;
  devAtivo: boolean;
  /** Cada toque no enfeite do rodapé (5 seguidos alternam o modo desenvolvedor). */
  onToqueSecreto: () => void;
  /** Conteúdo da seção "Desenvolvedor", mostrado só com o modo ativo. */
  ferramentasDev: ReactNode;
};

/** Engrenagem (superior esquerdo) + janela "Configurações". */
export function SettingsMenu({ onNovoMundo, devAtivo, onToqueSecreto, ferramentasDev }: Props) {
  const c = useColors();
  const [aberto, setAberto] = useState(false);

  // Parece só um enfeite no rodapé da janela.
  const enfeite = (
    <Pressable onPress={onToqueSecreto} hitSlop={12} style={styles.enfeite} accessibilityLabel="Enfeite">
      <Text style={[styles.enfeiteTexto, { color: c.line }]}>✦</Text>
    </Pressable>
  );

  return (
    <>
      <FloatingButton icon={ICONS.gear} corner="top-left" accessibilityLabel="Abrir configurações" onPress={() => setAberto(true)} />
      <Window visible={aberto} title="Configurações" onClose={() => setAberto(false)} footer={enfeite}>
        <Button
          label="Novo mundo"
          onPress={() => {
            setAberto(false);
            onNovoMundo();
          }}
        />
        {devAtivo && (
          <View style={[styles.secao, { borderTopColor: c.line }]}>
            <Text style={[styles.subtitulo, { color: c.ink }]} accessibilityRole="header">
              Desenvolvedor
            </Text>
            {ferramentasDev}
          </View>
        )}
      </Window>
    </>
  );
}

const styles = StyleSheet.create({
  secao: { gap: 12, borderTopWidth: 1, paddingTop: 12 },
  subtitulo: { fontSize: 18, fontWeight: '600' },
  enfeite: { alignSelf: 'center' },
  enfeiteTexto: { fontSize: 12 },
});
