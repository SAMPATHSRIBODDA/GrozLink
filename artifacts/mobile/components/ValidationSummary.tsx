import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ValidationResult } from "@/services/excel";
import { useColors } from "@/hooks/useColors";

interface Props {
  validation: ValidationResult;
}

export function ValidationSummary({ validation }: Props) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Feather
          name={validation.isValid ? "check-circle" : "alert-circle"}
          size={20}
          color={validation.isValid ? colors.success : colors.destructive}
        />
        <Text style={[styles.title, { color: colors.foreground }]}>
          {validation.isValid ? "Validation Passed" : "Validation Issues Found"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>REQUIRED COLUMNS</Text>
        {[...validation.foundColumns.map((c) => ({ name: c, found: true })),
          ...validation.missingRequired.map((c) => ({ name: c, found: false }))].map((col) => (
          <View key={col.name} style={styles.row}>
            <Feather
              name={col.found ? "check" : "x"}
              size={14}
              color={col.found ? colors.success : colors.destructive}
            />
            <Text style={[styles.colName, { color: colors.foreground }]}>{col.name}</Text>
            <Text
              style={[
                styles.status,
                { color: col.found ? colors.success : colors.destructive },
              ]}
            >
              {col.found ? "Found" : "Missing"}
            </Text>
          </View>
        ))}
      </View>

      {validation.missingOptional.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>OPTIONAL COLUMNS</Text>
          {validation.missingOptional.map((c) => (
            <View key={c} style={styles.row}>
              <Feather name="minus" size={14} color={colors.warning} />
              <Text style={[styles.colName, { color: colors.foreground }]}>{c}</Text>
              <Text style={[styles.status, { color: colors.warning }]}>Not found</Text>
            </View>
          ))}
        </View>
      )}

      {validation.duplicateHeaders.length > 0 && (
        <View style={[styles.alert, { backgroundColor: colors.errorLight }]}>
          <Feather name="alert-triangle" size={14} color={colors.destructive} />
          <Text style={[styles.alertText, { color: colors.destructive }]}>
            Duplicate columns: {validation.duplicateHeaders.join(", ")}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colName: {
    flex: 1,
    fontSize: 13,
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
  },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 8,
  },
  alertText: {
    fontSize: 12,
    flex: 1,
  },
});
