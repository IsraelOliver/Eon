// =====================================================================
// CONFERÊNCIA DO CATÁLOGO — pega erro de cadastro, não de código.
// Função pura: roda em teste, não a cada render.
// =====================================================================
import type { Curiosity } from '../engine/types';

/** Um problema encontrado no catálogo, já legível para quem cadastrou. */
export interface ProblemaNoCatalogo {
  /** Id da curiosidade, ou a posição dela quando o id é o próprio problema. */
  onde: string;
  problema: string;
}

const vazio = (texto: string | undefined) => !texto || texto.trim().length === 0;

/**
 * Confere o catálogo inteiro. Devolve a lista de problemas (vazia = tudo certo).
 *
 * O TypeScript já garante tema, influências e a existência dos campos; o que
 * sobra para conferir aqui é o que ele não vê: id repetido e texto em branco.
 */
export function validarCuriosidades(catalogo: readonly Curiosity[]): ProblemaNoCatalogo[] {
  const problemas: ProblemaNoCatalogo[] = [];
  const vistos = new Set<string>();

  catalogo.forEach((c, i) => {
    const onde = c.id || `posição ${i}`;

    if (vazio(c.id)) problemas.push({ onde, problema: 'id vazio' });
    else if (vistos.has(c.id)) problemas.push({ onde, problema: 'id repetido' });
    vistos.add(c.id);

    if (vazio(c.titulo)) problemas.push({ onde, problema: 'título vazio' });
    if (vazio(c.preview)) problemas.push({ onde, problema: 'preview vazio' });
    if (vazio(c.conteudo)) problemas.push({ onde, problema: 'conteúdo vazio' });
    if (c.fontes.length === 0) problemas.push({ onde, problema: 'nenhuma fonte' });
    if (c.fontes.some((f) => vazio(f.titulo))) {
      problemas.push({ onde, problema: 'fonte sem título' });
    }
    if (c.influencias.some((inf) => !Number.isFinite(inf.peso) || inf.peso <= 0)) {
      problemas.push({ onde, problema: 'influência com peso inválido (use 1 ou mais)' });
    }
  });

  return problemas;
}
