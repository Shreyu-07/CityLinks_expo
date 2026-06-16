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

const TopBar = ({ title, showBranding, onBarcodePress, onProfilePress, avatarUri, leftContent, rightContent }: {
  title?: string; showBranding?: boolean; onBarcodePress?: () => void;
  onProfilePress?: () => void; avatarUri?: string;
  leftContent?: React.ReactNode; rightContent?: React.ReactNode;
}) => (
  <View style={styles.topBar}>
    <View style={styles.topBarLeft}>
      {leftContent ?? (showBranding ? <Text style={styles.brandText}>CityLinks</Text> : <Text style={styles.topBarTitle} numberOfLines={1}>{title}</Text>)}
    </View>
    <View style={styles.topBarRight}>
      {rightContent ?? (
        <>
          {onBarcodePress && (
            <TouchableOpacity style={styles.topBarIconBtn} onPress={onBarcodePress}>
              <Ionicons name="barcode-outline" size={rfs(22)} color={TEXT_WHITE} />
            </TouchableOpacity>
          )}
          {onProfilePress && (
            <TouchableOpacity onPress={onProfilePress}>
              <Image source={{ uri: avatarUri || DEFAULT_AVATAR }} style={styles.topBarAvatar} />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  </View>
);

// ── Glass Header ──────────────────────────────────────────────────────

export default TopBar;
