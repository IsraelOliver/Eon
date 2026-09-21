import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LearningScreen } from '@/features/learning/components/LearningScreen';
import { SettingsMenu } from '@/features/settings/components/SettingsMenu';
import { useDevMode } from '@/features/settings/hooks/useDevMode';
import { ActionToast } from '@/features/world/components/ActionToast';
import { BiomeLegend } from '@/features/world/components/BiomeLegend';
import { LearnMenu } from '@/features/world/components/LearnMenu';
import { WorldDevTools } from '@/features/world/components/WorldDevTools';
import { WorldMap } from '@/features/world/components/WorldMap';
import { useWorld } from '@/features/world/hooks/useWorld';
import { ICONS } from '@/shared/ui/icons';
import { ALTURA_TAB_BAR, MARGEM_TAB_BAR, TabBar, type ItemDeNavegacao } from '@/shared/ui/TabBar';

type Aba = 'aprender' | 'mundo';

/** Aba que o app abre. Um lugar só para mudar isso. */
const ABA_INICIAL: Aba = 'mundo';

const ABAS: readonly ItemDeNavegacao<Aba>[] = [
  { chave: 'aprender', rotulo: 'Aprender', icone: ICONS.aprender },
  { chave: 'mundo', rotulo: 'Mundo', icone: ICONS.mundo },
];

/** Espaço que a barra ocupa na borda de baixo. */
const ESPACO_DA_BARRA = ALTURA_TAB_BAR + MARGEM_TAB_BAR;

/**
 * Composição do app: as duas abas ficam montadas o tempo todo (a inativa some com
 * `display: 'none'`), para que trocar de aba não recrie o mundo nem perca o zoom.
 */
export default function AppScreen() {
  const [aba, setAba] = useState<Aba>(ABA_INICIAL);
  const [lendo, setLendo] = useState(false);

  const world = useWorld();
  const dev = useDevMode();

  return (
    <View style={styles.tela}>
      <View style={[styles.aba, aba !== 'aprender' && styles.escondida]}>
        <LearningScreen onLeitura={setLendo} />
      </View>

      <View style={[styles.aba, aba !== 'mundo' && styles.escondida]}>
        <WorldMap
          terreno={world.terreno}
          caminhos={world.caminhos}
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
        <ActionToast mensagem={world.mensagem} id={world.idMensagem} offset={ESPACO_DA_BARRA} />
        <ActionToast mensagem={dev.aviso.mensagem} id={dev.aviso.id} position="top" duration={3000} />
      </View>

      {/* A leitura ocupa a tela inteira: a barra sai do caminho. */}
      {!lendo && <TabBar itens={ABAS} ativo={aba} onSelecionar={setAba} />}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  aba: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  escondida: { display: 'none' },
});
