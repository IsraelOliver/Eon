import {
  AlphaType, ColorType, FilterMode, Image, MipmapMode, Skia, type SkImage,
} from '@shopify/react-native-skia';
import { useRef } from 'react';

import { useSpriteImages } from '../hooks/useSpriteImages';
import { ART } from '../render/buildPixels';
import type { RenderElement } from '../render/renderElements';
import { imagemDoElemento } from '../render/spriteAssets';
import { construirSprite } from '../render/spriteBuffers';

// "Nearest" = pixels quadrados em qualquer zoom
const NITIDO = { filter: FilterMode.Nearest, mipmap: MipmapMode.None };

type Buffer = { imagem: SkImage; largura: number; altura: number; deslocX: number; deslocY: number };

/** Fallback dos sprites sem PNG (pedra, arbusto): desenho em caracteres. */
function obterBuffer(cache: Map<string, Buffer>, el: RenderElement): Buffer | null {
  const chave = el.tipo;

  const guardada = cache.get(chave);
  if (guardada) return guardada;

  const sprite = construirSprite(el.tipo);
  const imagem = Skia.Image.MakeImage(
    { width: sprite.largura, height: sprite.altura, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
    Skia.Data.fromBytes(sprite.pixels),
    sprite.largura * 4,
  );
  if (!imagem) return null;

  const pronta: Buffer = {
    imagem,
    largura: sprite.largura,
    altura: sprite.altura,
    deslocX: sprite.deslocX,
    deslocY: sprite.deslocY,
  };
  cache.set(chave, pronta);
  return pronta;
}

type Props = {
  /** Já ordenados por y: quem está mais abaixo é desenhado por cima. */
  elementos: readonly RenderElement[];
};

/**
 * Desenha os sprites por cima do terreno, como imagens separadas.
 * Mudar elementos não mexe no buffer nem na imagem do terreno.
 */
export function WorldSprites({ elementos }: Props) {
  const pngs = useSpriteImages();
  const cache = useRef(new Map<string, Buffer>()).current;

  return (
    <>
      {elementos.map((el, i) => {
        const chave = `${el.tipo}-${el.x}-${el.y}-${i}`;
        const chaveImagem = imagemDoElemento(el);
        const png = chaveImagem ? pngs[chaveImagem] : null;

        if (png) {
          // âncora: centro do tile na horizontal, base do sprite no pé do tile
          const largura = png.width();
          const altura = png.height();
          const x = el.x * ART + ART / 2 - largura / 2;
          const y = el.y * ART + ART - altura;
          return (
            <Image key={chave} image={png} x={x} y={y} width={largura} height={altura} fit="fill" sampling={NITIDO} />
          );
        }

        const buffer = obterBuffer(cache, el);
        if (!buffer) return null;
        return (
          <Image
            key={chave}
            image={buffer.imagem}
            x={el.x * ART + buffer.deslocX}
            y={el.y * ART + buffer.deslocY}
            width={buffer.largura}
            height={buffer.altura}
            fit="fill"
            sampling={NITIDO}
          />
        );
      })}
    </>
  );
}
