// =====================================================================
// ASSENTAMENTOS — o núcleo lógico das vilas.
//
// Um Settlement não é desenhado: ele decide ONDE as construções nascem.
// Funções puras; nenhuma lista recebida é alterada.
//
// Zonas (só regras de distância, nada persistido):
//   praça        → fonte e espaço livre em volta (restrição dura, ver RAIO_PRACA)
//   anel interno → casas maiores, logo fora da praça
//   anel externo → casas pequenas, expansão
// =====================================================================
import { FOOTPRINT, centroVisual, type Circulo } from './footprint';
import { ESCALA_MUNDO } from './rules';
import type { Settlement } from './types';

/**
 * Raio (em TILES) da área livre em volta da fonte — o futuro centro da vila
 * (praça, cruzamento, início das ruas). Nenhuma construção pode invadi-la.
 * Medido a partir do centro visual da fonte.
 */
export const RAIO_PRACA = 8;

/**
 * Antes de a fonte existir, a praça fica reservada em volta do centro lógico com
 * esta margem a mais (tiles): a fonte pode nascer um pouco deslocada do centro e
 * ainda ter a praça inteira livre.
 */
export const MARGEM_PRACA_ANTES_DA_FONTE = 2;

/** A área livre da vila: em volta da fonte, ou reservada em volta do centro. */
export function areaDaPraca(s: Settlement): Circulo {
  if (s.fonte) return { ...centroVisual('fonte', s.fonte.x, s.fonte.y), raio: RAIO_PRACA };
  return { x: s.x + 0.5, y: s.y + 0.5, raio: RAIO_PRACA + MARGEM_PRACA_ANTES_DA_FONTE };
}

/**
 * Onde começa o anel das casas maiores (em unidades): a menor distância em que
 * uma casa maior cabe inteira fora da praça. Calculado a partir da praça e do
 * footprint — se a arte mudar de tamanho, a vila se ajusta sozinha.
 */
const INICIO_ANEL_MAIOR = (() => {
  const maior = FOOTPRINT.casa_maior!;
  return (RAIO_PRACA + maior.largura / 2 + maior.folga) / ESCALA_MUNDO;
})();

/**
 * Forma da vila, em UNIDADES (1 unidade = 1 tile do mundo 150x100, como em
 * growthPlacement). Aumentar o mundo não muda a calibração.
 */
export const VILA = {
  /** Anel ideal das casas maiores: logo fora da praça, crescendo devagar. */
  anelMaior: INICIO_ANEL_MAIOR,
  crescimentoMaior: 0.3,
  /**
   * Casas pequenas não ficam a menos disto da referência: a faixa logo fora da
   * praça fica preferencialmente para as casas maiores (construções importantes).
   */
  limiteCasasPequenas: INICIO_ANEL_MAIOR + 0.3,
  /** Anel ideal das casas pequenas: começa logo depois do anel das maiores... */
  raioInicial: INICIO_ANEL_MAIOR + 0.7,
  /** ...e cresce com √(quantidade de elementos): miolo primeiro, depois para fora. */
  crescimento: 0.6,
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
  return { id: `vila-${existentes.length + 1}`, x, y, raio: 0, quantidadeElementos: 0, caminhos: [], viasPrincipais: 0 };
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
