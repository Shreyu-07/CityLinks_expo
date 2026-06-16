import { AppContext } from '../context/AppContext';
import { useToast } from '../utils/useToast';
import Toast from '../components/Toast';
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

export default ViewProductsList;
