import { StyleSheet, View } from 'react-native';

import type { Atmosfera } from '../../presentation/atmosfera';
import type { WorldPulseItem } from '../../presentation/worldPulse';
import { TopBar } from './TopBar';
import { WorldPulse } from './WorldPulse';

type Props = {
  onConfiguracoes?: () => void;
  pulso: WorldPulseItem | null;
  /**
   * A atmosfera da curiosidade sobre a qual o cabeçalho flutua, ou `null`
   * quando não há foto atrás (feed vazio): aí ele pousa no fundo da paleta.
   */
  atmosfera: Atmosfera | null;
};

/**
 * O topo da tela de aprendizado, lido de cima para baixo:
 * Éon → o que aconteceu no mundo → (logo abaixo) a própria descoberta.
 *
 * Não tem fundo próprio: flutua sobre a primeira curiosidade, e quem dá o chão
 * é a atmosfera dela. Sobe junto com o post; nada aqui é fixo.
 */
export function LearningHeader({ onConfiguracoes, pulso, atmosfera }: Props) {
  return (
    <View style={styles.topo}>
      <TopBar onConfiguracoes={onConfiguracoes} sobreAFoto={atmosfera !== null} />
      <WorldPulse item={pulso} atmosfera={atmosfera?.base ?? null} />
    </View>
  );
}

const styles = StyleSheet.create({
  topo: { gap: 8 },
});
