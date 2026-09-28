// Entrada do app no iOS e no Android.
//
// É exatamente o que `"main": "expo-router/entry"` fazia antes: nada muda no
// nativo. O arquivo só existe porque a web precisa de uma entrada própria
// (`index.web.tsx`), e o Metro escolhe entre as duas pela plataforma.
import 'expo-router/entry';
