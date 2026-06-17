import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Keyboard, Modal, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AnimatedShopCard from '../components/AnimatedShopCard';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import FloatingBubbles from '../components/FloatingBubbles';
import PillBottomBar from '../components/PillBottomBar';
import PillNavItem from '../components/PillNavItem';
import ShopCardSkeleton from '../components/ShopCardSkeleton';
import Toast from '../components/Toast';
import TopBar from '../components/TopBar';
import { AppContext } from '../context/AppContext';
import { database } from '../services/firebase';
import { getCurrentLocation, requestLocationPermission } from '../services/location';
import { LatLng, UserData } from '../types';
import { DEFAULT_AVATAR } from '../utils/constants';
import { haversineKm } from '../utils/helpers';
import { rfs, scale } from '../utils/scaling';
import { GlobalStore } from '../utils/store';
import { ACCENT_BLUE, ACCENT_CYAN, BG_DARK, BOTTOM_TAB_H, globalStyles as styles, TEXT_DIM, TEXT_MUTED, TEXT_WHITE } from '../utils/theme';
import { useToast } from '../utils/useToast';

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
    let combinedData: any = { ...GlobalStore.shops };
    const updateShops = () => {
      GlobalStore.shops = combinedData; setShops({...combinedData}); setShopsLoaded(true);
      Object.keys(combinedData).forEach((id) => {
        if (combinedData[id].role === 'shopkeeper') {
          database().ref("products").orderByChild("shopId").equalTo(id).once("value")
            .then((ps) => { GlobalStore.products[id] = ps.val() || {}; }).catch(() => { });
        }
      });
    };

    const shopsRef = database().ref("users").orderByChild("role").equalTo("shopkeeper");
    const sl = shopsRef.on("value", (snap) => {
      const data = snap.val() || {};
      Object.keys(combinedData).forEach(k => { if(combinedData[k].role === 'shopkeeper') delete combinedData[k] });
      combinedData = { ...combinedData, ...data }; updateShops();
    });

    const laborRef = database().ref("users").orderByChild("role").equalTo("labor");
    const ll = laborRef.on("value", (snap) => {
      const data = snap.val() || {};
      Object.keys(combinedData).forEach(k => { if(combinedData[k].role === 'labor') delete combinedData[k] });
      combinedData = { ...combinedData, ...data }; updateShops();
    });

    const transportRef = database().ref("users").orderByChild("role").equalTo("transport");
    const tl = transportRef.on("value", (snap) => {
      const data = snap.val() || {};
      Object.keys(combinedData).forEach(k => { if(combinedData[k].role === 'transport') delete combinedData[k] });
      combinedData = { ...combinedData, ...data }; updateShops();
    });
    const cartRef = database().ref(`carts/${currentUser!.uid}`);
    const cl = cartRef.on("value", (s) => {
      const v = s.val(); const count = v ? Object.keys(v).length : 0;
      GlobalStore.cartCount = count; setCartCount(count);
    });
    return () => { userRef.off("value", ul); shopsRef.off("value", sl); laborRef.off("value", ll); transportRef.off("value", tl); cartRef.off("value", cl); };
  }, [currentUser]);

  const cityOptions = useMemo(() => {
    const cities = new Set<string>();
    Object.values(shops).forEach((s) => { if (s.location?.trim()) cities.add(s.location.trim()); });
    return ["All", ...Array.from(cities).sort()];
  }, [shops]);

  const filteredShops = useMemo(() => {
    const list = Object.entries(shops).filter(([, s]) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || s.shopName?.toLowerCase().includes(q) || s.type?.toLowerCase().includes(q) || s.location?.toLowerCase().includes(q) || s.fullName?.toLowerCase().includes(q) || s.skillType?.toLowerCase().includes(q) || s.vehicleType?.toLowerCase().includes(q);
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

  const openShop = useCallback((userId: string, targetData: UserData) => {
    Keyboard.dismiss();
    if (targetData.role === "labor" || targetData.role === "transport") {
      navigation.navigate("ServiceProfile", { userId, userData: targetData });
    } else {
      navigation.navigate("ShopProducts", { shopId: userId, shopData: targetData, cachedProducts: GlobalStore.products[userId] ?? null });
    }
  }, [navigation]);

  const renderShopItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <AnimatedShopCard shopId={item.id} shop={item} index={index} distanceKm={item.distanceKm} onPress={() => openShop(item.id, item)} />
  ), [openShop]);

  const firstName = userData?.fullName?.split(" ")[0] || "there";

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_DARK} />
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

export default UserDashboard;
