import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { loadCloudinarySettings, CloudinarySettings } from "@/utils/storage";
import { isCloudinaryConfigured, uploadImageToCloudinary } from "@/services/cloudinary";

type SelectedImage = {
  uri: string;
  name: string;
  mimeType: string;
};

type UploadRow = {
  name: string;
  url?: string;
  status: "success" | "failed";
  error?: string;
};

function getMimeType(fileName: string, mimeType?: string | null) {
  if (mimeType) return mimeType;
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "png": return "image/png";
    case "webp": return "image/webp";
    case "heic": return "image/heic";
    case "heif": return "image/heif";
    case "bmp": return "image/bmp";
    case "gif": return "image/gif";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

export default function MediaUploadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [settings, setSettings] = useState<CloudinarySettings | null>(null);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<UploadRow[]>([]);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const configured = useMemo(() => Boolean(settings && isCloudinaryConfigured(settings)), [settings]);
  const successCount = results.filter((row) => row.status === "success").length;
  const failedCount = results.filter((row) => row.status === "failed").length;

  const refreshSettings = useCallback(async () => {
    const next = await loadCloudinarySettings();
    setSettings(next);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshSettings();
    }, [refreshSettings])
  );

  const pickImages = async () => {
    if (uploading) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow media library access so you can select images for upload."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 50,
      quality: 0.85,
    });

    if (result.canceled || !result.assets.length) return;

    const nextImages: SelectedImage[] = result.assets.map((asset, index) => {
      const name = asset.fileName || `image-${index + 1}.jpg`;
      return {
        uri: asset.uri,
        name,
        mimeType: getMimeType(name, asset.mimeType),
      };
    });

    setSelectedImages(nextImages);
    setResults([]);
    setProgress({ done: 0, total: 0 });
  };

  const uploadImages = async () => {
    if (uploading) return;
    if (!settings || !isCloudinaryConfigured(settings)) {
      Alert.alert(
        "Cloudinary not configured",
        "Open Settings and enter your Cloud Name and Upload Preset first.",
        [{ text: "Go to Settings", onPress: () => router.push("/(tabs)/settings") }]
      );
      return;
    }
    if (!selectedImages.length) {
      Alert.alert("No images selected", "Pick one or more images first.");
      return;
    }

    setUploading(true);
    setResults([]);
    setProgress({ done: 0, total: selectedImages.length });

    const nextResults: UploadRow[] = [];

    for (let index = 0; index < selectedImages.length; index += 1) {
      const image = selectedImages[index];
      try {
        const base64 = await FileSystem.readAsStringAsync(image.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const url = await uploadImageToCloudinary(base64, image.mimeType, settings);
        nextResults.push({ name: image.name, url, status: "success" });
      } catch (error) {
        nextResults.push({
          name: image.name,
          status: "failed",
          error: error instanceof Error ? error.message : "Upload failed",
        });
      }

      setResults([...nextResults]);
      setProgress({ done: index + 1, total: selectedImages.length });
    }

    setUploading(false);

    const uploadedCount = nextResults.filter((row) => row.status === "success").length;
    const failedCount = nextResults.filter((row) => row.status === "failed").length;

    Alert.alert(
      "Upload finished",
      `${uploadedCount} uploaded successfully${failedCount ? `, ${failedCount} failed` : ""}.`
    );
  };

  const clearAll = () => {
    if (uploading) return;
    setSelectedImages([]);
    setResults([]);
    setProgress({ done: 0, total: 0 });
  };

  const copyUrl = async (url: string) => {
    await Clipboard.setStringAsync(url);
    Alert.alert("Copied", "Cloudinary URL copied to clipboard.");
  };

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
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={[styles.iconWrap, { backgroundColor: colors.orange100 }]}>
          <Feather name="image" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Direct Media Upload</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Pick one or many images from your phone, upload them to Cloudinary, and get the URL list instantly.</Text>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryPill, { backgroundColor: colors.secondary }]}>
            <Feather name="image" size={14} color={colors.primary} />
            <Text style={[styles.summaryText, { color: colors.primary }]}>{selectedImages.length} selected</Text>
          </View>
          <View style={[styles.summaryPill, { backgroundColor: colors.successLight }]}>
            <Feather name="check-circle" size={14} color={colors.success} />
            <Text style={[styles.summaryText, { color: colors.success }]}>{successCount} uploaded</Text>
          </View>
          <View style={[styles.summaryPill, { backgroundColor: colors.errorLight }]}>
            <Feather name="x-circle" size={14} color={colors.destructive} />
            <Text style={[styles.summaryText, { color: colors.destructive }]}>{failedCount} failed</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={pickImages}
            activeOpacity={0.85}
            disabled={uploading}
          >
            <Feather name="folder" size={16} color="#fff" />
            <Text style={styles.primaryBtnText}>Select Images</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => router.push("/(tabs)/settings")}
            activeOpacity={0.8}
          >
            <Feather name="settings" size={16} color={colors.mutedForeground} />
            <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>Settings</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.uploadBtn, { backgroundColor: configured ? colors.success : colors.muted, opacity: uploading ? 0.8 : 1 }]}
          onPress={uploadImages}
          activeOpacity={0.85}
          disabled={uploading}
        >
          {uploading ? <ActivityIndicator color="#fff" /> : <Feather name="upload" size={18} color="#fff" />}
          <Text style={styles.uploadBtnText}>
            {uploading ? `Uploading ${progress.done}/${progress.total}` : `Upload ${selectedImages.length || "Images"}`}
          </Text>
        </TouchableOpacity>

        {!configured && (
          <View style={[styles.notice, { backgroundColor: colors.warningLight }]}> 
            <Feather name="alert-circle" size={16} color={colors.warning} />
            <Text style={[styles.noticeText, { color: colors.warning }]}>Cloudinary is not configured yet. Save your Cloud Name and Upload Preset in Settings first.</Text>
          </View>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Selected Images</Text>
        <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{selectedImages.length} items</Text>
      </View>

      {selectedImages.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Feather name="image" size={30} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No images selected</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Tap Select Images to choose one or many photos from your device.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {selectedImages.map((image) => (
            <View key={`${image.uri}-${image.name}`} style={[styles.thumbCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Image source={{ uri: image.uri }} style={styles.thumb} />
              <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>{image.name}</Text>
              <Text style={[styles.itemMeta, { color: colors.mutedForeground }]} numberOfLines={1}>{image.mimeType}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upload Results</Text>
        <TouchableOpacity onPress={clearAll} disabled={uploading || (!selectedImages.length && !results.length)}>
          <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      {results.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Feather name="link" size={28} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No upload results yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>After upload, each row will show the image name and its Cloudinary URL.</Text>
        </View>
      ) : (
        <View style={styles.resultList}>
          {results.map((row) => (
            <View key={`${row.name}-${row.url ?? row.error}`} style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <View style={styles.resultHeader}>
                <Feather
                  name={row.status === "success" ? "check-circle" : "x-circle"}
                  size={16}
                  color={row.status === "success" ? colors.success : colors.destructive}
                />
                <Text style={[styles.resultName, { color: colors.foreground }]} numberOfLines={1}>{row.name}</Text>
              </View>
              {row.url ? (
                <View style={styles.resultUrlWrap}>
                  <TouchableOpacity onPress={() => Linking.openURL(row.url!)} activeOpacity={0.75} style={styles.resultUrlPressable}>
                    <Text style={[styles.resultUrl, { color: colors.primary }]} selectable>
                      {row.url}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => copyUrl(row.url!)}
                    style={[styles.copyBtn, { backgroundColor: colors.secondary }]}
                    activeOpacity={0.8}
                  >
                    <Feather name="copy" size={14} color={colors.primary} />
                    <Text style={[styles.copyBtnText, { color: colors.primary }]}>Copy</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={[styles.resultError, { color: colors.destructive }]}>{row.error}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  hero: {
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { fontSize: 13, lineHeight: 19 },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  summaryText: { fontSize: 12, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: 10 },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },
  primaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "700" },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 2,
  },
  uploadBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  sectionCount: { fontSize: 12 },
  clearText: { fontSize: 13, fontWeight: "700" },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptySub: { fontSize: 12, textAlign: "center", lineHeight: 18 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  thumbCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 6,
  },
  thumb: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },
  itemName: { fontSize: 13, fontWeight: "700" },
  itemMeta: { fontSize: 11 },
  resultList: { gap: 10 },
  resultCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  resultName: { flex: 1, fontSize: 14, fontWeight: "700" },
  resultUrlWrap: {
    gap: 8,
  },
  resultUrlPressable: {
    paddingVertical: 2,
  },
  resultUrl: { fontSize: 12, lineHeight: 18, fontWeight: "600" },
  resultError: { fontSize: 12, lineHeight: 18, fontWeight: "600" },
  copyBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  copyBtnText: { fontSize: 12, fontWeight: "700" },
});