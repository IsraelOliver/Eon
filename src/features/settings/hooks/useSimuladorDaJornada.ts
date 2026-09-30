import { useCallback, useEffect, useRef, useState } from 'react';

/** Espera entre dois aprendizados da jornada inteira: dá para assistir a vila mudar. */
export const INTERVALO_DA_JORNADA_MS = 1700;

type Props = {
  /** Quantas curiosidades a jornada já aprendeu (o perfil real). */
  aprendidas: number;
  /** Até onde a jornada inteira vai (o maior limiar do catálogo de marcos). */
  limite: number;
  /**
   * Aprende UMA curiosidade pelo caminho real do app. Devolve false quando não
   * sobrou nenhuma para aprender. Quem sabe o que é aprender é a composição.
   */
  aprenderProxima: () => boolean;
  /** O mundo pode receber um aprendizado agora? (não recriando, sem modal na frente) */
  pronto: boolean;
};

/**
 * O motor do simulador da jornada (modo dev). Não conhece curiosidade nem
 * mundo: só sabe **dar passos**, um aprendizado de cada vez, até um alvo.
 *
 * Um estado só — \`{ alvo, intervalo }\`, ou \`null\` parado:
 * - próxima descoberta: alvo = agora + 1, sem espera;
 * - até o próximo marco: alvo = o limiar, sem espera;
 * - jornada inteira: alvo = limite, com INTERVALO_DA_JORNADA_MS entre passos.
 *
 * Um passo por render, de propósito: o aprendizado real parte do perfil do
 * render, então dois no mesmo instante se atropelariam. E cada passo é um
 * aprendizado completo — pausar (voltar a \`null\`) nunca deixa nada pela metade.
 */
export function useSimuladorDaJornada({ aprendidas, limite, aprenderProxima, pronto }: Props) {
  const [rodando, setRodando] = useState<{ alvo: number; intervalo: number } | null>(null);

  // o passo usa sempre o aprender DESTE render (o perfil mais novo)
  const aprender = useRef(aprenderProxima);
  useEffect(() => {
    aprender.current = aprenderProxima;
  });

  useEffect(() => {
    if (!rodando) return;
    if (aprendidas >= rodando.alvo) {
      setRodando(null); // chegou: para exatamente aqui
      return;
    }
    if (!pronto) return; // espera o mundo (recriação, boas-vindas) e segue depois
    const passo = setTimeout(() => {
      if (!aprender.current()) setRodando(null); // não há mais o que aprender
    }, rodando.intervalo);
    return () => clearTimeout(passo);
  }, [rodando, aprendidas, pronto]);

  const pausar = useCallback(() => setRodando(null), []);

  return {
    /** Está andando (qualquer modo). */
    rodando: rodando !== null,
    /** Está na jornada inteira, com espera entre os passos. */
    tocando: rodando !== null && rodando.intervalo > 0,
    proximaDescoberta: () => setRodando({ alvo: aprendidas + 1, intervalo: 0 }),
    ate: (alvo: number) => setRodando({ alvo, intervalo: 0 }),
    jornadaInteira: () => setRodando({ alvo: limite, intervalo: INTERVALO_DA_JORNADA_MS }),
    pausar,
  };
}
