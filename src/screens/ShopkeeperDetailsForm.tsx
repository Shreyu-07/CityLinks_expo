import { AppContext } from '../context/AppContext';
import { pickPhoto } from '../utils/photoPicker';
import { StatusBar } from 'react-native';
import LocationPicker from '../components/LocationPicker';
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

export default ShopkeeperDetailsForm;
