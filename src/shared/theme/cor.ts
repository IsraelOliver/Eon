/**
 * O ouro das conquistas. É identidade de recompensa, não de interface: fica
 * igual em todas as paletas, como as cores dos temas. Um lugar só, porque duas
 * telas o usam — o banner de conquista e a vitrine do World Pulse.
 */
export const OURO_DE_CONQUISTA = '#d19a2a';

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
