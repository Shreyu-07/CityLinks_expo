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

const PillNavItem = ({ icon, label, active, onPress, badge, showLabel }: any) => {
  const sc = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity style={[styles.pillNavItem, active && styles.pillNavItemActive]} onPress={onPress}
      onPressIn={() => Animated.spring(sc, { toValue: 0.9, useNativeDriver: true, speed: 30 }).start()}
      onPressOut={() => Animated.spring(sc, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }).start()}
      hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}>
      <Animated.View style={{ transform: [{ scale: sc }], alignItems: "center" }}>
        <View style={{ position: "relative" }}>
          <Ionicons name={icon} size={rfs(22)} color={active ? "white" : TEXT_DIM} />
          {badge > 0 && (
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>{badge > 9 ? "9+" : badge}</Text>
            </View>
          )}
        </View>
        {(active || showLabel) && <Text style={[styles.pillNavLabel, !active && { color: TEXT_DIM }]}>{label}</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ── FIX 3: Barcode Product Lookup ─────────────────────────────────────
// Searches all products in Firebase by barcodeNumber and shows result

export default PillNavItem;
