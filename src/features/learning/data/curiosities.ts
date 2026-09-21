// =====================================================================
// CATÁLOGO DE CURIOSIDADES — a única fonte de conteúdo do app.
// Isto é conteúdo, não regra: acrescentar curiosidade não muda o engine.
// =====================================================================
import type { ImageSourcePropType } from 'react-native';

import type { Curiosity } from '../engine/types';

/**
 * COMO ADICIONAR UMA CURIOSIDADE
 *
 * 1. Coloque a imagem em `assets/curiosities/` (vertical, ~900x1200).
 * 2. Copie o MODELO que está no fim deste arquivo.
 * 3. Crie um `id` único (veja o aviso sobre ids logo abaixo).
 * 4. Preencha `titulo`, `preview` e `conteudo`.
 * 5. Escolha `tema`, `tags` e `influencias` entre os valores válidos (lista abaixo).
 * 6. Coloque pelo menos uma fonte em `fontes`.
 * 7. Informe `verificadoEm` quando fizer sentido.
 *
 * Não é preciso alterar tipos, engines nem componentes para publicar conteúdo.
 *
 * ---------------------------------------------------------------------
 * ⚠️  O `id` NUNCA MUDA depois de publicado.
 *
 * O progresso da pessoa é guardado por id: o `KnowledgeProfile` lembra quais
 * ids foram aprendidos. Trocar o id de uma curiosidade que já existe faz o app
 * tratá-la como nova — ela volta a aparecer por aprender e faz o mundo crescer
 * de novo. Corrigir texto, imagem, fonte ou tags é seguro; id, não.
 *
 * Use algo estável e legível: 'aurora-boreal', 'primeira-fotografia'.
 * ---------------------------------------------------------------------
 *
 * VALORES VÁLIDOS HOJE (definidos em shared/domain, não invente outros):
 *
 *   tema:        'astronomia' | 'historia' | 'geologia' | 'natureza'
 *
 *   influencias: chave 'vegetacao'      → vegetação (provisório, veja ARCHITECTURE.md)
 *                chave 'povoamento'     → casas, vilas
 *                chave 'infraestrutura' → construções maiores
 *                chave 'exploracao'     → minas
 *                chave 'observacao'     → observatórios
 *                O `peso` é a força da influência (1 = normal, 2 = forte).
 *
 *   tags:        texto livre, minúsculas e sem acento.
 *
 * Acrescentar um tema ou uma influência nova é mudança de código, não de
 * conteúdo: mexe em `shared/domain` e no engine do mundo.
 */

/**
 * Uma curiosidade do catálogo.
 *
 * É a `Curiosity` do engine mais a capa. A imagem fica só aqui de propósito:
 * o engine continua sem saber que existem imagens, e mesmo assim você cadastra
 * tudo num bloco só.
 */
export interface CuriosityEntry extends Curiosity {
  /** Capa do card. Sem ela, o card usa a cor e o símbolo do tema. */
  capa?: ImageSourcePropType;
}

/**
 * O catálogo. Ordem aqui = ordem no feed.
 *
 * PROVISÓRIO: as três de hoje são fictícias, só para o app funcionar enquanto
 * o conteúdo real não chega. Apague-as quando as reais entrarem.
 */
export const CURIOSIDADES: readonly CuriosityEntry[] = [
  {
    id: 'teste-natureza-1',

    titulo: '[Teste] Uma planta fictícia',

    capa: require('../../../../assets/curiosities/teste-natureza-1.jpg'),

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

    capa: require('../../../../assets/curiosities/teste-historia-1.jpg'),

    preview: 'Outro texto de exemplo, um pouco mais longo, para ver duas linhas.',

    conteudo: 'Conteúdo de exemplo com duas fontes. Esta curiosidade não é real.',

    tema: 'historia',

    tags: ['vila', 'assentamento'],

    influencias: [
      { chave: 'povoamento', peso: 1 },
      { chave: 'vegetacao', peso: 1 },
    ],

    fontes: [
      { titulo: 'Fonte fictícia B', autor: 'Autor fictício' },
      { titulo: 'Fonte fictícia C', url: 'https://example.com/c' },
    ],
  },
  {
    id: 'teste-astronomia-1',

    titulo: '[Teste] Uma estrela fictícia',

    capa: require('../../../../assets/curiosities/teste-astronomia-1.jpg'),

    preview: 'Exemplo curto de astronomia.',

    conteudo: 'Conteúdo de exemplo sobre uma estrela inventada.',

    tema: 'astronomia',

    tags: ['estrela', 'ceu'],

    influencias: [{ chave: 'observacao', peso: 1 }],

    fontes: [{ titulo: 'Fonte fictícia D', url: 'https://example.com/d' }],

    verificadoEm: '2026-08-15',
  },
];

/*
MODELO PARA COPIAR — cole dentro do array acima e preencha.
(Este bloco está comentado de propósito: não entra no feed.)

  {
    id: 'aurora-boreal',

    titulo: 'Por que a aurora boreal acontece?',

    capa: require('../../../../assets/curiosities/aurora-boreal.jpg'),

    preview:
      'Partículas vindas do Sol podem produzir luz quando encontram a atmosfera da Terra.',

    conteudo: `
Primeiro parágrafo.

Segundo parágrafo. Pode escrever normalmente, com quebras de linha —
a tela de leitura respeita os parágrafos.

Terceiro parágrafo.
    `.trim(),

    tema: 'astronomia',

    tags: ['sol', 'atmosfera', 'campo-magnetico'],

    influencias: [{ chave: 'observacao', peso: 1 }],

    fontes: [
      { titulo: 'Nome da fonte', url: 'https://...' },
      { titulo: 'Outra fonte', autor: 'Quem escreveu' },
    ],

    verificadoEm: '2026-09-21',
  },
*/
