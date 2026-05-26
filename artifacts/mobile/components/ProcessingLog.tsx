import React, { useRef, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  logs: string[];
  progress: number;
  total: number;
}

export function ProcessingLog({ logs, progress, total }: Props) {
  const colors = useColors();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [logs.length]);

  const percent = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.progressRow}>
        <Text style={[styles.progressText, { color: colors.foreground }]}>
          {progress} / {total} uploaded
        </Text>
        <Text style={[styles.percent, { color: colors.primary }]}>{percent}%</Text>
      </View>

      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: colors.primary,
              width: `${percent}%` as `${number}%`,
            },
          ]}
        />
      </View>

      <View style={[styles.logBox, { backgroundColor: "#0a0a0a" }]}>
        <ScrollView ref={scrollRef} style={styles.scroll} showsVerticalScrollIndicator={false}>
          {logs.map((log, i) => {
            const isError = log.includes("FAILED") || log.includes("Error");
            const isSuccess = log.includes("✓");
            return (
              <Text
                key={i}
                style={[
                  styles.log,
                  {
                    color: isError
                      ? "#ff6b6b"
                      : isSuccess
                      ? "#6bffb8"
                      : "#e0e0e0",
                  },
                ]}
              >
                {log}
              </Text>
            );
          })}
        </ScrollView>
      </View>
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
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
  },
  percent: {
    fontSize: 18,
    fontWeight: "700",
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
  logBox: {
    borderRadius: 10,
    padding: 10,
    height: 180,
  },
  scroll: {
    flex: 1,
  },
  log: {
    fontSize: 11,
    fontFamily: "monospace" as const,
    lineHeight: 18,
  },
});
