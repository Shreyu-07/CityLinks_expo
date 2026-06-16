export interface BubbleConfig { id: number; size: number; left: number; duration: number; delay: number; }
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

const SingleBubble = ({ config }: { config: BubbleConfig }) => {
  const translateY = useRef(new Animated.Value(SCREEN_H + 60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animate = () => {
      translateY.setValue(SCREEN_H + 60); opacity.setValue(0);
      Animated.sequence([
        Animated.delay(config.delay),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -80, duration: config.duration, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: Math.random() * 0.4 + 0.1, duration: 1200, useNativeDriver: true }),
            Animated.delay(config.duration - 2400),
            Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", left: `${config.left}%` as any, width: config.size, height: config.size, borderRadius: config.size / 2, borderWidth: 1, borderColor: `rgba(99,102,241,0.4)`, backgroundColor: `rgba(59,130,246,0.06)`, transform: [{ translateY }], opacity }} />
  );
};


export default SingleBubble;
