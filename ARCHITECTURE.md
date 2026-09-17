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
        rules.ts             → REGRAS do mundo, faixas (nível do mar, semente) e nomes
        generate.ts          → gera o mundo (semente + nível do mar como parâmetros)
        themes.ts            → (protótipo) TEMAS: onde cada tema faz algo surgir e com que nota
        placement.ts         → (protótipo) aprender(), esquecer(), revisar() (+ semear e contagem)
        inspect.ts           → descreverTile(): bioma, altitude e umidade de um tile
        growth.ts            → gerarEventosDeCrescimento(): influências → eventos abstratos
        growthPlacement.ts   → colocarCrescimento(): evento → lugar válido + sprite
        growthElements.ts    → aplicarEventosDeCrescimento(): eventos → GrowthElement[]
      render/                → transforma o mundo em pixels (sem React)
        palette.ts           → cores do terreno, paleta dos sprites, modo pergaminho
        sprites.ts           → desenhos dos sprites em texto
        buildPixels.ts       → buffer RGBA do terreno (só depende do mundo)
        spriteBuffers.ts     → (fallback) RGBA de um sprite desenhado em caracteres
        spriteAssets.ts      → SpriteKey → PNG (único lugar dos require)
        legend.ts            → nome + cor de cada tipo de tile (para a legenda)
        renderElements.ts    → RenderElement + combinarParaDesenho(): junta legado e crescimento
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
| Mudar a distância mínima entre elementos | `world/engine/growthPlacement.ts` (`DISTANCIA_MINIMA`) |
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
- **Ocupações:** `WorldOccupant` (`{ evento, x, y }`) é a lista do que já existe;
  `DISTANCIA_MINIMA` por tipo evita sobreposição (entre dois tipos usa-se a média).
- **Regras por evento** (`REGRAS_CRESCIMENTO`): nada vai para a água.
  | Evento | Proibido | Favorece |
  |---|---|---|
  | `crescerVegetacao` | praia, montanha, neve | floresta e tundra; agrupamento moderado. Sprite pelo bioma |
  | `desenvolverPovoamento` | praia, montanha, neve | planície e savana; o 1º perto da água, os seguintes perto de outras casas |
  | `melhorarInfraestrutura` | praia, montanha, neve | proximidade do povoamento |
  | `ampliarExploracao` | neve, e montanha a mais de 4 tiles | quanto mais perto da montanha, melhor; evita o centro das vilas |
  | `desenvolverObservacao` | neve, e (longe de montanha **e** altitude < 0,66) | altitude alta, perto de montanha, longe de casas |
- **Provisório:** `melhorarInfraestrutura` ainda não faz estrada, ponte nem melhora
  uma casa existente: cria uma construção `casa_upgrade` perto do povoamento.
  `desenvolverObservacao` usa o `observatorio` do sistema antigo de sprites.
  `escavacao` e `torre` existem só para o protótipo; o novo sistema não as usa.
- **Sprites:** os PNGs em `assets/images/world/sprites/` ainda **não** são usados.
  O desenho continua por caracteres em `render/sprites.ts`, que ganhou
  `casa_upgrade` (o protótipo nunca pede essa chave, então o mapa atual não mudou).

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
  (`{ evento, x, y }`) na hora, então o evento seguinte já o enxerga. É isso que faz
  a 2ª casa nascer perto da 1ª e o `casa_upgrade` nascer perto do povoamento.
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
  `WorldGrowthKind`. Cada toque chama `aplicarCrescimentoDev(tipo)`, que aplica um
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

**Sprites:**

- `arvore`, `pinheiro`, `cacto`, `acacia`, `casa`, `casa_upgrade` e `mina` usam os
  PNGs de `assets/images/world/sprites/`, registrados em `render/spriteAssets.ts`
  e carregados uma vez por `hooks/useSpriteImages.ts` (um `useImage` por arquivo,
  em ordem fixa por causa da regra dos hooks).
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
