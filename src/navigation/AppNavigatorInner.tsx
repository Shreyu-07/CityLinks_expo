import { createStackNavigator } from '@react-navigation/stack';
const Stack = createStackNavigator();
import AuthScreen from '../screens/AuthScreen';
import ShopkeeperDetailsForm from '../screens/ShopkeeperDetailsForm';
import UserDetailsForm from '../screens/UserDetailsForm';
import ShopkeeperDashboard from '../screens/ShopkeeperDashboard';
import UserDashboard from '../screens/UserDashboard';
import ShopProducts from '../screens/ShopProducts';
import ProductDetail from '../screens/ProductDetail';
import EditProductForm from '../screens/EditProductForm';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import CartScreen from '../screens/CartScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
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

const AppNavigatorInner = React.memo(({ currentUser }: { currentUser: any }) => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  useEffect(() => {
    database().ref(`users/${currentUser.uid}`).once("value").then((s) => {
      const d = s.val() || {};
      if (d.role === "shopkeeper" && !d.shopName) setInitialRoute("ShopkeeperDetails");
      else if (d.role === "user" && !d.fullName) setInitialRoute("UserDetails");
      else if (d.role === "shopkeeper") setInitialRoute("ShopkeeperDashboard");
      else if (d.role === "user") setInitialRoute("UserDashboard");
      else setInitialRoute("Auth");
    });
  }, []);
  if (!initialRoute) return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={ACCENT_BLUE} /></View>;
  return (
    <Stack.Navigator id="MainNavigator" initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="ShopkeeperDetails" component={ShopkeeperDetailsForm} />
      <Stack.Screen name="UserDetails" component={UserDetailsForm} />
      <Stack.Screen name="ShopkeeperDashboard" component={ShopkeeperDashboard} />
      <Stack.Screen name="UserDashboard" component={UserDashboard} />
      <Stack.Screen name="ShopProducts" component={ShopProducts} />
      <Stack.Screen name="ProductDetail" component={ProductDetail} />
      <Stack.Screen name="EditProduct" component={EditProductForm} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
});


export default AppNavigatorInner;
