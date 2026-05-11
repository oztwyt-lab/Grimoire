import { useState, useReducer, useEffect, useRef, useCallback } from 'react';
import { View, Text, Alert, useWindowDimensions, StyleSheet, Image, ImageBackground, ImageSourcePropType, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from '@firebase/firestore';
import { db } from '../../firebase';
import { useLanguage } from '../../src/context/LanguageContext';
import { useInventory } from '../../src/context/InventoryContext';
import { useAuth } from '../../src/context/AuthContext';
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
import { getUserProfile } from '../../lib/firestore';
import { playMusic, playSFX, stopMusic } from '../../src/services/audio';
import { markRecipeRecent, setCookTime } from '../../src/services/recentRecipes';
import { hasRecipeIngredients, parseRecipeQuantity } from '../../src/utils/recipeInventory';
import CookingActionIcon from '../../src/components/CookingActionIcon';

const WIZARD_IDLE_SHEET = require('../../assets/characters/wizard_character/mage_idle.png');
const WIZARD_CAST_SHEET = require('../../assets/characters/wizard_character/attack_right.png');
const WITCH_IDLE = [
  require('../../assets/characters/witch/idle_00.png'),
  require('../../assets/characters/witch/idle_01.png'),
  require('../../assets/characters/witch/idle_02.png'),
  require('../../assets/characters/witch/idle_03.png'),
];
const WITCH_ATTACK = [
  require('../../assets/characters/witch/attack_00.png'),
  require('../../assets/characters/witch/attack_01.png'),
  require('../../assets/characters/witch/attack_02.png'),
];
const BATTLE_BACKGROUND = require('../../assets/battle/battleback1.png');
const GHOST_BOSS_SHEETS = [
  require('../../assets/bosses/ghosts/ghost.png'),
  require('../../assets/bosses/ghosts/ghost_red.png'),
];
const USE_OPENART_BOSS_POLISH = true;
const FIREBALL_FRAMES = [
  require('../../assets/effects/fireball/Effects_Fire_0_01.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_02.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_03.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_04.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_05.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_06.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_07.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_08.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_09.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_10.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_11.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_12.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_13.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_14.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_15.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_16.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_17.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_18.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_19.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_20.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_21.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_22.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_23.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_24.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_25.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_26.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_27.png'),
  require('../../assets/effects/fireball/Effects_Fire_0_28.png'),
];
const SMOKE_FRAMES = [
  require('../../assets/effects/smoke/0001.png'),
  require('../../assets/effects/smoke/0002.png'),
  require('../../assets/effects/smoke/0003.png'),
  require('../../assets/effects/smoke/0004.png'),
  require('../../assets/effects/smoke/0005.png'),
  require('../../assets/effects/smoke/0006.png'),
  require('../../assets/effects/smoke/0007.png'),
  require('../../assets/effects/smoke/0008.png'),
  require('../../assets/effects/smoke/0009.png'),
  require('../../assets/effects/smoke/0010.png'),
  require('../../assets/effects/smoke/0011.png'),
  require('../../assets/effects/smoke/0012.png'),
  require('../../assets/effects/smoke/0013.png'),
  require('../../assets/effects/smoke/0014.png'),
  require('../../assets/effects/smoke/0015.png'),
  require('../../assets/effects/smoke/0016.png'),
  require('../../assets/effects/smoke/0017.png'),
  require('../../assets/effects/smoke/0018.png'),
  require('../../assets/effects/smoke/0019.png'),
  require('../../assets/effects/smoke/0020.png'),
];
const HIT_IMPACT_FRAMES = [
  require('../../assets/effects/hit_fire_smoke/0001.png'),
  require('../../assets/effects/hit_fire_smoke/0002.png'),
  require('../../assets/effects/hit_fire_smoke/0003.png'),
  require('../../assets/effects/hit_fire_smoke/0004.png'),
  require('../../assets/effects/hit_fire_smoke/0005.png'),
  require('../../assets/effects/hit_fire_smoke/0006.png'),
  require('../../assets/effects/hit_fire_smoke/0007.png'),
  require('../../assets/effects/hit_fire_smoke/0008.png'),
  require('../../assets/effects/hit_fire_smoke/0009.png'),
  require('../../assets/effects/hit_fire_smoke/0010.png'),
  require('../../assets/effects/hit_fire_smoke/0011.png'),
  require('../../assets/effects/hit_fire_smoke/0012.png'),
  require('../../assets/effects/hit_fire_smoke/0013.png'),
  require('../../assets/effects/hit_fire_smoke/0014.png'),
  require('../../assets/effects/hit_fire_smoke/0015.png'),
  require('../../assets/effects/hit_fire_smoke/0016.png'),
  require('../../assets/effects/hit_fire_smoke/0017.png'),
  require('../../assets/effects/hit_fire_smoke/0018.png'),
  require('../../assets/effects/hit_fire_smoke/0019.png'),
  require('../../assets/effects/hit_fire_smoke/0020.png'),
  require('../../assets/effects/hit_fire_smoke/0021.png'),
  require('../../assets/effects/hit_fire_smoke/0022.png'),
  require('../../assets/effects/hit_fire_smoke/0023.png'),
  require('../../assets/effects/hit_fire_smoke/0024.png'),
  require('../../assets/effects/hit_fire_smoke/0025.png'),
  require('../../assets/effects/hit_fire_smoke/0026.png'),
  require('../../assets/effects/hit_fire_smoke/0027.png'),
  require('../../assets/effects/hit_fire_smoke/0028.png'),
  require('../../assets/effects/hit_fire_smoke/0029.png'),
  require('../../assets/effects/hit_fire_smoke/0030.png'),
];
const DEFEAT_RING_FRAMES = [
  require('../../assets/effects/defeat_magic_ring/0001.png'),
  require('../../assets/effects/defeat_magic_ring/0002.png'),
  require('../../assets/effects/defeat_magic_ring/0003.png'),
  require('../../assets/effects/defeat_magic_ring/0004.png'),
  require('../../assets/effects/defeat_magic_ring/0005.png'),
  require('../../assets/effects/defeat_magic_ring/0006.png'),
  require('../../assets/effects/defeat_magic_ring/0007.png'),
  require('../../assets/effects/defeat_magic_ring/0008.png'),
  require('../../assets/effects/defeat_magic_ring/0009.png'),
  require('../../assets/effects/defeat_magic_ring/0010.png'),
  require('../../assets/effects/defeat_magic_ring/0011.png'),
  require('../../assets/effects/defeat_magic_ring/0012.png'),
  require('../../assets/effects/defeat_magic_ring/0013.png'),
  require('../../assets/effects/defeat_magic_ring/0014.png'),
  require('../../assets/effects/defeat_magic_ring/0015.png'),
  require('../../assets/effects/defeat_magic_ring/0016.png'),
  require('../../assets/effects/defeat_magic_ring/0017.png'),
  require('../../assets/effects/defeat_magic_ring/0018.png'),
  require('../../assets/effects/defeat_magic_ring/0019.png'),
  require('../../assets/effects/defeat_magic_ring/0020.png'),
  require('../../assets/effects/defeat_magic_ring/0021.png'),
  require('../../assets/effects/defeat_magic_ring/0022.png'),
  require('../../assets/effects/defeat_magic_ring/0023.png'),
  require('../../assets/effects/defeat_magic_ring/0024.png'),
  require('../../assets/effects/defeat_magic_ring/0025.png'),
  require('../../assets/effects/defeat_magic_ring/0026.png'),
  require('../../assets/effects/defeat_magic_ring/0027.png'),
  require('../../assets/effects/defeat_magic_ring/0028.png'),
  require('../../assets/effects/defeat_magic_ring/0029.png'),
  require('../../assets/effects/defeat_magic_ring/0030.png'),
  require('../../assets/effects/defeat_magic_ring/0031.png'),
  require('../../assets/effects/defeat_magic_ring/0032.png'),
  require('../../assets/effects/defeat_magic_ring/0033.png'),
  require('../../assets/effects/defeat_magic_ring/0034.png'),
  require('../../assets/effects/defeat_magic_ring/0035.png'),
  require('../../assets/effects/defeat_magic_ring/0036.png'),
  require('../../assets/effects/defeat_magic_ring/0037.png'),
  require('../../assets/effects/defeat_magic_ring/0038.png'),
  require('../../assets/effects/defeat_magic_ring/0039.png'),
  require('../../assets/effects/defeat_magic_ring/0040.png'),
];
const HERO_IDLE_FRAME_COUNT = 7;
const HERO_ATTACK_FRAME_COUNT = 7;
const HERO_MAX_FRAME_COUNT = 7;
const HERO_FRAME_W = 88;
const HERO_FRAME_H = 88;
type BossProfile = {
  id: string;
  source: ImageSourcePropType;
  cols: number;
  rows: number;
  frameCount: number;
  frameW: number;
  frameH: number;
  viewW: number;
  viewH: number;
  yOffset?: number;
  hitStyle?: ViewStyle;
  defeatStyle?: ViewStyle;
  auraStyle?: ViewStyle;
};

const LEGACY_GHOST_BOSSES: BossProfile[] = GHOST_BOSS_SHEETS.map((source, index) => ({
  id: `ghost-${index}`,
  source,
  cols: 5,
  rows: 2,
  frameCount: 10,
  frameW: 86,
  frameH: 120,
  viewW: 76,
  viewH: 112,
  defeatStyle: { opacity: 0.88 },
}));

const OPENART_BOSSES: BossProfile[] = [
  {
    id: 'arcane-watcher',
    source: require('../../assets/bosses/openart/arcane_watcher.png'),
    cols: 6,
    rows: 5,
    frameCount: 6,
    frameW: 112,
    frameH: 93,
    viewW: 102,
    viewH: 92,
    yOffset: 8,
    auraStyle: { opacity: 0.28, transform: [{ scale: 0.86 }] },
    hitStyle: { transform: [{ scale: 0.86 }], opacity: 0.9 },
    defeatStyle: { transform: [{ scale: 0.92 }], opacity: 0.92 },
  },
  {
    id: 'void-watcher',
    source: require('../../assets/bosses/openart/void_watcher.png'),
    cols: 6,
    rows: 5,
    frameCount: 6,
    frameW: 112,
    frameH: 93,
    viewW: 102,
    viewH: 92,
    yOffset: 8,
    auraStyle: { opacity: 0.34, transform: [{ scale: 0.92 }] },
    hitStyle: { transform: [{ scale: 0.82 }], opacity: 0.98 },
    defeatStyle: { transform: [{ scale: 0.96 }], opacity: 0.95 },
  },
  {
    id: 'iron-champion',
    source: require('../../assets/bosses/openart/iron_champion.png'),
    cols: 8,
    rows: 4,
    frameCount: 8,
    frameW: 385,
    frameH: 318,
    viewW: 138,
    viewH: 114,
    yOffset: -2,
    auraStyle: { opacity: 0.18, transform: [{ scale: 1.2 }] },
    hitStyle: { transform: [{ scale: 1.28 }], opacity: 0.96 },
    defeatStyle: { transform: [{ scale: 1.16 }], opacity: 0.88 },
  },
];

const BOSS_PROFILES = USE_OPENART_BOSS_POLISH
  ? [...LEGACY_GHOST_BOSSES, ...OPENART_BOSSES]
  : LEGACY_GHOST_BOSSES;

// ─── Types ────────────────────────────────────────────────────────────────────

type CookStep = { id: string; text: string; duration: number | null; emoji?: string };
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
  | { type: 'PREV_STEP' }
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

    case 'PREV_STEP':
      if (state.phase !== 'IDLE' || state.currentStep <= 0) return state;
      return { ...state, currentStep: state.currentStep - 1 };

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

function formatCookTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

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
      emoji: (s as CookStep).emoji,
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function CookMode() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { inventory, inventoryLoaded, consumeItems } = useInventory();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const arenaWidth = isLandscape ? screenWidth * 0.4 : screenWidth;
  const insets = useSafeAreaInsets();
  const bossProfile = useRef(BOSS_PROFILES[Math.floor(Math.random() * BOSS_PROFILES.length)]).current;

  const [recipe, setRecipe] = useState<RawRecipe | null>(null);
  const [steps, setSteps] = useState<CookStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFemale, setIsFemale] = useState(false);
  const ingredientsConsumedRef = useRef(false);
  const blockedMissingIngredientsRef = useRef(false);
  const cookStartRef = useRef<number | null>(null);
  const [finalTimeSecs, setFinalTimeSecs] = useState<number | null>(null);

  // Sprite frame cycling
  const [fireballFrame, setFireballFrame] = useState(0);
  const [hitImpactVisible, setHitImpactVisible] = useState(false);
  const [hitImpactFrame, setHitImpactFrame] = useState(0);
  const [defeatRingVisible, setDefeatRingVisible] = useState(false);
  const [defeatRingFrame, setDefeatRingFrame] = useState(0);
  const [orbFrame, setOrbFrame] = useState(0);
  const [wizardFrame, setWizardFrame] = useState(0);
  const [bossFrame, setBossFrame] = useState(0);
  const [smokeFrame, setSmokeFrame] = useState(0);
  const fireballIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hitImpactIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const defeatRingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const orbIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [battle, dispatch] = useReducer(battleReducer, makeInitial(0));

  // ─── Shared values ──────────────────────────────────────────────────────────

  const charBob        = useSharedValue(0);
  const fireballX      = useSharedValue(0);
  const fireballOpacity= useSharedValue(0);
  const bossProjectileX= useSharedValue(0);
  const bossProjectileOpacity = useSharedValue(0);
  const ambientOrbX    = useSharedValue(0);
  const ambientOrbOpacity = useSharedValue(0);
  const ambientOrbTwoX = useSharedValue(0);
  const ambientOrbTwoOpacity = useSharedValue(0);
  const ambientDodgeY  = useSharedValue(0);
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
      { scaleX: -1 },
    ],
    opacity: bossOpacity.value,
  }));

  const bossFlashStyle = useAnimatedStyle(() => ({
    opacity: bossFlashOpacity.value,
    backgroundColor: 'white',
    ...StyleSheet.absoluteFillObject,
  }));

  const charAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: charBob.value + ambientDodgeY.value }],
  }));

  const fireballStyle = useAnimatedStyle(() => ({
    opacity: fireballOpacity.value,
    transform: [{ translateX: fireballX.value }],
  }));

  const bossProjectileStyle = useAnimatedStyle(() => ({
    opacity: bossProjectileOpacity.value,
    transform: [{ translateX: bossProjectileX.value }],
  }));

  const ambientOrbStyle = useAnimatedStyle(() => ({
    opacity: ambientOrbOpacity.value,
    transform: [{ translateX: ambientOrbX.value }],
  }));

  const ambientOrbTwoStyle = useAnimatedStyle(() => ({
    opacity: ambientOrbTwoOpacity.value,
    transform: [{ translateX: ambientOrbTwoX.value }],
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

  useEffect(() => {
    const bossTimer = setInterval(() => {
      setBossFrame(frame => (frame + 1) % bossProfile.frameCount);
    }, 180);
    const smokeTimer = setInterval(() => {
      setSmokeFrame(frame => (frame + 1) % SMOKE_FRAMES.length);
    }, 90);
    return () => {
      clearInterval(bossTimer);
      clearInterval(smokeTimer);
    };
  }, [bossProfile.frameCount]);

  useEffect(() => {
    let alive = true;

    async function loadCharacter() {
      if (!user) {
        if (alive) setIsFemale(false);
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        if (alive) setIsFemale(profile?.character === 'female');
      } catch (error) {
        console.error(error);
        if (alive) setIsFemale(false);
      }
    }

    loadCharacter();

    return () => {
      alive = false;
    };
  }, [user]);

  useEffect(() => {
    const isAttacking = battle.phase === 'PLAYER_ATTACK';
    const frameCount = isAttacking
      ? (isFemale ? WITCH_ATTACK.length : HERO_ATTACK_FRAME_COUNT)
      : (isFemale ? WITCH_IDLE.length : HERO_IDLE_FRAME_COUNT);
    const intervalMs = isAttacking ? 120 : 200;

    setWizardFrame(0);
    const timer = setInterval(() => {
      setWizardFrame(frame => {
        if (isAttacking) {
          return Math.min(frame + 1, frameCount - 1);
        }
        return (frame + 1) % frameCount;
      });
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [battle.phase, isFemale]);

  useEffect(() => {
    const travel = -arenaWidth * 0.62;

    ambientOrbX.value = 0;
    ambientOrbOpacity.value = 0;
    ambientOrbX.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1 }),
        withTiming(travel, { duration: 1300 }),
        withDelay(250, withTiming(0, { duration: 1 }))
      ),
      -1,
      false
    );
    ambientOrbOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 120 }),
        withDelay(1040, withTiming(1, { duration: 1 })),
        withTiming(0, { duration: 140 }),
        withDelay(290, withTiming(0, { duration: 1 }))
      ),
      -1,
      false
    );

    ambientOrbTwoX.value = 0;
    ambientOrbTwoOpacity.value = 0;
    ambientOrbTwoX.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 1 }),
          withTiming(travel, { duration: 1200 }),
          withDelay(350, withTiming(0, { duration: 1 }))
        ),
        -1,
        false
      )
    );
    ambientOrbTwoOpacity.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 120 }),
          withDelay(940, withTiming(1, { duration: 1 })),
          withTiming(0, { duration: 140 }),
          withDelay(390, withTiming(0, { duration: 1 }))
        ),
        -1,
        false
      )
    );

    ambientDodgeY.value = withRepeat(
      withSequence(
        withDelay(480, withTiming(0, { duration: 1 })),
        withTiming(-16, { duration: 120 }),
        withTiming(0, { duration: 180 }),
        withDelay(520, withTiming(0, { duration: 1 }))
      ),
      -1,
      false
    );
  }, [arenaWidth]);

  // ─── Load recipe ────────────────────────────────────────────────────────────

  useEffect(() => {
    playMusic('boss_music', true);
    return () => {
      stopMusic();
    };
  }, []);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const snap = await getDoc(doc(db, 'recipes', id));
        if (snap.exists()) {
          const r = { id: snap.id, ...snap.data() } as RawRecipe;
          const normalized = normalizeSteps(r);
          setRecipe(r);
          if (user) markRecipeRecent(user.uid, snap.id).catch(console.warn);
          setSteps(normalized);
          dispatch({ type: 'INIT', totalSteps: normalized.length });
          cookStartRef.current = Date.now();
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
  }, [id, user]);

  useEffect(() => {
    if (!recipe || !inventoryLoaded || blockedMissingIngredientsRef.current) return;
    if (hasRecipeIngredients(recipe.ingredients, inventory)) return;

    blockedMissingIngredientsRef.current = true;
    Alert.alert(t('recipe_missing_ingredients_title'), t('recipe_missing_ingredients_msg'), [
      { text: 'OK', onPress: () => router.replace(`/recipe/${recipe.id}`) },
    ]);
  }, [inventory, inventoryLoaded, recipe, router, t]);

  // ─── Completion modal ───────────────────────────────────────────────────────

  useEffect(() => {
    if (battle.showCompletion) {
      modalY.value = withSpring(0, { damping: 15, stiffness: 100 });
      modalOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [battle.showCompletion]);

  // ─── Capture and persist cook session time ───────────────────────────────────

  useEffect(() => {
    if (!battle.showCompletion || finalTimeSecs !== null || !cookStartRef.current || !user || !recipe) return;
    const secs = Math.round((Date.now() - cookStartRef.current) / 1000);
    setFinalTimeSecs(secs);
    setCookTime(user.uid, recipe.id, secs).catch(console.warn);
  }, [battle.showCompletion, user, recipe, finalTimeSecs]);

  // ─── Consume ingredients on completion ──────────────────────────────────────

  useEffect(() => {
    if (!battle.showCompletion || ingredientsConsumedRef.current || !recipe) return;
    ingredientsConsumedRef.current = true;
    const items = (recipe.ingredients ?? []).map(ing => ({
      id: ing.id,
      quantity: parseRecipeQuantity(ing.quantity),
      metric: 'adet',
    }));
    if (items.length > 0) consumeItems(items);
  }, [battle.showCompletion, recipe]);

  // ─── Sprite frame cycling ────────────────────────────────────────────────────

  const startFireballAnim = useCallback(() => {
    if (fireballIntervalRef.current) clearInterval(fireballIntervalRef.current);
    setFireballFrame(0);
    fireballIntervalRef.current = setInterval(() => setFireballFrame(f => (f + 1) % FIREBALL_FRAMES.length), 45);
  }, []);

  const stopFireballAnim = useCallback(() => {
    if (fireballIntervalRef.current) { clearInterval(fireballIntervalRef.current); fireballIntervalRef.current = null; }
    setFireballFrame(0);
  }, []);

  const triggerHitImpact = useCallback(() => {
    if (hitImpactIntervalRef.current) clearInterval(hitImpactIntervalRef.current);
    setHitImpactFrame(0);
    setHitImpactVisible(true);

    let nextFrame = 0;
    hitImpactIntervalRef.current = setInterval(() => {
      nextFrame += 1;
      if (nextFrame >= HIT_IMPACT_FRAMES.length) {
        if (hitImpactIntervalRef.current) clearInterval(hitImpactIntervalRef.current);
        hitImpactIntervalRef.current = null;
        setHitImpactVisible(false);
        return;
      }
      setHitImpactFrame(nextFrame);
    }, 42);
  }, []);

  const triggerDefeatRing = useCallback(() => {
    if (defeatRingIntervalRef.current) clearInterval(defeatRingIntervalRef.current);
    setDefeatRingFrame(0);
    setDefeatRingVisible(true);

    let nextFrame = 0;
    defeatRingIntervalRef.current = setInterval(() => {
      nextFrame += 1;
      if (nextFrame >= DEFEAT_RING_FRAMES.length) {
        if (defeatRingIntervalRef.current) clearInterval(defeatRingIntervalRef.current);
        defeatRingIntervalRef.current = null;
        setDefeatRingVisible(false);
        return;
      }
      setDefeatRingFrame(nextFrame);
    }, 38);
  }, []);

  const startOrbAnim = useCallback(() => {
    if (orbIntervalRef.current) return;
    setOrbFrame(0);
    orbIntervalRef.current = setInterval(() => setOrbFrame(f => (f + 1) % 3), 150);
  }, []);

  const stopOrbAnim = useCallback(() => {
    // Ambient orb traffic keeps this sprite sheet cycling between active counterattacks.
  }, []);

  useEffect(() => {
    startOrbAnim();
    return () => {
      if (fireballIntervalRef.current) clearInterval(fireballIntervalRef.current);
      if (hitImpactIntervalRef.current) clearInterval(hitImpactIntervalRef.current);
      if (defeatRingIntervalRef.current) clearInterval(defeatRingIntervalRef.current);
      if (orbIntervalRef.current) clearInterval(orbIntervalRef.current);
    };
  }, [startOrbAnim]);

  // ─── Animation callbacks ─────────────────────────────────────────────────────

  const onAttackDone = useCallback(() => {
    stopFireballAnim();
    dispatch({ type: 'ATTACK_DONE' });
  }, [stopFireballAnim]);

  const onCounterattackDone = useCallback((dodgeSuccess: boolean) => {
    stopOrbAnim();
    dispatch({ type: 'COUNTERATTACK_DONE', dodgeSuccess });
  }, [stopOrbAnim]);

  const onDefeatDone = useCallback(() => {
    dispatch({ type: 'DEFEAT_DONE' });
  }, []);

  const runPlayerAttack = useCallback((damageAmount: number) => {
    runOnJS(startFireballAnim)();
    fireballX.value = 0;
    fireballOpacity.value = 1;
    fireballX.value = withTiming(arenaWidth * 0.55, { duration: 400 }, (finished) => {
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
      runOnJS(playSFX)('fireball_hit');
      runOnJS(triggerHitImpact)();
      runOnJS(onAttackDone)();
    });
  }, [arenaWidth, onAttackDone, triggerHitImpact]);

  const runCounterattack = useCallback((dodgeSuccess: boolean) => {
    runOnJS(startOrbAnim)();
    bossX.value = withSequence(
      withTiming(-20, { duration: 150 }),
      withTiming(0,   { duration: 200 })
    );
    bossProjectileX.value = 0;
    bossProjectileOpacity.value = 1;
    bossProjectileX.value = withTiming(-arenaWidth * 0.55, { duration: 400 });
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
  }, [arenaWidth, screenWidth, onCounterattackDone]);

  const runBossDefeat = useCallback(() => {
    runOnJS(triggerDefeatRing)();
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
  }, [onDefeatDone, triggerDefeatRing]);

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
    playSFX('fireball_shoot');
    dispatch({ type: 'NEXT_STEP' });
  }

  function handlePrevStep() {
    if (battle.phase !== 'IDLE' || battle.currentStep <= 0) return;
    dispatch({ type: 'PREV_STEP' });
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
          {!recipe ? t('detail_not_found') : t('cook_no_steps')}
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
  const actionIconText = activeStep?.emoji || stepText;
  const durationStr = activeStep?.duration
    ? `⏱ ${activeStep.duration} min`
    : parseDuration(stepText);

  const isIdle      = battle.phase === 'IDLE';
  const isLastStep  = battle.currentStep === totalSteps - 1;
  const isComplete  = battle.currentStep >= totalSteps;
  const charIsAttacking = battle.phase === 'PLAYER_ATTACK';
  const heroFrameCount = charIsAttacking
    ? (isFemale ? WITCH_ATTACK.length : HERO_ATTACK_FRAME_COUNT)
    : (isFemale ? WITCH_IDLE.length : HERO_IDLE_FRAME_COUNT);
  const heroFrame = wizardFrame % heroFrameCount;
  const bossCol = bossFrame % bossProfile.cols;
  const bossRow = Math.floor(bossFrame / bossProfile.cols);
  const bossFrameScale = bossProfile.viewH / bossProfile.frameH;
  const bossScaledFrameW = bossProfile.frameW * bossFrameScale;

  const canGoBack = battle.currentStep > 0;

  // ─── Layout nodes ────────────────────────────────────────────────────────────

  const topBarNode = (
    <View style={[s.topBar, { paddingTop: isLandscape ? Math.max(insets.top, 8) : 48 }]}>
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
  );

  const battleSectionNode = (
    <>
      <View style={s.bossHpSection}>
        <View style={s.bossHpTrack}>
          <Animated.View style={[s.bossHpFill, bossHpStyle]} />
        </View>
      </View>

      <ImageBackground source={BATTLE_BACKGROUND} style={[s.battleStage, isLandscape && { height: undefined, flex: 1 }]} imageStyle={s.battleStageImage} resizeMode="cover">
        <View style={s.battleTint} />
        <View style={s.smokeLayer} pointerEvents="none">
          <Image source={SMOKE_FRAMES[smokeFrame]} style={[s.smokePuff, s.smokePuffLeft]} resizeMode="contain" />
          <Image source={SMOKE_FRAMES[(smokeFrame + 8) % SMOKE_FRAMES.length]} style={[s.smokePuff, s.smokePuffRight]} resizeMode="contain" />
          <Image source={SMOKE_FRAMES[(smokeFrame + 14) % SMOKE_FRAMES.length]} style={[s.smokePuff, s.smokePuffCenter]} resizeMode="contain" />
        </View>
        <PressableScale onPress={handleNextStep} sound={false} style={[s.heroSlot, isFemale && s.heroWitchSlot]}>
          <Animated.View style={charAnimStyle}>
            <View
              style={[
                s.heroFrameViewport,
                isFemale && s.heroWitchViewport,
                { transform: [{ scaleX: isFemale ? 1 : charIsAttacking ? 1 : -1 }] },
              ]}
            >
              {isFemale ? (
                <Image
                  source={charIsAttacking ? WITCH_ATTACK[heroFrame] : WITCH_IDLE[heroFrame]}
                  style={s.heroWitchImage}
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={charIsAttacking ? WIZARD_CAST_SHEET : WIZARD_IDLE_SHEET}
                  style={[
                    s.heroFrameSheet,
                    {
                      width: HERO_FRAME_W * heroFrameCount,
                      height: HERO_FRAME_H,
                      marginLeft: (92 - HERO_FRAME_W) / 2 - heroFrame * HERO_FRAME_W,
                    },
                  ]}
                  resizeMode="stretch"
                />
              )}
            </View>
          </Animated.View>
        </PressableScale>

        <Animated.View style={[s.fireballWrapper, fireballStyle]}>
          <Image
            source={FIREBALL_FRAMES[fireballFrame]}
            style={s.fireballImage}
            resizeMode="stretch"
          />
        </Animated.View>

        {hitImpactVisible && (
          <View style={[s.hitImpactWrapper, bossProfile.hitStyle]} pointerEvents="none">
            <Image
              source={HIT_IMPACT_FRAMES[hitImpactFrame]}
              style={s.hitImpactImage}
              resizeMode="contain"
            />
          </View>
        )}

        <Animated.View style={[s.ambientOrbWrapper, ambientOrbStyle]}>
          <Image
            source={require('../../assets/new_dark_orb.png')}
            style={[s.orbSheet, { marginLeft: -orbFrame * 96 }]}
            resizeMode="stretch"
          />
        </Animated.View>

        <Animated.View style={[s.ambientOrbTwoWrapper, ambientOrbTwoStyle]}>
          <Image
            source={require('../../assets/new_dark_orb.png')}
            style={[s.orbSheet, { marginLeft: -orbFrame * 96 }]}
            resizeMode="stretch"
          />
        </Animated.View>

        <Animated.View style={[s.orbWrapper, bossProjectileStyle]}>
          <Image
            source={require('../../assets/new_dark_orb.png')}
            style={[s.orbSheet, { marginLeft: -orbFrame * 96 }]}
            resizeMode="stretch"
          />
        </Animated.View>

        {battle.showDamageNumber && (
          <Animated.Text style={[s.damageNumber, damageAnimStyle]}>
            {battle.damageValue}
          </Animated.Text>
        )}

        {defeatRingVisible && (
          <View style={[s.defeatRingWrapper, bossProfile.defeatStyle]} pointerEvents="none">
            <Image
              source={DEFEAT_RING_FRAMES[defeatRingFrame]}
              style={s.defeatRingImage}
              resizeMode="contain"
            />
          </View>
        )}

        {bossProfile.auraStyle && (
          <View style={[s.bossAuraWrapper, bossProfile.auraStyle]} pointerEvents="none">
            <Image
              source={DEFEAT_RING_FRAMES[(smokeFrame * 2) % DEFEAT_RING_FRAMES.length]}
              style={s.bossAuraImage}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={[s.bossSlot, { width: Math.max(120, bossProfile.viewW), height: Math.max(120, bossProfile.viewH) }]}>
          <Animated.View style={[s.bossBox, { width: bossProfile.viewW, height: bossProfile.viewH, marginBottom: bossProfile.yOffset ?? 0 }, bossAnimStyle]}>
            <Image
              source={bossProfile.source}
              style={[
                s.bossFrameSheet,
                {
                  width: bossScaledFrameW * bossProfile.cols,
                  height: bossProfile.viewH * bossProfile.rows,
                  marginLeft: -bossCol * bossScaledFrameW - (bossScaledFrameW - bossProfile.viewW) / 2,
                  marginTop: -bossRow * bossProfile.viewH,
                },
              ]}
              resizeMode="stretch"
            />
            <Animated.View style={bossFlashStyle} />
          </Animated.View>
        </View>
      </ImageBackground>

      <View style={s.playerHpRow}>
        <Text style={s.playerHpLabel}>HP</Text>
        <View style={s.playerHpTrack}>
          <Animated.View style={[s.playerHpFill, playerHpStyle]} />
        </View>
      </View>
    </>
  );

  const contentSectionNode = (
    <>
      <View style={[s.stepCard, isLandscape && { minHeight: 0, maxHeight: undefined, padding: 10 }]}>
        <Text style={s.stepLabel}>
          {t('cook_step')} {Math.min(battle.currentStep + 1, totalSteps)} / {totalSteps}
        </Text>
        <CookingActionIcon text={actionIconText} size={44} style={s.actionIcon} />
        <Animated.Text style={[s.stepText, stepSlideStyle, isLandscape && s.stepTextLandscape]}>
          {stepText}
        </Animated.Text>
        {durationStr && (
          <View style={s.durationBadge}>
            <Text style={s.durationText}>{durationStr}</Text>
          </View>
        )}
      </View>

      <View style={[s.bottomArea, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <PressableScale
          onPress={handlePrevStep}
          disabled={!isIdle || !canGoBack || isComplete}
          pointerEvents={!isIdle || !canGoBack || isComplete ? 'none' : 'auto'}
          style={[s.backButton, (!isIdle || !canGoBack || isComplete) && s.buttonDisabled]}
        >
          <View style={s.backButtonInner}>
            <Text style={s.backButtonText}>← {t('cook_back')}</Text>
          </View>
        </PressableScale>
        <PressableScale
          onPress={handleNextStep}
          sound={false}
          disabled={!isIdle || isComplete}
          pointerEvents={!isIdle || isComplete ? 'none' : 'auto'}
          style={[s.nextButton, (!isIdle || isComplete) && s.nextButtonDisabled]}
        >
          <View style={isLastStep ? s.doneButtonInner : s.nextButtonInner}>
            <Text style={isLastStep ? s.doneButtonText : s.nextButtonText}>
              {isLastStep ? `✓ ${t('cook_done')}` : `${t('cook_next')} →`}
            </Text>
          </View>
        </PressableScale>
      </View>
    </>
  );

  return (
    <View style={[s.container, isLandscape && { flexDirection: 'row' }]}>
      {isLandscape ? (
        <>
          {/* Left column — battle arena (40%) */}
          <View style={{ width: screenWidth * 0.4, paddingTop: insets.top, paddingLeft: insets.left }}>
            {battleSectionNode}
          </View>
          {/* Right column — content (60%) */}
          <View style={{ flex: 1, paddingRight: insets.right }}>
            {topBarNode}
            {contentSectionNode}
          </View>
        </>
      ) : (
        <>
          {topBarNode}
          {battleSectionNode}
          {contentSectionNode}
        </>
      )}

      {/* Completion modal — always absolute on top */}
      {battle.showCompletion && (
        <View style={s.completionOverlay}>
          <Animated.View style={[s.completionCard, modalCardStyle]}>
            <Image
              source={require('../../assets/candidates/openart/rpg-icons-selected/I_Crystal01.png')}
              style={s.completionIcon}
              resizeMode="contain"
            />
            <Text style={s.completionTitle}>{t('cook_complete_title')}</Text>
            <Text style={s.completionRecipeName}>{recipe.name}</Text>
            {finalTimeSecs !== null && (
              <View style={s.completionTimeRow}>
                <Text style={s.completionTimeLabel}>{t('cook_session_time')}</Text>
                <Text style={s.completionTimeValue}>{formatCookTime(finalTimeSecs)}</Text>
              </View>
            )}
            <PressableScale onPress={() => router.back()} style={s.completionButtonWrap}>
              <View style={s.completionButtonMuted}>
                <Text style={s.completionButtonMutedText}>{t('cook_back_to_recipe')}</Text>
              </View>
            </PressableScale>
            <PressableScale onPress={() => router.replace('/')} style={s.completionButtonWrap}>
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
  // Root
  container:    { flex: 1, backgroundColor: '#16213e' },
  center:       { flex: 1, backgroundColor: '#16213e', alignItems: 'center', justifyContent: 'center', padding: 24 },
  mutedText:    { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },
  errorText:    { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 9, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  errorBackButton: { borderWidth: 1, borderColor: '#4a4a6a', paddingHorizontal: 20, paddingVertical: 14 },

  // Section 1 — Top bar
  topBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, gap: 12 },
  exitHitArea:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  exitText:     { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 14 },
  topTitle:     { flex: 1, fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 7, textAlign: 'center' },
  stepCounter:  { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, minWidth: 40, textAlign: 'right' },

  // Section 2 — Boss HP
  bossHpSection: { paddingHorizontal: 16, marginBottom: 8 },
  bossHpTrack:  { height: 10, backgroundColor: '#2a2a4a', borderWidth: 1, borderColor: '#4a4a6a' },
  bossHpFill:   { height: '100%', backgroundColor: '#c84b4b' },

  // Section 3 — Battle arena
  battleStage:  { height: 240, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8, position: 'relative', overflow: 'hidden' },
  battleStageImage: { opacity: 0.9 },
  battleTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 12, 24, 0.28)' },
  smokeLayer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  smokePuff: { position: 'absolute', width: 170, height: 170, opacity: 0.72 },
  smokePuffLeft: { left: 8, bottom: 10 },
  smokePuffRight: { right: 10, bottom: 32, transform: [{ scaleX: -1 }, { scale: 1.2 }] },
  smokePuffCenter: { left: '36%', bottom: 4, opacity: 0.58, transform: [{ scale: 1.28 }] },
  heroSlot:     { width: 92, height: 100 },
  heroWitchSlot: { width: 96, height: 120 },
  heroImage:    { width: 92, height: 92 },
  heroFrameViewport: { width: 92, height: 92, overflow: 'hidden' },
  heroWitchViewport: { width: 96, height: 120, overflow: 'visible' },
  heroFrameImage: { width: 92, height: 92 },
  heroWitchImage: { width: 96, height: 120 },
  heroFrameSheet: { position: 'absolute', top: 0, left: 0 },
  bossSlot:     { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', zIndex: 6 },
  bossBox:      { overflow: 'hidden' },
  bossFrameSheet: { position: 'absolute', top: 0, left: 0 },

  // Projectiles & FX
  fireballWrapper: { position: 'absolute', bottom: 28, left: 76, width: 96, height: 70, overflow: 'hidden' },
  fireballImage:   { width: 112, height: 64 },
  hitImpactWrapper: { position: 'absolute', bottom: 62, right: 54, width: 138, height: 138, zIndex: 12 },
  hitImpactImage: { width: 138, height: 138, opacity: 0.94 },
  defeatRingWrapper: { position: 'absolute', bottom: 40, right: 42, width: 168, height: 168, zIndex: 4 },
  defeatRingImage: { width: 168, height: 168, opacity: 0.9 },
  bossAuraWrapper: { position: 'absolute', bottom: 28, right: 26, width: 188, height: 188, zIndex: 3 },
  bossAuraImage: { width: 188, height: 188 },
  ambientOrbWrapper: { position: 'absolute', bottom: 46, right: 104, width: 96, height: 96, overflow: 'hidden', zIndex: 2 },
  ambientOrbTwoWrapper: { position: 'absolute', bottom: 10, right: 118, width: 96, height: 96, overflow: 'hidden', zIndex: 2 },
  orbWrapper:      { position: 'absolute', bottom: 24, right: 112, width: 96, height: 96, overflow: 'hidden' },
  orbSheet:        { width: 96 * 3, height: 192, marginTop: -48 },
  damageNumber:    { position: 'absolute', bottom: 100, right: 110, zIndex: 10, fontFamily: 'PressStart2P_400Regular', color: '#ff6600', fontSize: 12 },

  // Section 4 — Player HP
  playerHpRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  playerHpLabel: { fontFamily: 'PressStart2P_400Regular', color: '#6fcf97', fontSize: 7, width: 20 },
  playerHpTrack: { flex: 1, height: 8, backgroundColor: '#2a2a4a', borderWidth: 1, borderColor: '#4a4a6a' },
  playerHpFill:  { height: '100%', backgroundColor: '#6fcf97' },

  // Section 5 — Step card
  stepCard:     { flex: 1, minHeight: 160, maxHeight: 250, marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2a2a4a', borderRadius: 4, padding: 18, justifyContent: 'center', alignItems: 'center' },
  stepLabel:    { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, marginBottom: 16 },
  actionIcon:  { marginBottom: 16 },
  stepText:     { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 13, textAlign: 'center', lineHeight: 30 },
  stepTextLandscape: { fontSize: 10, lineHeight: 22 },
  durationBadge: { marginTop: 20, borderWidth: 1, borderColor: '#c8a84b', paddingHorizontal: 16, paddingVertical: 8 },
  durationText:  { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },

  // Section 6 — Bottom buttons
  bottomArea:      { flexDirection: 'row', minHeight: 82, paddingHorizontal: 16, gap: 12 },
  backButton:      { flex: 1 },
  backButtonInner: { borderWidth: 1, borderColor: '#4a4a6a', padding: 18, minHeight: 58, alignItems: 'center', justifyContent: 'center' },
  backButtonText:  { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },
  nextButton:      { flex: 2 },
  fullWidthButton: { flex: 1 },
  buttonDisabled:  { opacity: 0.4 },
  nextButtonDisabled: { opacity: 0.6 },
  nextButtonInner: { borderWidth: 1, borderColor: '#e2b96f', padding: 18, minHeight: 58, alignItems: 'center', justifyContent: 'center' },
  nextButtonText:  { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10 },
  doneButtonInner: { backgroundColor: '#c8a84b', padding: 18, minHeight: 58, alignItems: 'center', justifyContent: 'center' },
  doneButtonText:  { fontFamily: 'PressStart2P_400Regular', color: '#1a1a2e', fontSize: 10 },

  // Completion modal
  completionOverlay:         { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, elevation: 20, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  completionCard:            { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', padding: 32, alignItems: 'center', width: '100%', gap: 16 },
  completionIcon:            { width: 64, height: 64 },
  completionTitle:           { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 12, textAlign: 'center', lineHeight: 26 },
  completionRecipeName:      { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, textAlign: 'center', marginBottom: 8 },
  completionTimeRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#2d2d4e', paddingHorizontal: 20, paddingVertical: 10, marginBottom: 4 },
  completionTimeLabel:       { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7 },
  completionTimeValue:       { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 11 },
  completionButtonWrap:      { width: '100%' },
  completionButtonMuted:     { borderWidth: 1, borderColor: '#4a4a6a', padding: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  completionButtonMutedText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },
  completionButtonGold:      { borderWidth: 1, borderColor: '#e2b96f', padding: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  completionButtonGoldText:  { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 8 },
});
