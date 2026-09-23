import { StyleSheet, View } from 'react-native';

import type { WorldPulseItem } from '../../presentation/worldPulse';
import { TopBar } from './TopBar';
import { WorldPulse } from './WorldPulse';

type Props = {
  onConfiguracoes?: () => void;
  pulso: WorldPulseItem | null;
};

/**
 * O topo da tela de aprendizado, lido de cima para baixo:
 * Éon → o que aconteceu no mundo → (abaixo) coisas novas para aprender.
 *
 * Tudo isto é **conteúdo do feed**, não barra: entra dentro do `ScrollView` e
 * sobe junto com os cards. Nada aqui é fixo.
 */
export function LearningHeader({ onConfiguracoes, pulso }: Props) {
  return (
    <View style={styles.topo}>
      <TopBar onConfiguracoes={onConfiguracoes} />
      <WorldPulse item={pulso} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Sem respiro embaixo: a primeira fotografia encosta no World Pulse e é o
  // fade dela que faz a emenda. Um gap aqui devolveria o corte seco.
  topo: { gap: 8 },
});
