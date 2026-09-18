// =====================================================================
// ASSENTAMENTOS — o núcleo lógico das vilas.
//
// Um Settlement não é desenhado: ele decide ONDE as construções nascem.
// Funções puras; nenhuma lista recebida é alterada.
//
// Zonas (só regras de distância, nada persistido):
//   núcleo       → fonte e casas maiores
//   anel interno → casas pequenas e algumas maiores
//   anel externo → casas pequenas, expansão
// =====================================================================
import { ESCALA_MUNDO } from './rules';
import type { Settlement } from './types';

/**
 * Forma da vila, em UNIDADES (1 unidade = 1 tile do mundo 150x100, como em
 * growthPlacement). Aumentar o mundo não muda a calibração.
 */
export const VILA = {
  /**
   * Núcleo da fonte: nenhuma residência entra nele enquanto a vila não tem fonte.
   * Sem isso, as primeiras casas ocupariam o meio e a fonte cairia fora.
   */
  nucleoReservado: 2.1,
  /**
   * Casas pequenas nunca ficam a menos disto da fonte/centro: a faixa entre o
   * núcleo e este raio é o anel das casas maiores (construções importantes).
   */
  limiteCasasPequenas: 2.8,
  /** Anel ideal das casas pequenas: começa fora do anel das maiores... */
  raioInicial: 3.2,
  /** ...e cresce com √(quantidade de elementos): miolo primeiro, depois para fora. */
  crescimento: 0.9,
  /** Anel ideal das casas maiores: logo em volta do núcleo, crescendo devagar. */
  anelMaior: 2.6,
  crescimentoMaior: 0.35,
  /** Quanto a distância pode fugir do anel e ainda pontuar. */
  tolerancia: 2,
  /** Peso do anel na nota (o terreno pesa ~0,3 a 2). */
  peso: 4,
  /**
   * Penalidade por unidade de distância ALÉM do anel. Quando a faixa ideal está
   * cheia, o vão livre mais perto da vila ganha — nada de braços compridos.
   */
  puxaoParaDentro: 0.8,
  /** Atração por outras construções da vila (peso, alcance em unidades): preenche vãos. */
  atracaoVizinhas: { peso: 1.5, alcance: 4 },
  /** Ponto a mais de `limite` unidades da construção mais próxima é penalizado. */
  isolamento: { limite: 3.5, penalidade: 0.8 },
  /** Residências (casas + maiores) para a vila ganhar a fonte. */
  residenciasParaFonte: 4,
  /** Candidatos são sorteados até ideal + folga × tolerância da referência. */
  folgaAmostragem: 2,
};

/** Ponto de onde a vila se organiza: a fonte, se existir; senão o centro lógico. */
export function referenciaDaVila(s: Settlement): { x: number; y: number } {
  return s.fonte ?? { x: s.x, y: s.y };
}

/** Faixa radial em unidades: onde a próxima casa pequena ou maior deveria nascer. */
export function anelIdeal(s: Settlement, construcao: 'casa' | 'casa_maior'): { ideal: number; tolerancia: number } {
  const raiz = Math.sqrt(s.quantidadeElementos);
  const ideal =
    construcao === 'casa_maior'
      ? VILA.anelMaior + VILA.crescimentoMaior * raiz
      : VILA.raioInicial + VILA.crescimento * raiz;
  return { ideal, tolerancia: VILA.tolerancia };
}

/**
 * Raio (em tiles) do disco onde vale sortear candidatos: o anel com folga, mas
 * nunca menos que a vila inteira com folga. Assim, quando o anel ideal está cheio,
 * ainda há candidatos nos vãos da vila (e o puxaoParaDentro escolhe o mais perto),
 * em vez de a construção falhar.
 */
export function raioDeAmostragem(s: Settlement, anel: { ideal: number; tolerancia: number }): number {
  const folga = VILA.folgaAmostragem * anel.tolerancia * ESCALA_MUNDO;
  return Math.max(anel.ideal * ESCALA_MUNDO + folga, s.raio + folga);
}

/**
 * Nota pela distância à referência: máxima no anel ideal, zero a uma tolerância dele,
 * e cada vez mais negativa além do anel (nunca por estar dentro).
 */
export function notaRadial(distanciaUnidades: number, anel: { ideal: number; tolerancia: number }): number {
  const naFaixa = VILA.peso * Math.max(0, 1 - Math.abs(distanciaUnidades - anel.ideal) / anel.tolerancia);
  const alemDoAnel = Math.max(0, distanciaUnidades - anel.ideal) * VILA.puxaoParaDentro;
  return naFaixa - alemDoAnel;
}

/** Vizinhança: atrai para perto de outras construções da vila, pune pontos soltos. */
export function notaDeVizinhanca(construcaoMaisProxima: number): number {
  if (construcaoMaisProxima === Infinity) return 0;
  const { peso, alcance } = VILA.atracaoVizinhas;
  const atracao = peso * Math.max(0, 1 - construcaoMaisProxima / alcance);
  const isolado = Math.max(0, construcaoMaisProxima - VILA.isolamento.limite) * VILA.isolamento.penalidade;
  return atracao - isolado;
}

export function criarAssentamento(existentes: readonly Settlement[], x: number, y: number): Settlement {
  return { id: `vila-${existentes.length + 1}`, x, y, raio: 0, quantidadeElementos: 0 };
}

/** Um elemento novo entrou na vila: conta mais um, o raio pode crescer e a fonte é registrada. */
export function incluirNoAssentamento(s: Settlement, x: number, y: number, ehFonte = false): Settlement {
  return {
    ...s,
    raio: Math.max(s.raio, Math.hypot(x - s.x, y - s.y)),
    quantidadeElementos: s.quantidadeElementos + 1,
    ...(ehFonte ? { fonte: { x, y } } : {}),
  };
}

/**
 * Qual vila recebe o próximo crescimento. V1: sempre a mais antiga.
 * É o único lugar a mudar quando existirem segunda vila, porto, colônia…
 */
export function assentamentoAlvo(settlements: readonly Settlement[]): Settlement | undefined {
  return settlements[0];
}
