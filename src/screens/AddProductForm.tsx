import { AppContext } from '../context/AppContext';
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

const AddProductForm = () => {
  const { currentUser, tempProdPhoto, setTempProdPhoto } = React.useContext(AppContext);
  const [name, setName] = useState(""); const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState(""); const [note, setNote] = useState("");
  const [category, setCategory] = useState(""); const [catModal, setCatModal] = useState(false);
  const [barcodeNumber, setBarcodeNumber] = useState(""); // FIX 2: barcode state
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false); // FIX 2: scanner for capture
  const [publishing, setPublishing] = useState(false);
  const { toastState, showToast } = useToast();

  const handleCancel = () => {
    setName(""); setQuantity(""); setPrice(""); setNote(""); setCategory("");
    setBarcodeNumber(""); setTempProdPhoto(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { showToast("Product name required", "error"); return; }
    if (publishing) return;
    setPublishing(true);
    try {
      const prodId = database().ref("products").push().key;
      await database().ref(`products/${prodId}`).set({
        shopId: currentUser!.uid,
        name: name.trim(),
        quantity,
        price,
        photo: tempProdPhoto || "",
        note,
        category: category || undefined,
        barcodeNumber: barcodeNumber.trim() || undefined, // FIX 2: save barcode
        timestamp: Date.now(),
      });
      showToast("✅ Product added!", "success");
      handleCancel();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setPublishing(false); }
  };

  return (
    <View style={[styles.formCard, { margin: scale(16) }]}>
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />

      {/* FIX 2: Barcode Scanner Modal in capture mode */}
      <BarcodeScannerModal
        visible={barcodeScannerVisible}
        onClose={() => setBarcodeScannerVisible(false)}
        mode="capture"
        onScanned={(data) => {
          setBarcodeNumber(data);
          setBarcodeScannerVisible(false);
          showToast(`📦 Barcode captured: ${data}`, "success");
        }}
      />

      <Text style={styles.formTitle}>📦 New Product</Text>
      <TouchableOpacity style={styles.productPhotoPicker} onPress={() => pickPhoto((b64) => setTempProdPhoto(b64))}>
        {tempProdPhoto ? <Image source={{ uri: tempProdPhoto }} style={styles.productPhotoImg} />
          : <View style={styles.photoPlaceholder}><View style={styles.cameraCircle}><Ionicons name="camera" size={rfs(22)} color={ACCENT_BLUE} /></View><Text style={styles.photoHint}>Add photo</Text></View>}
      </TouchableOpacity>
      <Text style={styles.label}>Product name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Fresh Apples" placeholderTextColor={TEXT_DIM} returnKeyType="next" />
      <View style={styles.row2}>
        <View style={{ flex: 1, marginRight: scale(8) }}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="1 kg, 2 pcs" placeholderTextColor={TEXT_DIM} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Price (₹)</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="99" placeholderTextColor={TEXT_DIM} />
        </View>
      </View>

      {/* ── FIX 2: Barcode Number Field with Scanner Button ── */}
      <Text style={styles.label}>Barcode Number</Text>
      <View style={styles.barcodeInputRow}>
        <TextInput
          style={styles.barcodeInput}
          value={barcodeNumber}
          onChangeText={setBarcodeNumber}
          placeholder="Enter or scan barcode"
          placeholderTextColor={TEXT_DIM}
          returnKeyType="next"
          keyboardType="default"
        />
        <TouchableOpacity
          style={styles.barcodeScanBtn}
          onPress={() => setBarcodeScannerVisible(true)}
        >
          <Ionicons name="barcode-outline" size={rfs(22)} color="white" />
        </TouchableOpacity>
      </View>
      {barcodeNumber ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6), marginBottom: scale(10), marginTop: -scale(4) }}>
          <Ionicons name="checkmark-circle" size={rfs(13)} color={SUCCESS} />
          <Text style={{ color: SUCCESS, fontSize: rfs(11), fontWeight: "600" }}>Barcode: {barcodeNumber}</Text>
          <TouchableOpacity onPress={() => setBarcodeNumber("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle-outline" size={rfs(14)} color={TEXT_DIM} />
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.label}>Category</Text>
      <TouchableOpacity style={styles.picker} onPress={() => setCatModal(true)}>
        <Text style={[styles.pickerText, !category && { color: TEXT_DIM }]}>{category || "Select category (optional)"}</Text>
        <Ionicons name="chevron-down" size={rfs(17)} color={ACCENT_BLUE} />
      </TouchableOpacity>
      <Text style={styles.label}>Note</Text>
      <TextInput style={[styles.input, styles.textArea]} multiline value={note} onChangeText={setNote} placeholder="Optional note" placeholderTextColor={TEXT_DIM} />
      <View style={styles.formActions}>
        {(name || quantity || price || category || barcodeNumber || tempProdPhoto) && (
          <TouchableOpacity style={[styles.pillBtn, styles.pillBtnOutline, { flex: 0.4 }]} onPress={handleCancel}>
            <Text style={[styles.pillBtnText, { color: ACCENT_BLUE }]}>Clear</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.pillBtn, { flex: 1 }, publishing && { opacity: 0.8 }]} onPress={handleSubmit} disabled={publishing}>
          {publishing ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="rocket-outline" size={rfs(19)} color="white" />}
          <Text style={styles.pillBtnText}> {publishing ? "Adding…" : "Publish"}</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={catModal} transparent animationType="slide" onRequestClose={() => setCatModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCatModal(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Product category</Text>
            <FlatList data={SHOP_CATEGORIES} keyExtractor={(i) => i} renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => { setCategory(item); setCatModal(false); }}>
                <Text style={styles.modalItemText}>{item}</Text>
                {category === item && <Ionicons name="checkmark-circle" size={rfs(19)} color={ACCENT_BLUE} />}
              </TouchableOpacity>
            )} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ── View Products ─────────────────────────────────────────────────────

export default AddProductForm;
