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
 *   corAtmosfera (opcional): '#RRGGBB'. O AMBIENTE da capa — escolhido a olho,
 *                junto com a imagem. Tinge o alto do post, logo abaixo da
 *                emenda com o post de cima (o header nunca a usa). Pode ser
 *                clara: o app a escurece sozinho o quanto for preciso. Sem ela,
 *                vale a cor do tema. Não é a cor do tema: o chip continua com
 *                a identidade do assunto.
 *
 * Acrescentar um tema ou uma influência nova é mudança de código, não de
 * conteúdo: mexe em `shared/domain` e no engine do mundo.
 */

/**
 * Uma curiosidade do catálogo.
 *
 * É a `Curiosity` do engine mais a apresentação editorial: capa e atmosfera.
 * Elas ficam só aqui de propósito — o engine continua sem saber que existem
 * imagens ou cores, e mesmo assim você cadastra tudo num bloco só.
 */
export interface CuriosityEntry extends Curiosity {
  /** Capa do card. Sem ela, o card usa a cor e o símbolo do tema. */
  capa?: ImageSourcePropType;
  /**
   * A cor do ambiente da capa, '#RRGGBB', escolhida à mão. Nunca é calculada no
   * aparelho. Conteúdo editorial: não vai para o save.
   */
  corAtmosfera?: string;
}

/**
 * Catálogo inicial para o primeiro playtest do Éon.
 *
 * São 27 curiosidades reais: 10 de Astronomia, 6 de Geologia, 6 de Natureza e
 * 5 de História.
 * As capas e `corAtmosfera` ficaram de fora de propósito para serem adicionadas
 * junto das imagens escolhidas para cada post.
 *
 * A ordem aqui não é a do feed: o Discovery sorteia a ordem uma vez por sessão
 * (learning/presentation/ordemDoFeed.ts).
 */
export const CURIOSIDADES: readonly CuriosityEntry[] = [
  // -------------------------------------------------------------------
  // ASTRONOMIA
  // -------------------------------------------------------------------
  {
    id: 'auroras-atmosfera',

    titulo: 'A aurora boreal é a atmosfera da Terra brilhando',

    capa: require('../../../../assets/curiosities/aurora-boreal.jpg'),

    preview:
      'As luzes coloridas do céu surgem quando partículas energéticas chegam à alta atmosfera e transferem energia para seus gases.',

    conteudo: `
A aurora boreal, no hemisfério norte, e a aurora austral, no sul, são manifestações visíveis da interação entre o ambiente espacial e a atmosfera da Terra.

O Sol libera continuamente partículas carregadas no chamado vento solar. Parte da energia associada a essas partículas interage com a magnetosfera terrestre. Em determinadas condições, partículas energéticas são conduzidas ao longo do campo magnético para regiões próximas aos polos e colidem com átomos e moléculas da alta atmosfera.

Essas colisões deixam os gases temporariamente em estados de maior energia. Quando eles retornam a estados mais baixos, liberam essa energia na forma de luz. O oxigênio pode produzir, por exemplo, tons verdes e vermelhos; o nitrogênio participa de tons azulados, rosados e arroxeados.

Por isso, uma aurora não é uma nuvem colorida nem luz refletida no céu. É o próprio gás da atmosfera emitindo luz depois de receber energia de partículas vindas do ambiente espacial.
    `.trim(),

    tema: 'astronomia',

    tags: ['aurora', 'sol', 'atmosfera', 'magnetosfera', 'vento-solar'],

    influencias: [{ chave: 'observacao', peso: 1 }],

    fontes: [
      {
        titulo: 'NASA Science — Auroras',
        url: 'https://science.nasa.gov/sun/auroras/',
      },
    ],

    verificadoEm: '2026-09-29',
  },

  {
    id: 'venus-rotacao-maior-que-ano',

    titulo: 'Em Vênus, uma rotação dura mais que um ano',

    capa: require('../../../../assets/curiosities/venus-planet.jpg'),

    preview:
      'Vênus leva cerca de 243 dias terrestres para girar uma vez sobre si mesmo, mas apenas 225 para completar uma volta ao redor do Sol.',

    conteudo: `
Vênus gira tão lentamente que uma rotação completa do planeta leva aproximadamente 243 dias terrestres. O curioso é que seu ano é mais curto: uma órbita completa ao redor do Sol leva cerca de 225 dias terrestres.

Isso não significa que alguém na superfície esperaria 243 dias entre um nascer do Sol e o próximo. Como Vênus também se move ao redor do Sol enquanto gira, o intervalo entre dois meios-dias solares é de aproximadamente 117 dias terrestres.

Há outra diferença marcante. Vênus gira no sentido oposto ao da Terra e da maioria dos outros planetas do Sistema Solar. Esse movimento é chamado de rotação retrógrada. Para um observador na superfície venusiana, o Sol pareceria nascer no oeste e se pôr no leste.

Assim, Vênus consegue reunir duas estranhezas no mesmo relógio: gira para o lado incomum e leva mais tempo para completar uma rotação do que para completar um ano inteiro.
    `.trim(),

    tema: 'astronomia',

    tags: ['venus', 'rotacao', 'orbita', 'planetas', 'sistema-solar'],

    influencias: [{ chave: 'observacao', peso: 1 }],

    fontes: [
      {
        titulo: 'NASA Science — Venus: Facts',
        url: 'https://science.nasa.gov/venus/venus-facts/',
      },
    ],

    verificadoEm: '2026-09-29',
  },

  {
    id: 'lado-oculto-lua-tem-dia',

    titulo: 'O lado oculto da Lua também recebe luz do Sol',

    capa: require('../../../../assets/curiosities/lua-lado-oculto.jpg'),

    preview:
      'Chamado muitas vezes de “lado escuro”, o hemisfério que não vemos da Terra passa por dias e noites como o lado familiar da Lua.',

    conteudo: `
Da Terra, vemos praticamente sempre o mesmo hemisfério da Lua. Isso acontece porque a Lua leva aproximadamente o mesmo tempo para girar sobre o próprio eixo e para completar uma órbita ao redor da Terra, uma situação chamada rotação síncrona.

O hemisfério oposto ficou conhecido popularmente como “lado escuro da Lua”, mas o nome é enganoso. Ele recebe tanta luz solar quanto o lado voltado para nós. Quando ocorre uma Lua nova vista da Terra, por exemplo, grande parte do lado distante está iluminada pelo Sol.

O que muda é a nossa perspectiva, não a existência de luz. O lado distante também atravessa um ciclo completo de dia e noite lunar.

Durante grande parte da história humana ninguém havia visto diretamente esse terreno. As primeiras fotografias do lado distante foram enviadas pela sonda soviética Luna 3 em 1959 e revelaram uma superfície bem diferente, muito mais densamente marcada por crateras e com menos grandes planícies escuras de lava solidificada.
    `.trim(),

    tema: 'astronomia',

    tags: ['lua', 'lado-oculto', 'rotacao', 'luna-3', 'satelite'],

    influencias: [{ chave: 'observacao', peso: 1 }],

    fontes: [
      {
        titulo: 'NASA Science — Top Moon Questions',
        url: 'https://science.nasa.gov/moon/top-moon-questions/',
      },
      {
        titulo: 'NASA Science — First Photo of the Lunar Far Side',
        url: 'https://science.nasa.gov/resource/first-photo-of-the-lunar-far-side/',
      },
    ],

    verificadoEm: '2026-09-29',
  },

  {
    id: 'luz-sol-oito-minutos',

    titulo: 'Quando você vê o Sol, está olhando cerca de 8 minutos para o passado',

    capa: require('../../../../assets/curiosities/sol-8-minutos.jpg'),

    preview:
      'Mesmo viajando à velocidade da luz, a informação que sai do Sol leva aproximadamente 8 minutos e 20 segundos para alcançar a Terra.',

    conteudo: `
A distância média entre a Terra e o Sol é de aproximadamente 150 milhões de quilômetros. A luz é extremamente rápida, mas ainda precisa de tempo para atravessar essa distância.

O percurso leva cerca de 8 minutos e 20 segundos. Isso significa que a luz que chega aos seus olhos agora deixou o Sol alguns minutos antes. Em termos estritos, nunca observamos o Sol exatamente como ele está no mesmo instante em que o vemos da Terra.

Essa ideia vale para praticamente tudo no Universo. A luz da Lua leva cerca de 1,3 segundo para chegar até nós, enquanto a luz de estrelas e galáxias distantes pode viajar por anos, milhões de anos ou até bilhões de anos.

É por isso que observar o espaço também é observar o passado. Quanto mais distante está um objeto, mais antiga é a informação luminosa que recebemos dele.
    `.trim(),

    tema: 'astronomia',

    tags: ['sol', 'luz', 'tempo', 'distancia', 'universo'],

    influencias: [{ chave: 'observacao', peso: 1 }],

    fontes: [
      {
        titulo: 'NASA Science — Voyager 1: What Is a Light-Day',
        url: 'https://science.nasa.gov/mission/voyager/voyager-1/voyager-1-what-is-a-light-day/',
      },
      {
        titulo: 'NASA Science — Time Travel: Observing Cosmic History',
        url: 'https://science.nasa.gov/mission/hubble/science/science-behind-the-discoveries/time-travel-observing-cosmic-history/',
      },
    ],

    verificadoEm: '2026-09-29',
  },

  {
    id: 'estrela-cadente-nao-estrela',

    titulo: 'Uma estrela cadente não é uma estrela',

    capa: require('../../../../assets/curiosities/estrela-cadente.jpg'),

    preview:
      'O risco luminoso que cruza o céu costuma ser produzido por um pequeno fragmento de rocha ou poeira entrando rapidamente na atmosfera.',

    conteudo: `
Apesar do nome popular, uma estrela cadente não tem relação direta com uma estrela despencando do céu. O fenômeno é um meteoro, a faixa de luz produzida quando um meteoroide entra em alta velocidade na atmosfera de um planeta.

O nome do objeto muda conforme sua situação. Enquanto o fragmento ainda está no espaço, ele é chamado de meteoroide. Quando atravessa a atmosfera e produz o fenômeno luminoso, chamamos esse brilho de meteoro. Se parte do material sobrevive à passagem e chega ao solo, o fragmento encontrado passa a ser um meteorito.

Muitos meteoroides são minúsculos, alguns do tamanho de grãos de poeira. Mesmo assim, a grande velocidade de entrada faz com que aqueçam e ionizem gases ao redor, produzindo um traço brilhante que pode ser visto a quilômetros de distância.

As chamadas chuvas de meteoros acontecem quando a Terra atravessa regiões com muitos desses pequenos detritos, frequentemente deixados ao longo da órbita de cometas.
    `.trim(),

    tema: 'astronomia',

    tags: ['meteoro', 'meteoroide', 'meteorito', 'cometa', 'atmosfera'],

    influencias: [{ chave: 'observacao', peso: 1 }],

    fontes: [
      {
        titulo: 'NASA Science — Meteors and Meteorites',
        url: 'https://science.nasa.gov/solar-system/meteors-meteorites/',
      },
    ],

    verificadoEm: '2026-09-29',
  },

  // -------------------------------------------------------------------
  // HISTÓRIA
  // -------------------------------------------------------------------
  {
    id: 'espiritu-pampa',

    titulo: 'A última capital dos incas ficou escondida na floresta',

    capa: require('../../../../assets/curiosities/espiritu-pampa.jpg'),

    preview:
      'Espíritu Pampa, nas montanhas e florestas de Vilcabamba, é hoje associada à capital final do estado inca que resistiu aos espanhóis até 1572.',

    conteudo: `
Depois das guerras da conquista espanhola no século XVI, Manco Inca e seus sucessores estabeleceram uma nova base de poder na região remota de Vilcabamba. Esse estado neo-inca sobreviveu por décadas, até ser derrotado pelos espanhóis em 1572.

Em 1911, durante sua busca por Vilcabamba, Hiram Bingham chegou a ruínas cobertas pela vegetação em Espíritu Pampa. Mais tarde, porém, ele passou a defender que Machu Picchu correspondia à cidade que procurava. Pesquisas históricas e arqueológicas posteriores mostraram que as ruínas de Espíritu Pampa se encaixam muito melhor na localização da última capital inca.

O sítio ainda reservava outra surpresa. Escavações modernas encontraram ali evidências importantes da cultura Wari, anterior aos incas, incluindo arquitetura, cerâmica e objetos de elite. Isso mostra que a região já possuía importância política e ritual muitos séculos antes do último refúgio inca.

Espíritu Pampa acabou revelando não apenas o capítulo final de um império, mas várias camadas de ocupação escondidas sob a mesma floresta.
    `.trim(),

    tema: 'historia',

    tags: ['incas', 'peru', 'vilcabamba', 'espiritu-pampa', 'arqueologia'],

    influencias: [{ chave: 'povoamento', peso: 2 }],

    fontes: [
      {
        titulo: 'Dirección Desconcentrada de Cultura de Cusco — Hallazgos en Espíritu Pampa',
        url: 'https://www.culturacusco.gob.pe/noticia/patrimonio-cultural/importantes-hallazgos-reportan-en-sitio-arqueologico-de-espiritupampa/',
      },
      {
        titulo: 'Dirección Desconcentrada de Cultura de Cusco — Machupicchu: Investigaciones Interdisciplinarias, Tomo I',
        url: 'https://vcddc.culturacusco.gob.pe/documents/2020/12_diciembre/MACHUPICCHU-INVESTIGACIONES-INTERDISCIPLINARIAS-TOMO-I.pdf',
      },
    ],

    verificadoEm: '2026-09-29',
  },
  {
    id: 'qhapaq-nan-30000-km',

    titulo: 'Os incas conectaram os Andes com mais de 30 mil km de estradas',

    capa: require('../../../../assets/curiosities/qhapaq-nan.jpg'),

    preview:
      'O Qhapaq Ñan ligava montanhas acima de 6 mil metros, desertos, vales e florestas em uma rede de comunicação, comércio e administração.',

    conteudo: `
Muito antes de estradas modernas cruzarem os Andes, comunidades andinas já construíam caminhos capazes de atravessar alguns dos terrenos mais extremos do planeta. Os incas ampliaram e integraram essas rotas em uma rede conhecida como Qhapaq Ñan.

Segundo a UNESCO, o sistema alcançou mais de 30 mil quilômetros. As rotas ligavam Cusco a centros políticos, áreas produtivas, locais religiosos e postos de armazenamento e hospedagem. O caminho atravessava regiões que iam de montanhas com mais de 6 mil metros de altitude até desertos costeiros e florestas tropicais.

A rede não surgiu do nada. Parte dela aproveitou infraestruturas criadas por sociedades anteriores aos incas e foi sendo expandida ao longo de séculos. No auge do Tawantinsuyu, no século XV, esses caminhos ajudavam a movimentar pessoas, mensagens, mercadorias e exércitos por uma área gigantesca.

Sem veículos com rodas dominando esse sistema, a engenharia dependia de trilhas, escadarias, muros, pontes e adaptações específicas para cada paisagem.
    `.trim(),

    tema: 'historia',

    tags: ['incas', 'qhapaq-nan', 'andes', 'estradas', 'engenharia'],

    influencias: [{ chave: 'infraestrutura', peso: 2 }],

    fontes: [
      {
        titulo: 'UNESCO World Heritage Centre — Qhapaq Ñan, Andean Road System',
        url: 'https://whc.unesco.org/en/list/1459',
      },
    ],

    verificadoEm: '2026-09-29',
  },

  {
    id: 'pedra-roseta-tres-escritas',

    titulo: 'Uma pedra escrita três vezes ajudou a decifrar os hieróglifos',

    capa: require('../../../../assets/curiosities/pedra-roseta.jpg'),

    preview:
      'A Pedra de Roseta preservou o mesmo decreto em diferentes sistemas de escrita, dando aos estudiosos uma ponte para compreender o egípcio antigo.',

    conteudo: `
A Pedra de Roseta é um fragmento de uma estela com um decreto produzido no Egito em 196 a.C., durante o reinado de Ptolomeu V. O que tornou o objeto extraordinário para a história moderna foi a forma como o texto foi registrado.

O mesmo decreto aparece em três formas de escrita: hieróglifos egípcios, escrita demótica e grego antigo. Como estudiosos europeus conseguiam ler o grego, foi possível comparar nomes, palavras e estruturas entre as inscrições.

Esse trabalho não produziu uma tradução instantânea. Pesquisadores como Thomas Young fizeram avanços importantes, e Jean-François Champollion conseguiu demonstrar de maneira decisiva como muitos sinais hieroglíficos representavam sons e como eles podiam ser lidos usando também seu conhecimento do copta, língua derivada do antigo egípcio.

A pedra não continha um dicionário secreto. Seu poder estava na repetição: uma mesma mensagem registrada em sistemas diferentes permitiu transformar comparações cuidadosas em uma chave para textos que haviam permanecido indecifráveis durante séculos.
    `.trim(),

    tema: 'historia',

    tags: ['egito', 'pedra-roseta', 'hieroglifos', 'escrita', 'arqueologia'],

    influencias: [{ chave: 'povoamento', peso: 1 }],

    fontes: [
      {
        titulo: 'British Museum — Everything you ever wanted to know about the Rosetta Stone',
        url: 'https://www.britishmuseum.org/blog/everything-you-ever-wanted-know-about-rosetta-stone',
      },
    ],

    verificadoEm: '2026-09-29',
  },

  {
    id: 'mecanismo-antikythera-eclipses',

    titulo: 'Uma máquina de engrenagens de 2 mil anos conseguia prever eclipses',

    capa: require('../../../../assets/curiosities/mecanismo-antikythera.jpg'),

    preview:
      'O Mecanismo de Anticítera usava dezenas de engrenagens para representar ciclos astronômicos muito antes dos relógios mecânicos modernos.',

    conteudo: `
No início do século XX, mergulhadores recuperaram de um naufrágio próximo à ilha grega de Anticítera vários fragmentos de bronze corroído. Dentro deles havia rodas dentadas encaixadas em um mecanismo de complexidade inesperada para a Antiguidade.

O objeto foi construído no século II a.C. e utilizava sistemas de engrenagens para representar relações entre ciclos do Sol e da Lua. Seus mostradores permitiam acompanhar calendários e ciclos astronômicos; entre suas funções estava a indicação de períodos associados à ocorrência de eclipses.

Isso exigia transformar observações astronômicas e relações matemáticas em movimento mecânico. Ao girar o mecanismo, diferentes engrenagens avançavam em velocidades calculadas para reproduzir esses ciclos.

O Mecanismo de Anticítera é frequentemente descrito como um computador astronômico analógico antigo. Mais importante que o rótulo é o que ele demonstra: engenheiros e astrônomos helenísticos foram capazes de condensar conhecimento do céu em uma máquina portátil feita de bronze.
    `.trim(),

    tema: 'historia',

    tags: ['antikythera', 'grecia', 'astronomia', 'engrenagens', 'eclipses'],

    influencias: [{ chave: 'observacao', peso: 1 }],

    fontes: [
      {
        titulo: 'National Archaeological Museum — The Mysteries of the Antikythera Mechanism',
        url: 'https://antikythera-mechanism.namuseum.gr/en/',
      },
      {
        titulo: 'National Archaeological Museum — Functions of the Antikythera Mechanism',
        url: 'https://antikythera-mechanism.namuseum.gr/en/what-is-the-mechanism-and-what-does-it-consist-of/',
      },
    ],

    verificadoEm: '2026-09-29',
  },

  {
    id: 'vikings-america-1021',

    titulo: 'Vikings estavam na América do Norte no ano 1021',

    capa: require('../../../../assets/curiosities/vikings-america.jpg'),

    preview:
      'Anéis de árvores cortadas por nórdicos em Newfoundland permitiram fixar uma data precisa para presença europeia na América séculos antes de Colombo.',

    conteudo: `
L’Anse aux Meadows, no atual Canadá, é o único sítio nórdico confirmado na América do Norte. Suas construções de madeira e turfa, além de evidências de metalurgia e carpintaria, mostram que navegadores vindos do Atlântico Norte estabeleceram ali uma base há cerca de mil anos.

Durante muito tempo, a arqueologia conseguia situar a ocupação por volta do ano 1000, mas sem apontar um ano exato. Isso mudou com um estudo publicado na revista Nature.

Pesquisadores analisaram pedaços de madeira modificados por ferramentas metálicas. Os anéis das árvores preservavam uma alteração global na concentração de carbono-14 causada por um evento de raios cósmicos ocorrido em 993. Contando os anéis formados depois dessa marca, a equipe concluiu que as árvores haviam sido cortadas em 1021.

O resultado não significa que toda a ocupação durou apenas naquele ano. Ele fornece algo mais específico: uma data de calendário segura mostrando que pessoas nórdicas estavam ativas em L’Anse aux Meadows em 1021, 471 anos antes da primeira viagem de Colombo em 1492.
    `.trim(),

    tema: 'historia',

    tags: ['vikings', 'nordicos', 'canada', 'arqueologia', 'l-anse-aux-meadows'],

    influencias: [{ chave: 'povoamento', peso: 1 }],

    fontes: [
      {
        titulo: 'Nature — Evidence for European presence in the Americas in AD 1021',
        url: 'https://www.nature.com/articles/s41586-021-03972-8',
      },
      {
        titulo: "Parks Canada — L'Anse aux Meadows National Historic Site",
        url: 'https://parks.canada.ca/culture/designation/lieu-site/anse-aux-meadows',
      },
    ],

    verificadoEm: '2026-09-29',
  },

  // -------------------------------------------------------------------
  // GEOLOGIA
  // -------------------------------------------------------------------
  {
    id: 'naica-cristais-gigantes',

    titulo: 'Existe uma caverna com cristais de até 11 metros',

    capa: require('../../../../assets/curiosities/naica-cristais.jpg'),

    preview:
      'Na mina de Naica, no México, condições térmicas extremamente estáveis permitiram o crescimento de cristais gigantes de gesso.',

    conteudo: `
Nas profundezas da mina de Naica, no estado mexicano de Chihuahua, foram encontradas cavidades ocupadas por enormes cristais transparentes de gesso. Alguns atingem cerca de 11 metros de comprimento, tamanho comparável ao de um ônibus.

Esses cristais não cresceram por causa de uma reação rápida. Estudos de inclusões de fluido preservadas dentro deles indicam que se formaram a partir de soluções de baixa salinidade em temperaturas próximas de 54 °C.

A temperatura era especialmente importante. Naquela faixa muito estreita, a dissolução de anidrita podia alimentar lentamente a formação de gesso sem produzir uma explosão de novos cristais pequenos. Com poucas estruturas competindo pelo material disponível e condições estáveis durante períodos muito longos, alguns cristais continuaram crescendo até alcançar dimensões extraordinárias.

A caverna parece impossível porque as condições que a criaram foram igualmente incomuns: calor, água rica em minerais, química adequada e estabilidade suficiente para que o crescimento permanecesse lento e contínuo.
    `.trim(),

    tema: 'geologia',

    tags: ['naica', 'cristais', 'gesso', 'minerais', 'mexico'],

    influencias: [{ chave: 'exploracao', peso: 2 }],

    fontes: [
      {
        titulo: 'Boletín de la Sociedad Geológica Mexicana — Formación de megacristales naturales de yeso en Naica',
        url: 'https://boletinsgm.igeolcu.unam.mx/bsgm/index.php/315-sitio/resumenes/cuarta-epoca/5901/1537-5901-5-garcia',
      },
    ],

    verificadoEm: '2026-09-29',
  },

  {
    id: 'placas-tectonicas-em-movimento',

    titulo: 'O chão sob seus pés está se movendo agora',

    capa: require('../../../../assets/curiosities/placas-tectonicas.jpg'),

    preview:
      'As placas tectônicas parecem imóveis na escala de uma vida humana, mas avançam continuamente a velocidades de milímetros a centímetros por ano.',

    conteudo: `
A superfície sólida da Terra não forma uma única casca imóvel. A litosfera está dividida em grandes placas tectônicas que se deslocam umas em relação às outras sobre regiões mais quentes e deformáveis do manto superior.

Na maioria dos lugares, esse movimento é lento demais para ser percebido sem instrumentos. As velocidades típicas ficam na ordem de alguns centímetros por ano, embora diferentes placas e limites possam se mover mais devagar ou mais rápido.

Essa pequena distância anual se torna enorme quando acumulada por milhões de anos. Continentes se separam, oceanos se abrem e fecham, cadeias de montanhas se formam e partes do fundo oceânico são empurradas para dentro do manto.

Também é nos limites entre essas placas que se concentra grande parte da atividade sísmica e vulcânica do planeta. O cenário parece estático para nós, mas geologicamente a superfície terrestre está em movimento contínuo.
    `.trim(),

    tema: 'geologia',

    tags: ['tectonica', 'placas', 'continentes', 'terremotos', 'vulcanismo'],

    influencias: [{ chave: 'infraestrutura', peso: 1 }],

    fontes: [
      {
        titulo: 'U.S. Geological Survey — Brief Overview of Plate Tectonics',
        url: 'https://volcanoes.usgs.gov/about/edu/dynamicplanet/',
      },
      {
        titulo: 'U.S. Geological Survey — Understanding Plate Motions',
        url: 'https://pubs.usgs.gov/gip/dynamic/understanding.html',
      },
    ],

    verificadoEm: '2026-09-29',
  },

  {
    id: 'atlantico-continua-abrindo',

    titulo: 'O oceano Atlântico ainda está ficando mais largo',

    capa: require('../../../../assets/curiosities/atlantico-dorsal.jpg'),

    preview:
      'No meio do Atlântico, novas rochas se formam no fundo do mar enquanto as placas se afastam lentamente umas das outras.',

    conteudo: `
Cortando o fundo do oceano Atlântico existe uma enorme cadeia montanhosa submarina chamada Dorsal Mesoatlântica. Ela marca um limite em que placas tectônicas se afastam e material do interior da Terra contribui para formar nova crosta oceânica.

Segundo o Serviço Geológico dos Estados Unidos, a expansão média ao longo da dorsal é de aproximadamente 2,5 centímetros por ano. Parece quase nada, mas equivale a cerca de 25 quilômetros em um milhão de anos.

Ao longo de dezenas e centenas de milhões de anos, essa produção de fundo oceânico ajudou a transformar uma abertura pequena entre continentes no vasto oceano Atlântico atual.

A Islândia oferece uma rara oportunidade de observar parte desse sistema acima do nível do mar: o país está sobre a dorsal, entre as placas Norte-Americana e Eurasiática.

Assim, o Atlântico não é apenas uma bacia pronta. Em escala geológica, ele continua sendo construído centímetro por centímetro.
    `.trim(),

    tema: 'geologia',

    tags: ['atlantico', 'dorsal-mesoatlantica', 'tectonica', 'oceano', 'islandia'],

    influencias: [{ chave: 'exploracao', peso: 1 }],

    fontes: [
      {
        titulo: 'U.S. Geological Survey — Understanding Plate Motions',
        url: 'https://pubs.usgs.gov/gip/dynamic/understanding.html',
      },
    ],

    verificadoEm: '2026-09-29',
  },

  {
    id: 'madeira-petrificada-quartzo',

    titulo: 'Árvores com mais de 200 milhões de anos viraram pedra sem perder a forma',

    capa: require('../../../../assets/curiosities/madeira-petrificada.jpg'),

    preview:
      'No Petrified Forest, antigos troncos foram enterrados e preenchidos ou substituídos por sílica até se tornarem fósseis minerais.',

    conteudo: `
No atual Petrified Forest National Park, nos Estados Unidos, enormes rios transportaram troncos durante o período Triássico. Muitas dessas árvores foram rapidamente soterradas por sedimentos há cerca de 208 a 225 milhões de anos.

Enterrada e isolada da decomposição rápida, a madeira entrou em contato com águas subterrâneas carregadas de sílica, em parte proveniente de cinzas vulcânicas presentes nos sedimentos. Ao longo do tempo, minerais penetraram nos poros do tecido vegetal e, em muitos exemplares, também substituíram material orgânico enquanto ele se degradava.

O resultado é madeira petrificada: estruturas que ainda preservam a aparência de troncos e detalhes do tecido original, mas são compostas em grande parte por minerais de sílica, incluindo quartzo e variedades como calcedônia.

As cores intensas não são tinta nem madeira preservada com sua cor original. Pequenas quantidades de minerais contendo ferro e manganês ajudam a produzir tons vermelhos, amarelos, marrons, roxos e escuros.
    `.trim(),

    tema: 'geologia',

    tags: ['fossil', 'madeira-petrificada', 'silica', 'quartzo', 'triassico'],

    influencias: [{ chave: 'exploracao', peso: 1 }],

    fontes: [
      {
        titulo: 'U.S. National Park Service — Petrified Forest Fast Facts',
        url: 'https://www.nps.gov/pefo/planyourvisit/fast-facts.htm',
      },
      {
        titulo: 'U.S. National Park Service — Permineralization and Replacement',
        url: 'https://www.nps.gov/articles/000/permineralization-and-replacement.htm',
      },
    ],

    verificadoEm: '2026-09-29',
  },

  {
    id: 'challenger-deep-11-km',

    titulo: 'O ponto mais profundo do oceano fica quase 11 km abaixo da superfície',

    capa: require('../../../../assets/curiosities/challenger-deep.jpg'),

    preview:
      'O Challenger Deep, na Fossa das Marianas, desce a aproximadamente 10.935 metros abaixo do nível do mar.',

    conteudo: `
A profundidade média dos oceanos é de cerca de 3.682 metros, mas algumas regiões descem muito além disso. A mais profunda conhecida fica no Pacífico ocidental, na extremidade sul da Fossa das Marianas.

Essa depressão é chamada Challenger Deep. Medições modernas colocam sua profundidade em aproximadamente 10.935 metros, quase 11 quilômetros abaixo da superfície do mar.

Para comparar escalas, o Monte Everest possui cerca de 8,8 quilômetros de altitude acima do nível do mar. Mesmo que uma montanha dessa altura pudesse ser colocada no Challenger Deep, seu topo ainda permaneceria a mais de dois quilômetros abaixo da superfície.

A Fossa das Marianas existe em uma região de subducção, onde uma placa tectônica mergulha sob outra. O relevo extremo no fundo do oceano é, portanto, uma consequência visível do mesmo movimento de placas que também produz terremotos, vulcões e cadeias de ilhas em outras partes do planeta.
    `.trim(),

    tema: 'geologia',

    tags: ['fossa-das-marianas', 'challenger-deep', 'oceano', 'profundidade', 'subduccao'],

    influencias: [{ chave: 'exploracao', peso: 2 }],

    fontes: [
      {
        titulo: 'NOAA Ocean Service — How deep is the ocean?',
        url: 'https://oceanservice.noaa.gov/facts/oceandepth.html',
      },
      {
        titulo: 'NOAA Fisheries — Mariana Trench Marine National Monument',
        url: 'https://www.fisheries.noaa.gov/pacific-islands/habitat-conservation/mariana-trench-marine-national-monument',
      },
    ],

    verificadoEm: '2026-09-29',
  },

  // -------------------------------------------------------------------
  // NATUREZA
  // -------------------------------------------------------------------
  {
    id: 'polvo-tres-coracoes-sangue-azul',

    titulo: 'Polvos têm três corações e sangue azul',

    capa: require('../../../../assets/curiosities/polvo-coracao.jpg'),

    preview:
      'Dois corações enviam sangue para as brânquias, enquanto um terceiro o distribui pelo resto do corpo. E o pigmento respiratório usa cobre, não ferro.',

    conteudo: `
O sistema circulatório de um polvo é bem diferente do nosso. Ele possui três corações. Dois deles bombeiam sangue através das brânquias, onde ocorre a troca de gases com a água, e o terceiro envia o sangue oxigenado para os demais órgãos e músculos.

A cor também chama atenção. Humanos transportam grande parte do oxigênio usando hemoglobina, proteína que contém ferro e dá ao sangue sua cor vermelha. Polvos utilizam principalmente hemocianina, uma proteína que contém cobre e adquire tonalidade azulada quando está ligada ao oxigênio.

A hemocianina funciona bem nas condições frias e com pouco oxigênio encontradas em muitos ambientes marinhos ocupados por cefalópodes.

Há ainda uma peculiaridade energética: o coração que abastece o corpo para de bater durante a natação ativa do polvo. Nadar, portanto, pode ser bastante exigente, e muitas espécies passam grande parte do tempo se deslocando pelo fundo com os braços em vez de nadar continuamente.
    `.trim(),

    tema: 'natureza',

    tags: ['polvo', 'cefalopodes', 'coracao', 'sangue', 'hemocianina'],

    influencias: [{ chave: 'vegetacao', peso: 1 }],

    fontes: [
      {
        titulo: 'Smithsonian Magazine — Ten Wild Facts About Octopuses',
        url: 'https://www.smithsonianmag.com/science-nature/ten-wild-facts-about-octopuses-they-have-three-hearts-big-brains-and-blue-blood-7625828/',
      },
    ],

    verificadoEm: '2026-09-29',
  },
  {
    id: 'corais-sao-animais',

    titulo: 'Corais parecem plantas e pedras, mas são animais',

    preview:
      'Um recife é construído por pequenos animais chamados pólipos, muitos deles vivendo em colônias com milhares de indivíduos.',

    conteudo: `
Corais podem ficar presos ao fundo do mar, formar estruturas rígidas e até parecer arbustos. Mesmo assim, não são plantas nem rochas: são animais invertebrados do grupo dos cnidários, parentes de águas-vivas e anêmonas.

Muitos corais que parecem um único organismo são colônias formadas por centenas ou milhares de pequenos pólipos. Nos corais construtores de recifes, esses animais secretam esqueletos de carbonato de cálcio. Geração após geração, o acúmulo desse material ajuda a formar estruturas enormes.

Muitos pólipos também vivem em parceria com algas microscópicas em seus tecidos. As algas realizam fotossíntese e fornecem compostos orgânicos ao coral, enquanto recebem abrigo e nutrientes.

Quando condições como temperatura, luz ou nutrientes causam estresse intenso, o coral pode expulsar essas algas e ficar esbranquiçado. Esse fenômeno é chamado branqueamento. Um coral branqueado não está necessariamente morto, mas fica sob maior estresse e risco de mortalidade.
    `.trim(),

    tema: 'natureza',

    tags: ['corais', 'recifes', 'polipos', 'cnidarios', 'oceano'],

    influencias: [{ chave: 'vegetacao', peso: 1 }],

    fontes: [
      {
        titulo: 'NOAA Ocean Exploration — Are corals animals, plants, or something else?',
        url: 'https://oceanexplorer.noaa.gov/ocean-fact/coral-animal/',
      },
      {
        titulo: 'NOAA Ocean Service — Are corals animals or plants?',
        url: 'https://oceanservice.noaa.gov/facts/coral.html',
      },
    ],

    verificadoEm: '2026-09-29',
  },
  {
    id: 'monarcas-migracao-4800-km',

    titulo: 'Uma borboleta pode viajar quase 5 mil km para passar o inverno',

    preview:
      'Monarcas do leste da América do Norte podem migrar do Canadá até o México em uma das jornadas mais longas conhecidas entre insetos.',

    conteudo: `
A borboleta-monarca pesa menos de um grama, mas algumas populações realizam uma migração continental. No outono, monarcas do leste da América do Norte podem viajar até cerca de 3 mil milhas, aproximadamente 4.800 quilômetros, em direção a áreas de inverno no México.

A viagem pode durar mais de dois meses. Durante a migração, observações e marcações indicam deslocamentos típicos de dezenas de milhas por dia, com ajuda de correntes de ar e condições favoráveis.

O detalhe mais curioso aparece quando se observa o ciclo completo. As gerações de primavera e verão normalmente vivem poucas semanas e avançam gradualmente para o norte ao longo de várias gerações. Já a geração que nasce no fim do verão entra em um estado reprodutivo diferente e vive muito mais tempo, o suficiente para realizar a longa viagem ao sul.

Essas borboletas nunca fizeram a rota antes. Ainda assim, conseguem encontrar as regiões de inverno usadas por gerações anteriores, guiadas por mecanismos biológicos que incluem informações do Sol e do campo magnético terrestre.
    `.trim(),

    tema: 'natureza',

    tags: ['monarca', 'borboleta', 'migracao', 'mexico', 'insetos'],

    influencias: [{ chave: 'vegetacao', peso: 1 }],

    fontes: [
      {
        titulo: 'U.S. Fish & Wildlife Service — Monarch (Danaus plexippus)',
        url: 'https://www.fws.gov/species/monarch-danaus-plexippus',
      },
      {
        titulo: 'U.S. Fish & Wildlife Service — The phenomenal monarch migration',
        url: 'https://www.fws.gov/story/phenomenal-monarch-migration',
      },
      {
        titulo: 'Nature Communications — A magnetic compass aids monarch butterfly migration',
        url: 'https://pubmed.ncbi.nlm.nih.gov/24960099/',
      },
    ],

    verificadoEm: '2026-09-29',
  },
  {
    id: 'axolote-regeneracao',

    titulo: 'O axolote consegue reconstruir partes do próprio corpo',

    preview:
      'Esse anfíbio pode regenerar membros e reparar estruturas complexas como coração, medula espinhal e partes do sistema nervoso.',

    conteudo: `
O axolote, Ambystoma mexicanum, é uma salamandra aquática que se tornou um organismo importante em laboratórios de biologia. Uma de suas capacidades mais impressionantes é a regeneração.

Depois de perder um membro, células próximas à lesão participam da formação de uma estrutura chamada blastema. A partir dela, tecidos voltam a se organizar e o animal pode reconstruir pele, músculos, ossos, vasos e nervos na posição adequada.

A capacidade não se limita aos membros. Pesquisadores estudam a regeneração de estruturas como cauda, mandíbula, coração, medula espinhal e partes do cérebro, entre outros tecidos.

Isso não significa que humanos possam simplesmente copiar o processo. O interesse científico está justamente em entender quais sinais celulares permitem ao axolote coordenar reparo e crescimento sem formar apenas uma cicatriz. Por isso, ele se tornou um organismo importante em pesquisas sobre desenvolvimento e medicina regenerativa.
    `.trim(),

    tema: 'natureza',

    tags: ['axolote', 'regeneracao', 'anfibio', 'celulas', 'medicina'],

    influencias: [{ chave: 'vegetacao', peso: 1 }],

    fontes: [
      {
        titulo: 'National Institute of General Medical Sciences — Research Organism Superheroes: Axolotls',
        url: 'https://www.nigms.nih.gov/biobeat/2024/03/research-organism-superheroes-axolotls',
      },
      {
        titulo: 'National Institute of General Medical Sciences — Regeneration',
        url: 'https://nigms.nih.gov/education/fact-sheets/Pages/regeneration',
      },
    ],

    verificadoEm: '2026-09-29',
  },
  {
    id: 'sequoias-fogo-sementes',

    titulo: 'O fogo ajuda novas sequoias-gigantes a nascer',

    preview:
      'Incêndios de baixa e média intensidade abrem cones, limpam o chão da floresta e criam condições favoráveis para a germinação dessas árvores gigantes.',

    conteudo: `
Incêndios florestais parecem incompatíveis com o nascimento de árvores, mas as sequoias-gigantes evoluíram em paisagens onde o fogo exerce um papel ecológico importante.

Seus cones podem permanecer fechados na copa por muitos anos. Quando um incêndio aquece e seca cones mais antigos, eles se abrem e liberam sementes. O fogo também remove folhas, galhos e parte da vegetação acumulada no solo, expondo a camada mineral que favorece a germinação das sementes de sequoia.

Outros agentes, como esquilos e insetos, também podem fazer cones liberarem sementes. O ponto essencial é que a semente precisa alcançar um ambiente adequado: solo exposto, luz e menos competição próxima.

Por isso, impedir todo fogo por longos períodos pode alterar profundamente esse ciclo. Atualmente, gestores de parques usam conhecimento ecológico e queimas prescritas em determinadas situações para recuperar condições que incêndios naturais de menor intensidade criavam historicamente nos bosques de sequoias.
    `.trim(),

    tema: 'natureza',

    tags: ['sequoia', 'fogo', 'sementes', 'floresta', 'ecologia'],

    influencias: [{ chave: 'vegetacao', peso: 2 }],

    fontes: [
      {
        titulo: 'U.S. National Park Service — Giant Sequoias: Cones, Seeds, and Fire',
        url: 'https://www.nps.gov/seki/learn/nature/bigtrees.htm',
      },
    ],

    verificadoEm: '2026-09-29',
  },
  {
    id: 'pulsares-farois-cosmicos',
    titulo: 'Existem estrelas mortas que piscam como faróis cósmicos',
    preview:
      'Algumas estrelas de nêutrons giram tão rápido que seus feixes de radiação varrem o espaço como a luz de um farol.',
    conteudo: `
Quando uma estrela massiva termina a vida em uma supernova, o núcleo que sobra pode colapsar até formar uma estrela de nêutrons: um objeto extremamente compacto, com mais massa que o Sol comprimida em uma região do tamanho de uma cidade.

Algumas dessas estrelas são chamadas pulsares. Elas possuem campos magnéticos intensos e podem girar muito rapidamente, emitindo feixes de radiação próximos aos polos magnéticos.

Esses feixes não precisam apontar na mesma direção do eixo de rotação. Por isso, enquanto a estrela gira, eles varrem o espaço como a luz de um farol. Da Terra, detectamos um pulso sempre que um desses feixes passa pela nossa linha de visão.

Os pulsares podem ser extraordinariamente regulares. Alguns completam centenas de rotações por segundo, o que permite aos astronomos usar seus pulsos como relógios naturais para estudar fenômenos extremos do Universo.

Eles não estão realmente ligando e desligando. O efeito de "piscar" acontece porque vemos o feixe apenas quando ele aponta para nós.
    `.trim(),
    tema: 'astronomia',
    tags: ['pulsares', 'estrela-de-nêutrons', 'supernova', 'radio', 'campo-magnetico'],
    influencias: [{ chave: 'observacao', peso: 1 }],
    fontes: [
      {
        titulo: 'NASA Science - Pulsars',
        url: 'https://science.nasa.gov/mission/hubble/science/science-behind-the-discoveries/hubble-pulsars/',
      },
      {
        titulo: 'NASA Science - Fermi Mission Nets 300 Gamma-Ray Pulsars',
        url: 'https://science.nasa.gov/universe/stars/neutron-stars/pulsars/nasas-fermi-mission-nets-300-gamma-ray-pulsars-and-counting/',
      },
    ],
    verificadoEm: '2026-10-01',
  },

  {
    id: 'hd-189733b-chuva-de-vidro',
    titulo: 'Existe um planeta azul onde pode chover vidro de lado',
    preview:
      'HD 189733 b parece azul como a Terra, mas sua atmosfera supera mil graus e ventos violentos podem carregar partículas de silicato quase horizontalmente.',
    conteudo: `
HD 189733 b e um exoplaneta gigante gasoso localizado a cerca de 63 anos-luz da Terra. Visto em luz visível, ele possui uma forte tonalidade azul, o que poderia lembrar nosso planeta a primeira vista.

A semelhança termina na cor. HD 189733 b e um "Júpiter quente": um planeta gigante que orbita extremamente perto de sua estrela. A temperatura de sua atmosfera ultrapassa mil graus Celsius e os ventos podem atingir milhares de quilômetros por hora.

Observações com o telescopio espacial Hubble indicam que sua cor azul nao vem de oceanós. Ela está associada a uma atmosfera nebulosa contendo partículas de silicato, materiais relacionados aos que formam vidro.

Em condições tao quentes, silicatos podem condensar em pequenas partículas ou gotículas. Com ventos extremamente fortes, esses materiais poderiam ser carregados quase horizontalmente pela atmosfera - origem da famosa descrição de uma possível "chuva de vidro de lado".

E importante o "possível": não observamos literalmente gotas de vidro caindo na superfície. A descrição resume o que os modelos e observações indicam sobre as partículas de silicato em sua atmosfera extrema.
    `.trim(),
    tema: 'astronomia',
    tags: ['exoplaneta', 'hd-189733b', 'jupiter-quente', 'atmosfera', 'silicatos'],
    influencias: [{ chave: 'observacao', peso: 1 }],
    fontes: [
      {
        titulo: 'NASA Science - NASAs Hubble Finds a True Blue Planet',
        url: 'https://science.nasa.gov/missions/hubble/nasas-hubble-finds-a-true-blue-planet/',
      },
      {
        titulo: 'NASA - Rains of Terror on Exoplanet HD 189733b',
        url: 'https://www.nasa.gov/image-article/rains-of-terror-exoplanet-hd-189733b/',
      },
    ],
    verificadoEm: '2026-10-01',
  },

  {
    id: 'lua-encolhendo-lunamotos',
    titulo: 'A Lua está encolhendo - e isso pode provocar terremotos lunares',
    preview:
      'Enquanto seu interior esfria, a Lua se contrai lentamente. A crosta rígida reage formando falhas que ainda podem estar ativas.',
    conteudo: `
A Lua parece um mundo geologicamente imóvel, mas seu interior ainda guarda calor. À medida que perde esse calor ao longo de centenas de milhões de anos, o satélite se contrai lentamente.

A NASA estima que a Lua ficou mais de 50 metros "mais magra" ao longo de algumas centenas de milhões de anós. Parece pouco diante de seu tamanho, mas a crosta lunar e rígida e quebradiça.

Quando o interior encolhe, a superfície precisa se ajustar. Partes da crosta quebram e uma seção pode ser empurrada sobre outra, formando falhas de empurrão. Na superfície, elas aparecem como pequenas escarpas semelhantes a degraus.

Imagens do Lunar Reconnaissance Orbiter revelaram milhares dessas falhas jovens distribuidas pela Lua. A análise de dados sísmicos das missões Apollo também indica que algumas delas ainda podem estar ativas.

Isso significa que a Lua nao e completamente "morta". Sua contração gradual, combinada com forças de maré exercidas pela Terra, ainda pode produzir terremotos lunares.
    `.trim(),
    tema: 'astronomia',
    tags: ['lua', 'lunamotos', 'falhas', 'apollo', 'lro'],
    influencias: [{ chave: 'observacao', peso: 1 }],
    fontes: [
      {
        titulo: 'NASA - Shrinking Moon May Be Generating Moonquakes',
        url: 'https://www.nasa.gov/news-release/shrinking-moon-may-be-generating-moonquakes/',
      },
      {
        titulo: 'NASA - Shrinking Moon Causing Moonquakes and Faults Near Lunar South Pole',
        url: 'https://www.nasa.gov/solar-system/moon/shrinking-moon-causing-moonquakes-and-faults-near-lunar-south-pole/',
      },
    ],
    verificadoEm: '2026-10-01',
  },

  {
    id: 'devils-tower-colunas-rocha',
    titulo: 'Uma montanha parece feita de gigantescas colunas de pedra',
    preview:
      'Devils Tower, nos Estados Unidos, é formada por enormes colunas poligonais criadas quando rocha derretida esfriou, contraiu e rachou.',
    conteudo: `
Devils Tower se ergue cerca de 265 metros acima da paisagem do Wyoming, nos Estados Unidos. Vista de perto, sua superfície parece formada por um conjunto de colunas gigantescas colocadas lado a lado.

A torre e composta por uma rocha ígnea chamada fonolito porfirítico. Quando o material derretido que a originou começou a esfriar e solidificar, ele também se contraiu.

Essa contração produziu fraturas. Quando tensões se distribuem pelo material durante o resfriamento, as rachaduras podem formar padrões poligonais. Muitas das colunas de Devils Tower possuem cinco ou seis lados, embora existam outras formas.

A estrutura nao surgiu simplesmente como uma torre exposta na superfície. A rocha ígnea se formou abaixo do terreno e, ao longo de milhões de anos, as rochas sedimentares mais frágeis que estavam ao redor foram removidas pela erosão, deixando a estrutura resistente cada vez mais exposta.

Os geólogos concordam que Devils Tower e uma intrusão ígnea, mas os detalhes exatos de como esse corpo de magma se formou ainda sao discutidos. A própria erosão apagou parte das evidências que poderiam resolver a historia completa.
    `.trim(),
    tema: 'geologia',
    tags: ['devils-tower', 'rocha-ígnea', 'erosão', 'colunas', 'wyoming'],
    influencias: [{ chave: 'exploracao', peso: 1 }],
    fontes: [
      {
        titulo: 'National Park Service - How the Tower Formed',
        url: 'https://www.nps.gov/deto/learn/nature/tower-formation.htm',
      },
      {
        titulo: 'National Park Service - Geodiversity Atlas: Devils Tower',
        url: 'https://www.nps.gov/articles/nps-geodiversity-atlas-devils-tower-national-monument-wyoming.htm',
      },
    ],
    verificadoEm: '2026-10-01',
  },

  {
    id: 'ra-de-madeira-congela-viva',
    titulo: 'Existe uma rã que passa o inverno congelada e volta a viver na primavera',
    preview:
      'A rã-da-floresta pode sobreviver durante meses com grande parte do corpo congelada, sem respirar e sem o coração bater.',
    conteudo: `
A rã-da-floresta, conhecida em inglês como wood frog, vive em regiões da América do Norte onde os invernos podem ser extremamente frios. Em vez de fugir completamente do congelamento, ela desenvolveu uma estratégia que parece impossível: permite que boa parte do corpo congele.

Durante o inverno, gelo pode se formar na cavidade abdominal e entre os tecidos. Seus olhos podem ficar esbranquiçados, a respiração para e o coração deixa de bater.

Em muitos animais isso destruiria as células. A rã-da-floresta reduz o dano produzindo grandes quantidades de substâncias protetoras, especialmente glicose. Essa concentração ajuda a proteger o interior das células enquanto o gelo se forma principalmente fora delas.

No norte do Alasca, esses animais podem permanecer congelados durante meses. Quando as temperaturas sobem, o gelo derrete, o coração volta a funcionar e a ra retoma sua atividade.

Essa adaptação também permite que despertem cedo na primavera, quando muitos lagos ainda estão congelados, aproveitando pequenas poças temporarias para se reproduzir.
    `.trim(),
    tema: 'natureza',
    tags: ['ra', 'anfibio', 'hibernacao', 'congelamento', 'adaptação'],
    influencias: [{ chave: 'vegetacao', peso: 1 }],
    fontes: [
      {
        titulo: 'National Park Service - Tiny Masters of Arctic Survival',
        url: 'https://www.nps.gov/cakr/learn/nature/wood-frog.htm',
      },
      {
        titulo: 'National Park Service - Biological Miracle',
        url: 'https://www.nps.gov/gaar/learn/nature/wood-frog-page-2.htm',
      },
    ],
    verificadoEm: '2026-10-01',
  },

  {
    id: 'venus-dia-maior-que-ano',

    titulo: 'Em Vênus, um dia dura mais do que um ano',

    preview:
      'Vênus gira tão devagar que leva 243 dias terrestres para completar uma rotação, mas apenas 225 para dar uma volta ao redor do Sol.',

    conteudo: `
Vênus é parecido com a Terra em tamanho, mas seu relógio funciona de um jeito completamente diferente.

O planeta leva cerca de 225 dias terrestres para completar uma órbita ao redor do Sol. Esse é o seu ano.

Já uma rotação completa em torno do próprio eixo leva aproximadamente 243 dias terrestres. Isso significa que, tecnicamente, um dia sideral em Vênus é mais longo do que um ano venusiano.

A situação fica ainda mais estranha porque Vênus gira no sentido oposto ao da maioria dos planetas. Se fosse possível observar o céu a partir de sua superfície, o Sol pareceria nascer no oeste e se pôr no leste.

Existe outra medida de “dia”: o intervalo entre um nascer do Sol e o seguinte. Por causa da combinação entre a rotação lenta e a órbita do planeta, esse dia solar dura cerca de 117 dias terrestres.

Vênus mostra como palavras familiares como “dia” e “ano” podem representar escalas de tempo completamente diferentes em outros mundos.
    `.trim(),

    tema: 'astronomia',

    tags: ['venus', 'rotacao', 'orbita', 'planetas', 'sistema-solar'],

    influencias: [{ chave: 'observacao', peso: 1 }],

    fontes: [
      {
        titulo: 'NASA Science — Venus: Facts',
        url: 'https://science.nasa.gov/venus/venus-facts/',
      },
      {
        titulo: 'NASA Space Place — All About Venus',
        url: 'https://spaceplace.nasa.gov/all-about-venus/en/',
      },
    ],

    verificadoEm: '2026-10-01',
  },

  {
    id: 'enceladus-oceano-jatos-espaco',

    titulo: 'Uma lua de Saturno joga água de seu oceano direto para o espaço',

    preview:
      'Sob a crosta congelada de Encélado existe um oceano global de água salgada, e parte dele escapa por enormes jatos no polo sul.',

    conteudo: `
Encélado é uma pequena lua gelada de Saturno com apenas cerca de 500 quilômetros de diâmetro. Apesar do tamanho, tornou-se um dos mundos mais interessantes do Sistema Solar.

A missão Cassini revelou que sob sua crosta de gelo existe um oceano global de água salgada. Próximo ao polo sul, grandes fraturas na superfície — apelidadas de “listras de tigre” — permitem que material desse oceano escape para o espaço.

Por essas rachaduras surgem jatos de vapor de água e partículas de gelo. A Cassini atravessou esse material e conseguiu analisar substâncias vindas diretamente do oceano subterrâneo.

As medições encontraram sais, compostos orgânicos e até fósforo, um elemento essencial para muitos processos biológicos conhecidos na Terra. Há também evidências de atividade hidrotermal no fundo desse oceano.

Isso não significa que vida tenha sido descoberta em Encélado. Significa que esse pequeno mundo reúne água líquida, química interessante e uma fonte de energia — condições que fazem dele um dos principais lugares para investigar ambientes potencialmente habitáveis fora da Terra.

O detalhe extraordinário é que uma futura missão nem precisaria necessariamente perfurar quilômetros de gelo para começar a estudar esse oceano: Encélado já lança amostras dele para o espaço.
    `.trim(),

    tema: 'astronomia',

    tags: ['encelado', 'saturno', 'oceano', 'cassini', 'astrobiologia'],

    influencias: [{ chave: 'observacao', peso: 2 }],

    fontes: [
      {
        titulo: 'NASA Science — Enceladus',
        url: 'https://science.nasa.gov/saturn/moons/enceladus/',
      },
      {
        titulo: 'NASA — Cassini Data Reveals Building Block for Life in Enceladus’ Ocean',
        url: 'https://www.nasa.gov/missions/cassini/nasa-cassini-data-reveals-building-block-for-life-in-enceladus-ocean/',
      },
    ],

    verificadoEm: '2026-10-01',
  },
];

/*
MODELO PARA COPIAR — cole dentro do array acima e preencha.
(Este bloco está comentado de propósito: não entra no feed.)

  {
    id: 'aurora-boreal',

    titulo: 'Por que a aurora boreal acontece?',

    capa: require('../../../../assets/curiosities/aurora-boreal.jpg'),

    corAtmosfera: '#1a2b4a',

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
    ],

    verificadoEm: '2026-09-29',
  },
*/