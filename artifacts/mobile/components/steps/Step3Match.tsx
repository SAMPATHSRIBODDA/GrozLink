import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useUpload } from "@/context/UploadContext";
import { matchImages } from "@/utils/matching";

export function Step3Match() {
  const colors = useColors();
  const { state, dispatch, nextStep, prevStep } = useUpload();
  const [matching, setMatching] = useState(false);
  const [ran, setRan] = useState(false);

  useEffect(() => {
    if (!ran && state.parsedRows.length > 0 && state.extractedFiles.size > 0) {
      runMatching();
    }
  }, []);

  const runMatching = async () => {
    setMatching(true);
    setRan(true);
    await new Promise((r) => setTimeout(r, 300));
    const rows = state.parsedRows.map((r) => ({
      rowIndex: r.rowIndex,
      productName: r.productName,
      imageName: r.imageName,
    }));
    const { results, unmatchedImages, duplicates } = matchImages(
      rows,
      state.extractedFiles,
      state.templateRules?.caseSensitive ?? false,
      state.templateRules?.ignoreExtraSpaces ?? true
    );
    dispatch({ type: "SET_MATCH_RESULTS", payload: { results, unmatchedImages } });
    setMatching(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const matched = state.matchResults.filter((r) => r.status === "matched").length;
  const unmatched = state.matchResults.filter((r) => r.status === "unmatched").length;
  const canProceed = matched > 0 && !matching;

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      {matching ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Matching images…
          </Text>
        </View>
      ) : (
        <>
          {state.matchResults.length > 0 && (
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryItem, { backgroundColor: colors.successLight }]}>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>{matched}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.success }]}>Matched</Text>
                </View>
                <View style={[styles.summaryItem, { backgroundColor: colors.errorLight }]}>
                  <Text style={[styles.summaryValue, { color: colors.destructive }]}>{unmatched}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.destructive }]}>Unmatched</Text>
                </View>
                <View style={[styles.summaryItem, { backgroundColor: colors.warningLight }]}>
                  <Text style={[styles.summaryValue, { color: colors.warning }]}>
                    {state.unmatchedImages.length}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.warning }]}>Unused</Text>
                </View>
              </View>
            </View>
          )}

          {state.matchResults.length > 0 && (
            <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.listTitle, { color: colors.foreground }]}>Match Results</Text>
              {state.matchResults.map((r, i) => (
                <View
                  key={i}
                  style={[
                    styles.resultRow,
                    i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                >
                  <Feather
                    name={r.status === "matched" ? "check-circle" : "x-circle"}
                    size={16}
                    color={r.status === "matched" ? colors.success : colors.destructive}
                  />
                  <View style={styles.resultInfo}>
                    <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>
                      {r.productName || `Row ${r.rowIndex}`}
                    </Text>
                    <Text style={[styles.imageName, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {r.imageName || "—"}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.statusBadge,
                      {
                        color: r.status === "matched" ? colors.success : colors.destructive,
                        backgroundColor:
                          r.status === "matched" ? colors.successLight : colors.errorLight,
                      },
                    ]}
                  >
                    {r.status === "matched" ? "Matched" : "Missing"}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {state.unmatchedImages.length > 0 && (
            <View
              style={[styles.unmatchedCard, { backgroundColor: colors.warningLight, borderColor: colors.warning + "50" }]}
            >
              <Feather name="alert-circle" size={16} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.unmatchedTitle, { color: colors.warning }]}>
                  {state.unmatchedImages.length} images not matched
                </Text>
                {state.unmatchedImages.slice(0, 3).map((img, i) => (
                  <Text key={i} style={[styles.unmatchedFile, { color: colors.warning }]}>
                    • {img.split("/").pop()}
                  </Text>
                ))}
                {state.unmatchedImages.length > 3 && (
                  <Text style={[styles.unmatchedFile, { color: colors.warning }]}>
                    +{state.unmatchedImages.length - 3} more
                  </Text>
                )}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.rematchBtn, { borderColor: colors.border }]}
            onPress={runMatching}
            activeOpacity={0.7}
          >
            <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
            <Text style={[styles.rematchText, { color: colors.mutedForeground }]}>Re-run Matching</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: colors.border }]}
          onPress={prevStep}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
          <Text style={[styles.backBtnText, { color: colors.mutedForeground }]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            { backgroundColor: canProceed ? colors.primary : colors.muted },
          ]}
          onPress={nextStep}
          disabled={!canProceed}
          activeOpacity={0.8}
        >
          <Text style={[styles.primaryBtnText, { color: canProceed ? "#fff" : colors.mutedForeground }]}>
            Upload to Cloudinary
          </Text>
          <Feather name="upload-cloud" size={16} color={canProceed ? "#fff" : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  loadingCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: { fontSize: 15 },
  summaryCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: "row", gap: 10 },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 2,
  },
  summaryValue: { fontSize: 24, fontWeight: "700" },
  summaryLabel: { fontSize: 11, fontWeight: "600" },
  listCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  listTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  resultInfo: { flex: 1 },
  productName: { fontSize: 13, fontWeight: "600" },
  imageName: { fontSize: 11, marginTop: 1 },
  statusBadge: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  unmatchedCard: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  unmatchedTitle: { fontSize: 13, fontWeight: "600" },
  unmatchedFile: { fontSize: 11, marginTop: 2 },
  rematchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    justifyContent: "center",
  },
  rematchText: { fontSize: 13, fontWeight: "600" },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 8, marginBottom: 20 },
  backBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  backBtnText: { fontSize: 14, fontWeight: "600" },
  primaryBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "700" },
});
