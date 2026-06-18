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

const LaborDetailsForm = ({ navigation }: any) => {
  const { currentUser, setCurrentRole } = React.useContext(AppContext);
  const [fullName, setFullName] = useState("");
  const [skillType, setSkillType] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [about, setAbout] = useState("");
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);

  const handlePickPhoto = () => pickPhoto(async (b64) => {
    setPhoto(b64);
    if (currentUser) { setPhotoSaving(true); try { await database().ref(`users/${currentUser.uid}`).update({ photoURL: b64 }); } catch { } setPhotoSaving(false); }
  });

  const handleSave = async () => {
    if (!fullName.trim() || !skillType.trim() || !phone.trim() || !location.trim()) { Alert.alert("Error", "Please fill all required fields"); return; }
    setSaving(true);
    try {
      const updates: any = {
        fullName: fullName.trim(), photoURL: photo || DEFAULT_AVATAR,
        skillType: skillType.trim(), hourlyRate: hourlyRate.trim(), about,
        role: "labor", phone: phone.trim(), location: location.trim(),
      };
      if (coords) { updates.latitude = coords.latitude; updates.longitude = coords.longitude; }
      await database().ref(`users/${currentUser!.uid}`).update(updates);
      setCurrentRole("labor"); navigation.replace("LaborDashboard");
    } catch (e: any) { Alert.alert("Error", e.message); }
    finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG_DARK }} behavior="padding">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>🛠️ Labor Profile</Text>
          <Text style={styles.formSub}>Set up your profile to find work</Text>
          <TouchableOpacity style={styles.shopPhotoPickerLarge} onPress={handlePickPhoto}>
            {photo ? <Image source={{ uri: photo }} style={styles.shopPhotoImg} />
              : <View style={styles.photoPlaceholder}><View style={styles.cameraCircle}><Ionicons name="camera" size={rfs(28)} color={ACCENT_BLUE} /></View><Text style={styles.photoHint}>Add profile photo</Text></View>}
            {photoSaving && <View style={styles.photoOverlay}><ActivityIndicator color="white" /></View>}
          </TouchableOpacity>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="e.g. John Doe" placeholderTextColor={TEXT_DIM} returnKeyType="next" />
          <Text style={styles.label}>Phone Number *</Text>
          <View style={styles.phoneInputWrap}>
            <View style={styles.phoneFlag}><Text style={styles.phoneCountryCode}>🇮🇳 +91</Text></View>
            <TextInput style={styles.phoneInput} value={phone} onChangeText={setPhone} placeholder="Mobile number" placeholderTextColor={TEXT_DIM} keyboardType="phone-pad" returnKeyType="next" maxLength={15} />
          </View>
          <LocationPicker value={location} onChange={setLocation} onCoordsChange={(lat, lng) => setCoords({ latitude: lat, longitude: lng })} label="Work Location *" />
          
          <Text style={styles.label}>Skill / Profession *</Text>
          <TextInput style={styles.input} value={skillType} onChangeText={setSkillType} placeholder="e.g. Plumber, Electrician, Helper" placeholderTextColor={TEXT_DIM} returnKeyType="next" />
          
          <Text style={styles.label}>Hourly/Daily Rate (₹)</Text>
          <TextInput style={styles.input} value={hourlyRate} onChangeText={setHourlyRate} placeholder="e.g. 500/day" placeholderTextColor={TEXT_DIM} returnKeyType="next" />
          
          <Text style={styles.label}>About your experience</Text>
          <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={3} value={about} onChangeText={setAbout} placeholder="Describe your skills and experience…" placeholderTextColor={TEXT_DIM} />
          
          <TouchableOpacity style={[styles.pillBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="checkmark-circle-outline" size={rfs(19)} color="white" />}
            <Text style={styles.pillBtnText}> {saving ? "Saving…" : "Go to Dashboard"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LaborDetailsForm;
