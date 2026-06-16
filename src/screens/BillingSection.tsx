import { AppContext } from '../context/AppContext';
import { useToast } from '../utils/useToast';
import * as Print from 'expo-print';
import { Linking } from 'react-native';
import Toast from '../components/Toast';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
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

const BillingSection = ({ navigation, shopData }: { navigation: any; shopData: UserData | null }) => {
  const { currentUser } = React.useContext(AppContext);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<Array<{ name: string; qty: string; price: string; gst: string }>>([{ name: "", qty: "", price: "", gst: "" }]);
  const [generating, setGenerating] = useState(false);
  const [billingBarcodeVisible, setBillingBarcodeVisible] = useState(false);
  const [billingBarcodeTargetIndex, setBillingBarcodeTargetIndex] = useState(0);
  const { toastState, showToast } = useToast();

  // Auto-fill item name + price from scanned barcode
  const handleBillingScan = async (barcodeData: string, targetIndex: number) => {
    setBillingBarcodeVisible(false);
    showToast("🔍 Looking up product...", "info", 2000);
    try {
      const snap = await database().ref("products")
        .orderByChild("barcodeNumber")
        .equalTo(barcodeData)
        .once("value");
      const data = snap.val();
      if (!data) {
        showToast(`No product found for barcode: ${barcodeData}`, "warning"); return;
      }
      const product = Object.values(data)[0] as Product;
      const next = [...items];
      next[targetIndex].name = product.name;
      next[targetIndex].price = product.price || "";
      setItems(next);
      showToast(`✅ Filled: ${product.name} · ₹${product.price}`, "success");
    } catch {
      showToast("Failed to look up product", "error");
    }
  };

  const addItem = () => setItems([...items, { name: "", qty: "", price: "", gst: "" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: "name" | "qty" | "price" | "gst", val: string) => {
    const next = [...items]; next[i][field] = val; setItems(next);
  };

  const subtotal = items.reduce((sum, it) => sum + (parseFloat(it.price) || 0) * (parseFloat(it.qty) || 0), 0);
  const totalGst = items.reduce((sum, it) => {
    const lineTotal = (parseFloat(it.price) || 0) * (parseFloat(it.qty) || 0);
    const gstRate = (parseFloat(it.gst) || 0) / 100;
    return sum + lineTotal * gstRate;
  }, 0);
  const grandTotal = subtotal + totalGst;

  const handleGenerateBill = async () => {
    const filled = items.filter(it => it.name.trim() && it.price);
    if (!filled.length) { showToast("Add at least one item to generate a bill.", "error"); return; }
    setGenerating(true);
    try {
      const billId = `BILL-${Date.now()}`;
      const billData = {
        billId, shopId: currentUser?.uid || null,
        shopName: shopData?.shopName || "Shop", shopGst: shopData?.gstNumber || "",
        shopPhone: shopData?.phone || "", shopLocation: shopData?.location || "",
        customerName: customerName.trim() || "Walk-in Customer",
        customerPhone: customerPhone.trim(), items: filled,
        subtotal, totalGst, grandTotal, timestamp: Date.now(),
      };
      await database().ref(`bills/${currentUser?.uid}/${billId}`).set(billData);
      const itemRows = filled.map(it => {
        const lineTotal = (parseFloat(it.price) || 0) * (parseFloat(it.qty) || 0);
        const gstAmt = lineTotal * ((parseFloat(it.gst) || 0) / 100);
        return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${it.name}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${it.qty}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${parseFloat(it.price).toFixed(2)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${it.gst || 0}%</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${gstAmt.toFixed(2)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${(lineTotal + gstAmt).toFixed(2)}</td></tr>`;
      }).join("");
      const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;background:#fff;color:#111;margin:0;padding:24px;}.header{background:linear-gradient(135deg,#3B82F6,#6366F1);color:#fff;padding:28px 24px;border-radius:12px;margin-bottom:24px;}.header h1{margin:0 0 6px;font-size:26px;}.header p{margin:2px 0;font-size:13px;opacity:0.88;}.bill-meta{display:flex;justify-content:space-between;margin-bottom:20px;padding:16px;background:#f8fafc;border-radius:10px;}.bill-meta div{font-size:13px;}.bill-meta strong{display:block;color:#374151;margin-bottom:2px;}table{width:100%;border-collapse:collapse;margin-bottom:20px;}thead{background:#f1f5f9;}thead th{padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;}.totals{background:#f8fafc;border-radius:10px;padding:16px;max-width:280px;margin-left:auto;}.totals-row{display:flex;justify-content:space-between;padding:5px 0;font-size:14px;}.totals-row.grand{border-top:2px solid #3B82F6;margin-top:8px;padding-top:12px;font-weight:700;font-size:17px;color:#3B82F6;}.footer{margin-top:32px;text-align:center;font-size:12px;color:#9ca3af;}</style></head><body><div class="header"><h1>🏪 ${shopData?.shopName || "Shop"}</h1>${shopData?.gstNumber ? `<p>GST: ${shopData.gstNumber}</p>` : ""}${shopData?.phone ? `<p>📞 ${shopData.phone}</p>` : ""}${shopData?.location ? `<p>📍 ${shopData.location}</p>` : ""}</div><div class="bill-meta"><div><strong>Bill ID</strong>${billId}</div><div><strong>Date</strong>${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div><div><strong>Customer</strong>${billData.customerName}${billData.customerPhone ? `<br/>📞 ${billData.customerPhone}` : ""}</div></div><table><thead><tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:center;">GST</th><th style="text-align:right;">GST Amt</th><th style="text-align:right;">Total</th></tr></thead><tbody>${itemRows}</tbody></table><div class="totals"><div class="totals-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div><div class="totals-row"><span>Total GST</span><span>₹${totalGst.toFixed(2)}</span></div><div class="totals-row grand"><span>Grand Total</span><span>₹${grandTotal.toFixed(2)}</span></div></div><div class="footer">Thank you for shopping at ${shopData?.shopName || "our shop"}! • Powered by CityLinks</div></body></html>`;
      await Print.printAsync({ html: htmlContent });
      if (customerPhone.trim()) {
        const cleaned = customerPhone.replace(/\D/g, "");
        const whatsappNum = cleaned.length === 10 ? `91${cleaned}` : cleaned;
        const whatsappMsg = encodeURIComponent(`🧾 *Bill from ${shopData?.shopName || "Shop"}*\n\n📋 Bill ID: ${billId}\n👤 Customer: ${billData.customerName}\n📅 Date: ${new Date().toLocaleDateString("en-IN")}\n\nItems: ${filled.map(it => `${it.name} x${it.qty} = ₹${((parseFloat(it.price) || 0) * (parseFloat(it.qty) || 0)).toFixed(2)}`).join(", ")}\n\n💰 Subtotal: ₹${subtotal.toFixed(2)}\n🏷️ GST: ₹${totalGst.toFixed(2)}\n✅ *Grand Total: ₹${grandTotal.toFixed(2)}*\n\nThank you for shopping at ${shopData?.shopName || "our shop"}! 🙏\nPowered by CityLinks`);
        const waUrl = `whatsapp://send?phone=${whatsappNum}&text=${whatsappMsg}`;
        try { const canOpen = await Linking.canOpenURL(waUrl); if (canOpen) await Linking.openURL(waUrl); else await Linking.openURL(`https://wa.me/${whatsappNum}?text=${whatsappMsg}`); } catch { showToast("WhatsApp not available. Bill saved.", "warning"); }
      }
      showToast("✅ Bill generated & saved!", "success");
      setCustomerName(""); setCustomerPhone(""); setItems([{ name: "", qty: "", price: "", gst: "" }]);
    } catch (e: any) { showToast(e.message || "Failed to generate bill", "error"); }
    finally { setGenerating(false); }
  };

  return (
    <View style={{ paddingHorizontal: scale(16), paddingBottom: scale(1) }}>
      <BarcodeScannerModal
        visible={billingBarcodeVisible}
        onClose={() => setBillingBarcodeVisible(false)}
        mode="capture"
        onScanned={(data) => handleBillingScan(data, billingBarcodeTargetIndex)}
      />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />
      <View style={styles.billingCard}>
        <Text style={styles.formTitle}>🧾 Create Bill</Text>
        <Text style={styles.formSub}>Bill customers directly from the app</Text>
        <Text style={styles.label}>Customer Name</Text>
        <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="Walk-in Customer" placeholderTextColor={TEXT_DIM} returnKeyType="next" />
        <Text style={styles.label}>Customer Phone</Text>
        <View style={styles.phoneInputWrap}>
          <View style={styles.phoneFlag}><Text style={styles.phoneCountryCode}>🇮🇳 +91</Text></View>
          <TextInput style={styles.phoneInput} value={customerPhone} onChangeText={setCustomerPhone} placeholder="Customer mobile number" placeholderTextColor={TEXT_DIM} keyboardType="phone-pad" returnKeyType="next" maxLength={15} />
        </View>
        <Text style={[styles.label, { marginTop: scale(6) }]}>Items</Text>
        {items.map((it, i) => (
          <View key={i} style={styles.billingItemCard}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: scale(8) }}>
              <Text style={[styles.label, { marginBottom: 0, marginTop: 0, color: ACCENT_BLUE }]}>Item {i + 1}</Text>
              {items.length > 1 && <TouchableOpacity onPress={() => removeItem(i)}><Ionicons name="close-circle" size={rfs(20)} color="#ef4444" /></TouchableOpacity>}
            </View>
            {/* Item name row with barcode scan button */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8), marginBottom: scale(8) }}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={it.name}
                onChangeText={(v) => updateItem(i, "name", v)}
                placeholder="Item name"
                placeholderTextColor={TEXT_DIM}
              />
              <TouchableOpacity
                style={styles.barcodeScanBtn}
                onPress={() => { setBillingBarcodeTargetIndex(i); setBillingBarcodeVisible(true); }}
              >
                <Ionicons name="barcode-outline" size={rfs(20)} color="white" />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", gap: scale(8) }}>
              <View style={{ flex: 1 }}><Text style={[styles.label, { fontSize: rfs(11) }]}>Qty</Text><TextInput style={[styles.input, { marginBottom: 0 }]} value={it.qty} onChangeText={(v) => updateItem(i, "qty", v)} placeholder="1" placeholderTextColor={TEXT_DIM} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Text style={[styles.label, { fontSize: rfs(11) }]}>Price ₹</Text><TextInput style={[styles.input, { marginBottom: 0 }]} value={it.price} onChangeText={(v) => updateItem(i, "price", v)} placeholder="0.00" placeholderTextColor={TEXT_DIM} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Text style={[styles.label, { fontSize: rfs(11) }]}>GST %</Text><TextInput style={[styles.input, { marginBottom: 0 }]} value={it.gst} onChangeText={(v) => updateItem(i, "gst", v)} placeholder="0" placeholderTextColor={TEXT_DIM} keyboardType="numeric" /></View>
            </View>
          </View>
        ))}
        <TouchableOpacity style={[styles.pillBtn, styles.pillBtnOutline, { marginTop: scale(10) }]} onPress={addItem}>
          <Ionicons name="add-circle-outline" size={rfs(17)} color={ACCENT_BLUE} />
          <Text style={[styles.pillBtnText, { color: ACCENT_BLUE }]}> Add Item</Text>
        </TouchableOpacity>
        <View style={styles.billTotalCard}>
          <View style={styles.billTotalRow2}><Text style={styles.billTotalLabel2}>Subtotal</Text><Text style={styles.billTotalValue}>₹{subtotal.toFixed(2)}</Text></View>
          <View style={styles.billTotalRow2}><Text style={styles.billTotalLabel2}>GST</Text><Text style={styles.billTotalValue}>₹{totalGst.toFixed(2)}</Text></View>
          <View style={[styles.billTotalRow2, { borderTopWidth: 1, borderTopColor: GLASS_BORDER, paddingTop: scale(10), marginTop: scale(4) }]}>
            <Text style={[styles.billTotalLabel2, { color: TEXT_WHITE, fontWeight: "800", fontSize: rfs(15) }]}>Grand Total</Text>
            <Text style={[styles.billTotalValue, { fontSize: rfs(22), color: ACCENT_BLUE }]}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.pillBtn, generating && { opacity: 0.7 }]} onPress={handleGenerateBill} disabled={generating}>
          {generating ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="receipt-outline" size={rfs(19)} color="white" />}
          <Text style={styles.pillBtnText}> {generating ? "Generating…" : "Generate Bill PDF"}</Text>
        </TouchableOpacity>
        <Text style={[styles.hintText, { textAlign: "center", marginTop: scale(8) }]}>Bills saved to Firebase • PDF exported • Sent via WhatsApp 💬</Text>
      </View>
    </View>
  );
};

// ── User Dashboard ────────────────────────────────────────────────────

export default BillingSection;
