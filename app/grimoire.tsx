// ─── app/grimoire.tsx ────────────────────────────────────────────────────────
import { useEffect, useState, useCallback, useRef } from 'react';
import { Text, View, Pressable, FlatList, ActivityIndicator, TextInput, RefreshControl, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { useLanguage } from '../src/context/LanguageContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from '@firebase/firestore';
import { getCharacterRank, getLevelProgress, CharacterRank } from '../src/data/character';
import LevelUpModal from '../src/components/LevelUpModal';
import { StringKey } from '../src/i18n/strings';

const RANK_STORAGE_KEY = 'grimoire_rank_level';
const MAX_PREVIEW = 5;

// ─── Maps English rank title → i18n key ─────────────────────────────────────
const RANK_TITLE_KEY: Record<string, StringKey> = {
  'APPRENTICE': 'rank_apprentice',
  'COOK': 'rank_cook',
  'CHEF': 'rank_chef',
  'SORCERER': 'rank_sorcerer',
  'ARCH-MAGE': 'rank_archmage',
};

const RANK_FLAVOR_KEY: Record<string, StringKey> = {
  'APPRENTICE': 'flavor_apprentice',
  'COOK': 'flavor_cook',
  'CHEF': 'flavor_chef',
  'SORCERER': 'flavor_sorcerer',
  'ARCH-MAGE': 'flavor_archmage',
};

type Ingredient = { id: string; name: string; emoji: string; quantity: string };
type Recipe = { id: string; name: string; steps: string; ingredients: Ingredient[]; createdAt: any };

export default function Grimoire() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpRank, setLevelUpRank] = useState<CharacterRank | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const fetchRecipes = useCallback(async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'recipes'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        ingredients: doc.data().ingredients ?? [],
      })) as Recipe[];

      setRecipes(data);

      const newRank = getCharacterRank(data.length);
      const storedLevel = await AsyncStorage.getItem(RANK_STORAGE_KEY);
      if (!storedLevel) {
        await AsyncStorage.setItem(RANK_STORAGE_KEY, String(newRank.level));
      } else if (newRank.level > parseInt(storedLevel, 10)) {
        await AsyncStorage.setItem(RANK_STORAGE_KEY, String(newRank.level));
        setLevelUpRank(newRank);
        setShowLevelUp(true);
      }
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  useEffect(() => { fetchRecipes().finally(() => setLoading(false)); }, [fetchRecipes]);

  useEffect(() => {
    const rank = getCharacterRank(recipes.length);
    const progress = getLevelProgress(recipes.length, rank);
    Animated.timing(progressAnim, { toValue: progress, duration: 900, delay: 200, useNativeDriver: false }).start();
  }, [recipes.length]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecipes();
    setRefreshing(false);
  }, [fetchRecipes]);

  const filtered = search.trim()
    ? recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : recipes;

  const rank = getCharacterRank(recipes.length);
  const recipesUntilNext = rank.nextLevelRecipes ? rank.nextLevelRecipes - recipes.length : 0;

  return (
    <View style={gStyles.container}>
      {levelUpRank && (
        <LevelUpModal visible={showLevelUp} rank={levelUpRank} onDismiss={() => setShowLevelUp(false)} />
      )}

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <View style={gStyles.header}>
        <Pressable style={({ pressed }) => [pressed && { opacity: 0.5 }]} onPress={() => router.replace('/home')}>
          <Text style={gStyles.back}>{t('grimoire_back')}</Text>
        </Pressable>
        <Text style={gStyles.title}>{t('grimoire_title')}</Text>
        <Pressable style={({ pressed }) => [pressed && { opacity: 0.5 }]} onPress={() => router.push('/account')}>
          <Text style={gStyles.headerAction}>⚙</Text>
        </Pressable>
      </View>

      {/* ─── Character card ───────────────────────────────────────────────── */}
      <View style={gStyles.characterCard}>
        <View style={gStyles.characterTop}>
          <Text style={gStyles.characterEmoji}>{rank.emoji}</Text>
          <View style={gStyles.characterInfo}>
            <Text style={gStyles.characterTitle}>
              {t(RANK_TITLE_KEY[rank.title])}
            </Text>
            <Text style={gStyles.characterFlavor}>
              {t(RANK_FLAVOR_KEY[rank.title])}
            </Text>
          </View>
          <Text style={gStyles.characterLevel}>LV.{rank.level}</Text>
        </View>
        <View style={gStyles.progressTrack}>
          <Animated.View style={[gStyles.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
        <View style={gStyles.progressMeta}>
          <Text style={gStyles.progressLabel}>{recipes.length} {t('grimoire_recipes')}</Text>
          {rank.nextTitle && (
            <Text style={gStyles.progressLabel}>
              {recipesUntilNext} {t('grimoire_to')} {t(RANK_TITLE_KEY[rank.nextTitle])}
            </Text>
          )}
        </View>
      </View>

      {/* ─── Search ───────────────────────────────────────────────────────── */}
      <TextInput
        style={gStyles.search}
        placeholder={t('grimoire_search')}
        placeholderTextColor="#4a4a6a"
        value={search}
        onChangeText={setSearch}
      />

      {/* ─── List ─────────────────────────────────────────────────────────── */}
      <Text style={gStyles.subtitle}>{t('grimoire_subtitle')}</Text>
      {loading ? (
        <ActivityIndicator color="#e2b96f" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <Text style={gStyles.empty}>
          {search.trim() ? t('grimoire_empty_search') : t('grimoire_empty_list')}
        </Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          style={gStyles.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e2b96f" colors={['#e2b96f']} />}
          renderItem={({ item }) => {
            const preview = item.ingredients.slice(0, MAX_PREVIEW);
            const overflow = item.ingredients.length - MAX_PREVIEW;
            return (
              <Pressable
                style={({ pressed }) => [gStyles.card, pressed && { backgroundColor: '#2d2d4e' }]}
                onPress={() => router.push(`/recipe/${item.id}`)}
              >
                <View style={gStyles.cardTop}>
                  <Text style={gStyles.cardTitle} numberOfLines={1}>{item.name.toUpperCase()}</Text>
                  <Text style={gStyles.cardArrow}>▶</Text>
                </View>
                {item.ingredients.length > 0 && (
                  <View style={gStyles.emojiRow}>
                    {preview.map((ing, i) => (
                      <View key={i} style={gStyles.emojiTile}>
                        <Text style={gStyles.emojiText}>{ing.emoji}</Text>
                      </View>
                    ))}
                    {overflow > 0 && (
                      <View style={gStyles.emojiTile}>
                        <Text style={gStyles.overflowText}>+{overflow}</Text>
                      </View>
                    )}
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      )}

      {/* ─── New recipe button ────────────────────────────────────────────── */}
      <Pressable
        style={({ pressed }) => [gStyles.newButton, pressed && { backgroundColor: '#2d2d4e' }]}
        onPress={() => router.push('/create-recipe')}
      >
        <Text style={gStyles.newButtonText}>{t('grimoire_new_recipe')}</Text>
      </Pressable>
    </View>
  );
}

const gStyles = {
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 24, paddingTop: 60 } as const,
  header: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 8 },
  headerAction: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 14 } as const,
  back: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 20 } as const,
  subtitle: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 16 } as const,
  characterCard: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 14, marginBottom: 16 } as const,
  characterTop: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 12 },
  characterEmoji: { fontSize: 28, marginRight: 12 } as const,
  characterInfo: { flex: 1 } as const,
  characterTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 9, marginBottom: 5 } as const,
  characterFlavor: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, lineHeight: 13 } as const,
  characterLevel: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 9 } as const,
  progressTrack: { height: 6, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', marginBottom: 8 } as const,
  progressFill: { height: '100%' as const, backgroundColor: '#e2b96f' },
  progressMeta: { flexDirection: 'row' as const, justifyContent: 'space-between' as const },
  progressLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7 } as const,
  search: { backgroundColor: '#16213e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 14, marginBottom: 16, fontFamily: 'PressStart2P_400Regular', fontSize: 9 } as const,
  empty: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 10, textAlign: 'center' as const, marginTop: 60, lineHeight: 24 },
  list: { flex: 1 } as const,
  card: { borderWidth: 1, borderColor: '#2d2d4e', backgroundColor: '#16213e', padding: 16, marginBottom: 12 } as const,
  cardTop: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
  cardTitle: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 10, flex: 1, marginRight: 8 } as const,
  cardArrow: { color: '#e2b96f', fontSize: 12 } as const,
  emojiRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginTop: 12, gap: 6 },
  emojiTile: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', width: 36, height: 36, alignItems: 'center' as const, justifyContent: 'center' as const },
  emojiText: { fontSize: 18 } as const,
  overflowText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7 } as const,
  newButton: { borderWidth: 2, borderColor: '#e2b96f', padding: 16, alignItems: 'center' as const, marginTop: 16 },
  newButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10 } as const,
};