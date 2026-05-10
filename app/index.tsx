import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import PressableScale from '../src/components/PressableScale';
import { ensureAdminProfile, getUserProfile } from '../lib/firestore';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
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
    let alive = true;

    async function routeAuthenticatedUser() {
      if (!user) return;

      try {
        const profile = await getUserProfile(user.uid) ?? await ensureAdminProfile(user.uid, user.email);
        if (!alive) return;
        router.replace(profile ? '/home' : '/character-setup');
      } catch (error) {
        console.error(error);
        if (alive) router.replace('/character-setup');
      }
    }

    if (onboardingChecked && !loading && user) {
      routeAuthenticatedUser();
    }

    return () => {
      alive = false;
    };
  }, [onboardingChecked, loading, user]);

  // Show nothing until both auth and onboarding checks resolve
  if (loading || !onboardingChecked) {
    return (
      <View style={styles.container}>
        <View style={styles.logoBlock}>
          <View style={styles.logoLine} />
          <Text style={styles.title}>{t('grimoire_title')}</Text>
          <View style={styles.logoLine} />
          <Text style={styles.subtitle}>{t('app_tagline')}</Text>
        </View>
      </View>
    );
  }

  if (user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.logoBlock}>
        <View style={styles.logoLine} />
        <Text style={styles.title}>{t('grimoire_title')}</Text>
        <View style={styles.logoLine} />
        <Text style={styles.subtitle}>{t('app_tagline')}</Text>
      </View>
      <PressableScale
        style={styles.button}
        onPress={() => router.push('/login')}
      >
        <Text style={styles.buttonText}>{t('login_title')}</Text>
      </PressableScale>
      <PressableScale
        style={[styles.button, styles.secondary]}
        onPress={() => router.push('/register')}
      >
        <Text style={styles.buttonText}>{t('register_title')}</Text>
      </PressableScale>
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
    textAlign: 'center' as const,
    textShadowColor: '#c8a84b',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 10,
    lineHeight: 18,
    marginBottom: 48,
    textAlign: 'center' as const,
  },
  logoBlock: {
    width: '100%' as const,
    alignItems: 'center' as const,
    marginBottom: 32,
  },
  logoLine: {
    width: 220,
    height: 1,
    backgroundColor: '#c8a84b',
    marginVertical: 14,
    opacity: 0.8,
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
