import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  subtitle: string;
  acceptLabel: string;
  icon: keyof typeof Feather.glyphMap;
  selectedName?: string | null;
  onPress: () => void;
  onClear?: () => void;
  loading?: boolean;
  extra?: string | null;
}

export function FileUploadCard({
  title,
  subtitle,
  acceptLabel,
  icon,
  selectedName,
  onPress,
  onClear,
  loading,
  extra,
}: Props) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: selectedName ? colors.primary : colors.border,
          borderWidth: selectedName ? 2 : 1.5,
          borderStyle: selectedName ? "solid" : "dashed",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" />
      ) : selectedName ? (
        <View style={styles.selectedContent}>
          <View style={[styles.fileIconWrap, { backgroundColor: colors.secondary }]}>
            <Feather name="check-circle" size={28} color={colors.primary} />
          </View>
          <View style={styles.fileInfo}>
            <Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={2}>
              {selectedName}
            </Text>
            {extra ? (
              <Text style={[styles.extra, { color: colors.mutedForeground }]}>{extra}</Text>
            ) : null}
          </View>
          {onClear && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onClear();
              }}
              style={[styles.clearBtn, { backgroundColor: colors.muted }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.emptyContent}>
          <View style={[styles.iconWrap, { backgroundColor: colors.orange100 }]}>
            <Feather name={icon} size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
          <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>{acceptLabel}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    minHeight: 160,
    justifyContent: "center",
  },
  emptyContent: {
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  selectedContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  fileIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
  },
  extra: {
    fontSize: 12,
    marginTop: 2,
  },
  clearBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
