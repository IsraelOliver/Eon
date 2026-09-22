# Arquitetura do Eon

O app é organizado por **funcionalidade** (feature). Cada funcionalidade separa
regras, desenho e interface em camadas que só dependem "para baixo".

```
app/                         → rotas do expo-router (só telas, sem lógica)
  _layout.tsx                → raiz dos gestos, barra de status e pilha sem cabeçalho
  index.tsx                  → composição: mundo como tela-base + feed por cima (overlay)
src/
  features/
    world/                   → tudo sobre o mundo procedural
      engine/                → lógica pura (sem React, React Native ou Skia)
        types.ts             → tipos: World, Element, Tile, Theme, Resultado, WorldGrowthEvent…
        noise.ts             → hash, value noise, fBm, normalizar, gerador aleatório
        rules.ts             → REGRAS do mundo, ESCALA_MUNDO, faixas e nomes
        generate.ts          → gera o mundo (semente + nível do mar como parâmetros)
        nature.ts            → decoração natural do mundo selvagem (árvores, pedras…)
        inspect.ts           → descreverTile(): bioma, altitude e umidade de um tile
        growth.ts            → gerarEventosDeCrescimento(): influências → eventos abstratos
        growthPlacement.ts   → colocarCrescimento(): evento → lugar válido + sprite
        growthElements.ts    → aplicarEventosDeCrescimento(): eventos → GrowthElement[] + vilas
        settlements.ts       → Settlement: núcleo lógico das vilas, zonas, anéis e fonte
        appearance.ts        → orientação (frente/trás) e variante (v1/v2) das residências
        footprint.ts         → espaço de cada construção no chão (retângulo ancorado na base)
        buildable.ts         → terreno construível: solo por tile, margem da água, validação do footprint
        paths.ts             → rede de caminhos: praça, rota (Dijkstra), largura e bordas
      render/                → transforma o mundo em pixels (sem React)
        palette.ts           → cores do terreno, paleta dos sprites, modo pergaminho
        sprites.ts           → desenhos dos sprites em texto
        buildPixels.ts       → buffer RGBA do terreno (só depende do mundo)
        spriteBuffers.ts     → (fallback) RGBA de um sprite desenhado em caracteres
        spriteAssets.ts      → papel + orientação + variante → PNG (único lugar dos require)
        legend.ts            → nome + cor de cada tipo de tile (para a legenda)
        pathPixels.ts        → camada RGBA dos caminhos (buffer próprio, só da caixa da rede)
        renderElements.ts    → RenderElement + combinarParaDesenho(): junta as camadas
      components/            → peças visuais (React Native + Skia)
        WorldMap.tsx         → mapa em tela cheia (Skia), gestos de câmera, toque longo
        WorldSprites.tsx     → desenha os sprites (PNG ou fallback) sobre o terreno
        ActionToast.tsx      → aviso que some sozinho (posição topo/baixo e duração por props)
        WorldDevTools.tsx    → (dev) semente, nível do mar e botões de crescimento
        BiomeLegend.tsx      → (dev) legenda das cores do mapa
      hooks/
        useWorld.ts          → estado do mundo; aplicarEventos() é a porta do crescimento
        useMapCamera.ts      → câmera: arrastar, pinça, inércia, limites, tela→mapa
        useSpriteImages.ts   → carrega os PNGs dos sprites (useImage, ordem fixa)
    learning/                → aprendizagem: curiosidades e perfil de conhecimento
      engine/                → lógica pura (sem React, React Native ou Skia)
        types.ts             → Curiosity, CuriositySource, Tag, KnowledgeProfile,
                               LearningResult (reexporta os contratos de shared/domain)
        profile.ts           → criarPerfilVazio(), registrarAprendizado()
        themes.ts            → NOMES_DE_TEMA: nome de cada tema na interface
      data/
        curiosities.ts       → CATÁLOGO: a única fonte de conteúdo (você edita aqui)
        validarCuriosidades.ts → confere o catálogo (ids repetidos, campo vazio)
      components/            → interface do Aprender (React Native, sem Skia)
        LearningOverlay.tsx  → o aparelho: cresce do botão e abre o feed sobre o mapa
        LearningScreen.tsx   → a tela: feed + leitura; avisa onAprendido ao registrar
        CuriosityCard.tsx    → card do feed: pôster vertical com capa, degradê e título
        CuriosityReader.tsx  → leitura em tela cheia: conteúdo, fontes, botão APRENDI
      presentation/          → decisões de aparência que o engine não pode conhecer
        coverTheme.ts        → capa provisória por tema (cor + símbolo)
      hooks/
        useLearning.ts       → perfil da sessão; delega a decisão ao engine
    onboarding/              → boas-vindas de uma jornada nova
      regra.ts               → quando a apresentação aparece (pura)
      components/JourneyIntro.tsx → o cartão por cima do mundo
    settings/                → configurações do app
      components/
        SettingsMenu.tsx     → janela "Configurações" (+ seção Desenvolvedor)
      hooks/
        useDevMode.ts        → modo desenvolvedor: 5 toques secretos liga/desliga
  persistence/               → o save (camada de composição, como app/)
    save.ts                  → SaveV2 (+ migração da V1), conferência e decidirSave
    storage.ts               → AsyncStorage: ler, gravar em fila, apagar
  shared/                    → o que qualquer funcionalidade pode usar
    domain/themeKey.ts       → ThemeKey: temas em comum entre learning e world (tipo puro)
    domain/influence.ts      → InfluenceKey, KnowledgeInfluence: contrato learning → world
    theme/colors.ts          → cores da interface (claro/escuro)
    ui/Button.tsx            → botão reutilizável
    ui/ActionBar.tsx         → barra de ações: cápsula central embaixo (só ícones)
    ui/Window.tsx            → janela base: fundo escurecido, fade, título, conteúdo, rodapé
    ui/Slider.tsx            → controle deslizante (avisa o valor ao soltar)
    ui/Gradient.tsx          → degradê linear vertical (único lugar que sabe desenhar um)
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
7. `shared/` não importa nada de `features/`. Quem precisa enxergar duas features
   é camada de composição: hoje `app/` e `src/persistence/` (o save). As features
   não importam `persistence/`: o tipo do que o mundo guarda (`WorldSnapshot`)
   mora no próprio `world/engine/types.ts`.
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
| Mudar o espaço que uma construção ocupa | `engine/footprint.ts` (`FOOTPRINT`, `FOLGA_ENTRE`) |
| Mudar o tamanho da praça da fonte      | `engine/settlements.ts` (`RAIO_PRACA`) |
| Mudar onde se pode construir / margem da água | `engine/buildable.ts` (`SOLO`, `MARGEM_AGUA`) |
| Mudar largura/custo/forma dos caminhos  | `engine/paths.ts` (`LARGURA_CAMINHO`, `CUSTO_TERRENO`) |
| Mudar a cor/borda da terra batida       | `render/palette.ts` (`CAMINHO`) + `render/pathPixels.ts` |
| Mudar o tamanho da clareira das construções | `render/renderElements.ts` (`RAIO_CLAREIRA`) |
| Mudar o grão/textura do terreno         | `render/palette.ts` (`TEXTURA`)       |
| Mudar o quanto o crescimento puxa para o centro | `engine/growthPlacement.ts` (`PESO_CENTRO`) |
| Mudar a faixa do slider de nível do mar | `engine/rules.ts` (`FAIXA_NIVEL_MAR`) |
| Mudar cores do mapa ou sprites          | `render/palette.ts`, `sprites.ts`     |
| Mudar cores/botões da interface         | `shared/theme`, `shared/ui`           |
| Trocar os ícones (gear, menu)           | `shared/ui/icons.ts`                  |
| Mudar o que aparece numa janela         | `SettingsMenu.tsx`                    |
| Mudar quantos toques ativam o modo dev  | `settings/hooks/useDevMode.ts`        |
| Adicionar uma ferramenta de dev         | componente na feature + `ferramentasDev` em `app/index.tsx` |
| Adicionar/remover um tema               | `shared/domain/themeKey.ts` + `learning/engine/themes.ts` |
| Adicionar um tipo de influência         | `shared/domain/influence.ts` + destino em `world/engine/growth.ts` |
| Mudar o que aprender dá ao perfil       | `learning/engine/profile.ts`          |
| Mudar o formato do save                 | `persistence/save.ts` (`SaveV2`, `VERSAO_DO_SAVE`, `migrarParaAtual`) |
| Mexer na gravação/chave do save         | `persistence/storage.ts` (`@eon/save`) |
| Mexer na aleatoriedade do crescimento   | `world/engine/growthElements.ts` (`rngDeCrescimento`) |
| Mexer na ponte aprender → mundo         | `app/index.tsx` (`aoAprender`)        |
| Mudar como o mundo aplica crescimento   | `world/hooks/useWorld.ts` (`aplicarEventos`) |
| Mudar os botões da barra de baixo       | `app/index.tsx` (`acoes`) + `shared/ui/icons.ts` |
| Mudar o formato/tamanho da barra        | `shared/ui/ActionBar.tsx`             |
| Mudar a animação de abrir o feed        | `learning/components/LearningOverlay.tsx` |
| Acrescentar/editar uma curiosidade      | `learning/data/curiosities.ts` (só isso) |
| Mudar o card do feed                    | `learning/components/CuriosityCard.tsx` |
| Colocar a capa de uma curiosidade       | `assets/curiosities/` + campo `capa` no catálogo |
| Mudar a capa provisória de um tema      | `learning/presentation/coverTheme.ts` |
| Mudar a força do degradê do card        | `learning/components/CuriosityCard.tsx` (`DEGRADE`) |
| Mudar o formato do pôster               | `learning/components/CuriosityCard.tsx` (`PROPORCAO`, `RAIO`) |
| Mudar a tela de leitura / o botão APRENDI | `learning/components/CuriosityReader.tsx` |
| Mudar o nome de um tema na interface    | `learning/engine/themes.ts` (`NOMES_DE_TEMA`) |
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
- As curiosidades são **conteúdo declarativo**: vivem em `data/curiosities.ts` e
  acrescentar uma não exige mexer em engine, componente nem persistência. As três
  de hoje ainda são fictícias, só para o app rodar.

### A tela Aprender

```
useLearning (perfil da sessão)
   └─ LearningScreen ── feed: CuriosityCard[] (pôster vertical: capa + título)
                     └─ leitura: CuriosityReader (tela cheia, por cima do feed)
```

- **`useLearning`** guarda o `KnowledgeProfile` da sessão em memória. Ele não
  decide nada: chama `registrarAprendizado` e guarda o perfil devolvido. Em
  `'repetida'` o perfil é o mesmo objeto, então nada muda na tela.
- **`LearningScreen`** é o conteúdo do aparelho. Qual curiosidade está aberta é
  estado dele; ele avisa quem o contém por `onLeitura(lendo)`, e o
  `LearningOverlay` usa isso para esconder o ✕ enquanto a leitura — que tem o
  próprio "voltar" — está aberta.
- **`CuriosityReader`** mostra tema, título, conteúdo, **fontes** (com
  `Linking.openURL` quando têm `url`) e o botão **APRENDI**. Depois do toque
  aparece "✓ Conhecimento adquirido." — o texto **não fala do mundo**, porque a
  ligação com o mapa ainda não existe. A prop opcional `onVerMundo` é o gancho
  para essa etapa: quando a composição passar essa ação, aparece "Ver no mundo".
  Se a curiosidade já foi aprendida, o botão fica **APRENDIDA** e desabilitado.
- Os nomes de tema vêm de `learning/engine/themes.ts`, não dos `TEMAS` do mundo:
  `learning` **não importa** `world` (e vice-versa). O que os dois compartilham
  mora em `shared/domain`.

### O card do feed (CuriosityCard)

Cada curiosidade é uma **capa**, não uma linha de lista. A hierarquia é
imagem → título → CTA → tema → selo de aprendida.

```
┌──────────────┐  aspectRatio 3/4, raio 24, overflow: hidden
│ TEMA   ✓ Apr │  ← linha de cima, absoluta
│              │
│  imagem      │  ← expo-image, contentFit: 'cover', em fill absoluto
│ ░░░░░░░░░░░░ │  ← Gradient: transparente até 38%, quase preto na base
│ Título grande│
│ preview (2)  │
│ ( ler… )     │
└──────────────┘
```

- **A capa vive no próprio bloco da curiosidade**, no campo `capa`. O tipo puro
  `Curiosity` continua sem imagem: quem carrega a capa é `CuriosityEntry`, do
  catálogo — o engine nunca vê imagem, e mesmo assim se cadastra tudo num lugar
  só. Os `require` são estáticos (o Metro precisa vê-los) e precisam apontar para
  arquivos existentes. O Metro empacota `jpg`/`png`/`webp`/`svg`, mas **não
  `.avif`** — converta antes.
- Sem capa registrada, o card usa a **capa do tema** (`presentation/coverTheme.ts`):
  cor + símbolo grande e apagado. O layout é o mesmo, então colocar a imagem
  depois não muda nada de posição. Os arquivos vão em `assets/curiosities/`
  (veja o README de lá).
- O texto do card é **branco nos dois modos** (claro e escuro), porque vive sempre
  sobre imagem escurecida — por isso não sai de `shared/theme/colors.ts`. O título
  ainda leva uma sombra suave, para o caso de uma capa muito clara.
- O degradê vem de **`shared/ui/Gradient.tsx`**, que usa
  `experimental_backgroundImage` do React Native 0.86 em vez de uma biblioteca
  nova. Trocar por `expo-linear-gradient` um dia é mexer num arquivo só.

## O mundo e o aparelho (app/index.tsx)

Não há mais abas irmãs. **O mundo é a tela-base**, sempre montada e sempre no
layout; o feed abre **por cima** dele, como um aparelho que o jogador tira do
bolso.

```
AppScreen
├── camada do mundo   (fluxo normal: WorldMap + engrenagem + menu + celular + avisos)
└── LearningOverlay   (absoluteFill por cima; fechado, é invisível e intocável)
```

- **O `WorldMap` nunca desmonta e nunca sai do layout.** Nada de `display: 'none'`
  nele: era isso que fazia a superfície do Skia voltar vazia e o mapa aparecer
  branco até um gesto na câmera. Por isso também `useWorld()` vive na composição:
  abrir e fechar o feed não refaz o terreno, não recria as `SkImage`, não
  recalcula os caminhos, não recarrega sprites e não reinicia a câmera.
- **A barra de ações** (`shared/ui/ActionBar.tsx`) é uma cápsula flutuante
  centralizada na borda de baixo, com dois ícones: ◉ mundo e ▯ celular. **Ela é a
  única navegação entre as duas telas.** Vale para o app inteiro: é renderizada por último em
  `app/index.tsx`, acima do mundo, do aparelho e das janelas, e nunca some. Por
  isso o feed e a leitura reservam `ESPACO_ACTION_BAR` no rodapé.
  O celular fica no meio de propósito — é de lá que o feed cresce, e
  `centroDoItem()` devolve esse ponto para a animação (a barra é quem sabe o
  próprio layout). O item ativo (`ativo`) mostra onde o jogador está: mundo ou
  aparelho. Os ícones são provisórios (`shared/ui/icons.ts`).
- **As configurações só abrem de dentro do aparelho**, pelo ⚙︎ no canto superior
  direito do painel (`onConfiguracoes`). O mapa não tem botão para elas. O
  `SettingsMenu` é renderizado depois do `LearningOverlay` para a janela ficar
  por cima do painel.
- **As janelas são controladas pela composição.** `SettingsMenu` e `LearnMenu`
  não carregam mais o próprio botão: recebem `aberto`/`onFechar`, e `app/index.tsx`
  guarda qual painel está aberto (um de cada vez).
- **`LearningOverlay`** é o aparelho. Fica **sempre montado** — fechado, ele só
  some (opacidade 0 e `pointerEvents: 'none'`), o que preserva o que já foi
  aprendido e evita medir o feed de novo a cada abertura.
- **A animação** é um shared value só, de 0 a 1 (`withTiming`, `Easing.out`).
  Dele saem, por interpolação: `scaleX`/`scaleY` partindo do tamanho exato do
  botão, `borderRadius` de 64 a 30 e a opacidade do conteúdo entrando entre 35 %
  e 85 % do percurso — assim não se vê texto esticado. O ponto de crescimento é
  um `transformOrigin` calculado a partir da posição real do botão. **Só
  transform e opacidade: nenhum layout durante o movimento.**
- **Alcance e acessibilidade andam juntos.** Com o feed aberto, a camada do mundo
  recebe `pointerEvents="none"` + `accessibilityElementsHidden` +
  `importantForAccessibility="no-hide-descendants"`; fechado, o overlay recebe o
  mesmo tratamento. O que não está à vista não recebe dedo nem leitor de tela.
- **Ao terminar de fechar, o mapa precisa reenviar a cena.** `LearningOverlay`
  avisa por `onFechado`, a composição incrementa `despertarMapa`, e o `WorldMap`
  chama `repintar()`. Veja "Por que o mapa voltava em branco" para o porquê.
- **`onFechado` significa exatamente uma coisa:** houve uma transição real de
  aberto para fechado e a animação dela chegou ao fim. Duas defesas garantem isso,
  e as duas importam:
  1. o efeito guarda a direção anterior num `ref` e **só anima em transição
     real** — re-rodar por troca de identidade de prop não faz nada. Sem essa
     saída, um `withTiming(0)` com o progresso já em 0 termina com
     `finished === true` e passa por fechamento, o que realimentaria
     render → efeito → repaint;
  2. a callback compara o **destino daquela animação** (`destino === 0`), não o
     `aberto` do render. Inverter no meio substitui a animação, e a substituída
     chega com `finished === false`.
- Por isso as ações que a composição passa ao aparelho (`onFechar`, `onFechado`,
  `onConfiguracoes`) e a `origem` são **memoizadas com identidade fixa**: a
  corretude não pode depender do React Compiler, que pode desistir em silêncio.

## O que é salvo e o que é recalculado

O jogo é gravado no aparelho com **AsyncStorage**, na chave `@eon/save`, no
formato `SaveV2` (`src/persistence/save.ts`). Saves `SaveV1` antigos continuam
sendo lidos e migrados.

```
abrir o app
  → carregarSave()             (AsyncStorage)
  → migrarParaAtual(): confere a forma e converte formato antigo
  → <Jogo save={…}>            só agora nascem useWorld e useLearning
  → gerarMundo(seed, nivelMar) reconstrói terreno e natureza
  → app renderiza já com o estado certo
```

**A leitura vem antes de qualquer mundo.** `app/index.tsx` é uma casca que
mostra só o fundo enquanto lê; sem isso o app criaria um mundo sorteado,
desenharia o terreno e depois o jogaria fora — com piscada e trabalho perdido.
Como o autosave vive dentro de `Jogo`, **ele não tem como rodar antes da
hidratação**.

**Autosave:** um `useMemo` monta o `SaveV2` a partir de
`world.estadoPersistivel`, `aprendizado.perfil` e `onboardingConcluida`, e um efeito grava quando essa
referência muda. Ou seja, grava quando muda semente, nível do mar, crescimento,
vilas, `growthSequence` ou perfil — e **não** grava por abrir o aparelho, animar,
dar zoom, mostrar aviso ou alternar telas.

**O último save seguro.** `decidirSave` responde duas coisas de uma vez: qual é
o último estado **coerente** e se dá para gravar agora. Enquanto
`world.gerando`, a resposta é "o anterior" e "não" — então o snapshot seguro não
avança durante uma recriação. Ao ir para segundo plano (`AppState`), o app grava
**esse snapshot, nunca o estado atual**, pela mesma função e a mesma fila do
autosave. Se o app sair de cena no meio de um reset, o disco fica com a jornada
anterior inteira.

**Escritas em fila:** `salvarSave` encadeia promessas, então duas gravações
seguidas terminam na ordem pedida e a mais nova nunca perde para a mais velha.
Gravar não bloqueia a interface.

**Quando algo dá errado:** sem save, JSON inválido, estrutura incompleta ou
versão desconhecida → `console.warn` e o app começa um estado novo, sem quebrar.
Erro de gravação → `console.warn` e o jogo segue com o que está na memória.
Quando existir uma V2, é em `carregarSave` que entram as migrações.

| Persistente (entra no save) | Derivado (volta sozinho) |
| --- | --- |
| `seed`, `nivelMar` | terreno, biomas, altitude, umidade, `distAgua`, `distMont` |
| `crescimento: GrowthElement[]` | `mundo.natureza` (sai da seed) |
| `settlements: Settlement[]` (caminhos inclusive) | buffers RGBA, `SkImage`, camada dos caminhos |
| `growthSequence` | `RenderElement[]`, clareiras |
| `perfil: KnowledgeProfile` | câmera, zoom, avisos, telas abertas, modo dev |

O mundo inteiro volta de `gerarMundo(seed, nivelMar)`, que é determinístico —
por isso nada do terreno precisa ser gravado. Caminhos não aparecem soltos no
save: `Settlement.caminhos` já os guarda.

### Crescimento restaurável (world.seed + growthSequence)

O gerador de uma execução de crescimento **não vem mais do relógio**:

```
rngDeCrescimento(mundo.seed, growthSequence)  →  mulberry32(combinarSementes(…))
```

- `growthSequence` é **quantas execuções de crescimento aquele mundo já teve**.
  Uma curiosidade com várias influências gera vários eventos numa execução só:
  todos compartilham o mesmo gerador, e o contador sobe **uma vez** no fim.
  Chamada sem eventos não conta.
- O contador é lido e escrito **dentro** do `setEstado((s) => …)` de
  `aplicarEventos`, então dois aprendizados seguidos pegam 0→1 e 1→2, sem se
  atropelar.
- Mundo novo (semente sorteada, semente manual ou nível do mar) zera para 0,
  junto com `crescimento` e `settlements`.
- O modo dev usa a mesma `aplicarEventos`, então também avança a sequência —
  ele está mudando o mundo de verdade.
- Depois de um futuro restart, restaurar `seed` + `growthSequence` faz a próxima
  execução sair **idêntica** à que teria saído sem fechar o app. É o que o teste
  do caso C prova.
- O único sorteio que sobrou no mundo é `Math.random()` em `sementeAleatoria()`,
  e só na **criação**: a semente sorteada é guardada e tudo mais sai dela.

## A apresentação da jornada

Uma jornada nova é apresentada uma vez, por cima do mundo já carregado — o mapa
fica visível atrás, que é o que dá sentido à frase "Este é o seu mundo.".

```
aprendidas === 0  &&  !onboardingConcluida  &&  !world.gerando  →  aparece
```

- **Depois de dispensada, não volta.** `onboardingConcluida` é gravado no save,
  então fechar o app sem aprender nada não a traz de volta.
- **Pertence à jornada, não à semente.** Trocar de mundo antes da primeira
  descoberta não a faz reaparecer; **recomeçar a jornada**, sim — junto com o
  perfil vazio e o mundo novo.
- **Quem já aprendeu nunca a vê**, mesmo que o save diga o contrário: se existe
  conhecimento, a jornada já começou.
- **Não aparece durante uma recriação** (`world.gerando`): primeiro o mundo novo
  fica pronto, depois a pessoa é apresentada a ele.
- Enquanto está aberta é a **única coisa que aceita toque** — mapa, barra,
  aparelho e janelas ficam fora de alcance, e `accessibilityViewIsModal` tira o
  resto da árvore de acessibilidade. "Começar jornada" só fecha a apresentação:
  não abre o feed.
- A regra mora em `features/onboarding/regra.ts` (pura), e a composição só
  pergunta. O componente é `features/onboarding/components/JourneyIntro.tsx`.

### SaveV2 e a migração

Guardar isso exigiu subir o formato, porque com o perfil vazio "já vi a
apresentação" e "nunca vi" são estados idênticos — não dá para derivar. Uma
chave separada no armazenamento também não serviria: ficaria fora da fila de
escrita segura, criando uma segunda fonte de verdade que poderia divergir da
jornada durante um reset.

```
SaveV1 → { version: 1, world, learning }
SaveV2 → { version: 2, world, learning, onboardingConcluida }
```

`carregarSave` passa tudo por `migrarParaAtual`: V2 vem direto, V1 é convertida
por `migrarV1`, e qualquer outra versão vira "sem save". A regra da migração é
`onboardingConcluida = perfil.aprendidas.length > 0` — quem já aprendeu alguma
coisa já começou a jornada e não deve ver a apresentação; save antigo com perfil
vazio volta a vê-la, que é o certo para quem ainda não começou. **Saves antigos
não são apagados**: são lidos e convertidos.

## A jornada consolida o mundo

Enquanto a pessoa não aprendeu nada, o mundo é só um cenário que ela pode
trocar à vontade. A **primeira curiosidade aprendida** transforma aquele mundo
na jornada dela.

```
aprendidas.length === 0  → Configurações mostram "Novo mundo"
aprendidas.length >= 1   → jornada consolidada: só "Recomeçar jornada"
```

- **A fonte de verdade é o conhecimento**, não a quantidade de casas, a
  existência de vila nem a `growthSequence`. Assim a regra sobrevive a qualquer
  mudança futura no que uma curiosidade faz crescer.
- **`mundoConsolidado` não é gravado**: é derivado de
  `perfil.aprendidas.length > 0`, calculado na composição. O save continua na
  versão 1, sem campo novo.
- **A regra não é só visual.** Depois de consolidar, `app/index.tsx` deixa de
  passar `onNovoMundo` ao `SettingsMenu`: a ação não existe, não é só um botão
  escondido.
- **Recomeçar jornada** apaga junto: conhecimento, perfil, civilização, vilas,
  caminhos, `growthSequence` e o mundo. Nasce outra semente sorteada, mundo
  selvagem, perfil vazio, sequência em 0. Pede confirmação na própria janela,
  com o botão vermelho (`Button variant="destructive"`), numa "Zona de perigo"
  separada dos controles do dia a dia.
- **Nada de estado híbrido no disco.** Recomeçar muda o perfil no mesmo evento
  em que pede o mundo novo, mas a troca do mundo acontece em fases — e no meio
  existiria um instante de "perfil vazio + mundo antigo". Por isso **o autosave
  é suspenso enquanto `world.gerando`**: se o app morrer no meio, o disco
  continua com a jornada anterior inteira; quando o mundo novo fica pronto,
  grava-se uma jornada coerente, uma vez só.
- **Recomeçar usa o mesmo caminho seguro** de recriação (fases, `dispose` das
  imagens, carregando, sem reentrância). Nada de atalho síncrono.
- **O modo desenvolvedor fura a regra de propósito**: semente e nível do mar
  continuam disponíveis mesmo em jornada consolidada, porque são ferramentas
  de teste e estão atrás dos 5 toques secretos.
- **Guardar jornadas antigas fica para depois.** Hoje o save é um só; não há
  slots, lista de mundos nem histórico.

## Recriar o mundo é em duas fases

Semente nova, semente digitada e nível do mar recriam o mundo inteiro — e isso
fechava o app no iPhone. Os marcos mostraram que a morte era **depois** de
`Skia.Image.MakeImage`, no commit/desenho da cena nova.

A conta explica: cada geração custa ~3,5 MB de `World` (com o `tipo[]` de
153.600 referências), 5,3 MB do buffer RGBA em JS e mais 5,3 MB nativos do
`SkData` — `fromBytes` **copia** (`SkData::MakeWithCopy`), enquanto
`MakeImage` só compartilha (`SkImages::RasterFromData`). Fazendo tudo num
tique, as duas gerações ficavam vivas: **~33 MB de pico**, mais a textura nova
na GPU.

Agora `recriar()` não troca o estado na hora:

```
pedido de recriação  → fase 1: só marca (world.gerando = true)
                       o WorldMap SAI da árvore; no desmonte as SkImage são liberadas
                       um quadro, para a UI thread remover a view de verdade
                     → fase 2: gerarMundo + terreno, e o mapa volta
```

- **`dispose()` no desmonte** larga só a referência do wrapper; o `sk_sp` é
  contado, então se a última cena desenhada ainda apontar para a imagem, ela
  sobrevive até aquela cena sair. Por isso é seguro **no desmonte e só lá** —
  depois disso ninguém mais lê a imagem.
- **Esperar um quadro não é atraso arbitrário:** o efeito roda logo após o
  commit do React, mas a remoção da view nativa acontece na UI thread.
- **A câmera reinicia** ao recriar, porque o `WorldMap` remonta. É aceitável:
  mundo novo começa na visão inicial. Trocar Mundo ↔ Aprender é outro caso — lá
  o mapa nunca sai do layout.
- **Sem recriação concorrente:** um segundo pedido é ignorado enquanto o
  primeiro não terminou.
- **O save não muda durante a fase 1**, então grava uma vez só, no fim.

## Por que o mapa voltava em branco

Sintoma: depois de fechar o feed, o mapa às vezes aparecia vazio e só voltava
quando o dedo mexia na câmera.

O Skia **não** repinta porque a view voltou a aparecer. Ele repinta quando a cena
é **reenviada** à view nativa — `SkiaViewApi.setJsiProperty(nativeId, "picture", …)`.
Só dois caminhos chegam lá:

| Caminho | Como dispara | Reenvia a cena? |
| --- | --- | --- |
| `children` do `Canvas` mudarem de **identidade** | `root.render(children)` → `container.redraw()` | sim |
| um **shared value** usado pela cena mudar | o mapper do Reanimated → `applyUpdates` | sim |
| `useCanvasRef().redraw()` | `SkiaViewApi.requestRedraw(nativeId)` | **não** — só pede para redesenhar a picture que a view já tem |

Daí os dois fatos do sintoma:

- **arrastar o mapa funcionava** porque `x`/`y`/`escala` mudam, o
  `useDerivedValue` `transformacao` é reescrito e o mapper reenvia a cena;
- **fechar o feed não funcionava** porque, com o **React Compiler**, o JSX dentro
  do `Canvas` é memoizado: sem mudança de props, `children` mantém a mesma
  identidade, o `useLayoutEffect` de `root.render` não roda e nada é reenviado.
  A re-renderização do React existia; o reenvio, não.

A correção usa o mesmo caminho do arrastar, sem mexer na câmera:
`useMapCamera` tem um shared value `revisao` que entra na conta da transformação
somando **zero** — a câmera fica idêntica, mas o valor derivado é reescrito e a
cena é reenviada. `repintar()` só incrementa esse contador.

O `useCanvasRef`/`redraw()` foi **removido**: agora está documentado que ele não
resolve este caso.

## A ponte: aprender → mundo

```
Curiosity ─registrarAprendizado─▶ LearningResult
                                      │ (só 'aprendida')
                          app/index.tsx  aoAprender()
                                      │
                    gerarEventosDeCrescimento(influencias)
                                      │
                         world.aplicarEventos(eventos)
                                      │
                    aplicarEventosDeCrescimento(...)  → casas, fonte, caminhos…
```

- **A ponte mora em `app/index.tsx`** e em nenhum outro lugar. `learning` não
  importa `world` e `world` não importa `learning`; só a composição vê as duas.
- **A composição não interpreta nada.** Ela não sabe que história vira casa nem
  que astronomia vira observatório — passa a lista de influências inteira e o
  engine do mundo decide. Qualquer `if (tema === …)` em `app/` é erro.
- **Quem diz o que é novo é o engine de learning.** `LearningScreen` embrulha
  `aprender` e só chama `onAprendido` quando o resultado é `'aprendida'`.
  Curiosidade repetida devolve `'repetida'` e a ponte volta na hora: nenhuma
  influência, nenhum evento, nenhuma construção.
- **O mundo cresce na hora do APRENDI**, com o aparelho ainda aberto.
  "Ver no mundo" não faz o mundo crescer: ele só fecha o aparelho (com a mesma
  animação de sempre) para revelar o que já aconteceu. Navegação não é regra de
  domínio.
- **`useWorld.aplicarEventos(eventos)`** é a única porta de entrada, usada tanto
  pela produção quanto pelo modo dev (`aplicarCrescimentoDev` monta um evento de
  intensidade 1 e chama a mesma função). Ela lê o estado **dentro** do updater
  (`setEstado((s) => …)`), para duas aprendizagens seguidas não se atropelarem.
  O `rng` tem estado, então o updater precisa rodar uma vez só — hoje roda,
  porque o app não usa `StrictMode`.

### Comportamento temporário (natureza)

As curiosidades de hoje têm influência de `vegetacao`, que ainda cai em
`crescerVegetacao` (ver o aviso em `world/engine/growth.ts`): aprender a
curiosidade de natureza faz nascer **uma árvore**, não uma construção. Isso é o
sistema legado, mantido de propósito até a natureza ser redesenhada — o mundo
selvagem pertence à seed, e conhecimento de natureza deveria virar coisa
construída (jardim, pomar, viveiro). Não mexa nisso sem tratar o tema inteiro.

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
- **Footprint (`engine/footprint.ts`):** construções não são pontos. Como os
  sprites são ancorados na **base** e sobem a partir dela, cada construção ocupa
  um **retângulo** que vai da âncora para cima (mesma conta do render):
  horizontal `x + 0,5 ± largura/2`, vertical de `y + 1 − altura` até `y + 1`.
  Um círculo em volta da âncora deixava o telhado de uma casa de baixo passar por
  cima da construção de cima. Medidas em **tiles** (o PNG não cresce com o mundo),
  a partir do maior PNG de cada papel, já com sombra:
  | Papel | Largura × altura | Folga | Entre duas iguais |
  |---|---|---|---|
  | casa pequena | 7 × 5,3 (21×16 px) | 0,5 | 1 tile |
  | casa maior | 10,3 × 7,3 (31×22 px) | 1 | 5 tiles (`FOLGA_ENTRE` +3) |
  | fonte | 7,3 × 4 (22×12 px) | 0 | — (o respiro dela é a praça) |
  Duas construções colidem se os retângulos, expandidos pela soma das folgas (mais
  a folga extra do par), se tocam. Construção contra mina, observatório ou
  mina e observatório, que não têm retângulo, continua usando a distância entre âncoras.
  **Se uma arte mudar de tamanho, atualize `FOOTPRINT`.**
- **Terreno sob a construção (`engine/buildable.ts`):** a âncora não basta — o
  sprite ocupa o retângulo inteiro. `footprintEmTerrenoValido` percorre **todos os
  tiles tocados** pelo retângulo (arredondando para fora) e exige que cada um seja
  de solo `firme` e esteja a pelo menos `MARGEM_AGUA` tiles da água (lê
  `mundo.distAgua`, já calculado na geração).
  | Solo (`SOLO`) | Tiles | Uso |
  |---|---|---|
  | firme | planície, savana, floresta, deserto, tundra | pode ficar **sob** a construção |
  | entorno | praia, montanha, neve | só **em volta**, nunca sob |
  | inválido | oceano, água rasa, lago | nem sob, nem a menos da margem |
  Margem da água (tiles): casa pequena 2, casa maior 4, fonte 3. Mina e
  observatório não têm retângulo: para eles vale a checagem da âncora. A mesma
  classificação (`tipoConstruivel`) é usada pelas regras de pontuação — não há
  outra lista de "terreno proibido" na colocação.
- **Praça (`RAIO_PRACA`, 8 tiles):** área livre em volta do **centro visual** da
  fonte (2 tiles acima da âncora). É **restrição dura**: nenhum retângulo de
  construção pode tocá-la, e a preferência pelo centro nunca vence essa regra.
  Antes de a fonte existir, a área fica reservada em volta do centro lógico com
  `MARGEM_PRACA_ANTES_DA_FONTE` (2 tiles) a mais, para a fonte nascer um pouco
  deslocada e ainda ter a praça livre; ao colocar a fonte, também se confere que
  nenhuma construção existente invade a praça dela. É o espaço que um dia vira
  praça desenhada, cruzamento e início das ruas (ainda não desenhado).
- **Zonas** (distâncias até a referência, nada persistido):
  | Zona | Onde | Quem |
  |---|---|---|
  | praça | até `RAIO_PRACA` do centro visual da fonte | só a fonte (restrição dura) |
  | anel das maiores | a partir de `anelMaior` (**calculado**: praça + meia largura da casa maior + folga ≈ 4,4 un) | casas maiores, por preferência |
  | anel das casas | depois de `limiteCasasPequenas` (anelMaior + 0,3), ideal a partir de `raioInicial` (anelMaior + 0,7), crescendo com √quantidade | casas pequenas |
  Como os anéis derivam da praça e do footprint, uma arte maior ou uma praça
  maior empurram os anéis sozinhas. Casas maiores ficam mais perto da fonte que as
  pequenas na maioria das vilas (6/8 no teste), mas é **preferência**: quando o
  anel interno já está cercado de casas pequenas, a maior que chega depois vai
  para o vão livre mais perto, na borda.
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
- **Medido** (8 seeds, 16 povoamentos + 4 infraestruturas, com o tamanho real
  dos PNGs): **0 sobreposições visuais** (eram 33 antes do footprint), praça
  livre (construção mais próxima a 9 tiles do centro da fonte), vizinha mais
  próxima de cada casa a ~8,4 tiles. O raio médio da vila é ~21 tiles (era ~16
  sem praça e com sprites se sobrepondo): é o custo da praça + anel das maiores +
  PNGs mais largos com sombra, não de casas mais afastadas entre si.
  Com a validação de terreno (12 seeds): **0 construções com água ou praia
  embaixo** (eram 29 e 22), sem mudar o raio da vila.
- **Limitação conhecida:** a faixa exclusiva das casas maiores (entre
  `anelMaior` e `limiteCasasPequenas`) tem só ~1 tile. Com terreno válido de
  verdade, cabem ali uma ou duas casas maiores; as seguintes vão para o vão livre
  mais próximo, muitas vezes além das pequenas. Garantir o anel interno pediria
  uma faixa da altura de uma casa maior (~7 tiles), o que espalharia a vila.

**Clareira (temporária, só no desenho):** `combinarParaDesenho` esconde os
`NaturalElement` a menos de `RAIO_CLAREIRA` (6 tiles) de uma construção (casa,
casa maior, fonte, mina e observatório) e os que caem sobre um
caminho (até `MARGEM_CAMINHO`, 1 tile). Plantas do jogador não abrem clareira.
`mundo.natureza` não muda — continua a mesma lista da seed.

## Caminhos da vila (engine/paths.ts)

`Settlement.caminhos: PathTile[]` (`{ x, y, tipo: 'principal' | 'secundario' |
'acesso' }`) é a rede de terra batida. Ela pertence à civilização, como as
construções; a natureza não sabe dela.

- **A praça abre a rede.** Quando a fonte nasce, `criarPraca` marca um disco
  irregular de ~5,5 tiles em volta dela (menos a fonte e as construções) como
  `principal`. A área já estava livre por causa de `RAIO_PRACA`.
- **Rede compartilhada, não tentáculos.** `conectarARede` roda um Dijkstra a
  partir da **entrada** da construção (`pontoDeEntrada`, o tile ao pé do lado da
  porta) e para no **primeiro tile de caminho que encontrar** — a praça ou
  qualquer rua já existente. Por isso a casa nova se pendura na rede mais
  próxima, em vez de puxar uma linha própria até a fonte. Medido: rede com 380 a
  435 tiles onde a soma das linhas retas casa→fonte daria 460 a 560.
- **Custos** (`CUSTO_TERRENO`): caminho existente 1, planície/savana 4,
  floresta/tundra/deserto 6, praia 20, montanha/neve 60; água e footprint de
  construção são proibidos. Mais `PENALIDADE_CURVA` 3 por curva de 90° e um
  ruído determinístico de até 2 por tile (`hash2`), que tira a régua da rota sem
  virar zigue-zague. O estado da busca é (tile, direção), por causa da curva.
- **Classificação:** as duas primeiras rotas depois da praça viram `principal`
  (`VILA.viasPrincipais` conta), as seguintes `secundario`, e os últimos ~3 tiles
  junto da casa viram `acesso`.
- **Largura e bordas:** `LARGURA_CAMINHO` (principal 3, secundário 2, acesso 1
  tiles) engrossa a linha central; o raio varia ±0,4 por tile (`hash2`) e, no
  desenho, os pixels da beira são comidos com 28% de chance. Medido: densidade
  média de vizinhos na rede 6,6 (principal) > 5,1 (secundário) > 3,2 (acesso).
- **Construção e rua não se atravessam:** o engrossamento e a praça pulam os
  retângulos das construções, e uma construção nova não pode nascer sobre a rede
  (nesta V1 a casa desvia da rua; a V2 fará a casa nascer ao lado dela).
- **Render:** `render/pathPixels.ts` monta um buffer RGBA só da caixa da rede
  (~97 KB numa vila de 20 construções, contra 5,3 MB do terreno) e o `WorldMap`
  desenha essa camada entre o terreno e os sprites. Crescer **não** recria o
  terreno.
- **Custo:** ~1,3 ms por construção ligada (medido em 160 conexões).

## Terra nunca toca a borda

`MARGEM_OCEANO` (em `rules.ts`, hoje 26 tiles, escalado por `ESCALA_MUNDO`)
garante oceano em volta do mapa inteiro. Não é pintura de borda: em `formarIlha`
a altitude é multiplicada por um `smoothstep` da distância até a borda e empurrada
para baixo do nível do mar, então a costa se dissolve naturalmente, sem moldura
quadrada. Medido em 5 seeds: nenhuma terra nas bordas, com 18 a 21 tiles de
oceano livre, e a massa principal continua com 24% a 47% do mapa.

## Escala do mundo (ESCALA_MUNDO)

O mundo tem `W` x `H` tiles (hoje 480x320). `ESCALA_MUNDO = W / 150` (hoje 3,2)
compara isso com o mundo original (150x100) e mantém tudo calibrado:

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

- **Estratégia**:
  sorteia 400 candidatos, rejeita lugares proibidos, dá nota, soma um acaso do
  `Rng` e fica com o melhor. Indexada por `WorldGrowthKind`, nunca por `ThemeKey`.
- **Âncora:** `(x, y)` é a base do sprite, um tile só. Ainda não há footprint.
- **Intensidade:** é guardada na colocação, mas ainda não muda nada. Um evento
  gera no máximo uma colocação.
- **Ocupações:** `WorldOccupant` (`{ evento, tipo?, x, y }`) é a lista do que já
  existe.
- **Espaçamento:** entre duas **construções** (casa, casa maior, fonte) quem
  decide é o footprint (retângulos, ver "Assentamentos"). Para os demais pares
  vale a distância entre âncoras: `DISTANCIA_MINIMA_SPRITE` diz quanto espaço cada
  sprite pede (em unidades) e usa-se a média das duas exigências (ou
  `DISTANCIA_ENTRE`, hoje vazio). Sprites sem entrada caem em
  `DISTANCIA_MINIMA_EVENTO`. Valores: árvores 1,4 (acácia 1,6),
  `casa` 2,2, `casa_maior` 2,6, `fonte` 2, `mina` 4, `observatorio` 5. Como o
  sprite da vegetação depende do bioma, ele é decidido **antes** da checagem.
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

## Elementos de crescimento (world/engine/growthElements.ts)

- **`GrowthElement`** (`{ evento, tipo, x, y, intensidade }`) é o elemento do novo
  sistema. **Não tem `ThemeKey`**: o que ele é vem do evento, não do tema estudado.
  Nenhum mapeamento
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

## Um pipeline só de crescimento

O protótipo por tema (`themes.ts`, `placement.ts`, `Element`) **não existe mais**.
Sobrou um caminho só:

```
World
├── natureza procedural da seed   (mundo.natureza, engine/nature.ts)
└── civilização                    (o que o conhecimento constrói)
    └── GrowthElement
        └── Settlement
            └── caminhos
```

E a entrada dele:

```
Learning → influências → composição (app/index.tsx) → WorldGrowthEvent → GrowthElement
```

- **O estado do mundo tem uma lista só:** `crescimento: GrowthElement[]` (mais as
  vilas). Mundo novo, semente nova ou nível do mar novo zeram a civilização — e o
  mundo nasce **só com a natureza da seed**, sem nada construído.
- **`combinarParaDesenho(natureza, crescimento, caminhos)`** devolve
  `RenderElement[]` (`tipo`, `x`, `y`, `orientacao?`, `variante?`) ordenado por
  `y`, para quem está mais abaixo ser desenhado por cima. As clareiras vêm só das
  construções de `GrowthElement`, e `mundo.natureza` nunca muda: o filtro é
  visual.
- **Teste manual:** no modo desenvolvedor, a seção "Crescimento" tem um botão por
  crescimento da **civilização** (`CHAVES_DE_CIVILIZACAO`: Povoamento,
  Infraestrutura, Exploração, Observação). Natureza não tem botão: ela pertence à
  seed e se testa com Novo mundo / troca de semente. `crescerVegetacao` continua
  no domínio. Cada toque chama `aplicarCrescimentoDev(tipo)`, que passa pela mesma
  `aplicarEventos` da produção. Os nomes vêm de `NOMES_DE_CRESCIMENTO`
  (`engine/growth.ts`).
- **Fronteira mantida:** `settings` continua recebendo `ferramentasDev` como
  `ReactNode`; os botões são do `world`, e `app/index.tsx` liga hook e componente.
- **`ThemeKey` não existe mais dentro de `world/`.** Tema é vocabulário de
  `learning` (e de `shared/domain`, que os dois compartilham); o mundo só entende
  influência → evento.

## Interface sobre o mapa

- A tela-base é só o mapa. Por cima dele ficam a barra de ações (cápsula
  central embaixo) e dois `ActionToast` — o de baixo posicionado acima da barra.
  O feed abre por cima de tudo isso (veja "O mundo e o aparelho").
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
  diagonais maiores. A casa frontal (`casa.png`) é o último recurso: só sairia
  se uma residência chegasse ao render sem orientação/variante, o que o fluxo
  atual não produz. `casa_upgrade.png`
  ficou no disco sem uso: a construção maior agora é só `casa_maior`.
- `observatorio` ainda não tem PNG: continua desenhado em
  caracteres por `spriteBuffers.ts`, com cache por `tipo`.
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
