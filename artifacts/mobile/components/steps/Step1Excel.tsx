import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useUpload } from "@/context/UploadContext";
import { FileUploadCard } from "@/components/FileUploadCard";
import { ValidationSummary } from "@/components/ValidationSummary";
import { parseExcelFile } from "@/services/excel";

export function Step1Excel() {
  const colors = useColors();
  const { state, dispatch, nextStep, prevStep } = useUpload();
  const [parsing, setParsing] = useState(false);
  const [extraColumns, setExtraColumns] = useState<string[]>(state.templateRules?.extraColumns ?? []);

  const normalizedExtraColumns = useMemo(
    () => extraColumns.map((column) => column.trim()).filter(Boolean),
    [extraColumns]
  );

  useEffect(() => {
    if (!state.templateRules) return;
    const current = state.templateRules.extraColumns ?? [];
    const next = normalizedExtraColumns;
    if (current.length === next.length && current.every((column, index) => column === next[index])) {
      return;
    }
    dispatch({
      type: "SET_TEMPLATE_RULES",
      payload: {
        ...state.templateRules,
        extraColumns: next,
      },
    });
  }, [dispatch, normalizedExtraColumns, state.templateRules]);

  useEffect(() => {
    setExtraColumns(state.templateRules?.extraColumns ?? []);
  }, [state.templateRules]);

  const pickExcel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "*/*",
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const name = asset.name ?? "excel_file.xlsx";
      if (!name.match(/\.(xlsx|xls)$/i)) {
        Alert.alert("Invalid File", "Please select an Excel file (.xlsx or .xls)");
        return;
      }
      dispatch({ type: "SET_EXCEL_FILE", payload: { uri: asset.uri, name } });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await parseFile(asset.uri);
    } catch {
      Alert.alert("Error", "Failed to pick file. Please try again.");
    }
  };

  const parseFile = async (uri: string) => {
    if (!state.templateRules) return;
    setParsing(true);
    try {
      const { rows, validation } = await parseExcelFile(uri, {
        ...state.templateRules,
        extraColumns: normalizedExtraColumns,
      });
      dispatch({ type: "SET_PARSED_DATA", payload: { rows, validation } });
      if (!validation.isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Parse failed";
      Alert.alert("Parse Error", msg);
    } finally {
      setParsing(false);
    }
  };

  const canProceed = state.excelFile && state.validation?.isValid && state.parsedRows.length > 0;

  const addColumn = () => {
    setExtraColumns((columns) => [...columns, ""]);
  };

  const updateColumn = (index: number, value: string) => {
    setExtraColumns((columns) => columns.map((column, columnIndex) => (columnIndex === index ? value : column)));
  };

  const removeColumn = (index: number) => {
    setExtraColumns((columns) => columns.filter((_, columnIndex) => columnIndex !== index));
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <FileUploadCard
        title="Upload Excel File"
        subtitle="Tap to browse or drag your product spreadsheet"
        acceptLabel=".xlsx · .xls"
        icon="file-text"
        selectedName={state.excelFile?.name}
        onPress={pickExcel}
        onClear={() => dispatch({ type: "SET_EXCEL_FILE", payload: null })}
        loading={parsing}
        extra={state.parsedRows.length > 0 ? `${state.parsedRows.length} products found` : null}
      />

      {state.validation && (
        <View style={styles.mt}>
          <ValidationSummary validation={state.validation} />
        </View>
      )}

      {state.parsedRows.length > 0 && (
        <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.previewTitle, { color: colors.foreground }]}>
            Preview — First 3 rows
          </Text>
          {state.parsedRows.slice(0, 3).map((row, i) => (
            <View key={i} style={[styles.previewRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.previewProduct, { color: colors.foreground }]} numberOfLines={1}>
                {row.productName || "—"}
              </Text>
              <Text style={[styles.previewImage, { color: colors.mutedForeground }]} numberOfLines={1}>
                {row.imageName || "—"}
              </Text>
            </View>
          ))}
          {state.parsedRows.length > 3 && (
            <Text style={[styles.more, { color: colors.mutedForeground }]}>
              +{state.parsedRows.length - 3} more rows
            </Text>
          )}
        </View>
      )}

      <View style={[styles.columnsCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.columnsHeader}>
          <View>
            <Text style={[styles.previewTitle, { color: colors.foreground, marginBottom: 0 }]}>Additional Columns</Text>
            <Text style={[styles.columnsSub, { color: colors.mutedForeground }]}>Add new blank columns that will be kept in the final output file.</Text>
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={addColumn} activeOpacity={0.85}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add Column</Text>
          </TouchableOpacity>
        </View>

        {extraColumns.length === 0 ? (
          <Text style={[styles.columnsEmpty, { color: colors.mutedForeground }]}>No extra columns added yet.</Text>
        ) : (
          <View style={styles.columnsList}>
            {extraColumns.map((column, index) => (
              <View key={`${index}-${column}`} style={styles.columnRow}>
                <TextInput
                  style={[
                    styles.columnInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={column}
                  onChangeText={(value) => updateColumn(index, value)}
                  placeholder="New column name"
                  placeholderTextColor={colors.mutedForeground}
                />
                <TouchableOpacity
                  style={[styles.removeBtn, { borderColor: colors.border }]}
                  onPress={() => removeColumn(index)}
                  activeOpacity={0.75}
                >
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {state.validation && !state.validation.isValid && (
        <TouchableOpacity
          style={[styles.retryBtn, { borderColor: colors.warning }]}
          onPress={pickExcel}
          activeOpacity={0.7}
        >
          <Feather name="refresh-cw" size={14} color={colors.warning} />
          <Text style={[styles.retryText, { color: colors.warning }]}>Re-upload corrected file</Text>
        </TouchableOpacity>
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
          <Text
            style={[
              styles.primaryBtnText,
              { color: canProceed ? "#fff" : colors.mutedForeground },
            ]}
          >
            Continue
          </Text>
          <Feather
            name="arrow-right"
            size={16}
            color={canProceed ? "#fff" : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  mt: { marginTop: 16 },
  preview: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 0,
  },
  columnsCard: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  columnsHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  previewTitle: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  columnsSub: { fontSize: 12, marginTop: 3, lineHeight: 18 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  columnsEmpty: { fontSize: 12 },
  columnsList: { gap: 10 },
  columnRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  columnInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  removeBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  previewProduct: { flex: 1, fontSize: 13, fontWeight: "500" },
  previewImage: { flex: 1, fontSize: 13, textAlign: "right" },
  more: { fontSize: 12, marginTop: 4, textAlign: "center" },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    justifyContent: "center",
  },
  retryText: { fontSize: 14, fontWeight: "600" },
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
