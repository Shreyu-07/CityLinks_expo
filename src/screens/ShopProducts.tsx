import { useToast } from '../utils/useToast';
import { GlobalStore } from '../utils/store';
import { StatusBar } from 'react-native';
import { handleCall, handleWhatsApp } from '../utils/contactHelpers';
import Toast from '../components/Toast';
import SkeletonBox from '../components/SkeletonBox';
import GlassHeader from '../components/GlassHeader';
import PillBottomBar from '../components/PillBottomBar';
import PillNavItem from '../components/PillNavItem';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, Animated, Dimensions, Modal, KeyboardAvoidingView, Platform, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { scale, vs, ms, rfs, SCREEN_W, SCREEN_H } from '../utils/scaling';
import { globalStyles as styles, BG_DARK, SURFACE, SURFACE_2, GLASS, GLASS_BORDER, ACCENT_BLUE, ACCENT_VIOLET, ACCENT_CYAN, ACCENT_AMBER, SUCCESS, WHATSAPP_GREEN, TEXT_WHITE, TEXT_MUTED, TEXT_DIM, STATUS_BAR_H, BOTTOM_TAB_H } from '../utils/theme';
import { UserData, Product, UserRole, LatLng, Review, QueryItem } from '../types';
import { useAppContext } from '../context/AppContext';
import { database, auth } from '../services/firebase';
import { requestLocationPermission, getCurrentLocation } from '../services/location';
import { formatDistance, haversineKm } from '../utils/helpers';
import { SHOP_CATEGORIES, DEFAULT_AVATAR, DEFAULT_SHOP_LOGO } from '../utils/constants';

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

export default ShopProducts;
