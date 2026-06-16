export interface LatLng { latitude: number; longitude: number; }
export interface GlobalStoreType {
  shops: Record<string, any>;
  products: Record<string, any>;
  cartCount: number;
  userLocation: LatLng | null;
}
export type UserRole = "user" | "shopkeeper" | null;
export interface UserData {
  email?: string; role?: UserRole; fullName?: string; shopName?: string;
  photoURL?: string; shopPhoto?: string; note?: string; about?: string;
  type?: string; age?: string; gender?: string; phone?: string; location?: string;
  createdAt?: number; latitude?: number; longitude?: number;
  gstNumber?: string; panNumber?: string; shopRegNumber?: string; bankAccount?: string;
}
export interface Product {
  id?: string; shopId: string; name: string; quantity: string; price: string;
  photo?: string; note?: string; category?: string; timestamp: number;
  barcodeNumber?: string; // ── FIX 2: added barcode field
}
export interface Review {
  id?: string; rating: number; comment: string; timestamp: number; userName: string;
}
export interface QueryItem {
  id?: string; userId: string; userName: string; question: string; answer: string;
  timestamp: number; answerTimestamp: number | null; answeredBy: string | null;
}
