import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, useWindowDimensions, View } from 'react-native';
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
import { useLearning } from '@/features/learning/hooks/useLearning';
import { useWorld } from '@/features/world/hooks/useWorld';
import { VERSAO_DO_SAVE, type SaveV1 } from '@/persistence/save';
import { carregarSave, salvarSave } from '@/persistence/storage';
import { useColors } from '@/shared/theme/colors';
import { ActionBar, centroDoItem, type AcaoDaBarra } from '@/shared/ui/ActionBar';
import { ICONS } from '@/shared/ui/icons';

/** Posição do celular na barra: é de lá que o feed cresce. */
const INDICE_CELULAR = 1;
const TOTAL_DE_ACOES = 2;

/**
 * Casca de hidratação: lê o save ANTES de existir qualquer mundo.
 *
 * Sem isto, o app criaria um mundo sorteado, desenharia o terreno e só então
 * descobriria que havia um save — com um piscar de mundo errado e um buffer
 * pesado jogado fora. Enquanto a leitura acontece, só o fundo aparece.
 */
export default function AppScreen() {
  const c = useColors();
  const [save, setSave] = useState<SaveV1 | null | undefined>(undefined);

  useEffect(() => {
    let vivo = true;
    void carregarSave().then((lido) => {
      if (vivo) setSave(lido);
    });
    return () => {
      vivo = false;
    };
  }, []);

  if (save === undefined) {
    return (
      <View style={[styles.tela, styles.carregando, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.ink} />
      </View>
    );
  }

  return <Jogo save={save} />;
}

/**
 * Composição do app: o mundo é a tela-base, sempre montada e sempre no layout.
 * O feed abre por cima dele como um aparelho — nunca no lugar dele.
 *
 * Só é montado depois que o save foi resolvido, então `useWorld` e `useLearning`
 * já nascem com o estado certo — e o autosave nunca roda antes da hidratação.
 */
function Jogo({ save }: { save: SaveV1 | null }) {
  const [configAberto, setConfigAberto] = useState(false);
  const [aprenderAberto, setAprenderAberto] = useState(false);
  /** Sobe quando o feed acaba de sair da frente: o mapa reenvia a cena ao Skia. */
  const [despertarMapa, setDespertarMapa] = useState(0);

  const tela = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const world = useWorld(save?.world);
  const aprendizado = useLearning(save?.learning.perfil);
  const dev = useDevMode();

  /*
   * Estas têm identidade fixa de propósito. O efeito da animação do
   * aparelho depende de `onFechado`: se ela mudasse a cada render, o efeito
   * re-rodaria sem motivo. O `LearningOverlay` já se protege disso sozinho,
   * mas o contrato certo é o de cá — não depender de otimização do compilador.
   */
  const abrirAprender = useCallback(() => setAprenderAberto(true), []);
  const fecharAprender = useCallback(() => setAprenderAberto(false), []);
  const aoFecharAprender = useCallback(() => setDespertarMapa((n) => n + 1), []);
  const abrirConfiguracoes = useCallback(() => setConfigAberto(true), []);
  const fecharConfiguracoes = useCallback(() => setConfigAberto(false), []);

  /** Objeto estável: ele alimenta os estilos animados do aparelho. */
  const origemDoAparelho = useMemo(
    () => centroDoItem(INDICE_CELULAR, TOTAL_DE_ACOES, tela, insets.bottom),
    [tela.width, tela.height, insets.bottom],
  );

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
    { chave: 'mundo', icone: ICONS.mundo, rotulo: 'Ver o mundo', onPress: fecharAprender },
    { chave: 'celular', icone: ICONS.celular, rotulo: 'Abrir Aprender', onPress: abrirAprender },
  ];

  /**
   * O save montado a partir do estado persistente das duas features. Só muda
   * quando algo que vale a pena guardar muda — abrir o aparelho, animar, dar
   * zoom ou mostrar um aviso não mexem nestas referências.
   */
  const saveAtual = useMemo<SaveV1>(
    () => ({
      version: VERSAO_DO_SAVE,
      world: world.estadoPersistivel,
      learning: { perfil: aprendizado.perfil },
    }),
    [world.estadoPersistivel, aprendizado.perfil],
  );

  // Autosave. Grava em fila, sem bloquear a interface.
  useEffect(() => {
    void salvarSave(saveAtual);
  }, [saveAtual]);

  /*
   * Rede de segurança ao sair do app. A ref é atualizada a cada save novo, para
   * o listener não gravar o primeiro estado da sessão. É a mesma função (e a
   * mesma fila) do autosave: não existe um segundo caminho de gravação.
   */
  const ultimoSave = useRef(saveAtual);
  ultimoSave.current = saveAtual;

  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'inactive' || estado === 'background') void salvarSave(ultimoSave.current);
    });
    return () => assinatura.remove();
  }, []);

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
        aprendizado={aprendizado}
        origem={origemDoAparelho}
        onFechar={fecharAprender}
        onFechado={aoFecharAprender}
        onAprendido={aoAprender}
        onConfiguracoes={abrirConfiguracoes}
      />
      <SettingsMenu
        aberto={configAberto}
        onFechar={fecharConfiguracoes}
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
  carregando: { alignItems: 'center', justifyContent: 'center' },
});
