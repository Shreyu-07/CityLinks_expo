import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import { FIREBASE_API_KEY } from "../utils/constants";

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "fir-dddb2.firebaseapp.com",
  databaseURL: "https://fir-dddb2-default-rtdb.firebaseio.com",
  projectId: "fir-dddb2",
  storageBucket: "fir-dddb2.firebasestorage.app",
  messagingSenderId: "374284591449",
  appId: "1:374284591449:web:dd28359035026950946c48",
  measurementId: "G-2C2BMLHGWJ",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth;
export const database = firebase.database;
