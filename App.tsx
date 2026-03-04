import Ionicons from "@expo/vector-icons/Ionicons";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Print from "expo-print";
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
  View
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
const BASE_W = 393;
const scale = (size: number) => (SCREEN_W / BASE_W) * size;
const vs = (size: number) => (SCREEN_H / 852) * size;
const ms = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;
const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));
const rfs = (size: number) => clamp(ms(size), size * 0.85, size * 1.3);

const STATUS_BAR_H = Platform.OS === "ios" ? 44 : (StatusBar.currentHeight ?? 24);
const BOTTOM_TAB_H = Platform.OS === "ios" ? 90 : 70;

// ── Constants ─────────────────────────────────────────────────────────
const DEFAULT_AVATAR = "https://i.pravatar.cc/150?img=7";
const DEFAULT_SHOP_LOGO = "https://i.pravatar.cc/150?img=50";
const FIREBASE_API_KEY = "AIzaSyAof8LPnKFTlnRQgRaD-EUDMlnSmPz9_44";

// ── Color Palette ──────────────────────────────────────────────────
const BG_DARK = "#0A0F1E";
const SURFACE = "#111827";
const SURFACE_2 = "#1A2235";
const GLASS = "rgba(255,255,255,0.07)";
const GLASS_BORDER = "rgba(255,255,255,0.12)";
const ACCENT_BLUE = "#3B82F6";
const ACCENT_VIOLET = "#6366F1";
const ACCENT_CYAN = "#22D3EE";
const ACCENT_AMBER = "#F59E0B";
const SUCCESS = "#10B981";
const WHATSAPP_GREEN = "#25D366";
const TEXT_WHITE = "#F1F5F9";
const TEXT_MUTED = "#94A3B8";
const TEXT_DIM = "#475569";

// ── Shop Categories ────────────────────────────────────────────────────
const SHOP_CATEGORIES = [
  "Kirana / General Store", "Supermarket / Mini-Mart", "Vegetable & Fruit Vendor",
  "Dairy Booth / Milk Parlor", "Sweet Mart / Condiments", "Bakery & Cake Shop",
  "Meat / Chicken Shop", "Tea / Coffee Stall", "Ice Cream Parlor",
  "Pharmacy / Medical Store", "Apparel / Ready-made Garments", "Saree & Textile Shop",
  "Footwear Shop", "Jewelry Store", "Watch & Opticals", "Bag & Accessories Shop",
  "Mobile & Accessories Store", "Consumer Electronics Showroom", "Computer / Laptop Shop",
  "Electrical Hardware Shop", "Hardware & Paint Store", "Furniture Showroom",
  "Kitchenware / Utensils Shop", "Sanitaryware & Tiles", "Plywood & Glass Shop",
  "Stationery & Xerox / Print Shop", "Gift & Novelty Shop", "Flower Shop / Florist",
  "Cycle Shop", "Salon / Barber Shop", "Automobile Spares (Two/Four Wheeler)",
  "Steel & Cement Dealership", "Tiles & Stones Shop", "Plywood & Wood Hardware",
  "Electrical Construction Shop", "Glass & Aluminum Works", "Bricks & Aggregates (Building Materials)",
  "Civil Contractor / Masonry", "Plumbing Services", "Electrical Services",
  "Carpentry Services", "Painting Services", "Fabrication Services (Gates / Grills)",
  "Flooring & Tiling Services", "Architectural & Design Services",
  "Heavy Machinery Rental", "Others",
];

// ── Global Data Store ─────────────────────────────────────────────────
interface LatLng { latitude: number; longitude: number; }
interface GlobalStoreType {
  shops: Record<string, any>;
  products: Record<string, any>;
  cartCount: number;
  userLocation: LatLng | null;
}
const GlobalStore: GlobalStoreType = { shops: {}, products: {}, cartCount: 0, userLocation: null };

// ── Types ─────────────────────────────────────────────────────────────
type UserRole = "user" | "shopkeeper" | null;
interface UserData {
  email?: string; role?: UserRole; fullName?: string; shopName?: string;
  photoURL?: string; shopPhoto?: string; note?: string; about?: string;
  type?: string; age?: string; gender?: string; phone?: string; location?: string;
  createdAt?: number; latitude?: number; longitude?: number;
  gstNumber?: string; panNumber?: string; shopRegNumber?: string; bankAccount?: string;
}
interface Product {
  shopId: string; name: string; quantity: string; price: string;
  photo?: string; note?: string; category?: string; timestamp: number;
  barcodeNumber?: string; // ── FIX 2: added barcode field
}
interface Review {
  rating: number; comment: string; timestamp: number; userName: string;
}
interface QueryItem {
  userId: string; userName: string; question: string; answer: string;
  timestamp: number; answerTimestamp: number | null; answeredBy: string | null;
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
    const cityName = data?.address?.city || data?.address?.town || data?.address?.village || "";
    return { latitude, longitude, cityName };
  } catch {
    return { latitude, longitude, cityName: "" };
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
  currentUser: null, currentRole: null,
  setCurrentUser: () => { }, setCurrentRole: () => { },
  tempProdPhoto: null, setTempProdPhoto: () => { },
});

const Stack = createStackNavigator();


// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG_DARK },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BG_DARK },

  // Toast
  toast: {
    position: "absolute", top: STATUS_BAR_H + scale(10), left: scale(20), right: scale(20),
    flexDirection: "row", alignItems: "center", paddingVertical: scale(12), paddingHorizontal: scale(16),
    borderRadius: scale(50), gap: scale(10), zIndex: 9999,
    shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 20,
  },
  toastText: { color: "white", fontWeight: "700", fontSize: rfs(13), flex: 1 },

  // Splash
  splashLogo: {
    width: scale(110), height: scale(110), borderRadius: scale(36),
    backgroundColor: GLASS, alignItems: "center", justifyContent: "center",
    marginBottom: vs(24), borderWidth: 1.5, borderColor: GLASS_BORDER,
  },
  splashTitle: { fontSize: rfs(40), fontWeight: "800", color: TEXT_WHITE, letterSpacing: -1.5, textAlign: "center" },
  splashSub: { fontSize: rfs(14), color: TEXT_MUTED, marginTop: vs(10), textAlign: "center", paddingHorizontal: scale(30) },
  splashBottomWave: { height: vs(80), backgroundColor: GLASS, borderTopLeftRadius: scale(60), borderTopRightRadius: scale(60), borderTopWidth: 1, borderColor: GLASS_BORDER },

  // Glass Header
  glassHeader: { backgroundColor: BG_DARK, overflow: "hidden" },
  headerWaveBottom: { position: "absolute", bottom: -scale(20), left: -scale(20), right: -scale(20), height: scale(50), borderTopLeftRadius: scale(40), borderTopRightRadius: scale(40), backgroundColor: BG_DARK, borderTopWidth: 1, borderColor: GLASS_BORDER },

  // Top Bar
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(18), paddingTop: STATUS_BAR_H + scale(10), paddingBottom: scale(10), zIndex: 10 },
  topBarLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  topBarRight: { flexDirection: "row", alignItems: "center", gap: scale(10) },
  brandText: { fontSize: rfs(22), fontWeight: "800", color: TEXT_WHITE, letterSpacing: -0.5 },
  topBarTitle: { fontSize: rfs(17), fontWeight: "700", color: TEXT_WHITE, flex: 1, textAlign: "center" },
  topBarIconBtn: { width: scale(38), height: scale(38), borderRadius: scale(19), backgroundColor: GLASS, borderWidth: 1, borderColor: GLASS_BORDER, alignItems: "center", justifyContent: "center" },
  topBarAvatar: { width: scale(36), height: scale(36), borderRadius: scale(18), borderWidth: 2, borderColor: GLASS_BORDER },

  // Auth
  authContainer: { flexGrow: 1, backgroundColor: "transparent", paddingBottom: 0 },
  authHeader: { alignItems: "center", paddingTop: vs(65), paddingBottom: vs(24), paddingHorizontal: scale(24) },
  authLogoBubble: { width: scale(88), height: scale(88), borderRadius: scale(30), backgroundColor: GLASS, alignItems: "center", justifyContent: "center", marginBottom: scale(18), borderWidth: 1.5, borderColor: GLASS_BORDER },
  authTitle: { fontSize: rfs(34), fontWeight: "800", color: TEXT_WHITE, letterSpacing: -1 },
  authSubtitle: { fontSize: rfs(13), color: TEXT_MUTED, marginTop: scale(8), textAlign: "center", paddingHorizontal: scale(20) },
  authHeaderBottomCurve: { height: scale(30), backgroundColor: SURFACE, borderTopLeftRadius: scale(30), borderTopRightRadius: scale(30), marginTop: -scale(10) },
  authSheet: { backgroundColor: SURFACE, flex: 1 },
  authSheetHandle: { width: scale(40), height: scale(4), backgroundColor: SURFACE_2, borderRadius: 2, alignSelf: "center", marginTop: scale(10), marginBottom: scale(2) },

  // Pill Tabs
  pillTabRow: { flexDirection: "row", backgroundColor: SURFACE_2, borderRadius: scale(50), padding: scale(4), marginBottom: scale(22) },
  pillTabBtn: { flex: 1, paddingVertical: scale(10), borderRadius: scale(50), alignItems: "center" },
  pillTabBtnActive: { backgroundColor: ACCENT_BLUE },
  pillTabText: { fontWeight: "600", color: TEXT_MUTED, fontSize: rfs(14) },
  pillTabTextActive: { color: "white", fontWeight: "700" },

  // Form
  formContainer: { flexGrow: 1, backgroundColor: BG_DARK, padding: scale(20), paddingBottom: scale(100) },
  formCard: { backgroundColor: SURFACE, borderRadius: scale(24), padding: scale(20), borderWidth: 1, borderColor: GLASS_BORDER, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 4 },
  formTitle: { fontSize: rfs(20), fontWeight: "800", color: TEXT_WHITE, marginBottom: scale(3) },
  formSub: { fontSize: rfs(13), color: TEXT_MUTED, marginBottom: scale(18) },
  label: { fontSize: rfs(12), fontWeight: "600", color: TEXT_MUTED, marginBottom: scale(5), marginTop: scale(3) },
  input: { width: "100%", paddingHorizontal: scale(14), paddingVertical: scale(12), marginBottom: scale(12), borderWidth: 1.5, borderColor: GLASS_BORDER, borderRadius: scale(14), fontSize: rfs(14), backgroundColor: SURFACE_2, color: TEXT_WHITE },
  textArea: { height: scale(80), textAlignVertical: "top" },
  row2: { flexDirection: "row" },
  formActions: { flexDirection: "row", gap: scale(10), marginTop: scale(8) },

  // Section Divider
  sectionDivider: { borderTopWidth: 1, borderTopColor: GLASS_BORDER, marginVertical: scale(14), paddingTop: scale(14) },
  sectionDividerText: { fontSize: rfs(14), fontWeight: "700", color: ACCENT_CYAN },

  // Password
  pwWrap: { flexDirection: "row", alignItems: "center", marginBottom: scale(12), borderWidth: 1.5, borderColor: GLASS_BORDER, borderRadius: scale(14), backgroundColor: SURFACE_2 },
  pwInput: { flex: 1, paddingHorizontal: scale(14), paddingVertical: scale(12), fontSize: rfs(14), color: TEXT_WHITE },
  pwEye: { position: "absolute", right: scale(14) },

  // Pill Button
  pillBtn: { backgroundColor: ACCENT_BLUE, paddingVertical: scale(14), paddingHorizontal: scale(22), borderRadius: scale(50), flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: scale(8), shadowColor: ACCENT_BLUE, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  pillBtnOutline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: ACCENT_BLUE, shadowOpacity: 0 },
  pillBtnText: { color: "white", fontSize: rfs(15), fontWeight: "700" },

  // Role
  roleLabel: { fontWeight: "700", color: TEXT_WHITE, marginTop: scale(4), marginBottom: scale(10), fontSize: rfs(13) },
  roleRow: { flexDirection: "row", gap: scale(10), marginBottom: scale(16) },
  roleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: scale(12), borderWidth: 1.5, borderColor: ACCENT_BLUE, borderRadius: scale(50), backgroundColor: SURFACE_2, gap: scale(7) },
  roleBtnActive: { backgroundColor: ACCENT_BLUE, borderColor: ACCENT_BLUE },
  roleBtnText: { color: ACCENT_BLUE, fontWeight: "700", fontSize: rfs(13) },

  // Phone
  phoneInputWrap: { flexDirection: "row", alignItems: "center", marginBottom: scale(6), borderWidth: 1.5, borderColor: GLASS_BORDER, borderRadius: scale(14), backgroundColor: SURFACE_2, overflow: "hidden" },
  phoneFlag: { backgroundColor: "rgba(59,130,246,0.12)", paddingHorizontal: scale(12), paddingVertical: scale(12), borderRightWidth: 1, borderRightColor: GLASS_BORDER, justifyContent: "center", alignItems: "center" },
  phoneCountryCode: { fontSize: rfs(13), fontWeight: "700", color: ACCENT_BLUE },
  phoneInput: { flex: 1, paddingHorizontal: scale(13), paddingVertical: scale(12), fontSize: rfs(14), color: TEXT_WHITE },

  // Location
  locationPickerWrap: { flexDirection: "row", alignItems: "center", marginBottom: scale(4), borderWidth: 1.5, borderColor: GLASS_BORDER, borderRadius: scale(14), backgroundColor: SURFACE_2, overflow: "hidden" },
  locationInput: { flex: 1, paddingHorizontal: scale(14), paddingVertical: scale(12), fontSize: rfs(14), color: TEXT_WHITE },
  locationDetectBtn: { backgroundColor: ACCENT_BLUE, paddingHorizontal: scale(13), paddingVertical: scale(12), flexDirection: "row", alignItems: "center", gap: scale(5) },
  locationDetectText: { color: "white", fontWeight: "700", fontSize: rfs(11) },
  locationDetectRow: { flexDirection: "row", alignItems: "center", gap: scale(5), marginTop: scale(4) },

  // Hints
  hintText: { fontSize: rfs(11), color: TEXT_DIM, marginBottom: scale(10), paddingLeft: scale(2) },
  forgotLink: { alignSelf: "flex-end", marginBottom: scale(16), marginTop: scale(2) },
  forgotText: { color: ACCENT_BLUE, fontWeight: "600", fontSize: rfs(13) },

  // Picker
  picker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(14), paddingVertical: scale(12), marginBottom: scale(12), borderWidth: 1.5, borderColor: GLASS_BORDER, borderRadius: scale(14), backgroundColor: SURFACE_2 },
  pickerText: { fontSize: rfs(14), color: TEXT_WHITE, flex: 1 },

  // Gender
  genderRow: { flexDirection: "row", gap: scale(8), marginBottom: scale(12) },
  genderBtn: { flex: 1, paddingVertical: scale(10), alignItems: "center", borderWidth: 1.5, borderColor: GLASS_BORDER, borderRadius: scale(50), backgroundColor: SURFACE_2 },
  genderBtnActive: { backgroundColor: ACCENT_BLUE, borderColor: ACCENT_BLUE },
  genderText: { color: TEXT_MUTED, fontWeight: "600", fontSize: rfs(13) },

  // Photo
  shopPhotoPickerLarge: { width: "100%", height: vs(120), borderRadius: scale(18), borderWidth: 2, borderColor: GLASS_BORDER, borderStyle: "dashed", backgroundColor: SURFACE_2, marginBottom: scale(18), overflow: "hidden", alignItems: "center", justifyContent: "center" },
  shopPhotoImg: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarPicker: { width: scale(96), height: scale(96), borderRadius: scale(48), borderWidth: 2, borderColor: GLASS_BORDER, borderStyle: "dashed", backgroundColor: SURFACE_2, marginBottom: scale(18), overflow: "hidden", alignItems: "center", justifyContent: "center", alignSelf: "center" },
  avatarPickerImg: { width: "100%", height: "100%", borderRadius: scale(48), resizeMode: "cover" },
  editProfileAvatarWrap: { position: "relative", width: scale(110), height: scale(110), borderRadius: scale(55), overflow: "visible" },
  editProfileAvatar: { width: scale(110), height: scale(110), borderRadius: scale(55), borderWidth: 3, borderColor: ACCENT_BLUE },
  productPhotoPicker: { width: scale(96), height: scale(96), borderRadius: scale(20), borderWidth: 2, borderColor: GLASS_BORDER, borderStyle: "dashed", backgroundColor: SURFACE_2, marginBottom: scale(18), overflow: "hidden", alignItems: "center", justifyContent: "center" },
  productPhotoImg: { width: "100%", height: "100%", resizeMode: "cover" },
  photoPlaceholder: { alignItems: "center", justifyContent: "center" },
  cameraCircle: { width: scale(48), height: scale(48), borderRadius: scale(24), backgroundColor: "rgba(59,130,246,0.15)", alignItems: "center", justifyContent: "center", marginBottom: scale(6) },
  photoHint: { fontSize: rfs(11), color: TEXT_MUTED, fontWeight: "600" },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },

  // Shop Banner
  shopBannerGlass: { flexDirection: "row", alignItems: "center", marginHorizontal: scale(16), marginTop: scale(4), padding: scale(14), borderRadius: scale(20), backgroundColor: GLASS, borderWidth: 1, borderColor: GLASS_BORDER, gap: scale(12) },
  shopBannerImg: { width: scale(52), height: scale(52), borderRadius: scale(16) },
  shopBannerName: { fontSize: rfs(15), fontWeight: "800", color: TEXT_WHITE, marginBottom: scale(3) },
  shopBannerNote: { fontSize: rfs(11), color: TEXT_MUTED, marginTop: scale(3) },
  bannerContactRow: { flexDirection: "row", gap: scale(8), marginTop: scale(8) },
  bannerContactBtn: { flexDirection: "row", alignItems: "center", gap: scale(4), backgroundColor: ACCENT_BLUE, paddingVertical: scale(5), paddingHorizontal: scale(10), borderRadius: scale(50) },
  bannerContactText: { color: "white", fontWeight: "700", fontSize: rfs(10) },

  // Pills
  typePill: { backgroundColor: "rgba(59,130,246,0.15)", paddingVertical: scale(3), paddingHorizontal: scale(9), borderRadius: scale(50), alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(59,130,246,0.3)" },
  typePillText: { color: ACCENT_BLUE, fontWeight: "700", fontSize: rfs(10) },
  typePillLight: { backgroundColor: GLASS, paddingVertical: scale(3), paddingHorizontal: scale(9), borderRadius: scale(50), alignSelf: "flex-start", borderWidth: 1, borderColor: GLASS_BORDER },
  typePillLightText: { color: TEXT_MUTED, fontWeight: "700", fontSize: rfs(10) },
  distancePill: { flexDirection: "row", alignItems: "center", gap: scale(3), backgroundColor: "rgba(34,211,238,0.12)", paddingVertical: scale(3), paddingHorizontal: scale(7), borderRadius: scale(50) },
  distancePillText: { color: ACCENT_CYAN, fontWeight: "700", fontSize: rfs(10) },

  // Shop Card
  shopCard: { backgroundColor: SURFACE, borderRadius: scale(22), marginBottom: scale(14), borderWidth: 1, borderColor: GLASS_BORDER, shadowColor: ACCENT_BLUE, shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 5 }, elevation: 4, overflow: "hidden" },
  shopCardTop: { flexDirection: "row", alignItems: "center", padding: scale(14) },
  shopImgWrap: { position: "relative", marginRight: scale(14) },
  shopOnlineDot: { position: "absolute", bottom: scale(2), right: scale(2), width: scale(11), height: scale(11), borderRadius: scale(6), backgroundColor: SUCCESS, borderWidth: 2, borderColor: SURFACE },
  shopCardImg: { width: scale(68), height: scale(68), borderRadius: scale(20) },
  shopCardBody: { flex: 1, gap: scale(3) },
  shopCardName: { fontSize: rfs(15), fontWeight: "800", color: TEXT_WHITE },
  shopCardNote: { fontSize: rfs(11), color: TEXT_MUTED, marginTop: scale(2) },
  shopCardArrow: { backgroundColor: SURFACE_2, width: scale(28), height: scale(28), borderRadius: scale(14), alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: GLASS_BORDER },
  locationRow: { flexDirection: "row", alignItems: "center", gap: scale(3), marginTop: scale(3) },
  shopLocationText: { fontSize: rfs(10), color: TEXT_DIM, fontWeight: "500", flex: 1 },
  contactDivider: { height: 1, backgroundColor: GLASS_BORDER, marginHorizontal: scale(14) },
  contactRow: { paddingHorizontal: scale(14), paddingTop: scale(10), paddingBottom: scale(12), flexDirection: "row" },
  contactBtn: { borderRadius: scale(50), paddingVertical: scale(9), paddingHorizontal: scale(14), flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(5), shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  contactBtnText: { color: "white", fontWeight: "700", fontSize: rfs(12) },

  // Welcome
  welcomeInner: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: scale(20), paddingTop: scale(6), paddingBottom: scale(16) },
  welcomeGreeting: { fontSize: rfs(22), fontWeight: "800", color: TEXT_WHITE },
  welcomeQuestion: { fontSize: rfs(14), color: TEXT_MUTED, marginTop: scale(2) },
  welcomeLocation: { fontSize: rfs(11), color: ACCENT_CYAN, marginLeft: scale(4) },
  editFab: { width: scale(34), height: scale(34), borderRadius: scale(17), backgroundColor: GLASS, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: GLASS_BORDER },

  // Pill Bottom Nav
  pillBarContainer: { position: "absolute", bottom: Platform.OS === "ios" ? vs(28) : scale(16), left: scale(24), right: scale(24) },
  pillBar: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", backgroundColor: SURFACE_2, borderRadius: scale(50), paddingVertical: scale(10), paddingHorizontal: scale(16), borderWidth: 1, borderColor: GLASS_BORDER, shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 16 },
  pillNavItem: { alignItems: "center", paddingHorizontal: scale(12), paddingVertical: scale(6), borderRadius: scale(50) },
  pillNavItemActive: { backgroundColor: ACCENT_BLUE, paddingHorizontal: scale(18), shadowColor: ACCENT_BLUE, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  pillNavLabel: { fontSize: rfs(10), color: "white", fontWeight: "700", marginTop: scale(2) },
  pillBadge: { position: "absolute", top: -scale(5), right: -scale(6), backgroundColor: ACCENT_AMBER, borderRadius: 9, minWidth: scale(16), paddingHorizontal: 3, alignItems: "center", borderWidth: 2, borderColor: SURFACE_2 },
  pillBadgeText: { color: "white", fontSize: rfs(9), fontWeight: "800" },

  // Segment
  segControl: { flexDirection: "row", marginHorizontal: scale(16), marginVertical: scale(14), backgroundColor: SURFACE_2, borderRadius: scale(50), padding: scale(4), marginTop: -scale(24), borderWidth: 1, borderColor: GLASS_BORDER },
  segBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: scale(10), borderRadius: scale(50), gap: scale(5) },
  segBtnActive: { backgroundColor: ACCENT_BLUE, shadowColor: ACCENT_BLUE, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  segText: { color: ACCENT_BLUE, fontWeight: "600", fontSize: rfs(12) },
  segTextActive: { color: "white", fontWeight: "700" },

  // Search
  searchBar: { backgroundColor: SURFACE, marginHorizontal: scale(16), marginBottom: scale(4), marginTop: -scale(24), paddingHorizontal: scale(14), paddingVertical: scale(2), borderRadius: scale(50), borderWidth: 1.5, borderColor: GLASS_BORDER, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  searchInput: { flex: 1, paddingVertical: scale(11), marginLeft: scale(8), fontSize: rfs(14), color: TEXT_WHITE },
  searchFilterRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: scale(16), paddingVertical: scale(8), gap: scale(8) },

  // Filter
  filterBarRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(4), marginTop: scale(12), marginBottom: scale(8), gap: scale(8) },
  cityFilterBtn: { flexDirection: "row", alignItems: "center", gap: scale(5), backgroundColor: SURFACE, paddingVertical: scale(8), paddingHorizontal: scale(12), borderRadius: scale(50), borderWidth: 1.5, borderColor: GLASS_BORDER, maxWidth: "47%" },
  cityFilterText: { color: ACCENT_BLUE, fontWeight: "700", fontSize: rfs(11), flex: 1 },
  shopCountText: { fontSize: rfs(15), fontWeight: "800", color: TEXT_WHITE },
  nearestPill: { flexDirection: "row", alignItems: "center", gap: scale(3), backgroundColor: "rgba(34,211,238,0.1)", paddingVertical: scale(4), paddingHorizontal: scale(8), borderRadius: scale(50) },
  nearestPillText: { fontSize: rfs(10), color: ACCENT_CYAN, fontWeight: "600" },
  filterIconBtn: { padding: scale(10), borderRadius: scale(50), backgroundColor: SURFACE_2, borderWidth: 1, borderColor: GLASS_BORDER },
  filterIconBtnActive: { backgroundColor: ACCENT_BLUE, borderColor: ACCENT_BLUE },
  filterPanel: { paddingHorizontal: scale(16), paddingVertical: scale(10), backgroundColor: SURFACE, borderBottomWidth: 1, borderBottomColor: GLASS_BORDER },
  chip: { paddingHorizontal: scale(12), paddingVertical: scale(7), borderRadius: scale(50), backgroundColor: SURFACE_2, marginRight: scale(6), marginBottom: scale(6), borderWidth: 1, borderColor: GLASS_BORDER },
  chipActive: { backgroundColor: ACCENT_BLUE, borderColor: ACCENT_BLUE },
  chipText: { fontSize: rfs(11), color: TEXT_MUTED, fontWeight: "600" },
  chipTextActive: { color: "white", fontWeight: "700" },

  // Products
  productCard: { backgroundColor: SURFACE, borderRadius: scale(20), padding: scale(14), marginBottom: scale(12), flexDirection: "row", borderWidth: 1, borderColor: GLASS_BORDER, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  productImg: { width: scale(80), height: scale(80), borderRadius: scale(18), marginRight: scale(14) },
  productInfo: { flex: 1 },
  productName: { fontSize: rfs(14), fontWeight: "700", color: TEXT_WHITE },
  priceRow: { flexDirection: "row", alignItems: "center", gap: scale(8), marginTop: scale(4) },
  productPrice: { fontSize: rfs(15), fontWeight: "800", color: ACCENT_BLUE },
  productQty: { fontSize: rfs(10), color: TEXT_MUTED, fontWeight: "500", backgroundColor: SURFACE_2, paddingHorizontal: scale(7), paddingVertical: scale(2), borderRadius: scale(50) },
  productNote: { fontSize: rfs(11), color: TEXT_MUTED, marginTop: scale(3) },
  productActions: { flexDirection: "row", marginTop: scale(10), gap: scale(6) },
  actionBtn: { flexDirection: "row", alignItems: "center", paddingVertical: scale(5), paddingHorizontal: scale(10), borderWidth: 1, borderColor: ACCENT_BLUE, borderRadius: scale(50), gap: scale(3) },
  actionText: { color: ACCENT_BLUE, fontWeight: "600", fontSize: rfs(11) },
  addCartBtn: { backgroundColor: ACCENT_VIOLET, paddingVertical: scale(6), paddingHorizontal: scale(11), borderRadius: scale(50), flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginTop: scale(8), gap: scale(4) },
  addCartText: { color: "white", fontWeight: "700", fontSize: rfs(11) },

  // Barcode input row (FIX 2)
  barcodeInputRow: { flexDirection: "row", alignItems: "center", gap: scale(8), marginBottom: scale(12) },
  barcodeInput: { flex: 1, paddingHorizontal: scale(14), paddingVertical: scale(12), borderWidth: 1.5, borderColor: GLASS_BORDER, borderRadius: scale(14), fontSize: rfs(14), backgroundColor: SURFACE_2, color: TEXT_WHITE },
  barcodeScanBtn: { width: scale(46), height: scale(46), borderRadius: scale(14), backgroundColor: ACCENT_BLUE, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: ACCENT_BLUE },

  // Product Detail
  detailCard: { backgroundColor: SURFACE, margin: scale(16), borderRadius: scale(22), overflow: "hidden", borderWidth: 1, borderColor: GLASS_BORDER },
  detailImg: { width: "100%", height: vs(230), resizeMode: "cover" },
  zoomHint: { position: "absolute", bottom: scale(10), right: scale(12), flexDirection: "row", alignItems: "center", gap: scale(4), backgroundColor: "rgba(0,0,0,0.55)", paddingVertical: scale(5), paddingHorizontal: scale(10), borderRadius: scale(50) },
  zoomHintText: { color: "white", fontSize: rfs(10), fontWeight: "600" },
  detailBody: { padding: scale(18) },
  detailName: { fontSize: rfs(20), fontWeight: "800", color: TEXT_WHITE },
  detailPrice: { fontSize: rfs(22), fontWeight: "800", color: ACCENT_BLUE },
  shopRef: { fontSize: rfs(12), color: TEXT_MUTED, marginTop: scale(8) },
  addCartBtnLg: { backgroundColor: ACCENT_VIOLET, paddingVertical: scale(13), borderRadius: scale(50), flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: scale(16) },

  // Full Image Viewer
  fullImageOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", alignItems: "center", justifyContent: "center" },
  fullImage: { width: SCREEN_W, height: SCREEN_H * 0.8 },
  fullImageClose: { position: "absolute", top: STATUS_BAR_H + scale(10), right: scale(16) },

  // Reviews / Q&A
  sectionCard: { backgroundColor: SURFACE, marginHorizontal: scale(16), marginBottom: scale(14), padding: scale(18), borderRadius: scale(22), borderWidth: 1, borderColor: GLASS_BORDER },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: scale(14) },
  sectionTitle: { fontSize: rfs(15), fontWeight: "800", color: TEXT_WHITE },
  ratingPill: { backgroundColor: "rgba(251,191,36,0.15)", paddingVertical: scale(3), paddingHorizontal: scale(10), borderRadius: scale(50) },
  ratingPillText: { color: "#fbbf24", fontWeight: "700", fontSize: rfs(12) },
  emptyText: { color: TEXT_DIM, fontStyle: "italic", textAlign: "center", paddingVertical: scale(8), fontSize: rfs(13) },
  emptyState: { alignItems: "center", paddingVertical: vs(60), gap: scale(12) },
  reviewCard: { backgroundColor: SURFACE_2, borderRadius: scale(16), padding: scale(14), marginBottom: scale(10) },
  reviewTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: scale(6) },
  reviewUser: { fontWeight: "700", color: TEXT_WHITE, fontSize: rfs(13) },
  reviewStars: { color: "#fbbf24", fontWeight: "700", fontSize: rfs(13) },
  reviewComment: { color: TEXT_MUTED, fontSize: rfs(13) },
  addReview: { marginTop: scale(16), paddingTop: scale(16), borderTopWidth: 1, borderTopColor: GLASS_BORDER },
  subSectionTitle: { fontSize: rfs(13), fontWeight: "700", color: TEXT_WHITE, marginBottom: scale(10) },
  starRow: { flexDirection: "row", marginBottom: scale(12), gap: scale(6) },
  smallPillBtn: { backgroundColor: ACCENT_BLUE, paddingVertical: scale(8), paddingHorizontal: scale(16), borderRadius: scale(50), alignSelf: "flex-start", marginTop: scale(8), flexDirection: "row", alignItems: "center", shadowColor: ACCENT_BLUE, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  smallPillBtnText: { color: "white", fontWeight: "700", fontSize: rfs(12) },
  qCard: { backgroundColor: SURFACE_2, borderRadius: scale(16), padding: scale(14), marginBottom: scale(12) },
  qUser: { fontWeight: "700", color: TEXT_WHITE, fontSize: rfs(11), marginBottom: scale(4) },
  qQuestion: { color: ACCENT_BLUE, fontWeight: "600", fontSize: rfs(13) },
  answerBox: { backgroundColor: "rgba(16,185,129,0.12)", padding: scale(12), borderRadius: scale(14), marginTop: scale(8) },
  answerText: { color: SUCCESS, fontWeight: "600", fontSize: rfs(13) },
  awaitingText: { color: TEXT_DIM, fontStyle: "italic", marginTop: scale(6), fontSize: rfs(12) },

  // Billing
  billingCard: { backgroundColor: SURFACE, borderRadius: scale(22), padding: scale(18), borderWidth: 1, borderColor: GLASS_BORDER },
  billingItemCard: { backgroundColor: SURFACE_2, borderRadius: scale(16), padding: scale(14), marginBottom: scale(10), borderWidth: 1, borderColor: GLASS_BORDER },
  billTotalCard: { backgroundColor: SURFACE_2, borderRadius: scale(16), padding: scale(16), marginTop: scale(12), marginBottom: scale(4) },
  billTotalRow2: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: scale(4) },
  billTotalLabel2: { fontSize: rfs(13), color: TEXT_MUTED, fontWeight: "600" },
  billTotalValue: { fontSize: rfs(15), fontWeight: "700", color: TEXT_WHITE },

  // Cart
  checkoutBar: { position: "absolute", left: scale(16), right: scale(16), backgroundColor: SURFACE, borderRadius: scale(22), padding: scale(16), flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: GLASS_BORDER, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: -3 }, elevation: 10 },
  removeBtn: { flexDirection: "row", alignItems: "center", marginTop: scale(8) },
  removeBtnText: { color: "#ef4444", fontWeight: "600", fontSize: rfs(12) },

  // Profile
  profileHero: { alignItems: "center", paddingTop: scale(30), paddingBottom: scale(30), backgroundColor: BG_DARK },
  profileAvatarWrap: { position: "relative", marginBottom: scale(16) },
  profileAvatar: { width: scale(130), height: scale(130), borderRadius: scale(65), borderWidth: 3, borderColor: ACCENT_BLUE },
  profileAvatarEdit: { position: "absolute", bottom: 0, right: 0, backgroundColor: ACCENT_BLUE, width: scale(34), height: scale(34), borderRadius: scale(17), alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: BG_DARK },
  profileName: { fontSize: rfs(24), fontWeight: "800", color: TEXT_WHITE },
  profileEmail: { fontSize: rfs(12), color: TEXT_MUTED, marginTop: scale(4) },
  infoRow: { flexDirection: "row", marginBottom: scale(12), alignItems: "flex-start" },
  infoLabel: { width: "38%", color: TEXT_MUTED, fontWeight: "600", fontSize: rfs(12) },
  infoValue: { flex: 1, color: TEXT_WHITE, fontWeight: "700", fontSize: rfs(12) },

  // Security
  secBtn: { flexDirection: "row", alignItems: "center", paddingVertical: scale(14), borderBottomWidth: 1, borderBottomColor: GLASS_BORDER, gap: scale(12) },
  secBtnText: { flex: 1, fontSize: rfs(14), fontWeight: "600", color: ACCENT_BLUE },
  dangerZone: { backgroundColor: SURFACE_2, borderRadius: scale(16), padding: scale(12), marginTop: scale(8), borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" },
  dangerBtn: { flexDirection: "row", alignItems: "center", paddingVertical: scale(12), gap: scale(10) },
  dangerBtnText: { fontSize: rfs(14), fontWeight: "600" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: SURFACE, borderTopLeftRadius: scale(28), borderTopRightRadius: scale(28), maxHeight: SCREEN_H * 0.72, paddingBottom: scale(36), borderTopWidth: 1, borderColor: GLASS_BORDER },
  modalHandle: { width: scale(40), height: scale(4), backgroundColor: SURFACE_2, borderRadius: 2, alignSelf: "center", marginTop: scale(12), marginBottom: scale(4) },
  modalTitle: { fontSize: rfs(15), fontWeight: "800", color: TEXT_WHITE, padding: scale(18), borderBottomWidth: 1, borderBottomColor: GLASS_BORDER },
  modalItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: scale(16), borderBottomWidth: 1, borderBottomColor: GLASS_BORDER },
  modalItemText: { fontSize: rfs(14), color: TEXT_WHITE },

  // Error
  errorBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(239,68,68,0.1)", borderRadius: scale(14), padding: scale(12), borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  errorIcon: { width: scale(30), height: scale(30), borderRadius: scale(15), backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center", marginRight: scale(10) },
  errorTitle: { fontSize: rfs(12), fontWeight: "700", color: TEXT_WHITE },
  errorMsg: { fontSize: rfs(11), color: TEXT_MUTED, marginTop: scale(2) },

  // Barcode Scanner
  scannerFrame: { width: scale(220), height: scale(220), position: "relative" },
  scannerCorner: { position: "absolute", width: scale(30), height: scale(30), borderColor: ACCENT_BLUE },
  rescanBtn: { position: "absolute", bottom: scale(60), left: 0, right: 0, alignItems: "center" },
  rescanBtnText: { color: "white", fontWeight: "700", fontSize: rfs(14), backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: scale(20), paddingVertical: scale(12), borderRadius: scale(50) },

  // ── FIX 3: Barcode product result card ───────────────────────────────
  barcodeResultCard: {
    backgroundColor: SURFACE, margin: scale(16), borderRadius: scale(22),
    padding: scale(18), borderWidth: 1.5, borderColor: ACCENT_CYAN,
    shadowColor: ACCENT_CYAN, shadowOpacity: 0.2, shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  barcodeResultTitle: { fontSize: rfs(11), fontWeight: "700", color: ACCENT_CYAN, marginBottom: scale(12), textTransform: "uppercase", letterSpacing: 0.8 },
  barcodeResultName: { fontSize: rfs(18), fontWeight: "800", color: TEXT_WHITE, marginBottom: scale(6) },
  barcodeResultRow: { flexDirection: "row", alignItems: "center", gap: scale(8), marginTop: scale(6), flexWrap: "wrap" },
  barcodeNoResult: {
    backgroundColor: SURFACE, margin: scale(16), borderRadius: scale(22),
    padding: scale(24), borderWidth: 1, borderColor: GLASS_BORDER,
    alignItems: "center", gap: scale(8),
  },

  // Change Password
  changePwContainer: { flexGrow: 1, paddingHorizontal: scale(24), paddingBottom: scale(40), alignItems: "center", justifyContent: "center", paddingTop: STATUS_BAR_H + scale(20) },
  changePwBack: { position: "absolute", top: STATUS_BAR_H + scale(10), left: scale(24), width: scale(38), height: scale(38), borderRadius: scale(19), backgroundColor: GLASS, borderWidth: 1, borderColor: GLASS_BORDER, alignItems: "center", justifyContent: "center" },
  changePwHero: { alignItems: "center", marginBottom: scale(32), marginTop: scale(60) },
  changePwIconWrap: { width: scale(80), height: scale(80), borderRadius: scale(40), backgroundColor: ACCENT_BLUE, alignItems: "center", justifyContent: "center", marginBottom: scale(16), shadowColor: ACCENT_BLUE, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  changePwTitle: { fontSize: rfs(26), fontWeight: "800", color: TEXT_WHITE, textAlign: "center" },
  changePwSub: { fontSize: rfs(13), color: TEXT_MUTED, textAlign: "center", marginTop: scale(8), paddingHorizontal: scale(20) },
  changePwCard: { width: "100%", backgroundColor: SURFACE, borderRadius: scale(24), padding: scale(22), borderWidth: 1, borderColor: GLASS_BORDER },
  pwStep: { flexDirection: "row", alignItems: "flex-start", gap: scale(14), marginBottom: scale(4) },
  pwStepNum: { width: scale(28), height: scale(28), borderRadius: scale(14), backgroundColor: ACCENT_BLUE, alignItems: "center", justifyContent: "center", marginTop: scale(3), flexShrink: 0 },
  pwStepNumText: { color: "white", fontWeight: "800", fontSize: rfs(12) },
  pwStepDivider: { width: 2, height: scale(12), backgroundColor: GLASS_BORDER, marginLeft: scale(13), marginVertical: scale(4) },
  pwStrengthWrap: { flexDirection: "row", alignItems: "center", gap: scale(10), marginTop: scale(4), marginBottom: scale(8) },
  pwStrengthBar: { flex: 1, height: scale(4), borderRadius: scale(2) },
  pwStrengthText: { fontSize: rfs(11), fontWeight: "700", width: scale(50) },
});

// ── Toast Notification ────────────────────────────────────────────────
interface ToastProps { message: string; type?: "success" | "info" | "error" | "warning"; visible: boolean; }
const Toast = ({ message, type = "info", visible }: ToastProps) => {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 9 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);
  const bgColor = type === "success" ? SUCCESS : type === "error" ? "#ef4444" : type === "warning" ? ACCENT_AMBER : ACCENT_BLUE;
  const icon = type === "success" ? "checkmark-circle" : type === "error" ? "close-circle" : type === "warning" ? "warning" : "information-circle";
  return (
    <Animated.View style={[styles.toast, { backgroundColor: bgColor, transform: [{ translateY }], opacity }]} pointerEvents="none">
      <Ionicons name={icon as any} size={rfs(18)} color="white" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const useToast = () => {
  const [toastState, setToastState] = useState<{ message: string; type: "success" | "info" | "error" | "warning"; visible: boolean }>({ message: "", type: "info", visible: false });
  const timerRef = useRef<any>(null);
  const showToast = useCallback((message: string, type: "success" | "info" | "error" | "warning" = "info", duration = 2500) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToastState({ message, type, visible: true });
    timerRef.current = setTimeout(() => setToastState(p => ({ ...p, visible: false })), duration);
  }, []);
  return { toastState, showToast };
};

// ── Photo Picker ──────────────────────────────────────────────────────
const pickPhoto = async (callback: (b64: string) => void) => {
  Alert.alert("Photo", "Choose source", [
    {
      text: "Camera",
      onPress: async () => {
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.8, allowsEditing: true });
        if (!result.canceled && result.assets[0]?.base64)
          callback(`data:image/jpeg;base64,${result.assets[0].base64}`);
      },
    },
    {
      text: "Gallery",
      onPress: async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.8, allowsEditing: true });
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
  Linking.canOpenURL(url).then((ok) => { if (ok) Linking.openURL(url); });
};

const handleWhatsApp = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  const url = `whatsapp://send?phone=${cleaned}`;
  Linking.canOpenURL(url).then((ok) => {
    if (ok) Linking.openURL(url);
    else Linking.openURL(`https://wa.me/${cleaned}`);
  });
};

// ── Floating Particles ────────────────────────────────────────────────
interface BubbleConfig { id: number; x: number; size: number; duration: number; delay: number; opacity: number; }
const generateBubbles = (count: number): BubbleConfig[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * SCREEN_W, size: scale(4) + Math.random() * scale(20),
    duration: 6000 + Math.random() * 6000, delay: Math.random() * 4000, opacity: 0.04 + Math.random() * 0.12,
  }));

const SingleBubble = ({ config }: { config: BubbleConfig }) => {
  const translateY = useRef(new Animated.Value(SCREEN_H + 60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animate = () => {
      translateY.setValue(SCREEN_H + 60); opacity.setValue(0);
      Animated.sequence([
        Animated.delay(config.delay),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -80, duration: config.duration, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: config.opacity, duration: 1200, useNativeDriver: true }),
            Animated.delay(config.duration - 2400),
            Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", left: config.x - config.size / 2, width: config.size, height: config.size, borderRadius: config.size / 2, borderWidth: 1, borderColor: `rgba(99,102,241,0.4)`, backgroundColor: `rgba(59,130,246,0.06)`, transform: [{ translateY }], opacity }} />
  );
};

const FloatingBubbles = ({ count = 10 }: { count?: number }) => {
  const bubbles = useRef(generateBubbles(count)).current;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bubbles.map((b) => <SingleBubble key={b.id} config={b} />)}
    </View>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────
const SkeletonBox = ({ w, h, r = 8, style }: { w: number | string; h: number; r?: number; style?: any }) => {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 0.7, duration: 900, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={[{ width: w as any, height: h, borderRadius: r, backgroundColor: SURFACE_2, opacity: anim }, style]} />;
};

const ShopCardSkeleton = () => (
  <View style={[styles.shopCard, { padding: scale(16) }]}>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <SkeletonBox w={scale(72)} h={scale(72)} r={scale(22)} />
      <View style={{ flex: 1, marginLeft: scale(14), gap: scale(10) }}>
        <SkeletonBox w="65%" h={scale(16)} r={8} />
        <SkeletonBox w="40%" h={scale(12)} r={8} />
        <SkeletonBox w="50%" h={scale(10)} r={8} />
      </View>
    </View>
  </View>
);

// ── Contact Button ────────────────────────────────────────────────────
const ContactBtn = ({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) => {
  const sc = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale: sc }], flex: 1 }}>
      <TouchableOpacity style={[styles.contactBtn, { backgroundColor: color }]} onPress={onPress}
        onPressIn={() => Animated.spring(sc, { toValue: 0.93, useNativeDriver: true, speed: 30 }).start()}
        onPressOut={() => Animated.spring(sc, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start()}
        activeOpacity={1}>
        <Ionicons name={icon as any} size={rfs(14)} color="white" />
        <Text style={styles.contactBtnText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Shop Card ─────────────────────────────────────────────────────────
const AnimatedShopCard = ({ shopId, shop, onPress, index, distanceKm }: { shopId: string; shop: UserData; onPress: () => void; index: number; distanceKm?: number }) => {
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const sc = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 400, delay: Math.min(index * 60, 360), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: Math.min(index * 60, 360), useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ translateY }, { scale: sc }], opacity }}>
      <View style={styles.shopCard}>
        <TouchableOpacity style={styles.shopCardTop} onPress={onPress}
          onPressIn={() => Animated.spring(sc, { toValue: 0.975, useNativeDriver: true, speed: 30 }).start()}
          onPressOut={() => Animated.spring(sc, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start()}
          activeOpacity={1}>
          <View style={styles.shopImgWrap}>
            <Image source={{ uri: shop.shopPhoto || DEFAULT_SHOP_LOGO }} style={styles.shopCardImg} />
            <View style={styles.shopOnlineDot} />
          </View>
          <View style={styles.shopCardBody}>
            <Text style={styles.shopCardName} numberOfLines={1}>{shop.shopName}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: scale(5), marginTop: 4 }}>
              <View style={styles.typePill}>
                <Text style={styles.typePillText} numberOfLines={1}>{shop.type || "General"}</Text>
              </View>
              {distanceKm !== undefined && (
                <View style={styles.distancePill}>
                  <Ionicons name="navigate" size={rfs(9)} color={ACCENT_CYAN} />
                  <Text style={styles.distancePillText}>{formatDistance(distanceKm)}</Text>
                </View>
              )}
            </View>
            {shop.note ? <Text style={styles.shopCardNote} numberOfLines={1}>🎉 {shop.note}</Text> : null}
            {shop.location ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={rfs(10)} color={TEXT_DIM} />
                <Text style={styles.shopLocationText} numberOfLines={1}>{shop.location}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.shopCardArrow}>
            <Ionicons name="chevron-forward" size={rfs(14)} color={ACCENT_BLUE} />
          </View>
        </TouchableOpacity>
        {shop.phone && (
          <>
            <View style={styles.contactDivider} />
            <View style={styles.contactRow}>
              <ContactBtn icon="call" label="Call" color={ACCENT_BLUE} onPress={() => handleCall(shop.phone!)} />
              <View style={{ width: scale(8) }} />
              <ContactBtn icon="logo-whatsapp" label="WhatsApp" color={WHATSAPP_GREEN} onPress={() => handleWhatsApp(shop.phone!)} />
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
};

// ── Top Bar ───────────────────────────────────────────────────────────
const TopBar = ({ title, showBranding, onBarcodePress, onProfilePress, avatarUri, leftContent, rightContent }: {
  title?: string; showBranding?: boolean; onBarcodePress?: () => void;
  onProfilePress?: () => void; avatarUri?: string;
  leftContent?: React.ReactNode; rightContent?: React.ReactNode;
}) => (
  <View style={styles.topBar}>
    <View style={styles.topBarLeft}>
      {leftContent ?? (showBranding ? <Text style={styles.brandText}>CityLinks</Text> : <Text style={styles.topBarTitle} numberOfLines={1}>{title}</Text>)}
    </View>
    <View style={styles.topBarRight}>
      {rightContent ?? (
        <>
          {onBarcodePress && (
            <TouchableOpacity style={styles.topBarIconBtn} onPress={onBarcodePress}>
              <Ionicons name="barcode-outline" size={rfs(22)} color={TEXT_WHITE} />
            </TouchableOpacity>
          )}
          {onProfilePress && (
            <TouchableOpacity onPress={onProfilePress}>
              <Image source={{ uri: avatarUri || DEFAULT_AVATAR }} style={styles.topBarAvatar} />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  </View>
);

// ── Glass Header ──────────────────────────────────────────────────────
const GlassHeader = ({ children, extraPad = 0 }: { children: React.ReactNode; extraPad?: number }) => (
  <View style={[styles.glassHeader, { paddingBottom: scale(40) + extraPad }]}>
    <View style={[StyleSheet.absoluteFill, { backgroundColor: BG_DARK }]} />
    <View style={{ position: "absolute", top: -scale(60), right: -scale(30), width: scale(220), height: scale(220), borderRadius: scale(110), backgroundColor: "rgba(99,102,241,0.15)" }} />
    <View style={{ position: "absolute", top: scale(40), left: -scale(50), width: scale(160), height: scale(160), borderRadius: scale(80), backgroundColor: "rgba(59,130,246,0.1)" }} />
    <FloatingBubbles count={6} />
    {children}
    <View style={styles.headerWaveBottom} />
  </View>
);

// ── Error Banner ──────────────────────────────────────────────────────
const ErrorBanner = ({ title, message, onDismiss, style }: any) => (
  <View style={[styles.errorBanner, style]}>
    <View style={styles.errorIcon}><Ionicons name="warning" size={rfs(17)} color="#fff" /></View>
    <View style={{ flex: 1 }}>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMsg}>{message}</Text>
    </View>
    <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
      <Ionicons name="close-circle" size={rfs(20)} color="#f87171" />
    </TouchableOpacity>
  </View>
);

// ── Password Input ────────────────────────────────────────────────────
const PasswordInput = ({ value, onChange, placeholder, show, setShow, returnKeyType, onSubmit }: any) => (
  <View style={styles.pwWrap}>
    <TextInput style={styles.pwInput} placeholder={placeholder} placeholderTextColor={TEXT_DIM} secureTextEntry={!show} value={value} onChangeText={onChange} returnKeyType={returnKeyType || "next"} blurOnSubmit={returnKeyType === "done"} onSubmitEditing={onSubmit} />
    <TouchableOpacity style={styles.pwEye} onPress={() => setShow(!show)} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
      <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={rfs(20)} color={ACCENT_BLUE} />
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
    } catch { Alert.alert("Location Error", "Could not detect location."); }
    finally { setDetecting(false); }
  };
  return (
    <View style={{ marginBottom: scale(4) }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.locationPickerWrap}>
        <TextInput style={styles.locationInput} value={value} onChangeText={onChange} placeholder="City / Area (e.g. Mysore)" placeholderTextColor={TEXT_DIM} returnKeyType="done" />
        <TouchableOpacity style={[styles.locationDetectBtn, detecting && { opacity: 0.6 }]} onPress={handleAutoDetect} disabled={detecting}>
          {detecting ? <ActivityIndicator size="small" color="white" /> : <><Ionicons name="locate" size={rfs(13)} color="white" /><Text style={styles.locationDetectText}>Auto</Text></>}
        </TouchableOpacity>
      </View>
      <Text style={styles.hintText}>Tap "Auto" to detect or type manually</Text>
    </View>
  );
};

// ── Pill Bottom Nav ─────────────────────────────────────────────────
const PillBottomBar = ({ children }: { children: React.ReactNode }) => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);
  if (keyboardVisible) return null;
  return (
    <View style={styles.pillBarContainer}>
      <View style={styles.pillBar}>{children}</View>
    </View>
  );
};

const PillNavItem = ({ icon, label, active, onPress, badge, showLabel }: any) => {
  const sc = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity style={[styles.pillNavItem, active && styles.pillNavItemActive]} onPress={onPress}
      onPressIn={() => Animated.spring(sc, { toValue: 0.9, useNativeDriver: true, speed: 30 }).start()}
      onPressOut={() => Animated.spring(sc, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }).start()}
      hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}>
      <Animated.View style={{ transform: [{ scale: sc }], alignItems: "center" }}>
        <View style={{ position: "relative" }}>
          <Ionicons name={icon} size={rfs(22)} color={active ? "white" : TEXT_DIM} />
          {badge > 0 && (
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>{badge > 9 ? "9+" : badge}</Text>
            </View>
          )}
        </View>
        {(active || showLabel) && <Text style={[styles.pillNavLabel, !active && { color: TEXT_DIM }]}>{label}</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ── FIX 3: Barcode Product Lookup ─────────────────────────────────────
// Searches all products in Firebase by barcodeNumber and shows result
const BarcodeProductResult = ({ barcodeData, onClose, navigation }: {
  barcodeData: string;
  onClose: () => void;
  navigation?: any;
}) => {
  const [searching, setSearching] = useState(true);
  const [matchedProducts, setMatchedProducts] = useState<Array<{ id: string; product: Product; shop: UserData | null }>>([]);

  useEffect(() => {
    const lookup = async () => {
      setSearching(true);
      try {
        // Search products with matching barcodeNumber
        const snap = await database().ref("products")
          .orderByChild("barcodeNumber")
          .equalTo(barcodeData)
          .once("value");
        const data = snap.val() || {};
        const entries = Object.entries(data) as Array<[string, Product]>;

        // Fetch shop info for each matched product
        const results = await Promise.all(
          entries.map(async ([id, product]) => {
            let shop: UserData | null = null;
            try {
              const shopSnap = await database().ref(`users/${product.shopId}`).once("value");
              shop = shopSnap.val();
            } catch { }
            return { id, product, shop };
          })
        );
        setMatchedProducts(results);
      } catch { }
      finally { setSearching(false); }
    };
    lookup();
  }, [barcodeData]);

  if (searching) {
    return (
      <View style={styles.barcodeResultCard}>
        <Text style={styles.barcodeResultTitle}>🔍 Looking up barcode…</Text>
        <View style={{ alignItems: "center", paddingVertical: scale(20) }}>
          <ActivityIndicator color={ACCENT_CYAN} size="large" />
          <Text style={{ color: TEXT_MUTED, marginTop: scale(10), fontSize: rfs(13) }}>Searching: {barcodeData}</Text>
        </View>
      </View>
    );
  }

  if (matchedProducts.length === 0) {
    return (
      <View style={styles.barcodeNoResult}>
        <Ionicons name="barcode-outline" size={scale(48)} color={TEXT_DIM} />
        <Text style={{ color: TEXT_WHITE, fontWeight: "800", fontSize: rfs(15) }}>No Product Found</Text>
        <Text style={{ color: TEXT_MUTED, fontSize: rfs(12), textAlign: "center" }}>
          No product registered with barcode:
        </Text>
        <Text style={{ color: ACCENT_CYAN, fontWeight: "700", fontSize: rfs(13) }}>{barcodeData}</Text>
        <TouchableOpacity style={[styles.smallPillBtn, { alignSelf: "center", marginTop: scale(8) }]} onPress={onClose}>
          <Text style={styles.smallPillBtnText}>Scan Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      {matchedProducts.map(({ id, product, shop }) => (
        <View key={id} style={styles.barcodeResultCard}>
          <Text style={styles.barcodeResultTitle}>✅ Product Found · {barcodeData}</Text>
          <View style={{ flexDirection: "row", gap: scale(14), alignItems: "flex-start" }}>
            {product.photo ? (
              <Image source={{ uri: product.photo }} style={{ width: scale(80), height: scale(80), borderRadius: scale(16) }} />
            ) : (
              <View style={{ width: scale(80), height: scale(80), borderRadius: scale(16), backgroundColor: SURFACE_2, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="cube-outline" size={scale(36)} color={TEXT_DIM} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.barcodeResultName}>{product.name}</Text>
              <View style={styles.barcodeResultRow}>
                <Text style={[styles.productPrice, { fontSize: rfs(17) }]}>₹{product.price}</Text>
                {product.quantity ? <Text style={styles.productQty}>{product.quantity}</Text> : null}
              </View>
              {product.note ? <Text style={[styles.productNote, { marginTop: scale(4) }]}>{product.note}</Text> : null}
              {shop?.shopName ? (
                <View style={[styles.locationRow, { marginTop: scale(6) }]}>
                  <Ionicons name="storefront-outline" size={rfs(11)} color={TEXT_MUTED} />
                  <Text style={{ color: TEXT_MUTED, fontSize: rfs(11), fontWeight: "600" }}>{shop.shopName}</Text>
                </View>
              ) : null}
              {product.category ? (
                <View style={[styles.typePill, { marginTop: scale(6) }]}>
                  <Text style={styles.typePillText}>{product.category}</Text>
                </View>
              ) : null}
            </View>
          </View>
          {/* Action buttons */}
          <View style={{ flexDirection: "row", gap: scale(8), marginTop: scale(14) }}>
            {navigation && shop && (
              <TouchableOpacity
                style={[styles.smallPillBtn, { flex: 1, justifyContent: "center" }]}
                onPress={() => {
                  onClose();
                  navigation.navigate("ProductDetail", {
                    shopId: product.shopId,
                    productId: id,
                    productData: product,
                    shopData: shop,
                  });
                }}
              >
                <Ionicons name="eye-outline" size={rfs(13)} color="white" />
                <Text style={styles.smallPillBtnText}> View Product</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.smallPillBtn, { backgroundColor: SURFACE_2, flex: 0.4, justifyContent: "center" }]}
              onPress={onClose}
            >
              <Text style={styles.smallPillBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

// ── Barcode Scanner Modal (enhanced for FIX 2 & FIX 3) ───────────────
const BarcodeScannerModal = ({
  visible, onClose, onScanned, mode = "lookup", navigation
}: {
  visible: boolean;
  onClose: () => void;
  onScanned: (data: string) => void;
  mode?: "lookup" | "capture";
  navigation?: any;
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const hasPermission = permission?.granted ?? null;

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setScannedData(null);
      if (!permission?.granted) {
        requestPermission();
      }
    }
  }, [visible]);

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    if (mode === "capture") {
      // In capture mode, immediately return the barcode and close
      onScanned(data);
    } else {
      // In lookup mode, show the product info inside the modal
      setScannedData(data);
      onScanned(data);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: BG_DARK }}>
        <View style={[styles.topBar, { backgroundColor: BG_DARK, paddingTop: STATUS_BAR_H + scale(10), paddingBottom: scale(14) }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.topBarIconBtn}>
            <Ionicons name="close" size={rfs(20)} color={TEXT_WHITE} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>
            {mode === "capture" ? "Scan Product Barcode" : "Barcode Scanner"}
          </Text>
          <View style={{ width: scale(40) }} />
        </View>

        {hasPermission === null && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={ACCENT_BLUE} />
            <Text style={[styles.emptyText, { marginTop: scale(12) }]}>Requesting camera permission…</Text>
          </View>
        )}

        {hasPermission === false && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: scale(32) }}>
            <Ionicons name="camera-outline" size={scale(60)} color={TEXT_DIM} />
            <Text style={[styles.emptyText, { marginTop: scale(16), textAlign: "center" }]}>Camera permission denied. Enable it in device settings.</Text>
          </View>
        )}

        {hasPermission && (
          <View style={{ flex: 1 }}>
            {/* Camera always visible at top */}
            <View style={{ height: SCREEN_H * 0.45, position: "relative" }}>
              <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
                barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_a", "upc_e"] }}
              />
              {/* Overlay frame */}
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} pointerEvents="none">
                <View style={styles.scannerFrame}>
                  <View style={[styles.scannerCorner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
                  <View style={[styles.scannerCorner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
                  <View style={[styles.scannerCorner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
                  <View style={[styles.scannerCorner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
                </View>
                <Text style={{ color: TEXT_MUTED, marginTop: scale(18), fontSize: rfs(13), textAlign: "center" }}>
                  {scanned ? "✅ Barcode captured!" : "Align barcode within the frame"}
                </Text>
              </View>
            </View>

            {/* Result area (FIX 3: show product details in lookup mode) */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: scale(30) }}>
              {!scanned && (
                <View style={{ alignItems: "center", paddingVertical: scale(28), gap: scale(8) }}>
                  <Ionicons name="scan-outline" size={scale(38)} color={TEXT_DIM} />
                  <Text style={{ color: TEXT_MUTED, fontSize: rfs(13) }}>Point camera at a barcode</Text>
                </View>
              )}

              {scanned && scannedData && mode === "lookup" && (
                <BarcodeProductResult
                  barcodeData={scannedData}
                  navigation={navigation}
                  onClose={() => { setScanned(false); setScannedData(null); onClose(); }}
                />
              )}

              {scanned && (
                <TouchableOpacity
                  style={[styles.pillBtn, styles.pillBtnOutline, { marginHorizontal: scale(16), marginTop: scale(8) }]}
                  onPress={() => { setScanned(false); setScannedData(null); }}
                >
                  <Ionicons name="refresh-outline" size={rfs(16)} color={ACCENT_BLUE} />
                  <Text style={[styles.pillBtnText, { color: ACCENT_BLUE }]}> Scan Again</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
};

// ── Full Image Viewer ─────────────────────────────────────────────────
const FullImageViewer = ({ uri, visible, onClose }: { uri: string; visible: boolean; onClose: () => void }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.fullImageOverlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      <Image source={{ uri }} style={styles.fullImage} resizeMode="contain" />
      <TouchableOpacity style={styles.fullImageClose} onPress={onClose}>
        <Ionicons name="close-circle" size={scale(36)} color="white" />
      </TouchableOpacity>
    </View>
  </Modal>
);

// ── Splash ────────────────────────────────────────────────────────────
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
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: BG_DARK }]} />
      <View style={{ position: "absolute", top: -scale(100), right: -scale(80), width: scale(350), height: scale(350), borderRadius: scale(175), backgroundColor: "rgba(99,102,241,0.18)" }} />
      <View style={{ position: "absolute", bottom: -scale(80), left: -scale(60), width: scale(280), height: scale(280), borderRadius: scale(140), backgroundColor: "rgba(59,130,246,0.12)" }} />
      <FloatingBubbles count={20} />
      <Animated.View style={{ opacity: glowAnim, position: "absolute", width: scale(160), height: scale(160), borderRadius: scale(80), backgroundColor: "rgba(99,102,241,0.15)" }} />
      <Animated.View style={[styles.splashLogo, { transform: [{ scale: logoScale }], opacity }]}>
        <Ionicons name="storefront" size={scale(50)} color="white" />
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
const AuthScreen = ({ navigation }: any) => {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loginEmail, setLoginEmail] = useState(""); const [loginPass, setLoginPass] = useState("");
  const [signupEmail, setSignupEmail] = useState(""); const [signupPass, setSignupPass] = useState("");
  const [signupConfirm, setSignupConfirm] = useState(""); const [role, setRole] = useState<UserRole>(null);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [showLP, setShowLP] = useState(false); const [showSP, setShowSP] = useState(false); const [showSC, setShowSC] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setCurrentUser, setCurrentRole } = React.useContext(AppContext);

  const getErr = (e: any, ctx: string) => {
    const msg = String(e?.message || e || "Something went wrong");
    if (/network|request failed|fetch|connection|internet|timeout/i.test(msg)) return { title: "Connection problem", message: "Check your internet and try again." };
    if (ctx === "login") {
      if (/invalid.*email|user.*not.*found/i.test(msg)) return { title: "Login failed", message: "No account with this email." };
      if (/wrong.*password|invalid.*password/i.test(msg)) return { title: "Wrong password", message: "Incorrect password. Try again." };
    }
    if (ctx === "signup" && /email.*already|already.*use/i.test(msg)) return { title: "Email in use", message: "An account already exists with this email." };
    return { title: "Error", message: msg };
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPass) { setError({ title: "Missing fields", message: "Enter email and password." }); return; }
    setError(null); setLoading(true);
    try { const c = await auth().signInWithEmailAndPassword(loginEmail, loginPass); setCurrentUser(c.user); }
    catch (e) { setError(getErr(e, "login")); }
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
      await database().ref(`users/${c.user.uid}`).set({ email: signupEmail, role, createdAt: Date.now(), photoURL: role === "user" ? DEFAULT_AVATAR : DEFAULT_SHOP_LOGO });
      setCurrentUser(c.user); setCurrentRole(role);
    } catch (e) { setError(getErr(e, "signup")); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG_DARK }} behavior="padding">
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: BG_DARK }]} />
      <View style={{ position: "absolute", top: -scale(90), right: -scale(60), width: scale(300), height: scale(300), borderRadius: scale(150), backgroundColor: "rgba(99,102,241,0.2)" }} />
      <FloatingBubbles count={14} />
      <ScrollView contentContainerStyle={styles.authContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.authHeader}>
          <View style={styles.authLogoBubble}><Ionicons name="storefront" size={scale(44)} color="white" /></View>
          <Text style={styles.authTitle}>CityLinks</Text>
          <Text style={styles.authSubtitle}>Discover local Shops & Services near you</Text>
        </View>
        <View style={styles.authHeaderBottomCurve} />
        <View style={styles.authSheet}>
          <View style={styles.authSheetHandle} />
          <View style={{ paddingHorizontal: scale(22), paddingTop: scale(4), paddingBottom: Math.max(scale(28), 28) }}>
            {error && <ErrorBanner title={error.title} message={error.message} onDismiss={() => setError(null)} style={{ marginBottom: scale(14) }} />}
            <View style={styles.pillTabRow}>
              {(["login", "signup"] as const).map((t) => (
                <TouchableOpacity key={t} style={[styles.pillTabBtn, tab === t && styles.pillTabBtnActive]} onPress={() => { setTab(t); setError(null); }}>
                  <Text style={[styles.pillTabText, tab === t && styles.pillTabTextActive]}>{t === "login" ? "Sign In" : "Register"}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {tab === "login" ? (
              <>
                <TextInput style={styles.input} placeholder="Email address" placeholderTextColor={TEXT_DIM} value={loginEmail} onChangeText={setLoginEmail} keyboardType="email-address" autoCapitalize="none" returnKeyType="next" />
                <PasswordInput value={loginPass} onChange={setLoginPass} placeholder="Password" show={showLP} setShow={setShowLP} returnKeyType="done" onSubmit={handleLogin} />
                <TouchableOpacity style={styles.forgotLink} onPress={() => navigation.navigate("ForgotPassword")}><Text style={styles.forgotText}>Forgot password?</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.pillBtn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
                  {loading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="log-in-outline" size={rfs(19)} color="white" />}
                  <Text style={styles.pillBtnText}> {loading ? "Signing in…" : "Sign In"}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput style={styles.input} placeholder="Email address" placeholderTextColor={TEXT_DIM} value={signupEmail} onChangeText={setSignupEmail} keyboardType="email-address" autoCapitalize="none" returnKeyType="next" />
                <PasswordInput value={signupPass} onChange={setSignupPass} placeholder="Password" show={showSP} setShow={setShowSP} returnKeyType="next" />
                <PasswordInput value={signupConfirm} onChange={setSignupConfirm} placeholder="Confirm password" show={showSC} setShow={setShowSC} returnKeyType="done" onSubmit={handleSignup} />
                <Text style={styles.roleLabel}>Join as</Text>
                <View style={styles.roleRow}>
                  {([["shopkeeper", "storefront-outline", "Shopkeeper"], ["user", "person-outline", "Customer"]] as const).map(([r, icon, label]) => (
                    <TouchableOpacity key={r} style={[styles.roleBtn, role === r && styles.roleBtnActive]} onPress={() => setRole(r)}>
                      <Ionicons name={icon as any} size={rfs(17)} color={role === r ? "white" : ACCENT_BLUE} />
                      <Text style={[styles.roleBtnText, role === r && { color: "white" }]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={[styles.pillBtn, loading && { opacity: 0.7 }]} onPress={handleSignup} disabled={loading}>
                  {loading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="person-add-outline" size={rfs(19)} color="white" />}
                  <Text style={styles.pillBtnText}> {loading ? "Creating…" : "Create Account"}</Text>
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
  const [shopName, setShopName] = useState(""); const [shopNote, setShopNote] = useState("");
  const [shopAbout, setShopAbout] = useState(""); const [shopType, setShopType] = useState("");
  const [shopPhone, setShopPhone] = useState(""); const [shopLocation, setShopLocation] = useState("");
  const [shopCoords, setShopCoords] = useState<LatLng | null>(null);
  const [catModal, setCatModal] = useState(false); const [saving, setSaving] = useState(false);
  const [shopPhoto, setShopPhoto] = useState<string | null>(null); const [photoSaving, setPhotoSaving] = useState(false);
  const [gstNumber, setGstNumber] = useState(""); const [panNumber, setPanNumber] = useState("");
  const [shopRegNumber, setShopRegNumber] = useState(""); const [bankAccount, setBankAccount] = useState("");

  const handlePickPhoto = () => pickPhoto(async (b64) => {
    setShopPhoto(b64);
    if (currentUser) { setPhotoSaving(true); try { await database().ref(`users/${currentUser.uid}`).update({ shopPhoto: b64 }); } catch { } setPhotoSaving(false); }
  });

  const handleSave = async () => {
    if (!shopName.trim()) { Alert.alert("Error", "Shop name is required"); return; }
    setSaving(true);
    try {
      const updates: any = {
        shopName: shopName.trim(), shopPhoto: shopPhoto || DEFAULT_SHOP_LOGO,
        note: shopNote, about: shopAbout, type: shopType || "Others",
        role: "shopkeeper", phone: shopPhone.trim(), location: shopLocation.trim(),
        gstNumber: gstNumber.trim(), panNumber: panNumber.trim(),
        shopRegNumber: shopRegNumber.trim(), bankAccount: bankAccount.trim(),
      };
      if (shopCoords) { updates.latitude = shopCoords.latitude; updates.longitude = shopCoords.longitude; }
      await database().ref(`users/${currentUser!.uid}`).update(updates);
      setCurrentRole("shopkeeper"); navigation.replace("ShopkeeperDashboard");
    } catch (e: any) { Alert.alert("Error", e.message); }
    finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG_DARK }} behavior="padding">
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>🏪 Set up your shop</Text>
          <Text style={styles.formSub}>Complete your profile to start selling</Text>
          <TouchableOpacity style={styles.shopPhotoPickerLarge} onPress={handlePickPhoto}>
            {shopPhoto ? <Image source={{ uri: shopPhoto }} style={styles.shopPhotoImg} />
              : <View style={styles.photoPlaceholder}><View style={styles.cameraCircle}><Ionicons name="camera" size={rfs(28)} color={ACCENT_BLUE} /></View><Text style={styles.photoHint}>Add shop photo</Text></View>}
            {photoSaving && <View style={styles.photoOverlay}><ActivityIndicator color="white" /></View>}
          </TouchableOpacity>
          <Text style={styles.label}>Shop name *</Text>
          <TextInput style={styles.input} value={shopName} onChangeText={setShopName} placeholder="e.g. City Grocery" placeholderTextColor={TEXT_DIM} returnKeyType="next" />
          <Text style={styles.label}>Phone Number *</Text>
          <View style={styles.phoneInputWrap}>
            <View style={styles.phoneFlag}><Text style={styles.phoneCountryCode}>🇮🇳 +91</Text></View>
            <TextInput style={styles.phoneInput} value={shopPhone} onChangeText={setShopPhone} placeholder="Mobile number" placeholderTextColor={TEXT_DIM} keyboardType="phone-pad" returnKeyType="next" maxLength={15} />
          </View>
          <LocationPicker value={shopLocation} onChange={setShopLocation} onCoordsChange={(lat, lng) => setShopCoords({ latitude: lat, longitude: lng })} label="Shop Location *" />
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setCatModal(true)}>
            <Text style={[styles.pickerText, !shopType && { color: TEXT_DIM }]}>{shopType || "Select category"}</Text>
            <Ionicons name="chevron-down" size={rfs(17)} color={ACCENT_BLUE} />
          </TouchableOpacity>
          <Text style={styles.label}>Offer / Tagline</Text>
          <TextInput style={styles.input} value={shopNote} onChangeText={setShopNote} placeholder="e.g. Fresh items daily!" placeholderTextColor={TEXT_DIM} returnKeyType="next" />
          <Text style={styles.label}>About</Text>
          <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={3} value={shopAbout} onChangeText={setShopAbout} placeholder="Describe your shop…" placeholderTextColor={TEXT_DIM} />
          <View style={styles.sectionDivider}><Text style={styles.sectionDividerText}>📋 Business Verification</Text></View>
          <Text style={styles.label}>GST Number</Text>
          <TextInput style={styles.input} value={gstNumber} onChangeText={setGstNumber} placeholder="e.g. 29ABCDE1234F1Z5" placeholderTextColor={TEXT_DIM} autoCapitalize="characters" returnKeyType="next" />
          <Text style={styles.label}>PAN Number</Text>
          <TextInput style={styles.input} value={panNumber} onChangeText={setPanNumber} placeholder="e.g. ABCDE1234F" placeholderTextColor={TEXT_DIM} autoCapitalize="characters" returnKeyType="next" />
          <Text style={styles.label}>Shop Registration Number</Text>
          <TextInput style={styles.input} value={shopRegNumber} onChangeText={setShopRegNumber} placeholder="Official shop reg. number" placeholderTextColor={TEXT_DIM} returnKeyType="next" />
          <Text style={styles.label}>Bank Account Number</Text>
          <TextInput style={styles.input} value={bankAccount} onChangeText={setBankAccount} placeholder="Account number for payouts" placeholderTextColor={TEXT_DIM} keyboardType="numeric" returnKeyType="done" />
          <Text style={styles.hintText}>These details are for verification & payouts only</Text>
          <TouchableOpacity style={[styles.pillBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="checkmark-circle-outline" size={rfs(19)} color="white" />}
            <Text style={styles.pillBtnText}> {saving ? "Saving…" : "Open Dashboard"}</Text>
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
                  {shopType === item && <Ionicons name="checkmark-circle" size={rfs(19)} color={ACCENT_BLUE} />}
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
  const [fullName, setFullName] = useState(""); const [age, setAge] = useState("");
  const [gender, setGender] = useState(""); const [phone, setPhone] = useState("");
  const [location, setLocation] = useState(""); const [locCoords, setLocCoords] = useState<LatLng | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null); const [photoSaving, setPhotoSaving] = useState(false);

  const handlePickPhoto = () => pickPhoto(async (b64) => {
    setUserPhoto(b64);
    if (currentUser) { setPhotoSaving(true); try { await database().ref(`users/${currentUser.uid}`).update({ photoURL: b64 }); } catch { } setPhotoSaving(false); }
  });

  const handleSave = async () => {
    if (!fullName.trim()) { Alert.alert("Error", "Name is required"); return; }
    const updates: any = { fullName: fullName.trim(), age, gender, phone, location, photoURL: userPhoto || DEFAULT_AVATAR, role: "user" };
    if (locCoords) { updates.latitude = locCoords.latitude; updates.longitude = locCoords.longitude; }
    await database().ref(`users/${currentUser!.uid}`).update(updates);
    setCurrentRole("user"); navigation.replace("UserDashboard");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG_DARK }} behavior="padding">
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>👤 Your Profile</Text>
          <Text style={styles.formSub}>Tell us a bit about yourself</Text>
          <TouchableOpacity style={styles.avatarPicker} onPress={handlePickPhoto}>
            {userPhoto ? <Image source={{ uri: userPhoto }} style={styles.avatarPickerImg} />
              : <View style={styles.photoPlaceholder}><View style={styles.cameraCircle}><Ionicons name="camera" size={rfs(24)} color={ACCENT_BLUE} /></View><Text style={styles.photoHint}>Add photo</Text></View>}
            {photoSaving && <View style={styles.photoOverlay}><ActivityIndicator color="white" /></View>}
          </TouchableOpacity>
          <Text style={styles.label}>Full name *</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} returnKeyType="next" placeholder="Your name" placeholderTextColor={TEXT_DIM} />
          <Text style={styles.label}>Age</Text>
          <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" returnKeyType="next" placeholder="e.g. 25" placeholderTextColor={TEXT_DIM} />
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {["Male", "Female", "Other"].map((g) => (
              <TouchableOpacity key={g} style={[styles.genderBtn, gender === g && styles.genderBtnActive]} onPress={() => setGender(g)}>
                <Text style={[styles.genderText, gender === g && { color: "white" }]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" returnKeyType="next" placeholder="+91 00000 00000" placeholderTextColor={TEXT_DIM} />
          <LocationPicker value={location} onChange={setLocation} onCoordsChange={(lat, lng) => setLocCoords({ latitude: lat, longitude: lng })} />
          <TouchableOpacity style={styles.pillBtn} onPress={handleSave}>
            <Ionicons name="arrow-forward-circle-outline" size={rfs(19)} color="white" />
            <Text style={styles.pillBtnText}> Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── FIX 2: Add Product (with barcode number field + inline barcode scanner) ──
const AddProductForm = () => {
  const { currentUser, tempProdPhoto, setTempProdPhoto } = React.useContext(AppContext);
  const [name, setName] = useState(""); const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState(""); const [note, setNote] = useState("");
  const [category, setCategory] = useState(""); const [catModal, setCatModal] = useState(false);
  const [barcodeNumber, setBarcodeNumber] = useState(""); // FIX 2: barcode state
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false); // FIX 2: scanner for capture
  const [publishing, setPublishing] = useState(false);
  const { toastState, showToast } = useToast();

  const handleCancel = () => {
    setName(""); setQuantity(""); setPrice(""); setNote(""); setCategory("");
    setBarcodeNumber(""); setTempProdPhoto(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { showToast("Product name required", "error"); return; }
    if (publishing) return;
    setPublishing(true);
    try {
      const prodId = database().ref("products").push().key;
      await database().ref(`products/${prodId}`).set({
        shopId: currentUser!.uid,
        name: name.trim(),
        quantity,
        price,
        photo: tempProdPhoto || "",
        note,
        category: category || undefined,
        barcodeNumber: barcodeNumber.trim() || undefined, // FIX 2: save barcode
        timestamp: Date.now(),
      });
      showToast("✅ Product added!", "success");
      handleCancel();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setPublishing(false); }
  };

  return (
    <View style={[styles.formCard, { margin: scale(16) }]}>
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />

      {/* FIX 2: Barcode Scanner Modal in capture mode */}
      <BarcodeScannerModal
        visible={barcodeScannerVisible}
        onClose={() => setBarcodeScannerVisible(false)}
        mode="capture"
        onScanned={(data) => {
          setBarcodeNumber(data);
          setBarcodeScannerVisible(false);
          showToast(`📦 Barcode captured: ${data}`, "success");
        }}
      />

      <Text style={styles.formTitle}>📦 New Product</Text>
      <TouchableOpacity style={styles.productPhotoPicker} onPress={() => pickPhoto((b64) => setTempProdPhoto(b64))}>
        {tempProdPhoto ? <Image source={{ uri: tempProdPhoto }} style={styles.productPhotoImg} />
          : <View style={styles.photoPlaceholder}><View style={styles.cameraCircle}><Ionicons name="camera" size={rfs(22)} color={ACCENT_BLUE} /></View><Text style={styles.photoHint}>Add photo</Text></View>}
      </TouchableOpacity>
      <Text style={styles.label}>Product name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Fresh Apples" placeholderTextColor={TEXT_DIM} returnKeyType="next" />
      <View style={styles.row2}>
        <View style={{ flex: 1, marginRight: scale(8) }}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="1 kg, 2 pcs" placeholderTextColor={TEXT_DIM} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Price (₹)</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="99" placeholderTextColor={TEXT_DIM} />
        </View>
      </View>

      {/* ── FIX 2: Barcode Number Field with Scanner Button ── */}
      <Text style={styles.label}>Barcode Number</Text>
      <View style={styles.barcodeInputRow}>
        <TextInput
          style={styles.barcodeInput}
          value={barcodeNumber}
          onChangeText={setBarcodeNumber}
          placeholder="Enter or scan barcode"
          placeholderTextColor={TEXT_DIM}
          returnKeyType="next"
          keyboardType="default"
        />
        <TouchableOpacity
          style={styles.barcodeScanBtn}
          onPress={() => setBarcodeScannerVisible(true)}
        >
          <Ionicons name="barcode-outline" size={rfs(22)} color="white" />
        </TouchableOpacity>
      </View>
      {barcodeNumber ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6), marginBottom: scale(10), marginTop: -scale(4) }}>
          <Ionicons name="checkmark-circle" size={rfs(13)} color={SUCCESS} />
          <Text style={{ color: SUCCESS, fontSize: rfs(11), fontWeight: "600" }}>Barcode: {barcodeNumber}</Text>
          <TouchableOpacity onPress={() => setBarcodeNumber("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle-outline" size={rfs(14)} color={TEXT_DIM} />
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.label}>Category</Text>
      <TouchableOpacity style={styles.picker} onPress={() => setCatModal(true)}>
        <Text style={[styles.pickerText, !category && { color: TEXT_DIM }]}>{category || "Select category (optional)"}</Text>
        <Ionicons name="chevron-down" size={rfs(17)} color={ACCENT_BLUE} />
      </TouchableOpacity>
      <Text style={styles.label}>Note</Text>
      <TextInput style={[styles.input, styles.textArea]} multiline value={note} onChangeText={setNote} placeholder="Optional note" placeholderTextColor={TEXT_DIM} />
      <View style={styles.formActions}>
        {(name || quantity || price || category || barcodeNumber || tempProdPhoto) && (
          <TouchableOpacity style={[styles.pillBtn, styles.pillBtnOutline, { flex: 0.4 }]} onPress={handleCancel}>
            <Text style={[styles.pillBtnText, { color: ACCENT_BLUE }]}>Clear</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.pillBtn, { flex: 1 }, publishing && { opacity: 0.8 }]} onPress={handleSubmit} disabled={publishing}>
          {publishing ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="rocket-outline" size={rfs(19)} color="white" />}
          <Text style={styles.pillBtnText}> {publishing ? "Adding…" : "Publish"}</Text>
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
                {category === item && <Ionicons name="checkmark-circle" size={rfs(19)} color={ACCENT_BLUE} />}
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
  const { toastState, showToast } = useToast();

  useEffect(() => {
    const ref = database().ref("products").orderByChild("shopId").equalTo(currentUser!.uid);
    const l = ref.on("value", (s) => setProducts(s.val() || {}));
    return () => ref.off("value", l);
  }, [currentUser]);

  const handleDelete = (id: string) => Alert.alert("Delete product?", "This cannot be undone.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: async () => { await database().ref(`products/${id}`).remove(); showToast("Product deleted", "info"); } },
  ]);

  return (
    <View style={{ paddingHorizontal: scale(16) }}>
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />
      <Text style={styles.sectionTitle}>My Products ({Object.keys(products).length})</Text>
      {Object.keys(products).length === 0
        ? <View style={styles.emptyState}><Ionicons name="cube-outline" size={scale(55)} color={TEXT_DIM} /><Text style={styles.emptyText}>No products yet. Add your first!</Text></View>
        : Object.entries(products).map(([id, p]) => (
          <View key={id} style={styles.productCard}>
            <Image source={{ uri: p.photo || "https://via.placeholder.com/90?text=📦" }} style={styles.productImg} />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.productPrice}>₹{p.price}</Text>
                <Text style={styles.productQty}>{p.quantity}</Text>
              </View>
              {/* Show barcode if present */}
              {p.barcodeNumber ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: scale(4), marginTop: scale(2) }}>
                  <Ionicons name="barcode-outline" size={rfs(10)} color={TEXT_DIM} />
                  <Text style={{ fontSize: rfs(10), color: TEXT_DIM, fontWeight: "500" }}>{p.barcodeNumber}</Text>
                </View>
              ) : null}
              {p.note ? <Text style={styles.productNote} numberOfLines={1}>{p.note}</Text> : null}
              <View style={styles.productActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("EditProduct", { productId: id, productData: p })}>
                  <Ionicons name="pencil-outline" size={rfs(11)} color={ACCENT_BLUE} />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: "#ef4444" }]} onPress={() => handleDelete(id)}>
                  <Ionicons name="trash-outline" size={rfs(11)} color="#ef4444" />
                  <Text style={[styles.actionText, { color: "#ef4444" }]}>Delete</Text>
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
  const [name, setName] = useState(productData.name || ""); const [quantity, setQuantity] = useState(productData.quantity || "");
  const [price, setPrice] = useState(productData.price || ""); const [note, setNote] = useState(productData.note || "");
  const [photo, setPhoto] = useState(productData.photo || ""); const [photoSaving, setPhotoSaving] = useState(false);
  const [barcodeNumber, setBarcodeNumber] = useState(productData.barcodeNumber || ""); // FIX 2
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false); // FIX 2
  const { toastState, showToast } = useToast();

  const handlePickPhoto = () => pickPhoto(async (b64) => {
    setPhoto(b64); setPhotoSaving(true);
    try { await database().ref(`products/${productId}`).update({ photo: b64 }); } catch { }
    setPhotoSaving(false);
  });

  const handleUpdate = async () => {
    await database().ref(`products/${productId}`).update({
      name, quantity, price, note, photo,
      barcodeNumber: barcodeNumber.trim() || null, // FIX 2: save barcode on edit
    });
    showToast("✅ Product updated!", "success");
    setTimeout(() => navigation.goBack(), 1000);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG_DARK }} behavior="padding">
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />

      {/* FIX 2: capture-mode barcode scanner for edit */}
      <BarcodeScannerModal
        visible={barcodeScannerVisible}
        onClose={() => setBarcodeScannerVisible(false)}
        mode="capture"
        onScanned={(data) => {
          setBarcodeNumber(data);
          setBarcodeScannerVisible(false);
          showToast(`📦 Barcode: ${data}`, "success");
        }}
      />

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>✏️ Edit Product</Text>
          <TouchableOpacity style={styles.productPhotoPicker} onPress={handlePickPhoto}>
            {photo ? <Image source={{ uri: photo }} style={styles.productPhotoImg} /> : <View style={styles.photoPlaceholder}><View style={styles.cameraCircle}><Ionicons name="camera" size={rfs(22)} color={ACCENT_BLUE} /></View></View>}
            {photoSaving && <View style={styles.photoOverlay}><ActivityIndicator color="white" /></View>}
          </TouchableOpacity>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} returnKeyType="next" />
          <View style={styles.row2}>
            <View style={{ flex: 1, marginRight: scale(8) }}><Text style={styles.label}>Quantity</Text><TextInput style={styles.input} value={quantity} onChangeText={setQuantity} /></View>
            <View style={{ flex: 1 }}><Text style={styles.label}>Price (₹)</Text><TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" /></View>
          </View>

          {/* FIX 2: Barcode field in Edit */}
          <Text style={styles.label}>Barcode Number</Text>
          <View style={styles.barcodeInputRow}>
            <TextInput
              style={styles.barcodeInput}
              value={barcodeNumber}
              onChangeText={setBarcodeNumber}
              placeholder="Enter or scan barcode"
              placeholderTextColor={TEXT_DIM}
            />
            <TouchableOpacity style={styles.barcodeScanBtn} onPress={() => setBarcodeScannerVisible(true)}>
              <Ionicons name="barcode-outline" size={rfs(22)} color="white" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Note</Text>
          <TextInput style={[styles.input, styles.textArea]} multiline value={note} onChangeText={setNote} />
          <View style={styles.formActions}>
            <TouchableOpacity style={[styles.pillBtn, styles.pillBtnOutline, { flex: 0.4 }]} onPress={() => navigation.goBack()}>
              <Text style={[styles.pillBtnText, { color: ACCENT_BLUE }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pillBtn, { flex: 1 }]} onPress={handleUpdate}>
              <Ionicons name="save-outline" size={rfs(19)} color="white" />
              <Text style={styles.pillBtnText}> Save</Text>
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
  const [activeTab, setActiveTab] = useState<"add" | "view" | "billing">("add");
  const [barcodeVisible, setBarcodeVisible] = useState(false);
  const { toastState, showToast } = useToast();

  useEffect(() => {
    const ref = database().ref(`users/${currentUser!.uid}`);
    const l = ref.on("value", (s) => setShopData(s.val()));
    return () => ref.off("value", l);
  }, [currentUser]);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding" keyboardVerticalOffset={Platform.OS === "android" ? 0 : 0}>
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />

      {/* FIX 3: lookup mode for shopkeeper top barcode scanner */}
      <BarcodeScannerModal
        visible={barcodeVisible}
        onClose={() => setBarcodeVisible(false)}
        mode="lookup"
        navigation={navigation}
        onScanned={(_data) => { /* result shown inside modal */ }}
      />

      <GlassHeader>
        <TopBar showBranding
          onBarcodePress={() => setBarcodeVisible(true)}
          onProfilePress={() => navigation.navigate("Profile")}
          avatarUri={shopData?.shopPhoto || DEFAULT_SHOP_LOGO}
        />
        {shopData && (
          <View style={styles.shopBannerGlass}>
            <Image source={{ uri: shopData.shopPhoto || DEFAULT_SHOP_LOGO }} style={styles.shopBannerImg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.shopBannerName} numberOfLines={1}>{shopData.shopName}</Text>
              <View style={styles.typePillLight}><Text style={styles.typePillLightText}>{shopData.type || "General"}</Text></View>
              {shopData.note ? <Text style={styles.shopBannerNote} numberOfLines={1}>{shopData.note}</Text> : null}
              {shopData.phone ? (
                <View style={styles.locationRow}>
                  <Ionicons name="call-outline" size={rfs(10)} color={TEXT_MUTED} />
                  <Text style={[styles.shopLocationText, { color: TEXT_MUTED }]}>{shopData.phone}</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity style={styles.editFab} onPress={() => navigation.navigate("EditProfile")}>
              <Ionicons name="pencil" size={rfs(13)} color={TEXT_WHITE} />
            </TouchableOpacity>
          </View>
        )}
      </GlassHeader>

      <View style={styles.segControl}>
        {([["add", "add-circle-outline", "Add Product"], ["view", "grid-outline", "Products"], ["billing", "receipt-outline", "Billing"]] as const).map(([t, icon, lbl]) => (
          <TouchableOpacity key={t} style={[styles.segBtn, activeTab === t && styles.segBtnActive]} onPress={() => setActiveTab(t)}>
            <Ionicons name={icon as any} size={rfs(14)} color={activeTab === t ? "white" : ACCENT_BLUE} />
            <Text style={[styles.segText, activeTab === t && styles.segTextActive]}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: BOTTOM_TAB_H + scale(20) }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "add" && <AddProductForm />}
        {activeTab === "view" && <ViewProductsList navigation={navigation} />}
        {activeTab === "billing" && <BillingSection navigation={navigation} shopData={shopData} />}
      </ScrollView>

      <PillBottomBar>
        <PillNavItem icon="storefront" label="Shop" active />
        <PillNavItem icon="person-circle-outline" label="Account" showLabel onPress={() => navigation.navigate("Profile")} />
      </PillBottomBar>
    </KeyboardAvoidingView>
  );
};

// ── Billing Section ───────────────────────────────────────────────────
const BillingSection = ({ navigation, shopData }: { navigation: any; shopData: UserData | null }) => {
  const { currentUser } = React.useContext(AppContext);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<Array<{ name: string; qty: string; price: string; gst: string }>>([{ name: "", qty: "", price: "", gst: "" }]);
  const [generating, setGenerating] = useState(false);
  const [billingBarcodeVisible, setBillingBarcodeVisible] = useState(false);
  const [billingBarcodeTargetIndex, setBillingBarcodeTargetIndex] = useState(0);
  const { toastState, showToast } = useToast();

  // Auto-fill item name + price from scanned barcode
  const handleBillingScan = async (barcodeData: string, targetIndex: number) => {
    setBillingBarcodeVisible(false);
    showToast("🔍 Looking up product...", "info", 2000);
    try {
      const snap = await database().ref("products")
        .orderByChild("barcodeNumber")
        .equalTo(barcodeData)
        .once("value");
      const data = snap.val();
      if (!data) {
        showToast(`No product found for barcode: ${barcodeData}`, "warning"); return;
      }
      const product = Object.values(data)[0] as Product;
      const next = [...items];
      next[targetIndex].name = product.name;
      next[targetIndex].price = product.price || "";
      setItems(next);
      showToast(`✅ Filled: ${product.name} · ₹${product.price}`, "success");
    } catch {
      showToast("Failed to look up product", "error");
    }
  };

  const addItem = () => setItems([...items, { name: "", qty: "", price: "", gst: "" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: "name" | "qty" | "price" | "gst", val: string) => {
    const next = [...items]; next[i][field] = val; setItems(next);
  };

  const subtotal = items.reduce((sum, it) => sum + (parseFloat(it.price) || 0) * (parseFloat(it.qty) || 0), 0);
  const totalGst = items.reduce((sum, it) => {
    const lineTotal = (parseFloat(it.price) || 0) * (parseFloat(it.qty) || 0);
    const gstRate = (parseFloat(it.gst) || 0) / 100;
    return sum + lineTotal * gstRate;
  }, 0);
  const grandTotal = subtotal + totalGst;

  const handleGenerateBill = async () => {
    const filled = items.filter(it => it.name.trim() && it.price);
    if (!filled.length) { showToast("Add at least one item to generate a bill.", "error"); return; }
    setGenerating(true);
    try {
      const billId = `BILL-${Date.now()}`;
      const billData = {
        billId, shopId: currentUser?.uid || null,
        shopName: shopData?.shopName || "Shop", shopGst: shopData?.gstNumber || "",
        shopPhone: shopData?.phone || "", shopLocation: shopData?.location || "",
        customerName: customerName.trim() || "Walk-in Customer",
        customerPhone: customerPhone.trim(), items: filled,
        subtotal, totalGst, grandTotal, timestamp: Date.now(),
      };
      await database().ref(`bills/${currentUser?.uid}/${billId}`).set(billData);
      const itemRows = filled.map(it => {
        const lineTotal = (parseFloat(it.price) || 0) * (parseFloat(it.qty) || 0);
        const gstAmt = lineTotal * ((parseFloat(it.gst) || 0) / 100);
        return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${it.name}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${it.qty}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${parseFloat(it.price).toFixed(2)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${it.gst || 0}%</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${gstAmt.toFixed(2)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${(lineTotal + gstAmt).toFixed(2)}</td></tr>`;
      }).join("");
      const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;background:#fff;color:#111;margin:0;padding:24px;}.header{background:linear-gradient(135deg,#3B82F6,#6366F1);color:#fff;padding:28px 24px;border-radius:12px;margin-bottom:24px;}.header h1{margin:0 0 6px;font-size:26px;}.header p{margin:2px 0;font-size:13px;opacity:0.88;}.bill-meta{display:flex;justify-content:space-between;margin-bottom:20px;padding:16px;background:#f8fafc;border-radius:10px;}.bill-meta div{font-size:13px;}.bill-meta strong{display:block;color:#374151;margin-bottom:2px;}table{width:100%;border-collapse:collapse;margin-bottom:20px;}thead{background:#f1f5f9;}thead th{padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;}.totals{background:#f8fafc;border-radius:10px;padding:16px;max-width:280px;margin-left:auto;}.totals-row{display:flex;justify-content:space-between;padding:5px 0;font-size:14px;}.totals-row.grand{border-top:2px solid #3B82F6;margin-top:8px;padding-top:12px;font-weight:700;font-size:17px;color:#3B82F6;}.footer{margin-top:32px;text-align:center;font-size:12px;color:#9ca3af;}</style></head><body><div class="header"><h1>🏪 ${shopData?.shopName || "Shop"}</h1>${shopData?.gstNumber ? `<p>GST: ${shopData.gstNumber}</p>` : ""}${shopData?.phone ? `<p>📞 ${shopData.phone}</p>` : ""}${shopData?.location ? `<p>📍 ${shopData.location}</p>` : ""}</div><div class="bill-meta"><div><strong>Bill ID</strong>${billId}</div><div><strong>Date</strong>${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div><div><strong>Customer</strong>${billData.customerName}${billData.customerPhone ? `<br/>📞 ${billData.customerPhone}` : ""}</div></div><table><thead><tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:center;">GST</th><th style="text-align:right;">GST Amt</th><th style="text-align:right;">Total</th></tr></thead><tbody>${itemRows}</tbody></table><div class="totals"><div class="totals-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div><div class="totals-row"><span>Total GST</span><span>₹${totalGst.toFixed(2)}</span></div><div class="totals-row grand"><span>Grand Total</span><span>₹${grandTotal.toFixed(2)}</span></div></div><div class="footer">Thank you for shopping at ${shopData?.shopName || "our shop"}! • Powered by CityLinks</div></body></html>`;
      await Print.printAsync({ html: htmlContent });
      if (customerPhone.trim()) {
        const cleaned = customerPhone.replace(/\D/g, "");
        const whatsappNum = cleaned.length === 10 ? `91${cleaned}` : cleaned;
        const whatsappMsg = encodeURIComponent(`🧾 *Bill from ${shopData?.shopName || "Shop"}*\n\n📋 Bill ID: ${billId}\n👤 Customer: ${billData.customerName}\n📅 Date: ${new Date().toLocaleDateString("en-IN")}\n\nItems: ${filled.map(it => `${it.name} x${it.qty} = ₹${((parseFloat(it.price) || 0) * (parseFloat(it.qty) || 0)).toFixed(2)}`).join(", ")}\n\n💰 Subtotal: ₹${subtotal.toFixed(2)}\n🏷️ GST: ₹${totalGst.toFixed(2)}\n✅ *Grand Total: ₹${grandTotal.toFixed(2)}*\n\nThank you for shopping at ${shopData?.shopName || "our shop"}! 🙏\nPowered by CityLinks`);
        const waUrl = `whatsapp://send?phone=${whatsappNum}&text=${whatsappMsg}`;
        try { const canOpen = await Linking.canOpenURL(waUrl); if (canOpen) await Linking.openURL(waUrl); else await Linking.openURL(`https://wa.me/${whatsappNum}?text=${whatsappMsg}`); } catch { showToast("WhatsApp not available. Bill saved.", "warning"); }
      }
      showToast("✅ Bill generated & saved!", "success");
      setCustomerName(""); setCustomerPhone(""); setItems([{ name: "", qty: "", price: "", gst: "" }]);
    } catch (e: any) { showToast(e.message || "Failed to generate bill", "error"); }
    finally { setGenerating(false); }
  };

  return (
    <View style={{ paddingHorizontal: scale(16), paddingBottom: scale(1) }}>
      <BarcodeScannerModal
        visible={billingBarcodeVisible}
        onClose={() => setBillingBarcodeVisible(false)}
        mode="capture"
        onScanned={(data) => handleBillingScan(data, billingBarcodeTargetIndex)}
      />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />
      <View style={styles.billingCard}>
        <Text style={styles.formTitle}>🧾 Create Bill</Text>
        <Text style={styles.formSub}>Bill customers directly from the app</Text>
        <Text style={styles.label}>Customer Name</Text>
        <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="Walk-in Customer" placeholderTextColor={TEXT_DIM} returnKeyType="next" />
        <Text style={styles.label}>Customer Phone</Text>
        <View style={styles.phoneInputWrap}>
          <View style={styles.phoneFlag}><Text style={styles.phoneCountryCode}>🇮🇳 +91</Text></View>
          <TextInput style={styles.phoneInput} value={customerPhone} onChangeText={setCustomerPhone} placeholder="Customer mobile number" placeholderTextColor={TEXT_DIM} keyboardType="phone-pad" returnKeyType="next" maxLength={15} />
        </View>
        <Text style={[styles.label, { marginTop: scale(6) }]}>Items</Text>
        {items.map((it, i) => (
          <View key={i} style={styles.billingItemCard}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: scale(8) }}>
              <Text style={[styles.label, { marginBottom: 0, marginTop: 0, color: ACCENT_BLUE }]}>Item {i + 1}</Text>
              {items.length > 1 && <TouchableOpacity onPress={() => removeItem(i)}><Ionicons name="close-circle" size={rfs(20)} color="#ef4444" /></TouchableOpacity>}
            </View>
            {/* Item name row with barcode scan button */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8), marginBottom: scale(8) }}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={it.name}
                onChangeText={(v) => updateItem(i, "name", v)}
                placeholder="Item name"
                placeholderTextColor={TEXT_DIM}
              />
              <TouchableOpacity
                style={styles.barcodeScanBtn}
                onPress={() => { setBillingBarcodeTargetIndex(i); setBillingBarcodeVisible(true); }}
              >
                <Ionicons name="barcode-outline" size={rfs(20)} color="white" />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", gap: scale(8) }}>
              <View style={{ flex: 1 }}><Text style={[styles.label, { fontSize: rfs(11) }]}>Qty</Text><TextInput style={[styles.input, { marginBottom: 0 }]} value={it.qty} onChangeText={(v) => updateItem(i, "qty", v)} placeholder="1" placeholderTextColor={TEXT_DIM} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Text style={[styles.label, { fontSize: rfs(11) }]}>Price ₹</Text><TextInput style={[styles.input, { marginBottom: 0 }]} value={it.price} onChangeText={(v) => updateItem(i, "price", v)} placeholder="0.00" placeholderTextColor={TEXT_DIM} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Text style={[styles.label, { fontSize: rfs(11) }]}>GST %</Text><TextInput style={[styles.input, { marginBottom: 0 }]} value={it.gst} onChangeText={(v) => updateItem(i, "gst", v)} placeholder="0" placeholderTextColor={TEXT_DIM} keyboardType="numeric" /></View>
            </View>
          </View>
        ))}
        <TouchableOpacity style={[styles.pillBtn, styles.pillBtnOutline, { marginTop: scale(10) }]} onPress={addItem}>
          <Ionicons name="add-circle-outline" size={rfs(17)} color={ACCENT_BLUE} />
          <Text style={[styles.pillBtnText, { color: ACCENT_BLUE }]}> Add Item</Text>
        </TouchableOpacity>
        <View style={styles.billTotalCard}>
          <View style={styles.billTotalRow2}><Text style={styles.billTotalLabel2}>Subtotal</Text><Text style={styles.billTotalValue}>₹{subtotal.toFixed(2)}</Text></View>
          <View style={styles.billTotalRow2}><Text style={styles.billTotalLabel2}>GST</Text><Text style={styles.billTotalValue}>₹{totalGst.toFixed(2)}</Text></View>
          <View style={[styles.billTotalRow2, { borderTopWidth: 1, borderTopColor: GLASS_BORDER, paddingTop: scale(10), marginTop: scale(4) }]}>
            <Text style={[styles.billTotalLabel2, { color: TEXT_WHITE, fontWeight: "800", fontSize: rfs(15) }]}>Grand Total</Text>
            <Text style={[styles.billTotalValue, { fontSize: rfs(22), color: ACCENT_BLUE }]}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.pillBtn, generating && { opacity: 0.7 }]} onPress={handleGenerateBill} disabled={generating}>
          {generating ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="receipt-outline" size={rfs(19)} color="white" />}
          <Text style={styles.pillBtnText}> {generating ? "Generating…" : "Generate Bill PDF"}</Text>
        </TouchableOpacity>
        <Text style={[styles.hintText, { textAlign: "center", marginTop: scale(8) }]}>Bills saved to Firebase • PDF exported • Sent via WhatsApp 💬</Text>
      </View>
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
  const [barcodeVisible, setBarcodeVisible] = useState(false);
  const { toastState, showToast } = useToast();

  useEffect(() => {
    if (!GlobalStore.userLocation) {
      (async () => {
        const granted = await requestLocationPermission();
        if (granted) {
          try {
            const pos = await getCurrentLocation();
            const loc = { latitude: pos.latitude, longitude: pos.longitude };
            GlobalStore.userLocation = loc; setUserLocation(loc);
          } catch { }
        }
      })();
    }
  }, []);

  useEffect(() => {
    const userRef = database().ref(`users/${currentUser!.uid}`);
    const ul = userRef.on("value", (s) => {
      const d = s.val(); setUserData(d);
      if (!GlobalStore.userLocation && d?.latitude && d?.longitude) {
        const loc = { latitude: d.latitude, longitude: d.longitude };
        GlobalStore.userLocation = loc; setUserLocation(loc);
      }
    });
    const shopsRef = database().ref("users").orderByChild("role").equalTo("shopkeeper");
    const sl = shopsRef.on("value", (snap) => {
      const data = snap.val() || {};
      GlobalStore.shops = data; setShops(data); setShopsLoaded(true);
      Object.keys(data).forEach((shopId) => {
        database().ref("products").orderByChild("shopId").equalTo(shopId).once("value")
          .then((ps) => { GlobalStore.products[shopId] = ps.val() || {}; }).catch(() => { });
      });
    });
    const cartRef = database().ref(`carts/${currentUser!.uid}`);
    const cl = cartRef.on("value", (s) => {
      const v = s.val(); const count = v ? Object.keys(v).length : 0;
      GlobalStore.cartCount = count; setCartCount(count);
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
      const distanceKm = (userLocation && userLocation.latitude && userLocation.longitude && s.latitude && s.longitude)
        ? haversineKm(userLocation.latitude, userLocation.longitude, s.latitude, s.longitude)
        : undefined;
      return { id, ...s, distanceKm };
    });
    list.sort((a, b) => {
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) return a.distanceKm - b.distanceKm;
      if (a.distanceKm !== undefined && b.distanceKm === undefined) return -1;
      if (a.distanceKm === undefined && b.distanceKm !== undefined) return 1;
      return (a.shopName || "").localeCompare(b.shopName || "");
    });
    return list;
  }, [shops, searchTerm, selectedCity, userLocation]);

  const handleDetectLocation = async () => {
    setDetectingLoc(true);
    try {
      const granted = await requestLocationPermission();
      if (!granted) { showToast("Location permission denied", "error"); return; }
      const pos = await getCurrentLocation();
      const loc = { latitude: pos.latitude, longitude: pos.longitude };
      GlobalStore.userLocation = loc; setUserLocation(loc);
      const updates: any = { latitude: pos.latitude, longitude: pos.longitude };
      if (pos.cityName) updates.location = pos.cityName;
      await database().ref(`users/${currentUser!.uid}`).update(updates);
      showToast(pos.cityName ? `📍 You are in ${pos.cityName}` : "✅ Location updated!", "success");
    } catch { showToast("Could not detect location.", "error"); }
    finally { setDetectingLoc(false); }
  };

  const openShop = useCallback((shopId: string, shopData: UserData) => {
    Keyboard.dismiss();
    navigation.navigate("ShopProducts", { shopId, shopData, cachedProducts: GlobalStore.products[shopId] ?? null });
  }, [navigation]);

  const renderShopItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <AnimatedShopCard shopId={item.id} shop={item} index={index} distanceKm={item.distanceKm} onPress={() => openShop(item.id, item)} />
  ), [openShop]);

  const firstName = userData?.fullName?.split(" ")[0] || "there";

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />

      {/* FIX 3: lookup mode for user top barcode scanner */}
      <BarcodeScannerModal
        visible={barcodeVisible}
        onClose={() => setBarcodeVisible(false)}
        mode="lookup"
        navigation={navigation}
        onScanned={(_data) => { /* result shown inside modal */ }}
      />

      <FlatList
        data={filteredShops}
        keyExtractor={(item) => item.id}
        renderItem={renderShopItem}
        ListEmptyComponent={!shopsLoaded
          ? <View>{[1, 2, 3].map((i) => <ShopCardSkeleton key={i} />)}</View>
          : <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={scale(55)} color={TEXT_DIM} />
            <Text style={styles.emptyText}>No shops found</Text>
            {selectedCity !== "All" && (
              <TouchableOpacity onPress={() => setSelectedCity("All")} style={[styles.smallPillBtn, { alignSelf: "center", marginTop: scale(12) }]}>
                <Text style={styles.smallPillBtnText}>Show all areas</Text>
              </TouchableOpacity>
            )}
          </View>}
        contentContainerStyle={{ paddingHorizontal: scale(16), paddingBottom: BOTTOM_TAB_H + scale(16) }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={10}
        initialNumToRender={6}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={[styles.glassHeader, { marginHorizontal: -scale(16), paddingBottom: scale(52) }]}>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: BG_DARK }]} />
              <View style={{ position: "absolute", top: -scale(60), right: -scale(40), width: scale(240), height: scale(240), borderRadius: scale(120), backgroundColor: "rgba(99,102,241,0.16)" }} />
              <FloatingBubbles count={8} />
              <TopBar showBranding
                rightContent={
                  <View style={{ flexDirection: "row", alignItems: "center", gap: scale(10) }}>
                    <TouchableOpacity style={styles.topBarIconBtn} onPress={() => setBarcodeVisible(true)}>
                      <Ionicons name="barcode-outline" size={rfs(22)} color={TEXT_WHITE} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ position: "relative" }} onPress={() => navigation.navigate("Cart")}>
                      <Ionicons name="cart-outline" size={rfs(22)} color={TEXT_WHITE} />
                      {cartCount > 0 && <View style={styles.pillBadge}><Text style={styles.pillBadgeText}>{cartCount > 9 ? "9+" : cartCount}</Text></View>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                      <Image source={{ uri: userData?.photoURL || DEFAULT_AVATAR }} style={styles.topBarAvatar} />
                    </TouchableOpacity>
                  </View>
                }
              />
              <View style={styles.welcomeInner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.welcomeGreeting}>Hi {firstName},</Text>
                  <Text style={styles.welcomeQuestion}>What do you want to do today?</Text>
                  <TouchableOpacity style={styles.locationDetectRow} onPress={handleDetectLocation} disabled={detectingLoc}>
                    {detectingLoc ? <ActivityIndicator size="small" color={ACCENT_CYAN} /> : <Ionicons name="locate-outline" size={rfs(11)} color={ACCENT_CYAN} />}
                    <Text style={styles.welcomeLocation} numberOfLines={1}>{userData?.location || "Tap to detect location"}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.editFab} onPress={() => navigation.navigate("EditProfile")}>
                  <Ionicons name="pencil" size={rfs(13)} color={TEXT_WHITE} />
                </TouchableOpacity>
              </View>
              <View style={styles.headerWaveBottom} />
            </View>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={rfs(16)} color={TEXT_MUTED} />
              <TextInput style={styles.searchInput} placeholder="Search shops or categories…" placeholderTextColor={TEXT_DIM} value={searchTerm} onChangeText={setSearchTerm} />
              {searchTerm ? <TouchableOpacity onPress={() => setSearchTerm("")}><Ionicons name="close-circle" size={rfs(16)} color={TEXT_DIM} /></TouchableOpacity> : null}
            </View>
            <View style={styles.filterBarRow}>
              <TouchableOpacity style={styles.cityFilterBtn} onPress={() => setCityModalVisible(true)}>
                <Ionicons name="location" size={rfs(12)} color={ACCENT_BLUE} />
                <Text style={styles.cityFilterText} numberOfLines={1}>{selectedCity === "All" ? "All Areas" : selectedCity}</Text>
                <Ionicons name="chevron-down" size={rfs(12)} color={ACCENT_BLUE} />
              </TouchableOpacity>
              <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
                <Text style={styles.shopCountText}>🏪 {shopsLoaded ? `${filteredShops.length} Shop${filteredShops.length !== 1 ? "s" : ""}` : "Shops"}</Text>
                {userLocation && (
                  <View style={styles.nearestPill}>
                    <Ionicons name="navigate" size={rfs(9)} color={ACCENT_CYAN} />
                    <Text style={styles.nearestPillText}>Nearest first</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        }
      />

      <PillBottomBar>
        <PillNavItem icon="home" label="Home" active />
        <PillNavItem icon="cart-outline" label="Cart" onPress={() => navigation.navigate("Cart")} badge={cartCount} />
        <PillNavItem icon="person-outline" label="Profile" onPress={() => navigation.navigate("Profile")} />
      </PillBottomBar>

      <Modal visible={cityModalVisible} transparent animationType="slide" onRequestClose={() => setCityModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCityModalVisible(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>📍 Filter by Area</Text>
            <FlatList data={cityOptions} keyExtractor={(i) => i} renderItem={({ item }) => (
              <TouchableOpacity style={[styles.modalItem, selectedCity === item && { backgroundColor: "rgba(59,130,246,0.1)" }]} onPress={() => { setSelectedCity(item); setCityModalVisible(false); }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: scale(10) }}>
                  <Ionicons name={item === "All" ? "globe-outline" : "location-outline"} size={rfs(14)} color={selectedCity === item ? ACCENT_BLUE : TEXT_MUTED} />
                  <Text style={[styles.modalItemText, selectedCity === item && { color: ACCENT_BLUE, fontWeight: "700" }]}>{item}</Text>
                </View>
                {selectedCity === item && <Ionicons name="checkmark-circle" size={rfs(19)} color={ACCENT_BLUE} />}
              </TouchableOpacity>
            )} />
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
  const { toastState, showToast } = useToast();

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
    if (!user) { showToast("Please login to add to cart", "error"); return; }
    await database().ref(`carts/${user.uid}/${productId}`).set({ productId, shopId, added: Date.now() });
    showToast("✅ Added to cart!", "success");
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />
      <GlassHeader extraPad={shop?.phone ? scale(10) : 0}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.topBarIconBtn}>
            <Ionicons name="arrow-back" size={rfs(20)} color={TEXT_WHITE} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>{shop?.shopName || "Shop"}</Text>
          <View style={{ width: scale(40) }} />
        </View>
        {shop && (
          <View style={styles.shopBannerGlass}>
            <Image source={{ uri: shop.shopPhoto || DEFAULT_SHOP_LOGO }} style={styles.shopBannerImg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.shopBannerName} numberOfLines={1}>{shop.shopName}</Text>
              <View style={styles.typePillLight}><Text style={styles.typePillLightText}>{shop.type || "General"}</Text></View>
              {shop.note ? <Text style={styles.shopBannerNote} numberOfLines={1}>{shop.note}</Text> : null}
              {shop.phone && (
                <View style={styles.bannerContactRow}>
                  <TouchableOpacity style={styles.bannerContactBtn} onPress={() => handleCall(shop.phone!)}>
                    <Ionicons name="call" size={rfs(11)} color="white" /><Text style={styles.bannerContactText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.bannerContactBtn, { backgroundColor: WHATSAPP_GREEN }]} onPress={() => handleWhatsApp(shop.phone!)}>
                    <Ionicons name="logo-whatsapp" size={rfs(11)} color="white" /><Text style={styles.bannerContactText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </GlassHeader>

      <View style={styles.searchFilterRow}>
        <View style={[styles.searchBar, { flex: 1, margin: 0 }]}>
          <Ionicons name="search-outline" size={rfs(14)} color={TEXT_MUTED} />
          <TextInput style={styles.searchInput} placeholder="Search products…" placeholderTextColor={TEXT_DIM} value={searchTerm} onChangeText={setSearchTerm} />
        </View>
        <TouchableOpacity style={[styles.filterIconBtn, filterVisible && styles.filterIconBtnActive]} onPress={() => setFilterVisible(!filterVisible)}>
          <Ionicons name="options-outline" size={rfs(19)} color={filterVisible ? "white" : ACCENT_BLUE} />
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
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: scale(6) }}>
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
              <SkeletonBox w={scale(84)} h={scale(84)} r={scale(18)} />
              <View style={{ flex: 1, gap: scale(8) }}><SkeletonBox w="70%" h={scale(15)} r={6} /><SkeletonBox w="40%" h={scale(13)} r={6} /></View>
            </View>
          ))
          : filtered.length === 0
            ? <View style={styles.emptyState}><Ionicons name="cube-outline" size={scale(55)} color={TEXT_DIM} /><Text style={styles.emptyText}>No products found</Text></View>
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
                    <Ionicons name="cart-outline" size={rfs(11)} color="white" />
                    <Text style={styles.addCartText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
      </ScrollView>

      <PillBottomBar>
        <PillNavItem icon="home-outline" label="Home" onPress={() => navigation.navigate("UserDashboard")} />
        <PillNavItem icon="cart-outline" label="Cart" onPress={() => navigation.navigate("Cart")} badge={GlobalStore.cartCount} />
        <PillNavItem icon="person-outline" label="Profile" onPress={() => navigation.navigate("Profile")} />
      </PillBottomBar>
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
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const { toastState, showToast } = useToast();
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
    if (!currentUser) { showToast("Please login first", "error"); return; }
    if (!selectedRating) { showToast("Select a rating first", "warning"); return; }
    const snap = await database().ref(`users/${currentUser.uid}`).once("value");
    const u = snap.val() || {};
    await database().ref(`reviews/${productId}/${currentUser.uid}`).set({ rating: selectedRating, comment: reviewComment, timestamp: Date.now(), userName: u.fullName || u.shopName || "User" });
    showToast("✅ Review submitted!", "success");
    setSelectedRating(0); setReviewComment("");
  };

  const submitQuery = async () => {
    if (!newQuestion.trim()) { showToast("Enter a question", "warning"); return; }
    const snap = await database().ref(`users/${currentUser!.uid}`).once("value");
    const u = snap.val() || {};
    await database().ref(`queries/${productId}`).push({ userId: currentUser!.uid, userName: u.fullName || u.shopName || "Customer", question: newQuestion, answer: "", timestamp: Date.now(), answerTimestamp: null, answeredBy: null });
    showToast("✅ Question posted!", "success");
    setNewQuestion("");
  };

  const answerQuery = async (qid: string) => {
    const a = answerTexts[qid];
    if (!a?.trim()) return;
    await database().ref(`queries/${productId}/${qid}`).update({ answer: a, answerTimestamp: Date.now(), answeredBy: currentUser!.uid });
    showToast("✅ Answer posted!", "success");
    setAnswerTexts((p) => ({ ...p, [qid]: "" }));
  };

  const addToCart = async () => {
    if (!currentUser) { showToast("Please login to add to cart", "error"); return; }
    await database().ref(`carts/${currentUser.uid}/${productId}`).set({ productId, shopId, added: Date.now() });
    showToast("✅ Added to cart!", "success");
  };

  if (!product) return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={ACCENT_BLUE} /></View>;

  const revArr = Object.values(reviews);
  const avgRating = revArr.length ? (revArr.reduce((a, r) => a + r.rating, 0) / revArr.length).toFixed(1) : null;
  const productImageUri = product.photo || "https://via.placeholder.com/300?text=📦";

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />
      <FullImageViewer uri={productImageUri} visible={imageViewerVisible} onClose={() => setImageViewerVisible(false)} />

      <ScrollView contentContainerStyle={{ paddingBottom: scale(40) }}>
        <View style={[styles.topBar, { backgroundColor: BG_DARK, paddingTop: STATUS_BAR_H + scale(10), paddingBottom: scale(14) }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.topBarIconBtn}>
            <Ionicons name="arrow-back" size={rfs(20)} color={TEXT_WHITE} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>{product.name}</Text>
          <View style={{ width: scale(40) }} />
        </View>

        <View style={styles.detailCard}>
          <TouchableOpacity onPress={() => setImageViewerVisible(true)} activeOpacity={0.9}>
            <Image source={{ uri: productImageUri }} style={styles.detailImg} />
            <View style={styles.zoomHint}>
              <Ionicons name="expand-outline" size={rfs(14)} color="white" />
              <Text style={styles.zoomHintText}>Tap to view full image</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.detailBody}>
            <Text style={styles.detailName}>{product.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.detailPrice}>₹{product.price}</Text>
              <Text style={styles.productQty}>{product.quantity}</Text>
            </View>
            {product.note ? <Text style={styles.productNote}>{product.note}</Text> : null}
            {/* Show barcode on product detail if present */}
            {product.barcodeNumber ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6), marginTop: scale(6) }}>
                <Ionicons name="barcode-outline" size={rfs(13)} color={TEXT_DIM} />
                <Text style={{ color: TEXT_DIM, fontSize: rfs(11), fontWeight: "600" }}>Barcode: {product.barcodeNumber}</Text>
              </View>
            ) : null}
            <Text style={styles.shopRef}>🏪 {shop?.shopName || "Loading…"}</Text>
            {!isShopOwner && currentUser && (
              <TouchableOpacity style={styles.addCartBtnLg} onPress={addToCart}>
                <Ionicons name="cart-outline" size={rfs(17)} color="white" />
                <Text style={[styles.pillBtnText, { marginLeft: scale(8) }]}>Add to Cart</Text>
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
            </View>
          ))}
          {!isShopOwner && currentUser && (
            <View style={styles.addReview}>
              <Text style={styles.subSectionTitle}>Leave a Review</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TouchableOpacity key={i} onPress={() => setSelectedRating(i)}>
                    <Ionicons name={i <= selectedRating ? "star" : "star-outline"} size={scale(28)} color="#fbbf24" />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={[styles.input, { height: scale(70), textAlignVertical: "top" }]} placeholder="Your thoughts…" multiline value={reviewComment} onChangeText={setReviewComment} />
              <TouchableOpacity style={styles.smallPillBtn} onPress={submitReview}>
                <Ionicons name="send-outline" size={rfs(12)} color="white" />
                <Text style={styles.smallPillBtnText}> Submit</Text>
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
              {q.answer
                ? <View style={styles.answerBox}><Text style={styles.answerText}>A: {q.answer}</Text></View>
                : isShopOwner ? (
                  <>
                    <TextInput style={[styles.input, { marginTop: scale(8) }]} placeholder="Write your answer…" value={answerTexts[qid] || ""} onChangeText={(t) => setAnswerTexts((p) => ({ ...p, [qid]: t }))} />
                    <TouchableOpacity style={styles.smallPillBtn} onPress={() => answerQuery(qid)}><Text style={styles.smallPillBtnText}>Post Answer</Text></TouchableOpacity>
                  </>
                ) : <Text style={styles.awaitingText}>⏳ Awaiting shopkeeper reply</Text>}
            </View>
          ))}
          {!isShopOwner && currentUser && (
            <View style={styles.addReview}>
              <Text style={styles.subSectionTitle}>Ask a Question</Text>
              <TextInput style={[styles.input, { height: scale(70), textAlignVertical: "top" }]} placeholder="Type your question…" multiline value={newQuestion} onChangeText={setNewQuestion} />
              <TouchableOpacity style={styles.smallPillBtn} onPress={submitQuery}>
                <Ionicons name="chatbubble-outline" size={rfs(12)} color="white" />
                <Text style={styles.smallPillBtnText}> Ask</Text>
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
  const [loading, setLoading] = useState(true);
  const { toastState, showToast } = useToast();

  useEffect(() => {
    const cartRef = database().ref(`carts/${currentUser!.uid}`);
    const l = cartRef.on("value", async (snap) => {
      const cart = snap.val() || {};
      setCartItems(cart);
      const map: { [k: string]: Product } = {};
      await Promise.all(Object.keys(cart).map(async (pid) => {
        const ps = await database().ref(`products/${pid}`).once("value");
        const p = ps.val();
        if (p) map[pid] = p;
      }));
      setProducts(map); setLoading(false);
    });
    return () => cartRef.off("value", l);
  }, [currentUser]);

  const removeFromCart = async (productId: string) => {
    await database().ref(`carts/${currentUser!.uid}/${productId}`).remove();
    showToast("Item removed from cart", "info");
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />
      <View style={[styles.topBar, { backgroundColor: BG_DARK, paddingTop: STATUS_BAR_H + scale(10), paddingBottom: scale(14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.topBarIconBtn}>
          <Ionicons name="arrow-back" size={rfs(20)} color={TEXT_WHITE} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>My Cart ({Object.keys(cartItems).length})</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: scale(16), paddingBottom: BOTTOM_TAB_H + scale(40) }}>
        {loading
          ? [1, 2].map((i) => <View key={i} style={[styles.productCard, { gap: scale(12) }]}><SkeletonBox w={scale(76)} h={scale(76)} r={scale(18)} /><View style={{ flex: 1, gap: scale(8) }}><SkeletonBox w="60%" h={scale(15)} r={6} /><SkeletonBox w="40%" h={scale(13)} r={6} /></View></View>)
          : Object.keys(cartItems).length === 0
            ? <View style={styles.emptyState}><Ionicons name="cart-outline" size={scale(60)} color={TEXT_DIM} /><Text style={styles.emptyText}>Your cart is empty</Text></View>
            : Object.keys(cartItems).map((prodId) => {
              const p = products[prodId];
              if (!p) return null;
              return (
                <View key={prodId} style={styles.productCard}>
                  <Image source={{ uri: p.photo || "https://via.placeholder.com/90" }} style={styles.productImg} />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.productPrice}>₹{p.price}</Text>
                    {p.quantity ? <Text style={styles.productQty}>{p.quantity}</Text> : null}
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(prodId)}>
                      <Ionicons name="trash-outline" size={rfs(12)} color="#ef4444" />
                      <Text style={styles.removeBtnText}> Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
      </ScrollView>

      {Object.keys(cartItems).length > 0 && !loading && (
        <View style={[styles.checkoutBar, { bottom: BOTTOM_TAB_H + scale(12) }]}>
          <TouchableOpacity style={[styles.pillBtn, { marginTop: 0, flex: 1 }]}>
            <Ionicons name="bag-check-outline" size={rfs(17)} color="white" />
            <Text style={styles.pillBtnText}> Checkout</Text>
          </TouchableOpacity>
        </View>
      )}

      <PillBottomBar>
        <PillNavItem icon="home-outline" label="Home" onPress={() => navigation.navigate("UserDashboard")} />
        <PillNavItem icon="cart" label="Cart" active />
        <PillNavItem icon="person-outline" label="Profile" onPress={() => navigation.navigate("Profile")} />
      </PillBottomBar>
    </View>
  );
};

// ── Info Row ──────────────────────────────────────────────────────────
const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "—"}</Text>
  </View>
);

// ── Profile Screen ────────────────────────────────────────────────────
const ProfileScreen = ({ navigation }: any) => {
  const { currentUser, currentRole } = React.useContext(AppContext);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showDangerZone, setShowDangerZone] = useState(false);
  const { toastState, showToast } = useToast();

  useEffect(() => {
    const ref = database().ref(`users/${currentUser!.uid}`);
    const l = ref.on("value", (s) => setUserData(s.val()));
    return () => ref.off("value", l);
  }, [currentUser]);

  const photo = currentRole === "shopkeeper" ? userData?.shopPhoto || DEFAULT_SHOP_LOGO : userData?.photoURL || DEFAULT_AVATAR;
  const name = currentRole === "shopkeeper" ? userData?.shopName : userData?.fullName;

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of CityLinks?", [
      { text: "Stay", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await auth().signOut(); navigation.reset({ index: 0, routes: [{ name: "Auth" }] }); } },
    ]);
  };

  const handleRequestDeletion = () => {
    Alert.alert("Request Account Deletion", "Account deletion requires review (7 days). Submit request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Submit Request",
        onPress: async () => {
          await database().ref(`deletionRequests/${currentUser!.uid}`).set({ requestedAt: Date.now(), email: userData?.email || currentUser?.email, status: "pending" });
          showToast("Deletion request submitted", "info");
        }
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />
      <ScrollView contentContainerStyle={{ paddingBottom: scale(50) }}>
        <View style={[styles.topBar, { backgroundColor: BG_DARK, paddingTop: STATUS_BAR_H + scale(10), paddingBottom: scale(14) }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.topBarIconBtn}>
            <Ionicons name="arrow-back" size={rfs(20)} color={TEXT_WHITE} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Profile</Text>
          <View style={{ width: scale(40) }} />
        </View>
        <View style={styles.profileHero}>
          <View style={styles.profileAvatarWrap}>
            <Image source={{ uri: photo }} style={styles.profileAvatar} />
            <TouchableOpacity style={styles.profileAvatarEdit} onPress={() => navigation.navigate("EditProfile")}>
              <Ionicons name="camera" size={rfs(14)} color="white" />
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
              <InfoRow label="Location" value={userData?.location} />
              <InfoRow label="GST" value={userData?.gstNumber} />
              <InfoRow label="PAN" value={userData?.panNumber} />
              <InfoRow label="Shop Reg #" value={userData?.shopRegNumber} />
              <InfoRow label="Bank Account" value={userData?.bankAccount ? "••••" + userData.bankAccount.slice(-4) : undefined} />
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
          <TouchableOpacity style={[styles.pillBtn, { marginTop: scale(16) }]} onPress={() => navigation.navigate("EditProfile")}>
            <Ionicons name="create-outline" size={rfs(17)} color="white" />
            <Text style={styles.pillBtnText}> Edit Profile</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.formCard, { margin: scale(16), marginTop: 0 }]}>
          <Text style={styles.formTitle}>Security</Text>
          <TouchableOpacity style={styles.secBtn} onPress={() => navigation.navigate("ChangePassword")}>
            <Ionicons name="key-outline" size={rfs(19)} color={ACCENT_BLUE} />
            <Text style={styles.secBtnText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={rfs(15)} color={TEXT_DIM} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secBtn} onPress={() => setShowDangerZone(!showDangerZone)}>
            <Ionicons name="shield-outline" size={rfs(19)} color={TEXT_MUTED} />
            <Text style={[styles.secBtnText, { color: TEXT_MUTED }]}>Account Actions</Text>
            <Ionicons name={showDangerZone ? "chevron-up" : "chevron-down"} size={rfs(15)} color={TEXT_DIM} />
          </TouchableOpacity>
          {showDangerZone && (
            <View style={styles.dangerZone}>
              <TouchableOpacity style={styles.dangerBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={rfs(16)} color={ACCENT_AMBER} />
                <Text style={[styles.dangerBtnText, { color: ACCENT_AMBER }]}>Sign Out</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerBtn} onPress={handleRequestDeletion}>
                <Ionicons name="trash-outline" size={rfs(16)} color="#ef4444" />
                <Text style={[styles.dangerBtnText, { color: "#ef4444" }]}>Request Account Deletion</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ── Edit Profile ──────────────────────────────────────────────────────
const EditProfileScreen = ({ navigation }: any) => {
  const { currentUser, currentRole } = React.useContext(AppContext);
  const [shopName, setShopName] = useState(""); const [shopNote, setShopNote] = useState("");
  const [shopAbout, setShopAbout] = useState(""); const [shopType, setShopType] = useState("");
  const [shopPhone, setShopPhone] = useState(""); const [shopLocation, setShopLocation] = useState("");
  const [shopCoords, setShopCoords] = useState<LatLng | null>(null);
  const [fullName, setFullName] = useState(""); const [age, setAge] = useState("");
  const [phone, setPhone] = useState(""); const [location, setLocation] = useState("");
  const [locCoords, setLocCoords] = useState<LatLng | null>(null);
  const [photo, setPhoto] = useState<string | null>(null); const [photoSaving, setPhotoSaving] = useState(false);
  const [gstNumber, setGstNumber] = useState(""); const [panNumber, setPanNumber] = useState("");
  const [shopRegNumber, setShopRegNumber] = useState(""); const [bankAccount, setBankAccount] = useState("");
  const { toastState, showToast } = useToast();

  useEffect(() => {
    database().ref(`users/${currentUser!.uid}`).once("value").then((snap) => {
      const d = snap.val() || {};
      if (currentRole === "shopkeeper") {
        setShopName(d.shopName || ""); setShopNote(d.note || ""); setShopAbout(d.about || "");
        setShopType(d.type || ""); setPhoto(d.shopPhoto || null); setShopPhone(d.phone || ""); setShopLocation(d.location || "");
        setGstNumber(d.gstNumber || ""); setPanNumber(d.panNumber || ""); setShopRegNumber(d.shopRegNumber || ""); setBankAccount(d.bankAccount || "");
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
      Object.assign(updates, { shopName, note: shopNote, about: shopAbout, type: shopType, phone: shopPhone.trim(), location: shopLocation.trim(), gstNumber: gstNumber.trim(), panNumber: panNumber.trim(), shopRegNumber: shopRegNumber.trim(), bankAccount: bankAccount.trim() });
      if (shopCoords) { updates.latitude = shopCoords.latitude; updates.longitude = shopCoords.longitude; }
    } else {
      Object.assign(updates, { fullName, age, phone, location });
      if (locCoords) { updates.latitude = locCoords.latitude; updates.longitude = locCoords.longitude; }
    }
    await database().ref(`users/${currentUser!.uid}`).update(updates);
    showToast("✅ Profile saved!", "success");
    setTimeout(() => navigation.goBack(), 800);
  };

  const displayPhoto = photo || (currentRole === "shopkeeper" ? DEFAULT_SHOP_LOGO : DEFAULT_AVATAR);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG_DARK }} behavior="padding">
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets={true}>
        <TouchableOpacity style={[styles.changePwBack, { position: "relative", top: 0, left: 0, marginBottom: scale(16), alignSelf: "flex-start" }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rfs(20)} color={TEXT_WHITE} />
        </TouchableOpacity>
        <View style={styles.formCard}>
          <Text style={[styles.formTitle, { textAlign: currentRole === "shopkeeper" ? "left" : "center" }]}>✏️ Edit {currentRole === "shopkeeper" ? "Shop" : "Profile"}</Text>
          {currentRole === "shopkeeper" ? (
            <TouchableOpacity style={styles.shopPhotoPickerLarge} onPress={handlePickPhoto}>
              <Image source={{ uri: displayPhoto }} style={styles.shopPhotoImg} />
              <View style={styles.profileAvatarEdit}><Ionicons name="camera" size={rfs(12)} color="white" /></View>
              {photoSaving && <View style={styles.photoOverlay}><ActivityIndicator color="white" /></View>}
            </TouchableOpacity>
          ) : (
            <View style={{ alignItems: "center", marginBottom: scale(24) }}>
              <TouchableOpacity style={styles.editProfileAvatarWrap} onPress={handlePickPhoto}>
                <Image source={{ uri: displayPhoto }} style={styles.editProfileAvatar} />
                <View style={styles.profileAvatarEdit}><Ionicons name="camera" size={rfs(14)} color="white" /></View>
                {photoSaving && <View style={styles.photoOverlay}><ActivityIndicator color="white" /></View>}
              </TouchableOpacity>
              <Text style={{ color: TEXT_MUTED, fontSize: rfs(12), marginTop: scale(8), fontWeight: "600" }}>Tap to change photo</Text>
            </View>
          )}
          {currentRole === "shopkeeper" ? (
            <>
              <Text style={styles.label}>Shop name</Text>
              <TextInput style={styles.input} value={shopName} onChangeText={setShopName} returnKeyType="next" />
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneInputWrap}>
                <View style={styles.phoneFlag}><Text style={styles.phoneCountryCode}>🇮🇳 +91</Text></View>
                <TextInput style={styles.phoneInput} value={shopPhone} onChangeText={setShopPhone} placeholder="Mobile number" placeholderTextColor={TEXT_DIM} keyboardType="phone-pad" returnKeyType="next" maxLength={15} />
              </View>
              <LocationPicker value={shopLocation} onChange={setShopLocation} onCoordsChange={(lat, lng) => setShopCoords({ latitude: lat, longitude: lng })} label="Shop Location" />
              <Text style={styles.label}>Offer note</Text>
              <TextInput style={styles.input} value={shopNote} onChangeText={setShopNote} returnKeyType="next" />
              <Text style={styles.label}>About</Text>
              <TextInput style={[styles.input, styles.textArea]} multiline value={shopAbout} onChangeText={setShopAbout} />
              <Text style={styles.label}>Category</Text>
              <TextInput style={styles.input} value={shopType} onChangeText={setShopType} />
              <View style={styles.sectionDivider}><Text style={styles.sectionDividerText}>📋 Business Verification</Text></View>
              <Text style={styles.label}>GST Number</Text>
              <TextInput style={styles.input} value={gstNumber} onChangeText={setGstNumber} autoCapitalize="characters" />
              <Text style={styles.label}>PAN Number</Text>
              <TextInput style={styles.input} value={panNumber} onChangeText={setPanNumber} autoCapitalize="characters" />
              <Text style={styles.label}>Shop Registration Number</Text>
              <TextInput style={styles.input} value={shopRegNumber} onChangeText={setShopRegNumber} />
              <Text style={styles.label}>Bank Account Number</Text>
              <TextInput style={styles.input} value={bankAccount} onChangeText={setBankAccount} keyboardType="numeric" />
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
            <TouchableOpacity style={[styles.pillBtn, styles.pillBtnOutline, { flex: 0.4 }]} onPress={() => navigation.goBack()}>
              <Text style={[styles.pillBtnText, { color: ACCENT_BLUE }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pillBtn, { flex: 1 }]} onPress={handleSave}>
              <Ionicons name="save-outline" size={rfs(17)} color="white" />
              <Text style={styles.pillBtnText}> Save</Text>
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
  const [loading, setLoading] = useState(false);
  const { currentUser } = React.useContext(AppContext);
  const { toastState, showToast } = useToast();

  const handle = async () => {
    if (!cur || !nw || !conf) { showToast("All fields required", "error"); return; }
    if (nw !== conf) { showToast("Passwords do not match", "error"); return; }
    if (nw.length < 6) { showToast("Minimum 6 characters", "error"); return; }
    setLoading(true);
    try {
      const user = auth().currentUser!;
      const cred = auth.EmailAuthProvider.credential(user.email!, cur);
      await user.reauthenticateWithCredential(cred);
      await user.updatePassword(nw);
      showToast("✅ Password updated!", "success");
      setTimeout(() => navigation.goBack(), 1200);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG_DARK }} behavior="padding">
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />
      <View style={{ position: "absolute", top: -scale(80), right: -scale(50), width: scale(250), height: scale(250), borderRadius: scale(125), backgroundColor: "rgba(99,102,241,0.18)" }} />
      <View style={{ position: "absolute", bottom: -scale(60), left: -scale(40), width: scale(200), height: scale(200), borderRadius: scale(100), backgroundColor: "rgba(59,130,246,0.12)" }} />
      <FloatingBubbles count={10} />
      <ScrollView contentContainerStyle={styles.changePwContainer} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.changePwBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rfs(20)} color={TEXT_WHITE} />
        </TouchableOpacity>
        <View style={styles.changePwHero}>
          <View style={styles.changePwIconWrap}>
            <Ionicons name="lock-closed" size={scale(36)} color="white" />
          </View>
          <Text style={styles.changePwTitle}>Change Password</Text>
          <Text style={styles.changePwSub}>Keep your account secure with a strong password</Text>
        </View>
        <View style={styles.changePwCard}>
          <View style={styles.pwStep}>
            <View style={styles.pwStepNum}><Text style={styles.pwStepNumText}>1</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Current Password</Text>
              <PasswordInput value={cur} onChange={setCur} placeholder="Enter current password" show={sc} setShow={setSc} returnKeyType="next" />
            </View>
          </View>
          <View style={styles.pwStepDivider} />
          <View style={styles.pwStep}>
            <View style={[styles.pwStepNum, { backgroundColor: ACCENT_VIOLET }]}><Text style={styles.pwStepNumText}>2</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>New Password</Text>
              <PasswordInput value={nw} onChange={setNw} placeholder="Min. 6 characters" show={sn} setShow={setSn} returnKeyType="next" />
            </View>
          </View>
          <View style={styles.pwStep}>
            <View style={[styles.pwStepNum, { backgroundColor: SUCCESS }]}><Text style={styles.pwStepNumText}>3</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Confirm New Password</Text>
              <PasswordInput value={conf} onChange={setConf} placeholder="Re-enter new password" show={sconf} setShow={setSconf} returnKeyType="done" onSubmit={handle} />
            </View>
          </View>
          {nw.length > 0 && (
            <View style={styles.pwStrengthWrap}>
              <View style={[styles.pwStrengthBar, { backgroundColor: nw.length >= 8 ? SUCCESS : nw.length >= 6 ? ACCENT_AMBER : "#ef4444" }]} />
              <Text style={[styles.pwStrengthText, { color: nw.length >= 8 ? SUCCESS : nw.length >= 6 ? ACCENT_AMBER : "#ef4444" }]}>
                {nw.length >= 8 ? "Strong" : nw.length >= 6 ? "Medium" : "Weak"}
              </Text>
            </View>
          )}
          <TouchableOpacity style={[styles.pillBtn, { marginTop: scale(20) }, loading && { opacity: 0.7 }]} onPress={handle} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="shield-checkmark-outline" size={rfs(19)} color="white" />}
            <Text style={styles.pillBtnText}> {loading ? "Updating…" : "Update Password"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pillBtn, styles.pillBtnOutline, { marginTop: scale(10) }]} onPress={() => navigation.goBack()}>
            <Text style={[styles.pillBtnText, { color: ACCENT_BLUE }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── Forgot Password ─────────────────────────────────────────
const ForgotPasswordScreen = ({ navigation }: any) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNP, setShowNP] = useState(false);
  const [showCP, setShowCP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string>("");
  const [verifiedUid, setVerifiedUid] = useState<string>("");
  const { toastState, showToast } = useToast();

  const handleVerifyIdentity = async () => {
    if (!email.trim()) {
      showToast("Please enter your email address", "error"); return;
    }
    setLoading(true);
    try {
      // Only check if email exists in the users DB
      const snap = await database().ref("users")
        .orderByChild("email")
        .equalTo(email.trim().toLowerCase())
        .once("value");
      const users = snap.val();
      if (!users) {
        showToast("No account found with this email. Please create an account or enter the correct email.", "error");
        setLoading(false); return;
      }

      const uid = Object.keys(users)[0];
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(otp);
      setVerifiedEmail(email.trim().toLowerCase());
      setVerifiedUid(uid);
      await database().ref(`passwordResets/${uid}`).set({ otp, email: email.trim().toLowerCase(), createdAt: Date.now() });
      showToast(`🔐 Your OTP is: ${otp}`, "info", 8000);
      setStep(2);
    } catch (e: any) { showToast(e.message || "Something went wrong", "error"); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = () => {
    if (!otpInput.trim()) { showToast("Enter the OTP", "error"); return; }
    if (otpInput.trim() !== generatedOtp) { showToast("Incorrect OTP. Please try again.", "error"); return; }
    showToast("✅ OTP verified!", "success");
    setStep(3);
  };

  // Update password directly in Firebase Auth using REST API via existing password in DB
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) { showToast("Fill in both password fields", "error"); return; }
    if (newPassword !== confirmPassword) { showToast("Passwords don't match", "error"); return; }
    if (newPassword.length < 6) { showToast("Minimum 6 characters", "error"); return; }
    setLoading(true);
    try {
      // Try to get stored old password from DB (if it was saved during signup as plain text)
      const userSnap = await database().ref(`users/${verifiedUid}`).once("value");
      const userData = userSnap.val() || {};
      const storedPassword = userData.password; // Only works if signup stored it

      let passwordUpdated = false;

      if (storedPassword) {
        // Step 1: Sign in via REST to get idToken
        try {
          const signInRes = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: verifiedEmail, password: storedPassword, returnSecureToken: true }),
            }
          );
          const signInData = await signInRes.json();
          if (signInData.idToken) {
            // Step 2: Update password using the idToken
            const updateRes = await fetch(
              `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken: signInData.idToken, password: newPassword, returnSecureToken: true }),
              }
            );
            const updateData = await updateRes.json();
            if (!updateData.error) {
              // Also update stored password in DB
              await database().ref(`users/${verifiedUid}`).update({ password: newPassword });
              await database().ref(`passwordResets/${verifiedUid}`).remove();
              passwordUpdated = true;
            }
          }
        } catch { /* fall through to reset email */ }
      }

      if (!passwordUpdated) {
        // Fallback: send Firebase password reset email
        await auth().sendPasswordResetEmail(verifiedEmail);
        showToast(
          `📧 Reset email sent to ${verifiedEmail}. Open the link in the email to set your new password.`,
          "success",
          7000
        );
        setTimeout(() => navigation.navigate("Auth"), 6000);
        return;
      }

      showToast("✅ Password updated successfully! Please log in with your new password.", "success", 4000);
      setTimeout(() => navigation.navigate("Auth"), 3500);
    } catch (e: any) {
      const msg = String(e?.message || "Failed to reset password");
      showToast(msg, "error");
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG_DARK }} behavior="padding">
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />
      <View style={{ position: "absolute", top: -scale(80), right: -scale(50), width: scale(250), height: scale(250), borderRadius: scale(125), backgroundColor: "rgba(99,102,241,0.18)" }} />
      <View style={{ position: "absolute", bottom: -scale(60), left: -scale(40), width: scale(200), height: scale(200), borderRadius: scale(100), backgroundColor: "rgba(59,130,246,0.12)" }} />
      <FloatingBubbles count={10} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: scale(24), paddingBottom: scale(60), alignItems: "center", justifyContent: "center", paddingTop: STATUS_BAR_H + scale(20) }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.changePwBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rfs(20)} color={TEXT_WHITE} />
        </TouchableOpacity>
        <View style={styles.changePwHero}>
          <View style={[styles.changePwIconWrap, { backgroundColor: ACCENT_VIOLET }]}>
            <Ionicons name="key" size={scale(36)} color="white" />
          </View>
          <Text style={styles.changePwTitle}>Forgot Password</Text>
          <Text style={styles.changePwSub}>
            {step === 1 ? "Verify your identity to reset your password"
              : step === 2 ? "Enter the OTP shown on your screen"
                : "Set your new password — a reset link will be sent to your email"}
          </Text>
        </View>

        {/* Step indicators */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: scale(28), gap: scale(4) }}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={[{ width: scale(28), height: scale(28), borderRadius: scale(14), alignItems: "center", justifyContent: "center" },
              step > s ? { backgroundColor: SUCCESS } : step === s ? { backgroundColor: ACCENT_BLUE } : { backgroundColor: SURFACE_2, borderWidth: 1, borderColor: GLASS_BORDER }]}>
                {step > s
                  ? <Ionicons name="checkmark" size={rfs(14)} color="white" />
                  : <Text style={{ color: step === s ? "white" : TEXT_DIM, fontWeight: "700", fontSize: rfs(12) }}>{s}</Text>}
              </View>
              {s < 3 && <View style={{ width: scale(30), height: 2, backgroundColor: step > s ? SUCCESS : GLASS_BORDER, marginHorizontal: scale(2) }} />}
            </View>
          ))}
        </View>

        <View style={[styles.changePwCard, { width: "100%" }]}>
          {step === 1 && (
            <>
              <Text style={styles.label}>Email Address</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Your registered email" placeholderTextColor={TEXT_DIM} keyboardType="email-address" autoCapitalize="none" returnKeyType="done" />
              <TouchableOpacity style={[styles.pillBtn, loading && { opacity: 0.7 }]} onPress={handleVerifyIdentity} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="shield-checkmark-outline" size={rfs(19)} color="white" />}
                <Text style={styles.pillBtnText}> {loading ? "Checking…" : "Send OTP"}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <View style={{ backgroundColor: "rgba(99,102,241,0.1)", borderRadius: scale(14), padding: scale(14), marginBottom: scale(16), borderWidth: 1, borderColor: "rgba(99,102,241,0.3)" }}>
                <Text style={{ color: ACCENT_VIOLET, fontWeight: "700", fontSize: rfs(12), textAlign: "center" }}>
                  📱 Check the OTP toast notification above
                </Text>
                <Text style={{ color: TEXT_MUTED, fontSize: rfs(11), textAlign: "center", marginTop: scale(4) }}>
                  The OTP is displayed on screen for 8 seconds
                </Text>
              </View>
              <Text style={styles.label}>Enter 6-Digit OTP</Text>
              <TextInput
                style={[styles.input, { letterSpacing: scale(6), textAlign: "center", fontSize: rfs(22), fontWeight: "800" }]}
                value={otpInput}
                onChangeText={(v) => setOtpInput(v.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000" placeholderTextColor={TEXT_DIM}
                keyboardType="numeric" maxLength={6} returnKeyType="done"
              />
              <TouchableOpacity style={styles.pillBtn} onPress={handleVerifyOtp}>
                <Ionicons name="checkmark-circle-outline" size={rfs(19)} color="white" />
                <Text style={styles.pillBtnText}> Verify OTP</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ alignSelf: "center", marginTop: scale(12) }} onPress={() => showToast(`Your OTP is: ${generatedOtp}`, "info", 8000)}>
                <Text style={{ color: ACCENT_BLUE, fontWeight: "600", fontSize: rfs(13) }}>Resend OTP</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 3 && (
            <>
              <View style={{ backgroundColor: "rgba(16,185,129,0.1)", borderRadius: scale(14), padding: scale(14), marginBottom: scale(16), borderWidth: 1, borderColor: "rgba(16,185,129,0.3)" }}>
                <Text style={{ color: SUCCESS, fontWeight: "700", fontSize: rfs(12), textAlign: "center" }}>
                  ✅ OTP Verified — Enter your new password
                </Text>
                <Text style={{ color: TEXT_MUTED, fontSize: rfs(11), textAlign: "center", marginTop: scale(4) }}>
                  For {verifiedEmail}
                </Text>
              </View>

              <Text style={styles.label}>New Password</Text>
              <View style={styles.pwWrap}>
                <TextInput style={styles.pwInput} placeholder="Min. 6 characters" placeholderTextColor={TEXT_DIM} secureTextEntry={!showNP} value={newPassword} onChangeText={setNewPassword} returnKeyType="next" autoFocus />
                <TouchableOpacity style={styles.pwEye} onPress={() => setShowNP(!showNP)} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
                  <Ionicons name={showNP ? "eye-off-outline" : "eye-outline"} size={rfs(20)} color={ACCENT_BLUE} />
                </TouchableOpacity>
              </View>

              {newPassword.length > 0 && (
                <View style={[styles.pwStrengthWrap, { marginBottom: scale(8) }]}>
                  <View style={[styles.pwStrengthBar, { backgroundColor: newPassword.length >= 8 ? SUCCESS : newPassword.length >= 6 ? ACCENT_AMBER : "#ef4444" }]} />
                  <Text style={[styles.pwStrengthText, { color: newPassword.length >= 8 ? SUCCESS : newPassword.length >= 6 ? ACCENT_AMBER : "#ef4444" }]}>
                    {newPassword.length >= 8 ? "Strong" : newPassword.length >= 6 ? "Medium" : "Weak"}
                  </Text>
                </View>
              )}

              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.pwWrap}>
                <TextInput style={styles.pwInput} placeholder="Re-enter new password" placeholderTextColor={TEXT_DIM} secureTextEntry={!showCP} value={confirmPassword} onChangeText={setConfirmPassword} returnKeyType="done" onSubmitEditing={handleResetPassword} />
                <TouchableOpacity style={styles.pwEye} onPress={() => setShowCP(!showCP)} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
                  <Ionicons name={showCP ? "eye-off-outline" : "eye-outline"} size={rfs(20)} color={ACCENT_BLUE} />
                </TouchableOpacity>
              </View>

              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <Text style={{ color: "#ef4444", fontSize: rfs(11), marginBottom: scale(8), marginTop: -scale(6) }}>⚠️ Passwords don't match</Text>
              )}
              {confirmPassword.length > 0 && newPassword === confirmPassword && newPassword.length >= 6 && (
                <Text style={{ color: SUCCESS, fontSize: rfs(11), marginBottom: scale(8), marginTop: -scale(6) }}>✅ Passwords match!</Text>
              )}

              <TouchableOpacity
                style={[styles.pillBtn, { backgroundColor: SUCCESS }, loading && { opacity: 0.7 }]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="shield-checkmark-outline" size={rfs(19)} color="white" />}
                <Text style={styles.pillBtnText}> {loading ? "Processing…" : "Reset Password"}</Text>
              </TouchableOpacity>

              <Text style={[styles.hintText, { textAlign: "center", marginTop: scale(10) }]}>
                📧 Check your email and click the reset link to apply your new password
              </Text>
            </>
          )}

          <TouchableOpacity style={[styles.pillBtn, styles.pillBtnOutline, { marginTop: scale(10) }]} onPress={() => navigation.goBack()}>
            <Text style={[styles.pillBtnText, { color: ACCENT_BLUE }]}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

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
  if (!initialRoute) return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={ACCENT_BLUE} /></View>;
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
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
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
  if (isLoading) return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={ACCENT_BLUE} /></View>;
  if (!currentUser) return (
    <Stack.Navigator id="AuthNavigator" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
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











