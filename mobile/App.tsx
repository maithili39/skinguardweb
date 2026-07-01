import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import ScanScreen from "./screens/ScanScreen";
import ResultsScreen from "./screens/ResultsScreen";

type Screen = "home" | "scan-ocr" | "scan-barcode" | "results";

export interface AnalysisResult {
  ingredients: Array<{
    rawName: string;
    matchKind: string;
    ingredient: {
      displayName: string;
      rating: string | null;
      whatItDoes: string | null;
      tags: string[];
    } | null;
  }>;
  matchedCount: number;
  totalCount: number;
  flags: Array<{
    level: "good" | "moderate" | "bad";
    title: string;
    detail: string;
    ingredientNames: string[];
  }>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  if (screen === "scan-ocr" || screen === "scan-barcode") {
    return (
      <ScanScreen
        mode={screen === "scan-ocr" ? "ocr" : "barcode"}
        onResult={(r) => {
          setResult(r);
          setScreen("results");
        }}
        onBack={() => setScreen("home")}
      />
    );
  }

  if (screen === "results" && result) {
    return <ResultsScreen result={result} onBack={() => setScreen("home")} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f1ea" />
      <View style={styles.container}>
        <Text style={styles.logo}>SkinGuard</Text>
        <Text style={styles.subtitle}>Scan a product label or barcode</Text>

        <TouchableOpacity style={styles.btn} onPress={() => setScreen("scan-ocr")}>
          <Text style={styles.btnIcon}>📷</Text>
          <View>
            <Text style={styles.btnTitle}>Scan Ingredient Label</Text>
            <Text style={styles.btnSub}>Photo the ingredient list on packaging</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => setScreen("scan-barcode")}
        >
          <Text style={styles.btnIcon}>▦</Text>
          <View>
            <Text style={[styles.btnTitle, styles.btnTitleDark]}>Scan Barcode</Text>
            <Text style={[styles.btnSub, styles.btnSubDark]}>Point camera at product barcode</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f1ea" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  logo: { fontSize: 36, fontWeight: "700", color: "#4a5d44", marginBottom: 4 },
  subtitle: { fontSize: 15, color: "#8a8276", marginBottom: 24 },
  btn: {
    width: "100%",
    backgroundColor: "#4a5d44",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  btnSecondary: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e8e4dc",
  },
  btnIcon: { fontSize: 28 },
  btnTitle: { fontSize: 16, fontWeight: "600", color: "#ffffff" },
  btnTitleDark: { color: "#2a2724" },
  btnSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  btnSubDark: { color: "#8a8276" },
});
