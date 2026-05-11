import { initializeApp } from "@firebase/app";
import * as FirebaseAuth from "@firebase/auth";
import { getFirestore } from "@firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { getReactNativePersistence, initializeAuth } = FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence: (storage: typeof AsyncStorage) => FirebaseAuth.Persistence;
};

const firebaseConfig = {
  apiKey: "AIzaSyAdlkVAn6mEfGGLocdO5cEpzkrgb3Q_37Y",
  authDomain: "grimoire-f420b.firebaseapp.com",
  projectId: "grimoire-f420b",
  storageBucket: "grimoire-f420b.firebasestorage.app",
  messagingSenderId: "126736363920",
  appId: "1:126736363920:web:fe5a12f7f96cd61f854315"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
