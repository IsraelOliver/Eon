# Imagens das curiosidades

A capa que aparece no card do feed. Uma imagem por curiosidade.

- **Nome do arquivo:** igual ao `id` da curiosidade — `aurora-boreal.jpg`.
- **Orientação:** vertical. O card recorta em 3:4 (`contentFit: 'cover'`), então
  o assunto deve ficar na **metade de cima**: a base some sob o degradê escuro
  onde entra o título.
- **Tamanho sugerido:** 900 × 1200 px (chega para telas @3x sem pesar).
- **Formato:** `.jpg` para fotos, `.png` para arte com transparência.
  O Metro empacota `jpg`, `png`, `webp`, `gif`, `bmp` e `svg` — **`.avif` não**,
  converta antes.

Depois de colocar o arquivo aqui, aponte para ele no bloco da curiosidade, em
`src/features/learning/data/curiosities.ts`:

```ts
capa: require('../../../../assets/curiosities/aurora-boreal.jpg'),
```

O `require` precisa ser escrito assim, com o caminho literal: o Metro empacota
as imagens lendo o código, então caminho montado em tempo de execução não
funciona.

Sem `capa`, o card usa a cor e o símbolo do tema
(`src/features/learning/presentation/coverTheme.ts`) — o layout é o mesmo, então
acrescentar a imagem depois não muda nada de lugar.
