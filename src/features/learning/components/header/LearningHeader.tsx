import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';
import { comAlfa } from '@/shared/theme/cor';

import type { WorldPulseItem } from '../../presentation/worldPulse';
import { TopBar } from './TopBar';
import { WorldPulse } from './WorldPulse';

/**
 * Margem lateral do header. É a mesma do chip e do título dos posts: Éon, o
 * World Pulse e o conteúdo começam todos na mesma coluna.
 */
const MARGEM_DO_HEADER = 20;

type Props = {
  onConfiguracoes?: () => void;
  pulso: WorldPulseItem | null;
};

/**
 * O header do Discovery: uma região própria, no alto da primeira página do
 * feed — acima do primeiro post, e rolando com ele (não é fixo).
 *
 * Duas seções de UMA peça só — a navegação (Éon ⟷ engrenagem) e o estado do
 * mundo (World Pulse) —, na superfície do tema, sem card dentro de header. Um
 * fio fino, cinza, fecha o header; a timeline começa logo abaixo dele.
 *
 * Nada aqui vem da fotografia: a cor do header é sempre a do tema.
 */
export function LearningHeader({ onConfiguracoes, pulso }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        // O fio é o cinza neutro da marca, baixo: separa, não enfeita.
        { paddingTop: insets.top, backgroundColor: c.fundoFeed, borderBottomColor: comAlfa(c.neutral, 0.5) },
      ]}
    >
      <TopBar onConfiguracoes={onConfiguracoes} />
      <WorldPulse item={pulso} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: MARGEM_DO_HEADER,
    paddingBottom: 14,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
