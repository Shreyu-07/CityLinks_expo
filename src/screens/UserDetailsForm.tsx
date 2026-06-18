import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LocationPicker from '../components/LocationPicker';
import { AppContext } from '../context/AppContext';
import { database } from '../services/firebase';
import { LatLng } from '../types';
import { DEFAULT_AVATAR } from '../utils/constants';
import { pickPhoto } from '../utils/photoPicker';
import { rfs } from '../utils/scaling';
import { ACCENT_BLUE, BG_DARK, globalStyles as styles, TEXT_DIM } from '../utils/theme';

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
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
