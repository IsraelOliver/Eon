import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useColors } from '@/shared/theme/colors';
import { Button } from '@/shared/ui/Button';

/**
 * Boas-vindas de uma jornada nova, por cima do mundo já carregado.
 *
 * O mapa continua visível atrás de propósito: é o que dá sentido à primeira
 * frase. Enquanto está aberta, é a única coisa que aceita toque — o fundo
 * escurecido cobre a tela inteira, e `accessibilityViewIsModal` tira o resto da
 * árvore de acessibilidade.
 */
export function JourneyIntro({ onComecar }: { onComecar: () => void }) {
  const c = useColors();

  return (
    <Animated.View
      entering={FadeIn.duration(320)}
      accessibilityViewIsModal
      style={[styles.camada, { backgroundColor: c.overlay }]}
    >
      <View style={[styles.cartao, { backgroundColor: c.panel, borderColor: c.line }]}>
        <Text style={[styles.titulo, { color: c.ink }]} accessibilityRole="header">
          Este é o seu mundo.
        </Text>
        <Text style={[styles.destaque, { color: c.ink }]}>Aprenda para vê-lo crescer.</Text>
        <Text style={[styles.subtexto, { color: c.muted }]}>
          Antes da sua primeira descoberta, você ainda pode escolher outro mundo nas configurações.
        </Text>
        <Button label="Começar jornada" onPress={onComecar} style={styles.botao} />
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
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  titulo: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  destaque: { fontSize: 18, lineHeight: 25 },
  subtexto: { fontSize: 14, lineHeight: 20 },
  botao: { marginTop: 8 },
});
