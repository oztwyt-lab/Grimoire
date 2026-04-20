// ═══════════════════════════════════════════════════════════════════════════════
// app/register.tsx
// ═══════════════════════════════════════════════════════════════════════════════
import { useState } from 'react';
import { Text, TextInput, View, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await register(email, password);
      router.replace('/character-setup');
    } catch (error) {
      Alert.alert(t('register_failed_title'), String(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={registerStyles.container}>
      <Text style={registerStyles.title}>{t('register_title')}</Text>
      <TextInput
        style={registerStyles.input}
        placeholder={t('register_email')}
        placeholderTextColor="#4a4a6a"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={registerStyles.input}
        placeholder={t('register_password')}
        placeholderTextColor="#4a4a6a"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable
        style={({ pressed }) => [registerStyles.button, pressed && { backgroundColor: '#2d2d4e' }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={registerStyles.buttonText}>
          {submitting ? t('register_creating') : t('register_create')}
        </Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [pressed && { opacity: 0.5 }]}
        onPress={() => router.push('/login')}
      >
        <Text style={registerStyles.link}>{t('register_have_account')}</Text>
      </Pressable>
    </View>
  );
}

const registerStyles = {
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 24, justifyContent: 'center' as const },
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 20, marginBottom: 32, textAlign: 'center' as const },
  input: { backgroundColor: '#16213e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 16, marginBottom: 16, fontFamily: 'PressStart2P_400Regular', fontSize: 9 } as const,
  button: { backgroundColor: '#16213e', borderWidth: 2, borderColor: '#e2b96f', padding: 16, alignItems: 'center' as const, marginBottom: 16 },
  buttonText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10 } as const,
  link: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', textAlign: 'center' as const, fontSize: 8 },
};
