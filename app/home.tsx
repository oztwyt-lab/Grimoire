import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, Animated, Dimensions, ImageBackground, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getCountFromServer } from '@firebase/firestore';
import { getCharacterRank, getLevelProgress } from '../src/data/character';
import WizardSprite from '../src/components/WizardSprite';
import PressableScale from '../src/components/PressableScale';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../src/context/LanguageContext';
import { RANK_TITLE_KEY } from '../src/i18n/strings';

const { width, height } = Dimensions.get('window');
const HUD_HEIGHT = 90;
const NAV_HEIGHT = 96;

type Profile = { nickname: string; character: string };

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recipeCount, setRecipeCount] = useState(0);

  // ─── Nav button scale animations (native driver only) ────────────────────
  const grimoireScale = useRef(new Animated.Value(1)).current;
  const inventoryScale = useRef(new Animated.Value(1)).current;
  const characterScale = useRef(new Animated.Value(1)).current;

  const pressIn = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 1.25,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const pressOut = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
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

  const hudBottom = HUD_HEIGHT + 52;
  const roomHeight = height - hudBottom - NAV_HEIGHT;
  const charTop = hudBottom + roomHeight * 0.68;

  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a2e' }}>

      {/* ── Room background image ── */}
      <ImageBackground
        source={require('../assets/room-bg.jpg')}
        style={{ position: 'absolute', top: hudBottom, left: 0, right: 0, height: roomHeight }}
        resizeMode="cover"
      >
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 12, 24, 0.35)' }} />
      </ImageBackground>

      {/* ── Wizard character ── */}
      <View style={{ position: 'absolute', left: width / 2 - 45, top: charTop }}>
        <WizardSprite />
      </View>

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
      <View style={styles.nav}>

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

        {/* CHARACTER */}
        <Pressable
          style={styles.navItem}
          onPress={() => nav('/character')}
          onPressIn={() => pressIn(characterScale)}
          onPressOut={() => pressOut(characterScale)}
        >
          <Animated.Text style={[styles.navEmoji, { transform: [{ scale: characterScale }] }]}>
            🧙
          </Animated.Text>
          <Text style={styles.navLabel}>{t('nav_character')}</Text>
        </Pressable>

      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
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
    paddingBottom: 18,
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
  navEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  navLabel: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 7,
  },
});
