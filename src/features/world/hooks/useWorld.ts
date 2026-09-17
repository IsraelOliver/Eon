import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { gerarMundo } from '../engine/generate';
import { mulberry32 } from '../engine/noise';
import { aprender, contarPorTema, esquecer, revisar, semear } from '../engine/placement';
import { CHAVES_TEMAS, TEMAS } from '../engine/themes';
import type { Element, Rng, ThemeKey, World } from '../engine/types';
import { ART_H, ART_W, desenharElementos, desenharTerreno } from '../render/buildPixels';

const DURACAO_BRILHO = 700; // ms

/** idMensagem muda a cada ação, para o aviso reaparecer mesmo com texto repetido. */
type Estado = { mundo: World; elementos: Element[]; mensagem: string; idMensagem: number };

function criarEstado(rng: Rng, idMensagem: number): Estado {
  const mundo = gerarMundo(1 + Math.floor(Math.random() * 99999));
  return { mundo, idMensagem, ...semear(mundo, rng) };
}

/** Liga o engine (regras) ao desenho e aos botões. */
export function useWorld() {
  const [rng] = useState(() => mulberry32(Date.now() | 0));
  const [estado, setEstado] = useState(() => criarEstado(rng, 0));
  const [brilho, setBrilho] = useState(0);
  const animacao = useRef<number | null>(null);
  const reduzirMovimento = useReducedMotion();

  const { mundo, elementos, mensagem, idMensagem } = estado;

  const terreno = useMemo(() => desenharTerreno(mundo), [mundo]);
  const pixels = useMemo(() => desenharElementos(terreno, elementos, brilho), [terreno, elementos, brilho]);
  const contagem = contarPorTema(elementos);
  const temas = CHAVES_TEMAS.map((chave) => ({ chave, nome: TEMAS[chave].nome, quantidade: contagem[chave] }));

  useEffect(() => () => pararBrilho(), []);

  function pararBrilho() {
    if (animacao.current !== null) cancelAnimationFrame(animacao.current);
    animacao.current = null;
  }

  function apagarBrilho() {
    setBrilho(0);
    setEstado((s) => ({ ...s, elementos: s.elementos.map((e) => (e.brilha ? { ...e, brilha: false } : e)) }));
  }

  function animarBrilho() {
    pararBrilho();
    const inicio = performance.now();
    const passo = (agora: number) => {
      const b = Math.max(0, 1 - (agora - inicio) / DURACAO_BRILHO);
      if (b > 0) {
        setBrilho(b);
        animacao.current = requestAnimationFrame(passo);
      } else {
        animacao.current = null;
        apagarBrilho();
      }
    };
    animacao.current = requestAnimationFrame(passo);
  }

  return {
    pixels,
    largura: ART_W,
    altura: ART_H,
    mensagem,
    idMensagem,
    temas,
    aprender(chave: ThemeKey) {
      setEstado({ mundo, idMensagem: idMensagem + 1, ...aprender(mundo, elementos, chave, rng) });
    },
    esquecer() {
      setEstado({ mundo, idMensagem: idMensagem + 1, ...esquecer(elementos, rng) });
    },
    revisar() {
      const r = revisar(elementos);
      setEstado({ mundo, idMensagem: idMensagem + 1, ...r });
      if (!r.elementos.some((e) => e.brilha)) return;
      if (reduzirMovimento) apagarBrilho();
      else animarBrilho();
    },
    novoMundo() {
      pararBrilho();
      setBrilho(0);
      setEstado(criarEstado(rng, idMensagem + 1));
    },
  };
}

/** Respeita a opção "Reduzir movimento" do iPhone. */
function useReducedMotion(): boolean {
  const [ativo, setAtivo] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setAtivo);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setAtivo);
    return () => sub.remove();
  }, []);
  return ativo;
}
