export interface ToastProps { message: string; type?: 'success' | 'info' | 'error' | 'warning'; visible: boolean; }
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

const Toast = ({ message, type = "info", visible }: ToastProps) => {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 9 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);
  const bgColor = type === "success" ? SUCCESS : type === "error" ? "#ef4444" : type === "warning" ? ACCENT_AMBER : ACCENT_BLUE;
  const icon = type === "success" ? "checkmark-circle" : type === "error" ? "close-circle" : type === "warning" ? "warning" : "information-circle";
  return (
    <Animated.View style={[styles.toast, { backgroundColor: bgColor, transform: [{ translateY }], opacity }]} pointerEvents="none">
      <Ionicons name={icon as any} size={rfs(18)} color="white" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const useToast = () => {
  const [toastState, setToastState] = useState<{ message: string; type: "success" | "info" | "error" | "warning"; visible: boolean }>({ message: "", type: "info", visible: false });
  const timerRef = useRef<any>(null);
  const showToast = useCallback((message: string, type: "success" | "info" | "error" | "warning" = "info", duration = 2500) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToastState({ message, type, visible: true });
    timerRef.current = setTimeout(() => setToastState(p => ({ ...p, visible: false })), duration);
  }, []);
  return { toastState, showToast };
};


export default Toast;
