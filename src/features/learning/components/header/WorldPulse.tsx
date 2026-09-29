import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';

import { useColors, type Colors } from '@/shared/theme/colors';
import { ICONS_DO_PULSO } from '@/shared/ui/icons';

import type { WorldPulseItem } from '../../presentation/worldPulse';

type Variante = 'progressao' | 'ambiental' | 'conquista' | 'descoberta';

/**
 * A identidade de cada tipo, em dados — não em `if`.
 *
 * Os acentos são TOKENS da identidade, não cores: o laranja é "o mundo está vivo
 * agora", o laranja escuro é marco e descoberta. A notícia ambiental não tem
 * acento próprio — é o dia comum: o ponto dela é o laranja da identidade, mas
 * quieto, sem respirar, e a hierarquia mostra que ela vale menos que uma
 * novidade real.
 *
 * `descoberta` já tem a sua linha: quando os achados do mapa existirem, o
 * World Pulse está pronto para eles.
 */
const ESTILO: Record<
  Variante,
  { rotulo: string; marca: 'pulso' | 'ponto' | string; acento: keyof Pick<Colors, 'accent' | 'accentStrong'> | null }
> = {
  progressao: { rotulo: 'MUNDO AGORA', marca: 'pulso', acento: 'accent' },
  ambiental: { rotulo: 'MUNDO AGORA', marca: 'ponto', acento: null },
  conquista: { rotulo: 'NOVA CONQUISTA', marca: '✦', acento: 'accentStrong' },
  descoberta: { rotulo: 'DESCOBERTA', marca: '!', acento: 'accentStrong' },
};

/**
 * O controle do ícone: quadrado arredondado, encostado na margem direita — a
 * mesma borda da engrenagem. Menor que a altura do pulso (≈39), então o header
 * não cresce por causa dele.
 */
const ICONE = 36;

type Props = {
  /** O item desta entrada, escolhido pela composição quando o aparelho abriu. */
  item: WorldPulseItem | null;
};

/**
 * O World Pulse: o mundo falando com quem abre o feed.
 *
 * É a segunda seção do header, não um card: rótulo pequeno com o sinal de
 * status, a manchete logo abaixo e o ícone à direita, na coluna da
 * engrenagem. Quem separa é o espaço e o contraste tipográfico — sem caixa,
 * borda ou sombra em volta do pulso. As cores são só as do tema; nada vem da
 * fotografia. O laranja aparece em poucos pontos: o sinal de status e o ícone.
 *
 * Mostra um item só, e não troca sozinho: a escolha vale até a próxima vez que
 * o aparelho abrir.
 */
export function WorldPulse({ item }: Props) {
  const c = useColors();
  if (!item) return <View style={styles.reserva} />;

  const variante: Variante = item.tipo === 'noticia' ? item.categoria : item.tipo;
  const estilo = ESTILO[variante];
  const acentoDoTipo = estilo.acento ? c[estilo.acento] : null;
  const quando = item.tipo === 'noticia' && item.categoria === 'progressao' ? item.quando : null;

  return (
    <View
      accessible
      accessibilityLabel={`${estilo.rotulo}: ${'titulo' in item ? `${item.titulo}. ` : ''}${item.texto}`}
      style={styles.pulso}
    >
      <View style={styles.textos}>
        <View style={styles.rotuloLinha}>
          {/* O sinal é identidade (laranja); o rótulo é estrutura (tinta). */}
          <Marca tipo={estilo.marca} cor={acentoDoTipo ?? c.accent} />
          <Text style={[styles.rotulo, { color: c.ink }]}>{estilo.rotulo}</Text>
          {quando && <Text style={[styles.quando, { color: c.muted }]}>· {quando}</Text>}
        </View>
        {item.tipo === 'noticia' ? (
          <Manchete texto={item.texto} cor={c.ink} />
        ) : (
          // Conquista e descoberta: nome forte e o que foi, uma linha cada.
          <>
            <Text style={[styles.titulo, { color: c.ink }]} numberOfLines={1}>
              {item.titulo}
            </Text>
            <Text style={[styles.texto, { color: c.muted }]} numberOfLines={1}>
              {item.texto}
            </Text>
          </>
        )}
      </View>

      {/* Superfície do tema, fio laranja escuro e símbolo laranja: parece um
          controle do World Pulse, não um ícone solto. */}
      <View style={[styles.icone, { backgroundColor: c.panel, borderColor: c.accentStrong }]}>
        <Text style={[styles.iconeTexto, { color: c.accent }]}>{ICONS_DO_PULSO[item.icone]}</Text>
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

/** Quanto a frase fica parada, alinhada, antes de cada volta. */
const PAUSA_MS = 5000;
/** Altura da linha da manchete — e do trilho, que não pode crescer. */
const LINHA_DA_MANCHETE = 21;
/** Velocidade do deslize: devagar, é manchete — não painel de aeroporto. */
const PIXELS_POR_SEGUNDO = 35;
/** O respiro entre o fim da frase e o começo da cópia dela. */
const ESPACO_ENTRE_VOLTAS = 40;
/**
 * Largura da faixa onde a frase é medida e corre. Grande o bastante para
 * qualquer manchete (e a cópia): é o que deixa o texto ter a largura NATURAL, sem "…".
 */
const FAIXA = 10000;

/**
 * A manchete da notícia, como um ticker contínuo.
 *
 * Coube: fica parada. Não coube: espera 5 s, e a frase anda da direita para a
 * esquerda; logo depois do fim dela, após um respiro, vem uma CÓPIA da frase.
 * A volta termina quando a cópia chega exatamente onde a original começou —
 * então a faixa é trocada de volta para 0, que desenha a mesma coisa (a
 * original no lugar da cópia): nenhum salto, nenhuma ré. Espera 5 s e repete.
 * Só a frase se move — o rótulo e o resto do Pulse ficam parados.
 *
 * O texto é medido numa faixa sem limite de largura. Dentro da largura do
 * trilho o React Native o encolheria até caber, com "…", e o excesso medido
 * seria sempre zero.
 */
function Manchete({ texto, cor }: { texto: string; cor: string }) {
  const [larguraCaixa, setLarguraCaixa] = useState(0);
  const [larguraTexto, setLarguraTexto] = useState(0);
  const deslocamento = useSharedValue(0);

  // Coube (ou ainda não foi medido): nada se move, e não há cópia.
  const corre = larguraCaixa > 0 && larguraTexto > 0 && larguraTexto - larguraCaixa > 1;

  useEffect(() => {
    // Notícia nova (ou medida nova): sempre recomeça do início, parada.
    cancelAnimation(deslocamento);
    deslocamento.set(0);
    if (!corre) return;

    // Uma volta = a frase inteira mais o respiro: a cópia pousa onde a original estava.
    const volta = larguraTexto + ESPACO_ENTRE_VOLTAS;
    deslocamento.set(
      withRepeat(
        withSequence(
          withDelay(
            PAUSA_MS,
            withTiming(-volta, { duration: (volta / PIXELS_POR_SEGUNDO) * 1000, easing: Easing.linear }),
          ),
          // Troca instantânea para 0: a imagem é idêntica, então não se vê.
          withTiming(0, { duration: 0 }),
        ),
        -1,
      ),
    );
  }, [corre, larguraTexto, deslocamento, texto]);

  // Ao sair da tela, a animação infinita para junto.
  useEffect(() => () => cancelAnimation(deslocamento), [deslocamento]);

  const corrida = useAnimatedStyle(() => ({
    transform: [{ translateX: deslocamento.value }],
  }));

  return (
    <View style={styles.trilho} onLayout={(e) => setLarguraCaixa(e.nativeEvent.layout.width)}>
      <Animated.View style={[styles.faixa, corrida]}>
        {/* Em linha, sem limite: a caixa do texto abraça a frase, e o
            `onLayout` devolve a largura natural dela. */}
        <Text
          numberOfLines={1}
          onLayout={(e) => setLarguraTexto(e.nativeEvent.layout.width)}
          style={[styles.manchete, { color: cor }]}
        >
          {texto}
        </Text>
        {corre && (
          // A cópia que fecha o loop. O leitor de tela já tem a frase no rótulo do Pulse.
          <Text
            numberOfLines={1}
            accessible={false}
            importantForAccessibility="no"
            style={[styles.manchete, styles.copia, { color: cor }]}
          >
            {texto}
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Mesma altura do pulso de uma linha, para o header não pular na abertura.
  reserva: { height: 40 },
  pulso: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textos: { flex: 1, gap: 4 },
  rotuloLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 14 },
  ponto: { width: 6, height: 6, borderRadius: 3 },
  marca: { fontSize: 11, fontWeight: '800', lineHeight: 13 },
  rotulo: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4 },
  quando: { fontSize: 11 },
  // Altura fixa de uma linha: a faixa é absoluta e não dá altura ao trilho.
  trilho: { overflow: 'hidden', height: LINHA_DA_MANCHETE },
  faixa: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: FAIXA,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  copia: { marginLeft: ESPACO_ENTRE_VOLTAS },
  manchete: {
    fontSize: 15,
    lineHeight: LINHA_DA_MANCHETE,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  titulo: { fontSize: 15, lineHeight: 20, fontWeight: '700', letterSpacing: -0.1 },
  texto: { fontSize: 13, lineHeight: 18 },
  icone: {
    width: ICONE,
    height: ICONE,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeTexto: { fontSize: 17, lineHeight: 21 },
});
