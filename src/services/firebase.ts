import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
// @ts-ignore - The type definitions in some Firebase versions do not export getReactNativePersistence even though it exists at runtime.
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FIREBASE_API_KEY } from "../utils/constants";

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "citylinks-50790.firebaseapp.com",
  projectId: "citylinks-50790",
  storageBucket: "citylinks-50790.firebasestorage.app",
  messagingSenderId: "712023357198",
  appId: "1:712023357198:web:6494d62847254cdb5d495f",
  measurementId: "G-HN0F5TTTN1"
};

let app;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
  initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  app = firebase.app();
}

export const auth = firebase.auth;
export const database = firebase.database;
