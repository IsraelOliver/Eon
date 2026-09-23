import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Gradient } from '@/shared/ui/Gradient';

import { NOMES_DE_TEMA } from '../engine/themes';
import type { CuriosityEntry } from '../data/curiosities';
import { CAPA_DO_TEMA } from '../presentation/coverTheme';
import {
  ALTURA_DA_PONTE, ALTURA_DO_TOPO, DEGRADE_DA_BASE, DEGRADE_DO_TOPO, paradasDaPonte,
} from '../presentation/degradeDoPost';
import { tamanhoDoTitulo } from '../presentation/feedLayout';

/**
 * O texto do post vive sempre sobre fotografia escurecida, então é branco nos
 * dois modos (claro e escuro). Por isso não sai de `shared/theme/colors.ts` e
 * não muda com a paleta do laboratório — a foto é que manda aqui.
 */
const BRANCO = '#ffffff';
const BRANCO_FRACO = 'rgba(255,255,255,0.8)';

type Props = {
  curiosidade: CuriosityEntry;
  /** Uma viewport inteira: o post É a tela, não um cartão dentro dela. */
  altura: number;
  recuoTopo: number;
  recuoBase: number;
  /**
   * O primeiro post nasce colado no World Pulse, então o alto dele dissolve a
   * COR DA INTERFACE, não uma sombra preta. Os outros encontram o degradê
   * escuro do post de cima.
   */
  primeiro?: boolean;
  /** `fundoFeed` da paleta ativa: a cor de onde a primeira fotografia nasce. */
  corDaInterface?: string;
  onLer: () => void;
};

/**
 * Uma descoberta ocupando a tela inteira: fotografia de borda a borda, chip do
 * tema, título forte, preview curto e `Ler →`.
 *
 * Sem margem, sem raio, sem cartão. Nada de metadados — nem selo de aprendida:
 * no Discovery Feed **todo post é ainda não aprendido**. Quem mostra esse estado
 * é o leitor (`CuriosityReader`), que a futura tela de Aprendidas reaproveita.
 *
 * O post inteiro é o botão (comportamento de sempre), então a área de toque do
 * `Ler →` é a tela toda — e existe um nó de acessibilidade só, em vez de dois
 * botões aninhados dizendo a mesma coisa.
 */
function Post({
  curiosidade, altura, recuoTopo, recuoBase, primeiro = false, corDaInterface, onLer,
}: Props) {
  const janela = useWindowDimensions();
  const capa = curiosidade.capa;
  const tema = CAPA_DO_TEMA[curiosidade.tema];
  const fonte = tamanhoDoTitulo(janela.width);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${NOMES_DE_TEMA[curiosidade.tema]}: ${curiosidade.titulo}`}
      accessibilityHint="Abre a curiosidade"
      onPress={onLer}
      style={[styles.post, { height: altura }]}
    >
      {({ pressed }) => (
        <>
          {capa ? (
            <Image
              source={capa}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={180}
              // Some com a imagem antiga ao reaproveitar a view na rolagem.
              recyclingKey={curiosidade.id}
            />
          ) : (
            // Sem imagem ainda: a capa do tema segura o lugar sem quebrar o layout.
            <View style={[StyleSheet.absoluteFill, { backgroundColor: tema.de }]}>
              <Gradient paradas={`${tema.de} 0%, ${tema.para} 100%`} />
              <Text style={styles.simbolo}>{tema.simbolo}</Text>
            </View>
          )}

          {/* O alto, num bloco próprio: sem `absoluteFill`, para a sombra viver
              só na faixa de cima e não lavar a fotografia inteira.
              Os dois overlays nunca se somam — um OU o outro. */}
          {primeiro && corDaInterface ? (
            <View style={[styles.ponte, { height: ALTURA_DA_PONTE }]} pointerEvents="none">
              <Gradient paradas={paradasDaPonte(corDaInterface)} />
            </View>
          ) : (
            <View style={[styles.topoDegrade, { height: ALTURA_DO_TOPO }]} pointerEvents="none">
              <Gradient paradas={DEGRADE_DO_TOPO} />
            </View>
          )}

          <Gradient paradas={DEGRADE_DA_BASE} />

          {/* O chip usa a cor do PRÓPRIO tema: identidade de conteúdo não muda
              quando a paleta da interface muda. O `gap` já é o lugar do sprite
              pixel art que vai entrar antes do nome. */}
          <View style={[styles.chip, { top: recuoTopo, backgroundColor: tema.de }]}>
            <Text style={styles.chipTexto}>
              {NOMES_DE_TEMA[curiosidade.tema].toUpperCase()}
            </Text>
          </View>

          <View style={[styles.base, { paddingBottom: recuoBase }]}>
            <Text
              style={[styles.titulo, { fontSize: fonte, lineHeight: fonte + 6 }]}
              numberOfLines={3}
            >
              {curiosidade.titulo}
            </Text>
            <Text style={styles.preview} numberOfLines={2}>
              {curiosidade.preview}
            </Text>
            {/* Só texto: sem cápsula, sem borda, sem caixa. */}
            <View style={[styles.cta, pressed && styles.pressionado]}>
              <Text style={styles.ctaTexto}>Ler</Text>
              <Text style={styles.ctaTexto}>→</Text>
            </View>
          </View>
        </>
      )}
    </Pressable>
  );
}

/**
 * Cada post é uma fotografia de tela cheia: sem isto, rolar re-renderiza os
 * vizinhos vivos sem nenhuma mudança de conteúdo.
 */
export const DiscoveryPost = memo(Post);

const styles = StyleSheet.create({
  // Sem raio e sem margem: o post é a tela.
  post: { width: '100%', justifyContent: 'flex-end', backgroundColor: '#0b0f14' },

  // Overlays do alto: absolutos, então não acrescentam altura nenhuma ao post
  // e a conta do snap continua igual.
  topoDegrade: { position: 'absolute', top: 0, left: 0, right: 0 },
  ponte: { position: 'absolute', top: 0, left: 0, right: 0 },

  simbolo: {
    position: 'absolute',
    right: -18,
    top: '24%',
    fontSize: 260,
    lineHeight: 280,
    color: 'rgba(255,255,255,0.09)',
  },

  chip: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  chipTexto: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, color: BRANCO },

  base: { paddingHorizontal: 20, gap: 10 },
  titulo: {
    fontWeight: '800',
    letterSpacing: -0.4,
    color: BRANCO,
    // Garante leitura mesmo sobre uma fotografia clara.
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 12,
  },
  preview: {
    fontSize: 15,
    lineHeight: 21,
    color: BRANCO_FRACO,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 8,
  },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  pressionado: { opacity: 0.6 },
  ctaTexto: {
    fontSize: 16,
    fontWeight: '700',
    color: BRANCO,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 8,
  },
});
