import { useEffect, type ReactNode } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useColors } from '@/shared/theme/colors';

import { Button } from './Button';

const FADE_MS = 200;

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Algo pequeno embaixo do botão "Fechar" (opcional). */
  footer?: ReactNode;
};

/**
 * Janela centralizada (~80% da tela) sobre um fundo escurecido, com fade.
 * Fecha ao tocar fora, no botão "Fechar" ou no botão voltar (Android).
 *
 * É uma camada da própria tela (e não um Modal) para que avisos (ActionToast)
 * possam aparecer por cima dela e gestos do gesture-handler funcionem dentro.
 */
export function Window({ visible, title, onClose, children, footer }: Props) {
  const c = useColors();

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(FADE_MS)}
      exiting={FadeOut.duration(FADE_MS)}
      style={[StyleSheet.absoluteFill, styles.camada]}
    >
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]}
        onPress={onClose}
        accessibilityLabel="Fechar janela"
      />
      <View style={[styles.janela, { backgroundColor: c.panel, borderColor: c.ink }]} accessibilityViewIsModal>
        <Text style={[styles.titulo, { color: c.ink }]} accessibilityRole="header">
          {title}
        </Text>
        <ScrollView
          style={styles.conteudo}
          contentContainerStyle={styles.conteudoInterno}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {children}
        </ScrollView>
        <Button label="Fechar" onPress={onClose} />
        {footer}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  camada: { zIndex: 10, alignItems: 'center', justifyContent: 'center' },
  janela: { width: '80%', height: '80%', borderWidth: 3, borderRadius: 8, padding: 16, gap: 12 },
  titulo: { fontSize: 22, fontWeight: '700' },
  conteudo: { flex: 1 },
  conteudoInterno: { gap: 12 },
});
