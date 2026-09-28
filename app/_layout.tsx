import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColors, useEstiloDaStatusBar } from '@/shared/theme/colors';

/*
 * A splash nativa fica na tela até a hidratação terminar (quem a solta é o
 * `AppScreen`, em app/index.tsx, depois de ler o save e a aparência). É o que
 * evita o piscar de tema errado: sem isto, o primeiro quadro sairia no tema do
 * sistema e trocaria logo em seguida para o escolhido.
 */
SplashScreen.preventAutoHideAsync().catch(() => {});

/** A barra de status acompanha o tema efetivo: ícones claros no escuro, escuros no claro. */
export default function RootLayout() {
  const c = useColors();
  const estiloDaStatusBar = useEstiloDaStatusBar();
  return (
    <GestureHandlerRootView style={styles.raiz}>
      <StatusBar style={estiloDaStatusBar} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
});
