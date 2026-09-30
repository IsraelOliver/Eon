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
        escala.ts            → A ESCALA: pixels por tile e tamanho do mundo (a cabana é a referência)
        rules.ts             → REGRAS do mundo, ESCALA_MUNDO, faixas e nomes
        generate.ts          → gera o mundo (semente + nível do mar como parâmetros)
        nature.ts            → decoração natural do mundo selvagem (árvores, pedras…)
        destaque.ts          → escolhe a novidade a mostrar depois de aprender (+ a frase)
        selecao.ts           → qual construção está sob o toque (+ nomes das construções)
        inspect.ts           → descreverTile(): bioma, altitude e umidade de um tile
        marcos.ts            → PROGRESSÃO DA VILA: catálogo de marcos + marcosPendentes()
        growth.ts            → gerarEventosDeCrescimento(): influências → eventos (crescimento comum)
        growthPlacement.ts   → colocarCrescimento(): evento → lugar válido + sprite
        growthElements.ts    → aplicarMarcos() e aplicarEventosDeCrescimento() → GrowthElement[] + vilas
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
        calloutGeometria.ts  → onde o balão fica e como o traço o alcança (puro)
      components/            → peças visuais (React Native + Skia)
        WorldMap.tsx         → mapa em tela cheia (Skia), gestos de câmera, toque longo
        WorldSprites.tsx     → desenha os sprites (PNG ou fallback) sobre o terreno
        ActionToast.tsx      → aviso que some sozinho (posição topo/baixo e duração por props)
        GrowthBanner.tsx     → anuncia o que nasceu (título + subtítulo, some sozinho)
        BuildingCallout.tsx  → etiqueta ligada a uma construção (ponto + traço + painel)
        WorldDevTools.tsx    → (dev) semente, nível do mar e botões de crescimento
        BiomeLegend.tsx      → (dev) legenda das cores do mapa
      hooks/
        useWorld.ts          → estado do mundo; avancarProgressao() é a porta do conhecimento
        useMapCamera.ts      → câmera: gestos, limites, tela↔mapa, focarEm, aviso de movimento
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
        LearningOverlay.tsx  → o Discovery: página vizinha do Mundo, desliza por cima dele
        LearningScreen.tsx   → a tela: feed + leitura; avisa onAprendido ao registrar
        DiscoveryFeed.tsx    → FlatList com snap: uma descoberta por viewport
        DiscoveryPost.tsx    → o post: fotografia em tela cheia, título e "Ler →"
        CuriosityReader.tsx  → leitura em tela cheia: conteúdo, fontes, botão APRENDI
      presentation/          → decisões de aparência que o engine não pode conhecer
        coverTheme.ts        → capa provisória por tema (cor + símbolo)
        descoberta.ts        → o que ainda falta descobrir (o filtro do feed)
        feedLayout.ts        → a conta do feed: viewport, recuos e paradas do snap
        atmosfera.ts         → a cor atmosférica: cadastrada ou do tema, escurecida p/ contraste
        degradeDoPost.ts     → os degradês do post: atmosfera, emenda e rodapé preto
        worldPulse.ts        → a regra do World Pulse e o item que ele mostra
      hooks/
        useLearning.ts       → perfil da sessão; delega a decisão ao engine
    achievements/            → conquistas da jornada (não importa world nem learning)
      engine/regras.ts       → o que desbloqueia cada conquista (pura)
      engine/estado.ts       → desbloqueadas (salvo) + fila do banner (sessão) (pura)
      engine/colecao.ts      → a coleção: catálogo + desbloqueadas → itens e contagem (pura)
      data/achievements.ts   → CATÁLOGO: título, frase e arte de cada conquista
      hooks/useAchievements.ts → guarda o estado; cada ação é uma função pura
      components/AchievementToast.tsx → banner global que desce do topo
      components/AchievementsScreen.tsx → a coleção (aberta por Configurações)
    onboarding/              → boas-vindas de uma jornada nova
      regra.ts               → quando as boas-vindas ao Mundo aparecem (pura)
      components/JourneyIntro.tsx → o cartão por cima do mundo
    settings/                → configurações do app
      components/
        SettingsMenu.tsx     → tela "Configurações": Conquistas, Aparência, Sobre (+ Desenvolvedor), zona de perigo
        AboutScreen.tsx      → "Sobre o Éon": descrição, versão (expo-constants), créditos
        TopoDaTela.tsx       → o topo ‹ + título das telas de Configurações
      hooks/
        useDevMode.ts        → modo desenvolvedor: 5 toques secretos liga/desliga
  persistence/               → o save (camada de composição, como app/)
    save.ts                  → SaveV3 (+ migrações V1→V2→V3), conferência e decidirSave
    storage.ts               → AsyncStorage: ler, gravar em fila, apagar
    preferencias.ts          → @eon/preferences: a aparência, separada da jornada
  shared/                    → o que qualquer funcionalidade pode usar
    domain/themeKey.ts       → ThemeKey: temas em comum entre learning e world (tipo puro)
    domain/influence.ts      → InfluenceKey, KnowledgeInfluence: contrato learning → world
    theme/marca.ts           → as sete cores oficiais (a fonte única)
    theme/temas.ts           → temaClaro/temaEscuro derivados da marca; resolverTema (puro)
    theme/colors.ts          → useColors(): tokens do tema efetivo + store da aparência
    ui/Button.tsx            → botão reutilizável
    ui/ActionBar.tsx         → barra de ações: cápsula central embaixo (só ícones)
    ui/Window.tsx            → janela base: fundo escurecido, fade, título, conteúdo, rodapé
    ui/Slider.tsx            → controle deslizante (avisa o valor ao soltar)
    ui/Gradient.tsx          → degradê linear vertical (único lugar que sabe desenhar um)
    ui/icons.ts              → ícones da interface (único lugar para trocar por pixel art)
```

## Entrada do app e a web

`package.json` aponta `"main": "index"`, e o Metro escolhe o arquivo pela
plataforma:

- **`index.tsx`** (iOS e Android): só `import 'expo-router/entry'` — exatamente o
  que o `main` antigo fazia. O nativo não mudou em nada.
- **`index.web.tsx`** (web): carrega o Skia **antes** do primeiro render. No
  celular o Skia é nativo e já existe quando o app abre; na web ele roda sobre o
  CanvasKit (WebAssembly, 8 MB), que precisa ser baixado primeiro. Sem isso,
  `Skia.Image` ainda não existe quando o mapa monta e o app quebra.

O `canvaskit.wasm` é servido de `public/`. Ele vem de `node_modules` (o
`canvaskit-wasm` é dependência do próprio Skia — nada novo foi instalado), é
copiado pelo `postinstall` (`setup-skia-web public`) e fica fora do git. O
`public` vai explícito porque o script, sem `web.bundler` no `app.json`, copiaria
para a pasta do webpack.

A web serve para **visualizar** o app sem um celular; o alvo continua sendo o
iPhone.

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
| Mudar uma cor oficial da marca          | `shared/theme/marca.ts` (os temas derivam dela) |
| Mudar como o claro/escuro usa a marca   | `shared/theme/temas.ts`               |
| Trocar os ícones (gear, menu)           | `shared/ui/icons.ts`                  |
| Transformar um ícone em pixel art       | `scripts/gerar-icone-ui.ps1` + `shared/ui/icons.ts` |
| Mudar o que aparece numa janela         | `SettingsMenu.tsx`                    |
| Mudar quantos toques ativam o modo dev  | `settings/hooks/useDevMode.ts`        |
| Adicionar uma ferramenta de dev         | componente na feature + `ferramentasDev` em `app/index.tsx` |
| Adicionar/remover um tema               | `shared/domain/themeKey.ts` + `learning/engine/themes.ts` |
| Adicionar um tipo de influência         | `shared/domain/influence.ts` + destino em `world/engine/growth.ts` |
| Mudar o que aprender dá ao perfil       | `learning/engine/profile.ts`          |
| Mudar o formato do save                 | `persistence/save.ts` (`SaveV3`, `VERSAO_DO_SAVE`, `migrarParaAtual`) |
| Criar uma conquista nova                | `achievements/engine/regras.ts` (regra) + `scripts/gerar-sprite-conquista.ps1` (arte) + `achievements/data/achievements.ts` (texto) |
| Mudar o banner de conquista             | `achievements/components/AchievementToast.tsx` |
| Mudar a tela de Conquistas              | `achievements/components/AchievementsScreen.tsx` |
| Mexer na gravação/chave do save         | `persistence/storage.ts` (`@eon/save`) |
| Mexer na aleatoriedade do crescimento   | `world/engine/growthElements.ts` (`rngDeCrescimento`) |
| Mexer na ponte aprender → mundo         | `app/index.tsx` (`aoAprender`)        |
| Mudar como o mundo aplica crescimento   | `world/hooks/useWorld.ts` (`avancarProgressao`) |
| Criar/mudar um marco da vila            | `world/engine/marcos.ts` (`MARCOS`) + sprite em `spriteAssets.ts` |
| Aumentar/diminuir a escala do mapa      | `world/engine/escala.ts` (`PIXELS_POR_TILE`, `TILES_*`) |
| Mudar o desenho do terreno (costa, manchas) | `world/render/buildPixels.ts` (constantes do topo) |
| Mudar os botões da barra de baixo       | `app/index.tsx` (`acoes`) + `shared/ui/icons.ts` |
| Mudar o formato/tamanho da barra        | `shared/ui/ActionBar.tsx`             |
| Mudar a transição Mundo ↔ Discovery     | `shared/ui/navegacao.ts` (`PARALLAX_DO_MUNDO`, `DURACAO_DA_NAVEGACAO`) |
| Mudar a animação de abrir o feed        | `learning/components/LearningOverlay.tsx` |
| Acrescentar/editar uma curiosidade      | `learning/data/curiosities.ts` (só isso) |
| Mudar o post do feed                    | `learning/components/DiscoveryPost.tsx` |
| Mudar o snap/altura dos posts           | `learning/presentation/feedLayout.ts` |
| Mudar o que entra no feed               | `learning/presentation/descoberta.ts` |
| Dar a cor atmosférica de uma capa       | `learning/data/curiosities.ts` (campo `corAtmosfera`) |
| Mudar o quanto a atmosfera escurece     | `learning/presentation/atmosfera.ts` (`LUMINANCIA_MAXIMA_DO_TOPO`) |
| Colocar a capa de uma curiosidade       | `assets/curiosities/` + campo `capa` no catálogo |
| Mudar a capa provisória de um tema      | `learning/presentation/coverTheme.ts` |
| Mudar a força do degradê do post        | `learning/components/DiscoveryPost.tsx` (`DEGRADE`) |
| Mudar o chip do tema no post            | `learning/components/DiscoveryPost.tsx` (`chip`) |
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
Curiosity ─registrarAprendizado─▶ LearningResult.perfil.aprendidas ─avancarProgressao─▶ marcos da vila ─▶ mapa
                                  (influências ficam no perfil: afinidade para marcos futuros)
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
   └─ LearningScreen
      ├─ DiscoveryFeed (FlatList com snap vertical)
      │    ├─ post 0 ── DiscoveryPost (foto desde o topo + atmosfera forte)
      │    │          └─ POR CIMA: TopBar ("Éon" + ⚙︎) + WorldPulse
      │    └─ posts 1… ── DiscoveryPost (uma viewport cada, atmosfera discreta)
      └─ leitura: CuriosityReader (tela cheia, por cima de tudo)
```

**As quatro áreas do app têm papéis diferentes:** o **World Pulse** conta *o que
aconteceu no meu mundo*; o **Discovery Feed**, *o que eu ainda posso descobrir*;
as **Aprendidas** (tela futura), *o que já faz parte da minha jornada*; e o
**Mundo**, *o que meu conhecimento construiu*.

- **`useLearning`** guarda o `KnowledgeProfile` da sessão em memória. Ele não
  decide nada: chama `registrarAprendizado` e guarda o perfil devolvido. Em
  `'repetida'` o perfil é o mesmo objeto, então nada muda na tela.
- **`LearningScreen`** é o conteúdo do aparelho. Qual curiosidade está aberta é
  estado dele — de tela, nunca do save.
- **`CuriosityReader`** mostra tema, título, conteúdo, **fontes** (com
  `Linking.openURL` quando têm `url`) e o botão **APRENDI**. Depois do toque
  aparece "✓ Conhecimento adquirido." — o texto **não fala do mundo**, porque a
  ligação com o mapa ainda não existe. A prop opcional `onVerMundo` é o gancho
  para essa etapa: quando a composição passar essa ação, aparece "Ver no mundo".
  Se a curiosidade já foi aprendida, o botão fica **APRENDIDA** e desabilitado.
- Os nomes de tema vêm de `learning/engine/themes.ts`, não dos `TEMAS` do mundo:
  `learning` **não importa** `world` (e vice-versa). O que os dois compartilham
  mora em `shared/domain`.

### O topo do feed (World Pulse)

**O header é uma região própria no alto da PRIMEIRA página do feed** — não é
fixo. `LearningHeader` entra como `cabecalho` do `DiscoveryFeed`, acima do
primeiro post, e sobe junto quando a pessoa passa para a próxima curiosidade;
voltar ao topo o traz de volta. O header termina, o post começa.

```
┌─────────────────────────────┐  fundoFeed (tema), safe area de cima
│ Éon                      ⚙  │  TopBar: 44 pt, Éon à esquerda, engrenagem à direita
│ ● MUNDO AGORA               │  WorldPulse: rótulo pequeno
│ Nenhuma construção…      ~  │  manchete + ícone na coluna da engrenagem
├─────────────────────────────┤  fio `line` (hairline): fim do header
│ [ HISTÓRIA ]                │  timeline: o chip já é conteúdo do post
```

- **Uma peça só:** mesma superfície (`fundoFeed`), mesma margem lateral (20 pt,
  a mesma do chip e do título dos posts). A engrenagem e o ícone do Pulse
  dividem a coluna da direita; o texto do Pulse trunca/desliza e nunca empurra
  a engrenagem.
- **World Pulse sem card:** nada de caixa, borda, faixa ou sombra. Quem separa as
  duas seções é o espaço e o contraste tipográfico.
- **Só cores do tema.** O header não usa a atmosfera da foto — nem de fundo, nem
  de detalhe. A barra de status segue o tema, como qualquer tela.
- **Grafite estrutura, laranja identifica.** Éon, o rótulo (MUNDO AGORA) e a
  manchete são `ink`. O laranja aparece em poucos pontos: o sinal de status
  (`accent`; marcos em `accentStrong`), a engrenagem (o próprio sprite) e o
  controle do ícone do Pulse — quadrado 36 pt, raio 10, fundo `panel`, fio
  `accentStrong`, símbolo `accent`. O fio que fecha o header é o `neutral`
  (cinza) a 50%.

#### A vitrine viva da jornada

**World Pulse é a vitrine viva do estado da jornada.** Ele prioriza conquistas
novas, depois notícias reais de progressão, e usa notícias ambientais como
fallback — por isso nunca fica vazio. Futuramente pode exibir descobertas que
levam a eventos no mapa.

É **vitrine**, não arquivo: mostra um item por entrada. Histórico completo de
notícias e coleção de conquistas serão telas próprias; o Pulse não tenta ser
nenhuma delas. Também **não é filtro**: os chips de tema saíram daqui, e com eles
o `temaFiltrado` (o único controle dele morava no Pulse; recolocá-lo em outro
lugar é tarefa futura).

```
Conquista nova
      ↓ não
Notícia real recente
      ↓ não
Notícia ambiental
```

`escolherWorldPulse(...)` em `learning/presentation/worldPulse.ts` é a regra num
lugar só, pura e testável. Devolve um `WorldPulseItem`, união discriminada:

```
noticia/progressao  → o que o conhecimento acabou de construir (com "agora"/"há pouco"/"hoje")
noticia/ambiental   → o dia comum do mundo (sem hora: não há hora real para inventar)
conquista           → NOVA CONQUISTA: nome + o que foi
descoberta          → reservada: tem tipo e estilo, falta só quem a produza
```

**Sem tempo e sem sorteio.** Nenhum timer alterna o card e não há `Math.random`:
os mesmos candidatos dão sempre o mesmo item.

**Escolhido UMA vez, na entrada.** A composição decide quando o aparelho abre
(`aprenderAberto` false→true) e o item fica **congelado** até a próxima entrada:
não troca no meio do scroll, e dá para marcar como visto na hora sem ele se
recalcular. Conquista e notícia real andam **uma por entrada** — a vitrine só tem
lugar para uma, e marcar o lote todo como visto engoliria as outras sem mostrá-las.

#### Notícia ambiental: só fala do que existe

`world/engine/pulsoAmbiental.ts` lê só o `WorldSnapshot` (o que a composição já
tem em `world.estadoPersistivel`). Cada assunto tem um **portão**: fonte só com
fonte, estrada só com caminhos, céu só com observatório, vila só com casa — e
"paisagem intocada" **só enquanto nada foi construído**. Um mundo novo nasce sem
civilização, então é a paisagem que responde por ele.

O portão é o que impede a frase falsa; o vocabulário completa: o jogo não tem
população, família, economia nem política, e nenhum modelo fala disso (nem diz
"nova" — novidade de verdade é notícia de progressão). Os testes checam as duas
coisas.

**Não repete:** as frases elegíveis são intercaladas por assunto (céu, mina,
fonte, céu…) e o índice é `semente do mundo + dia + vez`. Entradas seguidas mudam
de assunto, a frase anterior nunca sai em seguida, e a primeira do dia muda de um
dia para o outro. A memória disso é um contador de sessão (ref), não save.

#### O card

Um só componente (`header/WorldPulse.tsx`), com a identidade de cada tipo numa
tabela — não em `if`:

- **faixa de 3 px** no topo na cor do tipo: laranja (mundo vivo agora),
  laranja escuro (marco e descoberta). A ambiental não tem acento: é o dia comum, e a
  hierarquia precisa mostrar que vale menos que uma novidade real;
- **linha de status**: ponto que respira devagar (1,4 s, nunca some) só na
  notícia real; ponto parado na ambiental; `✦` na conquista; `!` na descoberta;
- **manchete** forte de uma linha; se não couber, desliza devagar com pausa longa
  (medida com `flexShrink: 0`, senão o texto encolhe e nunca desliza). Conquista
  usa nome + duas linhas, parada;
- **canto de 32 px** à direita com o glifo do assunto (`ICONS_DO_PULSO`) — é o
  lugar do sprite pixel art futuro;
- **sombra curta** (0.08, raio 8) num embrulho sem `overflow`, porque o iOS
  corta a sombra de quem tem `overflow: hidden`. Raio 14, menos bolha que os
  pôsteres. Fica entre ~76 e ~100 px de altura.

O assunto (`AssuntoDoMundo`) mora em `shared/domain`: o mundo o escreve, o feed
desenha o ícone, e nenhum dos dois importa o outro.

#### O que é "novo" no Pulse

As conquistas **desbloqueadas** vêm da feature `achievements` e são salvas (veja
"Conquistas"). O que é de sessão é só o **"ainda não mostrada no Pulse"**: as
vistas nascem com tudo o que já estava desbloqueado na hidratação, igual às
notícias, que começam a contar do tamanho do crescimento salvo. Reabrir o app não
ressuscita marcos nem notícias antigas.

O banner anuncia a conquista **no instante** em que ela acontece; o Pulse a mostra
na próxima entrada no feed, como vitrine. São dois momentos, não um aviso repetido.

`learning` não importa `achievements`: a vitrine recebe `ConquistaDoPulso` (id,
nome, frase) já em texto, montada pela composição a partir do catálogo.

**Recomeçar jornada limpa tudo junto:** a lista de construções encolhe → as
notícias são apagadas; as conquistas zeram → as vistas são podadas para o que
ainda existe. Nada de notícia fantasma de civilização apagada, e reconquistar um
marco volta a avisar.

#### Notícias são efêmeras

`world/engine/destaque.ts` expõe `fraseDeCrescimento(elemento)` — a **mesma**
frase que o banner do mundo usa, sozinha, para o feed não precisar de um segundo
catálogo de textos.

O resto é da composição (`app/index.tsx`): um `useRef` guarda quantas construções
já viraram notícia e um efeito traduz só as que nasceram depois. Nada disso entra
no save, de propósito — **o que aconteceu já está lá** (nas construções); o que é
passageiro é o *"isto acabou de acontecer"*.

**Crescimento do modo dev não vira notícia.** O filtro é estrutural, não uma
flag: só elementos com `origemConhecimentoId` entram na fila, e
`aplicarCrescimentoDev` chama `aplicarEventos` **sem origem**. Notícia é o que o
conhecimento causou — cem casas criadas em teste não entopem a fila de quem está
jogando.

A fila é **cronológica**: a mais antiga não vista é a próxima a ser contada, uma
por entrada. Vista uma vez, nunca mais toma a vez de ninguém, mas continua na
lista (limite de 6).

**A fronteira continua de pé.** `learning` **não importa** `world`: o formato que
a tela conhece é `NoticiaDoMundo { id, texto, assunto, criadoEm, vista }`,
declarado em `learning/presentation/worldPulse.ts`. Para o feed, notícia é texto,
assunto e hora; quem sabe que aquilo veio de um `GrowthElement` é a composição.

### O Discovery Feed

**O feed principal mostra somente curiosidades ainda não aprendidas.**
Curiosidades aprendidas deixam esse fluxo e pertencem à coleção de conhecimento
do usuário, que terá interface própria de consulta/releitura. **Cada post ocupa
aproximadamente uma viewport e o feed usa snap vertical para apresentar uma
descoberta por vez.**

O filtro é `paraDescobrir(curiosidades, perfil)` — **derivado, nunca guardado**.
A fonte de verdade é o `KnowledgeProfile`, que já é persistido, então duas
propriedades saem de graça: fechar e abrir o app mantém o que foi aprendido fora
do feed, e **recomeçar a jornada devolve tudo**, porque o perfil volta vazio.
Não existe segunda lista de "escondidas" para sair de sincronia. A função é
genérica sobre `{ id }`: a tela de Aprendidas é o complemento dela, sobre o mesmo
catálogo.

**O feed congela enquanto a leitura está aberta.** Tocar APRENDI muda o perfil na
hora; sem o congelamento, a lista se reconstruiria sob o leitor e, ao fechar, o
feed apareceria em outra posição. A sincronização acontece quando a leitura fecha
— e o leitor procura no **catálogo inteiro**, não no feed, então a curiosidade
recém-aprendida continua legível até quem está lendo decidir sair.

```
┌──────────────┐  altura = a PÁGINA (a tela; o 1º post divide a dele com o header)
│ [ GEOLOGIA ] │  ← chip na cor do próprio tema, abaixo do header / da status bar
│              │
│  fotografia  │  ← expo-image, 'cover', fill absoluto, de borda a borda
│ ░░░░░░░░░░░░ │  ← Gradient progressivo: nada no alto, firme só na base
│ Título 33/39 │
│ preview (2)  │
│ Ler →        │  ← só texto, acima da ActionBar
└──────────────┘
```

A conta toda vive em `presentation/feedLayout.ts`, **pura e testada** —
`medidasDoFeed`, `posicaoDoPost`, `paradasDoFeed`.

- **Páginas do tamanho da lista** (a tela, medida com `onLayout`). A primeira é
  o header + o primeiro post, que ocupa com `flex: 1` o que o header deixa — sem
  depender de medir o header. As outras são um post de borda a borda, com a
  foto passando por baixo da status bar e da ActionBar. Só o texto respeita as
  bordas: `recuoTopo` (safe top + 14; no primeiro post, 14 abaixo do header) e
  `recuoBase` (safe bottom + `ESPACO_ACTION_BAR`).
- **Status bar:** segue o tema enquanto o header está embaixo dela; quando ele
  sai (`onHeaderFora`, pela rolagem), o alto é fotografia e os ícones ficam
  claros.
- **Snap simples:** toda página começa em `k × altura da lista`
  (`paradasDoFeed`). `decelerationRate="fast"` + `disableIntervalMomentum`
  encaixam sem prender e sem pular dois de uma vez.
- **Nenhum padding no conteúdo da lista:** com páginas da altura da lista, o fim
  da rolagem coincide exatamente com a última parada. Feed vazio: o header e
  "Você descobriu tudo" dividem a página.
- **Virtualizado** porque o catálogo vai crescer e cada item é uma fotografia de
  tela cheia: `FlatList` com `getItemLayout` (altura conhecida, sem medição nem
  salto), `windowSize` 3 e 2 por lote. O post é `memo` e o `renderItem` é
  estável, senão rolar re-renderiza os vizinhos sem mudança de conteúdo. A
  `recyclingKey` do `expo-image` evita a imagem antiga aparecer numa view
  reaproveitada. Sem `removeClippedSubviews`: em iOS ele já causou sumiço de
  conteúdo em listas com imagem.
- **A sequência não tem cortes secos.** Cada post depois do primeiro leva
  **dois** degradês: um no alto (14% do post) e o de sempre na base — os dois
  em `presentation/degradeDoPost.ts`. O primeiro encosta no header, não num
  post: não há emenda, então o alto dele é só fotografia.
- **O segredo da emenda é o casamento, não o degradê.** Ter sombra dos dois
  lados não basta: com a base terminando em 0.93 e o topo começando em 0.45, o
  olho via a divisão **clarear** — um degrau. Por isso os dois saem da mesma
  constante, `ALFA_NA_EMENDA`, e chegam na divisão com exatamente o mesmo
  escuro. Há teste para essa invariante, que é fácil de perder de vista ao
  mexer nos valores.
- **Nada disso mexe no snap.** Todos os overlays são `position: absolute` dentro
  do post, que já tem altura fixa: zero altura nova, zero spacer.

#### A cor atmosférica

Cada curiosidade pode declarar no catálogo `corAtmosfera: '#RRGGBB'` — o
**ambiente** da capa, escolhido a olho junto com a imagem. Ela vive só DENTRO
do post: o header nunca a usa.

```
TOPO    → corAtmosfera (escurecida)   posts 1…: discreta, nascendo da emenda preta
                                       post 0: nenhuma (encosta no header)
RODAPÉ  → sempre preto                 é ele que garante a leitura do título
CHIP    → cor do TEMA                  identidade do assunto; não é a atmosfera
```

- **Nunca calculada no aparelho.** Nenhuma análise de pixel: o app só lê a string
  do catálogo. Zero custo por imagem, e a cor mais frequente de uma foto
  raramente é a mais bonita — a escolha é editorial.
- **`resolverAtmosfera`** (`presentation/atmosfera.ts`, pura) devolve a `base`
  (cadastrada) e o `topo` (a base escurecida). Sem cor cadastrada — ou com uma
  inválida —, cai na cor da capa do tema: curiosidade antiga não quebra, e o
  validador do catálogo acusa o formato errado.
- **Contraste garantido, não torcido:** `escurecerAte` (`shared/theme/cor.ts`)
  baixa os canais, mantendo o matiz, até a luminância relativa (WCAG) caber em
  0,1 — o alto do post fica escuro o bastante mesmo com um amarelo-claro
  cadastrado.
- **A emenda entre posts continua preta no ponto de contato.** A atmosfera do
  post seguinte só aparece logo abaixo: cada swipe muda o ambiente sem riscar
  uma linha colorida na divisão.
- **Não vai para o save:** é conteúdo editorial. Mudar a cor no catálogo muda a
  tela na próxima abertura.

**Na web, o degradê é outro arquivo.** `shared/ui/Gradient.tsx` usa
`experimental_backgroundImage`, que o react-native-web descarta em silêncio — na
web nenhum degradê aparecia. `Gradient.web.tsx` desenha o mesmo degradê como
`background-image` CSS; o Metro escolhe um ou outro pela plataforma, e o do
iPhone não mudou.
- **O chip do tema usa a cor do próprio tema** (`CAPA_DO_TEMA`), não um token da
  interface: trocar a paleta no laboratório **não** repinta os chips, porque
  identidade de conteúdo não é identidade de interface. O `gap` interno já é o
  lugar do sprite pixel art futuro.
- **`Ler →` não tem fundo, borda nem cápsula** — texto branco sobre o degradê. O
  post **inteiro** continua sendo o botão (como sempre foi), então a área de
  toque é a tela toda e existe um nó de acessibilidade só, em vez de dois botões
  aninhados dizendo a mesma coisa. Pressionar esmaece o CTA.
- **Sem selo de aprendida** no post: no Discovery Feed todo post é ainda não
  aprendido, então o selo não teria o que dizer. Quem mostra esse estado é o
  `CuriosityReader` (**APRENDIDA**, desabilitado), que a tela de Aprendidas
  reaproveita — e a proteção `'repetida'` do engine continua de pé para quando
  ela reabrir uma curiosidade já aprendida.
- **Feed vazio** tem estado próprio ("Você descobriu tudo por enquanto."), com a
  altura de um post. Nada é inventado para preencher.

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

## O mundo e o Discovery (app/index.tsx)

**Mundo e Discovery são superfícies persistentes, e a navegação entre elas usa
uma transição horizontal animada. O `WorldMap` permanece montado durante essa
navegação. Um único progresso visual também dirige o seletor da ActionBar.**

```
MUNDO                               DISCOVERY
[tela]  ←──── slide horizontal ────→  [tela]

AppScreen
├── camada do mundo   (Animated.View: recua 10% — parallax)
├── LearningOverlay   (Animated.View: espera à direita, desliza por cima)
└── ActionBar         (fixa; só o seletor laranja viaja)
```

- **Um valor, três movimentos.** `useProgressoDaNavegacao` (`shared/ui/`) cria
  o shared value 0 → 1. Dele saem o `translateX` do Discovery (largura → 0), o
  do Mundo (0 → −10% da largura) e o do seletor da ActionBar (item 0 → item 1),
  além da cor dos ícones. A matemática é pura e testada (`shared/ui/navegacao.ts`);
  em qualquer instante os três estão na mesma fração do caminho.
- **Uma fonte de verdade para cada coisa:** `aprenderAberto` (estado React) é o
  DESTINO, e é ele que decide toque e acessibilidade; o shared value é só o
  CAMINHO visual até lá. Nunca se lê `.value` para decidir JSX.
- **Só `translateX`, 280 ms, `Easing.out(cubic)`.** Sai rápido, desacelera ao
  chegar, sem mola. O Mundo **não** muda de opacidade: opacidade num pai do Skia
  obrigaria o iOS a compor o mapa fora da tela a cada quadro — e com o Discovery
  opaco na frente, nem se veria.
- **Inverter no meio** substitui a animação a partir da posição atual, com
  duração proporcional ao que falta (a volta tem a mesma velocidade da ida).
  Nada de fila, bloqueio ou debounce: trinta toques são trinta substituições.
- **O seletor é UM elemento.** Um `Animated.View` absoluto por baixo dos ícones
  — um retângulo laranja de 32×30, só o bastante para destacar o ícone — que
  viaja de um lado ao outro, em vez de cada item pintar o próprio fundo (que
  montava de um lado e desmontava do outro).
- **A barra é um controle pequeno do mundo**, não uma cápsula de sistema:
  100×44 pt, grafite com fio de 1 pt em laranja escuro, raio 10 (não pílula) e
  sem sombra. Itens de 44×36 com toque de 48×44 (`hitSlop` até a borda: no iOS
  o toque não passa do limite da barra). Igual nos dois temas.

- **O `WorldMap` nunca desmonta e nunca sai do layout.** Nada de `display: 'none'`
  nele: era isso que fazia a superfície do Skia voltar vazia e o mapa aparecer
  branco até um gesto na câmera. Por isso também `useWorld()` vive na composição:
  abrir e fechar o feed não refaz o terreno, não recria as `SkImage`, não
  recalcula os caminhos, não recarrega sprites e não reinicia a câmera.
- **A barra de ações** (`shared/ui/ActionBar.tsx`) é uma cápsula flutuante
  centralizada na borda de baixo, com dois ícones: a casinha do Mundo e a carta do Discovery. **Ela é a
  única navegação entre as duas telas.** Vale para o app inteiro: é renderizada por último em
  `app/index.tsx`, acima do mundo, do aparelho e das janelas, e nunca some. Por
  isso o feed e a leitura reservam `ESPACO_ACTION_BAR` no rodapé. A cápsula não
  desliza com as páginas; o `ativo` (o destino lógico) serve ao leitor de tela.
- **UI moderna + micro-ícones em pixel art.** Um ícone em `shared/ui/icons.ts`
  pode ser texto ou uma imagem (a casinha do Mundo, `assets/ui/letter_home`, e a carta do
  Discovery, `assets/ui/Letter_Discovery`, 14×14). Imagem é desenhada **como
  foi feita**: sem tint, sem cor animada — quem mostra o ativo é o seletor
  passando por trás; o sprite fica parado. O tamanho é `TAMANHO_DO_SPRITE` =
  56/3 pt: com arte de 14 px, dá 56 px exatos nas telas 3x (cada pixel da arte
  vira um bloco 4×4). Nas telas 2x (iPhone 11, XR, SE) não existe múltiplo
  inteiro, e a versão @2x sai por vizinho-mais-próximo, com colunas levemente
  desiguais. Na web, que usa o arquivo base (a arte intacta),
  `imageRendering: 'pixelated'` impede o navegador de suavizar.
  **Para trocar outro ícone:** exporte o PNG, rode
  `scripts/gerar-icone-ui.ps1 -Origem <png> -Nome <nome> -Escala3x <n>` (com
  `TAMANHO_DO_SPRITE × 3 = lado da arte × n`) e aponte o ícone em
  `icons.ts` para `assets/ui/<nome>.png`.
- **Tocar de novo no destino ativo faz a ação daquele lugar** (`app/index.tsx`):
  destino diferente navega; o mesmo destino não navega. Mundo ativo → a câmera
  anima até a visão geral (`WorldMap.visaoGeral` → `useMapCamera.mostrarTudo`:
  zoom mínimo, centralizado, 650 ms). Discovery ativo → o feed rola até o topo
  (`LearningOverlay.voltarAoTopo` → `DiscoveryFeed`, `scrollToOffset` na ref da
  FlatList). Os dois são contadores, como o `despertar`: nada remonta, nada é
  recriado, e um pedido antigo não se repete quando o componente monta.
- **Toque na barra:** só o item esmaece (`opacity` 0,7). Nada de fundo, halo
  ou sombra ao segurar — o seletor é irmão do item, então não é afetado.
- **As configurações só abrem de dentro do aparelho**, pela engrenagem (sprite `gear_configuration`, 22 pt, sem tint) da linha do topo
  do feed (`onConfiguracoes`). O mapa não tem botão para elas.
- **Configurações é uma tela cheia, não um modal** (zIndex 35): cobre o feed e
  a barra, tem o próprio `‹` no topo (fecha e volta ao feed) e não tem botão
  "Fechar". Poucas caixas: Conquistas é uma linha com fio (`1/1 ›`), Aparência
  é o rótulo com o segmentado, e a **zona de perigo** fica no fim, separada por
  fio e respiro (`flexGrow`). "Sobre o Éon" abre por cima dela e o `‹` volta
  para Configurações. A confirmação de recomeçar continua sendo um
  `Window`, agora por cima da tela. O `✦` do modo dev fica no pé da tela.
- **As janelas são controladas pela composição.** `SettingsMenu` e `LearnMenu`
  não carregam mais o próprio botão: recebem `aberto`/`onFechar`, e `app/index.tsx`
  guarda qual painel está aberto (um de cada vez).
- **`LearningOverlay`** é o Discovery. Fica **sempre montado** — fechado, ele só
  espera fora da tela, à direita, com `pointerEvents: 'none'`. Isso preserva a
  posição vertical do feed entre idas e vindas e evita medir tudo de novo. Ele
  não anima nada sozinho: só lê o progresso que a composição lhe passa.
- **A câmera também sobrevive:** o mapa nunca remonta, então zoom, pan e foco
  ficam onde a pessoa os deixou.
- **Alcance e acessibilidade andam juntos.** Com o feed aberto, a camada do mundo
  recebe `pointerEvents="none"` + `accessibilityElementsHidden` +
  `importantForAccessibility="no-hide-descendants"`; fechado, o overlay recebe o
  mesmo tratamento. O que não está à vista não recebe dedo nem leitor de tela.
- **Ao terminar de voltar ao Mundo, o mapa precisa reenviar a cena.**
  `useProgressoDaNavegacao` avisa por `onFechado`, a composição incrementa
  `despertarMapa`, e o `WorldMap` chama `repintar()`. Veja "Por que o mapa
  voltava em branco" para o porquê. **Continua obrigatório com o slide**: a
  correção resolveu um bug real em aparelho e não é redundante só porque a
  animação mudou.
- **`onFechado` significa exatamente uma coisa:** houve uma transição real de
  aberto para fechado e a animação dela chegou ao fim. Duas defesas garantem isso,
  e as duas importam:
  1. o efeito guarda a direção anterior num `ref` e **só anima em transição
     real** (`planejarTransicao`) — re-rodar por troca de identidade de prop não
     faz nada. Sem essa saída, um `withTiming(0)` com o progresso já em 0 termina
     com `finished === true` e passa por fechamento, o que realimentaria
     render → efeito → repaint;
  2. a callback compara o **destino daquela animação** (`avisaFechado`), não o
     `aberto` do render. Inverter no meio substitui a animação, e a substituída
     chega com `finished === false`.
  As duas decisões são funções puras, e um teste as dirige por um simulador da
  semântica do `withTiming` — inclusive 30 e 31 toques seguidos (um aviso só
  quando a última volta ao Mundo termina; nenhum quando termina no Discovery).
- Por isso as ações que a composição passa (`onFechar`, `onFechado`,
  `onConfiguracoes`) são **memoizadas com identidade fixa**: a corretude não
  pode depender do React Compiler, que pode desistir em silêncio.

## O que é salvo e o que é recalculado

O jogo é gravado no aparelho com **AsyncStorage**, na chave `@eon/save`, no
formato `SaveV3` (`src/persistence/save.ts`). Saves `SaveV1` e `SaveV2` antigos
continuam sendo lidos e migrados.

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

**Autosave:** um `useMemo` monta o `SaveV3` a partir de
`world.estadoPersistivel`, `aprendizado.perfil`, `onboardingConcluida` e das
conquistas desbloqueadas, e um efeito grava quando essa referência muda. Ou seja,
grava quando muda semente, nível do mar, crescimento, vilas, `growthSequence`,
perfil ou conquistas — e **não** grava por abrir o aparelho, animar, dar zoom,
mostrar aviso (inclusive o banner de conquista) ou alternar telas.

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

## Ver o que a curiosidade causou

Aprender constrói alguma coisa; o jogador precisa **ver** isso. Ao voltar ao
mundo, a câmera vai até a novidade e um aviso curto diz o que nasceu.

```
APRENDI → mundo cresce → (aparelho ainda aberto)
        → jogador volta ao mundo
        → câmera anima até a novidade + aviso por alguns segundos
```

- **Quem escolhe é o engine.** `engine/destaque.ts` recebe `r.adicionados` e
  devolve a novidade mais importante, por prioridade fixa: observatório, mina,
  fonte, casa maior, casa, e depois qualquer outra coisa. Com várias, anuncia a
  escolhida — uma frase que se entende vale mais que uma contagem.
- **O texto fala do mundo**, nunca do sistema: "Uma nova casa surgiu em sua
  vila.", não "1 GrowthElement adicionado".
- **`destaque` é estado de sessão** em `useWorld`: fica ao lado do mundo, **não
  entra no save** e é consumido (`consumirDestaque`) assim que a composição o
  mostra. Por isso acontece **uma vez por aprendizado**, nunca em laço.
- **Curiosidade repetida não dispara nada** — nem chega ao mundo: `aoAprender`
  volta cedo em `'repetida'`. E se um evento não achar lugar, `adicionados` vem
  vazio e não há destaque.
- **Espera o mapa estar à vista.** Com o aparelho aberto o mundo está coberto, e
  durante uma recriação ele nem está montado; o efeito só age com
  `!aprenderAberto && !world.gerando`.
- **A câmera anima** (`focarEm`, em `useMapCamera`): aproxima até 3× o zoom
  mínimo e centraliza o tile em ~650 ms, respeitando os limites do mapa no zoom
  de destino. Cancela a inércia em curso; o gesto do jogador continua livre
  depois.
- **O aviso some sozinho pela própria animação** (`GrowthBanner`), no mesmo
  padrão do `ActionToast`: `withSequence`/`withDelay` do Reanimated, sem
  `setTimeout` — não há timer para limpar. Ele não recebe toque, então não
  atrapalha a navegação.

## Tocar numa construção e lembrar de onde ela veio

A mecânica 1 é recompensa imediata; esta é memória. Tocar numa casa mostra uma
etiqueta pequena ligada a ela por um traço — nada de modal, o mundo continua
sendo o protagonista.

```
construção ─── Casa da vila
               Surgiu quando você aprendeu:
               A cidade perdida que ficou escondida por séculos
```

### A origem viaja com a construção

`GrowthElement.origemConhecimentoId?: string` é um identificador **opaco** para
o mundo: ele guarda, não interpreta. Quem traduz id em título é a composição,
que conhece as duas features — `world` continua sem importar nada de `learning`.

O carimbo é feito **dentro** do engine (`aplicarEventosDeCrescimento` recebe a
origem e repassa a `criarElementoDeCrescimento`), então **tudo que nasce numa
execução recebe o mesmo id**, inclusive a fonte que aparece sozinha quando a
vila amadurece. Carimbar depois, por fora, obrigaria a remontar a lista e teria
como divergir.

- **Modo dev não inventa curiosidade:** cresce sem origem, o campo fica ausente,
  e a construção continua tocável com texto genérico.
- **Sem SaveV3:** o campo é opcional e aditivo, e a conferência do save não
  inspeciona o interior dos `GrowthElement`. Construções de saves antigos
  simplesmente não têm origem e mostram "Construção da sua jornada" — não se
  inventa qual curiosidade as criou.
- **A origem é persistente; a seleção não.** Reabrir o app não deixa nada
  selecionado, mas tocar na mesma casa mostra a mesma curiosidade.

### Como o toque encontra a construção

`engine/selecao.ts` é puro e trabalha em tiles. Para casa, casa maior e fonte
reaproveita os retângulos do `FOOTPRINT` (batem com a arte); mina e observatório
não têm footprint, então têm uma **área tocável própria**, medida pelo desenho
(`mina.png` 17×9 px, observatório 9×8 px em caracteres). Mais ~1 tile de folga
para o dedo.

**Isso é hitbox visual, não regra de colisão**: mexer aqui não muda onde as
construções cabem. Só civilização é inspecionável — árvore, pedra, arbusto,
caminho e chão devolvem `null`.

Com duas candidatas sobrepostas vence a de **maior `y`**, que é a desenhada por
cima — a mesma ordem que o render usa.

### A etiqueta

O ponto da tela é calculado **uma vez, no toque** (`paraTela`, lendo a câmera
daquele instante) — nada de sincronizar uma View com shared values a cada
quadro. Por isso **começar a arrastar ou pinçar fecha a etiqueta**: o gesto
avisa a composição no `onBegin`/`onStart` (só o aviso cruza para o JS; o gesto
continua na thread de UI).

**A geometria é derivada, não tabelada** (`render/calloutGeometria.ts`, pura):

```
construção → âncora (centro da bolinha)
           → balão medido no onLayout (largura e altura reais)
           → lado escolhido pelo espaço livre
           → entrada SEMPRE numa lateral do balão
           → cotovelo ortogonal resolve o desnível
```

Não existe offset feito para um caso. A bolinha, o início da linha e a conta do
balão saem **todos da mesma âncora** — antes a linha vinha do fluxo de layout
(uma row centrada), então ela e a bolinha se desencontravam assim que o clamp
agia ou a altura do card mudava.

- **A linha nunca entra por cima nem por baixo.** O ponto de entrada é a lateral
  oposta ao lado escolhido: balão à direita entra pela borda esquerda, e
  vice-versa. Subir ou descer para caber na tela **não muda o lado** — antes
  mudava, porque a conta buscava a face mais próxima, e o desnível fazia vencer
  o topo ou a base (aquele "fio" vertical).
- **Reta quando dá, cotovelo quando precisa.** Com o desnível dentro de 3 px é
  um segmento horizontal só; passando disso são três, ortogonais
  (horizontal → vertical → horizontal). A dobra fica perto do meio, com um
  mínimo de cada lado para não sobrar um trecho de 2 px grudado num vertical
  enorme.
- **Lado pelo espaço real**, comparado com a largura medida: cabendo dos dois,
  fica no mais folgado. Num telefone estreito, uma construção no meio da tela
  não deixa o balão caber em lado nenhum — aí ele desce (ou sobe) para não
  cobrir a bolinha, **e mesmo assim a conexão continua lateral**: quem liga os
  dois é o cotovelo.
- **A entrada fica na parte reta da lateral:** o `y` é a âncora presa com 14 px
  de folga nas pontas, porque o card tem raio 12 e a linha não pode chegar no
  canto arredondado.
- **Sem piscada:** a altura só existe depois do `onLayout`, então o primeiro
  quadro desenha só o balão invisível, para medir; a cena completa entra com
  fade depois.
- Cada trecho é uma `View` absoluta, com 2 px de folga nas pontas para entrar
  sob a bolinha e sob a borda. Nenhuma biblioteca nova, nenhuma rotação. O
  conjunto tem `pointerEvents="none"`, então tocar noutra construção troca a
  seleção e tocar no chão fecha, sem botão.

**Tap e long press convivem:** `Gesture.Exclusive(toqueLongo, toque)` dá
prioridade ao long press (inspeção técnica do modo dev); o tap só dispara se ele
falhar. Abrir Aprender, abrir Configurações, recriar o mundo ou um novo destaque
fecham a seleção.

## O primeiro uso e as boas-vindas ao Mundo

O primeiro uso começa pelo conhecimento, não pelo mapa:

```
1. abre no DISCOVERY          (aprenderAberto nasce true enquanto aprendidas === 0)
2. aprende a 1ª curiosidade   → o mundo cresce (regra de sempre)
3. World Pulse                → "Algo apareceu no seu mundo." (notícia especial)
4. 1ª visita ao Mundo         → boas-vindas, uma vez; depois, foco da câmera + banner
```

```
aprendidas > 0  &&  !onboardingConcluida  &&  !world.gerando  &&  no Mundo  →  aparece
```

- **Nenhum campo novo no save.** "Já aprendeu" é o perfil; `onboardingConcluida`
  (SaveV2) passou a significar "as boas-vindas ao Mundo já foram vistas". A
  migração antiga (`onboardingConcluida = aprendidas > 0`) já deixa quem aprendeu
  de fora — o fluxo de quem já passou do primeiro aprendizado não muda.
- **Abrir no Discovery não anima nada:** `useProgressoDaNavegacao` nasce do valor
  inicial, e o WorldMap está montado atrás, como sempre. O Pulse dessa primeira
  abertura é escolhido ao montar (`aparelhoEstavaAberto` nasce `false`).
- **A notícia especial é do World Pulse**, não um tutorial: o primeiro
  crescimento da jornada (com as boas-vindas ainda pendentes) vira UMA notícia,
  "Algo apareceu no seu mundo.". Se o Discovery está aberto nesse instante (a
  leitura cobre o feed), o Pulse troca para ela na hora.
- **O foco da câmera e o banner esperam as boas-vindas** serem dispensadas: aí a
  câmera vai até o que nasceu, à vista.
- **Depois de vistas, não voltam** (`onboardingConcluida` vai para o save).
  **Recomeçar a jornada** as traz de volta, junto com o perfil vazio.
- **Não aparecem durante uma recriação** (`world.gerando`).
- Enquanto estão abertas são a **única coisa que aceita toque**, e
  `accessibilityViewIsModal` tira o resto da árvore de acessibilidade.
  "Continuar" só as fecha.
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
SaveV3 → { version: 3, world, learning, onboardingConcluida, achievements }
```

`carregarSave` passa tudo por `migrarParaAtual`: V3 vem direto, V2 é convertida
por `migrarV2`, V1 passa pelas duas (`migrarV2(migrarV1(…))`), e qualquer outra
versão vira "sem save". A regra da migração V1 → V2 é
`onboardingConcluida = perfil.aprendidas.length > 0` — quem já aprendeu alguma
coisa já começou a jornada e não deve ver a apresentação; save antigo com perfil
vazio volta a vê-la, que é o certo para quem ainda não começou. **Saves antigos
não são apagados**: são lidos e convertidos.

## Conquistas (features/achievements)

A primeira conquista é **Primeira casa!** (`first-house`): desbloqueia na primeira
vez que uma casa nasce na jornada, anuncia com um banner global e fica salva.

```
engine de crescimento → r.adicionados
  → useWorld.nascimento           (acumula até ser consumido, como o destaque)
  → composição: assuntoDeCrescimento()   construção → 'casa' (shared/domain)
  → useAchievements.registrarNascimentos()
       ├─ desbloqueadas += first-house   → vai para o save (SaveV3)
       └─ fila += anúncio                → só na sessão
  → AchievementToast                (desce, espera, sobe, avisa o fim)
```

- **O ponto de verdade é o engine.** A detecção lê o `r.adicionados` do
  `aplicarEventosDeCrescimento` — o que de fato nasceu —, nunca uma leitura do
  mapa. `useWorld` expõe isso como `nascimento` + `consumirNascimento`, o mesmo
  contrato de `destaque`/`consumirDestaque`. Acumular até consumir é o que impede
  duas levas de crescimento no mesmo render de perderem um nascimento.
- **`achievements` não importa `world`.** A composição traduz cada construção em
  `AssuntoDoMundo` (vocabulário de `shared/domain`, o mesmo das notícias); a
  regra fala de "casa" sem saber de sprite, tile ou vila. Casa maior também é
  casa.
- **"Uma vez por jornada" não é flag, é regra:** `conquistasAlcancadas` nunca
  devolve o que já está desbloqueado. A segunda casa não faz nada — nem estado
  novo, nem render, nem regravação (a função devolve o mesmo objeto).
- **Vale para qualquer origem**, modo dev inclusive: a conquista é "a primeira casa
  da jornada", não "a primeira casa vinda de uma curiosidade". (Notícias fazem o
  contrário, de propósito: lá o crescimento de teste não pode entupir a fila.)

**Duas metades, dois destinos** — é o que impede o banner de reabrir sozinho:

- `desbloqueadas` é **da jornada**: vai para o save e volta na hidratação;
- a `fila` do banner é **da sessão**: nunca é gravada. O app abre sempre com a
  fila vazia, então nenhuma conquista antiga se anuncia de novo.

Registrar desbloqueia **e** enfileira no mesmo passo: não existe conquista
anunciada que não esteja salva, nem salva que não tenha sido anunciada quando
aconteceu.

**Reset pelo sinal `world.gerando`.** A composição zera as conquistas quando o
mundo começa a ser recriado — cobre Recomeçar jornada e qualquer recriação por um
caminho só. E herda a garantia do autosave: durante a recriação o save seguro não
avança, então o disco nunca guarda mundo vazio com conquista antiga (nem o
contrário).

**Migração V2 → V3.** Save antigo que já tem casa chega com `first-house`
desbloqueada — deduzida do crescimento salvo — e **sem banner**: ela aconteceu
antes desta versão existir, e anunciá-la ao abrir seria mentir o momento.

### O banner

- **Global de verdade:** é desenhado por último, na raiz da composição, com
  `zIndex` alto. O app não tem `Modal` nativo, então nada abre numa janela à
  parte capaz de cobri-lo — ele fica acima do mundo, do feed, da leitura, das
  configurações e da apresentação.
- **Não bloqueia nada** (`pointerEvents="none"`): quem estava lendo ou rolando
  continua. O VoiceOver ouve "Nova conquista: Primeira casa!".
- **Sem `setTimeout`:** entrada, espera e saída são uma `withSequence` só, na UI
  thread, e o fim avisa por `runOnJS`. Se o banner for desmontado no meio (jornada
  recomeçada), a animação é cancelada e o fim nunca dispara. Cada anúncio monta
  um banner novo (`key` pela série), então não há estado de reinício.
- **O fim tira da fila só o anúncio que terminou** (pela série). Um fim atrasado
  do banner de uma jornada velha não derruba um anúncio novo.
- **A arte é pixel art 64×64.** Em `assets/achievements/` estão a original e as
  versões @2x/@3x ampliadas por vizinho-mais-próximo; o Metro escolhe a da
  densidade do aparelho, e o banner a exibe a 64 pt — cada pixel da arte cai
  inteiro na tela, sem o borrão de uma ampliação suavizada. A moldura é 2 pt
  maior que a arte porque, no React Native, a borda come a largura por dentro.
- O destaque de recompensa é o laranja da marca (`accent` nos detalhes,
  `accentLegivel` no texto), o mesmo nos dois temas e o mesmo do World Pulse.

**Para criar uma conquista nova:**

1. uma regra em `engine/regras.ts`;
2. a arte: exporte **um** PNG 64×64 e rode
   `scripts/gerar-sprite-conquista.ps1 -Origem <png> -Nome <nome>` — ele gera os
   seis arquivos (64 pt e 128 pt, em 1x/2x/3x) por vizinho-mais-próximo;
3. uma entrada em `data/achievements.ts`.

O tipo do catálogo exige texto e as duas artes para cada id — esquecer é erro de
compilação, não um banner vazio. (O arquivo de 128 pt a 1x é idêntico ao de
64 pt a 2x; o export guarda um só e os dois apontam para ele.)

### Três lugares, três papéis

```
AchievementToast   → a celebração, no instante do desbloqueio (qualquer tela)
World Pulse        → a vitrine, na próxima entrada no feed (uma vez)
AchievementsScreen → a coleção permanente da jornada (quando a pessoa quiser)
```

Nenhum dos três guarda estado próprio de conquista: todos leem o mesmo
`desbloqueadas` de `useAchievements`. A coleção não comemora — quem faz isso é o
banner; ela é o registro.

### A coleção (AchievementsScreen)

- **Acesso normal, não dev:** Configurações → **Conquistas** (a primeira linha
  da tela, com o progresso "1/1"). Configurações só **dispara** `onConquistas`;
  ela não importa `achievements`. Quem decide que tela abrir é a composição.
- **A coleção abre por cima de Configurações** (zIndex 40 sobre 35), que fica
  aberta embaixo. O `‹` da coleção fecha só ela e a pessoa volta para
  Configurações; o voltar do Android segue a mesma ordem (o último a registrar
  o `BackHandler` é atendido primeiro).
- **Camada de tela cheia, e não `Window`:** a janela embrulha o conteúdo num
  `ScrollView`, e a `FlatList` da coleção lá dentro perderia a virtualização —
  justamente o que deixa a coleção crescer para dezenas de itens.
- **É projeção, não estado:** `montarColecao(ORDEM_DAS_CONQUISTAS, desbloqueadas)`.
  Não existe uma segunda lista para a tela, então recomeçar a jornada bloqueia
  tudo na hora e a hidratação desbloqueia o que veio do save. O save não mudou.
- **Lista vertical, como a de um jogo** (`FlatList`, uma coluna). Cada linha:
  a arte 64×64 numa moldura quadrada à esquerda; à direita o estado
  (DESBLOQUEADA / BLOQUEADA), o nome e a frase. Cabeçalho com "Marcos da sua
  jornada", contador "1 de 1 desbloqueadas" e barrinha laranja — do catálogo
  real, nunca escritos à mão. Não há detalhe: a linha já mostra tudo.
- **Desbloqueada:** a arte como foi feita, moldura laranja, nome e frase.
  **Bloqueada:** a silhueta (`imagemBloqueada`), "???" e "Ainda não
  descoberta." — sem cadeado, sem revelar nome nem condição. Isso já deixa
  espaço para conquistas secretas sem campo novo.
- **A silhueta é pixel art também**, gerada pelo
  `scripts/gerar-sprite-conquista.ps1` junto com a arte (`<nome>-bloqueada`):
  a mesma imagem sem cor, em três tons baixos entre o grafite e o cinza da
  marca. Para uma silhueta desenhada à mão, basta substituir os três arquivos.
- **A linha junta catálogo e jornada** (`ConquistaNaLista`: id, título,
  descrição, imagem, imagemBloqueada, desbloqueada). O `desbloqueada` vem
  sempre da coleção — nunca é um campo do catálogo.
- **UI moderna, sprite retrô:** fontes, bordas e botões seguem os tokens da
  paleta; só a arte é pixel art.

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
            world.avancarProgressao({ aprendidas: perfil.aprendidas })
                                      │
                 marcosPendentes(...)  →  aplicarMarcos(...)  → cabana, fogueira…
```

- **A ponte mora em `app/index.tsx`** e em nenhum outro lugar. `learning` não
  importa `world` e `world` não importa `learning`; só a composição vê as duas.
- **A composição não interpreta nada.** Ela passa a jornada (as aprendidas, em
  ordem) e o engine do mundo decide o que ela constrói. Qualquer
  `if (tema === …)` em `app/` é erro.
- **Quem diz o que é novo é o engine de learning.** `LearningScreen` embrulha
  `aprender` e só chama `onAprendido` quando o resultado é `'aprendida'`.
  Curiosidade repetida devolve `'repetida'` e a ponte volta na hora: nada
  avança, nada nasce.
- **O mundo cresce na hora do APRENDI**, com o aparelho ainda aberto.
  "Ver no mundo" não faz o mundo crescer: ele só fecha o aparelho (com a mesma
  animação de sempre) para revelar o que já aconteceu. Navegação não é regra de
  domínio.
- **`useWorld.avancarProgressao(progresso)`** é a porta do conhecimento. O
  crescimento **comum** por evento (`aplicarEventos`: casas, casa maior, mina,
  observatório) continua existindo, mas hoje só o modo dev o usa
  (`aplicarCrescimentoDev`). As duas leem o estado **dentro** do updater
  (`setEstado((s) => …)`), para duas aprendizagens seguidas não se atropelarem,
  e usam o mesmo gerador (semente + `growthSequence`). O `rng` tem estado, então
  o updater precisa rodar uma vez só — hoje roda, porque o app não usa
  `StrictMode`.

## Progressão da vila (engine/marcos.ts)

O crescimento da civilização deixou de ser "cada curiosidade gera um prédio do
tema dela" (10 de astronomia = 10 observatórios). Agora ele é uma **progressão
acumulada**, por **degraus** — cada um acontece uma vez, num limiar do total
aprendido.

> **Regra conceitual:** a vila cresce tanto **adicionando** novas construções
> (para os lados) quanto **evoluindo** construções existentes (para cima, no
> mesmo lugar); prédios especiais futuros também poderão ter tiers e upgrades.

```
mundo selvagem ──1──▶ CABANA            criar    marco-inicial (funda a vila)        ┐
               ──3──▶ FOGUEIRA          criar    marco-inicial (no coração da vila)  │ ACAMPAMENTO
               ──5──▶ 2ª cabana         criar    comum         (anel das casas)      ┘ sem caminho
               ──8──▶ casa              criar    comum         (anel das casas)      ┐
                      + trilhas nível 1 caminhos               (finas, discretas)    │ ASSENTAMENTO
               ──12─▶ 1ª cabana → casa  evoluir  evolucao      (criada por primeira-cabana)
                      + trilhas nível 2 caminhos               (marcadas; terreiro)  ┘
               ──16─▶ 2ª cabana → casa  evoluir  evolucao      (criada por segunda-cabana) ┐
                      + rede nível 3    caminhos               (casas ligadas entre si)    │ VILA
               ──20─▶ casa → casa grande evoluir evolucao      (a casa mais antiga que caiba)
                      + rede nível 4    caminhos               (madura)                    ┘
```

A sequência a partir da 2ª cabana é **provisória**, para o playtest de 20
curiosidades. O estágio (`estagioDaVila`, em settlements.ts) sai do nível dos
caminhos: 0 = acampamento, 1–2 = assentamento, 3–4 = vila.

- **Catálogo de dados** (`MARCOS`): `id` estável (vai para o save), `categoria`
  (`marco-inicial`, `comum`, `evolucao`, e no futuro `marco-tematico`),
  `condicao` (hoje só `totalAprendido`), **`efeito`**, `unico`, `nome`, `frase`
  (notícia) e `historia` (toque). Degrau novo é uma entrada aqui.
- **Três efeitos** (`EfeitoDoMarco`), sem `if` por tipo de prédio (o terceiro,
  `caminhos { nivel }`, sobe a maturidade da rede — veja "Caminhos da
  progressão", abaixo):
  - `criar` `{ sprite, lugar }` — lugares `fundaVila`, `centroDaVila`,
    `anelDasCasas`, `anelDasMaiores` (`colocarMarco`, sempre com o sprite real:
    o espaço no chão é o dele). A 2ª cabana é um `criar` com o mesmo sprite da
    1ª: o id do degrau é que a faz ser outra construção;
  - `evoluir` `{ de, para, alvo }` — a construção do tipo `de` vira `para` no
    **mesmo lugar**. Serve para qualquer tier (cabana → casa → casa grande, e no
    futuro observatório → avançado, mina → complexo mineiro, prédios centrais).
- **Alvo da evolução, determinístico** (`AlvoDaEvolucao`): `criadaPor` pega a
  construção que um degrau de criação fez nascer (a identidade dela é o
  `marco.id` da criação, que nunca muda); `maisAntiga` pega a mais antiga do
  tipo `de` na ordem da lista do mundo (a ordem de criação, que vai para o
  save). Nada de sorteio nem relógio. No degrau 20, a mais antiga é a 1ª cabana
  (já casa desde o 12): o primeiro abrigo é o que mais cresce.
- **Evoluir não apaga a história.** Posição, `marco` (criação: gatilho e
  contribuintes), `origemConhecimentoId` e `settlementId` ficam; mudam o
  `tipo` e a aparência (orientação/variante, para a casa diagonal), e entra um
  capítulo em `evolucoes: [{ marco, gatilho, contribuintes, de, para }]`. Não
  nasce uma segunda construção por cima: a lista troca o elemento no mesmo índice.
- **Cabe crescer?** (`cabeEvoluir`): o espaço do tipo novo precisa de terreno
  firme longe da água, não cruzar outra construção (sem folga: chegar perto
  pode, subir por cima não), e ficar fora da praça e da rua. Footprint, toque e
  desenho seguem o `tipo`, então se atualizam sozinhos. Se não couber, o degrau
  fica pendente — com `maisAntiga`, tenta a próxima candidata.
- **`marcosPendentes(progresso, crescimento)`** é a regra, pura e
  **idempotente**: o que já aconteceu — criado **ou** evoluído
  (`degrausQueJaAconteceram`) — nunca volta. Reabrir o app, reprocessar o save ou
  aprender uma repetida não duplica nada; o que ficou sem lugar é tentado de
  novo na próxima vez. Chegar a vários degraus de uma vez (um save antigo) dá o
  mesmo resultado que chegar um por um: o catálogo cria antes de evoluir.
- **A origem é a verdade da jornada** (as N primeiras aprendidas), mesmo que o
  degrau aconteça depois.
- **Tocar:** `historiaDoElemento(elemento)` devolve a criação, as evoluções e o
  capítulo `atual` (o mais recente). O balão conta o `atual` — numa cabana que
  virou casa: "Este foi o primeiro abrigo do seu mundo. Com novos conhecimentos,
  ele cresceu." e "12 descobertas, a última: …". A história inteira fica pronta
  para uma tela de histórico futura.
- **Notícias:** criação e evolução viram notícia do World Pulse e levam a câmera
  até lá (`destaque`); só a criação conta como "nascimento" para as conquistas.
- **Save:** nenhum formato novo. `marco` e `evolucoes` são campos opcionais do
  `GrowthElement`, que já é salvo inteiro. Os ids da sequência anterior do
  playtest (`vila-casa-5`, `vila-casa-grande-12`, `vila-casa-16`,
  `vila-casa-grande-20`) ficam num catálogo **legado**: não acontecem mais, mas
  quem já os tem no save continua lendo a própria história. A casa dos 8 manteve
  o id (`vila-casa-8`). Recomeçar a jornada recria o mundo, e tudo volta a ser
  conquistado.
- **Lugar dos marcos:** a cabana usa as regras da primeira vila (terreno, água,
  espaço, centralidade) para escolher o centro, cria o `Settlement` e se põe no
  anel das casas. A fogueira vai o mais perto possível do centro, **dentro** da
  praça reservada — é o único, junto da fonte, que pode ocupá-la (`NO_CORACAO`).
  Não nasce fonte pela progressão: o coração da vila já é da fogueira.
- **Onboarding:** a cabana é o "algo apareceu no seu mundo" do primeiro uso — a
  notícia especial do Pulse, o foco da câmera e a conquista "Primeira casa!"
  (que aceita a cabana como primeira casa).
- **Temas não sumiram, mudaram de papel.** As influências continuam no perfil
  (`porInfluencia`, `porTema`); `gerarEventosDeCrescimento` e o crescimento por
  evento continuam no código. Eles são a base dos marcos temáticos e das
  combinações — só não constroem mais um prédio por curiosidade.

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
'acesso', forca? }`) é a rede de terra batida. Ela pertence à civilização, como
as construções; a natureza não sabe dela. Há dois jeitos de ela nascer.

### Caminhos da progressão (`redeDaVila`)

- **Nascem com a vila, não antes.** Cabana + fogueira + cabana ainda é um
  acampamento: nenhum caminho. A rede aparece e amadurece pelos degraus
  `caminhos` do catálogo (8, 12, 16 e 20), que sobem `Settlement.nivelDosCaminhos`
  (0 a 4). Quanto cada nível desenha fica em `NIVEIS_DA_REDE`.
- **Amadurece pela presença, não pela largura.** "Primeiro o caminho aparece,
  depois se firma, e só por último se organiza." O traçado tem sempre **um
  tile**; cada nível define `espessura` (largura visual em fração de tile, com
  teto de 1 tile: ≈2 px nas primeiras trilhas, ≈3 px nos 20), `cobertura`
  (quanto da trilha já é terra — o resto continua grama; a terra aparece
  primeiro no meio, em tufos), `opacidade`, `curva` (quanto o traçado ondula:
  menos nos níveis altos — é a "organização") e o `terreiro` (pequeno, ralo:
  1,2 → 1,8 tile). Esses três valores visuais viajam em cada `PathTile`
  (`forca`, `espessura`, `cobertura`), e o desenho os interpreta.
- **Refeita por inteiro** (`comRedeRefeita`, em growthElements) sempre que a
  vila muda — construção nova, evolução ou nível. Determinística (seed +
  construções + nível), então sempre combina com a vila de agora; por isso a
  evolução não precisa desviar da rua (`cabeEvoluir` não olha caminho).
- **Trajeto orgânico:** rota em 8 direções sobre um campo de custo suave
  (`ONDULACAO`, colinas invisíveis de ~6 tiles), depois suavizada e ondulada de
  lado (`AMPLITUDE_DA_CURVA`, `ONDA_DA_CURVA`) com a onda indo a zero nas pontas,
  e só então de volta a tiles — sem entrar em construção nem água. Passos
  diagonais ganham o tile da quina (`continua`), para a trilha fina não se partir.
- **Forma da rede:** cada construção liga a porta ao fogo — ou à trilha que já
  existe, o que for mais barato (galhos, não tentáculos); as duas mais perto do
  fogo são os eixos (um pouco mais legíveis, não mais largos). Do nível 2 em
  diante, um terreiro gasto em volta do fogo; do 3, cada casa também se liga à
  vizinha mais próxima.
- **Desenho** (`render/pathPixels.ts`): pixel a pixel, como o terreno — a
  presença dos tiles é interpolada com tremor suave, e a `espessura` vira o
  limiar dessa presença (1 tile corta em 0,5; meio tile, em 0,75). Dentro da
  trilha, a `cobertura` decide quais pixels já são terra, por um pontilhado em
  tufos mais cheio no meio (`TERRA_NA_BEIRA`, `TUFO`); a `forca` é a
  opacidade. Trilha nova: grama gasta pontilhada. Madura: terra batida fina.
- **O terreiro é o embrião da praça.** Quando a fogueira evoluir para fonte (um
  degrau `evoluir { de: 'fogueira', para: 'fonte' }` — ainda não está no
  catálogo), `aplicarMarcos` registra `vila.fonte` no lugar do fogo: a praça
  nasce de um chão que já existia, e as regras de praça (`areaDaPraca`,
  `referenciaDaVila`) passam a valer a partir da fonte. A fonte não aparece do nada.

### Caminhos do crescimento por evento (modo dev)

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

## Escala do mundo (engine/escala.ts)

**A cabana é a unidade de escala.** Sprites têm tamanho fixo em pixels de arte
(a cabana, 22×15 px); o que se ajusta é quanto mundo existe em volta deles, e
isso mora num arquivo só, `engine/escala.ts`:

| Constante | Hoje | O que muda |
|---|---|---|
| `PIXELS_POR_TILE` | 4 (era 3) | relevo maior ou menor em volta da cabana, sem gerar tile a mais |
| `TILES_LARGURA` / `TILES_ALTURA` | 480 × 320 | quanto mundo existe (mais ilhas, mais espaço) — geração e colocação crescem junto |

- **O mapa é uma imagem de `TILES × PIXELS_POR_TILE`** (1920×1280 hoje, 9,8 MB;
  era 1440×960, 5,5 MB). O iPhone já fechou o app por memória na recriação do
  mundo (veja "Recriar o mundo é em duas fases"): suba devagar.
- **Nada precisa de recalibração ao mudar `PIXELS_POR_TILE`:** o espaço das
  construções sai do tamanho da arte (`ARTE_PX` em `footprint.ts`, via
  `emTiles`), e o toque também (`selecao.ts`). O resto (colocação, vilas,
  natureza) é medido em tiles e não depende de pixel.
- **Efeitos colaterais conhecidos, de propósito:** as árvores (PNGs pequenos,
  espaçadas em tiles) ficam mais esparsas e menores em relação ao relevo — a
  arte delas vai ser redesenhada maior; e a vila se espalha mais em pixels,
  porque os anéis e a praça são medidos em tiles.
- **O mundo gerado não muda:** a mesma seed dá os mesmos tiles de antes. Só o
  DESENHO mudou — saves antigos continuam válidos, e nada construído cai na água.

`ESCALA_MUNDO = W / TILES_DO_PROTOTIPO` (hoje 3,2) compara os tiles com o mundo
original (150x100) e mantém tudo calibrado:

- **Frequências do ruído são divididas pela escala** (`REGRAS.frequencia`). Sem
  isso, um mundo maior só ganharia *mais* ilhas do mesmo tamanho; dividindo, as
  ilhas ficam maiores em tiles. É o que dá "respiro" e faz os sprites PNG
  parecerem proporcionais ao terreno.
- **Medidas em tiles escalam junto:** largura de praia e água rasa em
  `rules.ts`; em `growthPlacement.ts` as distâncias são escritas em **unidades**
  (1 unidade = 1 tile do mundo 150x100) e convertidas por `unidades()`. Assim,
  mudar `W`/`H` não exige recalibrar as regras de colocação.
- Custo por mundo (Node, e entre parênteses sem JIT, perto de um interpretador
  como o Hermes): gerar ~80 ms (1,4 s), desenhar o terreno ~110 ms (1,3 s — era
  0,5 s com blocos de 3×3). Só acontece quando o mundo muda (mundo novo, semente,
  nível do mar) e ao abrir o app — colocar elementos não paga nada disso.
- No zoom mínimo cada pixel de arte ocupa ~0,66 ponto de tela; com 3 pixels
  físicos por ponto no iPhone, continua nítido.

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

## Identidade e tema (Claro / Escuro / Automático)

A identidade oficial é pequena: **grafite + laranja + branco + preto + cinza**,
e o vermelho só para perigo. O laboratório de seis paletas acabou e foi removido.

```
MARCA (shared/theme/marca.ts)   → as sete cores brutas, e nenhuma outra
  #26252C grafite   #C66320 laranja escuro   #F27927 laranja
  #000000 preto     #FFFFFF branco           #9BADB7 cinza
  #E5484D perigo (exceção semântica)
        ↓
temaClaro / temaEscuro (temas.ts) → tokens semânticos, derivados da marca
        ↓
useColors()                        → o que os componentes leem
```

- **Claro e escuro são a mesma identidade**, não duas paletas: o laranja, a
  barra (grafite, fio e seletor laranja) e o perigo são iguais nos dois. Muda o
  chão: branco com grafite no claro, grafite com preto no escuro.
- **Nenhum hex novo.** Todo token é uma cor da marca, a marca com alfa
  (`comAlfa`) ou uma mistura entre duas cores da marca (`misturar`, ex.: o
  painel escuro é grafite com 6% de branco). Há teste conferindo isso token a
  token.
- **Componentes pedem papel, não cor:** `ink`, `muted`, `line`, `accent`,
  `accentStrong`, `accentLegivel`, `accentTexto`, `perigo`… Fora de `marca.ts`,
  nenhum componente de interface tem cor literal (há uma auditoria por grep).
  O que continua com cor própria é conteúdo: biomas do mapa, cores dos temas
  educacionais (`CAPA_DO_TEMA`), `corAtmosfera` das curiosidades e sprites.
  O branco sobre fotografia vem de `MARCA.branco`: ali quem manda é a foto.
- **Contraste medido, não chutado** (WCAG, com teste): texto branco sobre o
  laranja fica em 2,6:1, então o botão primário usa **texto grafite** (5,5:1).
  O laranja escuro puro como texto sobre branco fica em 4,0:1 e o branco sobre
  o `#E5484D` puro em 3,9:1 — por isso o laranja-texto do claro e o fundo do
  botão destrutivo são a mesma cor com 10% de preto (4,8 e 4,7:1). Derivados,
  não cores novas.

**Aparência** (Configurações → Aparência): `'system' | 'light' | 'dark'`.

- **Automático** (padrão) segue o iOS ao vivo — `useColorScheme` (o `app.json`
  tem `userInterfaceStyle: automatic`). **Claro** e **Escuro** ignoram o sistema.
  Trocar é imediato: a store é um `useSyncExternalStore`, e só repinta quem lê
  cor — o mundo, o terreno, o Skia, a câmera e o feed não são recriados.
- **É preferência do APP, não da jornada.** Mora em `@eon/preferences`
  (`persistence/preferencias.ts`), longe do `@eon/save`: não sobe a versão do
  save e **"Recomeçar jornada" não a toca**. Escritas em fila, como as do save.
  Valor estranho no disco vira Automático.
- **Sem piscar tema errado:** a splash nativa fica segurada (`_layout`) até o
  `AppScreen` ler save e preferência juntos; a aparência é aplicada antes do
  primeiro render de verdade.
- **Barra de status:** acompanha o tema efetivo (ícones claros no escuro,
  escuros no claro). Com o feed à vista ela fica clara sobre a atmosfera da
  foto; a coleção de Conquistas e a leitura devolvem a do tema.
- **O mapa não muda.** Terreno, sprites e caminhos têm a própria paleta
  (`world/render/palette.ts`) — nada de tint nem filtro por tema.

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
  flutuante, então fica centralizado sem cobrir a barra de ações.
  - embaixo, 3 s: última ação do jogo (`useWorld`)
  - no topo, 5 s: modo desenvolvedor ativado/desativado (`useDevMode`)
- Os ícones hoje são símbolos de texto. Para usar pixel art, coloque os PNGs em
  `assets/ui/` e troque as linhas em `shared/ui/icons.ts` por `require(...)`.

## Modo desenvolvedor

- Ativação secreta: o pequeno `✦` no pé da tela Configurações. 5 toques
  seguidos (no máximo 1,5 s entre um e outro; se passar, a contagem recomeça)
  ativam; mais 5 desativam. O estado fica em `useDevMode` e **não é salvo**.
- Com o modo ativo:
  - a tela Configurações mostra a seção "Desenvolvedor", com a **Simulação da
    jornada** em cima e o **Terreno** embaixo (semente + "Gerar com esta
    semente", slider de nível do mar e a legenda das cores). Os botões de
    crescimento por evento (povoamento, infraestrutura…) saíram: a jornada se
    testa pelo simulador;
  - com o mundo à vista, um controle flutuante do simulador ("Jornada 9/20",
    +1, Marco, ▶/⏸) fica no alto do mapa;
  - toque longo no mapa mostra no aviso de baixo o bioma, a altitude e a umidade
    do tile tocado (`useMapCamera.paraMapa` desfaz o zoom/deslocamento e
    `engine/inspect.ts` monta o texto).
- "Novo mundo" e "Gerar com esta semente" mantêm o nível do mar atual; o slider
  mantém a semente atual.

### Simulação da jornada

Para testar a progressão real (0 a 20) sem ler curiosidade por curiosidade.
**Não é um sistema paralelo:** cada passo faz o que o APRENDI faz —
`aprendizado.aprender(curiosidade)` e, se deu 'aprendida', o mesmo `aoAprender`
da composição. Daí em diante é a produção: progressão, criação, evolução,
caminhos, câmera, banner, notícias, World Pulse, save.

- **Qual curiosidade:** a primeira ainda não aprendida na ordem do catálogo
  (`paraDescobrir`, a do feed). Sem sorteio; repetida não existe.
- **Um passo por render** (`useSimuladorDaJornada`, em settings/hooks, genérico:
  não conhece learning nem world): o aprendizado real parte do perfil do render,
  então dois no mesmo instante se atropelariam. Um estado só —
  `{ alvo, intervalo } | null`: próxima = atual + 1; até o próximo marco = o
  limiar; jornada inteira = o limite, 1,7 s entre passos. Pausar volta a `null`
  e cancela a espera; como cada passo é um aprendizado inteiro, nunca sobra
  estado pela metade. Continua de onde a jornada está.
- **Espera o mundo:** não anda durante uma recriação nem com as boas-vindas na
  frente (segue depois do "Continuar").
- **Para assistir:** os botões fecham Configurações e Discovery antes de andar.
- **Linha do tempo e próximo marco** saem do catálogo real (`etapasDaJornada`,
  que agrupa `MARCOS` por limiar; os rótulos são o `nome` de cada degrau). O
  estado de cada limiar usa a mesma regra do motor (`quemJaAconteceu`): ✓
  aconteceu, … alcançado mas sem lugar ainda, ○ ainda não. "/20" é o maior
  limiar do catálogo.
- **Reiniciar simulação** pausa e chama o MESMO `recomecarJornada` do app (as
  fases seguras de recriação do mundo).

## Mapa nítido e barato de atualizar

Cada tile ocupa `ART` x `ART` pixels de arte (`PIXELS_POR_TILE`, hoje 4×4); com
`W`/`H` isso dá o tamanho do buffer. Tudo é desenhado com
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

**O terreno é desenhado pixel a pixel, não tile a tile** (`buildPixels.ts`).
Nenhum tile vira bloco chapado:

- **Costa:** a altitude é interpolada dentro do tile (mais um tremor leve), e a
  água é onde ela fica abaixo do mar — a costa segue a curva do relevo, não a
  escada dos tiles. Mar raso ou fundo: a mesma regra da geração, com a
  distância até a terra interpolada por pixel.
- **Biomas:** a umidade é interpolada e lida num ponto deslocado por um campo
  suave de alguns tiles (`DISTORCAO`) — é o que desmancha as bordas retas que o
  ruído do mundo às vezes forma. Praia e lago são lidos do tile nesse mesmo
  ponto.
- **Manchas de tom:** um ruído suave de alguns tiles (`MANCHA`) escolhe claro,
  base ou escuro, com pontilhado fino só na borda da mancha — poucas, e mais
  escuras que claras.
- **Custo sob controle:** a conta completa só é feita a até `RAIO_DA_FRONTEIRA`
  tiles de alguma fronteira; um tile "calmo" preenche seus pixels de uma vez.
  Cada cor é escrita como um Uint32. Os campos suaves têm hash só nos pontos da
  grade do ruído.
- **O desenho não muda o mundo:** tipos de tile, colocação e save são os
  mesmos; perto da costa o desenho pode diferir do tile em até ~1,5 tile, e as
  construções ficam a pelo menos `MARGEM_AGUA` tiles da água.

Por cima disso, o detalhe esparso de sempre:

- **`chance` + `motivos`**: chance de o tile receber **um** motivo — um desenho
  fixo de 2 a 3 pixels: tufo de grama, folhas caídas, capim seco, pedrinha,
  rachadura (nas duas diagonais) ou onda curta. Motivos não são desenhados em
  tiles de costa, para não sujar o litoral.
- **Costa direcional (top-down inclinado):** todo pixel de terra que encosta na
  água vira areia — é a linha de costa nítida. Já a faixa azul-escura
  (`LINHA_COSTA`) só aparece no pixel de **água logo abaixo da terra**. Isso
  sugere a "face" da ilha vista de cima e de leve pela frente, em vez de um
  contorno completo.
- Tudo vem de `hash2(x, y, seed)`: mesma seed, mesmo terreno.

**Sprites:**

- `arvore`, `pinheiro`, `cacto`, `acacia`, `mina` e `fonte` usam os PNGs de
  `assets/images/world/sprites/`, registrados em `render/spriteAssets.ts` e
  carregados uma vez por `hooks/useSpriteImages.ts` (um `useImage` por arquivo,
  em ordem fixa por causa da regra dos hooks).
- **Pastas dos sprites:** `arvores/` (árvore, pinheiro, acácia, cacto), `casas/`,
  `marcos/` (cabana, fogueira), `construcoes/` (fonte, mina) e `old/`. **Todo
  sprite substituído vai para `old/`** em vez de ser apagado; nada ali é
  carregado (o Metro só empacota o que tem `require`). Os arquivos e as chaves
  de imagem têm o nome da **arte**; o engine continua com o nome do **papel** —
  o papel `arvore` é desenhado com `arvores/oak_tree.png` (23×24 px) e as
  variantes `oak_tree_v2.png` (20×24 px) e `oak_tree_v3.png` (24×22 px), via
  `ARTE_DO_PAPEL` em `spriteAssets.ts`. Com mais de uma arte, cada uma tem um
  peso (hoje 50%, 25% e 25%), e a escolha sai da **posição** do
  elemento (hash) — a mesma árvore é
  sempre a mesma arte, sem sorteio. Variante nova de qualquer papel é uma linha
  a mais ali. A árvore antiga (11×8) está em
  `old/arvore.png`.
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
