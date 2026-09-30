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
import { useAchievements } from '@/features/achievements/hooks/useAchievements';
import { LearningOverlay } from '@/features/learning/components/LearningOverlay';
import type { LearningResult } from '@/features/learning/engine/types';
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
import { assuntoDeCrescimento, fraseDeCrescimento } from '@/features/world/engine/destaque';
import {
  definicaoDoMarco, etapasDaJornada, historiaDoElemento, quemJaAconteceu,
} from '@/features/world/engine/marcos';
import { assentamentoAlvo, estagioDaVila } from '@/features/world/engine/settlements';
import { paraDescobrir } from '@/features/learning/presentation/descoberta';
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
export default function AppScreen() {
  const c = useColors();
  const [save, setSave] = useState<SaveData | null | undefined>(undefined);

  useEffect(() => {
    let vivo = true;
    Promise.all([carregarSave(), carregarPreferencias()])
      .then(([lido, preferencias]) => {
        if (!vivo) return;
        definirAparencia(preferencias.aparencia);
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

  const tela = useWindowDimensions();
  const world = useWorld(save?.world);
  const aprendizado = useLearning(save?.learning.perfil);
  /** Nasce só com o que está desbloqueado — a fila do banner começa vazia. */
  const conquistas = useAchievements(save?.achievements.desbloqueadas);
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
    world.avancarProgressao({ aprendidas: resultado.perfil.aprendidas });
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

    /*
     * O PRIMEIRO crescimento da jornada (a primeira curiosidade, antes da
     * primeira visita ao Mundo) vira uma notícia só, especial. Se o Discovery
     * está aberto — a pessoa acabou de aprender, a leitura cobre o feed —, o
     * Pulse troca para ela já: é por ela que a pessoa descobre que o mundo mudou.
     */
    if (aprendizado.perfil.aprendidas.length === 1 && !onboardingConcluida) {
      const especial = {
        id: proximoIdDeNoticia.current++,
        texto: FRASE_DO_PRIMEIRO_CRESCIMENTO,
        assunto: assuntoDeCrescimento(doJogador[0]),
        criadoEm: agora,
        vista: aprenderAberto,
      };
      if (aprenderAberto) {
        setPulso({
          tipo: 'noticia',
          categoria: 'progressao',
          texto: especial.texto,
          icone: especial.assunto,
          quando: 'agora',
        });
      }
      setNoticias((atuais) => [...atuais, especial].slice(-LIMITE_DE_NOTICIAS));
      return;
    }

    const novas = doJogador.map((elemento) => ({
      id: proximoIdDeNoticia.current++,
      texto: fraseDeCrescimento(elemento),
      assunto: assuntoDeCrescimento(elemento),
      criadoEm: agora,
      vista: false,
    }));

    // Fila cronológica: a mais antiga na frente é a próxima a ser contada.
    setNoticias((atuais) => [...atuais, ...novas].slice(-LIMITE_DE_NOTICIAS));
  }, [world.construcoes, aprendizado.perfil.aprendidas.length, onboardingConcluida, aprenderAberto]);

  /**
   * Evoluções também são notícia: "A primeira cabana cresceu e virou uma casa."
   * Uma construção que evolui não muda a quantidade de construções, então o
   * efeito acima não a vê — este acompanha os ids das evoluções. As que vieram
   * do save já aconteceram há tempo: nascem "noticiadas".
   */
  const evolucoesNoticiadas = useRef<Set<string>>(
    new Set(world.construcoes.flatMap((e) => (e.evolucoes ?? []).map((ev) => ev.marco))),
  );
  useEffect(() => {
    const presentes = new Set<string>();
    const novas: NoticiaDoMundo[] = [];
    const agora = Date.now();
    for (const elemento of world.construcoes) {
      for (const evolucao of elemento.evolucoes ?? []) {
        presentes.add(evolucao.marco);
        if (evolucoesNoticiadas.current.has(evolucao.marco)) continue;
        evolucoesNoticiadas.current.add(evolucao.marco);
        novas.push({
          id: proximoIdDeNoticia.current++,
          // a frase DESTA evolução (a mesma construção pode ter subido duas vezes)
          texto: definicaoDoMarco(evolucao.marco)?.frase ?? fraseDeCrescimento(elemento),
          assunto: assuntoDeCrescimento(elemento),
          criadoEm: agora,
          vista: false,
        });
      }
    }
    // jornada recomeçada: as evoluções antigas sumiram junto com o mundo
    if (presentes.size < evolucoesNoticiadas.current.size) evolucoesNoticiadas.current = presentes;
    if (novas.length > 0) setNoticias((atuais) => [...atuais, ...novas].slice(-LIMITE_DE_NOTICIAS));
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
    setSelecao(null); // o foco automático assume a cena
    consumirDestaque();
  }, [destaque, aprenderAberto, world.gerando, mostrarIntro, consumirDestaque]);

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
    if (aprenderAberto || configAberto || conquistasAbertas || world.gerando) setSelecao(null);
  }, [aprenderAberto, configAberto, conquistasAbertas, world.gerando]);

  /**
   * Recomeçar: apaga conhecimento e mundo **juntos**. As duas mudanças saem no
   * mesmo evento, então o React as agrupa num render só, e o mundo novo nasce
   * pelo mesmo caminho seguro de sempre (fases + liberação das imagens).
   * As conquistas saem junto pelo efeito de `gerando`, que `novoMundo` dispara.
   */
  const recomecarJornada = useCallback(() => {
    aprendizado.reiniciar();
    setOnboardingConcluida(false); // jornada nova, boas-vindas de volta
    world.novoMundo();
  }, [aprendizado, world]);

  /*
   * SIMULAÇÃO DA JORNADA (modo dev). Nenhum atalho: cada passo faz o que o
   * botão APRENDI faz no Discovery — `aprendizado.aprender` e, se foi
   * 'aprendida', o mesmo `aoAprender` — e daí em diante é a progressão de
   * sempre: criação, evolução, caminhos, câmera, banner, notícias, World Pulse.
   * A curiosidade é a primeira ainda não aprendida na ordem do catálogo (a do
   * feed): determinística, sem sorteio.
   */
  const etapas = useMemo(() => etapasDaJornada(), []);
  const limiteDaJornada = etapas[etapas.length - 1]?.quantidade ?? 0;
  const aprendidasAgora = aprendizado.perfil.aprendidas.length;
  const aprenderProxima = () => {
    const curiosidade = paraDescobrir(aprendizado.curiosidades, aprendizado.perfil)[0];
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
            foco={novidade.id > 0 ? novidade : null}
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
      {dev.ativo && !aprenderAberto && !configAberto && !conquistasAbertas && (
        <SimulacaoFlutuante simulador={simulador} topo={insetsDoTopo + 8} />
      )}
      {/* A barra vale para o app inteiro: fica acima do mundo e do aparelho. */}
      <ActionBar
        itens={acoes}
        ativo={aprenderAberto ? 'discovery' : 'mundo'}
        // O seletor laranja viaja do Mundo ao Discovery com o MESMO progresso das páginas.
        seletor={{ progresso: navegacao, de: 'mundo', ate: 'discovery' }}
      />

      {/* A coleção é tela cheia e cobre a barra e as Configurações (de onde é
          aberta): o "voltar" dela fecha só ela e devolve a pessoa para lá. */}
      <AchievementsScreen aberta={conquistasAbertas} colecao={colecao} onFechar={fecharConquistas} />

      {/* Por último: enquanto está aberta, é a única coisa que aceita toque. */}
      {mostrarIntro && <JourneyIntro onContinuar={() => setOnboardingConcluida(true)} />}

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
