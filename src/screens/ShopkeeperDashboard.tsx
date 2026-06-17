import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import GlassHeader from '../components/GlassHeader';
import PillBottomBar from '../components/PillBottomBar';
import PillNavItem from '../components/PillNavItem';
import Toast from '../components/Toast';
import TopBar from '../components/TopBar';
import { AppContext } from '../context/AppContext';
import { database } from '../services/firebase';
import { UserData } from '../types';
import { DEFAULT_SHOP_LOGO } from '../utils/constants';
import { rfs, scale } from '../utils/scaling';
import { ACCENT_BLUE, BG_DARK, BOTTOM_TAB_H, globalStyles as styles, TEXT_MUTED, TEXT_WHITE } from '../utils/theme';
import { useToast } from '../utils/useToast';
import AddProductForm from './AddProductForm';
import BillingSection from './BillingSection';
import ViewProductsList from './ViewProductsList';

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
      <StatusBar barStyle="dark-content" backgroundColor={BG_DARK} />
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
