# Capas das curiosidades

Imagens de capa dos cards do feed da aba **Aprender**.

- **Orientação:** vertical. O card é recortado em 3:4 (`contentFit: 'cover'`),
  então o assunto principal deve ficar na **metade de cima** — a base fica coberta
  pelo degradê escuro onde entra o título.
- **Tamanho sugerido:** 900 × 1200 px (chega para telas @3x sem pesar).
- **Formato:** `.jpg` para fotos, `.png` para arte com transparência.
- **Nome do arquivo:** igual ao `id` da curiosidade, por exemplo
  `teste-natureza-1.jpg`.

- **Formatos que o Metro empacota:** `jpg`, `jpeg`, `png`, `webp`, `gif`, `bmp`,
  `svg`. **`.avif` não entra** — converta antes (as capas de hoje incluem uma que
  veio assim e foi convertida para `.jpg`).

Depois de colocar o arquivo aqui, registre-o em
`src/features/learning/presentation/coverImages.ts`:

```ts
const CAPAS: Partial<Record<CuriosityId, ImageSourcePropType>> = {
  'teste-natureza-1': require('../../../../assets/images/learning/covers/teste-natureza-1.jpg'),
};
```

Enquanto uma curiosidade não tiver capa, o card usa a cor e o símbolo do tema
(`presentation/coverTheme.ts`) — o layout não muda quando a imagem chegar.
