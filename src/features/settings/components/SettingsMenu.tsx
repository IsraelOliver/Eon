import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/shared/theme/colors';
import { Button } from '@/shared/ui/Button';
import { Window } from '@/shared/ui/Window';

type Props = {
  /** Quem abre é a barra de ações, na composição. */
  aberto: boolean;
  onFechar: () => void;
  /**
   * Gerar outro mundo mantendo o resto. Só existe **antes** da primeira
   * curiosidade aprendida: depois disso o mundo é a jornada da pessoa, e a
   * composição deixa de passar esta ação.
   */
  onNovoMundo?: () => void;
  /** Apaga mundo e conhecimento juntos, e começa outra jornada. */
  onRecomecarJornada: () => void;
  devAtivo: boolean;
  /** Cada toque no enfeite do rodapé (5 seguidos alternam o modo desenvolvedor). */
  onToqueSecreto: () => void;
  /** Conteúdo da seção "Desenvolvedor", mostrado só com o modo ativo. */
  ferramentasDev: ReactNode;
};

/** Janela "Configurações". O botão que a abre vive na barra de ações. */
export function SettingsMenu({
  aberto, onFechar, onNovoMundo, onRecomecarJornada, devAtivo, onToqueSecreto, ferramentasDev,
}: Props) {
  const c = useColors();
  const [confirmando, setConfirmando] = useState(false);

  // Fechar e reabrir a janela nunca deve cair direto na confirmação.
  useEffect(() => {
    if (!aberto) setConfirmando(false);
  }, [aberto]);

  // Parece só um enfeite no rodapé da janela.
  const enfeite = (
    <Pressable onPress={onToqueSecreto} hitSlop={12} style={styles.enfeite} accessibilityLabel="Enfeite">
      <Text style={[styles.enfeiteTexto, { color: c.line }]}>✦</Text>
    </Pressable>
  );

  if (confirmando) {
    return (
      <Window visible={aberto} title="Recomeçar jornada?" onClose={onFechar} footer={enfeite}>
        <Text style={[styles.texto, { color: c.ink }]}>Você já começou a construir este mundo.</Text>
        <Text style={[styles.texto, { color: c.ink }]}>
          Ao recomeçar, este mundo, tudo que foi construído nele e tudo que você aprendeu nesta
          jornada serão apagados.
        </Text>
        <Text style={[styles.texto, { color: c.muted }]}>Não dá para desfazer.</Text>
        <View style={styles.linha}>
          <Button label="Cancelar" onPress={() => setConfirmando(false)} style={styles.flex} />
          <Button
            label="Recomeçar"
            variant="destructive"
            onPress={() => {
              setConfirmando(false);
              onFechar();
              onRecomecarJornada();
            }}
            style={styles.flex}
          />
        </View>
      </Window>
    );
  }

  return (
    <Window visible={aberto} title="Configurações" onClose={onFechar} footer={enfeite}>
      {onNovoMundo && (
        <Button
          label="Novo mundo"
          onPress={() => {
            onFechar();
            onNovoMundo();
          }}
        />
      )}

      {devAtivo && (
        <View style={[styles.secao, { borderTopColor: c.line }]}>
          <Text style={[styles.subtitulo, { color: c.ink }]} accessibilityRole="header">
            Desenvolvedor
          </Text>
          {ferramentasDev}
        </View>
      )}

      {/* Longe dos controles do dia a dia, para ninguém tocar sem querer. */}
      {!onNovoMundo && (
        <View style={[styles.secao, styles.perigo, { borderTopColor: c.line }]}>
          <Text style={[styles.subtitulo, { color: c.ink }]} accessibilityRole="header">
            Zona de perigo
          </Text>
          <Text style={[styles.texto, { color: c.muted }]}>
            Começar outro mundo significa deixar para trás este e tudo que você aprendeu aqui.
          </Text>
          <Button label="Recomeçar jornada" variant="destructive" onPress={() => setConfirmando(true)} />
        </View>
      )}
    </Window>
  );
}

const styles = StyleSheet.create({
  secao: { gap: 12, borderTopWidth: 1, paddingTop: 12 },
  perigo: { marginTop: 12 },
  subtitulo: { fontSize: 18, fontWeight: '600' },
  texto: { fontSize: 15, lineHeight: 21 },
  linha: { flexDirection: 'row', gap: 8, marginTop: 4 },
  flex: { flex: 1 },
  enfeite: { alignSelf: 'center' },
  enfeiteTexto: { fontSize: 12 },
});
