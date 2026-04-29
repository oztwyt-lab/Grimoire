import { useState, useEffect, useRef } from 'react';
import { View, Text, Alert, ScrollView, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from '@firebase/firestore';
import { db } from '../../firebase';
import { useLanguage } from '../../src/context/LanguageContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import PressableScale from '../../src/components/PressableScale';
import { getActionEmoji } from '../../src/utils/actionEmoji';

type CookStep = { id: string; text: string; duration: number | null };

type RawRecipe = {
  id: string;
  name: string;
  steps: CookStep[] | string;
  preparation?: string;
};

function splitTextToSteps(raw: string): CookStep[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const lines = trimmed.includes('\n')
    ? trimmed.split('\n').map(l => l.trim()).filter(Boolean)
    : trimmed.split(/\.\s+/).map(l => l.trim()).filter(Boolean);
  return lines.map((text, i) => ({
    id: String(i),
    text: text.replace(/^\d+[.)]\s*/, ''),
    duration: null,
  }));
}

function normalizeSteps(recipe: RawRecipe): CookStep[] {
  if (Array.isArray(recipe.steps) && recipe.steps.length > 0) {
    return recipe.steps.map((s, i) => ({
      id: s.id ?? String(i),
      text: s.text ?? '',
      duration: s.duration ?? null,
    }));
  }
  if (typeof recipe.steps === 'string' && recipe.steps.trim()) {
    return splitTextToSteps(recipe.steps);
  }
  if (recipe.preparation && typeof recipe.preparation === 'string') {
    return splitTextToSteps(recipe.preparation);
  }
  return [];
}

function parseDuration(text: string): string | null {
  const m = text.match(/(\d+)\s*(min|minute|minutes)/i);
  return m ? `⏱ ${m[1]} min` : null;
}

export default function CookMode() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const { width: screenWidth } = useWindowDimensions();

  const [recipe, setRecipe] = useState<RawRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [barContainerWidth, setBarContainerWidth] = useState(0);

  const slideX = useSharedValue(0);
  const contentOpacity = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const modalY = useSharedValue(300);
  const modalOpacity = useSharedValue(0);

  const directionRef = useRef<'forward' | 'back'>('forward');
  const isFirstStepRender = useRef(true);

  const steps = recipe ? normalizeSteps(recipe) : [];
  const totalSteps = steps.length;
  const isLastStep = totalSteps > 0 && currentStep === totalSteps - 1;
  const activeStep = steps[currentStep];

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'recipes', id));
        if (snap.exists()) setRecipe({ id: snap.id, ...snap.data() } as RawRecipe);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  useEffect(() => {
    if (barContainerWidth > 0 && totalSteps > 0) {
      progressWidth.value = withTiming(
        ((currentStep + 1) / totalSteps) * barContainerWidth,
        { duration: 300 }
      );
    }
  }, [currentStep, barContainerWidth, totalSteps]);

  useEffect(() => {
    if (isFirstStepRender.current) {
      isFirstStepRender.current = false;
      return;
    }
    const inX = directionRef.current === 'forward' ? screenWidth : -screenWidth;
    slideX.value = inX;
    slideX.value = withTiming(0, { duration: 200 });
    contentOpacity.value = withTiming(1, { duration: 200 });
  }, [currentStep]);

  useEffect(() => {
    if (showCompletion) {
      modalY.value = withSpring(0, { damping: 15, stiffness: 100 });
      modalOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [showCompletion]);

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
    opacity: contentOpacity.value,
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  const animatedModalCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalY.value }],
    opacity: modalOpacity.value,
  }));

  function goToStep(newStep: number, dir: 'forward' | 'back') {
    directionRef.current = dir;
    const outX = dir === 'forward' ? -screenWidth : screenWidth;

    slideX.value = withTiming(outX, { duration: 200 });
    contentOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
      'worklet';
      if (!finished) return;
      runOnJS(setCurrentStep)(newStep);
    });
  }

  function handleExit() {
    Alert.alert(t('cook_exit_confirm'), '', [
      { text: t('cook_exit_no'), style: 'cancel' },
      { text: t('cook_exit_yes'), onPress: () => router.back() },
    ]);
  }

  if (loading) {
    return (
      <View style={cStyles.center}>
        <Text style={cStyles.mutedText}>...</Text>
      </View>
    );
  }

  if (!recipe || totalSteps === 0) {
    return (
      <View style={cStyles.center}>
        <Text style={cStyles.errorText}>
          {!recipe ? 'Recipe not found.' : t('cook_no_steps')}
        </Text>
        <PressableScale onPress={() => router.back()}>
          <View style={cStyles.errorBackButton}>
            <Text style={cStyles.mutedText}>◀ {t('cook_back')}</Text>
          </View>
        </PressableScale>
      </View>
    );
  }

  const stepText = activeStep?.text ?? '';
  const emoji = getActionEmoji(stepText);
  const durationStr = activeStep?.duration
    ? `⏱ ${activeStep.duration} min`
    : parseDuration(stepText);

  return (
    <View style={cStyles.container}>
      {/* Top bar */}
      <View style={cStyles.topBar}>
        <PressableScale onPress={handleExit} style={cStyles.exitHitArea}>
          <Text style={cStyles.exitText}>✕</Text>
        </PressableScale>
        <Text style={cStyles.topTitle} numberOfLines={1}>
          {recipe.name.toUpperCase()}
        </Text>
        <Text style={cStyles.stepCounter}>
          {currentStep + 1} / {totalSteps}
        </Text>
      </View>

      {/* Progress bar */}
      <View
        style={cStyles.progressContainer}
        onLayout={(e) => setBarContainerWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[cStyles.progressFill, animatedProgressStyle]} />
      </View>

      {/* Step content */}
      <Animated.View style={[cStyles.contentArea, animatedContentStyle]}>
        <Text style={cStyles.stepLabel}>
          {t('cook_step')} {currentStep + 1}
        </Text>
        <Text style={cStyles.actionEmoji}>{emoji}</Text>
        <ScrollView
          style={cStyles.stepScroll}
          contentContainerStyle={cStyles.stepScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={cStyles.stepText}>{stepText}</Text>
          {durationStr && (
            <View style={cStyles.durationBadge}>
              <Text style={cStyles.durationText}>{durationStr}</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Bottom buttons */}
      <View style={cStyles.bottomArea}>
        {currentStep > 0 && !isLastStep && (
          <PressableScale
            onPress={() => goToStep(currentStep - 1, 'back')}
            style={cStyles.backLinkWrapper}
          >
            <Text style={cStyles.backLinkText}>← {t('cook_back')}</Text>
          </PressableScale>
        )}
        {isLastStep ? (
          <PressableScale
            onPress={() => setShowCompletion(true)}
            style={cStyles.fullWidthButton}
          >
            <View style={cStyles.doneButtonInner}>
              <Text style={cStyles.doneButtonText}>✓ {t('cook_done')}</Text>
            </View>
          </PressableScale>
        ) : (
          <PressableScale
            onPress={() => goToStep(currentStep + 1, 'forward')}
            style={cStyles.fullWidthButton}
          >
            <View style={cStyles.nextButtonInner}>
              <Text style={cStyles.nextButtonText}>{t('cook_next')} →</Text>
            </View>
          </PressableScale>
        )}
      </View>

      {/* Completion modal */}
      {showCompletion && (
        <View style={cStyles.completionOverlay}>
          <Animated.View style={[cStyles.completionCard, animatedModalCardStyle]}>
            <Text style={cStyles.completionEmoji}>🎉</Text>
            <Text style={cStyles.completionTitle}>{t('cook_complete_title')}</Text>
            <Text style={cStyles.completionRecipeName}>{recipe.name}</Text>
            <PressableScale onPress={() => router.back()} style={cStyles.fullWidthButton}>
              <View style={cStyles.completionButtonMuted}>
                <Text style={cStyles.completionButtonMutedText}>{t('cook_back_to_recipe')}</Text>
              </View>
            </PressableScale>
            <PressableScale onPress={() => router.replace('/')} style={cStyles.fullWidthButton}>
              <View style={cStyles.completionButtonGold}>
                <Text style={cStyles.completionButtonGoldText}>{t('cook_home')}</Text>
              </View>
            </PressableScale>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const cStyles = {
  container: { flex: 1, backgroundColor: '#16213e', paddingTop: 48 } as const,
  center: {
    flex: 1,
    backgroundColor: '#16213e',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 24,
  },
  mutedText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 } as const,
  errorText: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#c8c8e8',
    fontSize: 9,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 24,
  },
  errorBackButton: { borderWidth: 1, borderColor: '#4a4a6a', paddingHorizontal: 20, paddingVertical: 14 } as const,
  topBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  exitHitArea: { width: 36, height: 36, alignItems: 'center' as const, justifyContent: 'center' as const },
  exitText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 14 } as const,
  topTitle: { flex: 1, fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 7, textAlign: 'center' as const },
  stepCounter: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, minWidth: 40, textAlign: 'right' as const },
  progressContainer: { height: 6, backgroundColor: '#2a2a4a', marginHorizontal: 16, marginBottom: 4 } as const,
  progressFill: { height: 6, backgroundColor: '#c8a84b' } as const,
  contentArea: { flex: 1, paddingHorizontal: 24, paddingTop: 20, alignItems: 'center' as const, overflow: 'hidden' as const },
  stepLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 20, alignSelf: 'flex-start' as const },
  actionEmoji: { fontSize: 64, marginBottom: 20 } as const,
  stepScroll: { flex: 1, width: '100%' } as const,
  stepScrollContent: { flexGrow: 1, alignItems: 'center' as const, paddingBottom: 16 },
  stepText: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 10, textAlign: 'center' as const, lineHeight: 24 } as const,
  durationBadge: { marginTop: 20, borderWidth: 1, borderColor: '#c8a84b', paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'center' as const },
  durationText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 } as const,
  bottomArea: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12, gap: 12 } as const,
  backLinkWrapper: { alignSelf: 'center' as const },
  backLinkText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 } as const,
  fullWidthButton: { width: '100%' } as const,
  nextButtonInner: { borderWidth: 1, borderColor: '#e2b96f', padding: 20, alignItems: 'center' as const },
  nextButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10 } as const,
  doneButtonInner: { backgroundColor: '#c8a84b', padding: 20, alignItems: 'center' as const },
  doneButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#1a1a2e', fontSize: 10 } as const,
  completionOverlay: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center' as const, justifyContent: 'center' as const, padding: 24 },
  completionCard: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', padding: 32, alignItems: 'center' as const, width: '100%' as const, gap: 16 },
  completionEmoji: { fontSize: 64 } as const,
  completionTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 12, textAlign: 'center' as const, lineHeight: 26 },
  completionRecipeName: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, textAlign: 'center' as const, marginBottom: 8 },
  completionButtonMuted: { borderWidth: 1, borderColor: '#4a4a6a', padding: 16, alignItems: 'center' as const },
  completionButtonMutedText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 } as const,
  completionButtonGold: { borderWidth: 1, borderColor: '#e2b96f', padding: 16, alignItems: 'center' as const },
  completionButtonGoldText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 8 } as const,
};
