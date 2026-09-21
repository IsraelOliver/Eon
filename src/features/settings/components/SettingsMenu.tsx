import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/shared/theme/colors';
import { Button } from '@/shared/ui/Button';
import { Window } from '@/shared/ui/Window';

type Props = {
  /** Quem abre é a barra de ações, na composição. */
  aberto: boolean;
  onFechar: () => void;
  onNovoMundo: () => void;
  devAtivo: boolean;
  /** Cada toque no enfeite do rodapé (5 seguidos alternam o modo desenvolvedor). */
  onToqueSecreto: () => void;
  /** Conteúdo da seção "Desenvolvedor", mostrado só com o modo ativo. */
  ferramentasDev: ReactNode;
};

/** Janela "Configurações". O botão que a abre vive na barra de ações. */
export function SettingsMenu({ aberto, onFechar, onNovoMundo, devAtivo, onToqueSecreto, ferramentasDev }: Props) {
  const c = useColors();

  // Parece só um enfeite no rodapé da janela.
  const enfeite = (
    <Pressable onPress={onToqueSecreto} hitSlop={12} style={styles.enfeite} accessibilityLabel="Enfeite">
      <Text style={[styles.enfeiteTexto, { color: c.line }]}>✦</Text>
    </Pressable>
  );

  return (
    <Window visible={aberto} title="Configurações" onClose={onFechar} footer={enfeite}>
      <Button
        label="Novo mundo"
        onPress={() => {
          onFechar();
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
  );
}

const styles = StyleSheet.create({
  secao: { gap: 12, borderTopWidth: 1, paddingTop: 12 },
  subtitulo: { fontSize: 18, fontWeight: '600' },
  enfeite: { alignSelf: 'center' },
  enfeiteTexto: { fontSize: 12 },
});
