import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useUpload } from "@/context/UploadContext";
import {
  loadTemplateRules,
  saveTemplateRules,
  defaultTemplateRules,
  TemplateRules,
} from "@/utils/storage";

export function Step0Template() {
  const colors = useColors();
  const { state, dispatch, nextStep } = useUpload();
  const [rules, setRules] = useState<TemplateRules>(state.templateRules ?? defaultTemplateRules);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadTemplateRules().then((r) => {
      setRules(r);
      dispatch({ type: "SET_TEMPLATE_RULES", payload: r });
      setLoaded(true);
    });
  }, []);

  const update = <K extends keyof TemplateRules>(key: K, val: TemplateRules[K]) => {
    setRules((r) => ({ ...r, [key]: val }));
  };

  const handleSave = async () => {
    if (!rules.productNameColumn.trim() || !rules.imageNameColumn.trim() || !rules.imageUrlColumn.trim()) {
      Alert.alert("Validation Error", "Product Name, Image Name, and Image URL columns are required.");
      return;
    }
    setSaving(true);
    await saveTemplateRules(rules);
    dispatch({ type: "SET_TEMPLATE_RULES", payload: rules });
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    nextStep();
  };

  const handleReset = () => {
    setRules(defaultTemplateRules);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  if (!loaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>REQUIRED COLUMNS</Text>
        {(
          [
            { key: "productNameColumn", label: "Product Name Column", placeholder: "e.g. Product Name" },
            { key: "imageNameColumn", label: "Image Name Column", placeholder: "e.g. Image Name" },
            { key: "imageUrlColumn", label: "Image URL Column", placeholder: "e.g. Image URL" },
          ] as const
        ).map((f) => (
          <FieldInput
            key={f.key}
            label={f.label}
            placeholder={f.placeholder}
            value={rules[f.key]}
            onChange={(v) => update(f.key, v)}
            required
            colors={colors}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>OPTIONAL COLUMNS</Text>
        {(
          [
            { key: "priceColumn", label: "Price Column", placeholder: "e.g. Price" },
            { key: "categoryColumn", label: "Category Column", placeholder: "e.g. Category" },
            { key: "brandColumn", label: "Brand Column", placeholder: "e.g. Brand" },
          ] as const
        ).map((f) => (
          <FieldInput
            key={f.key}
            label={f.label}
            placeholder={f.placeholder}
            value={rules[f.key]}
            onChange={(v) => update(f.key, v)}
            colors={colors}
          />
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderRadius: 14, padding: 16 }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>MATCHING OPTIONS</Text>
        {(
          [
            { key: "caseSensitive", label: "Case-sensitive matching" },
            { key: "ignoreExtraSpaces", label: "Ignore extra spaces" },
            { key: "strictMode", label: "Strict mode (block on missing columns)" },
          ] as const
        ).map((f) => (
          <View key={f.key} style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.foreground }]}>{f.label}</Text>
            <Switch
              value={rules[f.key]}
              onValueChange={(v) => update(f.key, v)}
              trackColor={{ false: colors.border, true: colors.primary + "80" }}
              thumbColor={rules[f.key] ? colors.primary : colors.mutedForeground}
            />
          </View>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: colors.border }]}
          onPress={handleReset}
          activeOpacity={0.7}
        >
          <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
          <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.primaryBtnText}>Save & Continue</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function FieldInput({
  label,
  placeholder,
  value,
  onChange,
  required,
  colors,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
        {label}
        {required && <Text style={{ color: colors.primary }}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.foreground,
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  section: { marginBottom: 16, gap: 10 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  fieldWrap: { gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: "500" },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  switchLabel: { fontSize: 14, flex: 1 },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 8, marginBottom: 20 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "600" },
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
