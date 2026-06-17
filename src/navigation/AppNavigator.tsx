import { createStackNavigator } from '@react-navigation/stack';
const Stack = createStackNavigator();
import { AppContext } from '../context/AppContext';
import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import AppNavigatorInner from './AppNavigatorInner';
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

const AppNavigator = () => {
  const { currentUser, setCurrentUser, setCurrentRole } = React.useContext(AppContext);
  const [splashVisible, setSplashVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        const s = await database().ref(`users/${user.uid}`).once("value");
        setCurrentRole(s.val()?.role || null);
      } else { setCurrentRole(null); }
      setIsLoading(false);
    });
    return unsub;
  }, []);

  if (splashVisible) return <SplashScreen onFinish={() => setSplashVisible(false)} />;
  if (isLoading) return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={ACCENT_BLUE} /></View>;
  if (!currentUser) return (
    <Stack.Navigator id="AuthNavigator" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
  return <AppNavigatorInner currentUser={currentUser} />;
};

// ── Root ──────────────────────────────────────────────────────────────

export default AppNavigator;
