// ─── app/login.tsx ───────────────────────────────────────────────────────────
import { useState } from 'react';
import { Text, TextInput, View, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/home');
    } catch (error) {
      Alert.alert(t('login_failed_title'), t('login_failed_msg'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* ─── Language toggle — pinned to top ─────────────────────────────── */}
      <View style={styles.langRow}>
        <Pressable
          style={[styles.langButton, language === 'en' && styles.langButtonActive]}
          onPress={() => setLanguage('en')}
        >
          <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
            {t('login_lang_en')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.langButton, language === 'tr' && styles.langButtonActive]}
          onPress={() => setLanguage('tr')}
        >
          <Text style={[styles.langText, language === 'tr' && styles.langTextActive]}>
            {t('login_lang_tr')}
          </Text>
        </Pressable>
      </View>

      {/* ─── Centered form ───────────────────────────────────────────────── */}
      <View style={styles.form}>
        <Text style={styles.title}>{t('login_title')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('login_email')}
          placeholderTextColor="#4a4a6a"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder={t('login_password')}
          placeholderTextColor="#4a4a6a"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable
          style={({ pressed }) => [styles.button, pressed && { backgroundColor: '#2d2d4e' }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting ? t('login_signing_in') : t('login_sign_in')}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [pressed && { opacity: 0.5 }]}
          onPress={() => router.push('/register')}
        >
          <Text style={styles.link}>{t('login_create_account')}</Text>
        </Pressable>
      </View>

    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 24 } as const,
  langRow: { flexDirection: 'row' as const, justifyContent: 'flex-end' as const, paddingTop: 52, gap: 8 },
  langButton: { borderWidth: 1, borderColor: '#2d2d4e', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#16213e' },
  langButtonActive: { borderColor: '#e2b96f' },
  langText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 } as const,
  langTextActive: { color: '#e2b96f' } as const,
  form: { flex: 1, justifyContent: 'center' as const },
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 20, marginBottom: 32, textAlign: 'center' as const },
  input: { backgroundColor: '#16213e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 16, marginBottom: 16, fontFamily: 'PressStart2P_400Regular', fontSize: 9 } as const,
  button: { backgroundColor: '#16213e', borderWidth: 2, borderColor: '#e2b96f', padding: 16, alignItems: 'center' as const, marginBottom: 16 },
  buttonText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10 } as const,
  link: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', textAlign: 'center' as const, fontSize: 8 },
};