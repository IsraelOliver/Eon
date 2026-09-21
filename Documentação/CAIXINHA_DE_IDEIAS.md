# Caixinha de Ideias

> Este documento guarda ideias surgidas durante o desenvolvimento que parecem
> interessantes, mas que não fazem parte necessariamente do escopo atual. Estar
> aqui não significa que uma ideia será implementada. A intenção é preservar
> possibilidades sem desviar o foco do desenvolvimento atual.

## Como ler e como alimentar

- **Ideia futura** — possibilidade guardada. Não é decisão, não é promessa.
- **Hoje** — como o produto funciona agora. Serve de contraste, para ninguém
  confundir vontade com regra em vigor.
- **Princípio** — critério de direção que já orienta decisões, mesmo sem
  implementação.

O que está **implementado e decidido** vive no `ARCHITECTURE.md`, não aqui. O
conceito original do produto está em `ideias_gameplay_projeto_eon.md` e
`mecanica_conhecimento_e_crescimento_do_mundo.md`; esta caixinha é para o que
aparece **durante** o desenvolvimento.

Para acrescentar: escolha o grupo mais próximo, crie um `###` com um título
curto e escreva em poucas linhas. Sem formulário, sem campos obrigatórios. Se a
ideia não couber em nenhum grupo, crie outro.

---

## Jornadas e mundos

### Múltiplas jornadas / mundos antigos

**Hoje:** existe uma jornada ativa, e "Recomeçar jornada" apaga a anterior de vez.

**Ideia futura:** em vez de destruir, guardar os mundos antigos.

```
Jornada 1 → mundo → conhecimento → civilização
Jornada 2 → outro mundo → outro conhecimento → outra civilização
```

Uma tela possível:

```
Seus mundos

Vale de ...
43 conhecimentos
civilização ...

Arquipélago ...
12 conhecimentos
civilização ...

+ Nova jornada
```

Cada jornada teria sua seed, seu `KnowledgeProfile`, sua civilização, seus
settlements, seus caminhos e seu `growthSequence`. Exigiria múltiplos saves, id
de jornada, seletor de mundos, criar jornada sem destruir as outras,
provavelmente renomear, e talvez uma prévia visual de cada mundo.

**Não implementar agora.** A solução atual continua sendo uma jornada só com
reset destrutivo.

### Geração inicial como escolha

**Hoje:** antes da primeira curiosidade aprendida, dá para gerar mundos à vontade.

**Ideia futura:** transformar isso numa escolha deliberada.

```
Este será o mundo da sua jornada.

[Outro mundo]
[Começar aqui]
```

Não é preciso criar tela para isso agora — a mecânica já abre a possibilidade.

### A primeira aprendizagem como início da jornada

**Ideia de experiência.** A primeira curiosidade é especial porque consolida o
mundo. Poderia haver uma comunicação curta, visual ou narrativa:

```
Sua jornada começou.
```

Sem tutorial longo, sem bloquear nada. O momento representa: mundo selvagem
escolhido → primeiro conhecimento → primeira transformação → o mundo passa a
ter história.

### Nome da vila, do mundo ou da jornada

**Ideia futura:** deixar a pessoa nomear o mundo, a vila principal ou a jornada.
O nome apareceria nas configurações, num futuro seletor de jornadas, numa tela
de resumo e talvez no próprio mapa. Não é necessário para o MVP.

### Resumo da jornada

**Ideia futura:** uma tela com algo como conhecimentos aprendidos, temas mais
explorados, civilização construída, tempo desde o início e marcos alcançados.

Sem virar painel de métricas de produtividade: a intenção é contemplar a
evolução, não cobrar desempenho.

### Compartilhar o mundo

**Ideia futura e distante:** exportar uma imagem ou um pequeno cartão do próprio
mundo — screenshot bonito, nome da jornada, quantidade de conhecimentos,
principais temas, visão do mapa. Nada de sistema social agora; no máximo
exportação visual.

### Comparação sem competição

**Princípio, caso mundos sejam compartilháveis um dia:** evitar transformar
conhecimento em ranking.

```
"olha como meu mundo ficou"   em vez de   "eu tenho 83 pontos e você 57"
```

A diversidade dos mundos é mais interessante que competição de quantidade.

---

## Crescimento, temas e identidade

### Personalidade temática da civilização

**Princípio já discutido:** todo conhecimento faz o mundo crescer. O tema define
a **personalidade** desse crescimento, não se ele acontece.

Possibilidades por tema, sem exclusividade nem rigidez:

| Tema | Pode favorecer |
| --- | --- |
| Tecnologia | infraestrutura, oficinas, engenharia, energia, telecomunicações, transporte, estruturas mecânicas, robótica |
| Natureza | plantas raras, jardins, reservas, estufas, centros ecológicos, conservação |
| Astronomia | observatórios, torres, estações científicas, instrumentos, estruturas de observação |
| Geologia | minas, pedreiras, laboratórios, áreas de escavação, pesquisa do solo |
| História / Cultura | monumentos, templos, fortes, arquivos, bibliotecas, praças, marcos históricos |

### Combinações entre conhecimentos

**Ideia futura:** temas diferentes interagindo.

```
Astronomia + Tecnologia  → observatório mais avançado
Natureza + Tecnologia    → estufa ou centro ambiental
Geologia + Tecnologia    → mineração avançada
História + Astronomia    → monumento ligado ao céu
```

Não precisa ser "receita" explícita: pode ser um sistema que observa o perfil
acumulado e desbloqueia possibilidades conforme combinações aparecem. Duas
pessoas com quantidades parecidas de conhecimento teriam civilizações
diferentes.

### Civilização refletindo o perfil de conhecimento

**Ideia futura:** o mundo como representação visual do que foi aprendido.

Em vez de "aprendeu 30 coisas → cidade maior":

```
muita astronomia → identidade científica forte
muita natureza   → cidade integrada à paisagem
muita história   → mais monumentos e estruturas culturais
muita tecnologia → infraestrutura mais sofisticada
```

### Civilizações diferentes para perfis diferentes

**Objetivo de longo prazo:** duas pessoas que aprenderam a mesma **quantidade**
de coisas, mas coisas diferentes, deveriam terminar com mundos visualmente
diferentes.

```
Pessoa A — muito Natureza + Astronomia → mundo verde, observatórios, jardins científicos
Pessoa B — muito Tecnologia + História → infraestrutura, monumentos, arquitetura urbana
```

Pode ser uma das identidades mais fortes do produto.

### Conhecimento como memória do mundo

**Ideia conceitual, para orientar decisões futuras:** o mundo não deve parecer
uma barra de XP desenhada. Cada estágio deveria funcionar como memória do
caminho de aprendizagem — a civilização é consequência acumulada do que a pessoa
descobriu.

### Monumentos ligados a conhecimentos específicos

**Ideia futura:** algumas curiosidades especialmente marcantes gerariam
elementos únicos em vez de crescimento genérico.

```
conhecimento comum   → crescimento normal
conhecimento marcante → pode desbloquear um marco especial
```

Monumentos, estruturas científicas, jardins especiais, marcos culturais.
**Cuidado:** se toda curiosidade criar um objeto exclusivo, o mapa vira um
depósito de souvenirs intelectuais.

### Raridade de recompensas

**Ideia futura:** nem toda consequência visual com a mesma frequência —
crescimento comum, incomum, elemento raro, marco excepcional.

A raridade serve para criar surpresa e tornar certos momentos memoráveis, **não**
para transformar aprendizagem em loot box.

### Marcos da jornada

**Ideia futura:** quantidades acumuladas provocando momentos especiais.

```
10 conhecimentos → pequena transformação
25 conhecimentos → marco da vila
50 conhecimentos → nova etapa visual
```

De preferência acontecendo organicamente no mundo, sem mostrar números como
"níveis".

---

## Natureza e exploração

### Plantas raras como recompensa de Natureza

**Hoje:** o mundo já nasce cheio de árvores, arbustos, pedras, cactos, acácias e
pinheiros, vindos da seed.

**Ideia futura:** conhecimento de Natureza desbloqueia elementos **raros**, que a
geração procedural não produz: árvore rara, flor rara, planta exótica, bosque
especial, árvore monumental, planta bioluminescente (se algum tema justificar),
jardim botânico, área de conservação, estufa, reserva natural.

**Princípio:** natureza comum já existe por causa da seed; conhecimento sobre
natureza acrescenta o que é especial, não mais vegetação aleatória. Isso também
permitiria associar certas plantas raras a conhecimentos específicos.

**Não implementar durante a fase atual do sistema de crescimento.** Veja também
"`crescerVegetacao` é provisório", nas pendências.

### Mais detalhes naturais

**Ideia futura:** variedade visual sem virar ruído — pequenas flores, troncos,
pedras diferentes, variações de árvore, pequenas formações, detalhes por bioma.

**Princípio:** base limpa com detalhes esparsos. Não encher cada tile de textura.

### Eventos naturais ou descobertas no mapa

**Ideia futura:** certos conhecimentos **revelam** lugares do próprio mundo em vez
de criar construção — formação geológica rara, árvore antiga, fóssil, ponto
astronômico especial, ruína, fenômeno natural. Amplia a relação entre aprender e
olhar para o mundo.

### Descoberta e exploração

**Hoje:** o mapa está inteiro disponível para visualização.

**Ideia futura:** alguma forma leve de descoberta — locais ainda não destacados,
regiões que ganham significado conforme o conhecimento cresce, marcadores
desbloqueados, pequenos pontos de interesse.

**Cuidado:** não transformar o produto num jogo de exploração. O foco continua
sendo aprender.

---

## Vilas, caminhos e construção

### Evolução visual das vilas

**Hoje:** settlements crescem acrescentando elementos.

**Ideia futura:** crescimento acumulado também **transformando** o que já existe.

```
cabana → casa → casa maior
pequena vila → vila estruturada → cidade
```

Envolveria níveis visuais, novos sprites, densidade urbana, praças, estruturas
públicas, bairros. **Evitar virar city builder tradicional:** o conhecimento
continua sendo o motor.

### Mais orientações para casas

**Hoje:** residências têm duas orientações opostas.

**Ideia futura:** acrescentar as demais, para ruas mais naturais, casas voltadas
para caminhos diferentes e mais variedade visual. A orientação poderia sair da
entrada da casa e do caminho mais próximo.

### Caminhos V2 influenciando a orientação

**Hoje:** existe `pontoDeEntrada` e os caminhos chegam às construções.

**Ideia futura:** usar a direção real do caminho de acesso para decidir a
orientação da construção.

```
caminho chega pelo sudeste → porta/casa orientada para aquele acesso
```

Faria a vila parecer construída em função das ruas, em vez de casas e ruas
parecerem sistemas independentes.

### Estradas e infraestrutura mais evoluídas

**Ideia futura:** caminhos simples evoluindo com crescimento suficiente —
trilha, caminho de terra, estrada, avenida, ponte, praça pavimentada. A evolução
poderia depender de conhecimento de infraestrutura ou tecnologia. Sem veículos e
sem simulação de trânsito.

### Pontes

**Hoje:** água bloqueia caminhos.

**Ideia futura:** conhecimento apropriado permitindo pontes sobre rios (se um dia
existirem), trechos estreitos de água e pequenos canais. Seria uma expansão do
sistema de infraestrutura, não uma exceção arbitrária na geração de caminhos.

### Evolução de settlements

**Hoje:** o settlement tem centro, raio, quantidade de elementos e caminhos.

**Ideia futura:** bairros, especializações, regiões, centro histórico, distrito
científico, áreas verdes.

**Princípio:** só quando o crescimento atual começar a exigir essa complexidade.
Não adicionar antecipadamente.

### Mais landmarks centrais

**Hoje:** a fonte é o marco central da vila.

**Ideia futura:** outros landmarks conforme o tipo de settlement ou o perfil de
conhecimento — praça, monumento, árvore monumental, torre, biblioteca,
observatório central. A fonte não precisa desaparecer: podem existir
personalidades diferentes de vila.

---

## Terreno, apresentação e ambientação

### Elevação, falésias e aparência 2.5D

**Hoje:** mapa top-down em pixel art.

**Ideia futura:** representar melhor altitude, falésias, encostas, diferenças de
elevação, sombras e sensação de relevo — possivelmente com aparência 2.5D.

**Adiado de propósito.** Não sacrificar clareza e desempenho atuais só para criar
relevo visual.

### Som e ambientação

**Ideia futura:** sons naturais, água, vento, pequenos sons da vila, ambiente
mudando conforme a civilização cresce. Discreto e opcional. Não é prioridade.

### Ciclo de dia e noite

**Ideia futura:** variação visual entre dia, entardecer e noite — astronomia
ficaria especialmente bonita à noite.

**Avaliar com cuidado:** aumenta a complexidade artística, pode prejudicar a
leitura dos sprites e pode exigir iluminação. Não implementar sem razão de
produto clara.

### Clima

**Ideia futura:** chuva, neve, nuvens, neblina — puramente ambientais. Nada de
punição nem sistema de sobrevivência; existe só para dar vida ao mundo.

### Animações sutis no mundo

**Ideia futura:** água, árvores, fumaça de chaminé, luz de observatório, pequenos
detalhes urbanos. Mantendo a pixel art limpa e o desempenho sob controle.

---

## Aprendizagem, conteúdo e feed

### Conteúdo real e verificável

**Direção futura próxima.** Substituir as curiosidades de teste por conteúdo real
com título, preview, conteúdo, tema, tags, influências, fontes confiáveis e data
de verificação quando fizer sentido. A primeira bateria pode ter ~10
curiosidades reais, o suficiente para testar uma jornada completa.

**Princípio:** o conteúdo precisa ser interessante por si mesmo. Não escrever
fatos só porque produzem determinada construção. Primeiro vem o conhecimento; o
crescimento é consequência.

### Relação entre feed e mundo

**Ideia futura:** o feed ocasionalmente se relacionando com o estado do mundo —
curiosidades ligadas ao que existe no mapa, conteúdo ligado a estruturas
recém-criadas, um tema sugerido por alguma região.

**Cuidado:** não criar bolha temática. A pessoa deve continuar encontrando
assuntos variados.

### Relação visual entre curiosidade e consequência

**Hoje:** depois de APRENDI aparece "✓ Conhecimento adquirido." e nada mais.

**Ideia futura:** mostrar sutilmente o que aquilo provocou.

```
Conhecimento adquirido
↓
"Algo mudou no seu mundo"
```

Ou destacar brevemente o elemento novo quando a pessoa volta ao mapa. Sem
animação excessiva nem popup constante.

### Histórico de aprendizados

**Ideia futura:** uma seção para rever o que já foi aprendido — lista
cronológica, filtro por tema, busca, favoritos. Diferente do feed de descoberta.

### Favoritos / coleção pessoal

**Ideia futura:** marcar curiosidades particularmente interessantes para rever
depois. Não precisa afetar o crescimento do mundo: é uma ferramenta pessoal.

---

## Monetização

### Cosméticos como monetização

**Direção discutida:** o mundo base gratuito deve ser bonito e completo.
Monetização, se existir, principalmente cosmética: estilos de casas, de vila,
árvores alternativas, estradas, fontes, monumentos, temas arquitetônicos,
aparências de construções, estilos visuais do mundo.

**Evitar:** pagar para aprender, pagar para acelerar conhecimento, pay-to-win,
bloquear conteúdo educacional importante.

**Princípio:** conhecimento constrói o mundo; dinheiro só muda como ele parece.

### Pacotes visuais

Extensão da ideia acima: vila medieval, mediterrânea, arquitetura japonesa,
futurista, fantástico, solarpunk, desértico, nórdico. Mudam apresentação, nunca
a lógica de aprendizagem ou de crescimento.

### Mundo bonito mesmo sem cosméticos

**Regra importante:** o mundo gratuito nunca deve parecer uma versão
propositalmente feia para empurrar compra. A base precisa ter identidade, bons
sprites, variedade, sensação de progresso e acabamento.

Cosméticos oferecem preferência estética, não conserto visual.

---

## Pendências já anotadas na arquitetura

Itens que o `ARCHITECTURE.md` já registra como provisórios ou adiados. Não são
ideias novas: são dívidas conhecidas que pertencem a esta mesma categoria.

### `crescerVegetacao` é provisório

Conhecimento de Natureza ainda cai no caminho legado e faz nascer **uma árvore**,
não uma construção. Foi mantido de propósito até a natureza ser redesenhada —
jardim, pomar, horta, viveiro, estufa, reserva, centro ecológico. Liga-se
diretamente a "Plantas raras como recompensa de Natureza".

### A praça existe como espaço, não como desenho

`RAIO_PRACA` já reserva o espaço em volta da fonte e impede construções ali. Um
dia esse espaço vira praça desenhada, cruzamento e início das ruas — hoje ele
não é desenhado.

### Clareira é solução de desenho, não de mundo

As construções escondem a natureza em volta apenas no desenho; `mundo.natureza`
continua igual. Um dia a urbanização deveria mudar a natureza de verdade.

### `intensidade` ainda não faz nada

O evento de crescimento carrega `intensidade`, guardada para progressão futura.
Hoje um evento gera no máximo um elemento, independente do peso.

### `melhorarInfraestrutura` é provisório

Hoje só cria uma `casa_maior` perto do núcleo. Não faz estrada, não faz ponte e
não melhora uma casa existente. Liga-se a "Evolução visual das vilas" e
"Estradas e infraestrutura mais evoluídas".

### Arte faltando

`pedra` e `arbusto` ainda são desenhos provisórios em caracteres, e
`observatorio` ainda não tem PNG.

---

## Princípios para avaliar novas ideias

Quando uma ideia nova aparecer:

1. Ela fortalece a relação entre conhecimento e mundo?
2. Ela torna aprender mais interessante ou só adiciona sistema?
3. Ela preserva a separação entre natureza da seed e civilização do conhecimento?
4. Ela mantém o mundo compreensível visualmente?
5. Ela cria valor sem transformar o produto num city builder tradicional?
6. Ela pode esperar sem prejudicar o loop principal?
7. Ela aumenta muito a complexidade técnica para pouco benefício?
8. Ela deve ser produto, cosmético ou simplesmente permanecer uma ideia?

**Regra final:** a Caixinha de Ideias existe para permitir imaginar livremente
sem obrigar o projeto a implementar tudo que parece interessante.
