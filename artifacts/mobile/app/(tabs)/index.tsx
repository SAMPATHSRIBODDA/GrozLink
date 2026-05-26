import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Platform,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { DashboardCard } from "@/components/DashboardCard";
import { loadSessionHistory, SessionRecord } from "@/utils/storage";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const h = await loadSessionHistory();
    setHistory(h);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const totalProducts = history.reduce((a, s) => a + s.totalProducts, 0);
  const totalUploaded = history.reduce((a, s) => a + s.uploadedImages, 0);
  const totalFailed = history.reduce((a, s) => a + s.failedUploads, 0);
  const totalMatched = history.reduce((a, s) => a + s.matchedImages, 0);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 84) }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={styles.heroRow}>
            <View>
              <View style={styles.heroLogoCombo}>
                <Image
                  source={require("../../assets/images/grozio-logo.png")}
                  style={styles.heroLogoG}
                  resizeMode="contain"
                />
                <Text style={styles.heroLogoText}>ROZLINK</Text>
              </View>
              <Text style={styles.heroTitle}>Bulk Upload Manager</Text>
              <Text style={styles.heroSub}>Automate your product image uploads</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => router.push("/(tabs)/upload")}
            activeOpacity={0.85}
          >
            <Feather name="upload-cloud" size={16} color={colors.primary} />
            <Text style={[styles.heroBtnText, { color: colors.primary }]}>Start New Upload</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Overview</Text>
        <View style={styles.cardsRow}>
          <DashboardCard
            title="Total Products"
            value={totalProducts}
            icon="package"
            color={colors.primary}
          />
          <DashboardCard
            title="Matched"
            value={totalMatched}
            icon="link"
            color={colors.success}
          />
        </View>
        <View style={[styles.cardsRow, { marginTop: 10 }]}>
          <DashboardCard
            title="Uploaded"
            value={totalUploaded}
            icon="cloud"
            color={colors.primary}
          />
          <DashboardCard
            title="Failed"
            value={totalFailed}
            icon="alert-circle"
            color={colors.destructive}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Sessions</Text>
          <Text style={[styles.sessionCount, { color: colors.mutedForeground }]}>
            {history.length} total
          </Text>
        </View>

        {history.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="inbox" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No sessions yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Start your first bulk upload to see results here
            </Text>
          </View>
        ) : (
          history.slice(0, 10).map((session) => (
            <SessionCard key={session.id} session={session} colors={colors} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function SessionCard({ session, colors }: { session: SessionRecord; colors: ReturnType<typeof useColors> }) {
  const date = new Date(session.date);
  const dateStr = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionMeta}>
          <Text style={[styles.sessionFile, { color: colors.foreground }]} numberOfLines={1}>
            {session.excelFileName}
          </Text>
          <Text style={[styles.sessionDate, { color: colors.mutedForeground }]}>
            {dateStr} · {timeStr}
          </Text>
        </View>
        {session.failedUploads === 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.successLight }]}>
            <Text style={[styles.badgeText, { color: colors.success }]}>Success</Text>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: colors.warningLight }]}>
            <Text style={[styles.badgeText, { color: colors.warning }]}>Partial</Text>
          </View>
        )}
      </View>

      <View style={styles.sessionStats}>
        <SessionStat label="Products" value={session.totalProducts} colors={colors} />
        <SessionStat label="Matched" value={session.matchedImages} colors={colors} />
        <SessionStat label="Uploaded" value={session.uploadedImages} colors={colors} />
        <SessionStat label="Failed" value={session.failedUploads} colors={colors} highlight={session.failedUploads > 0} />
      </View>
    </View>
  );
}

function SessionStat({ label, value, colors, highlight }: { label: string; value: number; colors: ReturnType<typeof useColors>; highlight?: boolean }) {
  return (
    <View style={styles.sessionStat}>
      <Text style={[styles.sessionStatValue, { color: highlight ? colors.destructive : colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.sessionStatLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  hero: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 4,
    gap: 16,
  },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroLogoCombo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  heroLogoG: {
    width: 22,
    height: 22,
  },
  heroLogoText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    marginLeft: -3,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginTop: 2 },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
  },
  heroBtnText: { fontSize: 15, fontWeight: "700" },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginTop: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  sessionCount: { fontSize: 13 },
  cardsRow: { flexDirection: "row", gap: 10 },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptySub: { fontSize: 13, textAlign: "center" },
  sessionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginBottom: 4,
  },
  sessionHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  sessionMeta: { flex: 1, marginRight: 8 },
  sessionFile: { fontSize: 14, fontWeight: "600" },
  sessionDate: { fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  sessionStats: { flexDirection: "row", justifyContent: "space-between" },
  sessionStat: { alignItems: "center", gap: 2 },
  sessionStatValue: { fontSize: 18, fontWeight: "700" },
  sessionStatLabel: { fontSize: 10 },
});
