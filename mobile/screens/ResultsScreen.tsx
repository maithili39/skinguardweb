import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import type { AnalysisResult } from "../App";

interface Props {
  result: AnalysisResult;
  onBack: () => void;
}

const FLAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  good:     { bg: "#e8f5e9", text: "#2e7d32", border: "#a5d6a7" },
  moderate: { bg: "#fff3e0", text: "#e65100", border: "#ffcc80" },
  bad:      { bg: "#fdeaea", text: "#c62828", border: "#ef9a9a" },
};

const RATING_COLOR: Record<string, string> = {
  superstar: "#2e7d32",
  goodie:    "#43a047",
  neutral:   "#8a8276",
  caution:   "#e65100",
  avoid:     "#c62828",
};

export default function ResultsScreen({ result, onBack }: Props) {
  const matchPct = result.totalCount
    ? Math.round((result.matchedCount / result.totalCount) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Scan again</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis Results</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Summary bar */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{result.totalCount}</Text>
            <Text style={styles.summaryLabel}>Ingredients</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{result.matchedCount}</Text>
            <Text style={styles.summaryLabel}>Identified</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{matchPct}%</Text>
            <Text style={styles.summaryLabel}>Match rate</Text>
          </View>
        </View>

        {/* Flags */}
        {result.flags.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Alerts</Text>
            {result.flags.map((flag, i) => {
              const colors = FLAG_COLORS[flag.level] ?? FLAG_COLORS.moderate;
              return (
                <View
                  key={i}
                  style={[styles.flagCard, { backgroundColor: colors.bg, borderColor: colors.border }]}
                >
                  <Text style={[styles.flagTitle, { color: colors.text }]}>{flag.title}</Text>
                  <Text style={styles.flagDetail}>{flag.detail}</Text>
                  {flag.ingredientNames.length > 0 && (
                    <Text style={styles.flagIngredients}>
                      {flag.ingredientNames.slice(0, 5).join(", ")}
                      {flag.ingredientNames.length > 5 ? ` +${flag.ingredientNames.length - 5} more` : ""}
                    </Text>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Ingredient list */}
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {result.ingredients.map((item, i) => {
          const ing = item.ingredient;
          const ratingColor = ing?.rating ? (RATING_COLOR[ing.rating] ?? "#8a8276") : "#ccc";
          return (
            <View key={i} style={styles.ingRow}>
              <View style={[styles.ratingDot, { backgroundColor: ratingColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.ingName}>
                  {ing?.displayName ?? item.rawName}
                </Text>
                {ing?.whatItDoes && (
                  <Text style={styles.ingWhat}>{ing.whatItDoes}</Text>
                )}
                {!ing && (
                  <Text style={styles.ingUnknown}>Not in database</Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f1ea" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e4dc",
    gap: 12,
  },
  back: { color: "#4a5d44", fontSize: 15 },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#2a2724" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "#e8e4dc",
  },
  summaryItem: { alignItems: "center" },
  summaryNumber: { fontSize: 28, fontWeight: "700", color: "#4a5d44" },
  summaryLabel: { fontSize: 12, color: "#8a8276", marginTop: 2 },
  summaryDivider: { width: 1, height: 40, backgroundColor: "#e8e4dc" },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8a8276",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 8,
  },

  flagCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  flagTitle: { fontSize: 15, fontWeight: "600" },
  flagDetail: { fontSize: 13, color: "#4a453f", lineHeight: 18 },
  flagIngredients: { fontSize: 12, color: "#8a8276", marginTop: 4, fontStyle: "italic" },

  ingRow: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e8e4dc",
  },
  ratingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    flexShrink: 0,
  },
  ingName: { fontSize: 14, fontWeight: "600", color: "#2a2724" },
  ingWhat: { fontSize: 12, color: "#8a8276", marginTop: 2 },
  ingUnknown: { fontSize: 12, color: "#ccc", marginTop: 2, fontStyle: "italic" },
});
