import { StyleSheet, View } from 'react-native';

import { SettingsMenu } from '@/features/settings/components/SettingsMenu';
import { useDevMode } from '@/features/settings/hooks/useDevMode';
import { ActionToast } from '@/features/world/components/ActionToast';
import { BiomeLegend } from '@/features/world/components/BiomeLegend';
import { LearnMenu } from '@/features/world/components/LearnMenu';
import { WorldDevTools } from '@/features/world/components/WorldDevTools';
import { WorldMap } from '@/features/world/components/WorldMap';
import { useWorld } from '@/features/world/hooks/useWorld';

export default function MapScreen() {
  const world = useWorld();
  const dev = useDevMode();
  return (
    <View style={styles.tela}>
      <WorldMap
        terreno={world.terreno}
        elementos={world.elementosParaDesenho}
        brilho={world.brilho}
        largura={world.largura}
        altura={world.altura}
        onLongPress={dev.ativo ? world.inspecionar : undefined}
      />
      <SettingsMenu
        onNovoMundo={world.novoMundo}
        devAtivo={dev.ativo}
        onToqueSecreto={dev.registrarToque}
        ferramentasDev={
          <>
            <WorldDevTools
              seed={world.seed}
              nivelMar={world.nivelMar}
              faixaNivelMar={world.faixaNivelMar}
              onGerarComSemente={world.gerarComSemente}
              onMudarNivelMar={world.mudarNivelMar}
              crescimentos={world.crescimentos}
              onCrescer={world.aplicarCrescimentoDev}
            />
            <BiomeLegend itens={world.legenda} />
          </>
        }
      />
      <LearnMenu
        temas={world.temas}
        onAprender={world.aprender}
        onEsquecer={world.esquecer}
        onRevisar={world.revisar}
      />
      {/* Avisos por último: ficam acima das janelas */}
      <ActionToast mensagem={world.mensagem} id={world.idMensagem} />
      <ActionToast mensagem={dev.aviso.mensagem} id={dev.aviso.id} position="top" duration={3000} />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
});
