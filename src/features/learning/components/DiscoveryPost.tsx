import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { comAlfa } from '@/shared/theme/cor';
import { MARCA } from '@/shared/theme/marca';
import { Gradient } from '@/shared/ui/Gradient';

import { NOMES_DE_TEMA } from '../engine/themes';
import type { CuriosityEntry } from '../data/curiosities';
import { resolverAtmosfera } from '../presentation/atmosfera';
import { CAPA_DO_TEMA } from '../presentation/coverTheme';
import {
  ALTURA_DO_TOPO, DEGRADE_DA_BASE, FADE_ATMOSFERICO, paradasDaAtmosfera, paradasDoTopo,
} from '../presentation/degradeDoPost';
import { tamanhoDoTitulo } from '../presentation/feedLayout';

/**
 * O texto do post vive sempre sobre fotografia escurecida, então é o branco da
 * marca nos dois temas: aqui quem manda é a foto, não o tema. Tudo sai de
 * `MARCA` — nenhum hex solto neste arquivo.
 */
const BRANCO = MARCA.branco;
const BRANCO_FRACO = comAlfa(MARCA.branco, 0.8);
const SOMBRA_DO_TEXTO = comAlfa(MARCA.preto, 0.5);

type Props = {
  curiosidade: CuriosityEntry;
  /** Uma viewport inteira: o post É a tela, não um cartão dentro dela. */
  altura: number;
  recuoTopo: number;
  recuoBase: number;
  /**
   * Só no PRIMEIRO post: quanto do alto o cabeçalho (Éon + World Pulse) ocupa,
   * flutuando sobre a foto. A atmosfera fica densa até ali, e o chip do tema
   * desce para baixo dele. Nos outros posts, ausente.
   */
  alturaDoCabecalho?: number;
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
  curiosidade, altura, recuoTopo, recuoBase, alturaDoCabecalho, onLer,
}: Props) {
  const janela = useWindowDimensions();
  const capa = curiosidade.capa;
  const tema = CAPA_DO_TEMA[curiosidade.tema];
  const fonte = tamanhoDoTitulo(janela.width);
  // Só leitura do catálogo: nenhuma análise de imagem, em momento algum.
  const atmosfera = resolverAtmosfera(curiosidade);
  const primeiro = alturaDoCabecalho !== undefined;
  const alturaDaAtmosfera = (alturaDoCabecalho ?? 0) + FADE_ATMOSFERICO;

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

          {/* O alto, num bloco próprio: sem `absoluteFill`, para a atmosfera
              viver só na faixa de cima e não lavar a fotografia inteira.
              Primeiro post: atmosfera FORTE, onde flutuam Éon e o World Pulse.
              Os outros: atmosfera discreta, nascendo da emenda escura.
              Nunca os dois juntos. */}
          {primeiro ? (
            <View style={[styles.topoDegrade, { height: alturaDaAtmosfera }]} pointerEvents="none">
              <Gradient
                paradas={paradasDaAtmosfera(atmosfera.topo, (alturaDoCabecalho ?? 0) / alturaDaAtmosfera)}
              />
            </View>
          ) : (
            <View style={[styles.topoDegrade, { height: ALTURA_DO_TOPO }]} pointerEvents="none">
              <Gradient paradas={paradasDoTopo(atmosfera.topo)} />
            </View>
          )}

          {/* O rodapé é sempre preto: é ele que garante a leitura do título. */}
          <Gradient paradas={DEGRADE_DA_BASE} />

          {/* O chip usa a cor do PRÓPRIO tema: identidade de conteúdo não muda
              quando a paleta da interface muda. O `gap` já é o lugar do sprite
              pixel art que vai entrar antes do nome. */}
          <View
            style={[
              styles.chip,
              // No primeiro post, logo abaixo do World Pulse — nunca por baixo dele.
              { top: primeiro ? (alturaDoCabecalho ?? 0) + 10 : recuoTopo, backgroundColor: tema.de },
            ]}
          >
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
  post: { width: '100%', justifyContent: 'flex-end', backgroundColor: MARCA.grafite }, // enquanto a foto carrega

  // Overlays do alto: absolutos, então não acrescentam altura nenhuma ao post
  // e a conta do snap continua igual.
  topoDegrade: { position: 'absolute', top: 0, left: 0, right: 0 },

  simbolo: {
    position: 'absolute',
    right: -18,
    top: '24%',
    fontSize: 260,
    lineHeight: 280,
    color: comAlfa(MARCA.branco, 0.09),
  },

  chip: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: comAlfa(MARCA.branco, 0.28),
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
    textShadowColor: SOMBRA_DO_TEXTO,
    textShadowRadius: 12,
  },
  preview: {
    fontSize: 15,
    lineHeight: 21,
    color: BRANCO_FRACO,
    textShadowColor: SOMBRA_DO_TEXTO,
    textShadowRadius: 8,
  },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  pressionado: { opacity: 0.6 },
  ctaTexto: {
    fontSize: 16,
    fontWeight: '700',
    color: BRANCO,
    letterSpacing: 0.3,
    textShadowColor: SOMBRA_DO_TEXTO,
    textShadowRadius: 8,
  },
});
