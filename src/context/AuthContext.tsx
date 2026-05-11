import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, reauthenticateWithCredential, EmailAuthProvider, deleteUser, sendPasswordResetEmail } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebase';
import { loginUser as rcLoginUser } from '../services/revenueCat';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string, beforeDelete?: (uid: string) => Promise<void>) => Promise<void>;
};

const AUTH_KEY = 'grimoire_user_email';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        rcLoginUser(firebaseUser.uid).catch(console.warn);
      }
    });
    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      register: async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
      },
      login: async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      resetPassword: async (email: string) => {
        await sendPasswordResetEmail(auth, email);
      },
      logout: async () => {
        await AsyncStorage.removeItem(AUTH_KEY);
        await signOut(auth);
        setUser(null);
      },
      deleteAccount: async (password: string, beforeDelete?: (uid: string) => Promise<void>) => {
        if (!auth.currentUser?.email) throw new Error('No user');
        // Re-authenticate before deletion (Firebase requirement)
        const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await beforeDelete?.(auth.currentUser.uid);
        await deleteUser(auth.currentUser);
        await AsyncStorage.removeItem(AUTH_KEY);
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
