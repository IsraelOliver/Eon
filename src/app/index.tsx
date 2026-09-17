import { Canvas, Rect } from "@shopify/react-native-skia";
import { View } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Canvas style={{ width: 200, height: 200 }}>
        <Rect x={0} y={0} width={200} height={200} color="#2a6fd6" />
        <Rect x={60} y={60} width={80} height={80} color="#e4cc92" />
      </Canvas>
    </View>
  );
}