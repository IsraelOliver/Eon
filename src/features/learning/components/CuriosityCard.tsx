import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Gradient } from '@/shared/ui/Gradient';

import { NOMES_DE_TEMA } from '../engine/themes';
import type { CuriosityEntry } from '../data/curiosities';
import { CAPA_DO_TEMA } from '../presentation/coverTheme';

/** Proporção do pôster: alto e estreito, como capa de conteúdo. */
const PROPORCAO = 3 / 4;
const RAIO = 24;

/**
 * O texto do card vive sempre sobre imagem escurecida, então é branco nos dois
 * modos (claro e escuro). Por isso não sai do tema em `shared/theme/colors.ts`.
 */
const BRANCO = '#ffffff';
const BRANCO_FRACO = 'rgba(255,255,255,0.72)';
const VIDRO = 'rgba(255,255,255,0.16)';
const BORDA_VIDRO = 'rgba(255,255,255,0.28)';

/** Escurece a base para o título ficar legível sobre qualquer imagem. */
const DEGRADE = 'rgba(0,0,0,0) 38%, rgba(0,0,0,0.35) 58%, rgba(0,0,0,0.72) 78%, rgba(0,0,0,0.92) 100%';

type Props = {
  curiosidade: CuriosityEntry;
  aprendida: boolean;
  onLer: () => void;
};

/** Card do feed: uma capa. A imagem manda; o texto se apoia no degradê. */
export function CuriosityCard({ curiosidade, aprendida, onLer }: Props) {
  const capa = curiosidade.capa;
  const tema = CAPA_DO_TEMA[curiosidade.tema];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${NOMES_DE_TEMA[curiosidade.tema]}: ${curiosidade.titulo}`}
      accessibilityHint="Abre a curiosidade"
      onPress={onLer}
      style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}
    >
      {capa ? (
        <Image source={capa} style={StyleSheet.absoluteFill} contentFit="cover" transition={160} />
      ) : (
        // Sem imagem ainda: a capa do tema segura o lugar sem quebrar o layout.
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tema.de }]}>
          <Gradient paradas={`${tema.de} 0%, ${tema.para} 100%`} />
          <Text style={styles.simbolo}>{tema.simbolo}</Text>
        </View>
      )}

      <Gradient paradas={DEGRADE} />

      <View style={styles.topo}>
        <Text style={styles.tema}>{NOMES_DE_TEMA[curiosidade.tema].toUpperCase()}</Text>
        {aprendida && (
          <View style={styles.selo}>
            <Text style={styles.seloTexto}>✓ Aprendida</Text>
          </View>
        )}
      </View>

      <View style={styles.base}>
        <Text style={styles.titulo} numberOfLines={3}>
          {curiosidade.titulo}
        </Text>
        <Text style={styles.preview} numberOfLines={2}>
          {curiosidade.preview}
        </Text>
        <View style={styles.cta}>
          <Text style={styles.ctaTexto}>ler…</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: {
    width: '100%',
    aspectRatio: PROPORCAO,
    borderRadius: RAIO,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#0b0f14', // enquanto a imagem carrega
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  pressionado: { opacity: 0.92 },

  simbolo: {
    position: 'absolute',
    right: -18,
    top: '18%',
    fontSize: 200,
    lineHeight: 220,
    color: 'rgba(255,255,255,0.09)',
  },

  topo: {
    position: 'absolute',
    top: 18,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  tema: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: BRANCO,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowRadius: 6,
  },
  selo: {
    backgroundColor: VIDRO,
    borderColor: BORDA_VIDRO,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  seloTexto: { fontSize: 11, fontWeight: '600', color: BRANCO },

  base: { padding: 20, gap: 8 },
  titulo: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    color: BRANCO,
    // Garante leitura mesmo sobre uma imagem clara.
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowRadius: 10,
  },
  preview: { fontSize: 14, lineHeight: 20, color: BRANCO_FRACO },
  cta: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: VIDRO,
    borderColor: BORDA_VIDRO,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  ctaTexto: { fontSize: 14, fontWeight: '600', color: BRANCO, letterSpacing: 0.3 },
});
