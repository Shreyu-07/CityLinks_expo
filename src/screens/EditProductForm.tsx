import { useToast } from '../utils/useToast';
import { pickPhoto } from '../utils/photoPicker';
import Toast from '../components/Toast';
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

const EditProductForm = ({ route, navigation }: any) => {
  const { productId, productData } = route.params;
  const [name, setName] = useState(productData.name || ""); const [quantity, setQuantity] = useState(productData.quantity || "");
  const [price, setPrice] = useState(productData.price || ""); const [note, setNote] = useState(productData.note || "");
  const [photo, setPhoto] = useState(productData.photo || ""); const [photoSaving, setPhotoSaving] = useState(false);
  const [barcodeNumber, setBarcodeNumber] = useState(productData.barcodeNumber || ""); // FIX 2
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false); // FIX 2
  const { toastState, showToast } = useToast();

  const handlePickPhoto = () => pickPhoto(async (b64) => {
    setPhoto(b64); setPhotoSaving(true);
    try { await database().ref(`products/${productId}`).update({ photo: b64 }); } catch { }
    setPhotoSaving(false);
  });

  const handleUpdate = async () => {
    await database().ref(`products/${productId}`).update({
      name, quantity, price, note, photo,
      barcodeNumber: barcodeNumber.trim() || null, // FIX 2: save barcode on edit
    });
    showToast("✅ Product updated!", "success");
    setTimeout(() => navigation.goBack(), 1000);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG_DARK }} behavior="padding">
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />

      {/* FIX 2: capture-mode barcode scanner for edit */}
      <BarcodeScannerModal
        visible={barcodeScannerVisible}
        onClose={() => setBarcodeScannerVisible(false)}
        mode="capture"
        onScanned={(data) => {
          setBarcodeNumber(data);
          setBarcodeScannerVisible(false);
          showToast(`📦 Barcode: ${data}`, "success");
        }}
      />

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>✏️ Edit Product</Text>
          <TouchableOpacity style={styles.productPhotoPicker} onPress={handlePickPhoto}>
            {photo ? <Image source={{ uri: photo }} style={styles.productPhotoImg} /> : <View style={styles.photoPlaceholder}><View style={styles.cameraCircle}><Ionicons name="camera" size={rfs(22)} color={ACCENT_BLUE} /></View></View>}
            {photoSaving && <View style={styles.photoOverlay}><ActivityIndicator color="white" /></View>}
          </TouchableOpacity>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} returnKeyType="next" />
          <View style={styles.row2}>
            <View style={{ flex: 1, marginRight: scale(8) }}><Text style={styles.label}>Quantity</Text><TextInput style={styles.input} value={quantity} onChangeText={setQuantity} /></View>
            <View style={{ flex: 1 }}><Text style={styles.label}>Price (₹)</Text><TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" /></View>
          </View>

          {/* FIX 2: Barcode field in Edit */}
          <Text style={styles.label}>Barcode Number</Text>
          <View style={styles.barcodeInputRow}>
            <TextInput
              style={styles.barcodeInput}
              value={barcodeNumber}
              onChangeText={setBarcodeNumber}
              placeholder="Enter or scan barcode"
              placeholderTextColor={TEXT_DIM}
            />
            <TouchableOpacity style={styles.barcodeScanBtn} onPress={() => setBarcodeScannerVisible(true)}>
              <Ionicons name="barcode-outline" size={rfs(22)} color="white" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Note</Text>
          <TextInput style={[styles.input, styles.textArea]} multiline value={note} onChangeText={setNote} />
          <View style={styles.formActions}>
            <TouchableOpacity style={[styles.pillBtn, styles.pillBtnOutline, { flex: 0.4 }]} onPress={() => navigation.goBack()}>
              <Text style={[styles.pillBtnText, { color: ACCENT_BLUE }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pillBtn, { flex: 1 }]} onPress={handleUpdate}>
              <Ionicons name="save-outline" size={rfs(19)} color="white" />
              <Text style={styles.pillBtnText}> Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── Shopkeeper Dashboard ──────────────────────────────────────────────

export default EditProductForm;
