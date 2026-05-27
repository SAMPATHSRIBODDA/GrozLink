import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import * as Sharing from "expo-sharing";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useUpload } from "@/context/UploadContext";

export function Step5Results() {
  const colors = useColors();
  const { state, reset } = useUpload();

  const uploaded = state.matchResults.filter((r) => r.uploadStatus === "success").length;
  const failed = state.matchResults.filter((r) => r.uploadStatus === "failed").length;
  const unmatched = state.matchResults.filter((r) => r.status === "unmatched").length;
  const matched = state.matchResults.filter((r) => r.status === "matched").length;

  const handleShare = async () => {
    if (!state.outputExcelPath) {
      Alert.alert("No File", "Output CSV file was not generated.");
      return;
    }
    if (Platform.OS === "web") {
      Alert.alert("Info", "File sharing is not supported on web.");
      return;
    }
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert("Sharing Not Available", "File sharing is not available on this device.");
      return;
    }
    await Sharing.shareAsync(state.outputExcelPath, {
      mimeType: "text/csv",
      dialogTitle: "Share Updated CSV",
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNewUpload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    reset();
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.successCard, { backgroundColor: uploaded > 0 ? colors.successLight : colors.errorLight, borderColor: uploaded > 0 ? colors.success : colors.destructive }]}>
        <Feather
          name={uploaded > 0 ? "check-circle" : "alert-circle"}
          size={44}
          color={uploaded > 0 ? colors.success : colors.destructive}
        />
        <Text style={[styles.successTitle, { color: uploaded > 0 ? colors.success : colors.destructive }]}>
          {uploaded > 0 ? "Upload Complete!" : "Upload Failed"}
        </Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
          {uploaded > 0
            ? `${uploaded} of ${matched} images uploaded successfully`
            : "No images were uploaded"}
        </Text>
      </View>

      <View style={[styles.statsGrid, { gap: 10 }]}>
        <View style={styles.statsRow}>
          <StatCard
            value={state.parsedRows.length}
            label="Total Products"
            color={colors.primary}
            bg={colors.orange100}
            colors={colors}
          />
          <StatCard
            value={matched}
            label="Matched"
            color={colors.success}
            bg={colors.successLight}
            colors={colors}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            value={uploaded}
            label="Uploaded"
            color={colors.primary}
            bg={colors.secondary}
            colors={colors}
          />
          <StatCard
            value={failed}
            label="Failed"
            color={colors.destructive}
            bg={colors.errorLight}
            colors={colors}
          />
        </View>
        {unmatched > 0 && (
          <View style={styles.statsRow}>
            <StatCard
              value={unmatched}
              label="Unmatched Rows"
              color={colors.warning}
              bg={colors.warningLight}
              colors={colors}
            />
          </View>
        )}
      </View>

      {failed > 0 && (
        <View style={[styles.failedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.failedTitle, { color: colors.foreground }]}>Failed Uploads</Text>
          {state.matchResults
            .filter((r) => r.uploadStatus === "failed")
            .map((r, i) => (
              <View key={i} style={[styles.failedRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Feather name="x-circle" size={14} color={colors.destructive} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.failedName, { color: colors.foreground }]}>{r.productName}</Text>
                  <Text style={[styles.failedErr, { color: colors.destructive }]} numberOfLines={1}>
                    {r.errorMessage ?? "Unknown error"}
                  </Text>
                </View>
              </View>
            ))}
        </View>
      )}

      {state.outputExcelPath && (
        <TouchableOpacity
          style={[styles.downloadBtn, { backgroundColor: colors.primary }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Feather name="download" size={20} color="#fff" />
          <Text style={styles.downloadBtnText}>Download / Share CSV</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.newBtn, { borderColor: colors.border }]}
        onPress={handleNewUpload}
        activeOpacity={0.7}
      >
        <Feather name="plus-circle" size={18} color={colors.primary} />
        <Text style={[styles.newBtnText, { color: colors.primary }]}>Start New Upload</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({
  value,
  label,
  color,
  bg,
  colors,
}: {
  value: number;
  label: string;
  color: string;
  bg: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  successCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  successTitle: { fontSize: 22, fontWeight: "700" },
  successSub: { fontSize: 14, textAlign: "center" },
  statsGrid: { marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    gap: 4,
    alignItems: "center",
  },
  statValue: { fontSize: 28, fontWeight: "700" },
  statLabel: { fontSize: 12, fontWeight: "500" },
  failedCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 0,
  },
  failedTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  failedRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
  },
  failedName: { fontSize: 13, fontWeight: "600" },
  failedErr: { fontSize: 11, marginTop: 1 },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  downloadBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 24,
  },
  newBtnText: { fontSize: 15, fontWeight: "600" },
});
