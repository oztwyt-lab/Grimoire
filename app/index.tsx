import { useEffect, useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    // Check onboarding before auth redirect so we never flash the wrong screen
    const checkOnboarding = async () => {
      const done = await AsyncStorage.getItem('onboarding_done');
      if (!done) {
        router.replace('/onboarding');
        return;
      }
      setOnboardingChecked(true);
    };
    if (!loading) checkOnboarding();
  }, [loading]);

  useEffect(() => {
    if (onboardingChecked && !loading && user) {
      router.replace('/home');
    }
  }, [onboardingChecked, loading, user]);

  // Show nothing until both auth and onboarding checks resolve
  if (loading || !onboardingChecked) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>GRIMOR</Text>
      </View>
    );
  }

  if (user) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GRIMOR</Text>
      <Text style={styles.subtitle}>Your recipe spellbook</Text>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && { backgroundColor: '#2d2d4e' }]}
        onPress={() => router.push('/login')}
      >
        <Text style={styles.buttonText}>LOG IN</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.button, styles.secondary, pressed && { backgroundColor: '#2d2d4e' }]}
        onPress={() => router.push('/register')}
      >
        <Text style={styles.buttonText}>NEW GAME</Text>
      </Pressable>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 24,
  },
  title: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#e2b96f',
    fontSize: 28,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 10,
    marginBottom: 48,
    textAlign: 'center' as const,
  },
  button: {
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#e2b96f',
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginVertical: 8,
    width: '100%' as const,
    alignItems: 'center' as const,
  },
  secondary: {
    borderColor: '#2d2d4e',
  },
  buttonText: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#e2b96f',
    fontSize: 12,
  },
};
