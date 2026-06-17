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

const ContactBtn = ({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) => {
  const sc = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale: sc }], flex: 1 }}>
      <TouchableOpacity style={[styles.contactBtn, { backgroundColor: color }]} onPress={onPress}
        onPressIn={() => Animated.spring(sc, { toValue: 0.93, useNativeDriver: true, speed: 30 }).start()}
        onPressOut={() => Animated.spring(sc, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start()}
        activeOpacity={1}>
        <Ionicons name={icon as any} size={rfs(14)} color="white" />
        <Text style={styles.contactBtnText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Shop Card ─────────────────────────────────────────────────────────

export default ContactBtn;
