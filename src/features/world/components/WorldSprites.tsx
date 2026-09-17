import {
  AlphaType, ColorMatrix, ColorType, FilterMode, Group, Image, MipmapMode, Skia, type SkImage,
} from '@shopify/react-native-skia';
import { useRef } from 'react';

import { useSpriteImages } from '../hooks/useSpriteImages';
import { ART } from '../render/buildPixels';
import type { RenderElement } from '../render/renderElements';
import { SPRITE_PNG, type SpriteComPng } from '../render/spriteAssets';
import { construirSprite } from '../render/spriteBuffers';

// "Nearest" = pixels quadrados em qualquer zoom
const NITIDO = { filter: FilterMode.Nearest, mipmap: MipmapMode.None };

const OPACIDADE_DESBOTADO = 0.5;

/** Clareia o sprite para a animação da revisão (k de 0 a 1). */
const clarear = (k: number) => [1, 0, 0, 0, k * 0.35, 0, 1, 0, 0, k * 0.35, 0, 0, 1, 0, k * 0.2, 0, 0, 0, 1, 0];

const temPng = (tipo: RenderElement['tipo']): tipo is SpriteComPng => tipo in SPRITE_PNG;

type Buffer = { imagem: SkImage; largura: number; altura: number; deslocX: number; deslocY: number };

/** Fallback dos sprites sem PNG (torre, observatorio, escavacao): desenho em caracteres. */
function obterBuffer(cache: Map<string, Buffer>, el: RenderElement, brilho: number): Buffer | null {
  const desbotado = el.desbotado === true;
  const luz = el.brilha ? Math.round(brilho * 10) / 10 : 0;
  const chave = `${el.tipo}|${desbotado ? 1 : 0}|${luz}`;

  const guardada = cache.get(chave);
  if (guardada) return guardada;

  const sprite = construirSprite(el.tipo, { desbotado, brilho: luz });
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
  brilho: number;
};

/**
 * Desenha os sprites por cima do terreno, como imagens separadas.
 * Mudar elementos não mexe no buffer nem na imagem do terreno.
 */
export function WorldSprites({ elementos, brilho }: Props) {
  const pngs = useSpriteImages();
  const cache = useRef(new Map<string, Buffer>()).current;

  return (
    <>
      {elementos.map((el, i) => {
        const chave = `${el.tipo}-${el.x}-${el.y}-${i}`;
        const luz = el.brilha ? brilho : 0;
        const png = temPng(el.tipo) ? pngs[el.tipo] : null;

        if (png) {
          // âncora: centro do tile na horizontal, base do sprite no pé do tile
          const largura = png.width();
          const altura = png.height();
          const x = el.x * ART + ART / 2 - largura / 2;
          const y = el.y * ART + ART - altura;
          return (
            <Group key={chave} opacity={el.desbotado ? OPACIDADE_DESBOTADO : 1}>
              <Image image={png} x={x} y={y} width={largura} height={altura} fit="fill" sampling={NITIDO}>
                {luz > 0 && <ColorMatrix matrix={clarear(luz)} />}
              </Image>
            </Group>
          );
        }

        const buffer = obterBuffer(cache, el, brilho);
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
