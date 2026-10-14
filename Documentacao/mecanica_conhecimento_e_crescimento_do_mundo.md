# Mecânica de Conhecimento e Crescimento do Mundo
## Documento de Design

> **Codinome atual do projeto:** Eon  
> Este nome é provisório e não deve ser tratado como nome final do produto.

---

# Visão geral

A proposta central do projeto é transformar aprendizagem em evolução visual.

O usuário lê curiosidades e conteúdos confiáveis. Esse conhecimento não gera apenas pontos, níveis ou medalhas: ele modifica um mundo vivo, fazendo surgir construções, regiões, elementos naturais, infraestrutura e marcos especiais.

A regra principal do sistema é:

> **Todo conhecimento faz o mundo crescer. O tema define a personalidade desse crescimento, não se o crescimento acontece ou não.**

Essa regra permite que qualquer pessoa tenha um mundo completo e bonito, mesmo que escolha estudar apenas um tema.

---

# O problema que esta mecânica resolve

O usuário poderá escolher quais temas deseja acompanhar.

Por exemplo:

- Tecnologia
- História
- Natureza
- Astronomia
- Geologia
- Biologia
- Arte
- Filosofia
- Ciência
- Outros temas futuros

Isso cria uma questão importante:

> Se alguém escolher apenas Tecnologia, como o mundo cresce sem virar apenas uma coleção de fábricas e prédios?

A solução é separar **crescimento universal** de **influência temática**.

---

# Estrutura em três camadas

O sistema deve ser dividido conceitualmente em três partes independentes:

```text
APRENDIZADO
O que a pessoa lê.

        ↓

PERFIL DE CONHECIMENTO
O que o sistema entende sobre os interesses e o progresso dela.

        ↓

MUNDO
Como esse conhecimento é representado visualmente.
```

Essa separação evita uma dependência rígida entre conteúdo e objeto visual.

Uma curiosidade não precisa dizer diretamente:

```text
"leu isso → nasce uma árvore"
```

Em vez disso, ela contribui para valores e influências que o mundo interpreta.

---

# Camada 1: Aprendizado

Cada curiosidade pertence a um tema principal, mas também pode possuir subtemas e tags.

Exemplo:

```text
Título:
Como funciona uma ponte suspensa?

Tema:
Tecnologia

Subtema:
Engenharia

Tags:
infraestrutura
transporte
construção
engenharia
```

Outro exemplo:

```text
Título:
Como surgiu a fotografia?

Tema:
Tecnologia

Tags:
arte
óptica
história
invenções
```

Isso é importante porque o conhecimento real não cabe perfeitamente em categorias isoladas.

Astronomia pode se relacionar com:

- Física
- Matemática
- História
- Tecnologia

Medicina pode se relacionar com:

- Biologia
- Química
- Tecnologia
- História

Uma mesma curiosidade pode, portanto, influenciar diferentes aspectos do mundo.

---

# Camada 2: Perfil de conhecimento

Ao concluir uma curiosidade, o jogador recebe progresso invisível em diferentes categorias.

Exemplo:

```text
Curiosidade lida:
+1 conhecimento geral

Tema:
Tecnologia +1

Subtema:
Engenharia +1

Influências:
Infraestrutura +1
Desenvolvimento urbano +1
```

Esses valores não precisam necessariamente aparecer como números para o jogador.

Eles funcionam como uma camada interna responsável por decidir como o mundo evolui.

---

# Camada 3: Mundo

O mundo interpreta o perfil de conhecimento do jogador.

Em vez de cada curiosidade criar obrigatoriamente um elemento específico, o sistema analisa:

- progresso total;
- temas favoritos;
- subtemas;
- combinações;
- terreno disponível;
- biomas;
- estado atual das regiões;
- elementos já existentes.

Então decide qual evolução faz sentido.

---

# Crescimento universal

Qualquer conhecimento deve contribuir para o crescimento básico do mundo.

Isso pode incluir:

- expansão de vilas;
- novas casas;
- vegetação;
- caminhos;
- estradas;
- pontes;
- habitantes;
- pequenos objetos;
- novos espaços ocupados;
- expansão de regiões;
- melhorias visuais.

Esse crescimento acontece independentemente do tema escolhido.

Assim, alguém que seleciona apenas Tecnologia ainda terá:

- árvores;
- água;
- vilas;
- regiões naturais;
- terrenos variados;
- um mundo visualmente completo.

A escolha de tema não deve remover partes fundamentais do mundo.

---

# Influência temática

Os temas mudam a **forma** como o mundo cresce.

Duas pessoas podem ter aprendido exatamente a mesma quantidade de curiosidades, mas possuir mundos visualmente diferentes.

---

## Exemplo: Natureza

Um jogador focado em Natureza pode desenvolver:

- florestas maiores;
- árvores raras;
- jardins;
- animais;
- bosques;
- reservas naturais;
- áreas verdes;
- vegetação especial;
- regiões com aparência mais selvagem.

---

## Exemplo: História

Um jogador focado em História pode desenvolver:

- ruínas;
- monumentos;
- estradas antigas;
- fortalezas;
- templos;
- vilas com estilos históricos;
- marcos culturais;
- construções inspiradas em diferentes períodos.

---

## Exemplo: Astronomia

Um jogador focado em Astronomia pode desenvolver:

- observatórios;
- telescópios;
- torres;
- meteoritos;
- fenômenos celestes;
- decorações noturnas;
- eventos relacionados ao céu;
- construções voltadas para observação.

---

## Exemplo: Geologia

Um jogador focado em Geologia pode desenvolver:

- minas;
- cavernas;
- formações rochosas;
- cristais;
- montanhas;
- áreas vulcânicas;
- pedreiras;
- laboratórios geológicos.

---

# Tecnologia como exemplo de tema completo

Tecnologia não deve significar simplesmente “prédios futuristas”.

Ela pode ser dividida em diversos caminhos.

---

## Computação

Possíveis efeitos:

- centros de pesquisa;
- laboratórios;
- bibliotecas tecnológicas;
- centros de comunicação;
- oficinas;
- estruturas digitais.

---

## Engenharia

Possíveis efeitos:

- pontes;
- estradas;
- portos;
- aquedutos;
- grandes construções;
- infraestrutura;
- edifícios mais complexos.

---

## Energia

Possíveis efeitos:

- moinhos de vento;
- rodas d'água;
- painéis solares;
- turbinas;
- barragens;
- centrais de energia.

---

## Telecomunicações

Possíveis efeitos:

- torres;
- antenas;
- estações;
- faróis;
- centros de comunicação.

---

## Transporte

Possíveis efeitos:

- estradas melhores;
- pontes;
- trilhos;
- portos;
- barcos;
- veículos decorativos.

---

## Robótica

Possíveis efeitos:

- oficinas;
- autômatos;
- pequenos robôs;
- fábricas artesanais;
- centros especializados.

---

## História da tecnologia

O visual também pode depender da época abordada.

Exemplos:

- máquina a vapor → região industrial antiga;
- imprensa → gráfica ou biblioteca;
- telescópio → observatório antigo;
- eletrônica → laboratório;
- computação moderna → centro tecnológico.

Assim, Tecnologia pode criar um mundo muito variado sem precisar recorrer apenas à estética futurista.

---

# Sistema de efeitos intermediários

A curiosidade não deve apontar diretamente para um único objeto.

O fluxo ideal é:

```text
Curiosidade
    ↓
Tema / Subtema / Tags
    ↓
Influências
    ↓
Sistema de mundo
    ↓
Elemento ou evolução
```

Exemplo:

```text
Curiosidade:
Como funciona uma ponte suspensa?

Tema:
Tecnologia

Tags:
Engenharia
Infraestrutura
Transporte

Influências:
+ infraestrutura
+ desenvolvimento urbano

Possíveis resultados:
ponte
estrada
obra
oficina
expansão da vila
```

Isso deixa o sistema flexível e evita que milhares de curiosidades precisem ter recompensas exclusivas programadas manualmente.

---

# Marcos de progresso

O mundo não precisa criar um objeto a cada curiosidade lida.

Isso evita poluição visual e permite recompensas maiores.

Exemplo:

```text
Infraestrutura = 10
→ uma nova ponte pode surgir

Tecnologia = 25
→ uma oficina especial pode surgir

Astronomia = 30
→ um observatório pode surgir

Natureza = 50
→ uma floresta rara pode começar a crescer
```

Algumas curiosidades podem gerar pequenas mudanças imediatamente.

Outras alimentam progresso até atingir um marco.

---

# Crescimento gradual

Um mesmo elemento pode evoluir ao longo do tempo.

Exemplo de vila:

```text
pequeno acampamento
        ↓
aldeia
        ↓
vila
        ↓
cidade pequena
        ↓
cidade desenvolvida
```

O tema dominante pode alterar a aparência dessa evolução.

Uma vila tecnológica pode ganhar:

- oficinas;
- iluminação;
- pontes;
- torres;
- infraestrutura.

Uma vila histórica pode ganhar:

- muralhas;
- templos;
- monumentos;
- arquitetura antiga.

Uma vila ligada à Natureza pode ganhar:

- jardins;
- árvores;
- canais;
- vegetação integrada.

---

# Combinação de temas

A mistura de interesses pode gerar elementos especiais.

Esses elementos devem funcionar como descobertas naturais do sistema.

---

## Natureza + Tecnologia

Possíveis elementos:

- estação meteorológica;
- estufa;
- centro ecológico;
- energia eólica;
- laboratório ambiental;
- sistemas de irrigação.

---

## História + Astronomia

Possíveis elementos:

- observatório antigo;
- calendário monumental;
- ruína astronômica;
- templo voltado para observação do céu.

---

## Geologia + Tecnologia

Possíveis elementos:

- mina;
- pedreira;
- laboratório geológico;
- estação de pesquisa;
- sistema de extração.

---

## Natureza + História

Possíveis elementos:

- jardim histórico;
- templo tomado pela vegetação;
- árvore monumental;
- parque histórico;
- ruínas naturais.

---

# Combinações não devem ser obrigatórias

O sistema não deve punir quem escolhe apenas um tema.

Um jogador dedicado exclusivamente a Tecnologia deve possuir uma progressão completa e satisfatória.

Combinações servem para:

- aumentar variedade;
- criar descobertas especiais;
- tornar mundos mistos mais únicos.

Elas não devem bloquear o progresso principal.

---

# Escolha de temas pelo jogador

A escolha de temas controla principalmente:

> **o que aparece no feed de aprendizagem.**

Ela não deve controlar rigidamente:

> **o que pode existir no mundo.**

Exemplo:

Se o usuário desativar Natureza, o mundo não deve deixar de ter árvores.

Se o usuário estudar apenas Astronomia, ainda deve haver vilas, rios, estradas e vegetação.

A seleção de temas muda a identidade e a frequência de certos elementos, não a existência dos componentes básicos do mundo.

---

# Mundo como retrato dos interesses

Com o tempo, deve ser possível observar o mapa de uma pessoa e perceber seus interesses.

Exemplo:

### Jogador A
Maior interesse: Natureza

Mundo:

- grandes florestas;
- muita fauna;
- jardins;
- áreas naturais;
- vilas menores e integradas ao ambiente.

### Jogador B
Maior interesse: Tecnologia

Mundo:

- infraestrutura desenvolvida;
- estradas;
- pontes;
- oficinas;
- centros de pesquisa;
- cidades mais estruturadas.

### Jogador C
Maior interesse: História

Mundo:

- ruínas;
- monumentos;
- fortalezas;
- estilos arquitetônicos diferentes;
- regiões com identidade histórica.

Todos continuam tendo mundos completos.

O que muda é sua personalidade.

---

# Relação com cosméticos

Esse sistema combina diretamente com a monetização baseada em personalização.

Um elemento deve ser desbloqueado normalmente por progresso.

A monetização pode oferecer estilos visuais alternativos.

Exemplo:

O jogador desbloqueia uma vila tecnológica gratuitamente.

Cosméticos opcionais podem mudar seu estilo para:

- retrofuturista;
- industrial;
- solarpunk;
- futurista;
- steampunk;
- laboratório clássico.

A função da vila permanece exatamente a mesma.

---

# Regra para monetização

> **Conteúdo pago muda aparência, não acesso ao conhecimento ou capacidade de progresso.**

O jogador gratuito deve conseguir:

- aprender;
- expandir;
- construir;
- desbloquear regiões;
- criar um mundo bonito;
- acessar o núcleo completo da experiência.

Cosméticos servem para criar identidade e variedade visual.

---

# Benefícios desse sistema

Essa abordagem permite:

- suportar jogadores com interesses muito diferentes;
- adicionar novos temas sem reescrever o mundo inteiro;
- criar milhares de curiosidades sem precisar programar um objeto exclusivo para cada uma;
- produzir mundos visualmente únicos;
- misturar temas naturalmente;
- expandir o jogo no futuro;
- adicionar novos biomas e estilos;
- integrar cosméticos sem prejudicar a experiência;
- manter o aprendizado como centro do produto.

---

# Princípios de design

1. **Todo conhecimento gera progresso.**
2. **Nenhum tema deve ser necessário para ter um mundo completo.**
3. **O tema altera a personalidade do crescimento.**
4. **O mundo deve refletir os interesses do jogador.**
5. **Curiosidades influenciam sistemas, não apenas objetos individuais.**
6. **Misturar temas cria possibilidades extras, não obrigações.**
7. **O mapa deve permanecer visualmente coerente.**
8. **O progresso deve produzir mudanças pequenas e grandes.**
9. **O mundo funciona como memória visual da aprendizagem.**
10. **Monetização cosmética nunca substitui progresso real.**

---

# Resumo da mecânica

```text
Usuário lê uma curiosidade
        ↓
Recebe progresso de conhecimento
        ↓
Tema, subtema e tags geram influências
        ↓
O sistema analisa o estado atual do mundo
        ↓
Decide como aquele progresso será representado
        ↓
O mundo cresce
        ↓
Os interesses do jogador moldam a personalidade do mapa
```

O resultado esperado é um mundo que não representa apenas “quantas curiosidades” foram lidas.

Ele representa **o que aquela pessoa decidiu aprender**.
