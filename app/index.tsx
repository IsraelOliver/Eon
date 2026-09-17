import { StyleSheet, View } from 'react-native';

import { ActionToast } from '@/features/world/components/ActionToast';
import { LearnMenu } from '@/features/world/components/LearnMenu';
import { SettingsMenu } from '@/features/world/components/SettingsMenu';
import { WorldMap } from '@/features/world/components/WorldMap';
import { useWorld } from '@/features/world/hooks/useWorld';

export default function MapScreen() {
  const world = useWorld();
  return (
    <View style={styles.tela}>
      <WorldMap pixels={world.pixels} largura={world.largura} altura={world.altura} />
      <ActionToast mensagem={world.mensagem} id={world.idMensagem} />
      <SettingsMenu onNovoMundo={world.novoMundo} />
      <LearnMenu
        temas={world.temas}
        onAprender={world.aprender}
        onEsquecer={world.esquecer}
        onRevisar={world.revisar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
});
