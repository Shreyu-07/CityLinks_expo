import FloatingBubbles from './FloatingBubbles';
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

const GlassHeader = ({ children, extraPad = 0 }: { children: React.ReactNode; extraPad?: number }) => (
  <View style={[styles.glassHeader, { paddingBottom: scale(40) + extraPad }]}>
    <View style={[StyleSheet.absoluteFill, { backgroundColor: BG_DARK }]} />
    <View style={{ position: "absolute", top: -scale(60), right: -scale(30), width: scale(220), height: scale(220), borderRadius: scale(110), backgroundColor: "rgba(99,102,241,0.15)" }} />
    <View style={{ position: "absolute", top: scale(40), left: -scale(50), width: scale(160), height: scale(160), borderRadius: scale(80), backgroundColor: "rgba(59,130,246,0.1)" }} />
    <FloatingBubbles count={6} />
    {children}
    <View style={styles.headerWaveBottom} />
  </View>
);

// ── Error Banner ──────────────────────────────────────────────────────

export default GlassHeader;
