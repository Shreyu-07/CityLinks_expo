import { GlobalStore } from '../utils/store';
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

const LocationPicker = ({ value, onChange, onCoordsChange, label = "Location / Area" }: { value: string; onChange: (v: string) => void; onCoordsChange?: (lat: number, lng: number) => void; label?: string }) => {
  const [detecting, setDetecting] = useState(false);
  const handleAutoDetect = async () => {
    setDetecting(true);
    try {
      const granted = await requestLocationPermission();
      if (!granted) { Alert.alert("Permission denied", "Allow location access in settings."); return; }
      const { latitude, longitude, cityName } = await getCurrentLocation();
      if (cityName) onChange(cityName);
      if (onCoordsChange) onCoordsChange(latitude, longitude);
      GlobalStore.userLocation = { latitude, longitude };
    } catch { Alert.alert("Location Error", "Could not detect location."); }
    finally { setDetecting(false); }
  };
  return (
    <View style={{ marginBottom: scale(4) }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.locationPickerWrap}>
        <TextInput style={styles.locationInput} value={value} onChangeText={onChange} placeholder="City / Area (e.g. Mysore)" placeholderTextColor={TEXT_DIM} returnKeyType="done" />
        <TouchableOpacity style={[styles.locationDetectBtn, detecting && { opacity: 0.6 }]} onPress={handleAutoDetect} disabled={detecting}>
          {detecting ? <ActivityIndicator size="small" color="white" /> : <><Ionicons name="locate" size={rfs(13)} color="white" /><Text style={styles.locationDetectText}>Auto</Text></>}
        </TouchableOpacity>
      </View>
      <Text style={styles.hintText}>Tap "Auto" to detect or type manually</Text>
    </View>
  );
};

// ── Pill Bottom Nav ─────────────────────────────────────────────────

export default LocationPicker;
