import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { AchievementToast } from '@/features/achievements/components/AchievementToast';
import { AchievementsScreen } from '@/features/achievements/components/AchievementsScreen';
import { CONQUISTAS } from '@/features/achievements/data/achievements';
import { montarColecao } from '@/features/achievements/engine/colecao';
import {
  ORDEM_DAS_CONQUISTAS, proximaNaoVista, type AchievementId,
} from '@/features/achievements/engine/regras';
import type { Anuncio } from '@/features/achievements/engine/estado';
import { useAchievements } from '@/features/achievements/hooks/useAchievements';
import { KnowledgeButton } from '@/features/knowledge/components/KnowledgeButton';
import { KnowledgeScreen } from '@/features/knowledge/components/KnowledgeScreen';
import { obterResumoDoConhecimento } from '@/features/knowledge/presentation/resumoDoConhecimento';
import { LearningOverlay } from '@/features/learning/components/LearningOverlay';
import { NOMES_DE_TEMA } from '@/features/learning/engine/themes';
import type { LearningResult, ThemeKey } from '@/features/learning/engine/types';
import {
  escolherWorldPulse, marcarNoticiaVista, proximaNoticia,
  type NoticiaDoMundo, type WorldPulseItem,
} from '@/features/learning/presentation/worldPulse';
import { SettingsMenu } from '@/features/settings/components/SettingsMenu';
import {
  SimulacaoFlutuante, SimuladorDaJornada, type Simulador,
} from '@/features/settings/components/SimuladorDaJornada';
import { useDevMode } from '@/features/settings/hooks/useDevMode';
import { useSimuladorDaJornada } from '@/features/settings/hooks/useSimuladorDaJornada';
import { ActionToast } from '@/features/world/components/ActionToast';
import { BiomeLegend } from '@/features/world/components/BiomeLegend';
import { BuildingCallout } from '@/features/world/components/BuildingCallout';
import { GrowthBanner } from '@/features/world/components/GrowthBanner';
import { WorldDevTools } from '@/features/world/components/WorldDevTools';
import { WorldMap } from '@/features/world/components/WorldMap';
import { assuntoDeCrescimento } from '@/features/world/engine/destaque';
import { estadoDosRamos } from '@/features/world/engine/estadoDosRamos';
import {
  especializacoesDesbloqueadas, etapasDaJornada, historiaDoElemento, quemJaAconteceu,
  tiersPendentes,
} from '@/features/world/engine/marcos';
import { assentamentoAlvo, estagioDaVila } from '@/features/world/engine/settlements';
import { paraDescobrir } from '@/features/learning/presentation/descoberta';
import { aplicarOrdem, ordemDaSessao } from '@/features/learning/presentation/ordemDoFeed';
import { noticiaAmbiental } from '@/features/world/engine/pulsoAmbiental';
import { NOME_DA_CONSTRUCAO } from '@/features/world/engine/selecao';
import type { GrowthElement } from '@/features/world/engine/types';
import { useLearning } from '@/features/learning/hooks/useLearning';
import { useWorld } from '@/features/world/hooks/useWorld';
import { JourneyIntro } from '@/features/onboarding/components/JourneyIntro';
import { deveMostrarIntroDaJornada } from '@/features/onboarding/regra';
import { VERSAO_DO_SAVE, decidirSave, type SaveData } from '@/persistence/save';
import { carregarPreferencias, salvarPreferencias } from '@/persistence/preferencias';
import { carregarSave, salvarSave } from '@/persistence/storage';
import {
  definirAparencia, useColors, usePreferenciaDeAparencia, type ThemePreference,
} from '@/shared/theme/colors';
import * as SplashScreen from 'expo-splash-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionBar, type AcaoDaBarra } from '@/shared/ui/ActionBar';
import { ICONS } from '@/shared/ui/icons';
import { deslocamentoDoMundo } from '@/shared/ui/navegacao';
import { useProgressoDaNavegacao } from '@/shared/ui/useNavegacao';
import type { LugarNoMundo } from '@/shared/domain/lugar';

/** A notícia do primeiro crescimento da jornada, no World Pulse. */
const FRASE_DO_PRIMEIRO_CRESCIMENTO = 'Algo apareceu no seu mundo.';
/** Quantas novidades recentes ficam na memória. O resto do mundo está no mapa. */
const LIMITE_DE_NOTICIAS = 6;
const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Casca de hidratação: lê o save e as preferências ANTES de existir qualquer
 * mundo.
 *
 * Sem isto, o app criaria um mundo sorteado, desenharia o terreno e só então
 * descobriria que havia um save — com um piscar de mundo errado e um buffer
 * pesado jogado fora.
 *
 * A aparência vem junto e é aplicada ANTES do primeiro render de verdade: a
 * splash nativa (segurada em `_layout`) só sai depois disso, então o primeiro
 * quadro já nasce no tema escolhido — sem piscar claro para quem escolheu
 * escuro.
 */
/**
 * Qual curiosidade o simulador da jornada aprende: a primeira do feed, com um
 * cuidado para as especializações acontecerem — cada tier pede uma curiosidade
 * do tema aprendida DEPOIS da fase base. Antes da era, guarda uma do tema por
 * tier pendente; depois dela, aprende primeiro as dos temas que ainda têm tier.
 */
function escolhaDoSimulador<C extends { tema: ThemeKey }>(
  fila: readonly C[],
  eraAberta: boolean,
  pendentes: Partial<Record<ThemeKey, number>>,
): C | undefined {
  if (eraAberta) return fila.find((c) => (pendentes[c.tema] ?? 0) > 0) ?? fila[0];
  const restantes: Partial<Record<ThemeKey, number>> = {};
  for (const c of fila) restantes[c.tema] = (restantes[c.tema] ?? 0) + 1;
  return fila.find((c) => (restantes[c.tema] ?? 0) > (pendentes[c.tema] ?? 0)) ?? fila[0];
}

/** Esta abertura do app, para o Discovery: o número dela e quem abriu a anterior. */
interface SessaoDoApp {
  numero: number;
  ultimaInicial: string | null;
}

export default function AppScreen() {
  const c = useColors();
  const [save, setSave] = useState<SaveData | null | undefined>(undefined);
  const [sessao, setSessao] = useState<SessaoDoApp>({ numero: 0, ultimaInicial: null });

  useEffect(() => {
    let vivo = true;
    Promise.all([carregarSave(), carregarPreferencias()])
      .then(([lido, preferencias]) => {
        if (!vivo) return;
        definirAparencia(preferencias.aparencia);
        // Uma abertura REAL do app: o contador sobe uma vez, aqui, e é gravado
        // já — a ordem do Discovery desta sessão sai dele.
        const numero = preferencias.discoveryLaunchSequence + 1;
        void salvarPreferencias({ discoveryLaunchSequence: numero });
        setSessao({ numero, ultimaInicial: preferencias.ultimaCuriosidadeInicialId });
        setSave(lido);
      })
      // Nenhum dos dois lança, mas a splash nunca pode ficar presa na tela.
      .catch(() => {
        if (vivo) setSave(null);
      });
    return () => {
      vivo = false;
    };
  }, []);

  // Solta a splash depois do commit do estado hidratado, não antes.
  useEffect(() => {
    if (save !== undefined) SplashScreen.hideAsync().catch(() => {});
  }, [save]);

  if (save === undefined) {
    return (
      <View style={[styles.tela, styles.carregando, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return <Jogo save={save} sessao={sessao} />;
}

/**
 * Composição do app: o mundo é a tela-base, sempre montada e sempre no layout.
 * O feed abre por cima dele como um aparelho — nunca no lugar dele.
 *
 * Só é montado depois que o save foi resolvido, então `useWorld` e `useLearning`
 * já nascem com o estado certo — e o autosave nunca roda antes da hidratação.
 */
function Jogo({ save, sessao }: { save: SaveData | null; sessao: SessaoDoApp }) {
  const c = useColors();
  const [configAberto, setConfigAberto] = useState(false);
  /**
   * O primeiro uso começa no Discovery: enquanto a jornada não tem nenhum
   * aprendizado, o app abre no feed, e não no Mundo. A navegação nasce já em 1
   * (`useProgressoDaNavegacao` parte do valor inicial), então nada anima.
   */
  const [aprenderAberto, setAprenderAberto] = useState(
    () => (save?.learning.perfil.aprendidas.length ?? 0) === 0,
  );
  /** Sobe quando o feed acaba de sair da frente: o mapa reenvia a cena ao Skia. */
  const [despertarMapa, setDespertarMapa] = useState(0);
  /** Sobe a cada toque no Mundo já ativo: a câmera anima até o mapa inteiro. */
  const [visaoGeral, setVisaoGeral] = useState(0);
  /** Sobe a cada toque no Discovery já ativo: o feed rola até o topo. */
  const [voltarAoTopo, setVoltarAoTopo] = useState(0);
  /**
   * Uma curiosidade está aberta para leitura (aviso do learning). É modo de
   * leitura: a ActionBar sai enquanto ela estiver à frente. O Discovery não é
   * desmontado — feed, rolagem e ordem continuam lá embaixo.
   */
  const [leituraAberta, setLeituraAberta] = useState(false);

  const tela = useWindowDimensions();
  const world = useWorld(save?.world);
  const aprendizado = useLearning(save?.learning.perfil);
  /** Nasce só com o que está desbloqueado — a fila do banner começa vazia. */
  const conquistas = useAchievements(save?.achievements.desbloqueadas);
  /**
   * A ordem do Discovery NESTA sessão do app: decidida uma vez, quando o Jogo
   * monta (o app abriu de verdade), e fixa até fechar — navegar, abrir
   * Configurações ou remontar a tela não a recalcula. Cobre o catálogo
   * inteiro; as aprendidas continuam saindo pelo perfil. A semente é a da
   * jornada + o número da abertura.
   */
  const [ordemDoFeed] = useState(() =>
    ordemDaSessao(aprendizado.curiosidades, {
      semente: world.seed,
      sessao: sessao.numero,
      aprendidas: aprendizado.perfil.aprendidas,
      evitarPrimeira: sessao.ultimaInicial,
    }),
  );
  // quem abre esta sessão: a próxima abertura não repete (se houver outra)
  useEffect(() => {
    const primeira = paraDescobrir(aplicarOrdem(aprendizado.curiosidades, ordemDoFeed), aprendizado.perfil)[0];
    if (primeira) void salvarPreferencias({ ultimaCuriosidadeInicialId: primeira.id });
    // só na montagem: é a primeira desta sessão, não a de agora
  }, [ordemDoFeed]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Sem save, a jornada é nova: as boas-vindas ao Mundo ainda não foram vistas. */
  const [onboardingConcluida, setOnboardingConcluida] = useState(save?.onboardingConcluida ?? false);
  const dev = useDevMode();
  const insetsDoTopo = useSafeAreaInsets().top;

  /*
   * Estas têm identidade fixa de propósito. O efeito da navegação depende de
   * `onFechado`: se ela mudasse a cada render, o efeito re-rodaria sem motivo.
   * `useProgressoDaNavegacao` já se protege disso sozinho, mas o contrato certo
   * é o de cá — não depender de otimização do compilador.
   */
  const abrirAprender = useCallback(() => setAprenderAberto(true), []);
  const fecharAprender = useCallback(() => setAprenderAberto(false), []);
  const aoFecharAprender = useCallback(() => setDespertarMapa((n) => n + 1), []);
  const abrirConfiguracoes = useCallback(() => setConfigAberto(true), []);
  const fecharConfiguracoes = useCallback(() => setConfigAberto(false), []);
  /** A coleção de conquistas. Abre POR CIMA de Configurações; fechar volta para lá. */
  const [conquistasAbertas, setConquistasAbertas] = useState(false);
  const abrirConquistas = useCallback(() => setConquistasAbertas(true), []);
  const fecharConquistas = useCallback(() => setConquistasAbertas(false), []);
  /**
   * "Seu conhecimento": tela secundária do Mundo, por cima do mapa (que não sai
   * da árvore). Quando ela termina de sumir, o mapa reenvia a cena ao Skia — o
   * mesmo despertar da volta do Discovery.
   */
  const [conhecimentoAberto, setConhecimentoAberto] = useState(false);
  const abrirConhecimento = useCallback(() => setConhecimentoAberto(true), []);
  const fecharConhecimento = useCallback(() => setConhecimentoAberto(false), []);
  const aoFecharConhecimento = useCallback(() => setDespertarMapa((n) => n + 1), []);

  /**
   * A aparência: preferência do APP, gravada em `@eon/preferences` — longe do
   * save da jornada. Por isso "Recomeçar jornada" não a toca. Aplicar é
   * imediato (só repinta quem lê cor); gravar vai para a fila, em segundo plano.
   */
  const aparencia = usePreferenciaDeAparencia();
  const escolherAparencia = useCallback((nova: ThemePreference) => {
    definirAparencia(nova);
    void salvarPreferencias({ aparencia: nova });
  }, []);

  /**
   * A navegação Mundo ↔ Discovery. `aprenderAberto` é o DESTINO (a fonte de
   * verdade lógica); `navegacao` é só o caminho visual até ele, de 0 a 1.
   *
   * Um valor só move as três coisas — o Mundo recuando, o Discovery deslizando
   * e o seletor da ActionBar —, então elas não têm como sair de sincronia.
   * Quando uma volta ao Mundo TERMINA de verdade, `aoFecharAprender` pede ao mapa
   * que reenvie a cena ao Skia (a correção do mapa em branco).
   */
  const navegacao = useProgressoDaNavegacao(aprenderAberto, aoFecharAprender);
  const larguraDaTela = tela.width;
  const parallaxDoMundo = useAnimatedStyle(() => ({
    // Só `translateX`: opacidade num pai do Skia obrigaria o iOS a compor o mapa
    // fora da tela a cada quadro — e com o Discovery opaco na frente, nem se veria.
    transform: [{ translateX: deslocamentoDoMundo(navegacao.value, larguraDaTela) }],
  }));

  /**
   * A ponte aprender → mundo. É o único lugar que vê as duas features, e ele não
   * interpreta nada: o que conta como conhecimento novo é assunto do learning, e
   * o que a jornada acumulada constrói é assunto do mundo (engine/marcos.ts).
   *
   * A civilização cresce pela PROGRESSÃO da vila — 1ª curiosidade: cabana; 3ª:
   * fogueira —, e não mais um prédio do tema a cada curiosidade. As influências
   * continuam no perfil (`porInfluencia`): são a afinidade que os marcos
   * temáticos vão ler.
   *
   * O mundo cresce agora, com o aparelho ainda aberto. "Ver no mundo" só revela.
   */
  const aoAprender = (resultado: LearningResult) => {
    if (resultado.status !== 'aprendida') return;
    // A afinidade é o `porTema` do perfil (fonte de verdade). As listas por tema
    // são a MEMÓRIA das especializações (quem contribuiu), derivadas do perfil +
    // catálogo — nada novo é salvo.
    const aprendidasPorTema: Partial<Record<ThemeKey, string[]>> = {};
    for (const id of resultado.perfil.aprendidas) {
      const tema = porId.get(id)?.tema;
      if (tema) (aprendidasPorTema[tema] ??= []).push(id);
    }
    const progresso = {
      aprendidas: resultado.perfil.aprendidas,
      porTema: resultado.perfil.porTema,
      aprendidasPorTema,
    };
    world.avancarProgressao(progresso);
    // Fim da fase base (20): a Era das Especializações começa. Não constrói
    // nada — é um fato da jornada; a conquista sai uma vez só (repetir não faz nada).
    if (especializacoesDesbloqueadas(progresso)) conquistas.registrarFatos({ especializacoesDesbloqueadas: true });
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
  const proximoIdDeNoticia = useRef(1);

  /*
   * A manchete de cada aprendizado que mudou o mundo — UMA, já escolhida pelo
   * mundo (`manchetePrincipal`) a partir do que de fato aconteceu (os degraus
   * de `aplicarMarcos`), nunca comparando o mapa depois. Aprendizado que só
   * somou afinidade não produz manchete: o Pulse fica como está.
   *
   * Com o Discovery aberto — a pessoa acabou de aprender, a leitura cobre o
   * feed —, o Pulse troca na hora: ao voltar ao feed, a manchete já está lá. Ela
   * entra na fila já vista, para não se repetir na próxima entrada. Com o
   * Discovery fechado (o simulador do modo dev aprende com o mundo à vista), ela
   * espera na fila e sai na próxima entrada, como sempre.
   *
   * O PRIMEIRO crescimento da jornada (antes da primeira visita ao Mundo) fala
   * pela frase especial: é por ela que a pessoa descobre que o mundo existe.
   */
  const { manchete, consumirManchete } = world;
  useEffect(() => {
    if (!manchete) return;
    consumirManchete();
    const primeiro = aprendizado.perfil.aprendidas.length === 1 && !onboardingConcluida;
    const noticia: NoticiaDoMundo = {
      id: proximoIdDeNoticia.current++,
      texto: primeiro ? FRASE_DO_PRIMEIRO_CRESCIMENTO : manchete.texto,
      assunto: manchete.assunto,
      criadoEm: Date.now(),
      vista: aprenderAberto,
    };
    if (aprenderAberto) {
      setPulso({
        tipo: 'noticia',
        categoria: 'progressao',
        texto: noticia.texto,
        icone: noticia.assunto,
        quando: 'agora',
      });
    }
    // Fila cronológica: a mais antiga na frente é a próxima a ser contada.
    setNoticias((atuais) => [...atuais, noticia].slice(-LIMITE_DE_NOTICIAS));
  }, [manchete, consumirManchete, aprenderAberto, aprendizado.perfil.aprendidas.length, onboardingConcluida]);

  // Mundo recriado (mundo novo ou jornada recomeçada): a conversa anterior acabou.
  useEffect(() => {
    if (world.gerando) setNoticias([]);
  }, [world.gerando]);

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
  const { registrarFatos, reiniciar: reiniciarConquistas } = conquistas;
  useEffect(() => {
    if (!nascimento) return;
    registrarFatos({
      nascidos: nascimento.map((e) => ({ assunto: assuntoDeCrescimento(e), x: e.x, y: e.y })),
    });
    consumirNascimento();
  }, [nascimento, registrarFatos, consumirNascimento]);

  /**
   * Mundo sendo recriado = conquistas do mundo anterior saem junto.
   *
   * Ouvir `gerando` (e não chamar o reset à mão em cada botão) cobre Recomeçar
   * jornada e qualquer recriação de mundo por um caminho só. E herda a garantia
   * do autosave: durante a recriação o save seguro não avança, então o disco
   * nunca guarda um mundo vazio com a conquista antiga, nem o contrário.
   */
  useEffect(() => {
    if (world.gerando) {
      reiniciarConquistas();
      setLugarDaConquista(null); // o lugar era do mundo que saiu
    }
  }, [world.gerando, reiniciarConquistas]);

  /**
   * A coleção: catálogo + o que esta jornada desbloqueou. Projeção, não estado —
   * recomeçar a jornada bloqueia tudo na hora, sem uma segunda lista para zerar.
   */
  const colecao = useMemo(
    () => montarColecao(ORDEM_DAS_CONQUISTAS, conquistas.desbloqueadas),
    [conquistas.desbloqueadas],
  );

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

  /**
   * Direção mostrada por último: só a transição fechado → aberto conta. Nasce
   * `false` de propósito: no primeiro uso o app já abre no Discovery, e essa
   * abertura também escolhe o seu Pulse.
   */
  const aparelhoEstavaAberto = useRef(false);

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
  /**
   * Para onde a câmera vai. Separado da `novidade` porque nem todo foco tem
   * aviso: o "Ver no mundo" de uma conquista só leva a câmera, sem GrowthBanner.
   */
  const [focoDoMapa, setFocoDoMapa] = useState({ id: 0, x: 0, y: 0 });
  /**
   * O lugar de uma conquista tocada no banner, esperando o Mundo ficar à vista
   * (Discovery saindo da frente, boas-vindas dispensadas). Estado de tela.
   */
  const [lugarDaConquista, setLugarDaConquista] = useState<LugarNoMundo | null>(null);

  /**
   * As boas-vindas ao Mundo: uma vez só, na primeira visita depois do primeiro
   * aprendizado, e nunca no meio de um carregamento.
   */
  const mostrarIntro = deveMostrarIntroDaJornada({
    aprendidas: aprendizado.perfil.aprendidas.length,
    onboardingConcluida,
    gerando: world.gerando,
    noMundo: !aprenderAberto,
  });

  const { destaque, consumirDestaque } = world;
  useEffect(() => {
    // Com o aparelho aberto o mapa está coberto; espera o jogador voltar. Com as
    // boas-vindas na frente, espera a pessoa dispensá-las: aí a câmera vai até
    // a novidade e o aviso aparece, à vista.
    if (!destaque || aprenderAberto || world.gerando || mostrarIntro) return;
    setNovidade((n) => ({ id: n.id + 1, ...destaque }));
    setFocoDoMapa((f) => ({ id: f.id + 1, x: destaque.x, y: destaque.y }));
    setSelecao(null); // o foco automático assume a cena
    consumirDestaque();
  }, [destaque, aprenderAberto, world.gerando, mostrarIntro, consumirDestaque]);

  /*
   * "Ver no mundo" de uma conquista: a câmera vai até o lugar dela, nas mesmas
   * condições do destaque (Mundo à vista, sem recriação, sem boas-vindas na
   * frente). Vem DEPOIS do efeito do destaque: se os dois chegam juntos (a
   * primeira casa costuma nascer com o destaque da cabana), quem manda na
   * câmera é a conquista que a pessoa tocou — e o aviso do destaque continua.
   */
  useEffect(() => {
    if (!lugarDaConquista || aprenderAberto || world.gerando || mostrarIntro) return;
    setFocoDoMapa((f) => ({ id: f.id + 1, ...lugarDaConquista }));
    setSelecao(null);
    setLugarDaConquista(null);
  }, [lugarDaConquista, aprenderAberto, world.gerando, mostrarIntro]);

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

  /**
   * O que o balão conta sobre a origem de uma construção. Na progressão: o
   * capítulo MAIS RECENTE da vida dela — a criação, ou a última evolução ("Este
   * foi o primeiro abrigo do seu mundo. Com novos conhecimentos, ele cresceu.")
   * — e quem o formou (o gatilho e, com mais de uma, quantas descobertas
   * contribuíram). A história inteira fica em `historiaDoElemento`, pronta para
   * uma tela de histórico. Nas outras: a curiosidade que a fez nascer.
   */
  const origemParaOBalao = (elemento: GrowthElement): { texto: string; destaque?: string } => {
    const historia = historiaDoElemento(elemento);
    if (historia) {
      const { atual } = historia;
      const gatilho = porId.get(atual.gatilho)?.titulo;
      const n = atual.contribuintes.length;
      return {
        texto: atual.definicao?.historia ?? 'Construção da sua jornada',
        destaque: gatilho && (n > 1 ? `${n} descobertas, a última: ${gatilho}` : gatilho),
      };
    }
    const curiosidade = porId.get(elemento.origemConhecimentoId ?? '');
    return curiosidade
      ? { texto: 'Surgiu quando você aprendeu:', destaque: curiosidade.titulo }
      : { texto: 'Construção da sua jornada' };
  };

  /** Fecha a etiqueta sempre que o mapa deixa de ser o assunto. */
  useEffect(() => {
    if (aprenderAberto || configAberto || conquistasAbertas || conhecimentoAberto || world.gerando) setSelecao(null);
  }, [aprenderAberto, configAberto, conquistasAbertas, conhecimentoAberto, world.gerando]);

  /**
   * Recomeçar: apaga conhecimento e mundo **juntos**. As duas mudanças saem no
   * mesmo evento, então o React as agrupa num render só, e o mundo novo nasce
   * pelo mesmo caminho seguro de sempre (fases + liberação das imagens).
   * As conquistas saem junto pelo efeito de `gerando`, que `novoMundo` dispara.
   */
  /**
   * Tocou no banner de conquista: vai para o Mundo, de onde estiver — fecha o
   * Discovery, as Configurações, a coleção e "Seu conhecimento". Com lugar, a
   * câmera vai até lá (efeito acima); sem lugar (a Era das Especializações), o
   * Mundo abre na câmera atual. Nunca abre a tela de Conquistas: o impulso,
   * naquela hora, é ver a mudança no mapa.
   */
  const verConquistaNoMundo = useCallback((anuncio: Anuncio) => {
    setLugarDaConquista(anuncio.lugar ?? null);
    setSelecao(null);
    setAprenderAberto(false);
    setConfigAberto(false);
    setConquistasAbertas(false);
    setConhecimentoAberto(false);
  }, []);

  const recomecarJornada = useCallback(() => {
    aprendizado.reiniciar();
    setOnboardingConcluida(false); // jornada nova, boas-vindas de volta
    world.novoMundo();
  }, [aprendizado, world]);

  /*
   * SIMULAÇÃO DA JORNADA (modo dev). Nenhum atalho: cada passo faz o que o
   * botão "Registrar descoberta" faz no Discovery — `aprendizado.aprender` e, se foi
   * 'aprendida', o mesmo `aoAprender` — e daí em diante é a progressão de
   * sempre: criação, evolução, caminhos, câmera, banner, notícias, World Pulse.
   * A curiosidade segue a ordem do feed desta sessão (determinística, sem
   * sorteio), guardando as do tema de cada especialização para depois da fase
   * base (`escolhaDoSimulador`). A jornada vai até a última curiosidade do
   * catálogo: depois dos marcos da vila vêm as especializações.
   */
  const etapas = useMemo(() => etapasDaJornada(), []);
  const limiteDaJornada = aprendizado.curiosidades.length;
  const aprendidasAgora = aprendizado.perfil.aprendidas.length;
  const aprenderProxima = () => {
    const curiosidade = escolhaDoSimulador(
      paraDescobrir(aplicarOrdem(aprendizado.curiosidades, ordemDoFeed), aprendizado.perfil),
      especializacoesDesbloqueadas({ aprendidas: aprendizado.perfil.aprendidas }),
      tiersPendentes(world.construcoes),
    );
    if (!curiosidade) return false;
    const resultado = aprendizado.aprender(curiosidade);
    if (resultado.status === 'aprendida') aoAprender(resultado);
    return true;
  };
  const passos = useSimuladorDaJornada({
    aprendidas: aprendidasAgora,
    limite: limiteDaJornada,
    aprenderProxima,
    // espera o mundo: recriação, ou as boas-vindas esperando o "Continuar"
    pronto: !world.gerando && !mostrarIntro,
  });
  const vilaAtual = assentamentoAlvo(world.estadoPersistivel.settlements);
  const aconteceu = quemJaAconteceu(world.construcoes, world.estadoPersistivel.settlements);
  const proximaEtapa = etapas.find((e) => e.quantidade > aprendidasAgora) ?? null;
  const rotuloDaEtapa = (degraus: { nome: string }[]) => degraus.map((d) => d.nome).join(' + ');
  /** Para assistir: fecha as Configurações e o Discovery antes de andar. */
  const assistir = (acao: () => void) => () => {
    fecharConfiguracoes();
    fecharAprender();
    acao();
  };
  const simulador: Simulador = {
    aprendidas: aprendidasAgora,
    limite: limiteDaJornada,
    restantes: paraDescobrir(aprendizado.curiosidades, aprendizado.perfil).length,
    estagio: { acampamento: 'Acampamento', assentamento: 'Assentamento', vila: 'Vila' }[
      vilaAtual ? estagioDaVila(vilaAtual) : 'acampamento'
    ],
    nivelDosCaminhos: vilaAtual?.nivelDosCaminhos ?? 0,
    proximo: proximaEtapa && { quantidade: proximaEtapa.quantidade, rotulo: rotuloDaEtapa(proximaEtapa.degraus) },
    etapas: etapas.map((e) => ({
      quantidade: e.quantidade,
      rotulo: rotuloDaEtapa(e.degraus),
      estado: e.degraus.every(aconteceu) ? 'feito' : e.quantidade <= aprendidasAgora ? 'pendente' : 'futuro',
    })),
    rodando: passos.rodando,
    tocando: passos.tocando,
    onProxima: assistir(passos.proximaDescoberta),
    onAteMarco: assistir(() => passos.ate(proximaEtapa?.quantidade ?? aprendidasAgora + 1)),
    onJornada: assistir(passos.jornadaInteira),
    onPausar: passos.pausar,
    // o MESMO recomeçar da jornada (fases seguras de recriação), nada paralelo
    onReiniciar: () => {
      passos.pausar();
      recomecarJornada();
    },
  };

  /*
   * "Seu conhecimento" só LÊ: o perfil do aprendizado (total e afinidade de cada
   * tema) e o estado dos ramos do mundo. Nada dele é salvo — reiniciar a jornada
   * ou reabrir o app dá o mesmo resumo, porque as duas fontes já estão no save.
   */
  const resumoDoConhecimento = obterResumoDoConhecimento({
    descobertas: aprendizado.perfil.aprendidas.length,
    afinidade: aprendizado.perfil.porTema,
    nomeDoTema: NOMES_DE_TEMA,
    ramos: estadoDosRamos(world.construcoes, {
      aprendidas: aprendizado.perfil.aprendidas,
      porTema: aprendizado.perfil.porTema,
    }),
  });

  /*
   * A regra da barra: tocar num destino DIFERENTE navega; tocar no destino já
   * selecionado faz a ação daquele lugar. Mundo → enquadrar o mapa inteiro;
   * Discovery → voltar ao topo do feed. Nenhuma das duas mexe na navegação.
   */
  const acoes: readonly AcaoDaBarra[] = [
    aprenderAberto
      ? { chave: 'mundo', icone: ICONS.mundo, rotulo: 'Ver o mundo', onPress: fecharAprender }
      : {
          chave: 'mundo',
          icone: ICONS.mundo,
          rotulo: 'Ver o mundo inteiro',
          onPress: () => setVisaoGeral((n) => n + 1),
        },
    aprenderAberto
      ? {
          chave: 'discovery',
          icone: ICONS.discovery,
          rotulo: 'Voltar ao topo do Discovery',
          onPress: () => setVoltarAoTopo((n) => n + 1),
        }
      : { chave: 'discovery', icone: ICONS.discovery, rotulo: 'Abrir Aprender', onPress: abrirAprender },
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
      {/*
        * O Mundo nunca sai da árvore ao navegar: só recua um pouco (parallax)
        * enquanto o Discovery passa por cima. A única saída do mapa continua
        * sendo a recriação do mundo (`world.gerando`), um caminho à parte.
        */}
      <Animated.View
        style={[styles.mundo, parallaxDoMundo]}
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
            <ActivityIndicator color={c.accent} />
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
            foco={focoDoMapa.id > 0 ? focoDoMapa : null}
            visaoGeral={visaoGeral}
            construcoes={world.construcoes}
            onSelecionar={setSelecao}
          />
        )}
        {selecao && (
          <BuildingCallout
            x={selecao.tela.x}
            y={selecao.tela.y}
            titulo={NOME_DA_CONSTRUCAO[selecao.elemento.tipo] ?? 'Construção'}
            {...origemParaOBalao(selecao.elemento)}
          />
        )}
        {/* O acesso a "Seu conhecimento": no topo do Mundo, nunca na ActionBar. */}
        {!world.gerando && <KnowledgeButton onPress={abrirConhecimento} />}
        {/* O que acabou de nascer, quando o jogador volta ao mundo. */}
        <GrowthBanner titulo={novidade.titulo} subtitulo={novidade.subtitulo} id={novidade.id} />
        {/* Avisos por último: ficam acima das janelas */}
        <ActionToast mensagem={world.mensagem} id={world.idMensagem} />
        <ActionToast mensagem={dev.aviso.mensagem} id={dev.aviso.id} position="top" duration={3000} />
      </Animated.View>

      <LearningOverlay
        aberto={aprenderAberto}
        progresso={navegacao}
        aprendizado={aprendizado}
        onFechar={fecharAprender}
        onAprendido={aoAprender}
        onConfiguracoes={abrirConfiguracoes}
        pulso={pulso}
        voltarAoTopo={voltarAoTopo}
        ordem={ordemDoFeed}
        onLeitura={setLeituraAberta}
      />
      <SettingsMenu
        aberto={configAberto}
        onFechar={fecharConfiguracoes}
        onNovoMundo={mundoConsolidado ? undefined : world.novoMundo}
        onRecomecarJornada={recomecarJornada}
        onConquistas={abrirConquistas}
        resumoDasConquistas={`${colecao.desbloqueadas}/${colecao.total}`}
        aparencia={aparencia}
        onAparencia={escolherAparencia}
        devAtivo={dev.ativo}
        onToqueSecreto={dev.registrarToque}
        ferramentasDev={
          <>
            {/* A ferramenta principal: a jornada real, passo a passo. */}
            <SimuladorDaJornada simulador={simulador} />
            {/* O terreno: semente, nível do mar e a legenda das cores. */}
            <WorldDevTools
              seed={world.seed}
              nivelMar={world.nivelMar}
              faixaNivelMar={world.faixaNivelMar}
              onGerarComSemente={world.gerarComSemente}
              onMudarNivelMar={world.mudarNivelMar}
            />
            <BiomeLegend itens={world.legenda} />
          </>
        }
      />
      {/* Modo dev, com o mundo à vista: o simulador na mão, para assistir e pausar. */}
      {dev.ativo && !aprenderAberto && !configAberto && !conquistasAbertas && !conhecimentoAberto && (
        // abaixo do acesso a "Seu conhecimento", que ocupa o topo do Mundo
        <SimulacaoFlutuante simulador={simulador} topo={insetsDoTopo + 52} />
      )}
      {/* A barra vale para o app inteiro: fica acima do mundo e do aparelho.
          Só sai no modo de leitura — e só com o Discovery à frente: uma leitura
          que ficou aberta por baixo (o toast levou ao Mundo) não tira a barra
          do Mundo. Ela não guarda estado: o seletor vem do progresso. */}
      {!(aprenderAberto && leituraAberta) && (
        <ActionBar
          itens={acoes}
          ativo={aprenderAberto ? 'discovery' : 'mundo'}
          // O seletor laranja viaja do Mundo ao Discovery com o MESMO progresso das páginas.
          seletor={{ progresso: navegacao, de: 'mundo', ate: 'discovery' }}
        />
      )}

      {/* A coleção é tela cheia e cobre a barra e as Configurações (de onde é
          aberta): o "voltar" dela fecha só ela e devolve a pessoa para lá. */}
      <AchievementsScreen aberta={conquistasAbertas} colecao={colecao} onFechar={fecharConquistas} />

      {/* "Seu conhecimento" cobre o Mundo e a barra; o voltar devolve ao Mundo. */}
      <KnowledgeScreen
        aberta={conhecimentoAberto}
        resumo={resumoDoConhecimento}
        onFechar={fecharConhecimento}
        onFechado={aoFecharConhecimento}
      />

      {/* Por último: enquanto está aberta, é a única coisa que aceita toque. */}
      {mostrarIntro && <JourneyIntro onContinuar={() => setOnboardingConcluida(true)} />}

      {/* O banner de conquista vem DEPOIS de tudo: fica acima do mundo, do
          aparelho, das configurações e da apresentação. Tocar nele leva ao Mundo. */}
      <AchievementToast
        anuncio={conquistas.anuncio}
        onFim={conquistas.concluirAnuncio}
        onVerNoMundo={verConquistaNoMundo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  mundo: { flex: 1 },
  carregando: { alignItems: 'center', justifyContent: 'center' },
});
