import { useState, useReducer, useEffect, useRef, useCallback } from 'react';
import { View, Text, Alert, ScrollView, useWindowDimensions, StyleSheet, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from '@firebase/firestore';
import { db } from '../../firebase';
import { useLanguage } from '../../src/context/LanguageContext';
import { useInventory } from '../../src/context/InventoryContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  runOnJS,
} from 'react-native-reanimated';
import PressableScale from '../../src/components/PressableScale';
import { getActionEmoji } from '../../src/utils/actionEmoji';

// ─── Types ────────────────────────────────────────────────────────────────────

type CookStep = { id: string; text: string; duration: number | null };
type Ingredient = { id: string; quantity: string };
type RawRecipe = {
  id: string;
  name: string;
  steps: CookStep[] | string;
  preparation?: string;
  ingredients?: Ingredient[];
};

type BattlePhase =
  | 'IDLE'
  | 'PLAYER_ATTACK'
  | 'BOSS_COUNTERATTACK'
  | 'BOSS_DEFEAT';

type BattleAction =
  | { type: 'INIT'; totalSteps: number }
  | { type: 'NEXT_STEP' }
  | { type: 'ATTACK_DONE' }
  | { type: 'COUNTERATTACK_DONE'; dodgeSuccess: boolean }
  | { type: 'DEFEAT_DONE' };

type BattleState = {
  phase: BattlePhase;
  currentStep: number;
  totalSteps: number;
  bossHp: number;
  playerHp: number;
  showDamageNumber: boolean;
  damageValue: string;
  showCompletion: boolean;
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function makeInitial(totalSteps: number): BattleState {
  return {
    phase: 'IDLE',
    currentStep: 0,
    totalSteps,
    bossHp: 1,
    playerHp: 1,
    showDamageNumber: false,
    damageValue: '',
    showCompletion: false,
  };
}

function battleReducer(state: BattleState, action: BattleAction): BattleState {
  switch (action.type) {
    case 'INIT':
      return makeInitial(action.totalSteps);

    case 'NEXT_STEP': {
      if (state.phase !== 'IDLE' || state.currentStep >= state.totalSteps) return state;
      const dmg = state.totalSteps > 0 ? 1 / state.totalSteps : 0;
      const isLast = state.currentStep === state.totalSteps - 1;
      return {
        ...state,
        phase: isLast ? 'BOSS_DEFEAT' : 'PLAYER_ATTACK',
        bossHp: Math.max(0, state.bossHp - dmg),
        showDamageNumber: true,
        damageValue: `-${Math.round(dmg * 100)}`,
      };
    }

    case 'ATTACK_DONE':
      if (state.phase !== 'PLAYER_ATTACK') return state;
      return { ...state, phase: 'BOSS_COUNTERATTACK', showDamageNumber: false };

    case 'COUNTERATTACK_DONE': {
      if (state.phase !== 'BOSS_COUNTERATTACK') return state;
      const newPlayerHp = action.dodgeSuccess
        ? state.playerHp
        : Math.max(0, state.playerHp - 0.1);
      return {
        ...state,
        phase: 'IDLE',
        currentStep: state.currentStep + 1,
        playerHp: newPlayerHp,
        showDamageNumber: false,
      };
    }

    case 'DEFEAT_DONE':
      if (state.phase !== 'BOSS_DEFEAT') return state;
      return { ...state, showCompletion: true, showDamageNumber: false };

    default:
      return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function parseRecipeQty(qty: string | undefined): number {
  if (!qty) return 1;
  const frac = qty.match(/^(\d+)\/(\d+)/);
  if (frac) return parseInt(frac[1], 10) / parseInt(frac[2], 10);
  const num = qty.match(/[\d.]+/);
  return num ? parseFloat(num[0]) : 1;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CookMode() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const { consumeItems } = useInventory();
  const { width: screenWidth } = useWindowDimensions();

  const [recipe, setRecipe] = useState<RawRecipe | null>(null);
  const [steps, setSteps] = useState<CookStep[]>([]);
  const [loading, setLoading] = useState(true);
  const ingredientsConsumedRef = useRef(false);

  const [battle, dispatch] = useReducer(battleReducer, makeInitial(0));

  // ─── Shared values ──────────────────────────────────────────────────────────

  const charBob        = useSharedValue(0);
  const fireballX      = useSharedValue(0);
  const fireballOpacity= useSharedValue(0);
  const bossProjectileX= useSharedValue(0);
  const bossProjectileOpacity = useSharedValue(0);
  const bossX          = useSharedValue(0);
  const bossScale      = useSharedValue(1);
  const bossOpacity    = useSharedValue(1);
  const bossFlashOpacity = useSharedValue(0);
  const bossBreath     = useSharedValue(1);
  const bossHpWidth    = useSharedValue(1);
  const playerHpWidth  = useSharedValue(1);
  const damageY        = useSharedValue(0);
  const damageOpacity  = useSharedValue(0);
  const stepSlideX     = useSharedValue(0);
  const stepOpacity    = useSharedValue(1);
  const modalY         = useSharedValue(300);
  const modalOpacity   = useSharedValue(0);

  // ─── Animated styles ────────────────────────────────────────────────────────

  const bossAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: bossX.value },
      { scale: bossScale.value * bossBreath.value },
    ],
    opacity: bossOpacity.value,
  }));

  const bossFlashStyle = useAnimatedStyle(() => ({
    opacity: bossFlashOpacity.value,
    backgroundColor: 'white',
    ...StyleSheet.absoluteFillObject,
  }));

  const charAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: charBob.value }],
  }));

  const fireballStyle = useAnimatedStyle(() => ({
    opacity: fireballOpacity.value,
    transform: [{ translateX: fireballX.value }],
  }));

  const bossProjectileStyle = useAnimatedStyle(() => ({
    opacity: bossProjectileOpacity.value,
    transform: [{ translateX: bossProjectileX.value }],
  }));

  const bossHpStyle = useAnimatedStyle(() => ({
    width: `${bossHpWidth.value * 100}%` as `${number}%`,
  }));

  const playerHpStyle = useAnimatedStyle(() => ({
    width: `${playerHpWidth.value * 100}%` as `${number}%`,
  }));

  const damageAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: damageY.value }],
    opacity: damageOpacity.value,
  }));

  const stepSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: stepSlideX.value }],
    opacity: stepOpacity.value,
  }));

  const modalCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalY.value }],
    opacity: modalOpacity.value,
  }));

  // ─── Idle animations ────────────────────────────────────────────────────────

  useEffect(() => {
    bossBreath.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1000 }),
        withTiming(1.0,  { duration: 1000 })
      ),
      -1, false
    );
    charBob.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 750 }),
        withTiming(0,  { duration: 750 })
      ),
      -1, false
    );
  }, []);

  // ─── Load recipe ────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const snap = await getDoc(doc(db, 'recipes', id));
        if (snap.exists()) {
          const r = { id: snap.id, ...snap.data() } as RawRecipe;
          const normalized = normalizeSteps(r);
          setRecipe(r);
          setSteps(normalized);
          dispatch({ type: 'INIT', totalSteps: normalized.length });
          bossHpWidth.value = 1;
          playerHpWidth.value = 1;
          bossOpacity.value = 1;
          bossScale.value = 1;
          bossX.value = 0;
          ingredientsConsumedRef.current = false;
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  // ─── Completion modal ───────────────────────────────────────────────────────

  useEffect(() => {
    if (battle.showCompletion) {
      modalY.value = withSpring(0, { damping: 15, stiffness: 100 });
      modalOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [battle.showCompletion]);

  // ─── Consume ingredients on completion ──────────────────────────────────────

  useEffect(() => {
    if (!battle.showCompletion || ingredientsConsumedRef.current || !recipe) return;
    ingredientsConsumedRef.current = true;
    const items = (recipe.ingredients ?? []).map(ing => ({
      id: ing.id,
      quantity: parseRecipeQty(ing.quantity),
      metric: 'adet',
    }));
    if (items.length > 0) consumeItems(items);
  }, [battle.showCompletion, recipe]);

  // ─── Animation callbacks ─────────────────────────────────────────────────────

  const onAttackDone = useCallback(() => {
    dispatch({ type: 'ATTACK_DONE' });
  }, []);

  const onCounterattackDone = useCallback((dodgeSuccess: boolean) => {
    dispatch({ type: 'COUNTERATTACK_DONE', dodgeSuccess });
  }, []);

  const onDefeatDone = useCallback(() => {
    dispatch({ type: 'DEFEAT_DONE' });
  }, []);

  const runPlayerAttack = useCallback((damageAmount: number) => {
    fireballX.value = 0;
    fireballOpacity.value = 1;
    fireballX.value = withTiming(screenWidth * 0.55, { duration: 400 }, (finished) => {
      'worklet';
      if (!finished) return;
      bossX.value = withSequence(
        withTiming(-12, { duration: 60 }),
        withTiming(12,  { duration: 60 }),
        withTiming(-8,  { duration: 50 }),
        withTiming(0,   { duration: 50 })
      );
      bossFlashOpacity.value = withSequence(
        withTiming(0.8, { duration: 80 }),
        withTiming(0,   { duration: 120 })
      );
      bossHpWidth.value = withTiming(
        Math.max(0, bossHpWidth.value - damageAmount),
        { duration: 300 }
      );
      damageY.value = 0;
      damageOpacity.value = 1;
      damageY.value = withTiming(-50, { duration: 500 });
      damageOpacity.value = withDelay(200, withTiming(0, { duration: 300 }));
      fireballOpacity.value = withTiming(0, { duration: 100 });
      runOnJS(onAttackDone)();
    });
  }, [screenWidth, onAttackDone]);

  const runCounterattack = useCallback((dodgeSuccess: boolean) => {
    bossX.value = withSequence(
      withTiming(-20, { duration: 150 }),
      withTiming(0,   { duration: 200 })
    );
    bossProjectileX.value = 0;
    bossProjectileOpacity.value = 1;
    bossProjectileX.value = withTiming(-screenWidth * 0.55, { duration: 400 });
    bossProjectileOpacity.value = withDelay(350, withTiming(0, { duration: 100 }));

    if (!dodgeSuccess) {
      playerHpWidth.value = withDelay(
        400,
        withTiming(Math.max(0, playerHpWidth.value - 0.1), { duration: 300 })
      );
      charBob.value = withDelay(400, withSequence(
        withTiming(-12, { duration: 80 }),
        withTiming(0,   { duration: 120 })
      ));
    } else {
      charBob.value = withSequence(
        withTiming(-18, { duration: 150 }),
        withTiming(0,   { duration: 200 })
      );
    }

    stepSlideX.value = screenWidth;
    stepOpacity.value = 0;
    stepSlideX.value = withDelay(500, withTiming(0, { duration: 250 }));
    stepOpacity.value = withDelay(500, withTiming(1, { duration: 250 }, (finished) => {
      'worklet';
      if (!finished) return;
      runOnJS(onCounterattackDone)(dodgeSuccess);
    }));
  }, [screenWidth, onCounterattackDone]);

  const runBossDefeat = useCallback(() => {
    bossHpWidth.value = withTiming(0, { duration: 300 });
    bossX.value = withSequence(
      withTiming(-15, { duration: 60 }),
      withTiming(15,  { duration: 60 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10,  { duration: 50 }),
      withTiming(0,   { duration: 50 })
    );
    bossScale.value = withDelay(300, withTiming(0, { duration: 500 }));
    bossOpacity.value = withDelay(300, withTiming(0, { duration: 500 }, (finished) => {
      'worklet';
      if (!finished) return;
      runOnJS(onDefeatDone)();
    }));
  }, [onDefeatDone]);

  // ─── Phase → animation trigger ───────────────────────────────────────────────

  const prevPhaseRef = useRef<BattlePhase>('IDLE');

  useEffect(() => {
    if (prevPhaseRef.current === battle.phase) return;
    prevPhaseRef.current = battle.phase;

    if (battle.phase === 'PLAYER_ATTACK') {
      const dmg = battle.totalSteps > 0 ? 1 / battle.totalSteps : 0;
      runPlayerAttack(dmg);
    }
    if (battle.phase === 'BOSS_COUNTERATTACK') {
      const dodgeSuccess = Math.random() > 0.2;
      runCounterattack(dodgeSuccess);
    }
    if (battle.phase === 'BOSS_DEFEAT') {
      runBossDefeat();
    }
  }, [battle.phase, battle.totalSteps, runPlayerAttack, runCounterattack, runBossDefeat]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleNextStep() {
    if (battle.phase !== 'IDLE') return;
    dispatch({ type: 'NEXT_STEP' });
  }

  function handleExit() {
    Alert.alert(t('cook_exit_confirm'), '', [
      { text: t('cook_exit_no'), style: 'cancel' },
      { text: t('cook_exit_yes'), onPress: () => router.back() },
    ]);
  }

  // ─── Render guards ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={s.center}>
        <Text style={s.mutedText}>...</Text>
      </View>
    );
  }

  const totalSteps = steps.length;

  if (!recipe || totalSteps === 0) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>
          {!recipe ? 'Recipe not found.' : t('cook_no_steps')}
        </Text>
        <PressableScale onPress={() => router.back()}>
          <View style={s.errorBackButton}>
            <Text style={s.mutedText}>◀ {t('cook_back')}</Text>
          </View>
        </PressableScale>
      </View>
    );
  }

  const clampedStep = Math.min(battle.currentStep, totalSteps - 1);
  const activeStep  = steps[clampedStep];
  const stepText    = activeStep?.text ?? '';
  const emoji       = getActionEmoji(stepText);
  const durationStr = activeStep?.duration
    ? `⏱ ${activeStep.duration} min`
    : parseDuration(stepText);

  const isIdle      = battle.phase === 'IDLE';
  const isLastStep  = battle.currentStep === totalSteps - 1;
  const isComplete  = battle.currentStep >= totalSteps;
  const charIsAttacking = battle.phase === 'PLAYER_ATTACK';

  return (
    <View style={s.container}>
      {/* Top bar */}
      <View style={s.topBar}>
        <PressableScale onPress={handleExit} style={s.exitHitArea}>
          <Text style={s.exitText}>✕</Text>
        </PressableScale>
        <Text style={s.topTitle} numberOfLines={1}>
          {recipe.name.toUpperCase()}
        </Text>
        <Text style={s.stepCounter}>
          {Math.min(battle.currentStep + 1, totalSteps)} / {totalSteps}
        </Text>
      </View>

      {/* Boss HP bar */}
      <View style={s.bossHpTrack}>
        <Animated.View style={[s.bossHpFill, bossHpStyle]} />
      </View>

      {/* Battle stage */}
      <View style={s.battleStage}>
        {/* Character (left) — tap = next step */}
        <PressableScale onPress={handleNextStep} style={s.heroSlot}>
          <Animated.View style={charAnimStyle}>
            <Image
              source={
                charIsAttacking
                  ? require('../../assets/characters/wizard_fireball_cast.png')
                  : require('../../assets/characters/wizard_idle.png')
              }
              style={s.heroImage}
              resizeMode="contain"
            />
          </Animated.View>
        </PressableScale>

        {/* Fireball (player → boss) */}
        <Animated.View style={[s.fireball, fireballStyle]} />

        {/* Boss projectile (boss → player) */}
        <Animated.View style={[s.bossProjectile, bossProjectileStyle]} />

        {/* Damage number */}
        {battle.showDamageNumber && (
          <Animated.Text style={[s.damageNumber, damageAnimStyle]}>
            {battle.damageValue}
          </Animated.Text>
        )}

        {/* Boss (right) */}
        <View style={s.bossSlot}>
          <Animated.View style={[s.bossBox, bossAnimStyle]}>
            <Animated.View style={bossFlashStyle} />
          </Animated.View>
        </View>
      </View>

      {/* Player HP bar */}
      <View style={s.playerHpRow}>
        <Text style={s.playerHpLabel}>HP</Text>
        <View style={s.playerHpTrack}>
          <Animated.View style={[s.playerHpFill, playerHpStyle]} />
        </View>
      </View>

      {/* Step card */}
      <Animated.View style={[s.stepCard, stepSlideStyle]}>
        <Text style={s.stepLabel}>
          {t('cook_step')} {Math.min(battle.currentStep + 1, totalSteps)}
        </Text>
        <Text style={s.actionEmoji}>{emoji}</Text>
        <ScrollView
          style={s.stepScroll}
          contentContainerStyle={s.stepScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.stepText}>{stepText}</Text>
          {durationStr && (
            <View style={s.durationBadge}>
              <Text style={s.durationText}>{durationStr}</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Bottom button */}
      {!isComplete && (
        <View style={s.bottomArea}>
          <PressableScale
            onPress={handleNextStep}
            style={[s.fullWidthButton, !isIdle && s.buttonDisabled]}
          >
            <View style={isLastStep ? s.doneButtonInner : s.nextButtonInner}>
              <Text style={isLastStep ? s.doneButtonText : s.nextButtonText}>
                {isLastStep ? `✓ ${t('cook_done')}` : `${t('cook_next')} →`}
              </Text>
            </View>
          </PressableScale>
        </View>
      )}

      {/* Completion modal */}
      {battle.showCompletion && (
        <View style={s.completionOverlay}>
          <Animated.View style={[s.completionCard, modalCardStyle]}>
            <Text style={s.completionEmoji}>🎉</Text>
            <Text style={s.completionTitle}>{t('cook_complete_title')}</Text>
            <Text style={s.completionRecipeName}>{recipe.name}</Text>
            <PressableScale onPress={() => router.back()} style={s.fullWidthButton}>
              <View style={s.completionButtonMuted}>
                <Text style={s.completionButtonMutedText}>{t('cook_back_to_recipe')}</Text>
              </View>
            </PressableScale>
            <PressableScale onPress={() => router.replace('/')} style={s.fullWidthButton}>
              <View style={s.completionButtonGold}>
                <Text style={s.completionButtonGoldText}>{t('cook_home')}</Text>
              </View>
            </PressableScale>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#16213e', paddingTop: 48 },
  center:            { flex: 1, backgroundColor: '#16213e', alignItems: 'center', justifyContent: 'center', padding: 24 },
  mutedText:         { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },
  errorText:         { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 9, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  errorBackButton:   { borderWidth: 1, borderColor: '#4a4a6a', paddingHorizontal: 20, paddingVertical: 14 },

  topBar:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  exitHitArea:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  exitText:          { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 14 },
  topTitle:          { flex: 1, fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 7, textAlign: 'center' },
  stepCounter:       { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, minWidth: 40, textAlign: 'right' },

  bossHpTrack:       { height: 10, backgroundColor: '#2a2a4a', marginHorizontal: 16, marginBottom: 2, borderWidth: 1, borderColor: '#4a4a6a' },
  bossHpFill:        { height: '100%', backgroundColor: '#c84b4b' },
  playerHpRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 4, gap: 8 },
  playerHpLabel:     { fontFamily: 'PressStart2P_400Regular', color: '#6fcf97', fontSize: 7, width: 20 },
  playerHpTrack:     { flex: 1, height: 8, backgroundColor: '#2a2a4a', borderWidth: 1, borderColor: '#4a4a6a' },
  playerHpFill:      { height: '100%', backgroundColor: '#6fcf97' },

  battleStage:       { height: 140, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8, position: 'relative' },
  heroSlot:          { width: 88, height: 112 },
  heroImage:         { width: 88, height: 112 },
  bossSlot:          { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  bossBox:           { width: 120, height: 120, backgroundColor: '#4a2a6a', borderWidth: 2, borderColor: '#c8a84b', overflow: 'hidden' },

  fireball:          { position: 'absolute', bottom: 56, left: 88, width: 20, height: 20, borderRadius: 10, backgroundColor: '#ff6600' },
  bossProjectile:    { position: 'absolute', bottom: 80, right: 120, width: 16, height: 16, borderRadius: 8, backgroundColor: '#c84b4b' },
  damageNumber:      { position: 'absolute', bottom: 100, right: 130, fontFamily: 'PressStart2P_400Regular', color: '#ff6600', fontSize: 12 },

  stepCard:          { flex: 1, paddingHorizontal: 24, paddingTop: 16, alignItems: 'center', overflow: 'hidden' },
  stepLabel:         { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 12, alignSelf: 'flex-start' },
  actionEmoji:       { fontSize: 48, marginBottom: 12 },
  stepScroll:        { flex: 1, width: '100%' },
  stepScrollContent: { flexGrow: 1, alignItems: 'center', paddingBottom: 16 },
  stepText:          { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 10, textAlign: 'center', lineHeight: 24 },
  durationBadge:     { marginTop: 16, borderWidth: 1, borderColor: '#c8a84b', paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'center' },
  durationText:      { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },

  bottomArea:        { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12 },
  fullWidthButton:   { width: '100%' },
  buttonDisabled:    { opacity: 0.4 },
  nextButtonInner:   { borderWidth: 1, borderColor: '#e2b96f', padding: 20, alignItems: 'center' },
  nextButtonText:    { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10 },
  doneButtonInner:   { backgroundColor: '#c8a84b', padding: 20, alignItems: 'center' },
  doneButtonText:    { fontFamily: 'PressStart2P_400Regular', color: '#1a1a2e', fontSize: 10 },

  completionOverlay:         { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  completionCard:            { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', padding: 32, alignItems: 'center', width: '100%', gap: 16 },
  completionEmoji:           { fontSize: 64 },
  completionTitle:           { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 12, textAlign: 'center', lineHeight: 26 },
  completionRecipeName:      { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, textAlign: 'center', marginBottom: 8 },
  completionButtonMuted:     { borderWidth: 1, borderColor: '#4a4a6a', padding: 16, alignItems: 'center' },
  completionButtonMutedText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },
  completionButtonGold:      { borderWidth: 1, borderColor: '#e2b96f', padding: 16, alignItems: 'center' },
  completionButtonGoldText:  { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 8 },
});
