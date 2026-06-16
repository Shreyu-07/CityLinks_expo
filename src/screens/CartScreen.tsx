import { AppContext } from '../context/AppContext';
import { useToast } from '../utils/useToast';
import { StatusBar } from 'react-native';
import Toast from '../components/Toast';
import SkeletonBox from '../components/SkeletonBox';
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

export default CartScreen;
