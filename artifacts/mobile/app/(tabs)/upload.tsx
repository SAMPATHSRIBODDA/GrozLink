import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useUpload } from "@/context/UploadContext";
import { StepIndicator } from "@/components/StepIndicator";
import { Step0Template } from "@/components/steps/Step0Template";
import { Step1Excel } from "@/components/steps/Step1Excel";
import { Step2Zip } from "@/components/steps/Step2Zip";
import { Step3Match } from "@/components/steps/Step3Match";
import { Step4Process } from "@/components/steps/Step4Process";
import { Step5Results } from "@/components/steps/Step5Results";
import { loadCloudinarySettings } from "@/utils/storage";

const STEP_TITLES = [
  "Template Setup",
  "Upload Excel",
  "Upload Images",
  "Match Images",
  "Upload to Cloud",
  "Results",
];

export default function UploadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useUpload();

  useEffect(() => {
    loadCloudinarySettings().then((s) =>
      dispatch({ type: "SET_CLOUDINARY_SETTINGS", payload: s })
    );
  }, []);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const renderStep = () => {
    switch (state.step) {
      case 0: return <Step0Template />;
      case 1: return <Step1Excel />;
      case 2: return <Step2Zip />;
      case 3: return <Step3Match />;
      case 4: return <Step4Process />;
      case 5: return <Step5Results />;
      default: return <Step0Template />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.primary }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.logoCombo}>
              <Image
                source={require("../../assets/images/grozio-logo.png")}
                style={styles.logoG}
                resizeMode="contain"
              />
              <Text style={styles.logoText}>ROZLINK</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.headerTitle} numberOfLines={1}>{STEP_TITLES[state.step]}</Text>
          </View>
          {state.step < 5 && (
            <TouchableOpacity
              onPress={() => dispatch({ type: "RESET" })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={22} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.stepIndicatorWrap, { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14 }]}>
          <StepIndicator currentStep={state.step} />
        </View>
      </View>

      <View style={[styles.body, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 84) }]}>
        {renderStep()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoCombo: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoG: {
    width: 30,
    height: 30,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    marginLeft: -4,
    marginTop: 3,
    letterSpacing: -0.5,
  },
  divider: {
    width: 1.5,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    flex: 1,
  },
  stepIndicatorWrap: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
