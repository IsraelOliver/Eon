import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { gerarMundo } from '../engine/generate';
import { CHAVES_DE_CIVILIZACAO, NOMES_DE_CRESCIMENTO } from '../engine/growth';
import { aplicarEventosDeCrescimento } from '../engine/growthElements';
import { descreverTile } from '../engine/inspect';
import { mulberry32 } from '../engine/noise';
import { aprender, contarPorTema, esquecer, revisar, semear } from '../engine/placement';
import { FAIXA_NIVEL_MAR, FAIXA_SEMENTE, REGRAS } from '../engine/rules';
import { CHAVES_TEMAS, TEMAS } from '../engine/themes';
import type { Element, GrowthElement, Rng, Settlement, ThemeKey, World, WorldGrowthKind } from '../engine/types';
import { ART, ART_H, ART_W, desenharTerreno } from '../render/buildPixels';
import { montarLegenda } from '../render/legend';
import { combinarParaDesenho } from '../render/renderElements';

const DURACAO_BRILHO = 700; // ms

/** idMensagem muda a cada ação, para o aviso reaparecer mesmo com texto repetido. */
type Estado = {
  mundo: World;
  /** Protótipo: elementos com tema, criados por aprender()/semear(). */
  elementos: Element[];
  /** Novo sistema: elementos sem tema, criados por eventos de crescimento. */
  crescimento: GrowthElement[];
  /** Vilas: o núcleo lógico onde casas e infraestrutura nascem. */
  settlements: Settlement[];
  mensagem: string;
  idMensagem: number;
};

function sementeAleatoria(): number {
  return 1 + Math.floor(Math.random() * 99999);
}

function criarEstado(rng: Rng, idMensagem: number, seed: number, nivelMar: number): Estado {
  const mundo = gerarMundo(seed, nivelMar);
  // mundo novo começa sem civilização: nem elementos de crescimento, nem vilas
  return { mundo, idMensagem, crescimento: [], settlements: [], ...semear(mundo, rng) };
}

/** Liga o engine (regras) ao desenho e aos botões. */
export function useWorld() {
  const [rng] = useState(() => mulberry32(Date.now() | 0));
  const [estado, setEstado] = useState(() => criarEstado(rng, 0, sementeAleatoria(), REGRAS.nivelMar));
  const [brilho, setBrilho] = useState(0);
  const animacao = useRef<number | null>(null);
  const reduzirMovimento = useReducedMotion();

  const { mundo, elementos, crescimento, mensagem, idMensagem } = estado;

  // buffer pesado: só é refeito quando o mundo muda
  const terreno = useMemo(() => desenharTerreno(mundo), [mundo]);
  // lista leve de sprites: muda a cada elemento novo, sem tocar no terreno
  const paraDesenho = useMemo(
    () => combinarParaDesenho(elementos, mundo.natureza, crescimento),
    [elementos, mundo.natureza, crescimento],
  );
  const legenda = useMemo(() => montarLegenda(), []);
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

  function recriar(seed: number, nivelMar: number) {
    pararBrilho();
    setBrilho(0);
    setEstado(criarEstado(rng, idMensagem + 1, seed, nivelMar));
  }

  return {
    terreno,
    elementosParaDesenho: paraDesenho,
    brilho,
    largura: ART_W,
    altura: ART_H,
    mensagem,
    idMensagem,
    temas,
    seed: mundo.seed,
    nivelMar: mundo.nivelMar,
    faixaNivelMar: FAIXA_NIVEL_MAR,
    legenda,
    aprender(chave: ThemeKey) {
      setEstado({ ...estado, idMensagem: idMensagem + 1, ...aprender(mundo, elementos, chave, rng) });
    },
    esquecer() {
      setEstado({ ...estado, idMensagem: idMensagem + 1, ...esquecer(elementos, rng) });
    },
    revisar() {
      const r = revisar(elementos);
      setEstado({ ...estado, idMensagem: idMensagem + 1, ...r });
      if (!r.elementos.some((e) => e.brilha)) return;
      if (reduzirMovimento) apagarBrilho();
      else animarBrilho();
    },
    /** Semente aleatória, mantendo o nível do mar atual. */
    novoMundo() {
      recriar(sementeAleatoria(), mundo.nivelMar);
    },
    gerarComSemente(seed: number) {
      const s = Math.min(FAIXA_SEMENTE.max, Math.max(FAIXA_SEMENTE.min, Math.floor(seed) || 1));
      recriar(s, mundo.nivelMar);
    },
    mudarNivelMar(nivelMar: number) {
      recriar(mundo.seed, nivelMar);
    },
    /** (dev) Crescimentos da civilização, com o nome para o botão (natureza vem da seed). */
    crescimentos: CHAVES_DE_CIVILIZACAO.map((tipo) => ({ tipo, nome: NOMES_DE_CRESCIMENTO[tipo] })),
    /** (dev) Aplica um evento de intensidade 1 do novo sistema de crescimento. */
    aplicarCrescimentoDev(tipo: WorldGrowthKind) {
      const r = aplicarEventosDeCrescimento(mundo, crescimento, estado.settlements, [{ tipo, intensidade: 1 }], rng);
      const novo = r.adicionados[0];
      const vila = novo?.settlementId ? r.settlements.find((s) => s.id === novo.settlementId) : undefined;
      const ganhouFonte = r.adicionados.some((e) => e.tipo === 'fonte');
      const mensagem = !novo
        ? 'Não foi encontrado um local válido para esse crescimento.'
        : vila
          ? `${NOMES_DE_CRESCIMENTO[tipo]} cresceu. Vila: ${vila.quantidadeElementos} elementos, raio ${Math.round(vila.raio)}.` +
            (ganhouFonte ? ' A vila ganhou uma fonte!' : '')
          : `${NOMES_DE_CRESCIMENTO[tipo]} cresceu no mundo.`;
      setEstado({
        ...estado,
        crescimento: r.elementos,
        settlements: r.settlements,
        mensagem,
        idMensagem: idMensagem + 1,
      });
    },
    /** Recebe um ponto em pixels de arte e mostra no aviso o que há naquele tile. */
    inspecionar(artX: number, artY: number) {
      const texto = descreverTile(mundo, Math.floor(artX / ART), Math.floor(artY / ART));
      if (texto) setEstado({ ...estado, mensagem: texto, idMensagem: idMensagem + 1 });
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
