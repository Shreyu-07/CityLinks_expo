import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FullImageViewer from '../components/FullImageViewer';
import Toast from '../components/Toast';
import { AppContext } from '../context/AppContext';
import { database } from '../services/firebase';
import { Product, QueryItem, Review, UserData } from '../types';
import { rfs, scale } from '../utils/scaling';
import { ACCENT_BLUE, BG_DARK, STATUS_BAR_H, globalStyles as styles, TEXT_DIM, TEXT_WHITE } from '../utils/theme';
import { useToast } from '../utils/useToast';

const ProductDetail = ({ route, navigation }: any) => {
  const { shopId, productId } = route.params;
  const { currentUser } = React.useContext(AppContext);
  const [product, setProduct] = useState<Product | null>(route.params?.productData || null);
  const [shop, setShop] = useState<UserData | null>(route.params?.shopData || null);
  const [reviews, setReviews] = useState<{ [key: string]: Review }>({});
  const [queries, setQueries] = useState<{ [key: string]: QueryItem }>({});
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [answerTexts, setAnswerTexts] = useState<{ [key: string]: string }>({});
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const { toastState, showToast } = useToast();
  const isShopOwner = currentUser?.uid === shopId;

  useEffect(() => {
    const refs: any[] = [
      [database().ref(`products/${productId}`), (s: any) => { if (s.val()) setProduct(s.val()); }],
      [database().ref(`users/${shopId}`), (s: any) => { if (s.val()) setShop(s.val()); }],
      [database().ref(`reviews/${productId}`), (s: any) => setReviews(s.val() || {})],
      [database().ref(`queries/${productId}`), (s: any) => setQueries(s.val() || {})],
    ];
    const ls = refs.map(([ref, cb]) => { const l = ref.on("value", cb); return [ref, l]; });
    return () => ls.forEach(([ref, l]) => ref.off("value", l));
  }, [productId, shopId]);

  const submitReview = async () => {
    if (!currentUser) { showToast("Please login first", "error"); return; }
    if (!selectedRating) { showToast("Select a rating first", "warning"); return; }
    const snap = await database().ref(`users/${currentUser.uid}`).once("value");
    const u = snap.val() || {};
    await database().ref(`reviews/${productId}/${currentUser.uid}`).set({ rating: selectedRating, comment: reviewComment, timestamp: Date.now(), userName: u.fullName || u.shopName || "User" });
    showToast("✅ Review submitted!", "success");
    setSelectedRating(0); setReviewComment("");
  };

  const submitQuery = async () => {
    if (!newQuestion.trim()) { showToast("Enter a question", "warning"); return; }
    const snap = await database().ref(`users/${currentUser!.uid}`).once("value");
    const u = snap.val() || {};
    await database().ref(`queries/${productId}`).push({ userId: currentUser!.uid, userName: u.fullName || u.shopName || "Customer", question: newQuestion, answer: "", timestamp: Date.now(), answerTimestamp: null, answeredBy: null });
    showToast("✅ Question posted!", "success");
    setNewQuestion("");
  };

  const answerQuery = async (qid: string) => {
    const a = answerTexts[qid];
    if (!a?.trim()) return;
    await database().ref(`queries/${productId}/${qid}`).update({ answer: a, answerTimestamp: Date.now(), answeredBy: currentUser!.uid });
    showToast("✅ Answer posted!", "success");
    setAnswerTexts((p) => ({ ...p, [qid]: "" }));
  };

  const addToCart = async () => {
    if (!currentUser) { showToast("Please login to add to cart", "error"); return; }
    await database().ref(`carts/${currentUser.uid}/${productId}`).set({ productId, shopId, added: Date.now() });
    showToast("✅ Added to cart!", "success");
  };

  if (!product) return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={ACCENT_BLUE} /></View>;

  const revArr = Object.values(reviews);
  const avgRating = revArr.length ? (revArr.reduce((a, r) => a + r.rating, 0) / revArr.length).toFixed(1) : null;
  const productImageUri = product.photo || "https://via.placeholder.com/300?text=📦";

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_DARK} />
      <Toast message={toastState.message} type={toastState.type} visible={toastState.visible} />
      <FullImageViewer uri={productImageUri} visible={imageViewerVisible} onClose={() => setImageViewerVisible(false)} />

      <ScrollView contentContainerStyle={{ paddingBottom: scale(40) }}>
        <View style={[styles.topBar, { backgroundColor: BG_DARK, paddingTop: STATUS_BAR_H + scale(10), paddingBottom: scale(14) }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.topBarIconBtn}>
            <Ionicons name="arrow-back" size={rfs(20)} color={TEXT_WHITE} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>{product.name}</Text>
          <View style={{ width: scale(40) }} />
        </View>

        <View style={styles.detailCard}>
          <TouchableOpacity onPress={() => setImageViewerVisible(true)} activeOpacity={0.9}>
            <Image source={{ uri: productImageUri }} style={styles.detailImg} />
            <View style={styles.zoomHint}>
              <Ionicons name="expand-outline" size={rfs(14)} color="white" />
              <Text style={styles.zoomHintText}>Tap to view full image</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.detailBody}>
            <Text style={styles.detailName}>{product.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.detailPrice}>₹{product.price}</Text>
              <Text style={styles.productQty}>{product.quantity}</Text>
            </View>
            {product.note ? <Text style={styles.productNote}>{product.note}</Text> : null}
            {/* Show barcode on product detail if present */}
            {product.barcodeNumber ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6), marginTop: scale(6) }}>
                <Ionicons name="barcode-outline" size={rfs(13)} color={TEXT_DIM} />
                <Text style={{ color: TEXT_DIM, fontSize: rfs(11), fontWeight: "600" }}>Barcode: {product.barcodeNumber}</Text>
              </View>
            ) : null}
            <Text style={styles.shopRef}>🏪 {shop?.shopName || "Loading…"}</Text>
            {!isShopOwner && currentUser && (
              <TouchableOpacity style={styles.addCartBtnLg} onPress={addToCart}>
                <Ionicons name="cart-outline" size={rfs(17)} color="white" />
                <Text style={[styles.pillBtnText, { marginLeft: scale(8) }]}>Add to Cart</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Reviews</Text>
            {avgRating && <View style={styles.ratingPill}><Text style={styles.ratingPillText}>{avgRating} / 5</Text></View>}
          </View>
          {revArr.length === 0 && <Text style={styles.emptyText}>No reviews yet. Be first!</Text>}
          {Object.entries(reviews).map(([uid, rev]) => (
            <View key={uid} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Text style={styles.reviewUser}>{rev.userName}</Text>
                <Text style={styles.reviewStars}>{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</Text>
              </View>
              {rev.comment ? <Text style={styles.reviewComment}>{rev.comment}</Text> : null}
            </View>
          ))}
          {!isShopOwner && currentUser && (
            <View style={styles.addReview}>
              <Text style={styles.subSectionTitle}>Leave a Review</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TouchableOpacity key={i} onPress={() => setSelectedRating(i)}>
                    <Ionicons name={i <= selectedRating ? "star" : "star-outline"} size={scale(28)} color="#fbbf24" />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={[styles.input, { height: scale(70), textAlignVertical: "top" }]} placeholder="Your thoughts…" multiline value={reviewComment} onChangeText={setReviewComment} />
              <TouchableOpacity style={styles.smallPillBtn} onPress={submitReview}>
                <Ionicons name="send-outline" size={rfs(12)} color="white" />
                <Text style={styles.smallPillBtnText}> Submit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, { marginBottom: scale(16) }]}>
          <Text style={styles.sectionTitle}>💬 Q&A</Text>
          {Object.keys(queries).length === 0 && <Text style={styles.emptyText}>No questions yet.</Text>}
          {Object.entries(queries).map(([qid, q]) => (
            <View key={qid} style={styles.qCard}>
              <Text style={styles.qUser}>{q.userName}</Text>
              <Text style={styles.qQuestion}>Q: {q.question}</Text>
              {q.answer
                ? <View style={styles.answerBox}><Text style={styles.answerText}>A: {q.answer}</Text></View>
                : isShopOwner ? (
                  <>
                    <TextInput style={[styles.input, { marginTop: scale(8) }]} placeholder="Write your answer…" value={answerTexts[qid] || ""} onChangeText={(t) => setAnswerTexts((p) => ({ ...p, [qid]: t }))} />
                    <TouchableOpacity style={styles.smallPillBtn} onPress={() => answerQuery(qid)}><Text style={styles.smallPillBtnText}>Post Answer</Text></TouchableOpacity>
                  </>
                ) : <Text style={styles.awaitingText}>⏳ Awaiting shopkeeper reply</Text>}
            </View>
          ))}
          {!isShopOwner && currentUser && (
            <View style={styles.addReview}>
              <Text style={styles.subSectionTitle}>Ask a Question</Text>
              <TextInput style={[styles.input, { height: scale(70), textAlignVertical: "top" }]} placeholder="Type your question…" multiline value={newQuestion} onChangeText={setNewQuestion} />
              <TouchableOpacity style={styles.smallPillBtn} onPress={submitQuery}>
                <Ionicons name="chatbubble-outline" size={rfs(12)} color="white" />
                <Text style={styles.smallPillBtnText}> Ask</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ── Cart ──────────────────────────────────────────────────────────────

export default ProductDetail;
