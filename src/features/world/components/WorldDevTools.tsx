import { useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';

import { useColors } from '@/shared/theme/colors';
import { Button } from '@/shared/ui/Button';
import { Slider } from '@/shared/ui/Slider';

type Props = {
  seed: number;
  nivelMar: number;
  faixaNivelMar: { min: number; max: number; passo: number };
  onGerarComSemente: (seed: number) => void;
  onMudarNivelMar: (nivelMar: number) => void;
};

/** Ferramentas de desenvolvedor do mundo: semente e nível do mar. */
export function WorldDevTools({ seed, nivelMar, faixaNivelMar, onGerarComSemente, onMudarNivelMar }: Props) {
  const c = useColors();
  return (
    <View style={styles.grupo}>
      {/* key: quando o mundo muda, o campo volta a mostrar a semente atual */}
      <CampoSemente key={seed} seed={seed} onGerar={onGerarComSemente} />
      <Text style={[styles.rotulo, { color: c.ink }]}>Nível do mar</Text>
      <Slider
        min={faixaNivelMar.min}
        max={faixaNivelMar.max}
        step={faixaNivelMar.passo}
        value={nivelMar}
        onRelease={onMudarNivelMar}
        accessibilityLabel="Nível do mar"
      />
    </View>
  );
}

function CampoSemente({ seed, onGerar }: { seed: number; onGerar: (seed: number) => void }) {
  const c = useColors();
  const [texto, setTexto] = useState(String(seed));

  const gerar = () => {
    Keyboard.dismiss();
    onGerar(Number(texto));
  };

  return (
    <View style={styles.grupo}>
      <Text style={[styles.rotulo, { color: c.ink }]}>Semente</Text>
      <TextInput
        value={texto}
        onChangeText={(t) => setTexto(t.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={6}
        accessibilityLabel="Semente"
        style={[styles.campo, { color: c.ink, borderColor: c.line, backgroundColor: c.bg }]}
      />
      <Button label="Gerar com esta semente" onPress={gerar} />
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: 8 },
  rotulo: { fontSize: 15 },
  campo: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16 },
});
