const fs = require('fs');

const code = fs.readFileSync('App.tsx', 'utf-8');
const lines = code.split('\n');

function extract(name, startLine, endLine, folder) {
  const content = lines.slice(startLine, endLine + 1).join('\n');
  const imports = `import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { SHOP_CATEGORIES, DEFAULT_AVATAR, DEFAULT_SHOP_LOGO } from '../utils/constants';\n\n`;

  fs.writeFileSync(`src/${folder}/${name}.tsx`, imports + content + `\n\nexport default ${name};\n`);
  console.log(`Extracted ${name} to src/${folder}/${name}.tsx`);
}

const comps = [
  { name: 'Toast', start: 552, end: 588, folder: 'components' },
  { name: 'SingleBubble', start: 635, end: 659, folder: 'components' },
  { name: 'FloatingBubbles', start: 660, end: 669, folder: 'components' },
  { name: 'SkeletonBox', start: 670, end: 680, folder: 'components' },
  { name: 'ShopCardSkeleton', start: 681, end: 694, folder: 'components' },
  { name: 'ContactBtn', start: 695, end: 710, folder: 'components' },
  { name: 'AnimatedShopCard', start: 711, end: 772, folder: 'components' },
  { name: 'TopBar', start: 773, end: 801, folder: 'components' },
  { name: 'GlassHeader', start: 802, end: 813, folder: 'components' },
  { name: 'ErrorBanner', start: 814, end: 827, folder: 'components' },
  { name: 'PasswordInput', start: 828, end: 837, folder: 'components' },
  { name: 'LocationPicker', start: 838, end: 866, folder: 'components' },
  { name: 'PillBottomBar', start: 867, end: 881, folder: 'components' },
  { name: 'PillNavItem', start: 882, end: 905, folder: 'components' },
  { name: 'BarcodeProductResult', start: 906, end: 1037, folder: 'components' },
  { name: 'BarcodeScannerModal', start: 1038, end: 1159, folder: 'components' },
  { name: 'FullImageViewer', start: 1160, end: 1172, folder: 'components' },
  { name: 'SplashScreen', start: 1173, end: 1215, folder: 'screens' },
  { name: 'AuthScreen', start: 1216, end: 1321, folder: 'screens' },
  { name: 'ShopkeeperDetailsForm', start: 1322, end: 1419, folder: 'screens' },
  { name: 'UserDetailsForm', start: 1420, end: 1477, folder: 'screens' },
  { name: 'AddProductForm', start: 1478, end: 1615, folder: 'screens' },
  { name: 'ViewProductsList', start: 1616, end: 1672, folder: 'screens' },
  { name: 'EditProductForm', start: 1673, end: 1759, folder: 'screens' },
  { name: 'ShopkeeperDashboard', start: 1760, end: 1842, folder: 'screens' },
  { name: 'BillingSection', start: 1843, end: 1997, folder: 'screens' },
  { name: 'UserDashboard', start: 1998, end: 2232, folder: 'screens' },
  { name: 'ShopProducts', start: 2233, end: 2370, folder: 'screens' },
  { name: 'ProductDetail', start: 2371, end: 2550, folder: 'screens' },
  { name: 'CartScreen', start: 2551, end: 2634, folder: 'screens' },
  { name: 'ProfileScreen', start: 2643, end: 2762, folder: 'screens' },
  { name: 'EditProfileScreen', start: 2763, end: 2893, folder: 'screens' },
  { name: 'ChangePasswordScreen', start: 2894, end: 2979, folder: 'screens' },
  { name: 'ForgotPasswordScreen', start: 2980, end: 3242, folder: 'screens' },
  { name: 'AppNavigatorInner', start: 3243, end: 3274, folder: 'navigation' },
  { name: 'AppNavigator', start: 3275, end: 3303, folder: 'navigation' },
];

comps.forEach(c => extract(c.name, c.start, c.end, c.folder));

