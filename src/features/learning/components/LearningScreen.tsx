import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useColors } from '@/shared/theme/colors';

import type { Aprendizado } from '../hooks/useLearning';
import type { Curiosity, CuriosityId, LearningResult } from '../engine/types';
import type { WorldPulseItem } from '../presentation/worldPulse';
import { resolverAtmosfera } from '../presentation/atmosfera';
import { paraDescobrir } from '../presentation/descoberta';
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
  aprendizado, onAprendido, onVerMundo, pulso = null, onConfiguracoes, visivel = false,
}: Props) {
  const c = useColors();
  const [abertaId, setAbertaId] = useState<CuriosityId | null>(null);

  // A leitura procura no catálogo INTEIRO, não no feed: uma curiosidade
  // recém-aprendida continua aberta e legível até quem está lendo decidir sair.
  const aberta = aprendizado.curiosidades.find((cu) => cu.id === abertaId) ?? null;

  /*
   * O feed congela enquanto a leitura está aberta.
   *
   * Sem isto, tocar APRENDI reconstruiria a lista por baixo do leitor e, ao
   * fechar, o feed apareceria em outra posição — a descoberta seguinte pulando
   * para o lugar da que acabou de sair. Assim a lista só se atualiza quando a
   * pessoa volta para o feed, que é exatamente quando isso não incomoda.
   */
  const [visiveis, setVisiveis] = useState(() =>
    paraDescobrir(aprendizado.curiosidades, aprendizado.perfil),
  );
  useEffect(() => {
    if (abertaId !== null) return;
    setVisiveis(paraDescobrir(aprendizado.curiosidades, aprendizado.perfil));
  }, [abertaId, aprendizado.curiosidades, aprendizado.perfil]);

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

  /*
   * A atmosfera do topo é a da PRIMEIRA curiosidade: é sobre ela que Éon e o
   * World Pulse flutuam. Sem curiosidade (feed vazio), não há foto atrás e o
   * cabeçalho volta a pousar no fundo da paleta.
   */
  const primeira = visiveis[0];
  const atmosfera = primeira ? resolverAtmosfera(primeira) : null;

  return (
    <View style={[styles.tela, { backgroundColor: c.fundoFeed }]}>
      {/*
        * Com o feed à vista, o alto da tela é sempre fotografia escurecida — a
        * atmosfera no primeiro post, a emenda escura nos outros —, então os
        * ícones da barra de status ficam claros. A leitura e o mundo têm o
        * próprio fundo: fora daqui, quem manda de novo é a paleta (_layout).
        * O `StatusBar` empilha: desmontar este devolve o estilo anterior.
        */}
      {visivel && !aberta && atmosfera && <StatusBar style="light" />}

      <DiscoveryFeed
        curiosidades={visiveis}
        cabecalho={
          <LearningHeader onConfiguracoes={onConfiguracoes} pulso={pulso} atmosfera={atmosfera} />
        }
        onLer={setAbertaId}
      />

      {aberta && (
        <CuriosityReader
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
