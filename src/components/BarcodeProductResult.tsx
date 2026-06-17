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

export default BarcodeProductResult;
