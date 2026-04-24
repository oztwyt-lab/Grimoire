import { initializeApp } from "@firebase/app";
import { initializeAuth, inMemoryPersistence } from "@firebase/auth";
import { getFirestore } from "@firebase/firestore";

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
  persistence: inMemoryPersistence,
});
export const db = getFirestore(app);