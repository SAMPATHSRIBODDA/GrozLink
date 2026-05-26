import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";

const { width: SW, height: SH } = Dimensions.get("window");

interface Props {
  onFinish: () => void;
}

export function SplashAnimation({ onFinish }: Props) {
  const truckX = useSharedValue(-SW);
  const truckScale = useSharedValue(0.85);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.6);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(24);
  const subtitleOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  const line1W = useSharedValue(0);
  const line2W = useSharedValue(0);
  const line3W = useSharedValue(0);

  useEffect(() => {
    line1W.value = withDelay(200, withTiming(SW * 0.55, { duration: 500, easing: Easing.out(Easing.quad) }));
    line2W.value = withDelay(300, withTiming(SW * 0.38, { duration: 400, easing: Easing.out(Easing.quad) }));
    line3W.value = withDelay(350, withTiming(SW * 0.22, { duration: 350, easing: Easing.out(Easing.quad) }));

    truckX.value = withSequence(
      withTiming(0, {
        duration: 700,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      withSpring(0, { damping: 18, stiffness: 200 })
    );

    truckScale.value = withDelay(
      700,
      withSpring(1, { damping: 14, stiffness: 180 })
    );

    logoOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
    logoScale.value = withDelay(
      500,
      withSpring(1, { damping: 14, stiffness: 160 })
    );

    titleOpacity.value = withDelay(1000, withTiming(1, { duration: 450 }));
    titleY.value = withDelay(
      1000,
      withSpring(0, { damping: 16, stiffness: 180 })
    );

    subtitleOpacity.value = withDelay(1300, withTiming(1, { duration: 400 }));

    containerOpacity.value = withDelay(
      2600,
      withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) }, (done) => {
        if (done) runOnJS(onFinish)();
      })
    );
  }, []);

  const truckStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: truckX.value }, { scale: truckScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const line1Style = useAnimatedStyle(() => ({ width: line1W.value }));
  const line2Style = useAnimatedStyle(() => ({ width: line2W.value }));
  const line3Style = useAnimatedStyle(() => ({ width: line3W.value }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.speedLines}>
        <Animated.View style={[styles.speedLine, styles.speedLine1, line1Style]} />
        <Animated.View style={[styles.speedLine, styles.speedLine2, line2Style]} />
        <Animated.View style={[styles.speedLine, styles.speedLine3, line3Style]} />
      </View>

      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Animated.View style={truckStyle}>
          <Image
            source={require("../assets/images/grozio-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>

      <Animated.Text style={[styles.title, titleStyle]}>
        Grozio
      </Animated.Text>

      <Animated.Text style={[styles.subtitle, subtitleStyle]}>
        Bulk Upload Manager
      </Animated.Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Grozio</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ff6b00",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  speedLines: {
    position: "absolute",
    left: 0,
    bottom: SH * 0.32,
    gap: 7,
    paddingLeft: 0,
  },
  speedLine: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  speedLine1: {},
  speedLine2: { marginLeft: 20 },
  speedLine3: { marginLeft: 44 },
  logoWrap: {
    marginBottom: 8,
  },
  logo: {
    width: SW * 0.7,
    height: SW * 0.7,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1,
    marginTop: 4,
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 48,
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
});
