import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useColors } from '@/shared/theme/colors';
import { Button } from '@/shared/ui/Button';

/**
 * Boas-vindas ao Mundo, na primeira visita depois do primeiro aprendizado.
 *
 * O mapa continua visível atrás de propósito: é nele que o conhecimento acabou
 * de deixar a primeira marca. Enquanto está aberta, é a única coisa que aceita toque — o fundo
 * escurecido cobre a tela inteira, e `accessibilityViewIsModal` tira o resto da
 * árvore de acessibilidade.
 */
export function JourneyIntro({ onContinuar }: { onContinuar: () => void }) {
  const c = useColors();

  return (
    <Animated.View
      entering={FadeIn.duration(320)}
      accessibilityViewIsModal
      style={[styles.camada, { backgroundColor: c.overlay }]}
    >
      <View style={[styles.cartao, { backgroundColor: c.panel, borderColor: c.line, shadowColor: c.sombra }]}>
        <Text style={[styles.titulo, { color: c.ink }]} accessibilityRole="header">
          Este é o seu mundo.
        </Text>
        <Text style={[styles.destaque, { color: c.ink }]}>
          Seu conhecimento começou a transformar este mundo. Continue aprendendo e veja no que ele
          se torna.
        </Text>
        <Button label="Continuar" variant="primary" onPress={onContinuar} style={styles.botao} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  camada: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    // Acima de tudo: mapa, barra, aparelho e janelas.
    zIndex: 50,
  },
  cartao: {
    width: '100%',
    maxWidth: 420,
    gap: 12,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  titulo: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  destaque: { fontSize: 18, lineHeight: 25 },
  botao: { marginTop: 8 },
});
