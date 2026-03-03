import Ionicons from "@expo/vector-icons/Ionicons";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyAof8LPnKFTlnRQgRaD-EUDMlnSmPz9_44",
  authDomain: "fir-dddb2.firebaseapp.com",
  databaseURL: "https://fir-dddb2-default-rtdb.firebaseio.com",
  projectId: "fir-dddb2",
  storageBucket: "fir-dddb2.firebasestorage.app",
  messagingSenderId: "374284591449",
  appId: "1:374284591449:web:dd28359035026950946c48",
  measurementId: "G-2C2BMLHGWJ",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth;
const database = firebase.database;

// ── Responsive Scaling ────────────────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Base design width (iPhone 14 Pro = 393pt)
const BASE_W = 393;
const scale = (size: number) => (SCREEN_W / BASE_W) * size;
const vs = (size: number) => (SCREEN_H / 852) * size; // vertical scale
const ms = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor; // moderate scale

// Clamp helpers for readability
const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));
const rfs = (size: number) => clamp(ms(size), size * 0.85, size * 1.3); // responsive font size

// Safe area heights
const STATUS_BAR_H = Platform.OS === "ios" ? 44 : (StatusBar.currentHeight ?? 24);
const NAV_H = Platform.OS === "ios" ? STATUS_BAR_H + 44 : STATUS_BAR_H + 56;
const BOTTOM_TAB_H = Platform.OS === "ios" ? 83 : 60;

// ── Constants ─────────────────────────────────────────────────────────
const DEFAULT_AVATAR = "https://i.pravatar.cc/150?img=7";
const DEFAULT_SHOP_LOGO = "https://i.pravatar.cc/150?img=50";

// Color Palette — deep navy + electric blue + warm amber
const DEEP_BLUE = "#0B1E3D";
const NAVY = "#132847";
const BLUE = "#1D6FFF";
const BLUE_LIGHT = "#3D87FF";
const ACCENT = "#FF8C42";
const ACCENT_WARM = "#FFB347";
const BG = "#F2F6FC";
const CARD = "#FFFFFF";
const TEXT_DARK = "#0B1E3D";
const TEXT_MID = "#4A6890";
const TEXT_LIGHT = "#9BAEC8";
const BORDER = "#E0ECF8";
const SUCCESS = "#0CAF60";
const WHATSAPP_GREEN = "#25D366";

const SHOP_CATEGORIES = [
  "Kirana / General Store",
  "Supermarket / Mini-Mart",
  "Vegetable & Fruit Vendor",
  "Dairy Booth / Milk Parlor",
  "Pharmacy / Medical Store",
  "Apparel / Ready-made Garments",
  "Saree & Textile Shop",
  "Footwear Shop",
  "Jewelry Store",
  "Watch & Opticals",
  "Bag & Accessories Shop",
  "Mobile & Accessories Store",
  "Consumer Electronics Showroom",
  "Computer / Laptop Shop",
  "Electrical Hardware Shop",
  "Hardware & Paint Store",
  "Furniture Showroom",
  "Kitchenware / Utensils Shop",
  "Sanitaryware & Tiles",
  "Plywood & Glass Shop",
  "Sweet Mart / Condiments",
  "Bakery & Cake Shop",
  "Meat / Chicken Shop",
  "Tea / Coffee Stall",
  "Ice Cream Parlor",
  "Stationery & Xerox / Print Shop",
  "Salon / Barber Shop",
  "Automobile Spares (Two/Four Wheeler)",
  "Gift & Novelty Shop",
  "Flower Shop / Florist",
  "Cycle Shop",
  "Others",
];

// ── Global Data Store ─────────────────────────────────────────────────
interface LatLng { latitude: number; longitude: number; }
interface GlobalStoreType {
  shops: Record<string, any>;
  products: Record<string, any>;
  cartCount: number;
  userLocation: LatLng | null;
}
const GlobalStore: GlobalStoreType = {
  shops: {},
  products: {},
  cartCount: 0,
  userLocation: null,
};

// ── Types ─────────────────────────────────────────────────────────────
type UserRole = "user" | "shopkeeper" | null;
interface UserData {
  email?: string;
  role?: UserRole;
  fullName?: string;
  shopName?: string;
  photoURL?: string;
  shopPhoto?: string;
  note?: string;
  about?: string;
  type?: string;
  age?: string;
  gender?: string;
  phone?: string;
  location?: string;
  createdAt?: number;
  latitude?: number;
  longitude?: number;
}
interface Product {
  shopId: string;
  name: string;
  quantity: string;
  price: string;
  photo?: string;
  note?: string;
  category?: string;
  timestamp: number;
}
interface Review {
  rating: number;
  comment: string;
  timestamp: number;
  userName: string;
}
interface QueryItem {
  userId: string;
  userName: string;
  question: string;
  answer: string;
  timestamp: number;
  answerTimestamp: number | null;
  answeredBy: string | null;
}

// ── Location Helpers ──────────────────────────────────────────────────
const requestLocationPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
};

const getCurrentLocation = async () => {
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const { latitude, longitude } = pos.coords;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      { headers: { "User-Agent": "CityLinksApp/1.0" } },
    );
    const data = await res.json();
    const cityName =
      data?.address?.city || data?.address?.town || data?.address?.village || "";
    return { latitude, longitude, cityName };
  } catch {
    return { latitude, longitude };
  }
};

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (km: number) => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
};

// ── Context ───────────────────────────────────────────────────────────
const AppContext = React.createContext<{
  currentUser: any | null;
  currentRole: UserRole;
  setCurrentUser: (u: any | null) => void;
  setCurrentRole: (r: UserRole) => void;
  tempProdPhoto: string | null;
  setTempProdPhoto: (v: string | null) => void;
}>({
  currentUser: null,
  currentRole: null,
  setCurrentUser: () => { },
  setCurrentRole: () => { },
  tempProdPhoto: null,
  setTempProdPhoto: () => { },
});

const Stack = createStackNavigator();

// ── Photo Picker ──────────────────────────────────────────────────────
const pickPhoto = async (callback: (b64: string) => void) => {
  Alert.alert("Photo", "Choose source", [
    {
      text: "Camera",
      onPress: async () => {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          base64: true,
          quality: 0.8,
          allowsEditing: true,
        });
        if (!result.canceled && result.assets[0]?.base64)
          callback(`data:image/jpeg;base64,${result.assets[0].base64}`);
      },
    },
    {
      text: "Gallery",
      onPress: async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          base64: true,
          quality: 0.8,
          allowsEditing: true,
        });
        if (!result.canceled && result.assets[0]?.base64)
          callback(`data:image/jpeg;base64,${result.assets[0].base64}`);
      },
    },
    { text: "Cancel", style: "cancel" },
  ]);
};

// ── Contact Helpers ───────────────────────────────────────────────────
const handleCall = (phone: string) => {
  const url = `tel:${phone.replace(/\s+|-/g, "")}`;
  Linking.canOpenURL(url).then((ok) => {
    if (ok) Linking.openURL(url);
    else Alert.alert("Error", "Unable to make a call on this device.");
  });
};

const handleWhatsApp = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  const url = `whatsapp://send?phone=${cleaned}`;
  Linking.canOpenURL(url).then((ok) => {
    if (ok) Linking.openURL(url);
    else Linking.openURL(`https://wa.me/${cleaned}`);
  });
};

// ── Floating Bubbles ──────────────────────────────────────────────────
interface BubbleConfig { id: number; x: number; size: number; duration: number; delay: number; opacity: number; }

const generateBubbles = (count: number): BubbleConfig[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_W,
    size: scale(8) + Math.random() * scale(36),
    duration: 5000 + Math.random() * 5000,
    delay: Math.random() * 3500,
    opacity: 0.06 + Math.random() * 0.16,
  }));

const SingleBubble = ({ config }: { config: BubbleConfig }) => {
  const translateY = useRef(new Animated.Value(SCREEN_H + 60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(SCREEN_H + 60);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(config.delay),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -80, duration: config.duration, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: config.opacity, duration: 900, useNativeDriver: true }),
            Animated.delay(config.duration - 1800),
            Animated.timing(opacity, { toValue: 0, duration: 900, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: config.x - config.size / 2,
        width: config.size,
        height: config.size,
        borderRadius: config.size / 2,
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.45)",
        backgroundColor: "rgba(255,255,255,0.05)",
        transform: [{ translateY }],
        opacity,
      }}
    />
  );
};

const FloatingBubbles = ({ count = 12 }: { count?: number }) => {
  const bubbles = useRef(generateBubbles(count)).current;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bubbles.map((b) => <SingleBubble key={b.id} config={b} />)}
    </View>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────
const SkeletonBox = ({ w, h, r = 8, style }: { w: number | string; h: number; r?: number; style?: any }) => {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 850, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View style={[{ width: w as any, height: h, borderRadius: r, backgroundColor: "#D8E8F5", opacity: anim }, style]} />
  );
};

const ShopCardSkeleton = () => (
  <View style={[styles.shopCard, { padding: scale(16) }]}>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <SkeletonBox w={scale(72)} h={scale(72)} r={scale(18)} />
      <View style={{ flex: 1, marginLeft: scale(14), gap: scale(9) }}>
        <SkeletonBox w="68%" h={scale(17)} r={6} />
        <SkeletonBox w="40%" h={scale(13)} r={6} />
        <SkeletonBox w="55%" h={scale(11)} r={6} />
      </View>
    </View>
    <View style={{ height: 1, backgroundColor: BORDER, marginVertical: scale(12) }} />
    <View style={{ flexDirection: "row", gap: scale(8) }}>
      <SkeletonBox w="48%" h={scale(38)} r={12} />
      <SkeletonBox w="48%" h={scale(38)} r={12} />
    </View>
  </View>
);

// ── Contact Button ────────────────────────────────────────────────────
const ContactBtn = ({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) => {
  const scale_ = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale: scale_ }], flex: 1 }}>
      <TouchableOpacity
        style={[styles.contactBtn, { backgroundColor: color }]}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale_, { toValue: 0.93, useNativeDriver: true, speed: 30 }).start()}
        onPressOut={() => Animated.spring(scale_, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start()}
        activeOpacity={1}
      >
        <Ionicons name={icon as any} size={rfs(15)} color="white" />
        <Text style={styles.contactBtnText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Shop Card ─────────────────────────────────────────────────────────
const AnimatedShopCard = ({ shopId, shop, onPress, index, distanceKm }: { shopId: string; shop: UserData; onPress: () => void; index: number; distanceKm?: number }) => {
  const translateY = useRef(new Animated.Value(35)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const sc = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 380, delay: Math.min(index * 55, 330), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 380, delay: Math.min(index * 55, 330), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY }, { scale: sc }], opacity }}>
      <View style={styles.shopCard}>
        <TouchableOpacity
          style={styles.shopCardTop}
          onPress={onPress}
          onPressIn={() => Animated.spring(sc, { toValue: 0.975, useNativeDriver: true, speed: 30 }).start()}
          onPressOut={() => Animated.spring(sc, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start()}
          activeOpacity={1}
        >
          <View style={styles.shopImgWrap}>
            <Image source={{ uri: shop.shopPhoto || DEFAULT_SHOP_LOGO }} style={styles.shopCardImg} />
            <View style={styles.shopOnlineDot} />
          </View>
          <View style={styles.shopCardBody}>
            <Text style={styles.shopCardName} numberOfLines={1}>{shop.shopName}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: scale(6), marginTop: 3 }}>
              <View style={styles.typePill}>
                <Text style={styles.typePillText} numberOfLines={1}>{shop.type || "General"}</Text>
              </View>
              {distanceKm !== undefined && (
                <View style={styles.distancePill}>
                  <Ionicons name="navigate" size={rfs(9)} color={SUCCESS} />
                  <Text style={styles.distancePillText}>{formatDistance(distanceKm)}</Text>
                </View>
              )}
            </View>
            {shop.note ? <Text style={styles.shopCardNote} numberOfLines={1}>🎉 {shop.note}</Text> : null}
            {shop.location ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={rfs(10)} color={TEXT_LIGHT} />
                <Text style={styles.shopLocationText} numberOfLines={1}>{shop.location}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.shopCardArrow}>
            <Ionicons name="chevron-forward" size={rfs(16)} color={BLUE} />
          </View>
        </TouchableOpacity>

        {shop.phone && (
          <>
            <View style={styles.contactDivider} />
            <View style={styles.contactRow}>
              <ContactBtn icon="call" label="Call" color={BLUE} onPress={() => handleCall(shop.phone!)} />
              <View style={{ width: scale(8) }} />
              <ContactBtn icon="logo-whatsapp" label="WhatsApp" color={WHATSAPP_GREEN} onPress={() => handleWhatsApp(shop.phone!)} />
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
};

// ── Header Component ──────────────────────────────────────────────────
const BlueHeader = ({ children, extraPad = 0 }: { children: React.ReactNode; extraPad?: number }) => (
  <View style={[styles.blueHeader, { paddingBottom: scale(44) + extraPad }]}>
    <View style={[StyleSheet.absoluteFill, { backgroundColor: DEEP_BLUE }]} />
    {/* Decorative circles */}
    <View style={{ position: "absolute", top: -scale(50), right: -scale(40), width: scale(200), height: scale(200), borderRadius: scale(100), backgroundColor: "rgba(29,111,255,0.18)" }} />
    <View style={{ position: "absolute", top: scale(60), left: -scale(40), width: scale(150), height: scale(150), borderRadius: scale(75), backgroundColor: "rgba(10,40,180,0.14)" }} />
    <FloatingBubbles count={7} />
    {children}
    {/* Wave cutout */}
    <View style={styles.blueHeaderWave} />
  </View>
);

// ── Navbar ────────────────────────────────────────────────────────────
const Navbar = ({ title, subtitle, left, right }: { title?: React.ReactNode; subtitle?: string; left?: React.ReactNode; right?: React.ReactNode }) => (
  <View style={styles.navbar}>
    <View style={styles.navLeft}>{left ?? <View style={{ width: scale(36) }} />}</View>
    <View style={styles.navCenter}>
      {typeof title === "string" ? <Text style={styles.navTitle} numberOfLines={1}>{title}</Text> : title}
      {subtitle ? <Text style={styles.navSub}>{subtitle}</Text> : null}
    </View>
    <View style={styles.navRight}>{right ?? <View style={{ width: scale(36) }} />}</View>
  </View>
);

// ── Error Banner ──────────────────────────────────────────────────────
const ErrorBanner = ({ title, message, onDismiss, style }: any) => (
  <View style={[styles.errorBanner, style]}>
    <View style={styles.errorIcon}><Ionicons name="warning" size={rfs(18)} color="#fff" /></View>
    <View style={{ flex: 1 }}>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMsg}>{message}</Text>
    </View>
    <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
      <Ionicons name="close-circle" size={rfs(22)} color="#c0392b" />
    </TouchableOpacity>
  </View>
);

// ── Password Input ────────────────────────────────────────────────────
const PasswordInput = ({ value, onChange, placeholder, show, setShow, returnKeyType, onSubmit }: any) => (
  <View style={styles.pwWrap}>
    <TextInput
      style={styles.pwInput}
      placeholder={placeholder}
      placeholderTextColor={TEXT_LIGHT}
      secureTextEntry={!show}
      value={value}
      onChangeText={onChange}
      returnKeyType={returnKeyType || "next"}
      blurOnSubmit={returnKeyType === "done"}
      onSubmitEditing={onSubmit}
    />
    <TouchableOpacity style={styles.pwEye} onPress={() => setShow(!show)} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
      <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={rfs(22)} color={BLUE} />
    </TouchableOpacity>
  </View>
);

// ── Location Picker ───────────────────────────────────────────────────
const LocationPicker = ({ value, onChange, onCoordsChange, label = "Location / Area" }: { value: string; onChange: (v: string) => void; onCoordsChange?: (lat: number, lng: number) => void; label?: string }) => {
  const [detecting, setDetecting] = useState(false);

  const handleAutoDetect = async () => {
    setDetecting(true);
    try {
      const granted = await requestLocationPermission();
      if (!granted) { Alert.alert("Permission denied", "Allow location access in settings."); return; }
      const { latitude, longitude, cityName } = await getCurrentLocation();
      if (cityName) onChange(cityName);
      if (onCoordsChange) onCoordsChange(latitude, longitude);
      GlobalStore.userLocation = { latitude, longitude };
    } catch { Alert.alert("Location Error", "Could not detect location. Please enter manually."); }
    finally { setDetecting(false); }
  };

  return (
    <View style={{ marginBottom: scale(4) }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.locationPickerWrap}>
        <TextInput
          style={styles.locationInput}
          value={value}
          onChangeText={onChange}
          placeholder="City / Area (e.g. Mysore)"
          placeholderTextColor={TEXT_LIGHT}
          returnKeyType="done"
        />
        <TouchableOpacity style={[styles.locationDetectBtn, detecting && { opacity: 0.6 }]} onPress={handleAutoDetect} disabled={detecting}>
          {detecting ? <ActivityIndicator size="small" color="white" /> : <>
            <Ionicons name="locate" size={rfs(14)} color="white" />
            <Text style={styles.locationDetectText}>Auto</Text>
          </>}
        </TouchableOpacity>
      </View>
      <Text style={styles.hintText}>Tap "Auto" to detect or type manually</Text>
    </View>
  );
};

// ── Splash ────────────────────────────────────────────────────────────
const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 38, friction: 7, delay: 180 }),
      Animated.timing(textY, { toValue: 0, duration: 700, delay: 280, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(onFinish, 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: DEEP_BLUE, alignItems: "center", justifyContent: "center" }}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_BLUE} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: NAVY }]} />
      <View style={{ position: "absolute", top: -scale(80), right: -scale(60), width: scale(320), height: scale(320), borderRadius: scale(160), backgroundColor: "rgba(29,111,255,0.2)" }} />
      <View style={{ position: "absolute", bottom: -scale(60), left: -scale(50), width: scale(260), height: scale(260), borderRadius: scale(130), backgroundColor: "rgba(10,40,170,0.18)" }} />
      <FloatingBubbles count={18} />

      <Animated.View style={[styles.splashLogo, { transform: [{ scale: logoScale }], opacity }]}>
        <Ionicons name="storefront" size={scale(52)} color="white" />
      </Animated.View>
      <Animated.View style={{ transform: [{ translateY: textY }], opacity, alignItems: "center" }}>
        <Text style={styles.splashTitle}>CityLinks</Text>
        <Text style={styles.splashSub}>shop local • real-time</Text>
      </Animated.View>

      {/* Bottom wave */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: vs(120) }}>
        <View style={{ position: "absolute", bottom: -20, left: -20, right: -20, height: vs(100), borderTopLeftRadius: scale(80), borderTopRightRadius: scale(60), backgroundColor: "rgba(255,255,255,0.06)" }} />
      </View>
    </View>
  );
};

// ── Auth Screen ───────────────────────────────────────────────────────
const AuthScreen = ({ navigation }: any) => {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPass, setSignupPass] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [role, setRole] = useState<UserRole>(null);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [showLP, setShowLP] = useState(false);
  const [showSP, setShowSP] = useState(false);
  const [showSC, setShowSC] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setCurrentUser, setCurrentRole } = React.useContext(AppContext);

  const getErr = (e: any, ctx: string) => {
    const msg = String(e?.message || e || "Something went wrong");
    if (/network|request failed|fetch|connection|internet|timeout/i.test(msg))
      return { title: "Connection problem", message: "Check your internet and try again." };
    if (ctx === "login") {
      if (/invalid.*email|user.*not.*found/i.test(msg)) return { title: "Login failed", message: "No account with this email." };
      if (/wrong.*password|invalid.*password/i.test(msg)) return { title: "Wrong password", message: "Incorrect password. Try again." };
    }
    if (ctx === "signup" && /email.*already|already.*use/i.test(msg))
      return { title: "Email in use", message: "An account already exists with this email." };
    return { title: "Error", message: msg };
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPass) { setError({ title: "Missing fields", message: "Enter email and password." }); return; }
    setError(null); setLoading(true);
    try {
      const c = await auth().signInWithEmailAndPassword(loginEmail, loginPass);
      setCurrentUser(c.user);
    } catch (e) { setError(getErr(e, "login")); }
    finally { setLoading(false); }
  };

  const handleSignup = async () => {
    setError(null);
    if (!role) { setError({ title: "Select role", message: "Choose Customer or Shopkeeper." }); return; }
    if (signupPass !== signupConfirm) { setError({ title: "Passwords don't match", message: "Both fields must match." }); return; }
    if (signupPass.length < 6) { setError({ title: "Weak password", message: "Minimum 6 characters." }); return; }
    setLoading(true);
    try {
      const c = await auth().createUserWithEmailAndPassword(signupEmail, signupPass);
      if (!c.user) throw new Error("User creation failed.");
      await database().ref(`users/${c.user.uid}`).set({
        email: signupEmail, role, createdAt: Date.now(),
        photoURL: role === "user" ? DEFAULT_AVATAR : DEFAULT_SHOP_LOGO,
      });
      setCurrentUser(c.user);
      setCurrentRole(role);
    } catch (e) { setError(getErr(e, "signup")); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: DEEP_BLUE }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_BLUE} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: NAVY }]} />
      <View style={{ position: "absolute", top: -scale(80), right: -scale(50), width: scale(280), height: scale(280), borderRadius: scale(140), backgroundColor: "rgba(29,111,255,0.2)" }} />
      <View style={{ position: "absolute", top: scale(80), left: -scale(40), width: scale(180), height: scale(180), borderRadius: scale(90), backgroundColor: "rgba(10,40,180,0.15)" }} />
      <FloatingBubbles count={12} />

      <ScrollView contentContainerStyle={styles.authContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.authHeader}>
          <View style={styles.authLogoBubble}>
            <Ionicons name="storefront" size={scale(44)} color="white" />
          </View>
          <Text style={styles.authTitle}>CityLinks</Text>
          <Text style={styles.authSubtitle}>Discover local shops near you</Text>
        </View>

        <View style={styles.authSheet}>
          <View style={styles.authSheetHandle} />
          <View style={{ paddingHorizontal: scale(22), paddingTop: scale(4), paddingBottom: Math.max(scale(28), 28) }}>
            {error && <ErrorBanner title={error.title} message={error.message} onDismiss={() => setError(null)} style={{ marginBottom: scale(14) }} />}

            <View style={styles.tabRow}>
              {(["login", "signup"] as const).map((t) => (
                <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => { setTab(t); setError(null); }}>
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === "login" ? "Sign In" : "Register"}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {tab === "login" ? (
              <>
                <TextInput style={styles.input} placeholder="Email address" placeholderTextColor={TEXT_LIGHT} value={loginEmail} onChangeText={setLoginEmail} keyboardType="email-address" autoCapitalize="none" returnKeyType="next" />
                <PasswordInput value={loginPass} onChange={setLoginPass} placeholder="Password" show={showLP} setShow={setShowLP} returnKeyType="done" onSubmit={handleLogin} />
                <TouchableOpacity style={styles.forgotLink}><Text style={styles.forgotText}>Forgot password?</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
                  {loading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="log-in-outline" size={rfs(20)} color="white" />}
                  <Text style={styles.btnText}> {loading ? "Signing in…" : "Sign In"}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput style={styles.input} placeholder="Email address" placeholderTextColor={TEXT_LIGHT} value={signupEmail} onChangeText={setSignupEmail} keyboardType="email-address" autoCapitalize="none" returnKeyType="next" />
                <PasswordInput value={signupPass} onChange={setSignupPass} placeholder="Password" show={showSP} setShow={setShowSP} returnKeyType="next" />
                <PasswordInput value={signupConfirm} onChange={setSignupConfirm} placeholder="Confirm password" show={showSC} setShow={setShowSC} returnKeyType="done" onSubmit={handleSignup} />
                <Text style={styles.roleLabel}>Join as</Text>
                <View style={styles.roleRow}>
                  {([["shopkeeper", "storefront-outline", "Shopkeeper"], ["user", "person-outline", "Customer"]] as const).map(([r, icon, label]) => (
                    <TouchableOpacity key={r} style={[styles.roleBtn, role === r && styles.roleBtnActive]} onPress={() => setRole(r)}>
                      <Ionicons name={icon as any} size={rfs(18)} color={role === r ? "white" : BLUE} />
                      <Text style={[styles.roleBtnText, role === r && { color: "white" }]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleSignup} disabled={loading}>
                  {loading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="person-add-outline" size={rfs(20)} color="white" />}
                  <Text style={styles.btnText}> {loading ? "Creating…" : "Create Account"}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── Shopkeeper Details ────────────────────────────────────────────────
const ShopkeeperDetailsForm = ({ navigation }: any) => {
  const { currentUser, setCurrentRole } = React.useContext(AppContext);
  const [shopName, setShopName] = useState("");
  const [shopNote, setShopNote] = useState("");
  const [shopAbout, setShopAbout] = useState("");
  const [shopType, setShopType] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopLocation, setShopLocation] = useState("");
  const [shopCoords, setShopCoords] = useState<LatLng | null>(null);
  const [catModal, setCatModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shopPhoto, setShopPhoto] = useState<string | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);

  const handlePickPhoto = () => pickPhoto(async (b64) => {
    setShopPhoto(b64);
    if (currentUser) {
      setPhotoSaving(true);
      try { await database().ref(`users/${currentUser.uid}`).update({ shopPhoto: b64 }); } catch { }
      setPhotoSaving(false);
    }
  });

  const handleSave = async () => {
    if (!shopName.trim()) { Alert.alert("Error", "Shop name is required"); return; }
    if (shopPhone && shopPhone.replace(/\D/g, "").length < 10) { Alert.alert("Error", "Enter a valid phone number (at least 10 digits)"); return; }
    setSaving(true);
    try {
      const updates: any = { shopName: shopName.trim(), shopPhoto: shopPhoto || DEFAULT_SHOP_LOGO, note: shopNote, about: shopAbout, type: shopType || "Others", role: "shopkeeper", phone: shopPhone.trim(), location: shopLocation.trim() };
      if (shopCoords) { updates.latitude = shopCoords.latitude; updates.longitude = shopCoords.longitude; }
      await database().ref(`users/${currentUser!.uid}`).update(updates);
      setCurrentRole("shopkeeper");
      navigation.replace("ShopkeeperDashboard");
    } catch (e: any) { Alert.alert("Error", e.message); }
    finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>🏪 Set up your shop</Text>
          <Text style={styles.formSub}>Complete your profile to start selling</Text>

          <TouchableOpacity style={styles.shopPhotoPickerLarge} onPress={handlePickPhoto}>
            {shopPhoto
              ? <Image source={{ uri: shopPhoto }} style={styles.shopPhotoImg} />
              : <View style={styles.photoPlaceholder}>
                <View style={styles.cameraCircle}><Ionicons name="camera" size={rfs(30)} color={BLUE} /></View>
                <Text style={styles.photoHint}>Add shop photo</Text>
              </View>}
            {photoSaving && <View style={styles.photoOverlay}><ActivityIndicator color="white" /></View>}
          </TouchableOpacity>

          <Text style={styles.label}>Shop name *</Text>
          <TextInput style={styles.input} value={shopName} onChangeText={setShopName} placeholder="e.g. City Grocery" placeholderTextColor={TEXT_LIGHT} returnKeyType="next" />

          <Text style={styles.label}>Phone Number *</Text>
          <View style={styles.phoneInputWrap}>
            <View style={styles.phoneFlag}><Text style={styles.phoneCountryCode}>🇮🇳 +91</Text></View>
            <TextInput style={styles.phoneInput} value={shopPhone} onChangeText={setShopPhone} placeholder="Mobile number" placeholderTextColor={TEXT_LIGHT} keyboardType="phone-pad" returnKeyType="next" maxLength={15} />
          </View>
          <Text style={styles.hintText}>Customers can call or WhatsApp you directly</Text>

          <LocationPicker value={shopLocation} onChange={setShopLocation} onCoordsChange={(lat, lng) => setShopCoords({ latitude: lat, longitude: lng })} label="Shop Location *" />

          <Text style={styles.label}>Category</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setCatModal(true)}>
            <Text style={[styles.pickerText, !shopType && { color: TEXT_LIGHT }]}>{shopType || "Select category"}</Text>
            <Ionicons name="chevron-down" size={rfs(18)} color={BLUE} />
          </TouchableOpacity>

          <Text style={styles.label}>Offer / Tagline</Text>
          <TextInput style={styles.input} value={shopNote} onChangeText={setShopNote} placeholder="e.g. Fresh items daily!" placeholderTextColor={TEXT_LIGHT} returnKeyType="next" />

          <Text style={styles.label}>About</Text>
          <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={3} value={shopAbout} onChangeText={setShopAbout} placeholder="Describe your shop…" placeholderTextColor={TEXT_LIGHT} />

          <TouchableOpacity style={[styles.btn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="checkmark-circle-outline" size={rfs(20)} color="white" />}
            <Text style={styles.btnText}> {saving ? "Saving…" : "Open Dashboard"}</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={catModal} transparent animationType="slide" onRequestClose={() => setCatModal(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCatModal(false)}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Select category</Text>
              <FlatList data={SHOP_CATEGORIES} keyExtractor={(i) => i} renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setShopType(item); setCatModal(false); }}>
                  <Text style={styles.modalItemText}>{item}</Text>
                  {shopType === item && <Ionicons name="checkmark-circle" size={rfs(20)} color={BLUE} />}
                </TouchableOpacity>
              )} />
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── User Details ──────────────────────────────────────────────────────
const UserDetailsForm = ({ navigation }: any) => {
  const { currentUser, setCurrentRole } = React.useContext(AppContext);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [locCoords, setLocCoords] = useState<LatLng | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);

  const handlePickPhoto = () => pickPhoto(async (b64) => {
    setUserPhoto(b64);
    if (currentUser) {
      setPhotoSaving(true);
      try { await database().ref(`users/${currentUser.uid}`).update({ photoURL: b64 }); } catch { }
      setPhotoSaving(false);
    }
  });

  const handleSave = async () => {
    if (!fullName.trim()) { Alert.alert("Error", "Name is required"); return; }
    const updates: any = { fullName: fullName.trim(), age, gender, phone, location, photoURL: userPhoto || DEFAULT_AVATAR, role: "user" };
    if (locCoords) { updates.latitude = locCoords.latitude; updates.longitude = locCoords.longitude; }
    await database().ref(`users/${currentUser!.uid}`).update(updates);
    setCurrentRole("user");
    navigation.replace("UserDashboard");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>👤 Your Profile</Text>
          <Text style={styles.formSub}>Tell us a bit about yourself</Text>

          <TouchableOpacity style={styles.avatarPicker} onPress={handlePickPhoto}>
            {userPhoto
              ? <Image source={{ uri: userPhoto }} style={styles.avatarPickerImg} />
              : <View style={styles.photoPlaceholder}>
                <View style={styles.cameraCircle}><Ionicons name="camera" size={rfs(26)} color={BLUE} /></View>
                <Text style={styles.photoHint}>Add photo</Text>
              </View>}
            {photoSaving && <View style={styles.photoOverlay}><ActivityIndicator color="white" /></View>}
          </TouchableOpacity>

          <Text style={styles.label}>Full name *</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} returnKeyType="next" placeholder="Your name" placeholderTextColor={TEXT_LIGHT} />

          <Text style={styles.label}>Age</Text>
          <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" returnKeyType="next" placeholder="e.g. 25" placeholderTextColor={TEXT_LIGHT} />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {["Male", "Female", "Other"].map((g) => (
              <TouchableOpacity key={g} style={[styles.genderBtn, gender === g && styles.genderBtnActive]} onPress={() => setGender(g)}>
                <Text style={[styles.genderText, gender === g && { color: "white" }]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" returnKeyType="next" placeholder="+91 00000 00000" placeholderTextColor={TEXT_LIGHT} />

          <LocationPicker value={location} onChange={setLocation} onCoordsChange={(lat, lng) => setLocCoords({ latitude: lat, longitude: lng })} />

          <TouchableOpacity style={styles.btn} onPress={handleSave}>
            <Ionicons name="arrow-forward-circle-outline" size={rfs(20)} color="white" />
            <Text style={styles.btnText}> Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── Add Product ───────────────────────────────────────────────────────
const AddProductForm = () => {
  const { currentUser, tempProdPhoto, setTempProdPhoto } = React.useContext(AppContext);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [catModal, setCatModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const handleCancel = () => { setName(""); setQuantity(""); setPrice(""); setNote(""); setCategory(""); setTempProdPhoto(null); };

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert("Error", "Product name required"); return; }
    if (publishing) return;
    setPublishing(true);
    try {
      const prodId = database().ref("products").push().key;
      await database().ref(`products/${prodId}`).set({ shopId: currentUser!.uid, name: name.trim(), quantity, price, photo: tempProdPhoto || "", note, category: category || undefined, timestamp: Date.now() });
      Alert.alert("✅ Product added!");
      handleCancel();
    } catch (e: any) { Alert.alert("Error", e.message); }
    finally { setPublishing(false); }
  };

  return (
    <View style={[styles.formCard, { margin: scale(16) }]}>
      <Text style={styles.formTitle}>📦 New Product</Text>
      <TouchableOpacity style={styles.productPhotoPicker} onPress={() => pickPhoto((b64) => setTempProdPhoto(b64))}>
        {tempProdPhoto
          ? <Image source={{ uri: tempProdPhoto }} style={styles.productPhotoImg} />
          : <View style={styles.photoPlaceholder}>
            <View style={styles.cameraCircle}><Ionicons name="camera" size={rfs(24)} color={BLUE} /></View>
            <Text style={styles.photoHint}>Add photo</Text>
          </View>}
      </TouchableOpacity>

      <Text style={styles.label}>Product name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Fresh Apples" placeholderTextColor={TEXT_LIGHT} returnKeyType="next" />

      <View style={styles.row2}>
        <View style={{ flex: 1, marginRight: scale(8) }}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="1 kg, 2 pcs" placeholderTextColor={TEXT_LIGHT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Price (₹)</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="99" placeholderTextColor={TEXT_LIGHT} />
        </View>
      </View>

      <Text style={styles.label}>Category</Text>
      <TouchableOpacity style={styles.picker} onPress={() => setCatModal(true)}>
        <Text style={[styles.pickerText, !category && { color: TEXT_LIGHT }]}>{category || "Select category (optional)"}</Text>
        <Ionicons name="chevron-down" size={rfs(18)} color={BLUE} />
      </TouchableOpacity>

      <Text style={styles.label}>Note</Text>
      <TextInput style={[styles.input, styles.textArea]} multiline value={note} onChangeText={setNote} placeholder="Optional note" placeholderTextColor={TEXT_LIGHT} />

      <View style={styles.formActions}>
        {(name || quantity || price || category || tempProdPhoto) && (
          <TouchableOpacity style={[styles.btn, styles.btnOutline, { flex: 0.4 }]} onPress={handleCancel}>
            <Text style={[styles.btnText, { color: BLUE }]}>Clear</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.btn, { flex: 1 }, publishing && { opacity: 0.8 }]} onPress={handleSubmit} disabled={publishing}>
          {publishing ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="rocket-outline" size={rfs(20)} color="white" />}
          <Text style={styles.btnText}> {publishing ? "Adding…" : "Publish"}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={catModal} transparent animationType="slide" onRequestClose={() => setCatModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCatModal(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Product category</Text>
            <FlatList data={SHOP_CATEGORIES} keyExtractor={(i) => i} renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => { setCategory(item); setCatModal(false); }}>
                <Text style={styles.modalItemText}>{item}</Text>
                {category === item && <Ionicons name="checkmark-circle" size={rfs(20)} color={BLUE} />}
              </TouchableOpacity>
            )} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ── View Products ─────────────────────────────────────────────────────
const ViewProductsList = ({ navigation }: any) => {
  const { currentUser } = React.useContext(AppContext);
  const [products, setProducts] = useState<{ [key: string]: Product }>({});

  useEffect(() => {
    const ref = database().ref("products").orderByChild("shopId").equalTo(currentUser!.uid);
    const l = ref.on("value", (s) => setProducts(s.val() || {}));
    return () => ref.off("value", l);
  }, [currentUser]);

  const handleDelete = (id: string) => Alert.alert("Delete product?", "This cannot be undone.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: () => database().ref(`products/${id}`).remove() },
  ]);

  return (
    <View style={{ paddingHorizontal: scale(16) }}>
      <Text style={styles.sectionTitle}>My Products ({Object.keys(products).length})</Text>
      {Object.keys(products).length === 0
        ? <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={scale(60)} color={TEXT_LIGHT} />
          <Text style={styles.emptyText}>No products yet.</Text>
          <Text style={[styles.emptyText, { fontSize: rfs(13) }]}>Add your first product above!</Text>
        </View>
        : Object.entries(products).map(([id, p]) => (
          <View key={id} style={styles.productCard}>
            <Image source={{ uri: p.photo || "https://via.placeholder.com/90?text=📦" }} style={styles.productImg} />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.productPrice}>₹{p.price}</Text>
                <Text style={styles.productQty}>{p.quantity}</Text>
              </View>
              {p.note ? <Text style={styles.productNote} numberOfLines={1}>{p.note}</Text> : null}
              <View style={styles.productActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("EditProduct", { productId: id, productData: p })}>
                  <Ionicons name="pencil-outline" size={rfs(12)} color={BLUE} />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: "#e74c3c" }]} onPress={() => handleDelete(id)}>
                  <Ionicons name="trash-outline" size={rfs(12)} color="#e74c3c" />
                  <Text style={[styles.actionText, { color: "#e74c3c" }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
    </View>
  );
};

// ── Edit Product ──────────────────────────────────────────────────────
const EditProductForm = ({ route, navigation }: any) => {
  const { productId, productData } = route.params;
  const [name, setName] = useState(productData.name || "");
  const [quantity, setQuantity] = useState(productData.quantity || "");
  const [price, setPrice] = useState(productData.price || "");
  const [note, setNote] = useState(productData.note || "");
  const [photo, setPhoto] = useState(productData.photo || "");
  const [photoSaving, setPhotoSaving] = useState(false);

  const handlePickPhoto = () => pickPhoto(async (b64) => {
    setPhoto(b64);
    setPhotoSaving(true);
    try { await database().ref(`products/${productId}`).update({ photo: b64 }); } catch { }
    setPhotoSaving(false);
  });

  const handleUpdate = async () => {
    await database().ref(`products/${productId}`).update({ name, quantity, price, note, photo });
    Alert.alert("✅ Updated!");
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>✏️ Edit Product</Text>
          <TouchableOpacity style={styles.productPhotoPicker} onPress={handlePickPhoto}>
            {photo ? <Image source={{ uri: photo }} style={styles.productPhotoImg} /> : <View style={styles.photoPlaceholder}><View style={styles.cameraCircle}><Ionicons name="camera" size={rfs(24)} color={BLUE} /></View></View>}
            {photoSaving && <View style={styles.photoOverlay}><ActivityIndicator color="white" /></View>}
          </TouchableOpacity>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} returnKeyType="next" />
          <View style={styles.row2}>
            <View style={{ flex: 1, marginRight: scale(8) }}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Price (₹)</Text>
              <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />
            </View>
          </View>
          <Text style={styles.label}>Note</Text>
          <TextInput style={[styles.input, styles.textArea]} multiline value={note} onChangeText={setNote} />
          <View style={styles.formActions}>
            <TouchableOpacity style={[styles.btn, styles.btnOutline, { flex: 0.4 }]} onPress={() => navigation.goBack()}>
              <Text style={[styles.btnText, { color: BLUE }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={handleUpdate}>
              <Ionicons name="save-outline" size={rfs(20)} color="white" />
              <Text style={styles.btnText}> Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── Shopkeeper Dashboard ──────────────────────────────────────────────
const ShopkeeperDashboard = ({ navigation }: any) => {
  const { currentUser } = React.useContext(AppContext);
  const [shopData, setShopData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<"add" | "view">("add");

  useEffect(() => {
    const ref = database().ref(`users/${currentUser!.uid}`);
    const l = ref.on("value", (s) => setShopData(s.val()));
    return () => ref.off("value", l);
  }, [currentUser]);

  const handleLogout = async () => { await auth().signOut(); navigation.reset({ index: 0, routes: [{ name: "Auth" }] }); };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_BLUE} />

      <BlueHeader>
        <Navbar
          title="My Shop"
          subtitle={shopData?.shopName || "…"}
          right={
            <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
              <Image source={{ uri: shopData?.shopPhoto || DEFAULT_SHOP_LOGO }} style={styles.navAvatar} />
            </TouchableOpacity>
          }
        />
        {shopData && (
          <View style={styles.shopBannerBlue}>
            <Image source={{ uri: shopData.shopPhoto || DEFAULT_SHOP_LOGO }} style={styles.shopBannerImg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.shopBannerNameWhite} numberOfLines={1}>{shopData.shopName}</Text>
              <View style={styles.typePillLight}><Text style={styles.typePillLightText}>{shopData.type || "General"}</Text></View>
              {shopData.note ? <Text style={styles.shopBannerNoteWhite} numberOfLines={1}>{shopData.note}</Text> : null}
              {shopData.phone ? (
                <View style={styles.locationRow}>
                  <Ionicons name="call-outline" size={rfs(10)} color="rgba(255,255,255,0.8)" />
                  <Text style={[styles.shopLocationText, { color: "rgba(255,255,255,0.8)" }]}>{shopData.phone}</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity style={styles.editFabLight} onPress={() => navigation.navigate("EditProfile")}>
              <Ionicons name="pencil" size={rfs(14)} color={DEEP_BLUE} />
            </TouchableOpacity>
          </View>
        )}
      </BlueHeader>

      <View style={styles.segControl}>
        {(["add", "view"] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.segBtn, activeTab === t && styles.segBtnActive]} onPress={() => setActiveTab(t)}>
            <Ionicons name={t === "add" ? "add-circle-outline" : "grid-outline"} size={rfs(15)} color={activeTab === t ? "white" : BLUE} />
            <Text style={[styles.segText, activeTab === t && styles.segTextActive]}>{t === "add" ? "Add Product" : "My Products"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: BOTTOM_TAB_H + scale(16) }} keyboardShouldPersistTaps="handled">
        {activeTab === "add" ? <AddProductForm /> : <ViewProductsList navigation={navigation} />}
      </ScrollView>

      <BottomBar>
        <NavItem icon="storefront" label="Shop" active />
        <NavItem icon="person-circle-outline" label="Profile" onPress={() => navigation.navigate("Profile")} />
        <NavItem icon="log-out-outline" label="Logout" onPress={handleLogout} />
      </BottomBar>
    </View>
  );
};

// ── User Dashboard ────────────────────────────────────────────────────
const UserDashboard = ({ navigation }: any) => {
  const { currentUser } = React.useContext(AppContext);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [shops, setShops] = useState<{ [key: string]: UserData }>(GlobalStore.shops);
  const [shopsLoaded, setShopsLoaded] = useState(Object.keys(GlobalStore.shops).length > 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(GlobalStore.cartCount);
  const [userLocation, setUserLocation] = useState<LatLng | null>(GlobalStore.userLocation);
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [selectedCity, setSelectedCity] = useState("All");
  const [cityModalVisible, setCityModalVisible] = useState(false);

  useEffect(() => {
    if (!GlobalStore.userLocation) {
      (async () => {
        const granted = await requestLocationPermission();
        if (granted) {
          try {
            const pos = await getCurrentLocation();
            const loc = { latitude: pos.latitude, longitude: pos.longitude };
            GlobalStore.userLocation = loc;
            setUserLocation(loc);
          } catch { }
        }
      })();
    }
  }, []);

  useEffect(() => {
    const userRef = database().ref(`users/${currentUser!.uid}`);
    const ul = userRef.on("value", (s) => {
      const d = s.val();
      setUserData(d);
      if (!GlobalStore.userLocation && d?.latitude && d?.longitude) {
        const loc = { latitude: d.latitude, longitude: d.longitude };
        GlobalStore.userLocation = loc;
        setUserLocation(loc);
      }
    });
    const shopsRef = database().ref("users").orderByChild("role").equalTo("shopkeeper");
    const sl = shopsRef.on("value", (snap) => {
      const data = snap.val() || {};
      GlobalStore.shops = data;
      setShops(data);
      setShopsLoaded(true);
      Object.keys(data).forEach((shopId) => {
        database().ref("products").orderByChild("shopId").equalTo(shopId).once("value")
          .then((ps) => { GlobalStore.products[shopId] = ps.val() || {}; }).catch(() => { });
      });
    });
    const cartRef = database().ref(`carts/${currentUser!.uid}`);
    const cl = cartRef.on("value", (s) => {
      const v = s.val();
      const count = v ? Object.keys(v).length : 0;
      GlobalStore.cartCount = count;
      setCartCount(count);
    });
    return () => { userRef.off("value", ul); shopsRef.off("value", sl); cartRef.off("value", cl); };
  }, [currentUser]);

  const cityOptions = useMemo(() => {
    const cities = new Set<string>();
    Object.values(shops).forEach((s) => { if (s.location?.trim()) cities.add(s.location.trim()); });
    return ["All", ...Array.from(cities).sort()];
  }, [shops]);

  const filteredShops = useMemo(() => {
    const list = Object.entries(shops).filter(([, s]) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || s.shopName?.toLowerCase().includes(q) || s.type?.toLowerCase().includes(q) || s.location?.toLowerCase().includes(q);
      const matchCity = selectedCity === "All" || s.location?.toLowerCase().trim() === selectedCity.toLowerCase().trim();
      return matchSearch && matchCity;
    }).map(([id, s]) => {
      const distanceKm = userLocation && s.latitude && s.longitude ? haversineKm(userLocation.latitude, userLocation.longitude, s.latitude, s.longitude) : undefined;
      return { id, ...s, distanceKm };
    });
    list.sort((a, b) => {
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) return a.distanceKm - b.distanceKm;
      if (a.distanceKm !== undefined) return -1;
      if (b.distanceKm !== undefined) return 1;
      return (a.shopName || "").localeCompare(b.shopName || "");
    });
    return list;
  }, [shops, searchTerm, selectedCity, userLocation]);

  const handleDetectLocation = async () => {
    setDetectingLoc(true);
    try {
      const granted = await requestLocationPermission();
      if (!granted) { Alert.alert("Permission denied", "Allow location access in settings."); return; }
      const pos = await getCurrentLocation();
      const loc = { latitude: pos.latitude, longitude: pos.longitude };
      GlobalStore.userLocation = loc;
      setUserLocation(loc);
      const updates: any = { latitude: pos.latitude, longitude: pos.longitude };
      if (pos.cityName) updates.location = pos.cityName;
      await database().ref(`users/${currentUser!.uid}`).update(updates);
      Alert.alert("✅ Location updated", pos.cityName ? `You are in ${pos.cityName}` : "Location set!");
    } catch { Alert.alert("Error", "Could not detect location."); }
    finally { setDetectingLoc(false); }
  };

  const openShop = useCallback((shopId: string, shopData: UserData) => {
    Keyboard.dismiss();
    navigation.navigate("ShopProducts", { shopId, shopData, cachedProducts: GlobalStore.products[shopId] ?? null });
  }, [navigation]);

  const renderShopItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <AnimatedShopCard shopId={item.id} shop={item} index={index} distanceKm={item.distanceKm} onPress={() => openShop(item.id, item)} />
  ), [openShop]);

  const ListEmpty = !shopsLoaded
    ? <View>{[1, 2, 3].map((i) => <ShopCardSkeleton key={i} />)}</View>
    : <View style={styles.emptyState}>
      <Ionicons name="storefront-outline" size={scale(60)} color={TEXT_LIGHT} />
      <Text style={styles.emptyText}>No shops found</Text>
      {selectedCity !== "All" && (
        <TouchableOpacity onPress={() => setSelectedCity("All")} style={[styles.smallBtn, { alignSelf: "center", marginTop: scale(12) }]}>
          <Text style={styles.smallBtnText}>Show all areas</Text>
        </TouchableOpacity>
      )}
    </View>;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_BLUE} />

      <FlatList
        data={filteredShops}
        keyExtractor={(item) => item.id}
        renderItem={renderShopItem}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={{ paddingHorizontal: scale(16), paddingBottom: BOTTOM_TAB_H + scale(16) }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={10}
        initialNumToRender={6}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={[styles.blueHeader, { marginHorizontal: -scale(16), paddingBottom: scale(52) }]}>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: DEEP_BLUE }]} />
              <View style={{ position: "absolute", top: -scale(60), right: -scale(40), width: scale(220), height: scale(220), borderRadius: scale(110), backgroundColor: "rgba(29,111,255,0.2)" }} />
              <View style={{ position: "absolute", top: scale(50), left: -scale(40), width: scale(160), height: scale(160), borderRadius: scale(80), backgroundColor: "rgba(10,40,180,0.14)" }} />
              <FloatingBubbles count={8} />
              <Navbar
                title="CityLinks"
                subtitle="Find shops near you"
                right={
                  <View style={{ flexDirection: "row", alignItems: "center", gap: scale(12) }}>
                    <TouchableOpacity style={{ position: "relative" }} onPress={() => navigation.navigate("Cart")}>
                      <Ionicons name="cart-outline" size={rfs(24)} color="white" />
                      {cartCount > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                      <Image source={{ uri: userData?.photoURL || DEFAULT_AVATAR }} style={styles.navAvatar} />
                    </TouchableOpacity>
                  </View>
                }
              />
              <View style={styles.welcomeInner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.welcomeGreeting}>👋 Hello, {userData?.fullName?.split(" ")[0] || "there"}!</Text>
                  <TouchableOpacity style={styles.locationDetectRow} onPress={handleDetectLocation} disabled={detectingLoc}>
                    {detectingLoc ? <ActivityIndicator size="small" color="rgba(255,255,255,0.85)" /> : <Ionicons name="locate-outline" size={rfs(12)} color="rgba(255,255,255,0.9)" />}
                    <Text style={styles.welcomeLocation} numberOfLines={1}>{userData?.location || "Tap to detect location"}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.editFabLight} onPress={() => navigation.navigate("EditProfile")}>
                  <Ionicons name="pencil" size={rfs(14)} color={DEEP_BLUE} />
                </TouchableOpacity>
              </View>
              <View style={styles.blueHeaderWave} />
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={rfs(17)} color={TEXT_MID} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search shops or categories…"
                placeholderTextColor={TEXT_LIGHT}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              {searchTerm ? <TouchableOpacity onPress={() => setSearchTerm("")}><Ionicons name="close-circle" size={rfs(17)} color={TEXT_LIGHT} /></TouchableOpacity> : null}
            </View>

            {/* Filter Bar */}
            <View style={styles.filterBarRow}>
              <TouchableOpacity style={styles.cityFilterBtn} onPress={() => setCityModalVisible(true)}>
                <Ionicons name="location" size={rfs(13)} color={BLUE} />
                <Text style={styles.cityFilterText} numberOfLines={1}>{selectedCity === "All" ? "All Areas" : selectedCity}</Text>
                <Ionicons name="chevron-down" size={rfs(13)} color={BLUE} />
              </TouchableOpacity>
              <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
                <Text style={styles.sectionTitleLarge}>🏪 {shopsLoaded ? `${filteredShops.length} Shop${filteredShops.length !== 1 ? "s" : ""}` : "Shops"}</Text>
                {userLocation && (
                  <View style={[styles.callHintPill, { backgroundColor: "#e6f7ef" }]}>
                    <Ionicons name="navigate" size={rfs(9)} color={SUCCESS} />
                    <Text style={[styles.callHintText, { color: SUCCESS }]}>Nearest first</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        }
      />

      <BottomBar>
        <NavItem icon="home" label="Home" active />
        <NavItem icon="cart-outline" label="Cart" onPress={() => navigation.navigate("Cart")} badge={cartCount} />
        <NavItem icon="person-outline" label="Profile" onPress={() => navigation.navigate("Profile")} />
      </BottomBar>

      <Modal visible={cityModalVisible} transparent animationType="slide" onRequestClose={() => setCityModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCityModalVisible(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>📍 Filter by Area</Text>
            <FlatList
              data={cityOptions}
              keyExtractor={(i) => i}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.modalItem, selectedCity === item && { backgroundColor: "#EEF4FF" }]} onPress={() => { setSelectedCity(item); setCityModalVisible(false); }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: scale(10) }}>
                    <Ionicons name={item === "All" ? "globe-outline" : "location-outline"} size={rfs(15)} color={selectedCity === item ? BLUE : TEXT_MID} />
                    <Text style={[styles.modalItemText, selectedCity === item && { color: BLUE, fontWeight: "700" }]}>{item}</Text>
                  </View>
                  {selectedCity === item && <Ionicons name="checkmark-circle" size={rfs(20)} color={BLUE} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ── Shop Products ─────────────────────────────────────────────────────
const ShopProducts = ({ route, navigation }: any) => {
  const shopId: string = route.params?.shopId ?? "";
  const shopDataParam: UserData = route.params?.shopData ?? {};
  const [shop, setShop] = useState<UserData>(shopDataParam);
  const [products, setProducts] = useState<{ [key: string]: Product }>(route.params?.cachedProducts || {});
  const [productsLoaded, setProductsLoaded] = useState(!!route.params?.cachedProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceSort, setPriceSort] = useState<"none" | "low" | "high">("none");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [filterVisible, setFilterVisible] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const shopRef = database().ref(`users/${shopId}`);
    const sl = shopRef.on("value", (s) => { if (s.val()) setShop(s.val()); });
    const prodRef = database().ref("products").orderByChild("shopId").equalTo(shopId);
    const pl = prodRef.on("value", (s) => { const data = s.val() || {}; setProducts(data); GlobalStore.products[shopId] = data; setProductsLoaded(true); });
    return () => { shopRef.off("value", sl); prodRef.off("value", pl); };
  }, [shopId]);

  const filtered = useMemo(() => {
    let list = Object.entries(products).filter(([, p]) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (categoryFilter !== "All") list = list.filter(([, p]) => (p.category || "") === categoryFilter);
    if (priceSort === "low") list = [...list].sort((a, b) => Number(a[1].price) - Number(b[1].price));
    else if (priceSort === "high") list = [...list].sort((a, b) => Number(b[1].price) - Number(a[1].price));
    return list;
  }, [products, searchTerm, categoryFilter, priceSort]);

  const addToCart = async (productId: string) => {
    const user = auth().currentUser;
    if (!user) return Alert.alert("Please login to add to cart");
    await database().ref(`carts/${user.uid}/${productId}`).set({ productId, shopId, added: Date.now() });
    Alert.alert("✅ Added to cart!");
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_BLUE} />
      <BlueHeader extraPad={shop?.phone ? scale(10) : 0}>
        <Navbar
          title={shop?.shopName || "Shop"}
          left={
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="arrow-back" size={rfs(22)} color="white" />
            </TouchableOpacity>
          }
        />
        {shop && (
          <View style={styles.shopBannerBlue}>
            <Image source={{ uri: shop.shopPhoto || DEFAULT_SHOP_LOGO }} style={styles.shopBannerImg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.shopBannerNameWhite} numberOfLines={1}>{shop.shopName}</Text>
              <View style={styles.typePillLight}><Text style={styles.typePillLightText}>{shop.type || "General"}</Text></View>
              {shop.note ? <Text style={styles.shopBannerNoteWhite} numberOfLines={1}>{shop.note}</Text> : null}
              {shop.phone && (
                <View style={styles.bannerContactRow}>
                  <TouchableOpacity style={styles.bannerContactBtn} onPress={() => handleCall(shop.phone!)}>
                    <Ionicons name="call" size={rfs(12)} color="white" />
                    <Text style={styles.bannerContactText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.bannerContactBtn, { backgroundColor: WHATSAPP_GREEN }]} onPress={() => handleWhatsApp(shop.phone!)}>
                    <Ionicons name="logo-whatsapp" size={rfs(12)} color="white" />
                    <Text style={styles.bannerContactText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </BlueHeader>

      <View style={styles.searchFilterRow}>
        <View style={[styles.searchBar, { flex: 1, margin: 0 }]}>
          <Ionicons name="search-outline" size={rfs(15)} color={TEXT_MID} />
          <TextInput style={styles.searchInput} placeholder="Search products…" placeholderTextColor={TEXT_LIGHT} value={searchTerm} onChangeText={setSearchTerm} />
        </View>
        <TouchableOpacity style={[styles.filterBtn, filterVisible && styles.filterBtnActive]} onPress={() => setFilterVisible(!filterVisible)}>
          <Ionicons name="options-outline" size={rfs(20)} color={filterVisible ? "white" : BLUE} />
        </TouchableOpacity>
      </View>

      {filterVisible && (
        <View style={styles.filterPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: scale(8) }}>
            {["All", ...SHOP_CATEGORIES].map((cat) => (
              <TouchableOpacity key={cat} style={[styles.chip, categoryFilter === cat && styles.chipActive]} onPress={() => setCategoryFilter(cat)}>
                <Text style={[styles.chipText, categoryFilter === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.chipRow}>
            {(["none", "low", "high"] as const).map((opt) => (
              <TouchableOpacity key={opt} style={[styles.chip, priceSort === opt && styles.chipActive]} onPress={() => setPriceSort(opt)}>
                <Text style={[styles.chipText, priceSort === opt && styles.chipTextActive]}>{opt === "none" ? "Default" : opt === "low" ? "↑ Price" : "↓ Price"}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: scale(16), paddingBottom: BOTTOM_TAB_H + scale(16) }}>
        {!productsLoaded
          ? [1, 2, 3].map((i) => (
            <View key={i} style={[styles.productCard, { gap: scale(12) }]}>
              <SkeletonBox w={scale(84)} h={scale(84)} r={scale(16)} />
              <View style={{ flex: 1, gap: scale(8) }}>
                <SkeletonBox w="70%" h={scale(16)} r={6} />
                <SkeletonBox w="40%" h={scale(14)} r={6} />
              </View>
            </View>
          ))
          : filtered.length === 0
            ? <View style={styles.emptyState}><Ionicons name="cube-outline" size={scale(60)} color={TEXT_LIGHT} /><Text style={styles.emptyText}>No products found</Text></View>
            : filtered.map(([prodId, p]) => (
              <TouchableOpacity key={prodId} style={styles.productCard} onPress={() => navigation.navigate("ProductDetail", { shopId, productId: prodId, productData: p, shopData: shop })}>
                <Image source={{ uri: p.photo || "https://via.placeholder.com/90?text=📦" }} style={styles.productImg} />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>₹{p.price}</Text>
                    <Text style={styles.productQty}>{p.quantity}</Text>
                  </View>
                  {p.note ? <Text style={styles.productNote} numberOfLines={1}>{p.note}</Text> : null}
                  <TouchableOpacity style={styles.addCartBtn} onPress={(e) => { e.stopPropagation(); addToCart(prodId); }}>
                    <Ionicons name="cart-outline" size={rfs(12)} color="white" />
                    <Text style={styles.addCartText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
      </ScrollView>

      <BottomBar>
        <NavItem icon="home-outline" label="Home" onPress={() => navigation.navigate("UserDashboard")} />
        <NavItem icon="cart-outline" label="Cart" onPress={() => navigation.navigate("Cart")} badge={GlobalStore.cartCount} />
        <NavItem icon="person-outline" label="Profile" onPress={() => navigation.navigate("Profile")} />
      </BottomBar>
    </View>
  );
};

// ── Product Detail ────────────────────────────────────────────────────
const ProductDetail = ({ route, navigation }: any) => {
  const { shopId, productId } = route.params;
  const { currentUser } = React.useContext(AppContext);
  const [product, setProduct] = useState<Product | null>(route.params?.productData || null);
  const [shop, setShop] = useState<UserData | null>(route.params?.shopData || null);
  const [reviews, setReviews] = useState<{ [key: string]: Review }>({});
  const [queries, setQueries] = useState<{ [key: string]: QueryItem }>({});
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [answerTexts, setAnswerTexts] = useState<{ [key: string]: string }>({});
  const isShopOwner = currentUser?.uid === shopId;

  useEffect(() => {
    const refs: any[] = [
      [database().ref(`products/${productId}`), (s: any) => { if (s.val()) setProduct(s.val()); }],
      [database().ref(`users/${shopId}`), (s: any) => { if (s.val()) setShop(s.val()); }],
      [database().ref(`reviews/${productId}`), (s: any) => setReviews(s.val() || {})],
      [database().ref(`queries/${productId}`), (s: any) => setQueries(s.val() || {})],
    ];
    const ls = refs.map(([ref, cb]) => { const l = ref.on("value", cb); return [ref, l]; });
    return () => ls.forEach(([ref, l]) => ref.off("value", l));
  }, [productId, shopId]);

  const submitReview = async () => {
    if (!currentUser) return Alert.alert("Please login");
    if (!selectedRating) return Alert.alert("Select a rating first");
    const snap = await database().ref(`users/${currentUser.uid}`).once("value");
    const u = snap.val() || {};
    await database().ref(`reviews/${productId}/${currentUser.uid}`).set({ rating: selectedRating, comment: reviewComment, timestamp: Date.now(), userName: u.fullName || u.shopName || "User" });
    Alert.alert("✅ Review submitted!");
    setSelectedRating(0); setReviewComment("");
  };

  const submitQuery = async () => {
    if (!newQuestion.trim()) return Alert.alert("Enter a question");
    const snap = await database().ref(`users/${currentUser!.uid}`).once("value");
    const u = snap.val() || {};
    await database().ref(`queries/${productId}`).push({ userId: currentUser!.uid, userName: u.fullName || u.shopName || "Customer", question: newQuestion, answer: "", timestamp: Date.now(), answerTimestamp: null, answeredBy: null });
    setNewQuestion("");
  };

  const answerQuery = async (qid: string) => {
    const a = answerTexts[qid];
    if (!a?.trim()) return;
    await database().ref(`queries/${productId}/${qid}`).update({ answer: a, answerTimestamp: Date.now(), answeredBy: currentUser!.uid });
    setAnswerTexts((p) => ({ ...p, [qid]: "" }));
  };

  const addToCart = async () => {
    if (!currentUser) return Alert.alert("Please login to add to cart");
    await database().ref(`carts/${currentUser.uid}/${productId}`).set({ productId, shopId, added: Date.now() });
    Alert.alert("✅ Added to cart!");
  };

  if (!product) return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={BLUE} /></View>;

  const revArr = Object.values(reviews);
  const avgRating = revArr.length ? (revArr.reduce((a, r) => a + r.rating, 0) / revArr.length).toFixed(1) : null;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_BLUE} />
      <ScrollView contentContainerStyle={{ paddingBottom: scale(32) }}>
        <View style={styles.navbarBlue}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={rfs(22)} color="white" />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>{product.name}</Text>
          <View style={{ width: scale(36) }} />
        </View>

        <View style={styles.detailCard}>
          <Image source={{ uri: product.photo || "https://via.placeholder.com/300?text=📦" }} style={styles.detailImg} />
          <View style={styles.detailBody}>
            <Text style={styles.detailName}>{product.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.detailPrice}>₹{product.price}</Text>
              <Text style={styles.productQty}>{product.quantity}</Text>
            </View>
            {product.note ? <Text style={styles.productNote}>{product.note}</Text> : null}
            <Text style={styles.shopRef}>🏪 {shop?.shopName || "Loading…"}</Text>
            {!isShopOwner && currentUser && (
              <TouchableOpacity style={styles.addCartBtnLg} onPress={addToCart}>
                <Ionicons name="cart-outline" size={rfs(18)} color="white" />
                <Text style={[styles.btnText, { marginLeft: scale(8) }]}>Add to Cart</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Reviews</Text>
            {avgRating && <View style={styles.ratingPill}><Text style={styles.ratingPillText}>{avgRating} / 5</Text></View>}
          </View>
          {revArr.length === 0 && <Text style={styles.emptyText}>No reviews yet. Be first!</Text>}
          {Object.entries(reviews).map(([uid, rev]) => (
            <View key={uid} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Text style={styles.reviewUser}>{rev.userName}</Text>
                <Text style={styles.reviewStars}>{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</Text>
              </View>
              {rev.comment ? <Text style={styles.reviewComment}>{rev.comment}</Text> : null}
              {isShopOwner && <TouchableOpacity onPress={() => database().ref(`reviews/${productId}/${uid}`).remove()} style={{ alignSelf: "flex-end", marginTop: scale(4) }}><Ionicons name="trash-outline" size={rfs(16)} color="#e74c3c" /></TouchableOpacity>}
            </View>
          ))}
          {!isShopOwner && currentUser && (
            <View style={styles.addReview}>
              <Text style={styles.subSectionTitle}>Leave a Review</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TouchableOpacity key={i} onPress={() => setSelectedRating(i)}>
                    <Ionicons name={i <= selectedRating ? "star" : "star-outline"} size={scale(30)} color="#ffb82e" />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={[styles.input, { height: scale(72), textAlignVertical: "top" }]} placeholder="Your thoughts…" multiline value={reviewComment} onChangeText={setReviewComment} />
              <TouchableOpacity style={styles.smallBtn} onPress={submitReview}>
                <Ionicons name="send-outline" size={rfs(13)} color="white" />
                <Text style={styles.smallBtnText}> Submit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, { marginBottom: scale(16) }]}>
          <Text style={styles.sectionTitle}>💬 Q&A</Text>
          {Object.keys(queries).length === 0 && <Text style={styles.emptyText}>No questions yet.</Text>}
          {Object.entries(queries).map(([qid, q]) => (
            <View key={qid} style={styles.qCard}>
              <Text style={styles.qUser}>{q.userName}</Text>
              <Text style={styles.qQuestion}>Q: {q.question}</Text>
              {q.answer ? (
                <View style={styles.answerBox}><Text style={styles.answerText}>A: {q.answer}</Text></View>
              ) : isShopOwner ? (
                <>
                  <TextInput style={[styles.input, { marginTop: scale(8) }]} placeholder="Write your answer…" value={answerTexts[qid] || ""} onChangeText={(t) => setAnswerTexts((p) => ({ ...p, [qid]: t }))} />
                  <TouchableOpacity style={styles.smallBtn} onPress={() => answerQuery(qid)}><Text style={styles.smallBtnText}>Post Answer</Text></TouchableOpacity>
                </>
              ) : <Text style={styles.awaitingText}>⏳ Awaiting shopkeeper reply</Text>}
            </View>
          ))}
          {!isShopOwner && currentUser && (
            <View style={styles.addReview}>
              <Text style={styles.subSectionTitle}>Ask a Question</Text>
              <TextInput style={[styles.input, { height: scale(72), textAlignVertical: "top" }]} placeholder="Type your question…" multiline value={newQuestion} onChangeText={setNewQuestion} />
              <TouchableOpacity style={styles.smallBtn} onPress={submitQuery}>
                <Ionicons name="chatbubble-outline" size={rfs(13)} color="white" />
                <Text style={styles.smallBtnText}> Ask</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ── Cart ──────────────────────────────────────────────────────────────
const CartScreen = ({ navigation }: any) => {
  const { currentUser } = React.useContext(AppContext);
  const [cartItems, setCartItems] = useState<{ [k: string]: any }>({});
  const [products, setProducts] = useState<{ [k: string]: Product }>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cartRef = database().ref(`carts/${currentUser!.uid}`);
    const l = cartRef.on("value", async (snap) => {
      const cart = snap.val() || {};
      setCartItems(cart);
      let sum = 0;
      const map: { [k: string]: Product } = {};
      await Promise.all(Object.keys(cart).map(async (pid) => {
        const ps = await database().ref(`products/${pid}`).once("value");
        const p = ps.val();
        if (p) { map[pid] = p; sum += Number(p.price) || 0; }
      }));
      setProducts(map);
      setTotal(sum);
      setLoading(false);
    });
    return () => cartRef.off("value", l);
  }, [currentUser]);

  const removeFromCart = (productId: string) => database().ref(`carts/${currentUser!.uid}/${productId}`).remove();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_BLUE} />
      <View style={styles.navbarBlue}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={rfs(22)} color="white" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>My Cart</Text>
        <View style={{ width: scale(36) }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: scale(16), paddingBottom: BOTTOM_TAB_H + scale(80) }}>
        {loading
          ? [1, 2].map((i) => <View key={i} style={[styles.productCard, { gap: scale(12) }]}><SkeletonBox w={scale(76)} h={scale(76)} r={scale(16)} /><View style={{ flex: 1, gap: scale(8) }}><SkeletonBox w="60%" h={scale(16)} r={6} /><SkeletonBox w="40%" h={scale(14)} r={6} /></View></View>)
          : Object.keys(cartItems).length === 0
            ? <View style={styles.emptyState}><Ionicons name="cart-outline" size={scale(68)} color={TEXT_LIGHT} /><Text style={styles.emptyText}>Your cart is empty</Text></View>
            : Object.keys(cartItems).map((prodId) => {
              const p = products[prodId];
              if (!p) return null;
              return (
                <View key={prodId} style={styles.productCard}>
                  <Image source={{ uri: p.photo || "https://via.placeholder.com/90" }} style={styles.productImg} />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.productPrice}>₹{p.price}</Text>
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(prodId)}>
                      <Ionicons name="trash-outline" size={rfs(13)} color="#e74c3c" />
                      <Text style={styles.removeBtnText}> Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
      </ScrollView>

      {Object.keys(cartItems).length > 0 && !loading && (
        <View style={styles.checkoutBar}>
          <View>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{total}</Text>
          </View>
          <TouchableOpacity style={[styles.btn, { marginTop: 0, flex: 0.55 }]}>
            <Ionicons name="bag-check-outline" size={rfs(18)} color="white" />
            <Text style={styles.btnText}> Checkout</Text>
          </TouchableOpacity>
        </View>
      )}

      <BottomBar>
        <NavItem icon="home-outline" label="Home" onPress={() => navigation.navigate("UserDashboard")} />
        <NavItem icon="cart" label="Cart" active />
        <NavItem icon="person-outline" label="Profile" onPress={() => navigation.navigate("Profile")} />
      </BottomBar>
    </View>
  );
};

// ── Profile ───────────────────────────────────────────────────────────
const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "—"}</Text>
  </View>
);

const ProfileScreen = ({ navigation }: any) => {
  const { currentUser, currentRole } = React.useContext(AppContext);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const ref = database().ref(`users/${currentUser!.uid}`);
    const l = ref.on("value", (s) => setUserData(s.val()));
    return () => ref.off("value", l);
  }, [currentUser]);

  const photo = currentRole === "shopkeeper" ? userData?.shopPhoto || DEFAULT_SHOP_LOGO : userData?.photoURL || DEFAULT_AVATAR;
  const name = currentRole === "shopkeeper" ? userData?.shopName : userData?.fullName;

  const handleLogout = async () => { await auth().signOut(); navigation.reset({ index: 0, routes: [{ name: "Auth" }] }); };

  const handleDeleteAccount = () => Alert.alert("Delete Account", "Permanently delete your account?", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: async () => { await database().ref(`users/${currentUser!.uid}`).remove(); await currentUser?.delete(); navigation.reset({ index: 0, routes: [{ name: "Auth" }] }); } },
  ]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_BLUE} />
      <ScrollView contentContainerStyle={{ paddingBottom: scale(40) }}>
        <View style={styles.navbarBlue}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={rfs(22)} color="white" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Profile</Text>
          <View style={{ width: scale(36) }} />
        </View>

        <View style={styles.profileHero}>
          <View style={styles.profileAvatarWrap}>
            <Image source={{ uri: photo }} style={styles.profileAvatar} />
            <TouchableOpacity style={styles.profileAvatarEdit} onPress={() => navigation.navigate("EditProfile")}>
              <Ionicons name="camera" size={rfs(13)} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{name || "User"}</Text>
          <Text style={styles.profileEmail}>{userData?.email || currentUser?.email}</Text>
          <View style={[styles.typePillLight, { marginTop: scale(8), alignSelf: "center" }]}>
            <Text style={styles.typePillLightText}>{currentRole === "shopkeeper" ? "🏪 Shopkeeper" : "🛍️ Customer"}</Text>
          </View>
        </View>

        <View style={[styles.formCard, { margin: scale(16) }]}>
          <Text style={styles.formTitle}>{currentRole === "shopkeeper" ? "Shop Info" : "Personal Info"}</Text>
          {currentRole === "shopkeeper" ? (
            <>
              <InfoRow label="Shop name" value={userData?.shopName} />
              <InfoRow label="Category" value={userData?.type} />
              <InfoRow label="About" value={userData?.about} />
              <InfoRow label="Offer note" value={userData?.note} />
              <InfoRow label="Phone" value={userData?.phone} />
            </>
          ) : (
            <>
              <InfoRow label="Full name" value={userData?.fullName} />
              <InfoRow label="Age" value={userData?.age} />
              <InfoRow label="Gender" value={userData?.gender} />
              <InfoRow label="Phone" value={userData?.phone} />
              <InfoRow label="Location" value={userData?.location} />
            </>
          )}
          <TouchableOpacity style={[styles.btn, { marginTop: scale(16) }]} onPress={() => navigation.navigate("EditProfile")}>
            <Ionicons name="create-outline" size={rfs(18)} color="white" />
            <Text style={styles.btnText}> Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.formCard, { margin: scale(16), marginTop: 0 }]}>
          <Text style={styles.formTitle}>Security</Text>
          <TouchableOpacity style={styles.secBtn} onPress={() => navigation.navigate("ChangePassword")}>
            <Ionicons name="key-outline" size={rfs(20)} color={BLUE} />
            <Text style={styles.secBtnText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={rfs(16)} color={TEXT_LIGHT} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={rfs(20)} color={TEXT_MID} />
            <Text style={[styles.secBtnText, { color: TEXT_MID }]}>Logout</Text>
            <Ionicons name="chevron-forward" size={rfs(16)} color={TEXT_LIGHT} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteAccBtn} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={rfs(17)} color="white" />
            <Text style={styles.deleteAccText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// ── Edit Profile ──────────────────────────────────────────────────────
const EditProfileScreen = ({ navigation }: any) => {
  const { currentUser, currentRole } = React.useContext(AppContext);
  const [shopName, setShopName] = useState("");
  const [shopNote, setShopNote] = useState("");
  const [shopAbout, setShopAbout] = useState("");
  const [shopType, setShopType] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopLocation, setShopLocation] = useState("");
  const [shopCoords, setShopCoords] = useState<LatLng | null>(null);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [locCoords, setLocCoords] = useState<LatLng | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);

  useEffect(() => {
    database().ref(`users/${currentUser!.uid}`).once("value").then((snap) => {
      const d = snap.val() || {};
      if (currentRole === "shopkeeper") {
        setShopName(d.shopName || ""); setShopNote(d.note || ""); setShopAbout(d.about || "");
        setShopType(d.type || ""); setPhoto(d.shopPhoto || null); setShopPhone(d.phone || ""); setShopLocation(d.location || "");
        if (d.latitude && d.longitude) setShopCoords({ latitude: d.latitude, longitude: d.longitude });
      } else {
        setFullName(d.fullName || ""); setAge(d.age || ""); setPhone(d.phone || ""); setLocation(d.location || ""); setPhoto(d.photoURL || null);
        if (d.latitude && d.longitude) setLocCoords({ latitude: d.latitude, longitude: d.longitude });
      }
    });
  }, []);

  const handlePickPhoto = () => pickPhoto(async (b64) => {
    setPhoto(b64); setPhotoSaving(true);
    const key = currentRole === "shopkeeper" ? "shopPhoto" : "photoURL";
    try { await database().ref(`users/${currentUser!.uid}`).update({ [key]: b64 }); } catch { }
    setPhotoSaving(false);
  });

  const handleSave = async () => {
    const updates: any = {};
    if (currentRole === "shopkeeper") {
      updates.shopName = shopName; updates.note = shopNote; updates.about = shopAbout;
      updates.type = shopType; updates.phone = shopPhone.trim(); updates.location = shopLocation.trim();
      if (shopCoords) { updates.latitude = shopCoords.latitude; updates.longitude = shopCoords.longitude; }
    } else {
      updates.fullName = fullName; updates.age = age; updates.phone = phone; updates.location = location;
      if (locCoords) { updates.latitude = locCoords.latitude; updates.longitude = locCoords.longitude; }
    }
    await database().ref(`users/${currentUser!.uid}`).update(updates);
    navigation.goBack();
  };

  const displayPhoto = photo || (currentRole === "shopkeeper" ? DEFAULT_SHOP_LOGO : DEFAULT_AVATAR);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>✏️ Edit {currentRole === "shopkeeper" ? "Shop" : "Profile"}</Text>
          <TouchableOpacity style={currentRole === "shopkeeper" ? styles.shopPhotoPickerLarge : styles.avatarPicker} onPress={handlePickPhoto}>
            <Image source={{ uri: displayPhoto }} style={currentRole === "shopkeeper" ? styles.shopPhotoImg : styles.avatarPickerImg} />
            <View style={styles.profileAvatarEdit}><Ionicons name="camera" size={rfs(13)} color="white" /></View>
            {photoSaving && <View style={styles.photoOverlay}><ActivityIndicator color="white" /></View>}
          </TouchableOpacity>

          {currentRole === "shopkeeper" ? (
            <>
              <Text style={styles.label}>Shop name</Text>
              <TextInput style={styles.input} value={shopName} onChangeText={setShopName} returnKeyType="next" />
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneInputWrap}>
                <View style={styles.phoneFlag}><Text style={styles.phoneCountryCode}>🇮🇳 +91</Text></View>
                <TextInput style={styles.phoneInput} value={shopPhone} onChangeText={setShopPhone} placeholder="Mobile number" placeholderTextColor={TEXT_LIGHT} keyboardType="phone-pad" returnKeyType="next" maxLength={15} />
              </View>
              <LocationPicker value={shopLocation} onChange={setShopLocation} onCoordsChange={(lat, lng) => setShopCoords({ latitude: lat, longitude: lng })} label="Shop Location" />
              <Text style={styles.label}>Offer note</Text>
              <TextInput style={styles.input} value={shopNote} onChangeText={setShopNote} returnKeyType="next" />
              <Text style={styles.label}>About</Text>
              <TextInput style={[styles.input, styles.textArea]} multiline value={shopAbout} onChangeText={setShopAbout} />
              <Text style={styles.label}>Category</Text>
              <TextInput style={styles.input} value={shopType} onChangeText={setShopType} />
            </>
          ) : (
            <>
              <Text style={styles.label}>Full name</Text>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} returnKeyType="next" />
              <Text style={styles.label}>Age</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" returnKeyType="next" />
              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" returnKeyType="next" />
              <LocationPicker value={location} onChange={setLocation} onCoordsChange={(lat, lng) => setLocCoords({ latitude: lat, longitude: lng })} />
            </>
          )}

          <View style={styles.formActions}>
            <TouchableOpacity style={[styles.btn, styles.btnOutline, { flex: 0.4 }]} onPress={() => navigation.goBack()}>
              <Text style={[styles.btnText, { color: BLUE }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={handleSave}>
              <Ionicons name="save-outline" size={rfs(18)} color="white" />
              <Text style={styles.btnText}> Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── Change Password ───────────────────────────────────────────────────
const ChangePasswordScreen = ({ navigation }: any) => {
  const [cur, setCur] = useState(""); const [nw, setNw] = useState(""); const [conf, setConf] = useState("");
  const [sc, setSc] = useState(false); const [sn, setSn] = useState(false); const [sconf, setSconf] = useState(false);
  const { currentUser } = React.useContext(AppContext);

  const handle = async () => {
    if (!cur || !nw || !conf) { Alert.alert("Error", "All fields required"); return; }
    if (nw !== conf) { Alert.alert("Error", "Passwords do not match"); return; }
    if (nw.length < 6) { Alert.alert("Error", "Minimum 6 characters"); return; }
    try {
      const user = auth().currentUser!;
      const cred = auth.EmailAuthProvider.credential(user.email!, cur);
      await user.reauthenticateWithCredential(cred);
      await user.updatePassword(nw);
      Alert.alert("✅ Password updated!");
      navigation.goBack();
    } catch (e: any) { Alert.alert("Error", e.message); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>🔒 Change Password</Text>
          <Text style={styles.label}>Current password</Text>
          <PasswordInput value={cur} onChange={setCur} placeholder="Current password" show={sc} setShow={setSc} returnKeyType="next" />
          <Text style={styles.label}>New password</Text>
          <PasswordInput value={nw} onChange={setNw} placeholder="New password" show={sn} setShow={setSn} returnKeyType="next" />
          <Text style={styles.label}>Confirm new password</Text>
          <PasswordInput value={conf} onChange={setConf} placeholder="Confirm password" show={sconf} setShow={setSconf} returnKeyType="done" onSubmit={handle} />
          <View style={styles.formActions}>
            <TouchableOpacity style={[styles.btn, styles.btnOutline, { flex: 0.4 }]} onPress={() => navigation.goBack()}>
              <Text style={[styles.btnText, { color: BLUE }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={handle}>
              <Ionicons name="checkmark-outline" size={rfs(18)} color="white" />
              <Text style={styles.btnText}> Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── Bottom Bar & NavItem ──────────────────────────────────────────────
const BottomBar = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.bottomBar}>{children}</View>
);

const NavItem = ({ icon, label, active, onPress, badge }: any) => (
  <TouchableOpacity style={[styles.navItem, active && styles.navItemActive]} onPress={onPress} hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}>
    <View style={{ position: "relative" }}>
      <Ionicons name={icon} size={rfs(22)} color={active ? "white" : "rgba(255,255,255,0.45)"} />
      {badge > 0 && (
        <View style={styles.navBadge}>
          <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      )}
    </View>
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

// ── App Navigator ─────────────────────────────────────────────────────
const AppNavigatorInner = React.memo(({ currentUser }: { currentUser: any }) => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    database().ref(`users/${currentUser.uid}`).once("value").then((s) => {
      const d = s.val() || {};
      if (d.role === "shopkeeper" && !d.shopName) setInitialRoute("ShopkeeperDetails");
      else if (d.role === "user" && !d.fullName) setInitialRoute("UserDetails");
      else if (d.role === "shopkeeper") setInitialRoute("ShopkeeperDashboard");
      else if (d.role === "user") setInitialRoute("UserDashboard");
      else setInitialRoute("Auth");
    });
  }, []);

  if (!initialRoute) return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={BLUE} /></View>;

  return (
    <Stack.Navigator id="MainNavigator" initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="ShopkeeperDetails" component={ShopkeeperDetailsForm} />
      <Stack.Screen name="UserDetails" component={UserDetailsForm} />
      <Stack.Screen name="ShopkeeperDashboard" component={ShopkeeperDashboard} />
      <Stack.Screen name="UserDashboard" component={UserDashboard} />
      <Stack.Screen name="ShopProducts" component={ShopProducts} />
      <Stack.Screen name="ProductDetail" component={ProductDetail} />
      <Stack.Screen name="EditProduct" component={EditProductForm} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
    </Stack.Navigator>
  );
});

const AppNavigator = () => {
  const { currentUser, setCurrentUser, setCurrentRole } = React.useContext(AppContext);
  const [splashVisible, setSplashVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        const s = await database().ref(`users/${user.uid}`).once("value");
        setCurrentRole(s.val()?.role || null);
      } else { setCurrentRole(null); }
      setIsLoading(false);
    });
    return unsub;
  }, []);

  if (splashVisible) return <SplashScreen onFinish={() => setSplashVisible(false)} />;
  if (isLoading) return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={BLUE} /></View>;
  if (!currentUser) return (
    <Stack.Navigator id="AuthNavigator" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  );
  return <AppNavigatorInner currentUser={currentUser} />;
};

// ── Root ──────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>(null);
  const [tempProdPhoto, setTempProdPhoto] = useState<string | null>(null);

  return (
    <AppContext.Provider value={{ currentUser, currentRole, setCurrentUser, setCurrentRole, tempProdPhoto, setTempProdPhoto }}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AppContext.Provider>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BG },

  // Splash
  splashLogo: {
    width: scale(110), height: scale(110), borderRadius: scale(34),
    backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center",
    marginBottom: vs(24), borderWidth: 1.5, borderColor: "rgba(255,255,255,0.28)",
    shadowColor: "#fff", shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  splashTitle: { fontSize: rfs(38), fontWeight: "800", color: "white", letterSpacing: -1, textAlign: "center" },
  splashSub: { fontSize: rfs(15), color: "rgba(255,255,255,0.65)", marginTop: vs(8), textAlign: "center" },

  // Blue Header
  blueHeader: { backgroundColor: DEEP_BLUE, overflow: "hidden" },
  blueHeaderWave: {
    position: "absolute", bottom: -scale(22), left: -scale(20), right: -scale(20),
    height: scale(58), borderTopLeftRadius: scale(50), borderTopRightRadius: scale(50), backgroundColor: BG,
  },

  // Navbar
  navbar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: scale(20),
    paddingTop: STATUS_BAR_H + scale(10),
    paddingBottom: scale(8),
  },
  navLeft: { width: scale(36), alignItems: "flex-start" },
  navCenter: { flex: 1, alignItems: "center" },
  navRight: { width: "auto", alignItems: "flex-end" },
  navTitle: { fontSize: rfs(17), fontWeight: "800", color: "white", textAlign: "center" },
  navSub: { fontSize: rfs(11), color: "rgba(255,255,255,0.65)", marginTop: 1, textAlign: "center" },
  navbarBlue: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: scale(20),
    paddingTop: STATUS_BAR_H + scale(10),
    paddingBottom: scale(14),
    backgroundColor: DEEP_BLUE,
  },
  navAvatar: { width: scale(38), height: scale(38), borderRadius: scale(19), borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  badge: {
    position: "absolute", top: -scale(6), right: -scale(8), backgroundColor: ACCENT,
    borderRadius: 10, minWidth: scale(18), paddingVertical: 1, paddingHorizontal: 4,
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "white",
  },
  navBadge: {
    position: "absolute", top: -scale(5), right: -scale(7), backgroundColor: ACCENT,
    borderRadius: 9, minWidth: scale(16), paddingHorizontal: 3, alignItems: "center", borderWidth: 2, borderColor: "white",
  },
  badgeText: { color: "white", fontSize: rfs(10), fontWeight: "800" },

  // Auth
  authContainer: { flexGrow: 1, backgroundColor: "transparent", paddingBottom: 0 },
  authHeader: { alignItems: "center", paddingTop: vs(70), paddingBottom: vs(36), paddingHorizontal: scale(24) },
  authLogoBubble: { width: scale(82), height: scale(82), borderRadius: scale(28), backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center", marginBottom: scale(16), borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)" },
  authTitle: { fontSize: rfs(32), fontWeight: "800", color: "white", letterSpacing: -0.5 },
  authSubtitle: { fontSize: rfs(14), color: "rgba(255,255,255,0.7)", marginTop: scale(6), textAlign: "center" },
  authSheet: { backgroundColor: CARD, borderTopLeftRadius: scale(36), borderTopRightRadius: scale(36), minHeight: vs(420), overflow: "hidden" },
  authSheetHandle: { width: scale(40), height: scale(5), backgroundColor: BORDER, borderRadius: 3, alignSelf: "center", marginTop: scale(12), marginBottom: scale(4) },

  // Tabs
  tabRow: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: BORDER, marginBottom: scale(20) },
  tabBtn: { flex: 1, paddingVertical: scale(12), alignItems: "center" },
  tabBtnActive: { borderBottomWidth: 2.5, borderBottomColor: BLUE },
  tabText: { fontWeight: "600", color: TEXT_MID, fontSize: rfs(15) },
  tabTextActive: { color: BLUE, fontWeight: "700" },

  // Form
  formContainer: { flexGrow: 1, backgroundColor: BG, padding: scale(20), paddingBottom: scale(40) },
  formCard: { backgroundColor: CARD, borderRadius: scale(22), padding: scale(20), borderWidth: 1, borderColor: BORDER, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  formTitle: { fontSize: rfs(21), fontWeight: "800", color: TEXT_DARK, marginBottom: scale(3) },
  formSub: { fontSize: rfs(13), color: TEXT_MID, marginBottom: scale(20) },
  label: { fontSize: rfs(12), fontWeight: "700", color: TEXT_MID, marginBottom: scale(6), marginTop: scale(4) },
  input: {
    width: "100%", paddingHorizontal: scale(15), paddingVertical: scale(13),
    marginBottom: scale(12), borderWidth: 1.5, borderColor: BORDER, borderRadius: scale(13),
    fontSize: rfs(15), backgroundColor: "#FAFCFF", color: TEXT_DARK,
  },
  textArea: { height: scale(80), textAlignVertical: "top", borderRadius: scale(14) },
  row2: { flexDirection: "row" },
  formActions: { flexDirection: "row", gap: scale(10), marginTop: scale(8) },

  // Password
  pwWrap: { flexDirection: "row", alignItems: "center", marginBottom: scale(12), borderWidth: 1.5, borderColor: BORDER, borderRadius: scale(13), backgroundColor: "#FAFCFF" },
  pwInput: { flex: 1, paddingHorizontal: scale(15), paddingVertical: scale(13), fontSize: rfs(15), color: TEXT_DARK },
  pwEye: { position: "absolute", right: scale(14) },

  // Button
  btn: {
    backgroundColor: BLUE, paddingVertical: scale(14), paddingHorizontal: scale(22),
    borderRadius: scale(14), flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginTop: scale(8), shadowColor: BLUE, shadowOpacity: 0.32, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  btnOutline: { backgroundColor: "white", borderWidth: 1.5, borderColor: BLUE, shadowOpacity: 0 },
  btnText: { color: "white", fontSize: rfs(15), fontWeight: "700" },

  // Role
  roleLabel: { fontWeight: "700", color: TEXT_DARK, marginTop: scale(4), marginBottom: scale(10), fontSize: rfs(14) },
  roleRow: { flexDirection: "row", gap: scale(10), marginBottom: scale(16) },
  roleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: scale(12), borderWidth: 1.5, borderColor: BLUE, borderRadius: scale(13), backgroundColor: "white", gap: scale(8) },
  roleBtnActive: { backgroundColor: BLUE, borderColor: BLUE },
  roleBtnText: { color: BLUE, fontWeight: "700", fontSize: rfs(14) },

  // Phone Input
  phoneInputWrap: { flexDirection: "row", alignItems: "center", marginBottom: scale(6), borderWidth: 1.5, borderColor: BLUE, borderRadius: scale(13), backgroundColor: "#F0F7FF", overflow: "hidden" },
  phoneFlag: { backgroundColor: "#E8F0FE", paddingHorizontal: scale(14), paddingVertical: scale(13), borderRightWidth: 1, borderRightColor: BORDER, justifyContent: "center", alignItems: "center" },
  phoneCountryCode: { fontSize: rfs(14), fontWeight: "700", color: BLUE },
  phoneInput: { flex: 1, paddingHorizontal: scale(14), paddingVertical: scale(13), fontSize: rfs(15), color: TEXT_DARK },

  // Location
  locationPickerWrap: { flexDirection: "row", alignItems: "center", marginBottom: scale(4), borderWidth: 1.5, borderColor: BLUE, borderRadius: scale(13), backgroundColor: "#F0F7FF", overflow: "hidden" },
  locationInput: { flex: 1, paddingHorizontal: scale(15), paddingVertical: scale(13), fontSize: rfs(15), color: TEXT_DARK },
  locationDetectBtn: { backgroundColor: BLUE, paddingHorizontal: scale(14), paddingVertical: scale(13), flexDirection: "row", alignItems: "center", gap: scale(5) },
  locationDetectText: { color: "white", fontWeight: "700", fontSize: rfs(12) },
  locationDetectRow: { flexDirection: "row", alignItems: "center", gap: scale(5), marginTop: scale(4) },

  // Hints
  hintText: { fontSize: rfs(11), color: TEXT_LIGHT, marginBottom: scale(13), marginTop: -scale(3), paddingLeft: scale(2) },
  forgotLink: { alignSelf: "flex-end", marginBottom: scale(18), marginTop: scale(3) },
  forgotText: { color: BLUE, fontWeight: "600", fontSize: rfs(13) },

  // Picker
  picker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(15), paddingVertical: scale(13), marginBottom: scale(12), borderWidth: 1.5, borderColor: BORDER, borderRadius: scale(13), backgroundColor: "#FAFCFF" },
  pickerText: { fontSize: rfs(15), color: TEXT_DARK, flex: 1 },

  // Gender
  genderRow: { flexDirection: "row", gap: scale(8), marginBottom: scale(12) },
  genderBtn: { flex: 1, paddingVertical: scale(11), alignItems: "center", borderWidth: 1.5, borderColor: BLUE, borderRadius: scale(12), backgroundColor: "white" },
  genderBtnActive: { backgroundColor: BLUE },
  genderText: { color: BLUE, fontWeight: "600", fontSize: rfs(13) },

  // Photo
  shopPhotoPickerLarge: { width: "100%", height: vs(130), borderRadius: scale(16), borderWidth: 2, borderColor: BORDER, borderStyle: "dashed", backgroundColor: "#F4F8FD", marginBottom: scale(18), overflow: "hidden", alignItems: "center", justifyContent: "center" },
  shopPhotoImg: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarPicker: { width: scale(100), height: scale(100), borderRadius: scale(50), borderWidth: 2, borderColor: BORDER, borderStyle: "dashed", backgroundColor: "#F4F8FD", marginBottom: scale(18), overflow: "hidden", alignItems: "center", justifyContent: "center", alignSelf: "center" },
  avatarPickerImg: { width: "100%", height: "100%", borderRadius: scale(50), resizeMode: "cover" },
  productPhotoPicker: { width: scale(100), height: scale(100), borderRadius: scale(18), borderWidth: 2, borderColor: BORDER, borderStyle: "dashed", backgroundColor: "#F4F8FD", marginBottom: scale(18), overflow: "hidden", alignItems: "center", justifyContent: "center" },
  productPhotoImg: { width: "100%", height: "100%", resizeMode: "cover" },
  photoPlaceholder: { alignItems: "center", justifyContent: "center" },
  cameraCircle: { width: scale(52), height: scale(52), borderRadius: scale(26), backgroundColor: "#E8F0FE", alignItems: "center", justifyContent: "center", marginBottom: scale(7) },
  photoHint: { fontSize: rfs(12), color: TEXT_MID, fontWeight: "600" },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },

  // Shop Banner in blue header
  shopBannerBlue: { flexDirection: "row", alignItems: "center", marginHorizontal: scale(16), marginTop: scale(4), padding: scale(14), borderRadius: scale(18), backgroundColor: "rgba(255,255,255,0.11)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", gap: scale(14) },
  shopBannerImg: { width: scale(54), height: scale(54), borderRadius: scale(14) },
  shopBannerNameWhite: { fontSize: rfs(16), fontWeight: "800", color: "white", marginBottom: scale(3) },
  shopBannerNoteWhite: { fontSize: rfs(11), color: "rgba(255,255,255,0.72)", marginTop: scale(3) },
  bannerContactRow: { flexDirection: "row", gap: scale(8), marginTop: scale(8) },
  bannerContactBtn: { flexDirection: "row", alignItems: "center", gap: scale(4), backgroundColor: BLUE_LIGHT, paddingVertical: scale(5), paddingHorizontal: scale(10), borderRadius: scale(9) },
  bannerContactText: { color: "white", fontWeight: "700", fontSize: rfs(11) },

  // Type Pills
  typePill: { backgroundColor: "#EEF4FF", paddingVertical: scale(3), paddingHorizontal: scale(9), borderRadius: scale(20), alignSelf: "flex-start" },
  typePillText: { color: BLUE, fontWeight: "700", fontSize: rfs(10) },
  typePillLight: { backgroundColor: "rgba(255,255,255,0.18)", paddingVertical: scale(3), paddingHorizontal: scale(9), borderRadius: scale(20), alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(255,255,255,0.28)" },
  typePillLightText: { color: "white", fontWeight: "700", fontSize: rfs(10) },
  distancePill: { flexDirection: "row", alignItems: "center", gap: scale(3), backgroundColor: "#E6F7EF", paddingVertical: scale(3), paddingHorizontal: scale(7), borderRadius: scale(20) },
  distancePillText: { color: SUCCESS, fontWeight: "700", fontSize: rfs(10) },

  // Shop Card
  shopCard: { backgroundColor: CARD, borderRadius: scale(20), marginBottom: scale(14), borderWidth: 1, borderColor: BORDER, shadowColor: BLUE, shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 3, overflow: "hidden" },
  shopCardTop: { flexDirection: "row", alignItems: "center", padding: scale(14) },
  shopImgWrap: { position: "relative", marginRight: scale(14) },
  shopOnlineDot: { position: "absolute", bottom: scale(2), right: scale(2), width: scale(12), height: scale(12), borderRadius: scale(6), backgroundColor: SUCCESS, borderWidth: 2, borderColor: CARD },
  shopCardImg: { width: scale(72), height: scale(72), borderRadius: scale(18) },
  shopCardBody: { flex: 1, gap: scale(3) },
  shopCardName: { fontSize: rfs(15), fontWeight: "800", color: TEXT_DARK },
  shopCardNote: { fontSize: rfs(11), color: TEXT_MID, marginTop: scale(2) },
  shopCardArrow: { backgroundColor: "#EEF4FF", width: scale(30), height: scale(30), borderRadius: scale(15), alignItems: "center", justifyContent: "center" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: scale(3), marginTop: scale(3) },
  shopLocationText: { fontSize: rfs(10), color: TEXT_LIGHT, fontWeight: "500", flex: 1 },
  contactDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: scale(14) },
  contactRow: { paddingHorizontal: scale(14), paddingTop: scale(10), paddingBottom: scale(12), flexDirection: "row" },
  contactBtn: { borderRadius: scale(12), paddingVertical: scale(9), paddingHorizontal: scale(14), flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(6), shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  contactBtnText: { color: "white", fontWeight: "700", fontSize: rfs(13) },

  // Welcome
  welcomeInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(20), paddingTop: scale(8), paddingBottom: scale(14) },
  welcomeGreeting: { fontSize: rfs(16), fontWeight: "800", color: "white" },
  welcomeLocation: { fontSize: rfs(12), color: "rgba(255,255,255,0.72)", marginLeft: scale(4) },
  editFabLight: { width: scale(34), height: scale(34), borderRadius: scale(17), backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },

  // Segment
  segControl: { flexDirection: "row", marginHorizontal: scale(16), marginVertical: scale(14), backgroundColor: "#E4EEFA", borderRadius: scale(14), padding: scale(4), marginTop: -scale(28) },
  segBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: scale(10), borderRadius: scale(11), gap: scale(6) },
  segBtnActive: { backgroundColor: BLUE, shadowColor: BLUE, shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  segText: { color: BLUE, fontWeight: "600", fontSize: rfs(13) },
  segTextActive: { color: "white", fontWeight: "700" },

  // Search
  searchBar: { backgroundColor: CARD, marginHorizontal: scale(16), marginBottom: scale(4), marginTop: -scale(28), paddingHorizontal: scale(14), paddingVertical: scale(2), borderRadius: scale(14), borderWidth: 1.5, borderColor: BORDER, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  searchInput: { flex: 1, paddingVertical: scale(11), marginLeft: scale(8), fontSize: rfs(14), color: TEXT_DARK },
  searchFilterRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: scale(16), paddingVertical: scale(8), gap: scale(8) },

  // Filter
  filterBarRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(4), marginTop: scale(12), marginBottom: scale(8), gap: scale(8) },
  cityFilterBtn: { flexDirection: "row", alignItems: "center", gap: scale(5), backgroundColor: CARD, paddingVertical: scale(8), paddingHorizontal: scale(12), borderRadius: scale(20), borderWidth: 1.5, borderColor: BLUE, maxWidth: "47%" },
  cityFilterText: { color: BLUE, fontWeight: "700", fontSize: rfs(12), flex: 1 },
  sectionTitleLarge: { fontSize: rfs(16), fontWeight: "800", color: TEXT_DARK },
  callHintPill: { flexDirection: "row", alignItems: "center", gap: scale(4), backgroundColor: "#EEF4FF", paddingVertical: scale(4), paddingHorizontal: scale(9), borderRadius: scale(20) },
  callHintText: { fontSize: rfs(10), color: BLUE, fontWeight: "600" },
  filterBtn: { padding: scale(10), borderRadius: scale(12), backgroundColor: "#E4EEFA" },
  filterBtnActive: { backgroundColor: BLUE },
  filterPanel: { paddingHorizontal: scale(16), paddingVertical: scale(10), backgroundColor: "#E4EEFA", borderBottomWidth: 1, borderBottomColor: BORDER },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: scale(6) },
  chip: { paddingHorizontal: scale(12), paddingVertical: scale(7), borderRadius: scale(20), backgroundColor: CARD, marginRight: scale(4), marginBottom: scale(4) },
  chipActive: { backgroundColor: BLUE },
  chipText: { fontSize: rfs(11), color: TEXT_DARK, fontWeight: "600" },
  chipTextActive: { color: "white", fontWeight: "700" },

  // Products
  productCard: { backgroundColor: CARD, borderRadius: scale(18), padding: scale(14), marginBottom: scale(12), flexDirection: "row", borderWidth: 1, borderColor: BORDER, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  productImg: { width: scale(84), height: scale(84), borderRadius: scale(16), marginRight: scale(14) },
  productInfo: { flex: 1 },
  productName: { fontSize: rfs(14), fontWeight: "700", color: TEXT_DARK },
  priceRow: { flexDirection: "row", alignItems: "center", gap: scale(8), marginTop: scale(4) },
  productPrice: { fontSize: rfs(15), fontWeight: "800", color: BLUE },
  productQty: { fontSize: rfs(11), color: TEXT_MID, fontWeight: "500", backgroundColor: BORDER, paddingHorizontal: scale(7), paddingVertical: scale(2), borderRadius: scale(8) },
  productNote: { fontSize: rfs(11), color: TEXT_MID, marginTop: scale(3) },
  productActions: { flexDirection: "row", marginTop: scale(10), gap: scale(6) },
  actionBtn: { flexDirection: "row", alignItems: "center", paddingVertical: scale(5), paddingHorizontal: scale(10), borderWidth: 1, borderColor: BLUE, borderRadius: scale(10), gap: scale(4) },
  actionText: { color: BLUE, fontWeight: "600", fontSize: rfs(12) },
  addCartBtn: { backgroundColor: ACCENT, paddingVertical: scale(6), paddingHorizontal: scale(11), borderRadius: scale(10), flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginTop: scale(8), gap: scale(4) },
  addCartText: { color: "white", fontWeight: "700", fontSize: rfs(11) },

  // Detail
  detailCard: { backgroundColor: CARD, margin: scale(16), borderRadius: scale(20), overflow: "hidden", borderWidth: 1, borderColor: BORDER },
  detailImg: { width: "100%", height: vs(200), resizeMode: "cover" },
  detailBody: { padding: scale(18) },
  detailName: { fontSize: rfs(22), fontWeight: "800", color: TEXT_DARK },
  detailPrice: { fontSize: rfs(24), fontWeight: "800", color: DEEP_BLUE },
  shopRef: { fontSize: rfs(13), color: TEXT_MID, marginTop: scale(8) },
  addCartBtnLg: { backgroundColor: ACCENT, paddingVertical: scale(13), borderRadius: scale(14), flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: scale(16) },

  // Reviews / Q&A
  sectionCard: { backgroundColor: CARD, marginHorizontal: scale(16), marginBottom: scale(14), padding: scale(18), borderRadius: scale(20), borderWidth: 1, borderColor: BORDER },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: scale(14) },
  sectionTitle: { fontSize: rfs(16), fontWeight: "800", color: TEXT_DARK },
  ratingPill: { backgroundColor: "#FFF7E0", paddingVertical: scale(3), paddingHorizontal: scale(10), borderRadius: scale(12) },
  ratingPillText: { color: "#E09B00", fontWeight: "700", fontSize: rfs(12) },
  emptyText: { color: TEXT_LIGHT, fontStyle: "italic", textAlign: "center", paddingVertical: scale(8), fontSize: rfs(14) },
  emptyState: { alignItems: "center", paddingVertical: vs(60), gap: scale(12) },
  reviewCard: { backgroundColor: BG, borderRadius: scale(14), padding: scale(14), marginBottom: scale(10) },
  reviewTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: scale(6) },
  reviewUser: { fontWeight: "700", color: TEXT_DARK, fontSize: rfs(13) },
  reviewStars: { color: "#ffb82e", fontWeight: "700", fontSize: rfs(14) },
  reviewComment: { color: TEXT_DARK, fontSize: rfs(13) },
  addReview: { marginTop: scale(16), paddingTop: scale(16), borderTopWidth: 1, borderTopColor: BORDER },
  subSectionTitle: { fontSize: rfs(13), fontWeight: "700", color: TEXT_DARK, marginBottom: scale(10) },
  starRow: { flexDirection: "row", marginBottom: scale(12), gap: scale(6) },
  smallBtn: { backgroundColor: BLUE, paddingVertical: scale(9), paddingHorizontal: scale(16), borderRadius: scale(12), alignSelf: "flex-start", marginTop: scale(8), flexDirection: "row", alignItems: "center" },
  smallBtnText: { color: "white", fontWeight: "700", fontSize: rfs(13) },
  qCard: { backgroundColor: BG, borderRadius: scale(14), padding: scale(14), marginBottom: scale(12) },
  qUser: { fontWeight: "700", color: TEXT_DARK, fontSize: rfs(12), marginBottom: scale(4) },
  qQuestion: { color: BLUE, fontWeight: "600", fontSize: rfs(13) },
  answerBox: { backgroundColor: "#EEFAF4", padding: scale(12), borderRadius: scale(12), marginTop: scale(8) },
  answerText: { color: SUCCESS, fontWeight: "600", fontSize: rfs(13) },
  awaitingText: { color: TEXT_LIGHT, fontStyle: "italic", marginTop: scale(6), fontSize: rfs(12) },

  // Cart
  checkoutBar: {
    position: "absolute", bottom: BOTTOM_TAB_H + scale(8), left: scale(16), right: scale(16),
    backgroundColor: CARD, borderRadius: scale(20), padding: scale(16),
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1, borderColor: BORDER, shadowColor: "#000", shadowOpacity: 0.09, shadowRadius: 14, shadowOffset: { width: 0, height: -3 }, elevation: 7,
  },
  totalLabel: { fontSize: rfs(12), color: TEXT_MID, fontWeight: "600" },
  totalAmount: { fontSize: rfs(22), fontWeight: "800", color: TEXT_DARK },
  removeBtn: { flexDirection: "row", alignItems: "center", marginTop: scale(8) },
  removeBtnText: { color: "#e74c3c", fontWeight: "600", fontSize: rfs(13) },

  // Profile
  profileHero: { alignItems: "center", paddingVertical: scale(28), backgroundColor: DEEP_BLUE },
  profileAvatarWrap: { position: "relative", marginBottom: scale(14) },
  profileAvatar: { width: scale(96), height: scale(96), borderRadius: scale(48), borderWidth: 3, borderColor: "rgba(255,255,255,0.4)" },
  profileAvatarEdit: { position: "absolute", bottom: 0, right: 0, backgroundColor: "rgba(255,255,255,0.92)", width: scale(30), height: scale(30), borderRadius: scale(15), alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: DEEP_BLUE },
  profileName: { fontSize: rfs(22), fontWeight: "800", color: "white" },
  profileEmail: { fontSize: rfs(13), color: "rgba(255,255,255,0.68)", marginTop: scale(4) },
  infoRow: { flexDirection: "row", marginBottom: scale(12), alignItems: "flex-start" },
  infoLabel: { width: "38%", color: TEXT_MID, fontWeight: "600", fontSize: rfs(13) },
  infoValue: { flex: 1, color: TEXT_DARK, fontWeight: "700", fontSize: rfs(13) },
  secBtn: { flexDirection: "row", alignItems: "center", paddingVertical: scale(14), borderBottomWidth: 1, borderBottomColor: BORDER, gap: scale(12) },
  secBtnText: { flex: 1, fontSize: rfs(15), fontWeight: "600", color: BLUE },
  deleteAccBtn: { backgroundColor: "#e74c3c", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: scale(13), borderRadius: scale(14), marginTop: scale(14), gap: scale(8) },
  deleteAccText: { color: "white", fontWeight: "700", fontSize: rfs(15) },

  // Bottom Bar
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-around", alignItems: "center",
    backgroundColor: DEEP_BLUE,
    paddingTop: scale(10),
    paddingBottom: Platform.OS === "ios" ? vs(28) : scale(12),
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: -4 }, elevation: 16,
  },
  navItem: { alignItems: "center", paddingHorizontal: scale(14), paddingVertical: scale(4) },
  navItemActive: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.13)", paddingHorizontal: scale(18), paddingVertical: scale(6), borderRadius: scale(30), borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  navLabel: { fontSize: rfs(11), color: "rgba(255,255,255,0.45)", fontWeight: "600", marginTop: scale(3) },
  navLabelActive: { fontSize: rfs(11), color: "white", fontWeight: "700", marginTop: scale(3) },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.42)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: CARD, borderTopLeftRadius: scale(28), borderTopRightRadius: scale(28), maxHeight: SCREEN_H * 0.72, paddingBottom: scale(36) },
  modalHandle: { width: scale(42), height: scale(5), backgroundColor: BORDER, borderRadius: 3, alignSelf: "center", marginTop: scale(12), marginBottom: scale(4) },
  modalTitle: { fontSize: rfs(16), fontWeight: "800", color: TEXT_DARK, padding: scale(18), borderBottomWidth: 1, borderBottomColor: BORDER },
  modalItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: scale(16), borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
  modalItemText: { fontSize: rfs(15), color: TEXT_DARK },

  // Error
  errorBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF4F4", borderRadius: scale(13), padding: scale(12), borderWidth: 1, borderColor: "#FFCCCC" },
  errorIcon: { width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: "#c0392b", alignItems: "center", justifyContent: "center", marginRight: scale(10) },
  errorTitle: { fontSize: rfs(13), fontWeight: "700", color: TEXT_DARK },
  errorMsg: { fontSize: rfs(12), color: "#6b4f4f", marginTop: scale(2) },
});