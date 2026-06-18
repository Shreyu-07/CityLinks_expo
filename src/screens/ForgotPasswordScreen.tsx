import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FloatingBubbles from '../components/FloatingBubbles';
import Toast from '../components/Toast';
import { auth, database } from '../services/firebase';
import { FIREBASE_API_KEY } from '../utils/constants';
import { rfs, scale } from '../utils/scaling';
import { ACCENT_AMBER, ACCENT_BLUE, ACCENT_VIOLET, BG_DARK, GLASS_BORDER, STATUS_BAR_H, globalStyles as styles, SUCCESS, SURFACE_2, TEXT_DIM, TEXT_MUTED, TEXT_WHITE } from '../utils/theme';
import { useToast } from '../utils/useToast';

const ForgotPasswordScreen = ({ navigation }: any) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNP, setShowNP] = useState(false);
  const [showCP, setShowCP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string>("");
  const [verifiedUid, setVerifiedUid] = useState<string>("");
  const { toastState, showToast } = useToast();

  const handleVerifyIdentity = async () => {
    if (!email.trim()) {
      showToast("Please enter your email address", "error"); return;
    }
    setLoading(true);
    try {
      // Only check if email exists in the users DB
      const snap = await database().ref("users")
        .orderByChild("email")
        .equalTo(email.trim().toLowerCase())
        .once("value");
      const users = snap.val();
      if (!users) {
        showToast("No account found with this email. Please create an account or enter the correct email.", "error");
        setLoading(false); return;
      }

      const uid = Object.keys(users)[0];
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(otp);
      setVerifiedEmail(email.trim().toLowerCase());
      setVerifiedUid(uid);
      await database().ref(`passwordResets/${uid}`).set({ otp, email: email.trim().toLowerCase(), createdAt: Date.now() });
      showToast(`🔐 Your OTP is: ${otp}`, "info", 8000);
      setStep(2);
    } catch (e: any) { showToast(e.message || "Something went wrong", "error"); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = () => {
    if (!otpInput.trim()) { showToast("Enter the OTP", "error"); return; }
    if (otpInput.trim() !== generatedOtp) { showToast("Incorrect OTP. Please try again.", "error"); return; }
    showToast("✅ OTP verified!", "success");
    setStep(3);
  };

  // Update password directly in Firebase Auth using REST API via existing password in DB
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) { showToast("Fill in both password fields", "error"); return; }
    if (newPassword !== confirmPassword) { showToast("Passwords don't match", "error"); return; }
    if (newPassword.length < 6) { showToast("Minimum 6 characters", "error"); return; }
    setLoading(true);
    try {
      // Try to get stored old password from DB (if it was saved during signup as plain text)
      const userSnap = await database().ref(`users/${verifiedUid}`).once("value");
      const userData = userSnap.val() || {};
      const storedPassword = userData.password; // Only works if signup stored it

      let passwordUpdated = false;

      if (storedPassword) {
        // Step 1: Sign in via REST to get idToken
        try {
          const signInRes = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: verifiedEmail, password: storedPassword, returnSecureToken: true }),
            }
          );
          const signInData = await signInRes.json();
          if (signInData.idToken) {
            // Step 2: Update password using the idToken
            const updateRes = await fetch(
              `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken: signInData.idToken, password: newPassword, returnSecureToken: true }),
              }
            );
            const updateData = await updateRes.json();
            if (!updateData.error) {
              // Also update stored password in DB
              await database().ref(`users/${verifiedUid}`).update({ password: newPassword });
              await database().ref(`passwordResets/${verifiedUid}`).remove();
              passwordUpdated = true;
            }
          }
        } catch { /* fall through to reset email */ }
      }

      if (!passwordUpdated) {
        // Fallback: send Firebase password reset email
        await auth().sendPasswordResetEmail(verifiedEmail);
        showToast(
          `📧 Reset email sent to ${verifiedEmail}. Open the link in the email to set your new password.`,
          "success",
          7000
        );
        setTimeout(() => navigation.navigate("Auth"), 6000);
        return;
      }

      showToast("✅ Password updated successfully! Please log in with your new password.", "success", 4000);
      setTimeout(() => navigation.navigate("Auth"), 3500);
    } catch (e: any) {
      const msg = String(e?.message || "Failed to reset password");
      showToast(msg, "error");
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG_DARK }} behavior="padding">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />
      <View style={{ position: "absolute", top: -scale(80), right: -scale(50), width: scale(250), height: scale(250), borderRadius: scale(125), backgroundColor: "rgba(99,102,241,0.18)" }} />
      <View style={{ position: "absolute", bottom: -scale(60), left: -scale(40), width: scale(200), height: scale(200), borderRadius: scale(100), backgroundColor: "rgba(59,130,246,0.12)" }} />
      <FloatingBubbles count={10} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: scale(24), paddingBottom: scale(60), alignItems: "center", justifyContent: "center", paddingTop: STATUS_BAR_H + scale(20) }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.changePwBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rfs(20)} color={TEXT_WHITE} />
        </TouchableOpacity>
        <View style={styles.changePwHero}>
          <View style={[styles.changePwIconWrap, { backgroundColor: ACCENT_VIOLET }]}>
            <Ionicons name="key" size={scale(36)} color="white" />
          </View>
          <Text style={styles.changePwTitle}>Forgot Password</Text>
          <Text style={styles.changePwSub}>
            {step === 1 ? "Verify your identity to reset your password"
              : step === 2 ? "Enter the OTP shown on your screen"
                : "Set your new password — a reset link will be sent to your email"}
          </Text>
        </View>

        {/* Step indicators */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: scale(28), gap: scale(4) }}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={[{ width: scale(28), height: scale(28), borderRadius: scale(14), alignItems: "center", justifyContent: "center" },
              step > s ? { backgroundColor: SUCCESS } : step === s ? { backgroundColor: ACCENT_BLUE } : { backgroundColor: SURFACE_2, borderWidth: 1, borderColor: GLASS_BORDER }]}>
                {step > s
                  ? <Ionicons name="checkmark" size={rfs(14)} color="white" />
                  : <Text style={{ color: step === s ? "white" : TEXT_DIM, fontWeight: "700", fontSize: rfs(12) }}>{s}</Text>}
              </View>
              {s < 3 && <View style={{ width: scale(30), height: 2, backgroundColor: step > s ? SUCCESS : GLASS_BORDER, marginHorizontal: scale(2) }} />}
            </View>
          ))}
        </View>

        <View style={[styles.changePwCard, { width: "100%" }]}>
          {step === 1 && (
            <>
              <Text style={styles.label}>Email Address</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Your registered email" placeholderTextColor={TEXT_DIM} keyboardType="email-address" autoCapitalize="none" returnKeyType="done" />
              <TouchableOpacity style={[styles.pillBtn, loading && { opacity: 0.7 }]} onPress={handleVerifyIdentity} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="shield-checkmark-outline" size={rfs(19)} color="white" />}
                <Text style={styles.pillBtnText}> {loading ? "Checking…" : "Send OTP"}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <View style={{ backgroundColor: "rgba(99,102,241,0.1)", borderRadius: scale(14), padding: scale(14), marginBottom: scale(16), borderWidth: 1, borderColor: "rgba(99,102,241,0.3)" }}>
                <Text style={{ color: ACCENT_VIOLET, fontWeight: "700", fontSize: rfs(12), textAlign: "center" }}>
                  📱 Check the OTP toast notification above
                </Text>
                <Text style={{ color: TEXT_MUTED, fontSize: rfs(11), textAlign: "center", marginTop: scale(4) }}>
                  The OTP is displayed on screen for 8 seconds
                </Text>
              </View>
              <Text style={styles.label}>Enter 6-Digit OTP</Text>
              <TextInput
                style={[styles.input, { letterSpacing: scale(6), textAlign: "center", fontSize: rfs(22), fontWeight: "800" }]}
                value={otpInput}
                onChangeText={(v) => setOtpInput(v.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000" placeholderTextColor={TEXT_DIM}
                keyboardType="numeric" maxLength={6} returnKeyType="done"
              />
              <TouchableOpacity style={styles.pillBtn} onPress={handleVerifyOtp}>
                <Ionicons name="checkmark-circle-outline" size={rfs(19)} color="white" />
                <Text style={styles.pillBtnText}> Verify OTP</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ alignSelf: "center", marginTop: scale(12) }} onPress={() => showToast(`Your OTP is: ${generatedOtp}`, "info", 8000)}>
                <Text style={{ color: ACCENT_BLUE, fontWeight: "600", fontSize: rfs(13) }}>Resend OTP</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 3 && (
            <>
              <View style={{ backgroundColor: "rgba(16,185,129,0.1)", borderRadius: scale(14), padding: scale(14), marginBottom: scale(16), borderWidth: 1, borderColor: "rgba(16,185,129,0.3)" }}>
                <Text style={{ color: SUCCESS, fontWeight: "700", fontSize: rfs(12), textAlign: "center" }}>
                  ✅ OTP Verified — Enter your new password
                </Text>
                <Text style={{ color: TEXT_MUTED, fontSize: rfs(11), textAlign: "center", marginTop: scale(4) }}>
                  For {verifiedEmail}
                </Text>
              </View>

              <Text style={styles.label}>New Password</Text>
              <View style={styles.pwWrap}>
                <TextInput style={styles.pwInput} placeholder="Min. 6 characters" placeholderTextColor={TEXT_DIM} secureTextEntry={!showNP} value={newPassword} onChangeText={setNewPassword} returnKeyType="next" autoFocus />
                <TouchableOpacity style={styles.pwEye} onPress={() => setShowNP(!showNP)} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
                  <Ionicons name={showNP ? "eye-off-outline" : "eye-outline"} size={rfs(20)} color={ACCENT_BLUE} />
                </TouchableOpacity>
              </View>

              {newPassword.length > 0 && (
                <View style={[styles.pwStrengthWrap, { marginBottom: scale(8) }]}>
                  <View style={[styles.pwStrengthBar, { backgroundColor: newPassword.length >= 8 ? SUCCESS : newPassword.length >= 6 ? ACCENT_AMBER : "#ef4444" }]} />
                  <Text style={[styles.pwStrengthText, { color: newPassword.length >= 8 ? SUCCESS : newPassword.length >= 6 ? ACCENT_AMBER : "#ef4444" }]}>
                    {newPassword.length >= 8 ? "Strong" : newPassword.length >= 6 ? "Medium" : "Weak"}
                  </Text>
                </View>
              )}

              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.pwWrap}>
                <TextInput style={styles.pwInput} placeholder="Re-enter new password" placeholderTextColor={TEXT_DIM} secureTextEntry={!showCP} value={confirmPassword} onChangeText={setConfirmPassword} returnKeyType="done" onSubmitEditing={handleResetPassword} />
                <TouchableOpacity style={styles.pwEye} onPress={() => setShowCP(!showCP)} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
                  <Ionicons name={showCP ? "eye-off-outline" : "eye-outline"} size={rfs(20)} color={ACCENT_BLUE} />
                </TouchableOpacity>
              </View>

              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <Text style={{ color: "#ef4444", fontSize: rfs(11), marginBottom: scale(8), marginTop: -scale(6) }}>⚠️ Passwords don't match</Text>
              )}
              {confirmPassword.length > 0 && newPassword === confirmPassword && newPassword.length >= 6 && (
                <Text style={{ color: SUCCESS, fontSize: rfs(11), marginBottom: scale(8), marginTop: -scale(6) }}>✅ Passwords match!</Text>
              )}

              <TouchableOpacity
                style={[styles.pillBtn, { backgroundColor: SUCCESS }, loading && { opacity: 0.7 }]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="shield-checkmark-outline" size={rfs(19)} color="white" />}
                <Text style={styles.pillBtnText}> {loading ? "Processing…" : "Reset Password"}</Text>
              </TouchableOpacity>

              <Text style={[styles.hintText, { textAlign: "center", marginTop: scale(10) }]}>
                📧 Check your email and click the reset link to apply your new password
              </Text>
            </>
          )}

          <TouchableOpacity style={[styles.pillBtn, styles.pillBtnOutline, { marginTop: scale(10) }]} onPress={() => navigation.goBack()}>
            <Text style={[styles.pillBtnText, { color: ACCENT_BLUE }]}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── App Navigator ─────────────────────────────────────────────────────

export default ForgotPasswordScreen;
