import {
  AlphaType, Canvas, ColorType, FilterMode, Group, Image, MipmapMode, Skia, type SkImage,
} from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef } from 'react';
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
  /** Toque longo: recebe o ponto em pixels de arte. Sem essa prop, o toque longo fica desligado. */
  onLongPress?: (artX: number, artY: number) => void;
  /**
   * Muda de valor para pedir um repintar (ex.: quando o feed acaba de fechar).
   * Não altera a câmera; veja `repintar()` em useMapCamera.
   */
  despertar?: number;
};

// "Nearest" = cada pixel vira um quadrado ao ampliar, sem suavização, em qualquer zoom
const NITIDO = { filter: FilterMode.Nearest, mipmap: MipmapMode.None };

/** Mapa em tela cheia. Arrastar e pinça só mudam a transformação do Group. */
export function WorldMap({
  terreno, caminhos, largura, altura, elementos, onLongPress, despertar = 0,
}: Props) {
  const { gesto, transformacao, paraMapa, repintar } = useMapCamera(largura, altura);

  // Quem cobriu o mapa avisa que saiu da frente; aqui só reenviamos a cena.
  useEffect(() => {
    repintar();
  }, [despertar, repintar]);

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

  /*
   * Ao sair da árvore, soltamos as imagens grandes em vez de esperar o coletor.
   * São 5,3 MB nativos cada; na recriação do mundo, esperar o GC deixava a cena
   * velha e a nova vivas ao mesmo tempo, e o iOS fechava o app.
   *
   * `dispose()` só larga ESTA referência (o `sk_sp` é contado): se a última cena
   * desenhada ainda apontar para a imagem, ela sobrevive até aquela cena sair.
   * Por isso é seguro aqui, e só aqui — depois disto ninguém mais lê a imagem.
   */
  const imagens = useRef<{ terreno: SkImage | null; caminhos: SkImage | null }>({
    terreno: null,
    caminhos: null,
  });
  imagens.current = { terreno: imagemTerreno, caminhos: imagemCaminhos || null };
  useEffect(
    () => () => {
      imagens.current.terreno?.dispose();
      imagens.current.caminhos?.dispose();
    },
    [],
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
          <WorldSprites elementos={elementos} />
        </Group>
      </Canvas>
    </GestureDetector>
  );
}
