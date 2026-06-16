import { Platform, StatusBar, StyleSheet } from "react-native";
import { rfs, scale, vs, SCREEN_W, SCREEN_H } from "./scaling";

export const STATUS_BAR_H = Platform.OS === "ios" ? 44 : (StatusBar.currentHeight ?? 24);
export const BOTTOM_TAB_H = Platform.OS === "ios" ? 90 : 70;

export const BG_DARK = "#0A0F1E";
export const SURFACE = "#111827";
export const SURFACE_2 = "#1A2235";
export const GLASS = "rgba(255,255,255,0.07)";
export const GLASS_BORDER = "rgba(255,255,255,0.12)";
export const ACCENT_BLUE = "#3B82F6";
export const ACCENT_VIOLET = "#6366F1";
export const ACCENT_CYAN = "#22D3EE";
export const ACCENT_AMBER = "#F59E0B";
export const SUCCESS = "#10B981";
export const WHATSAPP_GREEN = "#25D366";
export const TEXT_WHITE = "#F1F5F9";
export const TEXT_MUTED = "#94A3B8";
export const TEXT_DIM = "#475569";

export const globalStyles = StyleSheet.create({
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

  // Barcode product result card
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
