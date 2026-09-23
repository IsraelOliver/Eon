import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AchievementToast } from '@/features/achievements/components/AchievementToast';
import { CONQUISTAS } from '@/features/achievements/data/achievements';
import { proximaNaoVista, type AchievementId } from '@/features/achievements/engine/regras';
import { useAchievements } from '@/features/achievements/hooks/useAchievements';
import { LearningOverlay } from '@/features/learning/components/LearningOverlay';
import type { LearningResult } from '@/features/learning/engine/types';
import {
  escolherWorldPulse, marcarNoticiaVista, proximaNoticia,
  type NoticiaDoMundo, type WorldPulseItem,
} from '@/features/learning/presentation/worldPulse';
import { SettingsMenu } from '@/features/settings/components/SettingsMenu';
import { PaletteDevTools } from '@/features/settings/components/PaletteDevTools';
import { useDevMode } from '@/features/settings/hooks/useDevMode';
import { ActionToast } from '@/features/world/components/ActionToast';
import { BiomeLegend } from '@/features/world/components/BiomeLegend';
import { BuildingCallout } from '@/features/world/components/BuildingCallout';
import { GrowthBanner } from '@/features/world/components/GrowthBanner';
import { WorldDevTools } from '@/features/world/components/WorldDevTools';
import { WorldMap } from '@/features/world/components/WorldMap';
import { assuntoDeCrescimento, fraseDeCrescimento } from '@/features/world/engine/destaque';
import { noticiaAmbiental } from '@/features/world/engine/pulsoAmbiental';
import { gerarEventosDeCrescimento } from '@/features/world/engine/growth';
import { NOME_DA_CONSTRUCAO } from '@/features/world/engine/selecao';
import type { GrowthElement } from '@/features/world/engine/types';
import { useLearning } from '@/features/learning/hooks/useLearning';
import { useWorld } from '@/features/world/hooks/useWorld';
import { JourneyIntro } from '@/features/onboarding/components/JourneyIntro';
import { deveMostrarIntroDaJornada } from '@/features/onboarding/regra';
import { VERSAO_DO_SAVE, decidirSave, type SaveData } from '@/persistence/save';
import { carregarSave, salvarSave } from '@/persistence/storage';
import { useColors } from '@/shared/theme/colors';
import { ActionBar, centroDoItem, type AcaoDaBarra } from '@/shared/ui/ActionBar';
import { ICONS } from '@/shared/ui/icons';

/** Posição do celular na barra: é de lá que o feed cresce. */
const INDICE_CELULAR = 1;
const TOTAL_DE_ACOES = 2;

/** Quantas novidades recentes ficam na memória. O resto do mundo está no mapa. */
const LIMITE_DE_NOTICIAS = 6;
const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Casca de hidratação: lê o save ANTES de existir qualquer mundo.
 *
 * Sem isto, o app criaria um mundo sorteado, desenharia o terreno e só então
 * descobriria que havia um save — com um piscar de mundo errado e um buffer
 * pesado jogado fora. Enquanto a leitura acontece, só o fundo aparece.
 */
export default function AppScreen() {
  const c = useColors();
  const [save, setSave] = useState<SaveData | null | undefined>(undefined);

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
function Jogo({ save }: { save: SaveData | null }) {
  const c = useColors();
  const [configAberto, setConfigAberto] = useState(false);
  const [aprenderAberto, setAprenderAberto] = useState(false);
  /** Sobe quando o feed acaba de sair da frente: o mapa reenvia a cena ao Skia. */
  const [despertarMapa, setDespertarMapa] = useState(0);

  const tela = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const world = useWorld(save?.world);
  const aprendizado = useLearning(save?.learning.perfil);
  /** Nasce só com o que está desbloqueado — a fila do banner começa vazia. */
  const conquistas = useAchievements(save?.achievements.desbloqueadas);
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
    world.aplicarEventos(gerarEventosDeCrescimento(resultado.influencias), resultado.curiosidadeId);
  };

  /**
   * A primeira curiosidade consolida a jornada: a partir daí este mundo é a
   * história da pessoa, e trocar de mundo passa a exigir recomeçar tudo.
   * Derivado do perfil de propósito — não é gravado no save.
   */
  const mundoConsolidado = aprendizado.perfil.aprendidas.length > 0;

  /**
   * As novidades que o World Pulse anuncia.
   *
   * São EFÊMERAS de propósito: nascem quando o mundo cresce nesta sessão e
   * morrem quando o app fecha. Não entram no save — o que aconteceu já está lá,
   * nas construções; o que é passageiro é o "isto acabou de acontecer".
   *
   * A tradução mora aqui porque só a composição vê as duas features: `learning`
   * recebe texto pronto e nunca fica sabendo que existe um mundo.
   */
  const [noticias, setNoticias] = useState<readonly NoticiaDoMundo[]>([]);
  /** Quantas construções já viraram notícia. Começa no que veio do save. */
  const jaNoticiadas = useRef(world.construcoes.length);
  const proximoIdDeNoticia = useRef(1);

  useEffect(() => {
    const total = world.construcoes.length;
    if (total === jaNoticiadas.current) return;

    // Encolheu: mundo novo ou jornada recomeçada. A conversa anterior acabou.
    if (total < jaNoticiadas.current) {
      jaNoticiadas.current = total;
      setNoticias([]);
      return;
    }

    const nascidos = world.construcoes.slice(jaNoticiadas.current);
    jaNoticiadas.current = total;

    /*
     * Só o que o CONHECIMENTO causou vira notícia. O crescimento do modo dev
     * chega sem `origemConhecimentoId` — e assim cem casas criadas em teste não
     * entopem a fila de quem está jogando. A regra é estrutural, não uma flag.
     */
    const doJogador = nascidos.filter((e) => e.origemConhecimentoId !== undefined);
    if (doJogador.length === 0) return;

    const agora = Date.now();
    const novas = doJogador.map((elemento) => ({
      id: proximoIdDeNoticia.current++,
      texto: fraseDeCrescimento(elemento),
      assunto: assuntoDeCrescimento(elemento),
      criadoEm: agora,
      vista: false,
    }));

    // Fila cronológica: a mais antiga na frente é a próxima a ser contada.
    setNoticias((atuais) => [...atuais, ...novas].slice(-LIMITE_DE_NOTICIAS));
  }, [world.construcoes]);

  /**
   * A ponte mundo → conquistas.
   *
   * O ponto de verdade é o `r.adicionados` do engine — o que de fato nasceu —,
   * e não uma leitura do mapa. A composição só traduz construção em assunto
   * (`shared/domain`), porque `achievements` não conhece `world`; quem decide o
   * que foi conquistado é o engine de conquistas.
   *
   * Vale para qualquer origem, modo dev inclusive: a regra é "a primeira casa da
   * jornada", não "a primeira casa vinda de uma curiosidade". Curiosidade
   * repetida não chega aqui — ela não faz nada nascer.
   *
   * Consumir logo em seguida é o que impede o mesmo nascimento de ser contado
   * duas vezes. `null` é terminal: o efeito re-roda uma vez e para.
   */
  const { nascimento, consumirNascimento } = world;
  const { registrarNascimentos, reiniciar: reiniciarConquistas } = conquistas;
  useEffect(() => {
    if (!nascimento) return;
    registrarNascimentos(nascimento.map(assuntoDeCrescimento));
    consumirNascimento();
  }, [nascimento, registrarNascimentos, consumirNascimento]);

  /**
   * Mundo sendo recriado = conquistas do mundo anterior saem junto.
   *
   * Ouvir `gerando` (e não chamar o reset à mão em cada botão) cobre Recomeçar
   * jornada e qualquer recriação de mundo por um caminho só. E herda a garantia
   * do autosave: durante a recriação o save seguro não avança, então o disco
   * nunca guarda um mundo vazio com a conquista antiga, nem o contrário.
   */
  useEffect(() => {
    if (world.gerando) reiniciarConquistas();
  }, [world.gerando, reiniciarConquistas]);

  /**
   * A vitrine do World Pulse. O banner anuncia a conquista no instante em que
   * ela acontece; o Pulse a mostra na próxima entrada no feed.
   *
   * "Vista no Pulse" é de sessão e nasce com tudo o que já vinha desbloqueado
   * do save — reabrir o app não ressuscita marcos antigos.
   */
  const [conquistasVistas, setConquistasVistas] = useState<readonly AchievementId[]>(
    () => conquistas.desbloqueadas,
  );

  useEffect(() => {
    // Jornada recomeçada: o que não está mais desbloqueado também não fica
    // "visto" — senão, ao reconquistar, o marco entraria calado.
    setConquistasVistas((vistas) => {
      const restam = vistas.filter((id) => conquistas.desbloqueadas.includes(id));
      return restam.length === vistas.length ? vistas : restam;
    });
  }, [conquistas.desbloqueadas]);

  /**
   * O World Pulse da entrada atual: escolhido UMA vez, quando o aparelho abre.
   *
   * Congelar é o que garante que o card não troque no meio do scroll — e é o
   * que torna possível marcar visto na hora, sem ele se recalcular e sumir
   * debaixo dos olhos de quem está lendo.
   */
  const [pulso, setPulso] = useState<WorldPulseItem | null>(null);

  /**
   * Memória curta da ambientação: quantas já saíram nesta sessão e qual foi a
   * última. É o que impede "A praça ficou movimentada" em toda abertura. Não
   * vira tela, então é ref, não estado.
   */
  const vezAmbiental = useRef(0);
  const ultimaAmbiental = useRef<string | null>(null);

  /** Direção mostrada por último: só a transição fechado → aberto conta. */
  const aparelhoEstavaAberto = useRef(aprenderAberto);

  useEffect(() => {
    const estava = aparelhoEstavaAberto.current;
    aparelhoEstavaAberto.current = aprenderAberto;
    if (estava === aprenderAberto || !aprenderAberto) return;

    const agora = Date.now();
    const idDaConquista = proximaNaoVista(conquistas.desbloqueadas, conquistasVistas);
    const conquista = idDaConquista
      ? {
          id: idDaConquista,
          nome: CONQUISTAS[idDaConquista].titulo,
          descricao: CONQUISTAS[idDaConquista].descricao,
        }
      : null;
    const noticia = proximaNoticia(noticias);
    const ambiental = noticiaAmbiental(world.estadoPersistivel, {
      // Semente do mundo + dia do calendário: a primeira frase muda de um dia
      // para o outro, e não só de uma abertura para a outra.
      semente: world.seed + Math.floor(agora / DIA_MS),
      vez: vezAmbiental.current,
      anterior: ultimaAmbiental.current,
    });

    const item = escolherWorldPulse({
      conquistaNova: conquista,
      noticiaDeProgressao: noticia,
      noticiaAmbiental: ambiental,
      agora,
    });
    setPulso(item);

    // Visto no instante da escolha: o painel já está abrindo com este item.
    // Conquista e notícia andam uma por entrada; a ambiental só avança a vez.
    if (item.tipo === 'conquista' && idDaConquista) {
      setConquistasVistas((vistas) => [...vistas, idDaConquista]);
    } else if (item.tipo === 'noticia' && item.categoria === 'progressao' && noticia) {
      setNoticias((atuais) => marcarNoticiaVista(atuais, noticia.id));
    } else {
      vezAmbiental.current += 1;
      ultimaAmbiental.current = ambiental.texto;
    }
  }, [
    aprenderAberto, conquistasVistas, conquistas.desbloqueadas, noticias,
    world.estadoPersistivel, world.seed,
  ]);

  /**
   * A novidade a anunciar quando o jogador volta ao mundo: a câmera vai até ela
   * e o aviso aparece. O `id` sobe a cada aprendizado real, e é o que dispara os
   * dois — por isso o destaque é consumido logo em seguida e não volta.
   */
  const [novidade, setNovidade] = useState({ id: 0, x: 0, y: 0, titulo: '', subtitulo: '' });

  const { destaque, consumirDestaque } = world;
  useEffect(() => {
    // Com o aparelho aberto o mapa está coberto; espera o jogador voltar.
    if (!destaque || aprenderAberto || world.gerando) return;
    setNovidade((n) => ({ id: n.id + 1, ...destaque }));
    setSelecao(null); // o foco automático assume a cena
    consumirDestaque();
  }, [destaque, aprenderAberto, world.gerando, consumirDestaque]);

  /**
   * Construção tocada: só estado de tela, nunca salvo. A ORIGEM dela, sim, é
   * persistente — mas isso vive no `GrowthElement`.
   */
  const [selecao, setSelecao] = useState<{
    elemento: GrowthElement;
    tela: { x: number; y: number };
  } | null>(null);

  /**
   * id opaco → curiosidade. É AQUI que os dois mundos se encontram: o mundo
   * guarda o id, o catálogo tem o título, e só a composição conhece os dois.
   */
  const porId = useMemo(
    () => new Map(aprendizado.curiosidades.map((cu) => [cu.id, cu])),
    [aprendizado.curiosidades],
  );

  /** Fecha a etiqueta sempre que o mapa deixa de ser o assunto. */
  useEffect(() => {
    if (aprenderAberto || configAberto || world.gerando) setSelecao(null);
  }, [aprenderAberto, configAberto, world.gerando]);

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
   * As conquistas saem junto pelo efeito de `gerando`, que `novoMundo` dispara.
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
   * O save montado a partir do estado persistente das features. Só muda quando
   * algo que vale a pena guardar muda — abrir o aparelho, animar, dar zoom ou
   * mostrar um aviso (inclusive o banner de conquista) não mexem nestas
   * referências.
   */
  const saveAtual = useMemo<SaveData>(
    () => ({
      version: VERSAO_DO_SAVE,
      world: world.estadoPersistivel,
      learning: { perfil: aprendizado.perfil },
      onboardingConcluida,
      achievements: { desbloqueadas: [...conquistas.desbloqueadas] },
    }),
    [world.estadoPersistivel, aprendizado.perfil, onboardingConcluida, conquistas.desbloqueadas],
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
            foco={novidade.id > 0 ? novidade : null}
            construcoes={world.construcoes}
            onSelecionar={setSelecao}
          />
        )}
        {selecao && (
          <BuildingCallout
            x={selecao.tela.x}
            y={selecao.tela.y}
            titulo={NOME_DA_CONSTRUCAO[selecao.elemento.tipo] ?? 'Construção'}
            texto={
              porId.has(selecao.elemento.origemConhecimentoId ?? '')
                ? 'Surgiu quando você aprendeu:'
                : 'Construção da sua jornada'
            }
            destaque={porId.get(selecao.elemento.origemConhecimentoId ?? '')?.titulo}
          />
        )}
        {/* O que acabou de nascer, quando o jogador volta ao mundo. */}
        <GrowthBanner titulo={novidade.titulo} subtitulo={novidade.subtitulo} id={novidade.id} />
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
        pulso={pulso}
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
            <PaletteDevTools />
          </>
        }
      />
      {/* A barra vale para o app inteiro: fica acima do mundo e do aparelho. */}
      <ActionBar itens={acoes} ativo={aprenderAberto ? 'celular' : 'mundo'} />

      {/* Por último: enquanto está aberta, é a única coisa que aceita toque. */}
      {mostrarIntro && <JourneyIntro onComecar={() => setOnboardingConcluida(true)} />}

      {/* O banner de conquista vem DEPOIS de tudo: fica acima do mundo, do
          aparelho, das configurações e da apresentação. Não recebe toque. */}
      <AchievementToast anuncio={conquistas.anuncio} onFim={conquistas.concluirAnuncio} />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  mundo: { flex: 1 },
  carregando: { alignItems: 'center', justifyContent: 'center' },
});
