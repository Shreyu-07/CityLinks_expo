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

const PasswordInput = ({ value, onChange, placeholder, show, setShow, returnKeyType, onSubmit }: any) => (
  <View style={styles.pwWrap}>
    <TextInput style={styles.pwInput} placeholder={placeholder} placeholderTextColor={TEXT_DIM} secureTextEntry={!show} value={value} onChangeText={onChange} returnKeyType={returnKeyType || "next"} blurOnSubmit={returnKeyType === "done"} onSubmitEditing={onSubmit} />
    <TouchableOpacity style={styles.pwEye} onPress={() => setShow(!show)} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
      <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={rfs(20)} color={ACCENT_BLUE} />
    </TouchableOpacity>
  </View>
);

// ── Location Picker ───────────────────────────────────────────────────

export default PasswordInput;
