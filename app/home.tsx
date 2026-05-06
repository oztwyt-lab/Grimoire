import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, Animated, Dimensions, ImageBackground, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getCountFromServer } from '@firebase/firestore';
import { getCharacterRank, getLevelProgress } from '../src/data/character';
import WizardSprite, { WizardSpriteHandle } from '../src/components/WizardSprite';
import PressableScale from '../src/components/PressableScale';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../src/context/LanguageContext';
import { RANK_TITLE_KEY } from '../src/i18n/strings';

const { width, height } = Dimensions.get('window');
const HUD_HEIGHT = 90;
const NAV_HEIGHT = 96;
// Wizard container anchor: left = width/2 - 45, so wizard right edge ≈ width/2 + 45
const CHARACTER_DISPLAY_W = 120;
const CHARACTER_DISPLAY_H = 160;
const WIZARD_RIGHT_OFFSET = CHARACTER_DISPLAY_W / 2;
const FIREBALL_SIZE = 76;
const FIREBALL_FRAMES = [
  require('../assets/effects/fireball/Effects_Fire_0_01.png'),
  require('../assets/effects/fireball/Effects_Fire_0_02.png'),
  require('../assets/effects/fireball/Effects_Fire_0_03.png'),
  require('../assets/effects/fireball/Effects_Fire_0_04.png'),
  require('../assets/effects/fireball/Effects_Fire_0_05.png'),
  require('../assets/effects/fireball/Effects_Fire_0_06.png'),
  require('../assets/effects/fireball/Effects_Fire_0_07.png'),
  require('../assets/effects/fireball/Effects_Fire_0_08.png'),
  require('../assets/effects/fireball/Effects_Fire_0_09.png'),
  require('../assets/effects/fireball/Effects_Fire_0_10.png'),
  require('../assets/effects/fireball/Effects_Fire_0_11.png'),
  require('../assets/effects/fireball/Effects_Fire_0_12.png'),
  require('../assets/effects/fireball/Effects_Fire_0_13.png'),
  require('../assets/effects/fireball/Effects_Fire_0_14.png'),
  require('../assets/effects/fireball/Effects_Fire_0_15.png'),
  require('../assets/effects/fireball/Effects_Fire_0_16.png'),
  require('../assets/effects/fireball/Effects_Fire_0_17.png'),
  require('../assets/effects/fireball/Effects_Fire_0_18.png'),
  require('../assets/effects/fireball/Effects_Fire_0_19.png'),
  require('../assets/effects/fireball/Effects_Fire_0_20.png'),
  require('../assets/effects/fireball/Effects_Fire_0_21.png'),
  require('../assets/effects/fireball/Effects_Fire_0_22.png'),
  require('../assets/effects/fireball/Effects_Fire_0_23.png'),
  require('../assets/effects/fireball/Effects_Fire_0_24.png'),
  require('../assets/effects/fireball/Effects_Fire_0_25.png'),
  require('../assets/effects/fireball/Effects_Fire_0_26.png'),
  require('../assets/effects/fireball/Effects_Fire_0_27.png'),
  require('../assets/effects/fireball/Effects_Fire_0_28.png'),
];
const FLOATING_PARTICLES = Array.from({ length: 8 }, (_, index) => ({
  id: index,
  left: Math.random() * width,
  size: 3 + Math.random() * 3,
  drift: 20 + Math.random() * 20,
  opacity: 0.15 + Math.random() * 0.15,
  delay: Math.random() * 1800,
  tint: index % 3 === 0 ? '#c8a84b' : '#ffffff',
}));

type Profile = { nickname: string; character: string };

function FloatingParticle({
  left,
  size,
  drift,
  opacity,
  delay,
  tint,
  roomHeight,
}: {
  left: number;
  size: number;
  drift: number;
  opacity: number;
  delay: number;
  tint: string;
  roomHeight: number;
}) {
  const translateY = useSharedValue(0);
  const particleOpacity = useSharedValue(0);

  useEffect(() => {
    const travel = roomHeight * 0.86;
    const duration = (travel / drift) * 1000;

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(-travel, { duration, easing: Easing.linear })
        ),
        -1,
        false
      )
    );
    particleOpacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(opacity, { duration: duration * 0.2, easing: Easing.out(Easing.ease) }),
          withTiming(opacity, { duration: duration * 0.45, easing: Easing.linear }),
          withTiming(0, { duration: duration * 0.35, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, [delay, drift, opacity, particleOpacity, roomHeight, translateY]);

  const particleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left,
          width: size,
          height: size,
          backgroundColor: tint,
        },
        particleStyle,
      ]}
    />
  );
}

function CharacterTabIcon() {
  return (
    <View style={styles.characterIcon}>
      <View style={styles.characterHatTip} />
      <View style={styles.characterHat} />
      <View style={styles.characterHead} />
      <View style={styles.characterRobe} />
      <View style={styles.characterStaff} />
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recipeCount, setRecipeCount] = useState(0);

  // ─── Wizard ref (imperative control) ─────────────────────────────────────
  const wizardRef = useRef<WizardSpriteHandle>(null);

  // ─── Double-tap detection ─────────────────────────────────────────────────
  const lastWizardTapRef = useRef(0);

  // ─── Fireball animation ───────────────────────────────────────────────────
  const fireballX = useRef(new Animated.Value(0)).current;
  const [fireballVisible, setFireballVisible] = useState(false);
  const [fireballFrame, setFireballFrame] = useState(0);
  const fireballFrameRef = useRef(0);
  const fireballIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (fireballIntervalRef.current) clearInterval(fireballIntervalRef.current);
    };
  }, []);

  function shootFireball() {
    if (fireballVisible) return;
    const wizX = wizardRef.current?.getX() ?? 0;
    const startX = width / 2 + WIZARD_RIGHT_OFFSET + wizX;

    fireballX.setValue(startX);
    fireballFrameRef.current = 0;
    setFireballFrame(0);
    setFireballVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    fireballIntervalRef.current = setInterval(() => {
      fireballFrameRef.current = (fireballFrameRef.current + 1) % FIREBALL_FRAMES.length;
      setFireballFrame(fireballFrameRef.current);
    }, 45);

    Animated.timing(fireballX, {
      toValue: width + 100,
      duration: 520,
      useNativeDriver: true,
    }).start(() => {
      if (fireballIntervalRef.current) clearInterval(fireballIntervalRef.current);
      setFireballVisible(false);
    });
  }

  function handleWizardPress() {
    const now = Date.now();
    if (now - lastWizardTapRef.current < 350) {
      lastWizardTapRef.current = 0;
      wizardRef.current?.castFireball();
      shootFireball();
    } else {
      lastWizardTapRef.current = now;
    }
  }

  function handleRoomPressIn(e: { nativeEvent: { locationX: number } }) {
    const tapX = e.nativeEvent.locationX;
    const wizScreenX = width / 2 + (wizardRef.current?.getX() ?? 0);
    const direction = tapX >= wizScreenX ? 'right' : 'left';
    wizardRef.current?.startWalking(direction, tapX);
  }

  // ─── Nav button scale animations ──────────────────────────────────────────
  const grimoireScale = useRef(new Animated.Value(1)).current;
  const inventoryScale = useRef(new Animated.Value(1)).current;
  const shopScale = useRef(new Animated.Value(1)).current;
  const characterScale = useRef(new Animated.Value(1)).current;

  const pressIn = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 1.25, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };
  const pressOut = (scale: Animated.Value) => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };

  // ─── Profile + recipe count fetch ────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
      if (!profileSnap.exists()) {
        router.replace('/character-setup');
        return;
      }
      setProfile(profileSnap.data() as Profile);
      const countSnap = await getCountFromServer(
        query(collection(db, 'recipes'), where('userId', '==', user.uid))
      );
      setRecipeCount(countSnap.data().count);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const rank = getCharacterRank(recipeCount);
  const progress = getLevelProgress(recipeCount, rank);

  const nav = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const insets = useSafeAreaInsets();
  const hudBottom = HUD_HEIGHT + 52;
  const roomHeight = height - hudBottom - NAV_HEIGHT - insets.bottom;
  const characterBottom = height * 0.22;
  const charTop = height - characterBottom - CHARACTER_DISPLAY_H;

  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a2e', overflow: 'visible' }}>

      {/* ── Room background image ── */}
      <ImageBackground
        source={require('../assets/room-bg.jpg')}
        style={{ position: 'absolute', top: hudBottom, left: 0, right: 0, height: roomHeight }}
        resizeMode="cover"
      >
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 12, 24, 0.35)' }} />
        {FLOATING_PARTICLES.map((particle) => (
          <FloatingParticle
            key={particle.id}
            left={particle.left}
            size={particle.size}
            drift={particle.drift}
            opacity={particle.opacity}
            delay={particle.delay}
            tint={particle.tint}
            roomHeight={roomHeight}
          />
        ))}
      </ImageBackground>

      {/* ── Room press area — hold to walk wizard in that direction ── */}
      <Pressable
        style={{ position: 'absolute', top: hudBottom, left: 0, right: 0, height: roomHeight }}
        onPressIn={handleRoomPressIn}
      />

      {/* ── Wizard (on top of room tap area, receives its own touches) ── */}
      <Pressable
        style={{
          position: 'absolute',
          left: width / 2 - CHARACTER_DISPLAY_W / 2,
          bottom: characterBottom,
          width: CHARACTER_DISPLAY_W,
          height: CHARACTER_DISPLAY_H,
          overflow: 'visible',
        }}
        onPress={handleWizardPress}
      >
        <WizardSprite ref={wizardRef} />
      </Pressable>

      {/* ── Fireball ── */}
      {fireballVisible && (
        <Animated.View
          style={{
            position: 'absolute',
            top: charTop + 36,
            left: 0,
            width: FIREBALL_SIZE,
            height: Math.round(FIREBALL_SIZE * 0.58),
            overflow: 'hidden',
            transform: [{ translateX: fireballX }],
            zIndex: 10,
          }}
          pointerEvents="none"
        >
          <Image
            source={FIREBALL_FRAMES[fireballFrame]}
            style={{
              width: FIREBALL_SIZE,
              height: Math.round(FIREBALL_SIZE * 0.58),
            }}
            resizeMode="stretch"
          />
        </Animated.View>
      )}

      {/* ── HUD — top overlay ── */}
      <View style={styles.hud}>
        <View style={styles.hudRow}>
          <Text style={styles.hudName} numberOfLines={1}>
            {profile?.nickname ?? '...'}
          </Text>
          <Text style={styles.hudRank}>
            {rank.emoji}  {RANK_TITLE_KEY[rank.title] ? t(RANK_TITLE_KEY[rank.title] as any) : rank.title}  LV.{rank.level}
          </Text>
          <PressableScale onPress={() => router.push('/settings')} style={styles.gearButton}>
            <Text style={styles.gearIcon}>⚙</Text>
          </PressableScale>
        </View>
        <View style={styles.xpTrack}>
          <View style={[styles.xpFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.xpLabel}>
          {`${recipeCount} ${t('home_recipes')}`}
          {rank.nextTitle
            ? `  ·  ${(rank.nextLevelRecipes ?? 0) - recipeCount} ${t('home_to')} ${rank.nextTitle}`
            : `  ·  ${t('home_max_rank')}`}
        </Text>
      </View>

      {/* ── Navigation bar — bottom ── */}
      <View style={[styles.nav, { height: NAV_HEIGHT + insets.bottom, paddingBottom: insets.bottom + 16 }]}>

        {/* GRIMOR */}
        <Pressable
          style={styles.navItem}
          onPress={() => nav('/grimoire')}
          onPressIn={() => pressIn(grimoireScale)}
          onPressOut={() => pressOut(grimoireScale)}
        >
          <Animated.Text style={[styles.navEmoji, { transform: [{ scale: grimoireScale }] }]}>
            📖
          </Animated.Text>
          <Text style={styles.navLabel}>{t('nav_grimor')}</Text>
        </Pressable>

        {/* INVENTORY */}
        <Pressable
          style={[styles.navItem, styles.navItemCenter]}
          onPress={() => nav('/inventory')}
          onPressIn={() => pressIn(inventoryScale)}
          onPressOut={() => pressOut(inventoryScale)}
        >
          <Animated.Text style={[styles.navEmoji, { transform: [{ scale: inventoryScale }] }]}>
            🎒
          </Animated.Text>
          <Text style={styles.navLabel}>{t('nav_inventory')}</Text>
        </Pressable>

        {/* SHOP */}
        <Pressable
          style={[styles.navItem, styles.navItemShop]}
          onPress={() => nav('/shop')}
          onPressIn={() => pressIn(shopScale)}
          onPressOut={() => pressOut(shopScale)}
        >
          <Animated.Text style={[styles.navEmoji, { transform: [{ scale: shopScale }] }]}>
            🛒
          </Animated.Text>
          <Text style={styles.navLabel}>{t('nav_shop')}</Text>
        </Pressable>

        {/* CHARACTER */}
        <Pressable
          style={styles.navItem}
          onPress={() => nav('/character')}
          onPressIn={() => pressIn(characterScale)}
          onPressOut={() => pressOut(characterScale)}
        >
          <Animated.View style={[styles.navIconWrap, { transform: [{ scale: characterScale }] }]}>
            <CharacterTabIcon />
          </Animated.View>
          <Text style={styles.navLabel}>{t('nav_character')}</Text>
        </Pressable>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(16, 21, 38, 0.90)',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d4e',
    height: HUD_HEIGHT + 52,
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hudName: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#e2b96f',
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  hudRank: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#c8c8e8',
    fontSize: 8,
  },
  gearButton: {
    marginLeft: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#e2b96f',
    backgroundColor: '#16213e',
  },
  gearIcon: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#e2b96f',
    fontSize: 16,
  },
  xpTrack: {
    height: 5,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d4e',
    marginBottom: 6,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#e2b96f',
  },
  xpLabel: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 7,
  },
  nav: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: NAV_HEIGHT,
    backgroundColor: 'rgba(16, 21, 38, 0.92)',
    borderTopWidth: 2,
    borderTopColor: '#2d2d4e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  navItemCenter: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#2d2d4e',
  },
  navItemShop: {
    borderRightWidth: 1,
    borderColor: '#2d2d4e',
  },
  navEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  navIconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  characterIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
  },
  characterHatTip: {
    width: 4,
    height: 4,
    backgroundColor: '#c8a84b',
  },
  characterHat: {
    width: 16,
    height: 6,
    backgroundColor: '#c8a84b',
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  characterHead: {
    width: 8,
    height: 5,
    backgroundColor: '#c8a84b',
    marginTop: -1,
  },
  characterRobe: {
    width: 14,
    height: 9,
    backgroundColor: '#c8a84b',
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: '#2a2a4a',
  },
  characterStaff: {
    position: 'absolute',
    right: 1,
    bottom: 0,
    width: 3,
    height: 15,
    backgroundColor: '#c8a84b',
  },
  particle: {
    position: 'absolute',
    bottom: -8,
  },
  navLabel: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 7,
  },
});
