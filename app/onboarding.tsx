import { useState } from 'react';
import { Text, View, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// ─── Slide definitions ───────────────────────────────────────────────────────
const SLIDES = [
  {
    key: 'welcome',
    icon: '📖',
    title: 'GRIMOIRE',
    subtitle: 'YOUR RECIPE\nSPELLBOOK',
    body: 'A tome of culinary magic passed down through the ages. Now it belongs to you.',
  },
  {
    key: 'craft',
    icon: '⚗️',
    title: 'CRAFT\nRECIPES',
    subtitle: null,
    body: 'Select from hundreds of mystical ingredients. Write your preparation rituals. Forge legendary dishes.',
    ingredients: ['🥩', '🧄', '🍋', '🌿', '🧂', '🫒'],
  },
  {
    key: 'collect',
    icon: '🏆',
    title: 'BUILD YOUR\nCOLLECTION',
    subtitle: null,
    body: 'Every recipe you save is inscribed forever in your Grimoire. Browse, edit, and master your craft.',
  },
  {
    key: 'begin',
    icon: '⚔️',
    title: 'THE QUEST\nBEGINS',
    subtitle: null,
    body: 'Your legend starts now, hero. Are you ready to write it?',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide];

  // ─── Mark onboarding done and navigate ──────────────────────────────────
  const finish = async (dest: '/register' | '/login') => {
    await AsyncStorage.setItem('onboarding_done', 'true');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(dest);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSlide(s => s + 1);
  };

  return (
    <View style={styles.container}>

      {/* ─── Skip button (top right) ──────────────────────────────────────── */}
      {!isLast && (
        <Pressable
          style={({ pressed }) => [styles.skip, pressed && { opacity: 0.5 }]}
          onPress={() => finish('/register')}
        >
          <Text style={styles.skipText}>SKIP</Text>
        </Pressable>
      )}

      {/* ─── Slide content ────────────────────────────────────────────────── */}
      <View style={styles.content}>
        <Text style={styles.icon}>{current.icon}</Text>
        <Text style={styles.title}>{current.title}</Text>
        {current.subtitle && (
          <Text style={styles.subtitle}>{current.subtitle}</Text>
        )}

        {/* Ingredient preview grid (slide 2 only) */}
        {current.ingredients && (
          <View style={styles.ingredientRow}>
            {current.ingredients.map((emoji, i) => (
              <View key={i} style={styles.ingredientTile}>
                <Text style={styles.ingredientEmoji}>{emoji}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.body}>{current.body}</Text>
      </View>

      {/* ─── Dot indicators ───────────────────────────────────────────────── */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === slide && styles.dotActive]} />
        ))}
      </View>

      {/* ─── CTA buttons ──────────────────────────────────────────────────── */}
      {isLast ? (
        <View style={styles.finalButtons}>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && { backgroundColor: '#2d2d4e' }]}
            onPress={() => finish('/register')}
          >
            <Text style={styles.buttonText}>BEGIN QUEST</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.button, styles.buttonSecondary, pressed && { backgroundColor: '#16213e' }]}
            onPress={() => finish('/login')}
          >
            <Text style={[styles.buttonText, styles.buttonTextMuted]}>I HAVE AN ACCOUNT</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.button, pressed && { backgroundColor: '#2d2d4e' }]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>NEXT  ▶</Text>
        </Pressable>
      )}

    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 48,
    justifyContent: 'space-between' as const,
  },
  skip: {
    position: 'absolute' as const,
    top: 56,
    right: 24,
  },
  skipText: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 8,
  },
  icon: {
    fontSize: 64,
    marginBottom: 32,
  },
  title: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#e2b96f',
    fontSize: 18,
    textAlign: 'center' as const,
    lineHeight: 30,
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 9,
    textAlign: 'center' as const,
    lineHeight: 18,
    marginBottom: 24,
  },
  body: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#c8c8e8',
    fontSize: 9,
    textAlign: 'center' as const,
    lineHeight: 18,
    marginTop: 24,
  },
  ingredientRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    gap: 10,
    marginTop: 8,
  },
  ingredientTile: {
    width: 52,
    height: 52,
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#2d2d4e',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  ingredientEmoji: {
    fontSize: 24,
  },
  dots: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 6,
    height: 6,
    backgroundColor: '#2d2d4e',
  },
  dotActive: {
    backgroundColor: '#e2b96f',
    width: 18,
  },
  finalButtons: {
    gap: 12,
  },
  button: {
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#e2b96f',
    paddingVertical: 16,
    alignItems: 'center' as const,
  },
  buttonSecondary: {
    borderColor: '#2d2d4e',
  },
  buttonText: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#e2b96f',
    fontSize: 11,
  },
  buttonTextMuted: {
    color: '#4a4a6a',
    fontSize: 9,
  },
};
