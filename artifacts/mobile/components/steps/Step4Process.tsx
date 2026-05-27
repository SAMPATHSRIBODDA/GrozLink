import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useUpload } from "@/context/UploadContext";
import { ProcessingLog } from "@/components/ProcessingLog";
import { uploadImageToCloudinary, isCloudinaryConfigured } from "@/services/cloudinary";
import { generateOutputExcel } from "@/services/excel";
import { addSessionRecord } from "@/utils/storage";

export function Step4Process() {
  const colors = useColors();
  const { state, dispatch, nextStep, prevStep } = useUpload();
  const [started, setStarted] = useState(false);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!started && !runningRef.current) {
      startProcessing();
    }
  }, []);

  const startProcessing = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setStarted(true);

    if (!state.cloudinarySettings || !isCloudinaryConfigured(state.cloudinarySettings)) {
      Alert.alert(
        "Cloudinary Not Configured",
        "Please configure your Cloudinary settings in the Settings tab before uploading.",
        [{ text: "OK", onPress: prevStep }]
      );
      runningRef.current = false;
      return;
    }

    dispatch({ type: "SET_IS_PROCESSING", payload: true });
    const matched = state.matchResults.filter((r) => r.status === "matched");
    const total = matched.length;
    let uploaded = 0;
    let failed = 0;
    const updatedResults = [...state.matchResults];

    const addLog = (msg: string) => dispatch({ type: "ADD_LOG", payload: msg });
    addLog(`Starting upload of ${total} images to Cloudinary…`);

    for (let i = 0; i < state.matchResults.length; i++) {
      const result = state.matchResults[i];
      if (result.status !== "matched" || !result.imageBase64) continue;

      dispatch({
        type: "UPDATE_MATCH_RESULT",
        payload: { index: i, result: { uploadStatus: "uploading" } },
      });
      addLog(`→ Uploading: ${result.imageName}`);

      try {
        const url = await uploadImageToCloudinary(
          result.imageBase64,
          result.mimeType,
          state.cloudinarySettings!
        );
        uploaded++;
        updatedResults[i] = {
          ...updatedResults[i],
          uploadStatus: "success",
          cloudinaryUrl: url,
        };
        dispatch({
          type: "UPDATE_MATCH_RESULT",
          payload: { index: i, result: { uploadStatus: "success", cloudinaryUrl: url } },
        });
        dispatch({ type: "SET_UPLOAD_PROGRESS", payload: uploaded + failed });
        addLog(`✓ ${result.imageName} → uploaded`);
      } catch (e) {
        failed++;
        const msg = e instanceof Error ? e.message : "Unknown error";
        updatedResults[i] = {
          ...updatedResults[i],
          uploadStatus: "failed",
          errorMessage: msg,
        };
        dispatch({
          type: "UPDATE_MATCH_RESULT",
          payload: { index: i, result: { uploadStatus: "failed", errorMessage: msg } },
        });
        dispatch({ type: "SET_UPLOAD_PROGRESS", payload: uploaded + failed });
        addLog(`FAILED: ${result.imageName} — ${msg}`);
      }
    }

    addLog(`\nComplete: ${uploaded} uploaded, ${failed} failed`);

    if (uploaded > 0 && state.excelFile) {
      addLog("Generating updated Excel file…");
      try {
        const outputPath = await generateOutputExcel(
          state.excelFile.uri,
          updatedResults,
          state.templateRules!
        );
        dispatch({ type: "SET_OUTPUT_EXCEL", payload: outputPath });
        addLog("✓ Excel file generated successfully");
      } catch (e) {
        addLog(`FAILED to generate Excel: ${e instanceof Error ? e.message : "Unknown"}`);
      }
    }

    const sessionId = Date.now().toString();
    dispatch({ type: "SET_SESSION_ID", payload: sessionId });
    await addSessionRecord({
      id: sessionId,
      date: new Date().toISOString(),
      excelFileName: state.excelFile?.name ?? "unknown",
      totalProducts: state.parsedRows.length,
      matchedImages: matched.length,
      uploadedImages: uploaded,
      failedUploads: failed,
    });

    dispatch({ type: "SET_IS_PROCESSING", payload: false });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    runningRef.current = false;

    setTimeout(() => nextStep(), 800);
  };

  const matched = state.matchResults.filter((r) => r.status === "matched").length;

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.cloudIcon, { backgroundColor: colors.orange100 }]}>
          <Feather name="upload-cloud" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {state.isProcessing ? "Uploading to Cloudinary…" : "Upload Complete"}
        </Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          {matched} images to process
        </Text>
      </View>

      <ProcessingLog
        logs={state.processingLog}
        progress={state.uploadProgress}
        total={matched}
      />

      {!state.isProcessing && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: colors.border }]}
            onPress={() => {
              runningRef.current = false;
              setStarted(false);
              dispatch({ type: "ADD_LOG", payload: "\n— Retrying failed uploads —" });
              startProcessing();
            }}
            activeOpacity={0.7}
          >
            <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
            <Text style={[styles.retryBtnText, { color: colors.mutedForeground }]}>Retry Failed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={nextStep}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>View Results</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  header: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cloudIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSub: { fontSize: 13 },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 16, marginBottom: 20 },
  retryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  retryBtnText: { fontSize: 14, fontWeight: "600" },
  primaryBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
