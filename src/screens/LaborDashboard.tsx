import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import GlassHeader from '../components/GlassHeader';
import PillBottomBar from '../components/PillBottomBar';
import PillNavItem from '../components/PillNavItem';
import TopBar from '../components/TopBar';
import { AppContext } from '../context/AppContext';
import { database } from '../services/firebase';
import { UserData } from '../types';
import { DEFAULT_AVATAR } from '../utils/constants';
import { handleCall, handleWhatsApp } from '../utils/contactHelpers';
import { rfs, scale } from '../utils/scaling';
import { ACCENT_BLUE, BG_DARK, BOTTOM_TAB_H, globalStyles as styles, TEXT_MUTED, TEXT_WHITE, TEXT_DIM, WHATSAPP_GREEN } from '../utils/theme';

const LaborDashboard = ({ navigation }: any) => {
  const { currentUser } = React.useContext(AppContext);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const ref = database().ref(`users/${currentUser.uid}`);
    const l = ref.on("value", (s) => setUserData(s.val()));

    const reqRef = database().ref("serviceRequests").orderByChild("providerId").equalTo(currentUser.uid);
    const rl = reqRef.on("value", (s) => {
      const list: any[] = [];
      s.forEach((child) => { list.push({ id: child.key, ...child.val() }); });
      list.sort((a, b) => b.timestamp - a.timestamp); // newest first
      setRequests(list);
    });

    return () => { ref.off("value", l); reqRef.off("value", rl); };
  }, [currentUser]);

  const updateRequestStatus = async (id: string, status: string) => {
    try {
      await database().ref(`serviceRequests/${id}`).update({ status });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding" keyboardVerticalOffset={Platform.OS === "android" ? 0 : 0}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <GlassHeader>
        <TopBar showBranding
          onProfilePress={() => navigation.navigate("Profile")}
          avatarUri={userData?.photoURL || DEFAULT_AVATAR}
        />
        {userData && (
          <View style={styles.shopBannerGlass}>
            <Image source={{ uri: userData.photoURL || DEFAULT_AVATAR }} style={styles.shopBannerImg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.shopBannerName} numberOfLines={1}>{userData.fullName}</Text>
              <View style={styles.typePillLight}><Text style={styles.typePillLightText}>{userData.skillType || "Professional"}</Text></View>
              {userData.hourlyRate ? <Text style={styles.shopBannerNote} numberOfLines={1}>₹{userData.hourlyRate}</Text> : null}
              {userData.phone ? (
                <View style={styles.locationRow}>
                  <Ionicons name="call-outline" size={rfs(10)} color={TEXT_MUTED} />
                  <Text style={[styles.shopLocationText, { color: TEXT_MUTED }]}>{userData.phone}</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity style={styles.editFab} onPress={() => navigation.navigate("EditProfile")}>
              <Ionicons name="pencil" size={rfs(13)} color={TEXT_WHITE} />
            </TouchableOpacity>
          </View>
        )}
      </GlassHeader>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: scale(16), paddingBottom: BOTTOM_TAB_H + scale(20) }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { marginBottom: scale(12) }]}>Incoming Requests</Text>
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={scale(55)} color={TEXT_MUTED} />
            <Text style={styles.emptyText}>You're ready for work!</Text>
            <Text style={{ color: TEXT_MUTED, textAlign: 'center', marginTop: scale(8) }}>Work requests will appear here when customers contact you.</Text>
          </View>
        ) : (
          requests.map((req) => (
            <View key={req.id} style={[styles.formCard, { marginBottom: scale(12), padding: scale(14) }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: TEXT_WHITE, fontSize: rfs(15), fontWeight: "600" }}>{req.customerName}</Text>
                  <Text style={{ color: TEXT_MUTED, fontSize: rfs(10), marginTop: scale(4) }}>
                    {new Date(req.timestamp).toLocaleDateString()} {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {req.customerPhone ? (
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: scale(10), gap: scale(8) }}>
                      <TouchableOpacity 
                        style={styles.smallPillBtn} 
                        onPress={() => handleCall(req.customerPhone)}
                      >
                        <Ionicons name="call" size={rfs(11)} color="white" />
                        <Text style={styles.smallPillBtnText}>Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.smallPillBtn, { backgroundColor: WHATSAPP_GREEN, shadowColor: WHATSAPP_GREEN }]} 
                        onPress={() => handleWhatsApp(req.customerPhone)}
                      >
                        <Ionicons name="logo-whatsapp" size={rfs(11)} color="white" />
                        <Text style={styles.smallPillBtnText}>WhatsApp</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={{ color: TEXT_DIM, fontSize: rfs(11), marginTop: scale(6) }}>No phone provided</Text>
                  )}
                </View>
                <View style={[styles.typePillLight, req.status === "accepted" && { backgroundColor: "rgba(34,197,94,0.15)", borderColor: "rgba(34,197,94,0.3)" }, req.status === "rejected" && { backgroundColor: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.3)" }]}>
                  <Text style={[styles.typePillLightText, req.status === "accepted" && { color: "#4ade80" }, req.status === "rejected" && { color: "#f87171" }]}>
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </Text>
                </View>
              </View>

              {req.status === "pending" && (
                <View style={{ flexDirection: "row", gap: scale(8), marginTop: scale(16) }}>
                  <TouchableOpacity 
                    style={[styles.pillBtn, { flex: 1, backgroundColor: "#ef4444" }]} 
                    onPress={() => updateRequestStatus(req.id!, "rejected")}
                  >
                    <Text style={styles.pillBtnText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.pillBtn, { flex: 1 }]} 
                    onPress={() => updateRequestStatus(req.id!, "accepted")}
                  >
                    <Text style={styles.pillBtnText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <PillBottomBar>
        <PillNavItem icon="hammer" label="Work" active />
        <PillNavItem icon="person-circle-outline" label="Account" showLabel onPress={() => navigation.navigate("Profile")} />
      </PillBottomBar>
    </KeyboardAvoidingView>
  );
};

export default LaborDashboard;
