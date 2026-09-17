import {
  AlphaType, Canvas, ColorType, FilterMode, Group, Image, MipmapMode, Skia,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { useMapCamera } from '../hooks/useMapCamera';

type Props = {
  /** Buffer RGBA com largura x altura x 4 bytes. */
  pixels: Uint8Array;
  largura: number;
  altura: number;
};

// "Nearest" = cada pixel vira um quadrado ao ampliar, sem suavização, em qualquer zoom
const NITIDO = { filter: FilterMode.Nearest, mipmap: MipmapMode.None };

/** Mapa em tela cheia. Arrastar e pinça só mudam a transformação do Group. */
export function WorldMap({ pixels, largura, altura }: Props) {
  const { gesto, transformacao } = useMapCamera(largura, altura);

  const imagem = useMemo(
    () =>
      Skia.Image.MakeImage(
        { width: largura, height: altura, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
        Skia.Data.fromBytes(pixels),
        largura * 4,
      ),
    [pixels, largura, altura],
  );

  return (
    <GestureDetector gesture={gesto}>
      <Canvas style={StyleSheet.absoluteFill} accessibilityLabel="Mapa gerado proceduralmente">
        <Group transform={transformacao}>
          <Image image={imagem} x={0} y={0} width={largura} height={altura} fit="fill" sampling={NITIDO} />
        </Group>
      </Canvas>
    </GestureDetector>
  );
}
