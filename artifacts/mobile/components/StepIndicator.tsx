import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

const STEPS = ["Template", "Excel", "ZIP", "Match", "Upload", "Done"];

interface Props {
  currentStep: number;
}

export function StepIndicator({ currentStep }: Props) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {STEPS.map((label, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <React.Fragment key={i}>
              <View style={styles.stepWrap}>
                <View
                  style={[
                    styles.circle,
                    done && { backgroundColor: colors.primary, borderColor: colors.primary },
                    active && { backgroundColor: colors.primary, borderColor: colors.primary },
                    !done && !active && { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  {done ? (
                    <Text style={[styles.circleText, { color: colors.primaryForeground }]}>✓</Text>
                  ) : (
                    <Text
                      style={[
                        styles.circleText,
                        { color: active ? colors.primaryForeground : colors.mutedForeground },
                      ]}
                    >
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.label,
                    { color: active || done ? colors.primary : colors.mutedForeground },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: i < currentStep ? colors.primary : colors.border },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepWrap: {
    alignItems: "center",
    minWidth: 44,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  circleText: {
    fontSize: 11,
    fontWeight: "700",
  },
  label: {
    fontSize: 9,
    fontWeight: "500",
    marginTop: 3,
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 2,
    marginBottom: 14,
  },
});
