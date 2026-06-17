import SkeletonBox from './SkeletonBox';
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

const ShopCardSkeleton = () => (
  <View style={[styles.shopCard, { padding: scale(16) }]}>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <SkeletonBox w={scale(72)} h={scale(72)} r={scale(22)} />
      <View style={{ flex: 1, marginLeft: scale(14), gap: scale(10) }}>
        <SkeletonBox w="65%" h={scale(16)} r={8} />
        <SkeletonBox w="40%" h={scale(12)} r={8} />
        <SkeletonBox w="50%" h={scale(10)} r={8} />
      </View>
    </View>
  </View>
);

// ── Contact Button ────────────────────────────────────────────────────

export default ShopCardSkeleton;
