import { useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';

import { useColors } from '@/shared/theme/colors';
import { Button } from '@/shared/ui/Button';
import { Slider } from '@/shared/ui/Slider';

import type { WorldGrowthKind } from '../engine/types';

type Props = {
  seed: number;
  nivelMar: number;
  faixaNivelMar: { min: number; max: number; passo: number };
  onGerarComSemente: (seed: number) => void;
  onMudarNivelMar: (nivelMar: number) => void;
  /** Tipos do novo sistema de crescimento, com o nome do botão. */
  crescimentos: { tipo: WorldGrowthKind; nome: string }[];
  onCrescer: (tipo: WorldGrowthKind) => void;
};

/** Ferramentas de desenvolvedor do mundo: semente, nível do mar e crescimento. */
export function WorldDevTools({
  seed,
  nivelMar,
  faixaNivelMar,
  onGerarComSemente,
  onMudarNivelMar,
  crescimentos,
  onCrescer,
}: Props) {
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
      {/* Temporário: testar o novo sistema de crescimento sem curiosidades */}
      <Text style={[styles.rotulo, { color: c.ink }]}>Crescimento</Text>
      <View style={styles.grade}>
        {crescimentos.map((cr) => (
          <Button key={cr.tipo} label={cr.nome} onPress={() => onCrescer(cr.tipo)} style={styles.celula} />
        ))}
      </View>
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
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  celula: { flexBasis: '45%', flexGrow: 1 },
  campo: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16 },
});
