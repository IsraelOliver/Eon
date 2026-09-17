// =====================================================================
// DADOS FICTÍCIOS — só para testar o domínio de aprendizagem.
// NÃO são curiosidades reais: textos e fontes são inventados.
// =====================================================================
import type { Curiosity } from '../engine/types';

export const CURIOSIDADES_DE_TESTE: Curiosity[] = [
  {
    id: 'teste-natureza-1',
    titulo: '[Teste] Uma planta fictícia',
    preview: 'Texto de exemplo para a lista.',
    conteudo: 'Conteúdo de exemplo. Esta curiosidade não é real.',
    tema: 'natureza',
    tags: ['plantas', 'floresta'],
    influencias: [{ chave: 'vegetacao', peso: 2 }],
    fontes: [{ titulo: 'Fonte fictícia A', url: 'https://example.com/a' }],
    verificadoEm: '2026-09-01',
  },
  {
    id: 'teste-historia-1',
    titulo: '[Teste] Uma vila fictícia',
    preview: 'Texto de exemplo para a lista.',
    conteudo: 'Conteúdo de exemplo. Esta curiosidade não é real.',
    tema: 'historia',
    tags: ['vilas', 'floresta'],
    influencias: [
      { chave: 'povoamento', peso: 1 },
      { chave: 'vegetacao', peso: 1 },
    ],
    fontes: [
      { titulo: 'Fonte fictícia B', autor: 'Autor fictício' },
      { titulo: 'Fonte fictícia C', url: 'https://example.com/c' },
    ],
    // sem verificadoEm: exemplo de informação em que a data não se aplica
  },
  {
    id: 'teste-astronomia-1',
    titulo: '[Teste] Uma estrela fictícia',
    preview: 'Texto de exemplo para a lista.',
    conteudo: 'Conteúdo de exemplo. Esta curiosidade não é real.',
    tema: 'astronomia',
    tags: ['estrelas'],
    influencias: [{ chave: 'observacao', peso: 1 }],
    fontes: [{ titulo: 'Fonte fictícia D', url: 'https://example.com/d' }],
    verificadoEm: '2026-08-15',
  },
];
