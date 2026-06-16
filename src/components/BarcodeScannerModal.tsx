import { CameraView, useCameraPermissions } from 'expo-camera';
import BarcodeProductResult from './BarcodeProductResult';
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

const BarcodeScannerModal = ({
  visible, onClose, onScanned, mode = "lookup", navigation
}: {
  visible: boolean;
  onClose: () => void;
  onScanned: (data: string) => void;
  mode?: "lookup" | "capture";
  navigation?: any;
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const hasPermission = permission?.granted ?? null;

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setScannedData(null);
      if (!permission?.granted) {
        requestPermission();
      }
    }
  }, [visible]);

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    if (mode === "capture") {
      // In capture mode, immediately return the barcode and close
      onScanned(data);
    } else {
      // In lookup mode, show the product info inside the modal
      setScannedData(data);
      onScanned(data);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: BG_DARK }}>
        <View style={[styles.topBar, { backgroundColor: BG_DARK, paddingTop: STATUS_BAR_H + scale(10), paddingBottom: scale(14) }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.topBarIconBtn}>
            <Ionicons name="close" size={rfs(20)} color={TEXT_WHITE} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>
            {mode === "capture" ? "Scan Product Barcode" : "Barcode Scanner"}
          </Text>
          <View style={{ width: scale(40) }} />
        </View>

        {hasPermission === null && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={ACCENT_BLUE} />
            <Text style={[styles.emptyText, { marginTop: scale(12) }]}>Requesting camera permission…</Text>
          </View>
        )}

        {hasPermission === false && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: scale(32) }}>
            <Ionicons name="camera-outline" size={scale(60)} color={TEXT_DIM} />
            <Text style={[styles.emptyText, { marginTop: scale(16), textAlign: "center" }]}>Camera permission denied. Enable it in device settings.</Text>
          </View>
        )}

        {hasPermission && (
          <View style={{ flex: 1 }}>
            {/* Camera always visible at top */}
            <View style={{ height: SCREEN_H * 0.45, position: "relative" }}>
              <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
                barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_a", "upc_e"] }}
              />
              {/* Overlay frame */}
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} pointerEvents="none">
                <View style={styles.scannerFrame}>
                  <View style={[styles.scannerCorner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
                  <View style={[styles.scannerCorner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
                  <View style={[styles.scannerCorner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
                  <View style={[styles.scannerCorner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
                </View>
                <Text style={{ color: TEXT_MUTED, marginTop: scale(18), fontSize: rfs(13), textAlign: "center" }}>
                  {scanned ? "✅ Barcode captured!" : "Align barcode within the frame"}
                </Text>
              </View>
            </View>

            {/* Result area (FIX 3: show product details in lookup mode) */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: scale(30) }}>
              {!scanned && (
                <View style={{ alignItems: "center", paddingVertical: scale(28), gap: scale(8) }}>
                  <Ionicons name="scan-outline" size={scale(38)} color={TEXT_DIM} />
                  <Text style={{ color: TEXT_MUTED, fontSize: rfs(13) }}>Point camera at a barcode</Text>
                </View>
              )}

              {scanned && scannedData && mode === "lookup" && (
                <BarcodeProductResult
                  barcodeData={scannedData}
                  navigation={navigation}
                  onClose={() => { setScanned(false); setScannedData(null); onClose(); }}
                />
              )}

              {scanned && (
                <TouchableOpacity
                  style={[styles.pillBtn, styles.pillBtnOutline, { marginHorizontal: scale(16), marginTop: scale(8) }]}
                  onPress={() => { setScanned(false); setScannedData(null); }}
                >
                  <Ionicons name="refresh-outline" size={rfs(16)} color={ACCENT_BLUE} />
                  <Text style={[styles.pillBtnText, { color: ACCENT_BLUE }]}> Scan Again</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
};

// ── Full Image Viewer ─────────────────────────────────────────────────

export default BarcodeScannerModal;
