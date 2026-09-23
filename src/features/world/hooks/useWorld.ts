import { useCallback, useEffect, useMemo, useState } from 'react';

import { gerarMundo } from '../engine/generate';
import { CHAVES_DE_CIVILIZACAO, NOMES_DE_CRESCIMENTO } from '../engine/growth';
import { aplicarEventosDeCrescimento, rngDeCrescimento } from '../engine/growthElements';
import { escolherDestaque, type Destaque } from '../engine/destaque';
import { descreverTile } from '../engine/inspect';
import { FAIXA_NIVEL_MAR, FAIXA_SEMENTE, REGRAS } from '../engine/rules';
import type {
  GrowthElement, GrowthResult, Settlement, World, WorldGrowthEvent, WorldGrowthKind, WorldSnapshot,
} from '../engine/types';
import { ART, ART_H, ART_W, desenharTerreno } from '../render/buildPixels';
import { montarLegenda } from '../render/legend';
import { desenharCaminhos } from '../render/pathPixels';
import { combinarParaDesenho } from '../render/renderElements';

/** idMensagem muda a cada ação, para o aviso reaparecer mesmo com texto repetido. */
type Estado = {
  mundo: World;
  /** Tudo que o conhecimento construiu: casas, fonte, mina, observatório… */
  crescimento: GrowthElement[];
  /** Vilas: o núcleo lógico onde casas e infraestrutura nascem. */
  settlements: Settlement[];
  /**
   * Quantas execuções de crescimento este mundo já teve. Junto com a semente,
   * define o gerador de cada execução — é o que torna o crescimento restaurável.
   */
  growthSequence: number;
  mensagem: string;
  idMensagem: number;
  /**
   * A novidade que o jogador ainda não viu. Estado de sessão: não entra no save
   * e é consumido assim que a composição mostra o destaque.
   */
  destaque: Destaque | null;
  /**
   * O que nasceu desde a última vez que a composição olhou — o `r.adicionados`
   * do engine, sem interpretação. Acumula até ser consumido, então duas levas
   * de crescimento no mesmo render não perdem ninguém. Mesmo contrato do
   * `destaque`: estado de sessão, fora do save.
   */
  nascimento: readonly GrowthElement[] | null;
};

/**
 * Único sorteio do mundo, e só na CRIAÇÃO: a semente sorteada é guardada e tudo
 * o mais sai dela. O crescimento não usa acaso de relógio (veja `aplicarEventos`).
 */
function sementeAleatoria(): number {
  return 1 + Math.floor(Math.random() * 99999);
}

/** Uma mensagem só para o crescimento, venha ele do aprendizado ou do modo dev. */
function mensagemDeCrescimento(eventos: readonly WorldGrowthEvent[], r: GrowthResult): string {
  if (r.adicionados.length === 0) return 'Não foi encontrado um local válido para esse crescimento.';

  const semLugar = new Set(r.semLugar);
  const nomes = eventos.filter((e) => !semLugar.has(e.tipo)).map((e) => NOMES_DE_CRESCIMENTO[e.tipo]);
  const idDaVila = r.adicionados.find((e) => e.settlementId)?.settlementId;
  const vila = idDaVila ? r.settlements.find((s) => s.id === idDaVila) : undefined;
  const ganhouFonte = r.adicionados.some((e) => e.tipo === 'fonte');

  if (!vila) return `${nomes.join(' e ')} cresceu no mundo.`;
  return (
    `${nomes.join(' e ')} cresceu. Vila: ${vila.quantidadeElementos} elementos, raio ${Math.round(vila.raio)}.` +
    (ganhouFonte ? ' A vila ganhou uma fonte!' : '')
  );
}

function criarEstado(idMensagem: number, seed: number, nivelMar: number): Estado {
  const mundo = gerarMundo(seed, nivelMar);
  // A natureza vem da seed; a civilização começa do zero e é o conhecimento que a constrói.
  return {
    mundo,
    crescimento: [],
    settlements: [],
    growthSequence: 0,
    mensagem: 'Mundo novo, ainda selvagem.',
    idMensagem,
    destaque: null,
    nascimento: null,
  };
}

/**
 * Estado a partir de um save: o mundo **não** vem gravado, é reconstruído da
 * semente (terreno, biomas e natureza saem iguais). Só a civilização e a
 * sequência de crescimento vêm do disco.
 */
function restaurarEstado(salvo: WorldSnapshot): Estado {
  return {
    mundo: gerarMundo(salvo.seed, salvo.nivelMar),
    crescimento: [...salvo.crescimento],
    settlements: [...salvo.settlements],
    growthSequence: salvo.growthSequence,
    mensagem: '',
    idMensagem: 0,
    destaque: null,
    // O que veio do save já nasceu há muito tempo: não é nascimento de agora.
    nascimento: null,
  };
}

/**
 * Liga o engine (regras) ao desenho e aos botões.
 * `salvo` vem do save quando existe um; sem ele, o mundo nasce de uma semente
 * sorteada. Lido uma vez só: depois disso quem manda é o estado do hook.
 */
export function useWorld(salvo?: WorldSnapshot | null) {
  const [estado, setEstado] = useState<Estado>(() =>
    salvo ? restaurarEstado(salvo) : criarEstado(0, sementeAleatoria(), REGRAS.nivelMar),
  );
  /** Recriação pedida e ainda não executada. Enquanto existe, o mapa sai da tela. */
  const [pedido, setPedido] = useState<{ seed: number; nivelMar: number } | null>(null);
  const {
    mundo, crescimento, settlements, growthSequence, mensagem, idMensagem, destaque, nascimento,
  } = estado;

  // buffer pesado: só é refeito quando o mundo muda
  const terreno = useMemo(() => desenharTerreno(mundo), [mundo]);
  // caminhos das vilas: camada própria, refeita só quando a rede muda
  const caminhos = useMemo(() => settlements.flatMap((s) => s.caminhos), [settlements]);
  const camadaCaminhos = useMemo(() => desenharCaminhos(mundo, caminhos), [mundo, caminhos]);
  // lista leve de sprites: muda a cada elemento novo, sem tocar no terreno
  const paraDesenho = useMemo(
    () => combinarParaDesenho(mundo.natureza, crescimento, caminhos),
    [mundo.natureza, crescimento, caminhos],
  );
  const legenda = useMemo(() => montarLegenda(), []);

  /** O que entra no save. Só isto: o resto é recalculado a partir da semente. */
  const estadoPersistivel = useMemo<WorldSnapshot>(
    () => ({
      seed: mundo.seed,
      nivelMar: mundo.nivelMar,
      crescimento,
      settlements,
      growthSequence,
    }),
    [mundo.seed, mundo.nivelMar, crescimento, settlements, growthSequence],
  );

  /**
   * Aplica eventos de crescimento ao mundo. É por aqui que o conhecimento chega
   * ao mapa: a composição traduz influências em eventos e chama esta função.
   *
   * O estado é lido **dentro** do updater, para duas aprendizagens seguidas não
   * se atropelarem: cada uma enxerga a `growthSequence` deixada pela anterior.
   * O gerador nasce da semente do mundo + essa sequência, nunca do relógio.
   */
  function aplicarEventos(eventos: readonly WorldGrowthEvent[], origemConhecimentoId?: string) {
    if (eventos.length === 0) return;
    setEstado((s) => {
      const rng = rngDeCrescimento(s.mundo.seed, s.growthSequence);
      const r = aplicarEventosDeCrescimento(
        s.mundo,
        s.crescimento,
        s.settlements,
        eventos,
        rng,
        origemConhecimentoId,
      );
      return {
        ...s,
        crescimento: r.elementos,
        settlements: r.settlements,
        growthSequence: s.growthSequence + 1,
        mensagem: mensagemDeCrescimento(eventos, r),
        idMensagem: s.idMensagem + 1,
        // nada nasceu → nada a destacar
        destaque: escolherDestaque(r.adicionados),
        nascimento:
          r.adicionados.length > 0 ? [...(s.nascimento ?? []), ...r.adicionados] : s.nascimento,
      };
    });
  }

  /**
   * Recriar o mundo é feito em duas fases, e isso é essencial.
   *
   * Fazendo tudo de uma vez, o mundo velho e o novo ficavam vivos ao mesmo
   * tempo: dois `World` (~3,5 MB cada), dois buffers RGBA de 5,3 MB e duas
   * `SkImage` com 5,3 MB nativos cada. O iPhone fechava o app no commit da cena
   * nova — depois de `MakeImage`, ao desenhar.
   *
   * Agora: fase 1 só marca o pedido, o que **tira o mapa da árvore** (quem lê
   * `gerando` é a composição) e libera as imagens no desmonte. Fase 2 roda no
   * quadro seguinte, com a superfície antiga já fora do caminho.
   */
  /** A composição avisa que já mostrou o destaque; ele não deve voltar. */
  const consumirDestaque = useCallback(() => {
    setEstado((s) => (s.destaque ? { ...s, destaque: null } : s));
  }, []);

  /** A composição avisa que já tratou os nascimentos; eles não voltam. */
  const consumirNascimento = useCallback(() => {
    setEstado((s) => (s.nascimento ? { ...s, nascimento: null } : s));
  }, []);

  function recriar(seed: number, nivelMar: number) {
    if (pedido) return; // já há uma recriação em curso
    setPedido({ seed, nivelMar });
  }

  useEffect(() => {
    if (!pedido) return;
    // Um quadro: o efeito roda logo após o commit do React, mas a remoção da
    // view nativa acontece na UI thread. Esperar o frame garante que a
    // superfície antiga saiu antes de alocarmos a nova.
    const quadro = requestAnimationFrame(() => {
      setEstado(criarEstado(idMensagem + 1, pedido.seed, pedido.nivelMar));
      setPedido(null);
    });
    return () => cancelAnimationFrame(quadro);
  }, [pedido, idMensagem]);

  return {
    estadoPersistivel,
    /** Recriando: a composição tira o mapa da árvore e mostra o carregando. */
    gerando: pedido !== null,
    /** A novidade a mostrar quando o jogador voltar ao mundo (ou null). */
    destaque,
    consumirDestaque,
    /** O que nasceu e ainda não foi tratado (ou null): o `r.adicionados` canônico. */
    nascimento,
    consumirNascimento,
    terreno,
    caminhos: camadaCaminhos,
    elementosParaDesenho: paraDesenho,
    largura: ART_W,
    altura: ART_H,
    mensagem,
    idMensagem,
    seed: mundo.seed,
    nivelMar: mundo.nivelMar,
    faixaNivelMar: FAIXA_NIVEL_MAR,
    legenda,
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
    /**
     * O conhecimento chegando ao mapa. A composição traduz influências em
     * eventos e diz de qual conhecimento vieram — para o mundo, só um id opaco.
     */
    aplicarEventos,
    /** Só as construções: o que dá para tocar e inspecionar. */
    construcoes: crescimento,
    /** (dev) Um evento de intensidade 1, pelo mesmo caminho da produção. */
    aplicarCrescimentoDev(tipo: WorldGrowthKind) {
      aplicarEventos([{ tipo, intensidade: 1 }]);
    },
    /** Recebe um ponto em pixels de arte e mostra no aviso o que há naquele tile. */
    inspecionar(artX: number, artY: number) {
      const texto = descreverTile(mundo, Math.floor(artX / ART), Math.floor(artY / ART));
      if (texto) setEstado({ ...estado, mensagem: texto, idMensagem: idMensagem + 1 });
    },
  };
}
