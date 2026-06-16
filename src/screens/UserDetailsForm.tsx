import { AppContext } from '../context/AppContext';
import { pickPhoto } from '../utils/photoPicker';
import { StatusBar } from 'react-native';
import LocationPicker from '../components/LocationPicker';
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

const UserDetailsForm = ({ navigation }: any) => {
  const { currentUser, setCurrentRole } = React.useContext(AppContext);
  const [fullName, setFullName] = useState(""); const [age, setAge] = useState("");
  const [gender, setGender] = useState(""); const [phone, setPhone] = useState("");
  const [location, setLocation] = useState(""); const [locCoords, setLocCoords] = useState<LatLng | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null); const [photoSaving, setPhotoSaving] = useState(false);

  const handlePickPhoto = () => pickPhoto(async (b64) => {
    setUserPhoto(b64);
    if (currentUser) { setPhotoSaving(true); try { await database().ref(`users/${currentUser.uid}`).update({ photoURL: b64 }); } catch { } setPhotoSaving(false); }
  });

  const handleSave = async () => {
    if (!fullName.trim()) { Alert.alert("Error", "Name is required"); return; }
    const updates: any = { fullName: fullName.trim(), age, gender, phone, location, photoURL: userPhoto || DEFAULT_AVATAR, role: "user" };
    if (locCoords) { updates.latitude = locCoords.latitude; updates.longitude = locCoords.longitude; }
    await database().ref(`users/${currentUser!.uid}`).update(updates);
    setCurrentRole("user"); navigation.replace("UserDashboard");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG_DARK }} behavior="padding">
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>👤 Your Profile</Text>
          <Text style={styles.formSub}>Tell us a bit about yourself</Text>
          <TouchableOpacity style={styles.avatarPicker} onPress={handlePickPhoto}>
            {userPhoto ? <Image source={{ uri: userPhoto }} style={styles.avatarPickerImg} />
              : <View style={styles.photoPlaceholder}><View style={styles.cameraCircle}><Ionicons name="camera" size={rfs(24)} color={ACCENT_BLUE} /></View><Text style={styles.photoHint}>Add photo</Text></View>}
            {photoSaving && <View style={styles.photoOverlay}><ActivityIndicator color="white" /></View>}
          </TouchableOpacity>
          <Text style={styles.label}>Full name *</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} returnKeyType="next" placeholder="Your name" placeholderTextColor={TEXT_DIM} />
          <Text style={styles.label}>Age</Text>
          <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" returnKeyType="next" placeholder="e.g. 25" placeholderTextColor={TEXT_DIM} />
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {["Male", "Female", "Other"].map((g) => (
              <TouchableOpacity key={g} style={[styles.genderBtn, gender === g && styles.genderBtnActive]} onPress={() => setGender(g)}>
                <Text style={[styles.genderText, gender === g && { color: "white" }]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" returnKeyType="next" placeholder="+91 00000 00000" placeholderTextColor={TEXT_DIM} />
          <LocationPicker value={location} onChange={setLocation} onCoordsChange={(lat, lng) => setLocCoords({ latitude: lat, longitude: lng })} />
          <TouchableOpacity style={styles.pillBtn} onPress={handleSave}>
            <Ionicons name="arrow-forward-circle-outline" size={rfs(19)} color="white" />
            <Text style={styles.pillBtnText}> Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── FIX 2: Add Product (with barcode number field + inline barcode scanner) ──

export default UserDetailsForm;
