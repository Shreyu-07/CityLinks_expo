import { handleCall, handleWhatsApp } from '../utils/contactHelpers';
import ContactBtn from './ContactBtn';
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

const AnimatedShopCard = ({ shopId, shop, onPress, index, distanceKm }: { shopId: string; shop: UserData; onPress: () => void; index: number; distanceKm?: number }) => {
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const sc = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 400, delay: Math.min(index * 60, 360), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: Math.min(index * 60, 360), useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ translateY }, { scale: sc }], opacity }}>
      <View style={styles.shopCard}>
        <TouchableOpacity style={styles.shopCardTop} onPress={onPress}
          onPressIn={() => Animated.spring(sc, { toValue: 0.975, useNativeDriver: true, speed: 30 }).start()}
          onPressOut={() => Animated.spring(sc, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start()}
          activeOpacity={1}>
          <View style={styles.shopImgWrap}>
            <Image source={{ uri: shop.shopPhoto || shop.photoURL || DEFAULT_SHOP_LOGO }} style={styles.shopCardImg} />
            <View style={styles.shopOnlineDot} />
          </View>
          <View style={styles.shopCardBody}>
            <Text style={styles.shopCardName} numberOfLines={1}>{shop.shopName || shop.fullName}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: scale(5), marginTop: 4 }}>
              <View style={styles.typePill}>
                <Text style={styles.typePillText} numberOfLines={1}>{shop.type || shop.skillType || shop.vehicleType || "General"}</Text>
              </View>
              {distanceKm !== undefined && (
                <View style={styles.distancePill}>
                  <Ionicons name="navigate" size={rfs(9)} color={ACCENT_CYAN} />
                  <Text style={styles.distancePillText}>{formatDistance(distanceKm)}</Text>
                </View>
              )}
            </View>
            {shop.note ? <Text style={styles.shopCardNote} numberOfLines={1}>🎉 {shop.note}</Text> : null}
            {shop.location ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={rfs(10)} color={TEXT_DIM} />
                <Text style={styles.shopLocationText} numberOfLines={1}>{shop.location}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.shopCardArrow}>
            <Ionicons name="chevron-forward" size={rfs(14)} color={ACCENT_BLUE} />
          </View>
        </TouchableOpacity>
        {shop.phone && (
          <>
            <View style={styles.contactDivider} />
            <View style={styles.contactRow}>
              <ContactBtn icon="call" label="Call" color={ACCENT_BLUE} onPress={() => handleCall(shop.phone!)} />
              <View style={{ width: scale(8) }} />
              <ContactBtn icon="logo-whatsapp" label="WhatsApp" color={WHATSAPP_GREEN} onPress={() => handleWhatsApp(shop.phone!)} />
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
};

// ── Top Bar ───────────────────────────────────────────────────────────

export default AnimatedShopCard;
