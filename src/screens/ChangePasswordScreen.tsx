import { AppContext } from '../context/AppContext';
import { useToast } from '../utils/useToast';
import { StatusBar } from 'react-native';
import Toast from '../components/Toast';
import FloatingBubbles from '../components/FloatingBubbles';
import PasswordInput from '../components/PasswordInput';
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

const ChangePasswordScreen = ({ navigation }: any) => {
  const [cur, setCur] = useState(""); const [nw, setNw] = useState(""); const [conf, setConf] = useState("");
  const [sc, setSc] = useState(false); const [sn, setSn] = useState(false); const [sconf, setSconf] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentUser } = React.useContext(AppContext);
  const { toastState, showToast } = useToast();

  const handle = async () => {
    if (!cur || !nw || !conf) { showToast("All fields required", "error"); return; }
    if (nw !== conf) { showToast("Passwords do not match", "error"); return; }
    if (nw.length < 6) { showToast("Minimum 6 characters", "error"); return; }
    setLoading(true);
    try {
      const user = auth().currentUser!;
      const cred = auth.EmailAuthProvider.credential(user.email!, cur);
      await user.reauthenticateWithCredential(cred);
      await user.updatePassword(nw);
      showToast("✅ Password updated!", "success");
      setTimeout(() => navigation.goBack(), 1200);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG_DARK }} behavior="padding">
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />
      <View style={{ position: "absolute", top: -scale(80), right: -scale(50), width: scale(250), height: scale(250), borderRadius: scale(125), backgroundColor: "rgba(99,102,241,0.18)" }} />
      <View style={{ position: "absolute", bottom: -scale(60), left: -scale(40), width: scale(200), height: scale(200), borderRadius: scale(100), backgroundColor: "rgba(59,130,246,0.12)" }} />
      <FloatingBubbles count={10} />
      <ScrollView contentContainerStyle={styles.changePwContainer} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.changePwBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rfs(20)} color={TEXT_WHITE} />
        </TouchableOpacity>
        <View style={styles.changePwHero}>
          <View style={styles.changePwIconWrap}>
            <Ionicons name="lock-closed" size={scale(36)} color="white" />
          </View>
          <Text style={styles.changePwTitle}>Change Password</Text>
          <Text style={styles.changePwSub}>Keep your account secure with a strong password</Text>
        </View>
        <View style={styles.changePwCard}>
          <View style={styles.pwStep}>
            <View style={styles.pwStepNum}><Text style={styles.pwStepNumText}>1</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Current Password</Text>
              <PasswordInput value={cur} onChange={setCur} placeholder="Enter current password" show={sc} setShow={setSc} returnKeyType="next" />
            </View>
          </View>
          <View style={styles.pwStepDivider} />
          <View style={styles.pwStep}>
            <View style={[styles.pwStepNum, { backgroundColor: ACCENT_VIOLET }]}><Text style={styles.pwStepNumText}>2</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>New Password</Text>
              <PasswordInput value={nw} onChange={setNw} placeholder="Min. 6 characters" show={sn} setShow={setSn} returnKeyType="next" />
            </View>
          </View>
          <View style={styles.pwStep}>
            <View style={[styles.pwStepNum, { backgroundColor: SUCCESS }]}><Text style={styles.pwStepNumText}>3</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Confirm New Password</Text>
              <PasswordInput value={conf} onChange={setConf} placeholder="Re-enter new password" show={sconf} setShow={setSconf} returnKeyType="done" onSubmit={handle} />
            </View>
          </View>
          {nw.length > 0 && (
            <View style={styles.pwStrengthWrap}>
              <View style={[styles.pwStrengthBar, { backgroundColor: nw.length >= 8 ? SUCCESS : nw.length >= 6 ? ACCENT_AMBER : "#ef4444" }]} />
              <Text style={[styles.pwStrengthText, { color: nw.length >= 8 ? SUCCESS : nw.length >= 6 ? ACCENT_AMBER : "#ef4444" }]}>
                {nw.length >= 8 ? "Strong" : nw.length >= 6 ? "Medium" : "Weak"}
              </Text>
            </View>
          )}
          <TouchableOpacity style={[styles.pillBtn, { marginTop: scale(20) }, loading && { opacity: 0.7 }]} onPress={handle} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="shield-checkmark-outline" size={rfs(19)} color="white" />}
            <Text style={styles.pillBtnText}> {loading ? "Updating…" : "Update Password"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pillBtn, styles.pillBtnOutline, { marginTop: scale(10) }]} onPress={() => navigation.goBack()}>
            <Text style={[styles.pillBtnText, { color: ACCENT_BLUE }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── Forgot Password ─────────────────────────────────────────

export default ChangePasswordScreen;
