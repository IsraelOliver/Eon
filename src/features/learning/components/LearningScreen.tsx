import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useColors } from '@/shared/theme/colors';

import type { Aprendizado } from '../hooks/useLearning';
import type { Curiosity, CuriosityId, LearningResult } from '../engine/types';
import type { WorldPulseItem } from '../presentation/worldPulse';
import { paraDescobrir } from '../presentation/descoberta';
import { aplicarOrdem } from '../presentation/ordemDoFeed';
import { CuriosityReader } from './CuriosityReader';
import { DiscoveryFeed } from './DiscoveryFeed';
import { LearningHeader } from './header/LearningHeader';

type Props = {
  /** Estado de aprendizagem, criado pela composição (o save precisa dele). */
  aprendizado: Aprendizado;
  /**
   * Conhecimento NOVO acabou de ser registrado. Só dispara em `'aprendida'` —
   * quem decide o que é repetição é o engine de learning.
   * A composição usa isso para fazer o mundo crescer; `learning` não conhece o mundo.
   */
  onAprendido?: (resultado: LearningResult) => void;
  /** Mostra "Ver no mundo" no fim da leitura. */
  onVerMundo?: () => void;
  /**
   * O que o World Pulse mostra nesta entrada, já decidido pela composição.
   * A tela não escolhe nada: ela mostra o que foi escolhido quando abriu.
   */
  pulso?: WorldPulseItem | null;
  /** A engrenagem do topo é o único caminho para as Configurações. */
  onConfiguracoes?: () => void;
  /** Muda de valor para o feed rolar até o topo. Só passa adiante. */
  voltarAoTopo?: number;
  /**
   * A ordem do feed nesta sessão do app (ids; presentation/ordemDoFeed.ts).
   * Sem ela, vale a ordem do catálogo.
   */
  ordem?: readonly string[];
  /**
   * A leitura de uma curiosidade abriu (true) ou fechou (false). A composição
   * esconde a ActionBar enquanto se lê; o feed continua montado por baixo.
   */
  onLeitura?: (aberta: boolean) => void;
  /**
   * O aparelho está aberto e a tela à vista. A tela fica montada mesmo fechada,
   * então é isto que diz se ela pode mandar na barra de status.
   */
  visivel?: boolean;
};

/**
 * Aba Aprender: o Discovery Feed e, por cima dele, a leitura.
 *
 * O feed mostra **só o que ainda não foi aprendido**. O que já foi aprendido não
 * some do app: sai deste fluxo e passa a pertencer à coleção da pessoa, que terá
 * tela própria de consulta.
 */
export function LearningScreen({
  aprendizado, onAprendido, onVerMundo, pulso = null, onConfiguracoes, voltarAoTopo,
  visivel = false, ordem, onLeitura,
}: Props) {
  const c = useColors();
  const [abertaId, setAbertaId] = useState<CuriosityId | null>(null);
  /** O header já rolou para fora de baixo da status bar: o alto é fotografia. */
  const [headerFora, setHeaderFora] = useState(false);

  // A leitura procura no catálogo INTEIRO, não no feed: uma curiosidade
  // recém-aprendida continua aberta e legível até quem está lendo decidir sair.
  const aberta = aprendizado.curiosidades.find((cu) => cu.id === abertaId) ?? null;

  /*
   * O feed congela enquanto a leitura está aberta.
   *
   * Sem isto, tocar "Registrar descoberta" reconstruiria a lista por baixo do leitor e, ao
   * fechar, o feed apareceria em outra posição — a descoberta seguinte pulando
   * para o lugar da que acabou de sair. Assim a lista só se atualiza quando a
   * pessoa volta para o feed, que é exatamente quando isso não incomoda.
   */
  // o catálogo na ordem da sessão; quem tira as aprendidas é o perfil (paraDescobrir)
  const ordenadas = useMemo(
    () => (ordem ? aplicarOrdem(aprendizado.curiosidades, ordem) : aprendizado.curiosidades),
    [aprendizado.curiosidades, ordem],
  );
  const [visiveis, setVisiveis] = useState(() => paraDescobrir(ordenadas, aprendizado.perfil));
  useEffect(() => {
    if (abertaId !== null) return;
    setVisiveis(paraDescobrir(ordenadas, aprendizado.perfil));
  }, [abertaId, ordenadas, aprendizado.perfil]);

  // Avisa quem ligou que a leitura abriu ou fechou (é só isso: nada desmonta).
  const lendo = aberta !== null;
  useEffect(() => {
    onLeitura?.(lendo);
  }, [lendo, onLeitura]);

  // O engine registra; aqui só avisamos quem ligou, e só quando houve progresso.
  const aprender = (curiosidade: Curiosity): LearningResult => {
    const resultado = aprendizado.aprender(curiosidade);
    if (resultado.status === 'aprendida') onAprendido?.(resultado);
    return resultado;
  };

  // Ao ir ver o mundo, o aparelho fecha e a leitura volta para o feed.
  const verMundo = onVerMundo
    ? () => {
        setAbertaId(null);
        onVerMundo();
      }
    : undefined;

  return (
    <View style={[styles.tela, { backgroundColor: c.fundoFeed }]}>
      {/* Com o header à vista, a barra de status segue o tema, como ele. Depois
          que ele sobe, o alto da tela é fotografia escurecida: ícones claros. A
          leitura tem o próprio fundo, e o `StatusBar` empilha. */}
      {visivel && !aberta && headerFora && <StatusBar style="light" />}

      <DiscoveryFeed
        curiosidades={visiveis}
        // O header mora na primeira página do feed e rola com ela.
        cabecalho={<LearningHeader onConfiguracoes={onConfiguracoes} pulso={pulso} />}
        onHeaderFora={setHeaderFora}
        onLer={setAbertaId}
        voltarAoTopo={voltarAoTopo}
      />

      {aberta && (
        <CuriosityReader
          // cada curiosidade abre do jeito dela: resumo à vista, texto recolhido
          key={aberta.id}
          curiosidade={aberta}
          aprendida={aprendizado.jaAprendeu(aberta.id)}
          onVoltar={() => setAbertaId(null)}
          onAprender={aprender}
          onVerMundo={verMundo}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
});
