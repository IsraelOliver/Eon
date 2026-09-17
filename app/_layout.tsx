import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColors } from '@/shared/theme/colors';

export default function RootLayout() {
  const c = useColors();
  return (
    <GestureHandlerRootView style={styles.raiz}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
});
