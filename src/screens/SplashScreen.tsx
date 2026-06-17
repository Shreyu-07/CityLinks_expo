import React, { useEffect, useRef } from 'react';
import { Animated, Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import FloatingBubbles from '../components/FloatingBubbles';
import { scale, vs } from '../utils/scaling';
import { BG_DARK, globalStyles as styles } from '../utils/theme';

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(30)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 35, friction: 7, delay: 200 }),
      Animated.timing(textY, { toValue: 0, duration: 700, delay: 300, useNativeDriver: true }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
    ])).start();
    const t = setTimeout(onFinish, 2600);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: BG_DARK, alignItems: "center", justifyContent: "center" }}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_DARK} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: BG_DARK }]} />
      <View style={{ position: "absolute", top: -scale(100), right: -scale(80), width: scale(350), height: scale(350), borderRadius: scale(175), backgroundColor: "rgba(99,102,241,0.18)" }} />
      <View style={{ position: "absolute", bottom: -scale(80), left: -scale(60), width: scale(280), height: scale(280), borderRadius: scale(140), backgroundColor: "rgba(59,130,246,0.12)" }} />
      <FloatingBubbles count={20} />
      <Animated.View style={{ opacity: glowAnim, position: "absolute", width: scale(160), height: scale(160), borderRadius: scale(80), backgroundColor: "rgba(99,102,241,0.15)" }} />
      <Animated.View style={[{ transform: [{ scale: logoScale }], opacity, alignItems: 'center', justifyContent: 'center', marginBottom: vs(24) }]}>
        <Image source={require('../../assets/images/logo.png')} style={{ width: scale(200), height: scale(200), resizeMode: 'contain' }} />
      </Animated.View>
      <Animated.View style={{ transform: [{ translateY: textY }], opacity, alignItems: "center" }}>
        <Text style={styles.splashTitle}>CityLinks</Text>
        <Text style={styles.splashSub}>Discover local Shops & Services near you</Text>
      </Animated.View>
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <View style={styles.splashBottomWave} />
      </View>
    </View>
  );
};

// ── Auth Screen ───────────────────────────────────────────────────────

export default SplashScreen;
