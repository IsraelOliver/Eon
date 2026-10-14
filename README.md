<div align="center">

# Éon

### Aprender uma curiosidade faz o seu mundo crescer.

Um aplicativo de aprendizagem em que conhecimento não vira apenas pontos:  
ele transforma um mundo procedural e constrói uma civilização ao longo da jornada.

**React Native · Expo · TypeScript · Skia**

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-F27927?style=flat-square)
![Versão](https://img.shields.io/badge/versão-0.1.0-C66320?style=flat-square)
![Expo](https://img.shields.io/badge/Expo-57-26252C?style=flat-square&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.86-26252C?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-26252C?style=flat-square&logo=typescript&logoColor=white)

</div>

---

## O que é o Éon?

O **Éon** parte de uma ideia simples:

> **Todo conhecimento faz o mundo crescer. O tema define a personalidade desse crescimento.**

O usuário descobre curiosidades, lê conteúdos com fontes e registra novas descobertas.  
Esse aprendizado alimenta um perfil de conhecimento e, aos poucos, modifica um mundo em pixel art.

O mapa começa essencialmente selvagem.  
A civilização surge porque algo foi aprendido.

Em vez de representar progresso apenas com níveis, pontos ou barras de experiência, o Éon transforma a jornada de aprendizagem em algo que pode ser **visto, explorado e lembrado**.

---

## Como funciona

```text
Descobrir uma curiosidade
          ↓
Ler e entender
          ↓
Registrar descoberta
          ↓
Conhecimento acumulado
          ↓
O mundo reage
          ↓
Construções, caminhos e especializações aparecem
```

A experiência gira em torno de duas áreas principais:

### Discovery

Um feed vertical de curiosidades ainda não aprendidas.

Cada descoberta pode conter:

- tema;
- título e preview;
- resumo;
- conteúdo aprofundado;
- pontos principais;
- fontes confiáveis;
- data de verificação;
- imagem e atmosfera editorial.

Ao final da leitura, o usuário toca em **Registrar descoberta**.

### Mundo

Um mapa procedural em pixel art, gerado por seed.

A natureza nasce com o mundo.  
A civilização nasce com o conhecimento.

O usuário pode acompanhar a vila crescendo, tocar nas construções, observar caminhos surgindo e perceber como aquilo que aprendeu deixou marcas no mapa.

---

## Screenshots

> Espaço preparado para inserir um ou dois prints de apresentação.  
> Sugestão: salvar as imagens em `docs/screenshots/`.

<table>
  <tr>
    <td align="center" width="50%">
      <h3>🌍 Mundo</h3>
      <br/>
      <strong>
        <p align="center">
          <img src="./Documentacao/screenshots/world.png" width="45%" alt="Mundo do Éon" />
        </p></strong>
      <br/><br/>
      <sub>Visão do mundo procedural e da civilização.</sub>
      <br/><br/>
      <code>docs/screenshots/world.png</code>
    </td>
    <td align="center" width="50%">
      <h3>✨ Discovery</h3>
      <br/>
      <strong>PRINT 02</strong>
      <br/><br/>
      <sub>Feed de descobertas ou tela de leitura.</sub>
      <br/><br/>
      <code>docs/screenshots/discovery.png</code>
    </td>
  </tr>
</table>

<!--
Quando os prints estiverem prontos, você pode substituir a tabela acima por:

<p align="center">
  <img src="./docs/screenshots/world.png" width="45%" alt="Mundo do Éon" />
  <img src="./docs/screenshots/discovery.png" width="45%" alt="Discovery do Éon" />
</p>
-->

---

## Do primeiro abrigo à vila

A progressão inicial é comum a qualquer jornada.

As primeiras descobertas formam a base da civilização:

| Descobertas | Mudança no mundo |
|---:|---|
| 1 | Surge a primeira cabana |
| 3 | Uma fogueira forma o primeiro núcleo |
| 5 | Surge uma segunda cabana |
| 8 | A vila ganha uma casa e primeiras trilhas |
| 12 | A primeira cabana evolui |
| 16 | A segunda cabana evolui |
| 20 | Uma casa evolui e a vila consolida seus caminhos |

A vila não cresce apenas adicionando coisas novas.

Construções existentes também podem **evoluir**, preservando sua identidade e a memória dos conhecimentos que contribuíram para cada transformação.

---

## Era das Especializações

Depois da fase inicial, o mundo entra na **Era das Especializações**.

A partir desse momento, o perfil temático acumulado ao longo da jornada passa a moldar ainda mais a identidade da civilização.

O primeiro ramo implementado é **Astronomia**.

```text
Conhecimento em Astronomia
          ↓
Ponto de observação
          ↓
Mais descobertas astronômicas
          ↓
Posto de observação
```

O prédio especializado evolui em vez de simplesmente se multiplicar.

Além disso, sua geografia importa: o ponto de observação procura uma área afastada do núcleo residencial, próxima de regiões montanhosas e conectada por uma trilha própria.

Essa trilha amadurece mais lentamente que os caminhos da vila, reforçando visualmente que o local não faz parte do cotidiano do assentamento.

---

## Um mundo que registra o que você aprendeu

O objetivo não é criar apenas uma cidade maior.

Duas pessoas podem aprender a mesma quantidade de curiosidades e terminar com mundos diferentes porque escolheram assuntos diferentes.

A tela **Seu conhecimento** apresenta essa identidade sem transformar o aprendizado em ranking ou XP.

Ela reúne:

- total de descobertas;
- afinidade por tema;
- estado das especializações;
- frases que relacionam conhecimento e mundo.

O mapa funciona, assim, como uma espécie de **memória visual da aprendizagem**.

---

## World Pulse

O **World Pulse** funciona como o noticiário do próprio mundo.

Quando um aprendizado gera uma mudança importante, ele pode anunciar acontecimentos como:

- uma nova construção;
- uma evolução;
- caminhos se consolidando;
- uma nova especialização;
- mudanças relevantes na vila.

Isso cria uma ponte entre Discovery e Mundo: a pessoa aprende algo, percebe que alguma coisa aconteceu e pode voltar ao mapa para encontrar a consequência.

---

## Conquistas

As conquistas registram momentos importantes da jornada.

Entre os marcos atuais estão:

- **Primeira casa!**
- **Era das Especializações**

Quando uma conquista possui relação com um local físico, o banner pode levar o usuário diretamente ao Mundo e focar o elemento correspondente.

A intenção é que conquistas celebrem a história da jornada, não apenas preencham uma lista.

---

## O diferencial

O Éon tenta evitar três soluções comuns:

- transformar conhecimento em uma barra de XP;
- dar uma recompensa aleatória sem relação com a jornada;
- fazer cada curiosidade criar diretamente um objeto temático repetido.

No lugar disso, o projeto separa três camadas:

```text
APRENDIZADO
o que a pessoa descobre
        ↓
PERFIL DE CONHECIMENTO
o que a jornada acumulou
        ↓
MUNDO
como esse conhecimento ganha forma
```

Essa separação permite que o mundo cresça de forma universal e, ao mesmo tempo, adquira personalidade conforme os temas aprendidos.

---

## Tecnologia

O projeto é desenvolvido com:

| Tecnologia | Papel |
|---|---|
| **React Native** | Aplicação mobile |
| **Expo** | Runtime e ferramentas |
| **TypeScript** | Tipagem e regras de domínio |
| **Expo Router** | Estrutura de rotas |
| **React Native Skia** | Renderização do mundo em pixel art |
| **Reanimated** | Transições e animações |
| **Gesture Handler** | Gestos e câmera |
| **AsyncStorage** | Persistência local da jornada |

O alvo principal é mobile.

---

## Arquitetura

O código é organizado por funcionalidades e mantém as regras do domínio separadas da interface.

```text
src/
├── features/
│   ├── world/          mundo procedural e civilização
│   ├── learning/       curiosidades e perfil de conhecimento
│   ├── achievements/   conquistas
│   ├── knowledge/      "Seu conhecimento"
│   ├── onboarding/     início da jornada
│   └── settings/       configurações
│
├── persistence/        save e preferências
└── shared/             contratos, tema e UI compartilhada
```

Alguns princípios técnicos do projeto:

- o `engine` não depende de React, React Native ou Skia;
- features evitam dependências diretas entre si;
- o mundo procedural é determinístico por seed;
- terreno e civilização são camadas separadas;
- elementos derivados não são persistidos sem necessidade;
- o terreno estático é separado das camadas dinâmicas para evitar trabalho de renderização desnecessário.

Para detalhes técnicos, consulte [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## Estado atual

O Éon está em fase de **desenvolvimento e playtest**.

O foco atual é validar:

- o ritmo das primeiras descobertas;
- a sensação de evolução da vila;
- a relação entre aprender e ver o mundo mudar;
- especializações temáticas;
- caminhos e geografia das construções;
- leitura das curiosidades;
- clareza da interface;
- identidade visual da jornada.

Muitos limiares e sequências ainda são provisórios e existem para calibração.

---

## Direção futura

A documentação do projeto explora possibilidades como:

- novos ramos temáticos;
- História, Natureza e Geologia ganhando especializações próprias;
- combinações entre diferentes conhecimentos;
- mais tiers de construções;
- praça e evolução do centro da vila;
- estradas e infraestrutura mais sofisticadas;
- descobertas especiais no próprio mapa;
- histórico da jornada;
- mundos antigos;
- mais variedade natural e arquitetônica;
- cosméticos sem bloquear conhecimento ou progresso.

Esses pontos representam direção e experimentação, não uma promessa de escopo fechado.

---

## Princípios do projeto

1. **Todo conhecimento contribui para a jornada.**
2. **O tema define a personalidade do crescimento.**
3. **Natureza pertence ao mundo; civilização pertence ao conhecimento.**
4. **O mapa deve funcionar como memória visual do que foi aprendido.**
5. **Aprender vem antes da recompensa.**
6. **O progresso não deve parecer apenas XP disfarçado.**
7. **O mundo precisa continuar legível mesmo ficando mais rico.**
8. **Monetização, se existir, deve ser cosmética e não bloquear conhecimento.**

---

<div align="center">

## Éon

### Conhecimento que deixa marcas.

**Em desenvolvimento.**

</div>
