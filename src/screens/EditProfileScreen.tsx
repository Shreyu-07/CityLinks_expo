import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LocationPicker from '../components/LocationPicker';
import Toast from '../components/Toast';
import { AppContext } from '../context/AppContext';
import { database } from '../services/firebase';
import { LatLng } from '../types';
import { DEFAULT_AVATAR, DEFAULT_SHOP_LOGO } from '../utils/constants';
import { pickPhoto } from '../utils/photoPicker';
import { rfs, scale } from '../utils/scaling';
import { ACCENT_BLUE, BG_DARK, globalStyles as styles, TEXT_DIM, TEXT_MUTED, TEXT_WHITE } from '../utils/theme';
import { useToast } from '../utils/useToast';

const EditProfileScreen = ({ navigation }: any) => {
  const { currentUser, currentRole } = React.useContext(AppContext);
  const [shopName, setShopName] = useState(""); const [shopNote, setShopNote] = useState("");
  const [shopAbout, setShopAbout] = useState(""); const [shopType, setShopType] = useState("");
  const [shopPhone, setShopPhone] = useState(""); const [shopLocation, setShopLocation] = useState("");
  const [shopCoords, setShopCoords] = useState<LatLng | null>(null);
  const [fullName, setFullName] = useState(""); const [age, setAge] = useState("");
  const [phone, setPhone] = useState(""); const [location, setLocation] = useState("");
  const [locCoords, setLocCoords] = useState<LatLng | null>(null);
  const [photo, setPhoto] = useState<string | null>(null); const [photoSaving, setPhotoSaving] = useState(false);
  const [gstNumber, setGstNumber] = useState(""); const [panNumber, setPanNumber] = useState("");
  const [shopRegNumber, setShopRegNumber] = useState(""); const [bankAccount, setBankAccount] = useState("");
  const { toastState, showToast } = useToast();

  useEffect(() => {
    database().ref(`users/${currentUser!.uid}`).once("value").then((snap) => {
      const d = snap.val() || {};
      if (currentRole === "shopkeeper") {
        setShopName(d.shopName || ""); setShopNote(d.note || ""); setShopAbout(d.about || "");
        setShopType(d.type || ""); setPhoto(d.shopPhoto || null); setShopPhone(d.phone || ""); setShopLocation(d.location || "");
        setGstNumber(d.gstNumber || ""); setPanNumber(d.panNumber || ""); setShopRegNumber(d.shopRegNumber || ""); setBankAccount(d.bankAccount || "");
        if (d.latitude && d.longitude) setShopCoords({ latitude: d.latitude, longitude: d.longitude });
      } else {
        setFullName(d.fullName || ""); setAge(d.age || ""); setPhone(d.phone || ""); setLocation(d.location || ""); setPhoto(d.photoURL || null);
        if (d.latitude && d.longitude) setLocCoords({ latitude: d.latitude, longitude: d.longitude });
      }
    });
  }, []);

  const handlePickPhoto = () => pickPhoto(async (b64) => {
    setPhoto(b64); setPhotoSaving(true);
    const key = currentRole === "shopkeeper" ? "shopPhoto" : "photoURL";
    try { await database().ref(`users/${currentUser!.uid}`).update({ [key]: b64 }); } catch { }
    setPhotoSaving(false);
  });

  const handleSave = async () => {
    const updates: any = {};
    if (currentRole === "shopkeeper") {
      Object.assign(updates, { shopName, note: shopNote, about: shopAbout, type: shopType, phone: shopPhone.trim(), location: shopLocation.trim(), gstNumber: gstNumber.trim(), panNumber: panNumber.trim(), shopRegNumber: shopRegNumber.trim(), bankAccount: bankAccount.trim() });
      if (shopCoords) { updates.latitude = shopCoords.latitude; updates.longitude = shopCoords.longitude; }
    } else {
      Object.assign(updates, { fullName, age, phone, location });
      if (locCoords) { updates.latitude = locCoords.latitude; updates.longitude = locCoords.longitude; }
    }
    await database().ref(`users/${currentUser!.uid}`).update(updates);
    showToast("✅ Profile saved!", "success");
    setTimeout(() => navigation.goBack(), 800);
  };

  const displayPhoto = photo || (currentRole === "shopkeeper" ? DEFAULT_SHOP_LOGO : DEFAULT_AVATAR);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG_DARK }} behavior="padding">
      <StatusBar barStyle="dark-content" backgroundColor={BG_DARK} />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets={true}>
        <TouchableOpacity style={[styles.changePwBack, { position: "relative", top: 0, left: 0, marginBottom: scale(16), alignSelf: "flex-start" }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rfs(20)} color={TEXT_WHITE} />
        </TouchableOpacity>
        <View style={styles.formCard}>
          <Text style={[styles.formTitle, { textAlign: currentRole === "shopkeeper" ? "left" : "center" }]}>✏️ Edit {currentRole === "shopkeeper" ? "Shop" : "Profile"}</Text>
          {currentRole === "shopkeeper" ? (
            <TouchableOpacity style={styles.shopPhotoPickerLarge} onPress={handlePickPhoto}>
              <Image source={{ uri: displayPhoto }} style={styles.shopPhotoImg} />
              <View style={styles.profileAvatarEdit}><Ionicons name="camera" size={rfs(12)} color="white" /></View>
              {photoSaving && <View style={styles.photoOverlay}><ActivityIndicator color="white" /></View>}
            </TouchableOpacity>
          ) : (
            <View style={{ alignItems: "center", marginBottom: scale(24) }}>
              <TouchableOpacity style={styles.editProfileAvatarWrap} onPress={handlePickPhoto}>
                <Image source={{ uri: displayPhoto }} style={styles.editProfileAvatar} />
                <View style={styles.profileAvatarEdit}><Ionicons name="camera" size={rfs(14)} color="white" /></View>
                {photoSaving && <View style={styles.photoOverlay}><ActivityIndicator color="white" /></View>}
              </TouchableOpacity>
              <Text style={{ color: TEXT_MUTED, fontSize: rfs(12), marginTop: scale(8), fontWeight: "600" }}>Tap to change photo</Text>
            </View>
          )}
          {currentRole === "shopkeeper" ? (
            <>
              <Text style={styles.label}>Shop name</Text>
              <TextInput style={styles.input} value={shopName} onChangeText={setShopName} returnKeyType="next" />
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneInputWrap}>
                <View style={styles.phoneFlag}><Text style={styles.phoneCountryCode}>🇮🇳 +91</Text></View>
                <TextInput style={styles.phoneInput} value={shopPhone} onChangeText={setShopPhone} placeholder="Mobile number" placeholderTextColor={TEXT_DIM} keyboardType="phone-pad" returnKeyType="next" maxLength={15} />
              </View>
              <LocationPicker value={shopLocation} onChange={setShopLocation} onCoordsChange={(lat, lng) => setShopCoords({ latitude: lat, longitude: lng })} label="Shop Location" />
              <Text style={styles.label}>Offer note</Text>
              <TextInput style={styles.input} value={shopNote} onChangeText={setShopNote} returnKeyType="next" />
              <Text style={styles.label}>About</Text>
              <TextInput style={[styles.input, styles.textArea]} multiline value={shopAbout} onChangeText={setShopAbout} />
              <Text style={styles.label}>Category</Text>
              <TextInput style={styles.input} value={shopType} onChangeText={setShopType} />
              <View style={styles.sectionDivider}><Text style={styles.sectionDividerText}>📋 Business Verification</Text></View>
              <Text style={styles.label}>GST Number</Text>
              <TextInput style={styles.input} value={gstNumber} onChangeText={setGstNumber} autoCapitalize="characters" />
              <Text style={styles.label}>PAN Number</Text>
              <TextInput style={styles.input} value={panNumber} onChangeText={setPanNumber} autoCapitalize="characters" />
              <Text style={styles.label}>Shop Registration Number</Text>
              <TextInput style={styles.input} value={shopRegNumber} onChangeText={setShopRegNumber} />
              <Text style={styles.label}>Bank Account Number</Text>
              <TextInput style={styles.input} value={bankAccount} onChangeText={setBankAccount} keyboardType="numeric" />
            </>
          ) : (
            <>
              <Text style={styles.label}>Full name</Text>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} returnKeyType="next" />
              <Text style={styles.label}>Age</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" returnKeyType="next" />
              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" returnKeyType="next" />
              <LocationPicker value={location} onChange={setLocation} onCoordsChange={(lat, lng) => setLocCoords({ latitude: lat, longitude: lng })} />
            </>
          )}
          <View style={styles.formActions}>
            <TouchableOpacity style={[styles.pillBtn, styles.pillBtnOutline, { flex: 0.4 }]} onPress={() => navigation.goBack()}>
              <Text style={[styles.pillBtnText, { color: ACCENT_BLUE }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pillBtn, { flex: 1 }]} onPress={handleSave}>
              <Ionicons name="save-outline" size={rfs(17)} color="white" />
              <Text style={styles.pillBtnText}> Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── Change Password ───────────────────────────────────────────────────

export default EditProfileScreen;
