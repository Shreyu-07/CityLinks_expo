import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import PillBottomBar from '../components/PillBottomBar';
import PillNavItem from '../components/PillNavItem';
import SkeletonBox from '../components/SkeletonBox';
import Toast from '../components/Toast';
import { AppContext } from '../context/AppContext';
import { database } from '../services/firebase';
import { Product } from '../types';
import { rfs, scale } from '../utils/scaling';
import { BG_DARK, BOTTOM_TAB_H, STATUS_BAR_H, globalStyles as styles, TEXT_DIM, TEXT_WHITE } from '../utils/theme';
import { useToast } from '../utils/useToast';

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
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
