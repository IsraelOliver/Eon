# Arquitetura do Eon

O app é organizado por **funcionalidade** (feature). Cada funcionalidade separa
regras, desenho e interface em camadas que só dependem "para baixo".

```
app/                         → rotas do expo-router (só telas, sem lógica)
  _layout.tsx                → raiz dos gestos, barra de status e pilha sem cabeçalho
  index.tsx                  → tela: mapa em tela cheia + aviso + botões flutuantes
src/
  features/
    world/                   → tudo sobre o mundo procedural
      engine/                → lógica pura (sem React, React Native ou Skia)
        types.ts             → tipos: World, Element, Tile, ThemeKey, Theme, Resultado…
        noise.ts             → hash, value noise, fBm, normalizar, gerador aleatório
        rules.ts             → REGRAS do mundo (nível do mar, montanha, umidade, praia) e nomes
        generate.ts          → gera o mundo: ruídos, ilha, oceano/lago, distâncias, biomas
        themes.ts            → TEMAS: onde cada curiosidade pode surgir e com que nota
        placement.ts         → aprender(), esquecer(), revisar() (+ semear e contagem)
      render/                → transforma o mundo em pixels (sem React)
        palette.ts           → cores do terreno, paleta dos sprites, modo pergaminho
        sprites.ts           → desenhos dos sprites em texto
        buildPixels.ts       → buffer RGBA 450x300: terreno + elementos
      components/            → peças visuais (React Native + Skia)
        WorldMap.tsx         → mapa em tela cheia (Skia), nítido, com gestos de câmera
        ActionToast.tsx      → aviso da última ação, embaixo no centro, some após ~3 s
        LearnMenu.tsx        → botão de menu (inferior esquerdo) + janela "Aprender"
        SettingsMenu.tsx     → engrenagem (superior esquerdo) + janela "Configurações"
        ThemeButtons.tsx     → botões dos 4 temas com contador
      hooks/
        useWorld.ts          → estado do mundo e elementos; liga engine, render e componentes
        useMapCamera.ts      → câmera: arrastar, pinça, inércia e limites (shared values)
  shared/                    → o que qualquer funcionalidade pode usar
    theme/colors.ts          → cores da interface (claro/escuro)
    ui/Button.tsx            → botão reutilizável
    ui/FloatingButton.tsx    → botão quadrado flutuante num canto (respeita a safe area)
    ui/Window.tsx            → janela base: fundo escurecido, fade, título, conteúdo, "Fechar"
    ui/icons.ts              → ícones da interface (único lugar para trocar por pixel art)
```

## Fluxo de dados

```
toque no botão → componente chama função recebida por props
              → useWorld chama o engine (função pura) → novo estado
              → render/buildPixels gera o buffer RGBA
              → WorldMap transforma o buffer em imagem Skia e desenha
```

## Regras de código

1. **`engine/` nunca importa React, React Native ou Skia.** Assim as regras podem ser
   testadas no Node e reaproveitadas (servidor, outro app). `render/` também é puro.
2. **Componentes não contêm regras do mundo.** Eles só mostram dados e chamam as
   funções que vêm do hook `useWorld`.
3. **Um arquivo = uma responsabilidade.** Arquivos pequenos.
4. **Não crie pastas vazias nem arquivos para funcionalidades futuras.**
5. As funções do engine **não alteram** a lista recebida: devolvem uma nova
   (`Resultado = { elementos, mensagem }`). Isso é o que o React precisa para
   perceber a mudança.
6. `app/` só tem rotas. Lógica vai para `src/features/<funcionalidade>`.
7. `shared/` não importa nada de `features/`.

## Onde mexer para…

| Quero…                                  | Arquivo                          |
| --------------------------------------- | -------------------------------- |
| Mudar nível do mar, biomas, praias      | `engine/rules.ts`                |
| Mudar onde um tema faz algo surgir      | `engine/themes.ts`               |
| Mudar quanto o esquecimento apaga       | `engine/placement.ts`            |
| Mudar cores do mapa ou sprites          | `render/palette.ts`, `sprites.ts`|
| Mudar cores/botões da interface         | `shared/theme`, `shared/ui`      |
| Trocar os ícones (gear, menu)           | `shared/ui/icons.ts`             |
| Mudar o que aparece numa janela         | `LearnMenu.tsx`, `SettingsMenu.tsx` |

## Interface sobre o mapa

- A tela é só o mapa. Por cima dele há dois `FloatingButton` (engrenagem no canto
  superior esquerdo, menu no inferior esquerdo) e o `ActionToast`.
- **Toda janela usa `shared/ui/Window.tsx`.** Ela usa o `Modal` do React Native
  (`transparent` + `animationType="fade"`), então o fundo escurecido e a animação
  existem num lugar só. Nova janela = novo componente que passa `title` e `children`.
- Cada menu (`LearnMenu`, `SettingsMenu`) guarda o próprio estado aberto/fechado,
  junto com o botão que o abre. As ações **fecham a janela** antes de rodar, para o
  jogador ver o resultado no mapa.
- O aviso reaparece a cada ação graças ao `idMensagem` do `useWorld` (muda a cada
  ação, mesmo que o texto seja igual). Ele tem margens laterais iguais ao espaço do
  botão flutuante, então fica centralizado sem cobrir o botão de menu.
- Os ícones hoje são símbolos de texto. Para usar pixel art, coloque os PNGs em
  `assets/ui/` e troque as linhas em `shared/ui/icons.ts` por `require(...)`.

## Mapa nítido

O mundo tem 150x100 tiles; cada tile vira 3x3 pixels de arte (450x300).
`WorldMap` cria uma `SkImage` a partir do buffer e a desenha com
`sampling={{ filter: FilterMode.Nearest }}`, então cada pixel vira um quadrado
sem suavização em qualquer zoom.

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
