import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useUpload } from "@/context/UploadContext";
import { FileUploadCard } from "@/components/FileUploadCard";
import { extractZipImages } from "@/services/zip";

export function Step2Zip() {
  const colors = useColors();
  const { state, dispatch, nextStep, prevStep } = useUpload();
  const [extracting, setExtracting] = useState(false);

  const pickZip = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/zip", "application/x-zip-compressed", "*/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const name = asset.name ?? "images.zip";
      if (!name.match(/\.zip$/i)) {
        Alert.alert("Invalid File", "Please select a ZIP archive (.zip)");
        return;
      }
      dispatch({ type: "SET_ZIP_FILE", payload: { uri: asset.uri, name } });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await extractFile(asset.uri);
    } catch {
      Alert.alert("Error", "Failed to pick file. Please try again.");
    }
  };

  const extractFile = async (uri: string) => {
    setExtracting(true);
    try {
      const { files, imageCount } = await extractZipImages(uri);
      dispatch({ type: "SET_EXTRACTED_FILES", payload: { files, imageCount } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Extraction failed";
      Alert.alert("ZIP Error", msg);
      dispatch({ type: "SET_ZIP_FILE", payload: null });
    } finally {
      setExtracting(false);
    }
  };

  const canProceed = state.zipFile && state.imageCount > 0;

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <FileUploadCard
        title="Upload ZIP Archive"
        subtitle="Select a ZIP file containing your product images"
        acceptLabel=".zip · jpg · png · jpeg · webp"
        icon="archive"
        selectedName={state.zipFile?.name}
        onPress={pickZip}
        onClear={() => dispatch({ type: "SET_ZIP_FILE", payload: null })}
        loading={extracting}
        extra={state.imageCount > 0 ? `${state.imageCount} images extracted` : null}
      />

      {state.imageCount > 0 && (
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statRow}>
            <View style={[styles.statIcon, { backgroundColor: colors.successLight }]}>
              <Feather name="image" size={18} color={colors.success} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {state.imageCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Images Ready
              </Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={[styles.statIcon, { backgroundColor: colors.orange100 }]}>
              <Feather name="file-text" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {state.parsedRows.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Excel Rows
              </Text>
            </View>
          </View>
        </View>
      )}

      {state.imageCount > 0 && state.parsedRows.length > 0 && (
        <View style={[styles.infoCard, { backgroundColor: colors.orange50, borderColor: colors.primary + "30" }]}>
          <Feather name="info" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            Matching will compare image filenames (without extension) against the Image Name column in your Excel file.
          </Text>
        </View>
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
          activeOpacity={0.8}
          disabled={!canProceed}
        >
          <Text style={[styles.primaryBtnText, { color: canProceed ? "#fff" : colors.mutedForeground }]}>
            Match Images
          </Text>
          <Feather name="arrow-right" size={16} color={canProceed ? "#fff" : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  statsCard: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    gap: 24,
  },
  statRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 22, fontWeight: "700" },
  statLabel: { fontSize: 11, fontWeight: "500" },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 20, marginBottom: 20 },
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
