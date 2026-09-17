import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/shared/theme/colors';

import { Button } from './Button';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Janela centralizada (~80% da tela) sobre um fundo escurecido, com fade.
 * Fecha ao tocar fora, no botão "Fechar" ou no gesto de voltar (Android).
 */
export function Window({ visible, title, onClose, children }: Props) {
  const c = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.centro}>
        <Pressable style={[StyleSheet.absoluteFill, styles.fundo]} onPress={onClose} accessibilityLabel="Fechar janela" />
        <View style={[styles.janela, { backgroundColor: c.panel, borderColor: c.ink }]} accessibilityViewIsModal>
          <Text style={[styles.titulo, { color: c.ink }]} accessibilityRole="header">
            {title}
          </Text>
          <ScrollView style={styles.conteudo} contentContainerStyle={styles.conteudoInterno}>
            {children}
          </ScrollView>
          <Button label="Fechar" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fundo: { backgroundColor: 'rgba(0,0,0,0.6)' },
  janela: { width: '80%', height: '80%', borderWidth: 3, borderRadius: 8, padding: 16, gap: 12 },
  titulo: { fontSize: 22, fontWeight: '700' },
  conteudo: { flex: 1 },
  conteudoInterno: { gap: 12 },
});
