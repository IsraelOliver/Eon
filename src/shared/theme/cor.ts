/**
 * Cor de token com transparência.
 *
 * Os tokens das paletas são hex de seis dígitos (`#eef3f4`). Para um degradê que
 * dissolve a interface na fotografia é preciso o MESMO tom com alfa variável —
 * e é isso que mantém a transição amarrada à paleta ativa em vez de a um preto
 * fixo que só combinaria com uma delas.
 *
 * Uma cor que não seja hex de seis dígitos volta como veio: melhor perder a
 * transparência do que devolver uma string que o degradê não sabe ler.
 */
export function comAlfa(cor: string, alfa: number): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(cor.trim());
  if (!hex) return cor;

  const n = parseInt(hex[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
}

/** O único formato de cor aceito em conteúdo cadastrado: `#RRGGBB`. */
export function ehHexDeCor(valor: unknown): valor is string {
  return typeof valor === 'string' && /^#[0-9a-f]{6}$/i.test(valor);
}

/**
 * `cor` pintada por cima de `base` com opacidade `alfa`, já achatada numa cor
 * opaca. É como derivar uma superfície ("grafite com 6% de branco") sem inventar
 * um hex novo: o resultado é função das cores oficiais, não uma cor de marca.
 */
export function misturar(base: string, cor: string, alfa: number): string {
  const [r1, g1, b1] = canais(base);
  const [r2, g2, b2] = canais(cor);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * alfa);
  return `#${[mix(r1, r2), mix(g1, g2), mix(b1, b2)]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}

function canais(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Luminância relativa (a da WCAG): 0 é preto, 1 é branco. É ela que diz se um
 * texto branco vai se ler por cima de uma cor.
 */
export function luminancia(hex: string): number {
  const [r, g, b] = canais(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * A mesma cor, escurecida até a luminância caber no teto — sem trocar o matiz.
 *
 * Não é ciência de cor: baixa os três canais juntos, em passos pequenos, até
 * caber. Uma cor que já cabe volta exatamente como veio. Determinística.
 */
export function escurecerAte(hex: string, luminanciaMaxima: number): string {
  if (luminancia(hex) <= luminanciaMaxima) return hex.toLowerCase();

  const original = canais(hex);
  for (let fator = 0.95; fator > 0; fator -= 0.05) {
    const escura = `#${original
      .map((c) => Math.round(c * fator).toString(16).padStart(2, '0'))
      .join('')}`;
    if (luminancia(escura) <= luminanciaMaxima) return escura;
  }
  return '#000000';
}
