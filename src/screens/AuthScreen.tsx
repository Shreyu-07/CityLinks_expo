import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ErrorBanner from '../components/ErrorBanner';
import FloatingBubbles from '../components/FloatingBubbles';
import PasswordInput from '../components/PasswordInput';
import { AppContext } from '../context/AppContext';
import { auth, database } from '../services/firebase';
import { UserRole } from '../types';
import { DEFAULT_AVATAR, DEFAULT_SHOP_LOGO } from '../utils/constants';
import { rfs, scale } from '../utils/scaling';
import { ACCENT_BLUE, BG_DARK, globalStyles as styles, TEXT_DIM } from '../utils/theme';

const AuthScreen = ({ navigation }: any) => {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loginEmail, setLoginEmail] = useState(""); const [loginPass, setLoginPass] = useState("");
  const [signupEmail, setSignupEmail] = useState(""); const [signupPass, setSignupPass] = useState("");
  const [signupConfirm, setSignupConfirm] = useState(""); const [role, setRole] = useState<UserRole>(null);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [showLP, setShowLP] = useState(false); const [showSP, setShowSP] = useState(false); const [showSC, setShowSC] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setCurrentUser, setCurrentRole } = React.useContext(AppContext);

  const getErr = (e: any, ctx: string) => {
    const msg = String(e?.message || e || "Something went wrong");
    if (/network|request failed|fetch|connection|internet|timeout/i.test(msg)) return { title: "Connection problem", message: "Check your internet and try again." };
    if (ctx === "login") {
      if (/invalid.*email|user.*not.*found/i.test(msg)) return { title: "Login failed", message: "No account with this email." };
      if (/wrong.*password|invalid.*password/i.test(msg)) return { title: "Wrong password", message: "Incorrect password. Try again." };
    }
    if (ctx === "signup" && /email.*already|already.*use/i.test(msg)) return { title: "Email in use", message: "An account already exists with this email." };
    return { title: "Error", message: msg };
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPass) { setError({ title: "Missing fields", message: "Enter email and password." }); return; }
    setError(null); setLoading(true);
    try { const c = await auth().signInWithEmailAndPassword(loginEmail, loginPass); setCurrentUser(c.user); }
    catch (e) { setError(getErr(e, "login")); }
    finally { setLoading(false); }
  };

  const handleSignup = async () => {
    setError(null);
    if (!role) { setError({ title: "Select role", message: "Choose Customer or Shopkeeper." }); return; }
    if (signupPass !== signupConfirm) { setError({ title: "Passwords don't match", message: "Both fields must match." }); return; }
    if (signupPass.length < 6) { setError({ title: "Weak password", message: "Minimum 6 characters." }); return; }
    setLoading(true);
    try {
      const c = await auth().createUserWithEmailAndPassword(signupEmail, signupPass);
      if (!c.user) throw new Error("User creation failed.");
      await database().ref(`users/${c.user.uid}`).set({ email: signupEmail, role, createdAt: Date.now(), photoURL: role === "user" ? DEFAULT_AVATAR : DEFAULT_SHOP_LOGO });
      setCurrentUser(c.user); setCurrentRole(role);
    } catch (e) { setError(getErr(e, "signup")); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG_DARK }} behavior="padding">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: BG_DARK }]} />
      <View style={{ position: "absolute", top: -scale(90), right: -scale(60), width: scale(300), height: scale(300), borderRadius: scale(150), backgroundColor: "rgba(99,102,241,0.2)" }} />
      <FloatingBubbles count={14} />
      <ScrollView contentContainerStyle={styles.authContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.authHeader}>
          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: scale(16) }}>
            <Image source={require('../../assets/images/logo.png')} style={{ width: scale(120), height: scale(120), resizeMode: 'contain' }} />
          </View>
          <Text style={styles.authTitle}>CityLinks</Text>
          <Text style={styles.authSubtitle}>Discover local Shops & Services near you</Text>
        </View>
        <View style={styles.authHeaderBottomCurve} />
        <View style={styles.authSheet}>
          <View style={styles.authSheetHandle} />
          <View style={{ paddingHorizontal: scale(22), paddingTop: scale(4), paddingBottom: Math.max(scale(28), 28) }}>
            {error && <ErrorBanner title={error.title} message={error.message} onDismiss={() => setError(null)} style={{ marginBottom: scale(14) }} />}
            <View style={styles.pillTabRow}>
              {(["login", "signup"] as const).map((t) => (
                <TouchableOpacity key={t} style={[styles.pillTabBtn, tab === t && styles.pillTabBtnActive]} onPress={() => { setTab(t); setError(null); }}>
                  <Text style={[styles.pillTabText, tab === t && styles.pillTabTextActive]}>{t === "login" ? "Sign In" : "Register"}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {tab === "login" ? (
              <>
                <TextInput style={styles.input} placeholder="Email address" placeholderTextColor={TEXT_DIM} value={loginEmail} onChangeText={setLoginEmail} keyboardType="email-address" autoCapitalize="none" returnKeyType="next" />
                <PasswordInput value={loginPass} onChange={setLoginPass} placeholder="Password" show={showLP} setShow={setShowLP} returnKeyType="done" onSubmit={handleLogin} />
                <TouchableOpacity style={styles.forgotLink} onPress={() => navigation.navigate("ForgotPassword")}><Text style={styles.forgotText}>Forgot password?</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.pillBtn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
                  {loading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="log-in-outline" size={rfs(19)} color="white" />}
                  <Text style={styles.pillBtnText}> {loading ? "Signing in…" : "Sign In"}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput style={styles.input} placeholder="Email address" placeholderTextColor={TEXT_DIM} value={signupEmail} onChangeText={setSignupEmail} keyboardType="email-address" autoCapitalize="none" returnKeyType="next" />
                <PasswordInput value={signupPass} onChange={setSignupPass} placeholder="Password" show={showSP} setShow={setShowSP} returnKeyType="next" />
                <PasswordInput value={signupConfirm} onChange={setSignupConfirm} placeholder="Confirm password" show={showSC} setShow={setShowSC} returnKeyType="done" onSubmit={handleSignup} />
                <Text style={styles.roleLabel}>Join as</Text>
                <View style={[styles.roleRow, { flexWrap: 'wrap', gap: 8 }]}>
                  {([
                    ["user", "person-outline", "Customer"],
                    ["shopkeeper", "storefront-outline", "Shop"],
                    ["labor", "hammer-outline", "Labor"],
                    ["transport", "car-outline", "Transport"]
                  ] as const).map(([r, icon, label]) => (
                    <TouchableOpacity key={r} style={[styles.roleBtn, role === r && styles.roleBtnActive, { flex: 1, minWidth: '45%' }]} onPress={() => setRole(r)}>
                      <Ionicons name={icon as any} size={rfs(17)} color={role === r ? "white" : ACCENT_BLUE} />
                      <Text style={[styles.roleBtnText, role === r && { color: "white" }]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={[styles.pillBtn, loading && { opacity: 0.7 }]} onPress={handleSignup} disabled={loading}>
                  {loading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="person-add-outline" size={rfs(19)} color="white" />}
                  <Text style={styles.pillBtnText}> {loading ? "Creating…" : "Create Account"}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── Shopkeeper Details ────────────────────────────────────────────────

export default AuthScreen;
