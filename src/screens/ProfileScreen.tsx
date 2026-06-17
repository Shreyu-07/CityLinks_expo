import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import InfoRow from '../components/InfoRow';
import Toast from '../components/Toast';
import { AppContext } from '../context/AppContext';
import { auth, database } from '../services/firebase';
import { UserData } from '../types';
import { DEFAULT_AVATAR, DEFAULT_SHOP_LOGO } from '../utils/constants';
import { rfs, scale } from '../utils/scaling';
import { ACCENT_AMBER, ACCENT_BLUE, BG_DARK, STATUS_BAR_H, globalStyles as styles, TEXT_DIM, TEXT_MUTED, TEXT_WHITE } from '../utils/theme';
import { useToast } from '../utils/useToast';

const ProfileScreen = ({ navigation }: any) => {
  const { currentUser, currentRole } = React.useContext(AppContext);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showDangerZone, setShowDangerZone] = useState(false);
  const { toastState, showToast } = useToast();

  useEffect(() => {
    const ref = database().ref(`users/${currentUser!.uid}`);
    const l = ref.on("value", (s) => setUserData(s.val()));
    return () => ref.off("value", l);
  }, [currentUser]);

  const photo = currentRole === "shopkeeper" ? userData?.shopPhoto || DEFAULT_SHOP_LOGO : userData?.photoURL || DEFAULT_AVATAR;
  const name = currentRole === "shopkeeper" ? userData?.shopName : userData?.fullName;

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of CityLinks?", [
      { text: "Stay", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await auth().signOut(); navigation.reset({ index: 0, routes: [{ name: "Auth" }] }); } },
    ]);
  };

  const handleRequestDeletion = () => {
    Alert.alert("Request Account Deletion", "Account deletion requires review (7 days). Submit request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Submit Request",
        onPress: async () => {
          await database().ref(`deletionRequests/${currentUser!.uid}`).set({ requestedAt: Date.now(), email: userData?.email || currentUser?.email, status: "pending" });
          showToast("Deletion request submitted", "info");
        }
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_DARK} />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />
      <ScrollView contentContainerStyle={{ paddingBottom: scale(50) }}>
        <View style={[styles.topBar, { backgroundColor: BG_DARK, paddingTop: STATUS_BAR_H + scale(10), paddingBottom: scale(14) }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.topBarIconBtn}>
            <Ionicons name="arrow-back" size={rfs(20)} color={TEXT_WHITE} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Profile</Text>
          <View style={{ width: scale(40) }} />
        </View>
        <View style={styles.profileHero}>
          <View style={styles.profileAvatarWrap}>
            <Image source={{ uri: photo }} style={styles.profileAvatar} />
            <TouchableOpacity style={styles.profileAvatarEdit} onPress={() => navigation.navigate("EditProfile")}>
              <Ionicons name="camera" size={rfs(14)} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{name || "User"}</Text>
          <Text style={styles.profileEmail}>{userData?.email || currentUser?.email}</Text>
          <View style={[styles.typePillLight, { marginTop: scale(8), alignSelf: "center" }]}>
            <Text style={styles.typePillLightText}>
              {currentRole === "shopkeeper" ? "🏪 Shopkeeper" : currentRole === "labor" ? "🛠️ Labor" : currentRole === "transport" ? "🚚 Transport" : "🛍️ Customer"}
            </Text>
          </View>
        </View>
        <View style={[styles.formCard, { margin: scale(16) }]}>
          <Text style={styles.formTitle}>{currentRole === "shopkeeper" ? "Shop Info" : currentRole === "labor" || currentRole === "transport" ? "Professional Info" : "Personal Info"}</Text>
          {currentRole === "shopkeeper" ? (
            <>
              <InfoRow label="Shop name" value={userData?.shopName} />
              <InfoRow label="Category" value={userData?.type} />
              <InfoRow label="About" value={userData?.about} />
              <InfoRow label="Offer note" value={userData?.note} />
              <InfoRow label="Phone" value={userData?.phone} />
              <InfoRow label="Location" value={userData?.location} />
              <InfoRow label="GST" value={userData?.gstNumber} />
              <InfoRow label="PAN" value={userData?.panNumber} />
              <InfoRow label="Shop Reg #" value={userData?.shopRegNumber} />
              <InfoRow label="Bank Account" value={userData?.bankAccount ? "••••" + userData.bankAccount.slice(-4) : undefined} />
            </>
          ) : currentRole === "labor" ? (
            <>
              <InfoRow label="Full name" value={userData?.fullName} />
              <InfoRow label="Skill/Profession" value={userData?.skillType} />
              <InfoRow label="Rate" value={userData?.hourlyRate ? `₹${userData.hourlyRate}` : undefined} />
              <InfoRow label="About" value={userData?.about} />
              <InfoRow label="Phone" value={userData?.phone} />
              <InfoRow label="Location" value={userData?.location} />
            </>
          ) : currentRole === "transport" ? (
            <>
              <InfoRow label="Driver name" value={userData?.fullName} />
              <InfoRow label="Vehicle Type" value={userData?.vehicleType} />
              <InfoRow label="Capacity" value={userData?.vehicleCapacity} />
              <InfoRow label="License/RC" value={userData?.licenseNumber} />
              <InfoRow label="About" value={userData?.about} />
              <InfoRow label="Phone" value={userData?.phone} />
              <InfoRow label="Location" value={userData?.location} />
            </>
          ) : (
            <>
              <InfoRow label="Full name" value={userData?.fullName} />
              <InfoRow label="Age" value={userData?.age} />
              <InfoRow label="Gender" value={userData?.gender} />
              <InfoRow label="Phone" value={userData?.phone} />
              <InfoRow label="Location" value={userData?.location} />
            </>
          )}
          <TouchableOpacity style={[styles.pillBtn, { marginTop: scale(16) }]} onPress={() => navigation.navigate("EditProfile")}>
            <Ionicons name="create-outline" size={rfs(17)} color="white" />
            <Text style={styles.pillBtnText}> Edit Profile</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.formCard, { margin: scale(16), marginTop: 0 }]}>
          <Text style={styles.formTitle}>Security</Text>
          <TouchableOpacity style={styles.secBtn} onPress={() => navigation.navigate("ChangePassword")}>
            <Ionicons name="key-outline" size={rfs(19)} color={ACCENT_BLUE} />
            <Text style={styles.secBtnText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={rfs(15)} color={TEXT_DIM} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secBtn} onPress={() => setShowDangerZone(!showDangerZone)}>
            <Ionicons name="shield-outline" size={rfs(19)} color={TEXT_MUTED} />
            <Text style={[styles.secBtnText, { color: TEXT_MUTED }]}>Account Actions</Text>
            <Ionicons name={showDangerZone ? "chevron-up" : "chevron-down"} size={rfs(15)} color={TEXT_DIM} />
          </TouchableOpacity>
          {showDangerZone && (
            <View style={styles.dangerZone}>
              <TouchableOpacity style={styles.dangerBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={rfs(16)} color={ACCENT_AMBER} />
                <Text style={[styles.dangerBtnText, { color: ACCENT_AMBER }]}>Sign Out</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerBtn} onPress={handleRequestDeletion}>
                <Ionicons name="trash-outline" size={rfs(16)} color="#ef4444" />
                <Text style={[styles.dangerBtnText, { color: "#ef4444" }]}>Request Account Deletion</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ── Edit Profile ──────────────────────────────────────────────────────

export default ProfileScreen;
