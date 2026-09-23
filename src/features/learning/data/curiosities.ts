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
    id: 'espiritu-pampa',

    titulo: 'A cidade perdida que ficou escondida por séculos!',

    capa: require('../../../../assets/curiosities/espiritu-pampa.jpg'),

    preview: 'Por séculos, a última capital dos incas permaneceu escondida na selva peruana, enquanto exploradores procuravam a cidade perdida no lugar errado.',

    conteudo: `
Depois da chegada dos conquistadores espanhóis, parte da resistência inca se refugiou em Vilcabamba, uma região remota e montanhosa do Peru. Ali, os últimos governantes incas mantiveram um estado independente por décadas, até a conquista espanhola definitiva em 1572.

Séculos depois, exploradores ainda tentavam localizar essa última capital. Em 1911, Hiram Bingham procurava a chamada “cidade perdida dos incas” e chegou tanto a Machu Picchu quanto às ruínas de Espíritu Pampa. Ele, porém, acreditou que Machu Picchu era a cidade que procurava e considerou Espíritu Pampa pouco impressionante.

A interpretação mudou décadas mais tarde. Pesquisas posteriores mostraram que Espíritu Pampa era muito maior do que Bingham havia imaginado e é hoje associada à verdadeira Vilcabamba, o último grande refúgio dos incas antes da conquista espanhola.

O local continua sendo estudado. Escavações também revelaram evidências de ocupação anterior à presença inca, incluindo construções ligadas à cultura Wari. Isso mostra que a região teve importância muito antes dos últimos anos do Império Inca.
  `.trim(),

    tema: 'historia',

    tags: ['incas', 'peru', 'vilcabamba', 'espiritu-pampa', 'arqueologia'],

    influencias: [{ chave: 'povoamento', peso: 2 }],

    fontes: [{
      titulo: 'National Geographic — Machu Picchu and the Lost City of the Incas',
      url: 'https://www.nationalgeographic.com/history/article/machu-picchu-mystery',
    },
    {
      titulo: 'National Geographic — Finding Machu Picchu: Hiram Bingham',
      url: 'https://www.nationalgeographic.com/adventure/article/machu-picchu-hiram-bingham',
    },
    {
      titulo: 'Dirección Desconcentrada de Cultura de Cusco — Hallazgos en Espíritu Pampa',
      url: 'https://www.culturacusco.gob.pe/noticia/patrimonio-cultural/importantes-hallazgos-reportan-en-sitio-arqueologico-de-espiritupampa/',
    },],

    verificadoEm: '2026-09-21',
  },
  {
    id: 'geo-naica-crystals-001',

    titulo: '[Teste] Uma vila fictícia',

    capa: require('../../../../assets/curiosities/teste-historia-1.jpg'),

    preview: 'A quase 300 metros de profundidade, mineiros encontraram uma caverna atravessada por cristais grandes o bastante para parecer cenário de ficção científica.',

    conteudo: `No ano 2000, trabalhos na mina de Naica, no estado mexicano de Chihuahua, alcançaram uma cavidade extraordinária.
Dentro dela havia enormes cristais transparentes de gesso. Alguns atingem cerca de 11 metros de comprimento.
Eles não cresceram rapidamente.
Durante um longo período, a caverna permaneceu cheia de água quente rica em minerais. Estudos de inclusões microscópicas preservadas nos cristais indicam que seu crescimento aconteceu perto de 54 °C, em condições químicas excepcionalmente estáveis.
Isso permitiu que poucos cristais continuassem crescendo lentamente em vez de surgirem milhares de cristais pequenos.
A própria exploração da mina acabou revelando um ambiente que havia permanecido isolado no interior da montanha.
Por causa da escala, fotografias do lugar parecem enganosas até aparecer uma pessoa ao lado dos cristais.
Então fica evidente que as “pedras” são maiores que ela. Muito maiores.`,

    tema: 'geologia',

    tags: ['naica', 'cristais', 'gesso', 'minerais', 'mexico'],

    influencias: [
      { chave: 'exploracao', peso: 1 }
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
