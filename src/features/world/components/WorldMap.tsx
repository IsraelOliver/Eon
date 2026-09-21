import {
  AlphaType, Canvas, ColorType, FilterMode, Group, Image, MipmapMode, Skia,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useMapCamera } from '../hooks/useMapCamera';
import type { CamadaDeCaminhos } from '../render/pathPixels';
import type { RenderElement } from '../render/renderElements';
import { WorldSprites } from './WorldSprites';

type Props = {
  /** Buffer RGBA do terreno (largura x altura x 4). Só muda quando o mundo muda. */
  terreno: Uint8Array;
  /** Camada dos caminhos das vilas (buffer pequeno, com transparência). */
  caminhos: CamadaDeCaminhos | null;
  largura: number;
  altura: number;
  /** Sprites a desenhar por cima, já ordenados por y. */
  elementos: readonly RenderElement[];
  /** 0 a 1: brilho dos elementos recém-revisados. */
  brilho: number;
  /** Toque longo: recebe o ponto em pixels de arte. Sem essa prop, o toque longo fica desligado. */
  onLongPress?: (artX: number, artY: number) => void;
};

// "Nearest" = cada pixel vira um quadrado ao ampliar, sem suavização, em qualquer zoom
const NITIDO = { filter: FilterMode.Nearest, mipmap: MipmapMode.None };

/** Mapa em tela cheia. Arrastar e pinça só mudam a transformação do Group. */
export function WorldMap({ terreno, caminhos, largura, altura, elementos, brilho, onLongPress }: Props) {
  const { gesto, transformacao, paraMapa } = useMapCamera(largura, altura);

  const toqueLongo = Gesture.LongPress()
    .enabled(onLongPress !== undefined)
    .runOnJS(true)
    .onStart((e) => {
      const p = paraMapa(e.x, e.y);
      onLongPress?.(p.x, p.y);
    });

  // só é refeita quando o terreno muda (mundo novo, semente, nível do mar)
  const imagemTerreno = useMemo(
    () =>
      Skia.Image.MakeImage(
        { width: largura, height: altura, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
        Skia.Data.fromBytes(terreno),
        largura * 4,
      ),
    [terreno, largura, altura],
  );

  // camada dos caminhos: refeita só quando a rede muda, sem tocar no terreno
  const imagemCaminhos = useMemo(
    () =>
      caminhos &&
      Skia.Image.MakeImage(
        { width: caminhos.largura, height: caminhos.altura, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
        Skia.Data.fromBytes(caminhos.pixels),
        caminhos.largura * 4,
      ),
    [caminhos],
  );

  return (
    <GestureDetector gesture={Gesture.Simultaneous(gesto, toqueLongo)}>
      <Canvas style={StyleSheet.absoluteFill} accessibilityLabel="Mapa gerado proceduralmente">
        <Group transform={transformacao}>
          <Image image={imagemTerreno} x={0} y={0} width={largura} height={altura} fit="fill" sampling={NITIDO} />
          {caminhos && imagemCaminhos && (
            <Image
              image={imagemCaminhos}
              x={caminhos.x}
              y={caminhos.y}
              width={caminhos.largura}
              height={caminhos.altura}
              fit="fill"
              sampling={NITIDO}
            />
          )}
          <WorldSprites elementos={elementos} brilho={brilho} />
        </Group>
      </Canvas>
    </GestureDetector>
  );
}
