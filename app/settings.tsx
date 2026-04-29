import { useState } from 'react';
import { Text, View, Pressable, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from '@firebase/firestore';
import * as Haptics from 'expo-haptics';

export default function Settings() {
  const router = useRouter();
  const { user, deleteAccount, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleDelete = async () => {
    if (!password.trim()) return;
    setDeleting(true);
    try {
      const q = query(collection(db, 'recipes'), where('userId', '==', user?.uid));
      const snapshot = await getDocs(q);
      await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, 'recipes', d.id))));
      await deleteAccount(password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const msg = code === 'auth/wrong-password' || code === 'auth/invalid-credential'
        ? t('account_error_wrong_password')
        : t('account_error_generic');
      Alert.alert(t('account_error_title'), msg);
      setDeleting(false);
    }
  };

  return (
    <ScrollView style={sStyles.container} contentContainerStyle={sStyles.content}>

      <Pressable style={({ pressed }) => [pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
        <Text style={sStyles.back}>{t('settings_back')}</Text>
      </Pressable>

      <Text style={sStyles.title}>{t('settings_title')}</Text>

      {/* ─── Account ──────────────────────────────────────────────────────── */}
      <View style={sStyles.section}>
        <Text style={sStyles.sectionLabel}>{t('settings_account')}</Text>
        <Text style={sStyles.email}>{user?.email}</Text>
      </View>

      <View style={sStyles.divider} />

      {/* ─── Language ─────────────────────────────────────────────────────── */}
      <View style={sStyles.section}>
        <Text style={sStyles.sectionLabel}>{t('settings_language')}</Text>
        <View style={sStyles.langRow}>
          <Pressable
            style={[sStyles.langButton, language === 'en' && sStyles.langButtonActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[sStyles.langText, language === 'en' && sStyles.langTextActive]}>
              {t('lang_english')}
            </Text>
          </Pressable>
          <Pressable
            style={[sStyles.langButton, language === 'tr' && sStyles.langButtonActive]}
            onPress={() => setLanguage('tr')}
          >
            <Text style={[sStyles.langText, language === 'tr' && sStyles.langTextActive]}>
              {t('lang_turkish')}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={sStyles.divider} />

      {/* ─── Danger Zone ──────────────────────────────────────────────────── */}
      <Text style={sStyles.dangerLabel}>{t('settings_danger')}</Text>
      <Pressable
        style={({ pressed }) => [sStyles.deleteButton, pressed && { opacity: 0.8 }]}
        onPress={handleLogout}
      >
        <Text style={sStyles.deleteButtonText}>{t('settings_logout')}</Text>
      </Pressable>
      {!confirming ? (
        <Pressable
          style={({ pressed }) => [sStyles.deleteButton, pressed && { opacity: 0.8 }]}
          onPress={() => setConfirming(true)}
        >
          <Text style={sStyles.deleteButtonText}>{t('settings_delete')}</Text>
        </Pressable>
      ) : (
        <View>
          <Text style={sStyles.confirmWarning}>{t('account_delete_warning')}</Text>
          <TextInput
            style={sStyles.input}
            placeholder={t('account_password_placeholder')}
            placeholderTextColor="#4a4a6a"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoFocus
          />
          <Pressable
            style={({ pressed }) => [sStyles.deleteButton, pressed && { opacity: 0.8 }]}
            onPress={handleDelete}
            disabled={deleting}
          >
            <Text style={sStyles.deleteButtonText}>
              {deleting ? t('account_deleting') : t('account_confirm_delete')}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.5 }]}
            onPress={() => { setConfirming(false); setPassword(''); }}
          >
            <Text style={sStyles.cancelText}>{t('account_cancel')}</Text>
          </Pressable>
        </View>
      )}

    </ScrollView>
  );
}

const sStyles = {
  container: { flex: 1, backgroundColor: '#1a1a2e' } as const,
  content: { padding: 24, paddingTop: 60, paddingBottom: 48 } as const,
  back: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 32 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 16, marginBottom: 32 } as const,
  section: { marginBottom: 24 } as const,
  sectionLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 12 } as const,
  email: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 16 } as const,
  divider: { height: 1, backgroundColor: '#2d2d4e', marginVertical: 24 } as const,
  langRow: { flexDirection: 'row' as const, gap: 12 },
  langButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2d2d4e',
    backgroundColor: '#16213e',
    padding: 14,
    alignItems: 'center' as const,
  },
  langButtonActive: { borderColor: '#e2b96f' } as const,
  langText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 } as const,
  langTextActive: { color: '#e2b96f' } as const,
  dangerLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 16 } as const,
  deleteButton: {
    borderWidth: 2,
    borderColor: '#c0392b',
    padding: 16,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  deleteButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#c0392b', fontSize: 9 } as const,
  confirmWarning: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 16, marginBottom: 16 } as const,
  input: { backgroundColor: '#16213e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 14, marginBottom: 12, fontFamily: 'PressStart2P_400Regular', fontSize: 9 } as const,
  cancelText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', textAlign: 'center' as const, fontSize: 8, marginTop: 4 },
};
