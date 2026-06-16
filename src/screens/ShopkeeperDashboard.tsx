import { AppContext } from '../context/AppContext';
import { useToast } from '../utils/useToast';
import { StatusBar } from 'react-native';
import AddProductForm from './AddProductForm';
import ViewProductsList from './ViewProductsList';
import BillingSection from './BillingSection';
import Toast from '../components/Toast';
import TopBar from '../components/TopBar';
import GlassHeader from '../components/GlassHeader';
import PillBottomBar from '../components/PillBottomBar';
import PillNavItem from '../components/PillNavItem';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
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

export default ShopkeeperDashboard;
