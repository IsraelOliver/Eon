import { Image, Platform, Pressable, StyleSheet, View, type ImageStyle } from 'react-native';
import Animated, {
  interpolateColor, useAnimatedStyle, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/shared/theme/colors';

import type { Icon } from './icons';
import { deslocamentoDoSeletor } from './navegacao';

/** Distância da barra até a safe area de baixo. */
export const MARGEM_ACTION_BAR = 12;

// Compacta de propósito: um controle pequeno que pertence ao mundo, não uma
// peça de interface grande pousada sobre o mapa.
const PADDING = 3;
const GAP = 4;
const BORDA = 1;
const ITEM_LARGURA = 44;
const ITEM_ALTURA = 36;
/** O seletor destaca o ícone, não o item inteiro: um terço da barra, não metade. */
const SELETOR_LARGURA = 32;
const SELETOR_ALTURA = 30;
/**
 * A área de toque vai até a borda da barra: o item visível é 44×36, mas o toque
 * cobre 48×44 — acima do mínimo de 44×44. (No iOS o toque não passa do limite
 * da barra, então este é o máximo que cabe nela.)
 */
const ALCANCE = { top: PADDING + BORDA, bottom: PADDING + BORDA, left: GAP / 2, right: GAP / 2 };
/** Do começo de um item ao começo do seguinte: o passo do seletor. */
const PASSO = ITEM_LARGURA + GAP;
/**
 * Tamanho de um ícone em pixel art (arte de 14×14). Nas telas 3x dá 56 px
 * exatos: cada pixel da arte vira um bloco 4×4, sem ampliação em tempo de
 * execução. Visualmente pesa o mesmo que o globo de texto ao lado.
 */
const TAMANHO_DO_SPRITE = 56 / 3;
/** Feedback de toque: só o ícone esmaece um pouco. Nada de fundo nem halo. */
const OPACIDADE_PRESSIONADO = 0.7;

/**
 * Só na web: a web não escolhe o arquivo da densidade (usa o base, a arte de
 * 32 px) e o navegador amplia suavizando — pixel art borrada. `pixelated` pede
 * vizinho-mais-próximo. No iOS não precisa: lá o arquivo já chega no tamanho
 * exato da tela.
 */
const PIXELADO =
  Platform.OS === 'web' ? ({ imageRendering: 'pixelated' } as unknown as ImageStyle) : null;

/** Altura da barra, borda inclusa. */
export const ALTURA_ACTION_BAR = ITEM_ALTURA + PADDING * 2 + BORDA * 2;
/** Quanto a barra ocupa na borda de baixo, fora a safe area. */
export const ESPACO_ACTION_BAR = ALTURA_ACTION_BAR + MARGEM_ACTION_BAR;

export interface AcaoDaBarra {
  chave: string;
  icone: Icon;
  /** Lida pelo leitor de tela; a barra é só de ícones. */
  rotulo: string;
  onPress: () => void;
}

/**
 * O seletor e o progresso que o move. `de` é o item sob ele em 0, `ate`
 * o item sob ele em 1. É o MESMO progresso que move as páginas.
 */
export interface SeletorDaBarra {
  progresso: SharedValue<number>;
  de: string;
  ate: string;
}

type Props = {
  itens: readonly AcaoDaBarra[];
  /** O destino lógico — para o leitor de tela, que não vê animação. */
  ativo: string;
  seletor: SeletorDaBarra;
};

/**
 * Barra de ações: um controle compacto e flutuante, centralizado, que vale para
 * o app inteiro — fica acima do Mundo e do Discovery e não desliza com eles.
 * UI moderna, controle pequeno, sprites em pixel art: ela pertence ao mundo.
 *
 * O que se move é o seletor: **um único** retângulo laranja que viaja de um
 * ícone ao outro, derivado do mesmo progresso das páginas. Nunca um fundo
 * desmontando à esquerda e outro montando à direita — é o mesmo elemento
 * atravessando.
 */
export function ActionBar({ itens, ativo, seletor }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  // Só primitivos entram no worklet: nada de objetos com funções dentro.
  const progresso = seletor.progresso;
  const indiceDe = Math.max(0, itens.findIndex((item) => item.chave === seletor.de));
  const indiceAte = Math.max(0, itens.findIndex((item) => item.chave === seletor.ate));

  const deslize = useAnimatedStyle(() => ({
    transform: [
      { translateX: deslocamentoDoSeletor(progresso.value, indiceDe, indiceAte, PASSO) },
    ],
  }));

  return (
    <View pointerEvents="box-none" style={[styles.area, { bottom: insets.bottom + MARGEM_ACTION_BAR }]}>
      <View style={[styles.capsula, { backgroundColor: c.barra, borderColor: c.barraBorda }]}>
        {/* Por baixo dos ícones: vem antes na árvore, então é desenhado atrás. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.seletor,
            { backgroundColor: c.barraAtivo, borderColor: c.barraAtivoBorda },
            deslize,
          ]}
        />
        {itens.map((item) => (
          <ItemDaBarra
            key={item.chave}
            item={item}
            selecionado={item.chave === ativo}
            progresso={progresso}
            // Quanto este item fica sob o seletor: 1 − p no de, p no ate, 0 nos outros.
            papel={item.chave === seletor.de ? 'de' : item.chave === seletor.ate ? 'ate' : 'nenhum'}
          />
        ))}
      </View>
    </View>
  );
}

function ItemDaBarra({
  item, selecionado, progresso, papel,
}: {
  item: AcaoDaBarra;
  selecionado: boolean;
  progresso: SharedValue<number>;
  papel: 'de' | 'ate' | 'nenhum';
}) {
  const c = useColors();
  const neutro = c.barraTexto;
  const ativo = c.barraTextoAtivo;

  /*
   * A cor do ícone acompanha o seletor passando por baixo dele: escura quando o
   * laranja está atrás, clara quando saiu. Mesmo progresso, então o ícone troca
   * de cor exatamente enquanto o seletor chega ou vai embora.
   */
  const cor = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, progresso.value));
    const sob = papel === 'de' ? 1 - p : papel === 'ate' ? p : 0;
    return { color: interpolateColor(sob, [0, 1], [neutro, ativo]) };
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.rotulo}
      accessibilityState={{ selected: selecionado }}
      onPress={item.onPress}
      hitSlop={ALCANCE}
      // O seletor é irmão do item, não filho: esmaecer o item não toca nele.
      style={({ pressed }) => [styles.item, pressed && { opacity: OPACIDADE_PRESSIONADO }]}
    >
      {typeof item.icone === 'string' ? (
        <Animated.Text style={[styles.icone, cor]}>{item.icone}</Animated.Text>
      ) : (
        // Sprite colorido: desenhado como foi feito. Sem tint, sem cor animada —
        // quem mostra o ativo é o seletor laranja passando por trás dele.
        <Image source={item.icone} style={[styles.imagem, PIXELADO]} resizeMode="contain" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  area: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  // Cantos arredondados, mas não cápsula; fio laranja escuro e nenhuma sombra:
  // a barra se assenta no mapa em vez de flutuar acima dele.
  capsula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
    padding: PADDING,
    borderRadius: 10,
    borderWidth: BORDA,
  },
  // Centrado sob o ícone do primeiro item. Quem o leva ao segundo é o
  // `translateX` — o passo é o mesmo dos itens, então ele chega centrado lá também.
  seletor: {
    position: 'absolute',
    left: PADDING + (ITEM_LARGURA - SELETOR_LARGURA) / 2,
    top: PADDING + (ITEM_ALTURA - SELETOR_ALTURA) / 2,
    width: SELETOR_LARGURA,
    height: SELETOR_ALTURA,
    borderRadius: 7,
    borderWidth: BORDA,
  },
  item: {
    width: ITEM_LARGURA,
    height: ITEM_ALTURA,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  icone: { fontSize: 22, lineHeight: 26 },
  imagem: { width: TAMANHO_DO_SPRITE, height: TAMANHO_DO_SPRITE },
});
