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
import { JourneyIntro } from '@/features/onboarding/components/JourneyIntro';
import { deveMostrarIntroDaJornada } from '@/features/onboarding/regra';
import { VERSAO_DO_SAVE, decidirSave, type SaveV2 } from '@/persistence/save';
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
  const [save, setSave] = useState<SaveV2 | null | undefined>(undefined);

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
function Jogo({ save }: { save: SaveV2 | null }) {
  const c = useColors();
  const [configAberto, setConfigAberto] = useState(false);
  const [aprenderAberto, setAprenderAberto] = useState(false);
  /** Sobe quando o feed acaba de sair da frente: o mapa reenvia a cena ao Skia. */
  const [despertarMapa, setDespertarMapa] = useState(0);

  const tela = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const world = useWorld(save?.world);
  const aprendizado = useLearning(save?.learning.perfil);
  /** Sem save, a jornada é nova: a apresentação ainda não foi vista. */
  const [onboardingConcluida, setOnboardingConcluida] = useState(save?.onboardingConcluida ?? false);
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

  /**
   * A primeira curiosidade consolida a jornada: a partir daí este mundo é a
   * história da pessoa, e trocar de mundo passa a exigir recomeçar tudo.
   * Derivado do perfil de propósito — não é gravado no save.
   */
  const mundoConsolidado = aprendizado.perfil.aprendidas.length > 0;

  /** Boas-vindas de jornada nova: uma vez só, e nunca no meio de um carregamento. */
  const mostrarIntro = deveMostrarIntroDaJornada({
    aprendidas: aprendizado.perfil.aprendidas.length,
    onboardingConcluida,
    gerando: world.gerando,
  });

  /**
   * Recomeçar: apaga conhecimento e mundo **juntos**. As duas mudanças saem no
   * mesmo evento, então o React as agrupa num render só, e o mundo novo nasce
   * pelo mesmo caminho seguro de sempre (fases + liberação das imagens).
   */
  const recomecarJornada = useCallback(() => {
    aprendizado.reiniciar();
    setOnboardingConcluida(false); // jornada nova, apresentação de volta
    world.novoMundo();
  }, [aprendizado, world]);

  const acoes: readonly AcaoDaBarra[] = [
    { chave: 'mundo', icone: ICONS.mundo, rotulo: 'Ver o mundo', onPress: fecharAprender },
    { chave: 'celular', icone: ICONS.celular, rotulo: 'Abrir Aprender', onPress: abrirAprender },
  ];

  /**
   * O save montado a partir do estado persistente das duas features. Só muda
   * quando algo que vale a pena guardar muda — abrir o aparelho, animar, dar
   * zoom ou mostrar um aviso não mexem nestas referências.
   */
  const saveAtual = useMemo<SaveV2>(
    () => ({
      version: VERSAO_DO_SAVE,
      world: world.estadoPersistivel,
      learning: { perfil: aprendizado.perfil },
      onboardingConcluida,
    }),
    [world.estadoPersistivel, aprendizado.perfil, onboardingConcluida],
  );

  /**
   * O último estado coerente — é ele, e só ele, que vai para o disco.
   * Começa com o estado hidratado, que por definição é coerente.
   */
  const ultimoSaveSeguro = useRef(saveAtual);

  /*
   * Autosave. Grava em fila, sem bloquear a interface.
   *
   * Atualizar o snapshot seguro e gravar são a MESMA decisão (`decidirSave`),
   * no mesmo lugar: enquanto o mundo está sendo recriado, nenhum dos dois
   * acontece. Foi por isso que o snapshot saiu do corpo do componente — lá ele
   * era reatribuído a cada render, inclusive no meio de um reset, e o listener
   * de `AppState` podia gravar conhecimento vazio com o mundo antigo.
   */
  useEffect(() => {
    const decisao = decidirSave(saveAtual, ultimoSaveSeguro.current, world.gerando);
    ultimoSaveSeguro.current = decisao.seguro;
    if (decisao.gravar) void salvarSave(decisao.seguro);
  }, [saveAtual, world.gerando]);

  /*
   * Rede de segurança ao sair do app. Grava **sempre o snapshot seguro**, nunca
   * o estado atual: se o app sair de cena no meio de uma recriação, o disco
   * fica com a jornada anterior inteira. É a mesma função (e a mesma fila) do
   * autosave: não existe um segundo caminho de gravação.
   */
  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'inactive' || estado === 'background') void salvarSave(ultimoSaveSeguro.current);
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
        {/*
          * Durante a recriação o mapa SAI da árvore: é assim que a cena antiga
          * (e os 5,3 MB da imagem dela) some antes de a nova ser alocada. Sem
          * isso o iPhone fechava o app ao desenhar as duas juntas.
          */}
        {world.gerando ? (
          <View style={[styles.tela, styles.carregando, { backgroundColor: c.bg }]}>
            <ActivityIndicator color={c.ink} />
          </View>
        ) : (
          <WorldMap
            terreno={world.terreno}
            caminhos={world.caminhos}
            elementos={world.elementosParaDesenho}
            largura={world.largura}
            altura={world.altura}
            onLongPress={dev.ativo ? world.inspecionar : undefined}
            despertar={despertarMapa}
          />
        )}
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
        onNovoMundo={mundoConsolidado ? undefined : world.novoMundo}
        onRecomecarJornada={recomecarJornada}
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

      {/* Por último: enquanto está aberta, é a única coisa que aceita toque. */}
      {mostrarIntro && <JourneyIntro onComecar={() => setOnboardingConcluida(true)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  mundo: { flex: 1 },
  carregando: { alignItems: 'center', justifyContent: 'center' },
});
