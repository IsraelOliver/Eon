import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';

import { useColors } from '@/shared/theme/colors';
import { OURO_DE_CONQUISTA } from '@/shared/theme/cor';
import { ICONS_DO_PULSO } from '@/shared/ui/icons';

import type { WorldPulseItem } from '../../presentation/worldPulse';

type Variante = 'progressao' | 'ambiental' | 'conquista' | 'descoberta';

/**
 * A identidade de cada tipo, em dados — não em `if`.
 *
 * Os acentos são fixos, de tom médio, e funcionam no claro e no escuro: o verde
 * é "o mundo está vivo agora", o ouro é marco, o violeta é mistério. A notícia
 * ambiental não tem acento de propósito — é o dia comum, e a hierarquia precisa
 * mostrar que ela vale menos que uma novidade real.
 *
 * `descoberta` já tem a sua linha: quando os achados do mapa existirem, o card
 * está pronto para eles.
 */
const ESTILO: Record<Variante, { rotulo: string; marca: 'pulso' | 'ponto' | string; acento: string | null }> = {
  progressao: { rotulo: 'MUNDO AGORA', marca: 'pulso', acento: '#3fae7a' },
  ambiental: { rotulo: 'MUNDO AGORA', marca: 'ponto', acento: null },
  conquista: { rotulo: 'NOVA CONQUISTA', marca: '✦', acento: OURO_DE_CONQUISTA },
  descoberta: { rotulo: 'DESCOBERTA', marca: '!', acento: '#8a63d2' },
};

/** Canto reservado ao sprite pixel art (24–32 px) que vai substituir o glifo. */
const ICONE = 32;

type Props = {
  /** O item desta entrada, escolhido pela composição quando o aparelho abriu. */
  item: WorldPulseItem | null;
};

/**
 * O World Pulse: o mundo falando com quem abre o feed.
 *
 * Um card editorial compacto — faixa fina de cor no topo, linha de status,
 * manchete forte e um canto para o ícone. Menos "bolha" que os cards de
 * curiosidade (sombra curta, raio menor), porque ele é manchete, não pôster.
 *
 * Mostra um item só, e não troca sozinho: a escolha vale até a próxima vez que
 * o aparelho abrir.
 */
export function WorldPulse({ item }: Props) {
  const c = useColors();
  if (!item) return <View style={styles.reserva} />;

  const variante: Variante = item.tipo === 'noticia' ? item.categoria : item.tipo;
  const estilo = ESTILO[variante];
  const acento = estilo.acento ?? c.muted;
  const quando = item.tipo === 'noticia' && item.categoria === 'progressao' ? item.quando : null;

  return (
    <View
      accessible
      accessibilityLabel={`${estilo.rotulo}: ${'titulo' in item ? `${item.titulo}. ` : ''}${item.texto}`}
      style={[styles.sombra, { backgroundColor: c.cartao }]}
    >
      <View style={[styles.cartao, { backgroundColor: c.cartao, borderColor: c.line }]}>
        <View style={[styles.faixa, { backgroundColor: estilo.acento ?? c.line }]} />

        <View style={styles.corpo}>
          <View style={styles.textos}>
            <View style={styles.rotuloLinha}>
              <Marca tipo={estilo.marca} cor={acento} />
              <Text style={[styles.rotulo, { color: estilo.acento ?? c.muted }]}>{estilo.rotulo}</Text>
              {quando && <Text style={[styles.quando, { color: c.muted }]}>{quando}</Text>}
            </View>

            {item.tipo === 'noticia' ? (
              <Manchete texto={item.texto} cor={c.ink} />
            ) : (
              // Conquista e descoberta têm duas linhas: nome forte e o que foi.
              // Sem deslizar — elas cabem, e marco merece ser lido parado.
              <>
                <Text style={[styles.titulo, { color: c.ink }]} numberOfLines={1}>
                  {item.titulo}
                </Text>
                <Text style={[styles.texto, { color: c.muted }]} numberOfLines={2}>
                  {item.texto}
                </Text>
              </>
            )}
          </View>

          <View
            style={[
              styles.icone,
              { backgroundColor: estilo.acento ? `${estilo.acento}1f` : c.panel },
            ]}
          >
            <Text style={[styles.iconeTexto, { color: acento }]}>{ICONS_DO_PULSO[item.icone]}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/** O sinal da linha de status: ponto vivo, ponto quieto ou um glifo. */
function Marca({ tipo, cor }: { tipo: string; cor: string }) {
  if (tipo === 'pulso') return <PontoVivo cor={cor} />;
  if (tipo === 'ponto') return <View style={[styles.ponto, { backgroundColor: cor }]} />;
  return <Text style={[styles.marca, { color: cor }]}>{tipo}</Text>;
}

/** Respira devagar, sem piscar: 1,4 s para cada lado, nunca some de todo. */
function PontoVivo({ cor }: { cor: string }) {
  const brilho = useSharedValue(1);

  useEffect(() => {
    brilho.set(
      withRepeat(withTiming(0.35, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, [brilho]);

  const estilo = useAnimatedStyle(() => ({ opacity: brilho.value }));
  return <Animated.View style={[styles.ponto, { backgroundColor: cor }, estilo]} />;
}

/** Quanto tempo a frase descansa em cada ponta antes de deslizar. */
const PAUSA_MS = 2000;
/** Milissegundos por pixel. Devagar: é manchete, não painel de aeroporto. */
const MS_POR_PIXEL = 34;

/**
 * A manchete da notícia. Se cabe, fica parada. Se não cabe, vai e volta devagar,
 * com pausa longa nas pontas — sem cortar palavra e sem piscar.
 */
function Manchete({ texto, cor }: { texto: string; cor: string }) {
  const [larguraCaixa, setLarguraCaixa] = useState(0);
  const [larguraTexto, setLarguraTexto] = useState(0);
  const deslocamento = useSharedValue(0);

  useEffect(() => {
    const excesso = larguraTexto - larguraCaixa;

    // Coube: nada se move. Também é o caso de antes da primeira medição.
    if (larguraCaixa === 0 || excesso <= 0) {
      deslocamento.set(0);
      return;
    }

    const duracao = excesso * MS_POR_PIXEL;
    deslocamento.set(
      withRepeat(
        withSequence(
          withDelay(PAUSA_MS, withTiming(-excesso, { duration: duracao, easing: Easing.linear })),
          withDelay(PAUSA_MS, withTiming(0, { duration: duracao, easing: Easing.linear })),
        ),
        -1,
      ),
    );
  }, [larguraCaixa, larguraTexto, deslocamento, texto]);

  const corrida = useAnimatedStyle(() => ({
    transform: [{ translateX: deslocamento.value }],
  }));

  return (
    <View style={styles.trilho} onLayout={(e) => setLarguraCaixa(e.nativeEvent.layout.width)}>
      <Animated.View style={[styles.corredor, corrida]}>
        {/* `flexShrink: 0` é o que faz a medida ser a largura NATURAL da frase:
            sem isso o texto encolheria para caber e nunca haveria deslocamento. */}
        <Text
          numberOfLines={1}
          onLayout={(e) => setLarguraTexto(e.nativeEvent.layout.width)}
          style={[styles.manchete, { color: cor }]}
        >
          {texto}
        </Text>
      </Animated.View>
    </View>
  );
}

const RAIO = 14;

const styles = StyleSheet.create({
  // Mesmo espaço do card, para o topo não pular no primeiro quadro da abertura.
  reserva: { height: 76 },
  // Sombra num embrulho sem `overflow`: com `overflow: hidden` o iOS a corta.
  sombra: {
    marginHorizontal: 14,
    borderRadius: RAIO,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cartao: { borderRadius: RAIO, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  faixa: { height: 3 },
  corpo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 13,
  },
  textos: { flex: 1, gap: 5 },
  rotuloLinha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ponto: { width: 6, height: 6, borderRadius: 3 },
  marca: { fontSize: 11, fontWeight: '800', lineHeight: 13 },
  rotulo: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4 },
  quando: { fontSize: 11, marginLeft: 'auto' },
  trilho: { overflow: 'hidden' },
  corredor: { flexDirection: 'row' },
  manchete: { fontSize: 16, lineHeight: 21, fontWeight: '700', letterSpacing: -0.2, flexShrink: 0 },
  titulo: { fontSize: 17, lineHeight: 22, fontWeight: '800', letterSpacing: -0.2 },
  texto: { fontSize: 13.5, lineHeight: 18 },
  icone: {
    width: ICONE,
    height: ICONE,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeTexto: { fontSize: 17, lineHeight: 21 },
});
