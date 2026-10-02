import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/shared/theme/colors';
import { Button } from '@/shared/ui/Button';

/** Um limiar da linha do tempo, já em texto. Vem do catálogo real de marcos. */
export interface EtapaDoSimulador {
  quantidade: number;
  rotulo: string;
  /** feito: aconteceu · pendente: alcançado, mas sem lugar ainda · futuro: não alcançado */
  estado: 'feito' | 'pendente' | 'futuro';
}

/** O que o simulador mostra e faz. Montado pela composição — aqui só se desenha. */
export interface Simulador {
  aprendidas: number;
  limite: number;
  /** Quantas curiosidades do catálogo ainda não foram aprendidas. */
  restantes: number;
  estagio: string;
  nivelDosCaminhos: number;
  proximo: { quantidade: number; rotulo: string } | null;
  etapas: EtapaDoSimulador[];
  rodando: boolean;
  tocando: boolean;
  onProxima: () => void;
  onAteMarco: () => void;
  onJornada: () => void;
  onPausar: () => void;
  onReiniciar: () => void;
}

const MARCA: Record<EtapaDoSimulador['estado'], string> = { feito: '✓', pendente: '…', futuro: '○' };

/**
 * SIMULAÇÃO DA JORNADA (modo dev): testar a progressão real, da primeira à
 * última curiosidade do catálogo, sem ler
 * curiosidade por curiosidade. Não cria nada: cada passo é um aprendizado real,
 * pelo mesmo caminho do botão "Registrar descoberta".
 */
export function SimuladorDaJornada({ simulador: s }: { simulador: Simulador }) {
  const c = useColors();
  const acabou = s.restantes === 0;

  return (
    <View style={styles.grupo}>
      <Text style={[styles.rotulo, { color: c.muted }]} accessibilityRole="header">
        Simulação da jornada
      </Text>

      <View style={styles.status}>
        <Text style={[styles.linha, { color: c.ink }]}>
          Aprendidas: <Text style={styles.forte}>{s.aprendidas} / {s.limite}</Text>
        </Text>
        <Text style={[styles.linha, { color: c.ink }]}>
          Estágio: <Text style={styles.forte}>{s.estagio}</Text> · Caminhos: nível {s.nivelDosCaminhos}
        </Text>
        <Text style={[styles.linha, { color: c.muted }]}>
          {s.proximo
            ? `Próximo marco: ${s.proximo.quantidade} descobertas → ${s.proximo.rotulo}`
            : 'Fase base concluída. Agora, as especializações (pela afinidade de cada tema).'}
        </Text>
        {acabou && <Text style={[styles.linha, { color: c.muted }]}>Não sobrou curiosidade para aprender.</Text>}
      </View>

      {s.tocando ? (
        <Button label="⏸  Pausar" variant="primary" onPress={s.onPausar} />
      ) : (
        <>
          <Button label="Simular próxima descoberta" onPress={s.onProxima} />
          <Button label="Avançar até o próximo marco" onPress={s.onAteMarco} />
          <Button label="▶  Simular jornada inteira" variant="primary" onPress={s.onJornada} />
        </>
      )}
      <Button label="Reiniciar simulação" variant="destructive" onPress={s.onReiniciar} />

      {/* a linha do tempo: o catálogo de marcos, limiar a limiar */}
      <View style={styles.linhaDoTempo}>
        {s.etapas.map((e) => (
          <View key={e.quantidade} style={styles.etapa}>
            <Text style={[styles.marca, { color: e.estado === 'futuro' ? c.muted : c.accentLegivel }]}>
              {MARCA[e.estado]}
            </Text>
            <Text style={[styles.numero, { color: c.muted }]}>{e.quantidade}</Text>
            <Text style={[styles.etapaTexto, { color: e.estado === 'futuro' ? c.muted : c.ink }]}>{e.rotulo}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * O controle do simulador em cima do mapa: durante a simulação as
 * Configurações ficam fechadas (é para assistir a vila), e o pause precisa
 * estar à mão.
 */
export function SimulacaoFlutuante({ simulador: s, topo }: { simulador: Simulador; topo: number }) {
  const c = useColors();
  const botao = (rotulo: string, acao: () => void, acessivel: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={acessivel}
      onPress={acao}
      hitSlop={8}
      style={({ pressed }) => [styles.botaoFlutuante, { borderColor: c.line }, pressed && styles.pressionado]}
    >
      <Text style={[styles.botaoTexto, { color: c.ink }]}>{rotulo}</Text>
    </Pressable>
  );

  return (
    <View pointerEvents="box-none" style={[styles.flutuante, { top: topo }]}>
      <View style={[styles.pilula, { backgroundColor: c.panel, borderColor: c.line }]}>
        <Text style={[styles.contador, { color: c.ink }]}>
          Jornada {s.aprendidas}/{s.limite}
        </Text>
        {s.tocando ? (
          botao('⏸', s.onPausar, 'Pausar simulação')
        ) : (
          <>
            {botao('+1', s.onProxima, 'Simular próxima descoberta')}
            {botao('Marco', s.onAteMarco, 'Avançar até o próximo marco')}
            {botao('▶', s.onJornada, 'Simular jornada inteira')}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: 10 },
  rotulo: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  status: { gap: 3 },
  linha: { fontSize: 14, lineHeight: 20 },
  forte: { fontWeight: '700' },
  linhaDoTempo: { gap: 4, marginTop: 4 },
  etapa: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  marca: { width: 14, fontSize: 14, fontWeight: '700' },
  numero: { width: 22, fontSize: 13, fontVariant: ['tabular-nums'], textAlign: 'right' },
  etapaTexto: { flex: 1, fontSize: 14, lineHeight: 19 },

  flutuante: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 30 },
  pilula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  contador: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'], marginRight: 2 },
  botaoFlutuante: { borderWidth: 1, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 9 },
  botaoTexto: { fontSize: 13, fontWeight: '700' },
  pressionado: { opacity: 0.6 },
});
