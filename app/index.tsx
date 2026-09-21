import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LearningOverlay } from '@/features/learning/components/LearningOverlay';
import type { LearningResult } from '@/features/learning/engine/types';
import { SettingsMenu } from '@/features/settings/components/SettingsMenu';
import { useDevMode } from '@/features/settings/hooks/useDevMode';
import { ActionToast } from '@/features/world/components/ActionToast';
import { BiomeLegend } from '@/features/world/components/BiomeLegend';
import { WorldDevTools } from '@/features/world/components/WorldDevTools';
import { WorldMap } from '@/features/world/components/WorldMap';
import { gerarEventosDeCrescimento } from '@/features/world/engine/growth';
import { useWorld } from '@/features/world/hooks/useWorld';
import { ActionBar, centroDoItem, type AcaoDaBarra } from '@/shared/ui/ActionBar';
import { ICONS } from '@/shared/ui/icons';

/** O celular fica no meio da barra: é de lá que o feed cresce. */
const INDICE_CELULAR = 1;
const TOTAL_DE_ACOES = 3;

/**
 * Composição do app: o mundo é a tela-base, sempre montada e sempre no layout.
 * O feed abre por cima dele como um aparelho — nunca no lugar dele.
 *
 * Por isso `useWorld()` vive aqui: abrir e fechar o feed não desmonta nada, não
 * refaz o terreno e não mexe na câmera.
 */
export default function AppScreen() {
  const [configAberto, setConfigAberto] = useState(false);
  const [aprenderAberto, setAprenderAberto] = useState(false);
  /** Sobe quando o feed acaba de sair da frente: o mapa reenvia a cena ao Skia. */
  const [despertarMapa, setDespertarMapa] = useState(0);

  const tela = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const world = useWorld();
  const dev = useDevMode();

  /**
   * A ponte aprender → mundo. É o único lugar que vê as duas features, e ele não
   * interpreta nada: o que cada influência vira é assunto do engine do mundo, e
   * o que conta como conhecimento novo é assunto do engine de learning.
   *
   * O mundo cresce agora, com o aparelho ainda aberto. "Ver no mundo" só revela.
   */
  const aoAprender = (resultado: LearningResult) => {
    if (resultado.status !== 'aprendida') return;
    world.aplicarEventos(gerarEventosDeCrescimento(resultado.influencias));
  };

  const acoes: readonly AcaoDaBarra[] = [
    { chave: 'mundo', icone: ICONS.mundo, rotulo: 'Ver o mundo', onPress: () => setAprenderAberto(false) },
    { chave: 'celular', icone: ICONS.celular, rotulo: 'Abrir Aprender', onPress: () => setAprenderAberto(true) },
    { chave: 'config', icone: ICONS.gear, rotulo: 'Abrir configurações', onPress: () => setConfigAberto(true) },
  ];

  return (
    <View style={styles.tela}>
      <View
        style={styles.mundo}
        // Com o feed aberto, o mundo continua desenhado, mas fora de alcance —
        // do dedo e do leitor de tela.
        pointerEvents={aprenderAberto ? 'none' : 'auto'}
        accessibilityElementsHidden={aprenderAberto}
        importantForAccessibility={aprenderAberto ? 'no-hide-descendants' : 'auto'}
      >
        <WorldMap
          terreno={world.terreno}
          caminhos={world.caminhos}
          elementos={world.elementosParaDesenho}
          largura={world.largura}
          altura={world.altura}
          onLongPress={dev.ativo ? world.inspecionar : undefined}
          despertar={despertarMapa}
        />
        {/* Avisos por último: ficam acima das janelas */}
        <ActionToast mensagem={world.mensagem} id={world.idMensagem} />
        <ActionToast mensagem={dev.aviso.mensagem} id={dev.aviso.id} position="top" duration={3000} />
      </View>

      <LearningOverlay
        aberto={aprenderAberto}
        origem={centroDoItem(INDICE_CELULAR, TOTAL_DE_ACOES, tela, insets.bottom)}
        onFechar={() => setAprenderAberto(false)}
        onFechado={() => setDespertarMapa((n) => n + 1)}
        onAprendido={aoAprender}
      />
      <SettingsMenu
        aberto={configAberto}
        onFechar={() => setConfigAberto(false)}
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
      {/* A barra vale para o app inteiro: fica acima do mundo e do aparelho. */}
      <ActionBar itens={acoes} ativo={aprenderAberto ? 'celular' : 'mundo'} />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  mundo: { flex: 1 },
});
