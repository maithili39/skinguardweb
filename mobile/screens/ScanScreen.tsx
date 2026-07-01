import { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import type { AnalysisResult } from "../App";
import { API_BASE } from "../config";

interface Props {
  mode: "ocr" | "barcode";
  onResult: (r: AnalysisResult) => void;
  onBack: () => void;
}

export default function ScanScreen({ mode, onResult, onBack }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [barcodeScanned, setBarcodeScanned] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  // ── OCR: take photo → send to API ────────────────────────────────────────

  async function takePicture() {
    if (!cameraRef.current) return;
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });
      if (!photo?.base64) throw new Error("No image data");

      // Send base64 image to our OCR endpoint
      const res = await fetch(`${API_BASE}/api/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: photo.base64 }),
      });

      if (!res.ok) throw new Error("OCR failed");
      const { text } = await res.json();
      setOcrText(text);
    } catch (e) {
      Alert.alert("Error", "Could not extract text from image. Try again with better lighting.");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeText(text: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: API_BASE },
        body: JSON.stringify({ text, profile: { skinType: "normal", concerns: [] } }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      onResult(await res.json());
    } catch {
      Alert.alert("Error", "Analysis failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  // ── Barcode: scan → look up product → analyze ────────────────────────────

  async function handleBarcode({ data }: BarcodeScanningResult) {
    if (barcodeScanned || loading) return;
    setBarcodeScanned(true);
    setLoading(true);
    try {
      // Open Beauty Facts API — free, no key needed
      const res = await fetch(
        `https://world.openbeautyfacts.org/api/v0/product/${data}.json`,
      );
      const json = await res.json();
      const inci: string = json?.product?.ingredients_text_en || json?.product?.ingredients_text || "";
      if (!inci) {
        Alert.alert("Not found", "No ingredient data found for this barcode.", [
          { text: "Try again", onPress: () => setBarcodeScanned(false) },
          { text: "Back", onPress: onBack },
        ]);
        setLoading(false);
        return;
      }
      await analyzeText(inci);
    } catch {
      Alert.alert("Error", "Could not look up this barcode.");
      setBarcodeScanned(false);
      setLoading(false);
    }
  }

  // ── Permission not granted ────────────────────────────────────────────────

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permText}>Camera permission is required.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 12 }}>
          <Text style={{ color: "#8a8276" }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── OCR review screen (after photo taken) ────────────────────────────────

  if (mode === "ocr" && ocrText !== null) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setOcrText(null)}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review extracted text</Text>
        </View>
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <Text style={styles.reviewHint}>Edit if anything looks wrong, then tap Analyze.</Text>
          <TextInput
            style={styles.textInput}
            multiline
            value={ocrText}
            onChangeText={setOcrText}
          />
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.analyzeBtn}
            onPress={() => analyzeText(ocrText)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.analyzeBtnText}>Analyze Ingredients →</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Camera viewfinder ─────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={
          mode === "barcode"
            ? { barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"] }
            : undefined
        }
        onBarcodeScanned={mode === "barcode" ? handleBarcode : undefined}
      >
        {/* Header overlay */}
        <SafeAreaView>
          <View style={styles.camHeader}>
            <TouchableOpacity onPress={onBack} style={styles.camBack}>
              <Text style={styles.camBackText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.camTitle}>
              {mode === "ocr" ? "Point at ingredient list" : "Point at barcode"}
            </Text>
          </View>
        </SafeAreaView>

        {/* Scanning frame */}
        <View style={styles.frameOuter}>
          <View style={styles.frame} />
        </View>

        {/* Bottom controls */}
        <View style={styles.camFooter}>
          {mode === "ocr" ? (
            <TouchableOpacity
              style={styles.captureBtn}
              onPress={takePicture}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#4a5d44" />
              ) : (
                <View style={styles.captureInner} />
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.barcodeHint}>
              <Text style={styles.barcodeHintText}>
                {loading ? "Looking up product…" : "Scanning automatically…"}
              </Text>
              {loading && <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />}
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  permText: { fontSize: 16, color: "#2a2724", marginBottom: 16, textAlign: "center" },
  permBtn: {
    backgroundColor: "#4a5d44",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permBtnText: { color: "#fff", fontWeight: "600" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e4dc",
    gap: 12,
  },
  back: { color: "#4a5d44", fontSize: 16 },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#2a2724" },
  reviewHint: { fontSize: 13, color: "#8a8276", marginBottom: 12 },
  textInput: {
    borderWidth: 1,
    borderColor: "#e8e4dc",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#2a2724",
    minHeight: 200,
    textAlignVertical: "top",
    backgroundColor: "#fafaf8",
  },
  footer: { padding: 16 },
  analyzeBtn: {
    backgroundColor: "#4a5d44",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  analyzeBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  camHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  camBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  camBackText: { color: "#fff", fontSize: 18 },
  camTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  frameOuter: { flex: 1, alignItems: "center", justifyContent: "center" },
  frame: {
    width: 280,
    height: 180,
    borderWidth: 2,
    borderColor: "#4a5d44",
    borderRadius: 12,
  },
  camFooter: {
    paddingBottom: 48,
    paddingTop: 24,
    alignItems: "center",
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.5)",
  },
  captureInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#4a5d44",
  },
  barcodeHint: { alignItems: "center" },
  barcodeHintText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
});
