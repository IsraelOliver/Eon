# Arquitetura do Eon

O app é organizado por **funcionalidade** (feature). Cada funcionalidade separa
regras, desenho e interface em camadas que só dependem "para baixo".

```
app/                         → rotas do expo-router (só telas, sem lógica)
  _layout.tsx                → raiz dos gestos, barra de status e pilha sem cabeçalho
  index.tsx                  → tela: junta mapa, menus e avisos das features
src/
  features/
    world/                   → tudo sobre o mundo procedural
      engine/                → lógica pura (sem React, React Native ou Skia)
        types.ts             → tipos: World, Element, Tile, Theme, Resultado, WorldGrowthEvent…
        noise.ts             → hash, value noise, fBm, normalizar, gerador aleatório
        rules.ts             → REGRAS do mundo, ESCALA_MUNDO, faixas e nomes
        generate.ts          → gera o mundo (semente + nível do mar como parâmetros)
        nature.ts            → decoração natural do mundo selvagem (árvores, pedras…)
        themes.ts            → (protótipo) TEMAS: onde cada tema faz algo surgir e com que nota
        placement.ts         → (protótipo) aprender(), esquecer(), revisar() (+ semear e contagem)
        inspect.ts           → descreverTile(): bioma, altitude e umidade de um tile
        growth.ts            → gerarEventosDeCrescimento(): influências → eventos abstratos
        growthPlacement.ts   → colocarCrescimento(): evento → lugar válido + sprite
        growthElements.ts    → aplicarEventosDeCrescimento(): eventos → GrowthElement[] + vilas
        settlements.ts       → Settlement: núcleo lógico das vilas, zonas, anéis e fonte
        appearance.ts        → orientação (frente/trás) e variante (v1/v2) das residências
      render/                → transforma o mundo em pixels (sem React)
        palette.ts           → cores do terreno, paleta dos sprites, modo pergaminho
        sprites.ts           → desenhos dos sprites em texto
        buildPixels.ts       → buffer RGBA do terreno (só depende do mundo)
        spriteBuffers.ts     → (fallback) RGBA de um sprite desenhado em caracteres
        spriteAssets.ts      → papel + orientação + variante → PNG (único lugar dos require)
        legend.ts            → nome + cor de cada tipo de tile (para a legenda)
        renderElements.ts    → RenderElement + combinarParaDesenho(): junta as camadas
      components/            → peças visuais (React Native + Skia)
        WorldMap.tsx         → mapa em tela cheia (Skia), gestos de câmera, toque longo
        WorldSprites.tsx     → desenha os sprites (PNG ou fallback) sobre o terreno
        ActionToast.tsx      → aviso que some sozinho (posição topo/baixo e duração por props)
        LearnMenu.tsx        → botão de menu (inferior esquerdo) + janela "Aprender"
        ThemeButtons.tsx     → botões dos 4 temas com contador
        WorldDevTools.tsx    → (dev) semente, nível do mar e botões de crescimento
        BiomeLegend.tsx      → (dev) legenda das cores do mapa
      hooks/
        useWorld.ts          → estado do mundo e elementos; liga engine, render e componentes
        useMapCamera.ts      → câmera: arrastar, pinça, inércia, limites, tela→mapa
        useSpriteImages.ts   → carrega os PNGs dos sprites (useImage, ordem fixa)
    learning/                → aprendizagem: curiosidades e perfil de conhecimento
      engine/                → lógica pura (sem React, React Native ou Skia)
        types.ts             → Curiosity, CuriositySource, Tag, KnowledgeProfile,
                               LearningResult (reexporta os contratos de shared/domain)
        profile.ts           → criarPerfilVazio(), registrarAprendizado()
      data/
        fixtures.ts          → curiosidades FICTÍCIAS só para teste
    settings/                → configurações do app
      components/
        SettingsMenu.tsx     → engrenagem + janela "Configurações" (+ seção Desenvolvedor)
      hooks/
        useDevMode.ts        → modo desenvolvedor: 5 toques secretos liga/desliga
  shared/                    → o que qualquer funcionalidade pode usar
    domain/themeKey.ts       → ThemeKey: temas em comum entre learning e world (tipo puro)
    domain/influence.ts      → InfluenceKey, KnowledgeInfluence: contrato learning → world
    theme/colors.ts          → cores da interface (claro/escuro)
    ui/Button.tsx            → botão reutilizável
    ui/FloatingButton.tsx    → botão quadrado flutuante num canto (respeita a safe area)
    ui/Window.tsx            → janela base: fundo escurecido, fade, título, conteúdo, rodapé
    ui/Slider.tsx            → controle deslizante (avisa o valor ao soltar)
    ui/icons.ts              → ícones da interface (único lugar para trocar por pixel art)
```

## Fluxo de dados

```
toque no botão → componente chama função recebida por props
              → useWorld chama o engine (função pura) → novo estado
              → terreno: buildPixels gera o buffer RGBA (memoizado por mundo)
                sprites: lista de RenderElement (leve, muda a cada elemento)
              → WorldMap desenha a imagem do terreno + WorldSprites por cima
```

## Regras de código

1. **`engine/` nunca importa React, React Native ou Skia.** Assim as regras podem ser
   testadas no Node e reaproveitadas (servidor, outro app). `render/` também é puro.
   Engines usam imports relativos (sem `@/`) para compilar fora do app.
2. **Componentes não contêm regras do mundo.** Eles só mostram dados e chamam as
   funções que vêm do hook `useWorld`.
3. **Um arquivo = uma responsabilidade.** Arquivos pequenos.
4. **Não crie pastas vazias nem arquivos para funcionalidades futuras.**
5. As funções do engine **não alteram** a lista recebida: devolvem uma nova
   (`Resultado = { elementos, mensagem }`). Isso é o que o React precisa para
   perceber a mudança.
6. `app/` só tem rotas. Lógica vai para `src/features/<funcionalidade>`.
7. `shared/` não importa nada de `features/`.
8. **Uma feature não importa outra.** `settings` não conhece `world`: a tela
   (`app/index.tsx`) chama os hooks das duas e liga uma na outra por props
   (ex.: `SettingsMenu` recebe as ferramentas do mundo em `ferramentasDev`).
   Tipos que duas features precisam compartilhar vão para `shared/domain`
   (ex.: `ThemeKey` e `KnowledgeInfluence`, usados por `learning` e `world`).
   Só contratos neutros migram; o que é de uma feature (ex.: `Curiosity`) fica nela.
9. **`REGRAS` não é alterado em tempo de execução.** Valores ajustáveis (como o nível
   do mar) entram como parâmetro (`gerarMundo(seed, nivelMar)`); `REGRAS` é o padrão.

## Onde mexer para…

| Quero…                                  | Arquivo                               |
| --------------------------------------- | ------------------------------------- |
| Mudar nível do mar padrão, biomas       | `engine/rules.ts` (`REGRAS`)          |
| Mudar o tamanho do mundo                | `engine/rules.ts` (`W`, `H` — veja `ESCALA_MUNDO`) |
| Mudar a faixa de oceano na borda        | `engine/rules.ts` (`MARGEM_OCEANO`)   |
| Mudar densidade da vegetação natural    | `engine/nature.ts` (`NATUREZA_POR_BIOMA`) |
| Mudar a forma/crescimento das vilas     | `engine/settlements.ts` (`VILA`)      |
| Decidir qual vila recebe o crescimento  | `engine/settlements.ts` (`assentamentoAlvo`) |
| Mudar quando a vila ganha a fonte       | `engine/settlements.ts` (`VILA.residenciasParaFonte`) |
| Mudar para onde as casas olham          | `engine/appearance.ts` (`escolherOrientacaoCasa`) |
| Trocar/acrescentar PNG de construção    | `render/spriteAssets.ts` + `hooks/useSpriteImages.ts` |
| Mudar distância entre dois tipos específicos | `engine/growthPlacement.ts` (`DISTANCIA_ENTRE`) |
| Mudar o tamanho da clareira das construções | `render/renderElements.ts` (`RAIO_CLAREIRA`) |
| Mudar o grão/textura do terreno         | `render/palette.ts` (`TEXTURA`)       |
| Mudar o quanto o crescimento puxa para o centro | `engine/growthPlacement.ts` (`PESO_CENTRO`) |
| Mudar a faixa do slider de nível do mar | `engine/rules.ts` (`FAIXA_NIVEL_MAR`) |
| Mudar onde um tema faz algo surgir      | `engine/themes.ts`                    |
| Mudar quanto o esquecimento apaga       | `engine/placement.ts`                 |
| Mudar cores do mapa ou sprites          | `render/palette.ts`, `sprites.ts`     |
| Mudar cores/botões da interface         | `shared/theme`, `shared/ui`           |
| Trocar os ícones (gear, menu)           | `shared/ui/icons.ts`                  |
| Mudar o que aparece numa janela         | `LearnMenu.tsx`, `SettingsMenu.tsx`   |
| Mudar quantos toques ativam o modo dev  | `settings/hooks/useDevMode.ts`        |
| Adicionar uma ferramenta de dev         | componente na feature + `ferramentasDev` em `app/index.tsx` |
| Adicionar/remover um tema               | `shared/domain/themeKey.ts` (e `TEMAS` em `world/engine/themes.ts`) |
| Adicionar um tipo de influência         | `shared/domain/influence.ts` + destino em `world/engine/growth.ts` |
| Mudar o que aprender dá ao perfil       | `learning/engine/profile.ts`          |
| Mudar que evento cada influência gera   | `world/engine/growth.ts` (`EVENTO_POR_INFLUENCIA`) |
| Adicionar um tipo de evento de crescimento | `world/engine/types.ts` (`WorldGrowthKind`) + regra em `growthPlacement.ts` |
| Mudar onde um evento pode surgir        | `world/engine/growthPlacement.ts` (`REGRAS_CRESCIMENTO`) |
| Mudar a distância mínima entre elementos | `world/engine/growthPlacement.ts` (`DISTANCIA_MINIMA_SPRITE`) |
| Mudar o quanto um tipo se agrupa        | `world/engine/growthPlacement.ts` (`AGRUPAMENTO`) |
| Mudar como uma sequência de eventos é aplicada | `world/engine/growthElements.ts` |
| Mudar os botões/nomes de crescimento    | `world/engine/growth.ts` (`NOMES_DE_CRESCIMENTO`) |

## Aprendizagem (learning)

Segue as três camadas de `Documentação/mecanica_conhecimento_e_crescimento_do_mundo.md`:

```
learning                                   shared/domain          world
Curiosity ─registrarAprendizado─▶ LearningResult.influencias ─gerarEventosDeCrescimento─▶ WorldGrowthEvent[] ─(futuro)─▶ mapa
                                  (KnowledgeInfluence[])
```

- **`Curiosity`**: id, título, preview, conteúdo, tema, tags, influências, fontes
  (o tipo exige pelo menos uma) e `verificadoEm` opcional (`'AAAA-MM-DD'`).
- **`KnowledgeInfluence`**: `{ chave, peso }`. A curiosidade não diz "nasce uma
  árvore"; diz "+2 vegetação". `InfluenceKey` é uma lista fechada para que o mundo,
  no futuro, trate todas as chaves.
- **`KnowledgeProfile`**: ids aprendidos (em ordem; o total é o tamanho da lista) e
  somas por tema, por tag e por influência. É dado puro, fácil de salvar depois.
- **`registrarAprendizado(perfil, curiosidade)`** é pura e não altera o perfil
  recebido. Devolve um `LearningResult`:
  - `'aprendida'`: novo perfil + `influencias` ganhas agora (a entrada futura para
    eventos de crescimento do mundo);
  - `'repetida'`: o mesmo perfil — uma curiosidade nunca dá progresso duas vezes.
- Ainda **não existe**: tela, feed, persistência. Os dados em `data/fixtures.ts`
  são fictícios.

## Crescimento do mundo (world/engine/growth.ts)

- `gerarEventosDeCrescimento(influencias)` transforma `KnowledgeInfluence[]` em
  `WorldGrowthEvent[]` (`{ tipo, intensidade }`). Pura, determinística, não altera
  a entrada.
- Um evento diz **o que** o mundo deve tentar desenvolver, nunca **onde** nem **qual
  sprite**. Tipos: `crescerVegetacao`, `desenvolverPovoamento`,
  `melhorarInfraestrutura`, `ampliarExploracao`, `desenvolverObservacao`.
- Regras: influências que levam ao mesmo tipo somam num evento só; a ordem segue a
  primeira aparição; peso ≤ 0 ou inválido não gera evento.
- `EVENTO_POR_INFLUENCIA` é um `Record<InfluenceKey, …>` completo: criar uma
  influência nova sem destino não compila.
## Mundo selvagem e civilização

A premissa: **o mundo já nasce vivo; o conhecimento constrói uma civilização
dentro dele.** São três camadas independentes:

```
World
├── terreno      (buildPixels: uma imagem, memoizada por mundo)
├── natureza     (nature.ts: nasce com a seed, NÃO é progresso)
└── civilização  (growth*: nasce do conhecimento do jogador)
```

- **`NaturalElement` (`{ tipo, x, y }`)** não tem `ThemeKey` nem
  `WorldGrowthKind`. É ambiente, não recompensa. Fica em `World.natureza`, gerado
  dentro de `gerarMundo`, então a mesma seed dá sempre a mesma paisagem.
- **Determinismo sem `Rng`:** `nature.ts` usa `hash2(x, y, seed)`, a mesma função
  que dá textura ao terreno. Nada depende de ordem de chamada.
- **Agrupamento:** o mapa é varrido em células de `PASSO` (4 tiles); cada célula
  pode ter no máximo um elemento, com posição sorteada dentro dela (espaçamento
  mínimo sem grade visível). A chance da célula é multiplicada por um fBm de
  adensamento, o que cria bosques densos e clareiras.
- **Regras por bioma:** `NATUREZA_POR_BIOMA` reúne, num lugar só, o
  `espacamento` (lado da célula, ou seja, a distância mínima), a `densidade`, o
  `agrupamento` (expoente do ruído: quanto maior, mais mata fechada e clareira) e
  a mistura de `sprites`. Cada bioma é varrido na **sua própria grade**, por isso
  as distâncias mínimas diferem. Medido (elementos por 1000 tiles do bioma):
  floresta 29–53, tundra 8–30, planície 3–6, savana 2–4, deserto 1–3. Nada nasce
  em água, praia, montanha ou neve.
- **Sprites:** reaproveitam os PNGs de `arvore`, `pinheiro`, `acacia` e `cacto`;
  `pedra` e `arbusto` ainda são desenhos provisórios em caracteres.
- **`crescerVegetacao` é temporário.** Árvore selvagem virou parte do mundo, então
  conhecimento de natureza deve virar coisa construída (jardim, pomar, horta,
  viveiro, estufa, reserva, centro ecológico). Nada disso está implementado; o
  evento continua só como teste no modo desenvolvedor.

## Assentamentos (engine/settlements.ts)

Casas deixaram de ser elementos soltos: elas pertencem a uma **vila**.

```
natureza → primeiro povoamento → núcleo → vila → (futuro: especializações)
```

- **`Settlement`** `{ id, x, y, raio, quantidadeElementos, fonte? }` é o núcleo
  lógico — não é desenhado; organiza onde as construções nascem. `id` é `vila-1`,
  `vila-2`… na ordem de criação. `raio` (tiles) é a distância do elemento mais
  afastado até o centro, e só cresce. `fonte` guarda a posição da fonte (no máximo
  uma). Sem população nem economia.
- **Estado separado:** `useWorld` guarda `crescimento: GrowthElement[]` e
  `settlements: Settlement[]` lado a lado com a natureza (`mundo.natureza`).
  `GrowthElement.settlementId?` diz a que vila a construção pertence. Casa, casa
  maior e fonte pertencem; mina, observatório e vegetação não.
- **Papel × aparência:** o engine pensa em **papéis** (`tipo`: `casa`,
  `casa_maior`, `fonte`) e decide dois detalhes de aparência das residências:
  `orientacao` (`frente` | `tras`) e `variante` (`v1` | `v2`). O render traduz
  `casa + tras + v2` no PNG (`render/spriteAssets.ts`). O engine nunca conhece
  nome de arquivo.
- **Orientação** (`engine/appearance.ts`, `escolherOrientacaoCasa`): as casas
  diagonais mostram as duas paredes voltadas para a câmera; `frente` tem a porta
  na parede da esquerda e `tras` na da direita. A casa "olha" para a referência da
  vila: à direita dela usa `frente`, à esquerda usa `tras` (empate exato: hash).
  A referência hoje é a fonte (ou o centro, antes da fonte); **quando existirem
  ruas, basta passar o ponto do caminho mais próximo** — a função não muda.
- **Variante** (`escolherVariante`): `hash2(x, y, seed)`, determinística por seed
  e posição, independente da ordem dos eventos.
- **Primeiro povoamento:** o centro da vila nasce em planície/savana, a uma
  distância razoável da água (`PRIMEIRA_VILA.distanciaAguaIdeal`, não na beira),
  com **terreno construível em volta** (`espacoEmVolta`: amostra dois círculos de
  até 8 unidades) e com a centralidade do mundo. Isso evita o centro colado na
  costa, que deixava metade do anel no mar e esticava a vila pelo litoral.
  Depois que a vila existe, a água não pesa mais.
- **Zonas** (só regras de distância até a referência, nada persistido):
  | Zona | Unidades | Quem |
  |---|---|---|
  | núcleo | < 2,1 (`nucleoReservado`) | só a fonte; residências não entram antes dela |
  | anel das maiores | 2,1 – 2,8 (`limiteCasasPequenas`) | casas maiores (casa pequena não entra) |
  | anel das casas | a partir de 3,2 (`raioInicial`), crescendo com √quantidade | casas pequenas |
- **Crescimento em anel:** com vila, os candidatos são sorteados num **disco em
  volta da referência** (nunca menor que a vila inteira mais uma folga). A nota
  usa `notaRadial` (máxima no anel ideal, zero a uma `tolerancia` dele, negativa
  além do anel via `puxaoParaDentro`) mais `notaDeVizinhanca` (atração por
  construções da vila e penalidade para pontos isolados). Resultado: vila
  compacta, sem braços, e o vão livre mais perto do núcleo ganha quando o anel
  enche. Casas maiores usam o anel `anelMaior + crescimentoMaior × √quantidade`.
- **Fonte:** nasce automaticamente quando a vila chega a
  `VILA.residenciasParaFonte` (4) residências — com 1 a 3 casas ainda é um
  lugarejo; com 4 já há casas em volta para o centro ser lido como centro. É
  colocada o mais perto possível do centro lógico (`colocarFonte`); se não houver
  espaço, tenta de novo na próxima construção. Depois disso, ela vira a referência
  espacial da vila (`referenciaDaVila`).
- **`melhorarInfraestrutura` → `casa_maior`** (a antiga `casa_upgrade` deixou de
  existir; não há alias). Exige vila: sem vila, devolve `semLugar`.
- **Centralidade do mundo** só vale sem vila (ou seja, para escolher onde a
  primeira nasce). Com vila, quem manda é ela.
- **Várias vilas:** tudo já é `settlements: Settlement[]`. A escolha passa por
  `assentamentoAlvo()`, que hoje devolve a mais antiga. Segunda vila, porto,
  colônia ou posto avançado = mudar essa função (e o critério de criar uma nova).
- **Medido** (5 seeds, 16 povoamentos + 4 infraestruturas, comparado à V1):
  alongamento médio 1,44 → 1,26 (mais redonda), raio máximo 29 → 25 tiles; casas
  maiores mais perto da fonte que as pequenas em todas as seeds.

**Clareira (temporária, só no desenho):** `combinarParaDesenho` esconde os
`NaturalElement` a menos de `RAIO_CLAREIRA` (6 tiles) de uma construção (casa,
casa maior, fonte, mina, observatório e as do protótipo). Plantas do jogador não
abrem clareira. `mundo.natureza` não muda — continua a mesma lista da seed.

## Terra nunca toca a borda

`MARGEM_OCEANO` (em `rules.ts`, hoje 26 tiles, escalado por `ESCALA_MUNDO`)
garante oceano em volta do mapa inteiro. Não é pintura de borda: em `formarIlha`
a altitude é multiplicada por um `smoothstep` da distância até a borda e empurrada
para baixo do nível do mar, então a costa se dissolve naturalmente, sem moldura
quadrada. Medido em 5 seeds: nenhuma terra nas bordas, com 18 a 21 tiles de
oceano livre, e a massa principal continua com 24% a 47% do mapa.

## Escala do mundo (ESCALA_MUNDO)

O mundo tem `W` x `H` tiles (hoje 480x320). `ESCALA_MUNDO = W / 150` (hoje 3,2)
compara isso com o mundo do protótipo original (150x100) e mantém tudo calibrado:

- **Frequências do ruído são divididas pela escala** (`REGRAS.frequencia`). Sem
  isso, um mundo maior só ganharia *mais* ilhas do mesmo tamanho; dividindo, as
  ilhas ficam maiores em tiles. É o que dá "respiro" e faz os sprites PNG
  parecerem proporcionais ao terreno.
- **Medidas em tiles escalam junto:** largura de praia e água rasa em
  `rules.ts`; em `growthPlacement.ts` as distâncias são escritas em **unidades**
  (1 unidade = 1 tile do mundo 150x100) e convertidas por `unidades()`. Assim,
  mudar `W`/`H` não exige recalibrar as regras de colocação.
- Custo por mundo (medido no Node, 3 seeds): gerar ~75 ms, desenhar o terreno
  ~74 ms, buffer de 5,3 MB (1440x960). Só acontece quando o mundo muda (mundo novo,
  semente, nível do mar) — colocar elementos não paga nada disso.
- No zoom mínimo cada pixel de arte ocupa ~0,9 ponto de tela; como o iPhone tem 3
  pixels físicos por ponto, continua nítido.

## Colocação do crescimento (world/engine/growthPlacement.ts)

`colocarCrescimento(mundo, ocupantes, evento, rng)` responde **onde** e **com qual
sprite** o evento aparece. Devolve `'colocado'` com
`{ evento, tipo, x, y, intensidade }` ou `'semLugar'` com o motivo. Não altera
nada do que recebe.

- **Estratégia** (mesma ideia do protótipo, sem reaproveitar o código dele):
  sorteia 400 candidatos, rejeita lugares proibidos, dá nota, soma um acaso do
  `Rng` e fica com o melhor. Indexada por `WorldGrowthKind`, nunca por `ThemeKey`.
- **Âncora:** `(x, y)` é a base do sprite, um tile só. Ainda não há footprint.
- **Intensidade:** é guardada na colocação, mas ainda não muda nada. Um evento
  gera no máximo uma colocação.
- **Ocupações:** `WorldOccupant` (`{ evento, tipo?, x, y }`) é a lista do que já
  existe.
- **Espaçamento por sprite:** `DISTANCIA_MINIMA_SPRITE` diz quanto espaço cada
  sprite pede (em unidades); entre dois elementos vale a média das exigências,
  **salvo pares com regra própria** (`DISTANCIA_ENTRE`). Sprites sem entrada
  (`torre`, `escavacao`, do protótipo) caem em `DISTANCIA_MINIMA_EVENTO`. Valores
  atuais: árvores 1,4 (acácia 1,6), `casa` 2,2, `casa_maior` 2,6, `fonte` 2,
  `mina` 4, `observatorio` 5. Pares: `casa_maior ↔ casa_maior` 3,6 (respiro entre
  construções importantes) e `casa_maior ↔ casa` 2,25 (só não sobrepor, para a
  maior caber no vão entre casas). Uma distância única e rígida para a construção
  maior fazia ela ir parar fora da vila. Como o sprite da vegetação depende do
  bioma, ele é decidido **antes** da checagem de distância.
- **Agrupamento:** `AGRUPAMENTO` guarda peso e alcance, e `atracao(d, regra)` cai
  linearmente até zero no alcance. Vegetação forte (2,5 / 5) para formar
  bosquezinhos; mina e observatório não agrupam. Construções de vila se organizam
  pelas zonas e anéis de `settlements.ts` (ver "Assentamentos").
- **Centralidade habitável:** `centralidadeHabitavel(mundo, x, y)` vale 1 no centro
  da massa de terra habitável e cai a 0 a duas distâncias médias dali. O centro
  (`World.centro`) é o centroide dos tiles habitáveis, calculado uma vez na
  geração. Ela entra como **peso na nota** (`PESO_CENTRO`), nunca como proibição:
  povoamento 2,5 (começa no miolo), infraestrutura 0,8 (já acompanha o povoamento),
  vegetação 0,4, exploração e observação 0 (montanha e altitude é que mandam).
- **Regras por evento** (`REGRAS_CRESCIMENTO`): nada vai para a água.
  | Evento | Proibido | Favorece |
  |---|---|---|
  | `crescerVegetacao` | praia, montanha, neve | floresta e tundra; agrupamento moderado. Sprite pelo bioma |
  | `desenvolverPovoamento` | praia, montanha, neve; núcleo e anel das maiores | 1º: planície/savana, água a distância razoável, espaço em volta; depois: anel da vila |
  | `melhorarInfraestrutura` | praia, montanha, neve; sem vila | anel das casas maiores, perto da fonte |
  | `ampliarExploracao` | neve, e montanha a mais de 4 tiles | quanto mais perto da montanha, melhor; evita o centro das vilas |
  | `desenvolverObservacao` | neve, e (longe de montanha **e** altitude < 0,66) | altitude alta, perto de montanha, longe de casas |
- **Provisório:** `melhorarInfraestrutura` ainda não faz estrada, ponte nem melhora
  uma casa existente: cria uma `casa_maior` perto do núcleo da vila.
  `desenvolverObservacao` usa o `observatorio` do sistema antigo de sprites.
  `escavacao` e `torre` existem só para o protótipo; o novo sistema não as usa.

## Elementos de crescimento (world/engine/growthElements.ts)

- **`GrowthElement`** (`{ evento, tipo, x, y, intensidade }`) é o elemento do novo
  sistema. **Não tem `ThemeKey`**: o que ele é vem do evento, não do tema estudado.
  O `Element` legado (com `tema`) continua sendo só do protótipo. Nenhum mapeamento
  do tipo "povoamento = história" existe, justamente para não reacoplar o
  crescimento visual aos temas educacionais.
- **`criarElementoDeCrescimento(colocacao)`**: colocação → elemento, sem alterar a
  colocação.
- **`aplicarEventosDeCrescimento(mundo, elementosAtuais, eventos, rng)`**: processa
  os eventos na ordem, chama `colocarCrescimento()` para cada um e devolve
  `GrowthResult`:
  - `elementos`: a lista final (antigos + novos), nova; a recebida não muda;
  - `adicionados`: só os criados agora;
  - `semLugar`: os eventos que não acharam lugar (não interrompem os seguintes).
- **Ocupação em cadeia:** cada elemento colocado vira `WorldOccupant`
  (`{ evento, tipo, x, y }`) na hora, então o evento seguinte já o enxerga. É isso
  que faz a 2ª casa nascer perto da 1ª e a casa maior nascer junto da vila.
- **Aparência e fonte:** residências de vila saem daqui já com `orientacao` e
  `variante` (`appearance.ts`), e é aqui que a vila ganha a fonte ao atingir o
  limiar de residências.
- Um evento gera **no máximo um** elemento. `intensidade` é só metadado guardado.

## Dois sistemas no mesmo mapa (temporário)

- **No estado (`useWorld`) são duas listas separadas**, sem conversão entre elas:
  `elementos: Element[]` (protótipo, com `tema`) e `crescimento: GrowthElement[]`
  (novo, sem tema). Mundo novo, semente nova ou nível do mar novo zeram a lista de
  crescimento; `semear()` continua criando os elementos iniciais do protótipo.
- **A união acontece só no render.** `combinarParaDesenho()` devolve
  `RenderElement[]` (`tipo`, `x`, `y`, `desbotado?`, `brilha?`) ordenado por `y`,
  para quem está mais abaixo ser desenhado por cima. A ordem guardada no engine não
  muda, e `WorldSprites` só conhece esse contrato visual. Elementos de crescimento
  ainda não desbotam nem brilham.
- **Teste manual:** no modo desenvolvedor, a seção "Crescimento" tem um botão por
  crescimento da **civilização** (`CHAVES_DE_CIVILIZACAO`: Povoamento,
  Infraestrutura, Exploração, Observação). Natureza não tem botão: ela pertence à
  seed e se testa com Novo mundo / troca de semente. `crescerVegetacao` continua
  no domínio. Cada toque chama `aplicarCrescimentoDev(tipo)`, que aplica um
  evento de intensidade 1 e escreve no aviso se cresceu ou se não achou lugar.
  Os nomes dos botões vêm de `NOMES_DE_CRESCIMENTO` (`engine/growth.ts`).
- **Fronteira mantida:** `settings` continua recebendo `ferramentasDev` como
  `ReactNode`; os botões são do `world`, e `app/index.tsx` liga hook e componente.

- **Coexistência temporária:** `themes.ts` e `placement.ts` são o protótipo antigo
  (tema → sprite → lugar) e continuam ligados ao `useWorld`. O novo caminho
  (`growth.ts` → `growthPlacement.ts` → `growthElements.ts`) fecha a parte pura do
  engine, mas ainda **não** está ligado a nada: falta desenhar `GrowthElement` e
  conectar ao hook, ao learning e à tela. Quando o novo loop estiver completo, o protótipo será substituído.

## Interface sobre o mapa

- A tela é só o mapa. Por cima dele há dois `FloatingButton` (engrenagem no canto
  superior esquerdo, menu no inferior esquerdo) e dois `ActionToast`.
- **Toda janela usa `shared/ui/Window.tsx`.** Ela é uma camada da própria tela
  (`Animated.View` com `FadeIn`/`FadeOut` e `zIndex: 10`), não um `Modal`. Motivos:
  avisos precisam aparecer **por cima** da janela aberta, e gestos do
  gesture-handler (como o `Slider`) não funcionam dentro de um `Modal` sem ajustes.
  Nova janela = novo componente que passa `title`, `children` e, se quiser, `footer`.
- Cada menu (`LearnMenu`, `SettingsMenu`) guarda o próprio estado aberto/fechado,
  junto com o botão que o abre. Ações de jogo (temas, esquecer, revisar, novo mundo)
  **fecham a janela** antes de rodar. Ferramentas de dev deixam a janela aberta.
- **`ActionToast` é o único componente de aviso.** Props: `mensagem`, `id`,
  `position` (topo ou baixo) e `duration` (ms). O aviso reaparece quando o `id`
  muda (mesmo com texto igual) e não aparece se a mensagem estiver vazia.
  Usa `zIndex: 20`, acima das janelas. Tem margens laterais do tamanho do botão
  flutuante, então fica centralizado sem cobrir a engrenagem nem o menu.
  - embaixo, 3 s: última ação do jogo (`useWorld`)
  - no topo, 5 s: modo desenvolvedor ativado/desativado (`useDevMode`)
- Os ícones hoje são símbolos de texto. Para usar pixel art, coloque os PNGs em
  `assets/ui/` e troque as linhas em `shared/ui/icons.ts` por `require(...)`.

## Modo desenvolvedor

- Ativação secreta: o pequeno `✦` no rodapé da janela Configurações. 5 toques
  seguidos (no máximo 1,5 s entre um e outro; se passar, a contagem recomeça)
  ativam; mais 5 desativam. O estado fica em `useDevMode` e **não é salvo**.
- Com o modo ativo:
  - a janela Configurações mostra a seção "Desenvolvedor": semente + "Gerar com
    esta semente", slider de nível do mar (gera de novo ao soltar) e legenda;
  - toque longo no mapa mostra no aviso de baixo o bioma, a altitude e a umidade
    do tile tocado (`useMapCamera.paraMapa` desfaz o zoom/deslocamento e
    `engine/inspect.ts` monta o texto).
- "Novo mundo" e "Gerar com esta semente" mantêm o nível do mar atual; o slider
  mantém a semente atual.

## Mapa nítido e barato de atualizar

Cada tile vira `ART` x `ART` (3x3) pixels de arte; com `W`/`H` de `rules.ts` isso dá
o tamanho do buffer. Tudo é desenhado com
`sampling={{ filter: FilterMode.Nearest }}`, então cada pixel vira um quadrado sem
suavização em qualquer zoom.

**Terreno e sprites são separados de propósito:**

| Camada | Onde nasce | Quando é refeita | Tamanho |
|---|---|---|---|
| Terreno | `buildPixels.desenharTerreno` → `useMemo([mundo])` | só quando o mundo muda | alguns MB |
| Imagem do terreno | `useMemo([terreno])` no `WorldMap` | idem | uma `SkImage` |
| Sprites | PNG (`spriteAssets` + `useSpriteImages`), ou `spriteBuffers` no fallback | PNG: uma vez ao abrir o app | alguns KB no total |

Colocar um elemento **não** recria o buffer nem a imagem do terreno: só acrescenta
um nó `<Image>` no Skia, dentro do mesmo `Group` que recebe a transformação da
câmera.

**Textura do terreno** (`TEXTURA` em `palette.ts`, usada por `buildPixels`):

O bioma é lido pela **cor e pela forma da região**: a base de cada bioma é uma
cor só, e o detalhe é secundário e esparso. Nada de ruído pixel a pixel e nada
de variação por tile inteiro (uma versão anterior tinha `mancha`, que pintava o
tile todo de outro tom e criava quadrados visíveis — foi removida). Dois
mecanismos:

- **`chance` + `motivos`**: chance de o tile receber **um** motivo — um desenho
  fixo de 2 a 3 pixels: tufo de grama, folhas caídas, capim seco, pedrinha,
  rachadura (nas duas diagonais) ou onda curta. Motivos não são desenhados em
  tiles de costa, para não sujar o litoral.
- **`mistura`**: a borda do tile pode assumir a cor do bioma vizinho, sorteada em
  blocos de 2x2 pixels — a fronteira fica **dentada como forma**, não granulada.
  Só entre tiles de terra.
- **Costa direcional (top-down inclinado):** a terra tem borda de areia em todos
  os lados que encostam na água — é a linha de costa nítida. Já a faixa
  azul-escura (`LINHA_COSTA`) só aparece na **água logo abaixo da terra**
  (tile de água cujo vizinho de cima é terra), na primeira linha de pixels
  (`ESPESSURA_COSTA_INFERIOR`). Água à esquerda, à direita ou acima da terra fica
  com a cor normal. Isso sugere a "face" da ilha vista de cima e de leve pela
  frente, em vez de um contorno completo.
- Tudo vem de `hash2(x, y, seed)`: mesma seed, mesmo terreno.
- Medido: terreno desenha em ~45 ms por mundo.

**Sprites:**

- `arvore`, `pinheiro`, `cacto`, `acacia`, `mina` e `fonte` usam os PNGs de
  `assets/images/world/sprites/`, registrados em `render/spriteAssets.ts` e
  carregados uma vez por `hooks/useSpriteImages.ts` (um `useImage` por arquivo,
  em ordem fixa por causa da regra dos hooks).
- **Residências:** `imagemDoElemento` escolhe o PNG por papel + orientação +
  variante: `casa` usa as quatro casas diagonais pequenas, `casa_maior` as quatro
  diagonais maiores. A casa frontal antiga (`casa.png`) só aparece para `Element`
  do protótipo, que não tem orientação — as vilas nunca a usam. `casa_upgrade.png`
  ficou no disco sem uso: a construção maior agora é só `casa_maior`.
- `torre`, `observatorio` e `escavacao` ainda não têm PNG: continuam desenhados em
  caracteres por `spriteBuffers.ts`, com cache por `tipo | desbotado | brilho`.
  Para migrar um deles, basta acrescentar o arquivo, uma linha em `spriteAssets.ts`
  e uma em `useSpriteImages.ts`.
- **Âncora do PNG:** centro do tile na horizontal e base no pé do tile —
  `x = x * ART + ART / 2 - largura / 2`, `y = y * ART + ART - altura`. Cada PNG é
  desenhado no tamanho nativo, então sprites podem ter tamanhos diferentes.
- Desbotado vira opacidade; o brilho da revisão vira um `ColorMatrix` que clareia.
  (No fallback, esses dois efeitos continuam sendo pintados no próprio buffer.)

## Câmera (useMapCamera)

- A imagem é desenhada no tamanho 450x300 dentro de um `Group` do Skia cuja
  `transform` é `[translateX, translateY, scale]`, vinda de shared values do Reanimated.
  Ponto na tela = deslocamento + escala × ponto do mapa.
- **Gestos só mudam essas shared values.** Eles rodam na thread de UI (worklets) e
  não passam pelo React, então o buffer de pixels nunca é recriado durante o gesto.
- Zoom mínimo: altura do mapa = altura da tela. Zoom máximo: 8x o mínimo.
- Limites: em cada eixo, se o mapa é maior que a tela, o deslocamento fica entre
  `tela - mapa` e `0` (para exatamente na borda); se não, fica centralizado.
- Pinça mantém o ponto entre os dedos parado; arrastar rápido usa `withDecay`
  com `clamp` nos limites (inércia sem passar da borda).
- `paraMapa(x, y)` faz a conta inversa (tela → pixels de arte), usada pelo toque longo.
