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

const ErrorBanner = ({ title, message, onDismiss, style }: any) => (
  <View style={[styles.errorBanner, style]}>
    <View style={styles.errorIcon}><Ionicons name="warning" size={rfs(17)} color="#fff" /></View>
    <View style={{ flex: 1 }}>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMsg}>{message}</Text>
    </View>
    <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
      <Ionicons name="close-circle" size={rfs(20)} color="#f87171" />
    </TouchableOpacity>
  </View>
);

// ── Password Input ────────────────────────────────────────────────────

export default ErrorBanner;
