import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StatusBar, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import GlassHeader from '../components/GlassHeader';
import Toast from '../components/Toast';
import { database } from '../services/firebase';
import { UserData } from '../types';
import { DEFAULT_AVATAR } from '../utils/constants';
import { handleCall, handleWhatsApp } from '../utils/contactHelpers';
import { rfs, scale } from '../utils/scaling';
import { ACCENT_BLUE, BG_DARK, globalStyles as styles, TEXT_DIM, TEXT_WHITE, WHATSAPP_GREEN } from '../utils/theme';
import { useToast } from '../utils/useToast';

import { AppContext } from '../context/AppContext';
import { ServiceRequest } from '../types';

const ServiceProfile = ({ route, navigation }: any) => {
  const userId: string = route.params?.userId ?? "";
  const initialData: UserData = route.params?.userData ?? {};
  const [profile, setProfile] = useState<UserData>(initialData);
  const { toastState, showToast } = useToast();
  const { currentUser } = React.useContext(AppContext);
  const [requestObj, setRequestObj] = useState<ServiceRequest | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const ref = database().ref(`users/${userId}`);
    const listener = ref.on("value", (s) => {
      if (s.val()) setProfile(s.val());
    });
    return () => ref.off("value", listener);
  }, [userId]);

  useEffect(() => {
    if (!userId || !currentUser) return;
    const reqRef = database().ref("serviceRequests").orderByChild("providerId").equalTo(userId);
    const l = reqRef.on("value", (s) => {
      let found: ServiceRequest | null = null;
      s.forEach((child) => {
        if (child.val().userId === currentUser.uid) {
          found = { id: child.key, ...child.val() };
        }
      });
      setRequestObj(found);
    });
    return () => reqRef.off("value", l);
  }, [userId, currentUser]);

  const handleRequestService = async () => {
    if (!currentUser) { showToast("Please login first", "error"); return; }
    setIsRequesting(true);
    try {
      const snap = await database().ref(`users/${currentUser.uid}`).once("value");
      const me = snap.val() || {};
      const newReq: ServiceRequest = {
        userId: currentUser.uid,
        providerId: userId,
        customerName: me.fullName || "Customer",
        customerPhone: me.phone || "",
        status: "pending",
        timestamp: Date.now()
      };
      await database().ref("serviceRequests").push(newReq);
      showToast("✅ Request sent!", "success");
    } catch (e: any) {
      showToast(e.message, "error");
    }
    setIsRequesting(false);
  };

  const isLabor = profile?.role === "labor";
  const isTransport = profile?.role === "transport";

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_DARK} />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />
      <GlassHeader extraPad={profile?.phone ? scale(10) : 0}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.topBarIconBtn}>
            <Ionicons name="arrow-back" size={rfs(20)} color={TEXT_WHITE} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>{profile?.fullName || "Profile"}</Text>
          <View style={{ width: scale(40) }} />
        </View>
        {profile && (
          <View style={styles.shopBannerGlass}>
            <Image source={{ uri: profile.photoURL || DEFAULT_AVATAR }} style={styles.shopBannerImg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.shopBannerName} numberOfLines={1}>{profile.fullName}</Text>
              <View style={styles.typePillLight}>
                <Text style={styles.typePillLightText}>
                  {isLabor ? "🛠️ Labor" : isTransport ? "🚚 Transport" : "Professional"}
                </Text>
              </View>
              {profile.phone && (
                <View style={styles.bannerContactRow}>
                  <TouchableOpacity style={styles.bannerContactBtn} onPress={() => handleCall(profile.phone!)}>
                    <Ionicons name="call" size={rfs(11)} color="white" />
                    <Text style={styles.bannerContactText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.bannerContactBtn, { backgroundColor: WHATSAPP_GREEN }]} onPress={() => handleWhatsApp(profile.phone!)}>
                    <Ionicons name="logo-whatsapp" size={rfs(11)} color="white" />
                    <Text style={styles.bannerContactText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </GlassHeader>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: scale(16), paddingBottom: scale(40) }} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Professional Details</Text>
          
          {isLabor && (
            <>
              <InfoRow icon="hammer-outline" label="Skill / Profession" value={profile.skillType} />
              <InfoRow icon="cash-outline" label="Hourly Rate" value={profile.hourlyRate ? `₹${profile.hourlyRate}` : undefined} />
            </>
          )}

          {isTransport && (
            <>
              <InfoRow icon="car-outline" label="Vehicle Type" value={profile.vehicleType} />
              <InfoRow icon="cube-outline" label="Capacity" value={profile.vehicleCapacity} />
            </>
          )}

          <InfoRow icon="location-outline" label="Location" value={profile.location} />
          {profile.phone && <InfoRow icon="call-outline" label="Phone" value={profile.phone} />}
        </View>

        {profile.about ? (
          <View style={[styles.formCard, { marginTop: scale(16) }]}>
            <Text style={styles.formTitle}>About</Text>
            <Text style={{ color: TEXT_WHITE, fontSize: rfs(14), lineHeight: scale(22) }}>{profile.about}</Text>
          </View>
        ) : null}

        {/* Request Service Area */}
        <View style={{ marginTop: scale(24), alignItems: "center" }}>
          {!requestObj ? (
            <TouchableOpacity style={[styles.pillBtn, { width: "100%", paddingVertical: scale(14) }]} onPress={handleRequestService} disabled={isRequesting}>
              <Ionicons name="flash-outline" size={rfs(18)} color="white" />
              <Text style={[styles.pillBtnText, { fontSize: rfs(16) }]}>{isRequesting ? "Sending..." : "Request Service"}</Text>
            </TouchableOpacity>
          ) : requestObj.status === "pending" ? (
            <View style={[styles.typePillLight, { backgroundColor: "rgba(251,191,36,0.15)", borderColor: "rgba(251,191,36,0.3)", paddingVertical: scale(12), paddingHorizontal: scale(24) }]}>
              <Text style={[styles.typePillLightText, { color: "#fbbf24", fontSize: rfs(15) }]}>⏳ Request Pending</Text>
            </View>
          ) : requestObj.status === "accepted" ? (
            <View style={[styles.typePillLight, { backgroundColor: "rgba(34,197,94,0.15)", borderColor: "rgba(34,197,94,0.3)", paddingVertical: scale(12), paddingHorizontal: scale(24) }]}>
              <Text style={[styles.typePillLightText, { color: "#4ade80", fontSize: rfs(15) }]}>✅ Request Accepted</Text>
            </View>
          ) : (
            <View style={{ width: "100%", alignItems: "center", gap: scale(12) }}>
              <View style={[styles.typePillLight, { backgroundColor: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.3)", paddingVertical: scale(10), paddingHorizontal: scale(20) }]}>
                <Text style={[styles.typePillLightText, { color: "#f87171", fontSize: rfs(14) }]}>❌ Request Declined</Text>
              </View>
              <TouchableOpacity style={[styles.pillBtnOutline, { width: "100%" }]} onPress={handleRequestService} disabled={isRequesting}>
                <Text style={[styles.pillBtnText, { color: ACCENT_BLUE }]}>Send New Request</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
};

const InfoRow = ({ icon, label, value }: { icon: any, label: string, value?: string }) => {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: scale(10), borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}>
      <Ionicons name={icon} size={rfs(18)} color={ACCENT_BLUE} style={{ marginRight: scale(12) }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: TEXT_DIM, fontSize: rfs(11), marginBottom: scale(2) }}>{label}</Text>
        <Text style={{ color: TEXT_WHITE, fontSize: rfs(14), fontWeight: "500" }}>{value}</Text>
      </View>
    </View>
  );
};

export default ServiceProfile;
