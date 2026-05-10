import { useState } from 'react';
import { Text, View, Pressable, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from '@firebase/firestore';
import * as Haptics from 'expo-haptics';
 
export default function Account() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, deleteAccount } = useAuth();
  const { t } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
 
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
    } catch (err: any) {
      const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? t('account_error_wrong_password')
        : t('account_error_generic');
      Alert.alert(t('account_error_title'), msg);
      setDeleting(false);
    }
  };
 
  return (
    <View style={[acStyles.container, { paddingBottom: insets.bottom + 24 }]}>
      <Text style={acStyles.title}>{t('account_title')}</Text>
      <View style={acStyles.section}>
        <Text style={acStyles.label}>{t('account_signed_in_as')}</Text>
        <Text style={acStyles.email}>{user?.email}</Text>
      </View>
      <View style={acStyles.divider} />
      <Text style={acStyles.dangerLabel}>{t('account_danger_zone')}</Text>
      {!confirming ? (
        <Pressable style={({ pressed }) => [acStyles.deleteButton, pressed && { backgroundColor: '#2d2d4e' }]} onPress={() => setConfirming(true)}>
          <Text style={acStyles.deleteButtonText}>{t('account_delete_button')}</Text>
        </Pressable>
      ) : (
        <View style={acStyles.confirmBox}>
          <Text style={acStyles.confirmWarning}>{t('account_delete_warning')}</Text>
          <TextInput style={acStyles.input} placeholder={t('account_password_placeholder')} placeholderTextColor="#4a4a6a" value={password} onChangeText={setPassword} secureTextEntry autoFocus />
          <Pressable style={({ pressed }) => [acStyles.deleteButton, pressed && { backgroundColor: '#2d2d4e' }]} onPress={handleDelete} disabled={deleting}>
            <Text style={acStyles.deleteButtonText}>{deleting ? t('account_deleting') : t('account_confirm_delete')}</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [acStyles.cancelButton, pressed && { opacity: 0.5 }]} onPress={() => { setConfirming(false); setPassword(''); }}>
            <Text style={acStyles.cancelText}>{t('account_cancel')}</Text>
          </Pressable>
        </View>
      )}
      <Pressable style={({ pressed }) => [acStyles.back, { bottom: insets.bottom + 48 }, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
        <Text style={acStyles.backText}>{t('account_back')}</Text>
      </Pressable>
    </View>
  );
}
 
const acStyles = {
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 24, paddingTop: 60 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 18, marginBottom: 32 } as const,
  section: { marginBottom: 24 } as const,
  label: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 10 } as const,
  email: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 9, lineHeight: 18 } as const,
  divider: { height: 1, backgroundColor: '#2d2d4e', marginVertical: 24 } as const,
  dangerLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 16 } as const,
  deleteButton: { borderWidth: 2, borderColor: '#e2b96f', padding: 16, alignItems: 'center' as const, marginBottom: 12 },
  deleteButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 9 } as const,
  confirmBox: { gap: 0 } as const,
  confirmWarning: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 16, marginBottom: 16 } as const,
  input: { backgroundColor: '#16213e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 14, marginBottom: 12, fontFamily: 'PressStart2P_400Regular', fontSize: 9 } as const,
  cancelButton: { alignItems: 'center' as const, marginTop: 4, marginBottom: 12 },
  cancelText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 } as const,
  back: { position: 'absolute' as const, bottom: 48, left: 24 },
  backText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 } as const,
};
