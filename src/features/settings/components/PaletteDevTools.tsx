import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CHAVES_DE_PALETA,
  PALETAS,
  definirPaleta,
  useColors,
  usePaletaAtiva,
  type PaletteKey,
} from '@/shared/theme/colors';

/**
 * (dev) Troca a paleta da interface na hora, para comparar identidades visuais
 * dentro do app de verdade.
 *
 * Ferramenta temporária: não grava nada, não mexe no mundo nem no save. Some
 * junto com o seletor de paletas quando a identidade final for escolhida.
 */
export function PaletteDevTools() {
  const c = useColors();
  const ativa = usePaletaAtiva();

  return (
    <View style={styles.grupo}>
      <Text style={[styles.rotulo, { color: c.ink }]}>Paleta da interface</Text>
      {CHAVES_DE_PALETA.map((chave) => (
        <Opcao key={chave} chave={chave} ativa={chave === ativa} />
      ))}
      <Text style={[styles.nota, { color: c.muted }]}>
        Só aparência, e só nesta sessão: nada disso é salvo.
      </Text>
    </View>
  );
}

function Opcao({ chave, ativa }: { chave: PaletteKey; ativa: boolean }) {
  const c = useColors();
  const paleta = PALETAS[chave];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: ativa }}
      accessibilityLabel={paleta.nome}
      onPress={() => definirPaleta(chave)}
      style={({ pressed }) => [
        styles.opcao,
        {
          borderColor: ativa ? c.ink : c.line,
          borderWidth: ativa ? 2 : 1,
          backgroundColor: pressed ? c.pressed : 'transparent',
        },
      ]}
    >
      <View style={styles.amostra}>
        {paleta.amostra.map((cor, i) => (
          <View key={i} style={[styles.bolinha, { backgroundColor: cor, borderColor: c.line }]} />
        ))}
      </View>
      <Text style={[styles.nome, { color: c.ink }]}>{paleta.nome}</Text>
      {ativa && <Text style={[styles.marca, { color: c.ink }]}>✓</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: 8 },
  rotulo: { fontSize: 15 },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  amostra: { flexDirection: 'row', gap: 3 },
  bolinha: { width: 14, height: 14, borderRadius: 7, borderWidth: 1 },
  nome: { flex: 1, fontSize: 15 },
  marca: { fontSize: 15, fontWeight: '700' },
  nota: { fontSize: 12 },
});
