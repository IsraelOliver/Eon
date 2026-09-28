// Entrada do app na web.
//
// No iOS e no Android o Skia é nativo e já existe quando o app abre. Na web ele
// roda sobre o CanvasKit (WebAssembly), que precisa ser baixado e carregado
// ANTES do primeiro render — sem isto, `Skia.Image` ainda não existe quando o
// mapa monta, e o app quebra.
//
// O `canvaskit.wasm` é servido de `public/`, copiado de `node_modules` pelo
// `postinstall` (setup-skia-web). Procedimento oficial:
// https://shopify.github.io/react-native-skia/docs/getting-started/web/#expo
import '@expo/metro-runtime';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

LoadSkiaWeb().then(() => {
  renderRootComponent(App);
});
