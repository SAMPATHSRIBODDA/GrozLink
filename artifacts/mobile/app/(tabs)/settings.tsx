import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useThemeMode } from "@/context/ThemeContext";
import {
  loadCloudinarySettings,
  saveCloudinarySettings,
  CloudinarySettings,
  defaultCloudinarySettings,
} from "@/utils/storage";
import { isCloudinaryConfigured } from "@/services/cloudinary";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { themeMode, setThemeMode } = useThemeMode();
  const [settings, setSettings] = useState<CloudinarySettings>(defaultCloudinarySettings);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  useEffect(() => {
    loadCloudinarySettings().then(setSettings);
  }, []);

  const update = <K extends keyof CloudinarySettings>(k: K, v: CloudinarySettings[K]) => {
    setSettings((s) => ({ ...s, [k]: v }));
  };

  const handleSave = async () => {
    if (!settings.cloudName.trim()) {
      Alert.alert("Error", "Cloud Name is required");
      return;
    }
    if (!settings.uploadPreset.trim()) {
      Alert.alert("Error", "Upload Preset is required");
      return;
    }
    setSaving(true);
    await saveCloudinarySettings(settings);
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Saved", "Cloudinary settings saved successfully");
  };

  const handleTest = async () => {
    if (!isCloudinaryConfigured(settings)) {
      Alert.alert("Not Configured", "Please enter your Cloud Name and Upload Preset first.");
      return;
    }
    Alert.alert(
      "Configuration Looks Good",
      `Cloud: ${settings.cloudName}\nPreset: ${settings.uploadPreset}\nFolder: ${settings.folder || "(default)"}`
    );
  };

  const configured = isCloudinaryConfigured(settings);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 8,
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 84),
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Settings</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: colors.orange100 }]}> 
            <Feather name="moon" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Appearance</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Switch between light, dark, or system mode</Text>
          </View>
        </View>

        <View style={styles.themeRow}>
          {(["system", "light", "dark"] as const).map((mode) => {
            const active = themeMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                onPress={() => setThemeMode(mode)}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: active ? colors.primary : colors.background,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.themeBtnText, { color: active ? "#fff" : colors.foreground }]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: colors.orange100 }]}>
            <Feather name="cloud" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Cloudinary Settings</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              Required for image uploads
            </Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: configured ? colors.success : colors.destructive }]} />
        </View>

        {(
          [
            { key: "cloudName", label: "Cloud Name", placeholder: "your-cloud-name", secure: false },
            { key: "uploadPreset", label: "Upload Preset", placeholder: "unsigned_preset", secure: false },
            { key: "folder", label: "Folder Name", placeholder: "grozio-products (optional)", secure: false },
          ] as const
        ).map((f) => (
          <View key={f.key} style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{f.label}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              value={settings[f.key]}
              onChangeText={(v) => update(f.key, v)}
              placeholder={f.placeholder}
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        ))}

        <View style={styles.fieldWrap}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>API Key (Optional)</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[
                styles.input,
                { flex: 1, backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground },
              ]}
              value={settings.apiKey}
              onChangeText={(v) => update("apiKey", v)}
              placeholder="Only needed for signed uploads"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowApiKey((s) => !s)}
              style={[styles.eyeBtn, { backgroundColor: colors.muted }]}
            >
              <Feather name={showApiKey ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.testBtn, { borderColor: colors.border }]}
            onPress={handleTest}
            activeOpacity={0.7}
          >
            <Feather name="check-circle" size={16} color={colors.mutedForeground} />
            <Text style={[styles.testBtnText, { color: colors.mutedForeground }]}>Test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Feather name="save" size={16} color="#fff" />
            <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save Settings"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: colors.orange100 }]}>
            <Feather name="info" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>How to Get Started</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Quick setup guide</Text>
          </View>
        </View>

        {[
          "1. Create a free Cloudinary account at cloudinary.com",
          '2. Go to Settings → Upload → Add upload preset set to "Unsigned"',
          "3. Copy your Cloud Name and Upload Preset above",
          "4. Optionally specify a folder to organize your uploads",
          "5. Start a new upload from the Upload tab",
        ].map((step, i) => (
          <Text key={i} style={[styles.guideStep, { color: colors.mutedForeground }]}>
            {step}
          </Text>
        ))}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Powered by GrozLink</Text>
        <Text style={[styles.footerVersion, { color: colors.mutedForeground }]}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  pageTitle: { fontSize: 28, fontWeight: "800", marginBottom: 16 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardSub: { fontSize: 12, marginTop: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: "auto" as const },
  themeRow: { flexDirection: "row", gap: 8 },
  themeBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 10,
  },
  themeBtnText: { fontSize: 13, fontWeight: "700" },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "500" },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  passwordRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  eyeBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  testBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  testBtnText: { fontSize: 14, fontWeight: "600" },
  saveBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  guideStep: { fontSize: 13, lineHeight: 20 },
  footer: {
    borderTopWidth: 1,
    paddingTop: 16,
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  footerText: { fontSize: 12, fontWeight: "600" },
  footerVersion: { fontSize: 11 },
});
