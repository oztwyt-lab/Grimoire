// ─── app/grimoire.tsx ────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Text, View, Pressable, FlatList, ActivityIndicator, TextInput, RefreshControl, Animated as RNAnimated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { useLanguage } from '../src/context/LanguageContext';
import { useInventory } from '../src/context/InventoryContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from '@firebase/firestore';
import { getCharacterRank, getLevelProgress, CharacterRank } from '../src/data/character';
import LevelUpModal from '../src/components/LevelUpModal';
import IngredientIcon from '../src/components/IngredientIcon';
import { DEFAULT_RECIPE_ICON } from '../src/components/RecipeIconPicker';
import { StringKey } from '../src/i18n/strings';
import { InventoryItem } from '../lib/firestore';
import { playSFX } from '../src/services/audio';
import { getRecentRecipeIds } from '../src/services/recentRecipes';
import { RecipeLanguageTag, normalizeRecipeLanguage, recipeLanguageLabel } from '../src/data/recipeLanguage';
import { MEAL_TYPES, MealType } from '../src/data/mealTypes';

const RANK_STORAGE_KEY = 'grimoire_rank_level';
const MAX_PREVIEW = 5;

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
type Recipe = { id: string; name: string; icon?: string; recipeLanguage?: RecipeLanguageTag; mealType?: MealType; steps: string; ingredients: Ingredient[]; createdAt: any };
type CharacterCardTab = 'rank' | 'recent';
type RecipeListTab = 'recent' | 'all';

// ─── RecipeCard ──────────────────────────────────────────────────────────────
type RecipeCardProps = {
  recipe: Recipe;
  inventory: InventoryItem[];
  onPress: () => void;
};

function getMealTypeMeta(mealType: MealType | undefined) {
  if (!mealType) return null;
  return MEAL_TYPES.find(mt => mt.value === mealType) ?? null;
}

function RecipeCardComponent({ recipe, inventory, onPress }: RecipeCardProps) {
  const { t } = useLanguage();
  const recipeLanguage = normalizeRecipeLanguage(recipe.recipeLanguage);
  const mealTypeMeta = getMealTypeMeta(recipe.mealType);

  const matchState = useMemo((): 'full' | 'partial' | 'none' => {
    if (inventory.length === 0 || recipe.ingredients.length === 0) return 'partial';
    const ids = new Set(inventory.map(i => i.id));
    const count = recipe.ingredients.filter(i => ids.has(i.id)).length;
    if (count === recipe.ingredients.length) return 'full';
    if (count === 0) return 'none';
    return 'partial';
  }, [inventory, recipe.ingredients]);

  const opacity = useRef(new RNAnimated.Value(matchState === 'none' ? 0.5 : 1.0)).current;

  useEffect(() => {
    RNAnimated.timing(opacity, { toValue: matchState === 'none' ? 0.5 : 1.0, duration: 300, useNativeDriver: true }).start();
  }, [matchState]);

  const isFullMatch = matchState === 'full';
  const preview = recipe.ingredients.slice(0, MAX_PREVIEW);
  const overflow = recipe.ingredients.length - MAX_PREVIEW;

  return (
    <RNAnimated.View style={[gStyles.cardWrapper, { opacity }]}>
      <Pressable
        style={({ pressed }) => [
          gStyles.card,
          isFullMatch && gStyles.cardFull,
          pressed && { backgroundColor: '#2d2d4e' },
        ]}
        onPress={onPress}
      >
        {isFullMatch && (
          <View style={gStyles.readyBadge}>
            <Text style={gStyles.readyText}>{t('recipe_ready')}</Text>
          </View>
        )}
        <View style={gStyles.recipeIconBox}>
          <Text style={gStyles.recipeIconText}>{recipe.icon || DEFAULT_RECIPE_ICON}</Text>
        </View>
        <View style={gStyles.cardBody}>
        <View style={gStyles.cardTop}>
          <Text style={gStyles.cardTitle} numberOfLines={1}>{recipe.name.toUpperCase()}</Text>
          <Text style={gStyles.cardArrow}>▶</Text>
        </View>
        <View style={gStyles.tagRow}>
          {recipeLanguage && (
            <Text style={gStyles.languageTag}>{recipeLanguageLabel(recipeLanguage, t)}</Text>
          )}
          {mealTypeMeta && (
            <Text style={gStyles.mealTypeTag}>{mealTypeMeta.icon} {t(mealTypeMeta.labelKey as StringKey)}</Text>
          )}
        </View>
        {recipe.ingredients.length > 0 && (
          <View style={gStyles.emojiRow}>
            {preview.map((ing, i) => (
              <View key={i} style={gStyles.emojiTile}>
                <IngredientIcon id={ing.id} emoji={ing.emoji} size={22} textStyle={gStyles.emojiText} />
              </View>
            ))}
            {overflow > 0 && (
              <View style={gStyles.emojiTile}>
                <Text style={gStyles.overflowText}>+{overflow}</Text>
              </View>
            )}
          </View>
        )}
        </View>
      </Pressable>
    </RNAnimated.View>
  );
}

const RecipeCard = React.memo(RecipeCardComponent, (prev, next) =>
  prev.recipe.id === next.recipe.id &&
  prev.recipe.name === next.recipe.name &&
  prev.recipe.icon === next.recipe.icon &&
  prev.recipe.ingredients === next.recipe.ingredients &&
  prev.inventory === next.inventory
);

// ─── Grimoire screen ─────────────────────────────────────────────────────────
export default function Grimoire() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const { inventory } = useInventory();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCharacterTab, setActiveCharacterTab] = useState<CharacterCardTab>('rank');
  const [recipeListTab, setRecipeListTab] = useState<RecipeListTab>('recent');
  const [mealFilter, setMealFilter] = useState<MealType | null>(null);
  const [recentRecipeIds, setRecentRecipeIds] = useState<string[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpRank, setLevelUpRank] = useState<CharacterRank | null>(null);

  const progressAnim = useRef(new RNAnimated.Value(0)).current;

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
      setRecentRecipeIds(await getRecentRecipeIds(user.uid));

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

  useFocusEffect(
    useCallback(() => { fetchRecipes().finally(() => setLoading(false)); }, [fetchRecipes])
  );

  useEffect(() => {
    const rank = getCharacterRank(recipes.length);
    const progress = getLevelProgress(recipes.length, rank);
    RNAnimated.timing(progressAnim, { toValue: progress, duration: 900, delay: 200, useNativeDriver: false }).start();
  }, [recipes.length]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecipes();
    setRefreshing(false);
  }, [fetchRecipes]);

  const filtered = search.trim()
    ? recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : recipes;

  const filteredByMealType = useMemo(() => {
    if (!mealFilter) return filtered;
    return filtered.filter(r => r.mealType === mealFilter);
  }, [filtered, mealFilter]);

  const availableMealTypes = useMemo(
    () => MEAL_TYPES.filter(mt => recipes.some(r => r.mealType === mt.value)),
    [recipes]
  );

  const rank = getCharacterRank(recipes.length);
  const recipesUntilNext = rank.nextLevelRecipes ? rank.nextLevelRecipes - recipes.length : 0;
  const recentRecipes = recentRecipeIds
    .map(recentId => recipes.find(recipe => recipe.id === recentId))
    .filter((recipe): recipe is Recipe => Boolean(recipe))
    .slice(0, 5);

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
        <View style={gStyles.headerSpacer} />
      </View>

      {/* ─── Character card ───────────────────────────────────────────────── */}
      <View style={gStyles.characterCard}>
        <View style={gStyles.characterTabs}>
          <Pressable
            onPress={() => setActiveCharacterTab('rank')}
            style={[gStyles.characterTab, activeCharacterTab === 'rank' && gStyles.characterTabActive]}
          >
            <Text style={[gStyles.characterTabText, activeCharacterTab === 'rank' && gStyles.characterTabTextActive]}>
              {t('grimoire_tab_rank')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveCharacterTab('recent')}
            style={[gStyles.characterTab, activeCharacterTab === 'recent' && gStyles.characterTabActive]}
          >
            <Text style={[gStyles.characterTabText, activeCharacterTab === 'recent' && gStyles.characterTabTextActive]}>
              {t('grimoire_tab_recent')}
            </Text>
          </Pressable>
        </View>

        {activeCharacterTab === 'rank' ? (
          <>
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
              <RNAnimated.View style={[gStyles.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
            </View>
            <View style={gStyles.progressMeta}>
              <Text style={gStyles.progressLabel}>{recipes.length} {t('grimoire_recipes')}</Text>
              {rank.nextTitle && (
                <Text style={gStyles.progressLabel}>
                  {recipesUntilNext} {t('grimoire_to')} {t(RANK_TITLE_KEY[rank.nextTitle])}
                </Text>
              )}
            </View>
          </>
        ) : (
          <View style={gStyles.recentList}>
            {recentRecipes.length === 0 ? (
              <Text style={gStyles.recentEmpty}>{t('grimoire_recent_empty')}</Text>
            ) : recentRecipes.map((recentRecipe, index) => (
              <Pressable
                key={recentRecipe.id}
                style={({ pressed }) => [
                  gStyles.recentRow,
                  index === 0 && gStyles.recentRowFirst,
                  pressed && { opacity: 0.65 },
                ]}
                onPress={() => {
                  playSFX('recipe_click');
                  router.push(`/recipe/${recentRecipe.id}`);
                }}
              >
                <Text style={gStyles.recentIcon}>{recentRecipe.icon || DEFAULT_RECIPE_ICON}</Text>
                <Text style={gStyles.recentName} numberOfLines={1}>{recentRecipe.name.toUpperCase()}</Text>
                <Text style={gStyles.recentArrow}>▶</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* ─── Recipe list tabs ─────────────────────────────────────────────── */}
      <View style={gStyles.recipeTabRow}>
        <Pressable onPress={() => setRecipeListTab('recent')} style={[gStyles.recipeTab, recipeListTab === 'recent' && gStyles.recipeTabActive]}>
          <Text style={[gStyles.recipeTabText, recipeListTab === 'recent' && gStyles.recipeTabTextActive]}>{t('grimoire_tab_recent')}</Text>
          {recipeListTab === 'recent' && <View style={gStyles.recipeTabUnderline} />}
        </Pressable>
        <Pressable onPress={() => setRecipeListTab('all')} style={[gStyles.recipeTab, recipeListTab === 'all' && gStyles.recipeTabActive]}>
          <Text style={[gStyles.recipeTabText, recipeListTab === 'all' && gStyles.recipeTabTextActive]}>{t('allRecipes')}</Text>
          {recipeListTab === 'all' && <View style={gStyles.recipeTabUnderline} />}
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#e2b96f" style={{ marginTop: 40 }} />
      ) : recipeListTab === 'recent' ? (
        /* ─── RECENT tab ─────────────────────────────────────────────────── */
        recentRecipes.length === 0 ? (
          <Text style={gStyles.empty}>{t('grimoire_recent_empty')}</Text>
        ) : (
          <FlatList
            data={recentRecipes}
            keyExtractor={item => item.id}
            style={gStyles.list}
            renderItem={({ item }) => (
              <RecipeCard
                recipe={item}
                inventory={inventory}
                onPress={() => { playSFX('recipe_click'); router.push(`/recipe/${item.id}`); }}
              />
            )}
          />
        )
      ) : (
        /* ─── ALL RECIPES tab ────────────────────────────────────────────── */
        <>
          <TextInput
            style={gStyles.search}
            placeholder={t('grimoire_search')}
            placeholderTextColor="#4a4a6a"
            value={search}
            onChangeText={setSearch}
          />
          <View style={gStyles.filterWrap}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[null, ...availableMealTypes]}
              keyExtractor={item => item ? item.value : '__all__'}
              renderItem={({ item }) => {
                const isActive = item === null ? mealFilter === null : mealFilter === item.value;
                return (
                  <Pressable
                    onPress={() => setMealFilter(item ? item.value : null)}
                    style={[gStyles.filterChip, isActive && gStyles.filterChipActive]}
                  >
                    {item && <Text style={gStyles.filterIcon}>{item.icon}</Text>}
                    <Text style={[gStyles.filterText, isActive && gStyles.filterTextActive]}>
                      {item ? t(item.labelKey as StringKey) : t('filterAll')}
                    </Text>
                  </Pressable>
                );
              }}
              contentContainerStyle={{ paddingRight: 8 }}
              style={{ marginBottom: 12 }}
            />
          </View>
          {filteredByMealType.length === 0 ? (
            <View style={gStyles.emptyCategory}>
              <Text style={gStyles.emptyCategoryTitle}>{t('noRecipesInCategory')}</Text>
              <Text style={gStyles.emptyCategoryHint}>{t('addMealTypeHint')}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredByMealType}
              keyExtractor={item => item.id}
              style={gStyles.list}
              keyboardShouldPersistTaps="handled"
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e2b96f" colors={['#e2b96f']} />}
              renderItem={({ item }) => (
                <RecipeCard
                  recipe={item}
                  inventory={inventory}
                  onPress={() => { playSFX('recipe_click'); router.push(`/recipe/${item.id}`); }}
                />
              )}
            />
          )}
        </>
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
  headerSpacer: { width: 44 } as const,
  back: { fontFamily: 'PressStart2P_400Regular', color: '#c84b4b', fontSize: 8 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 20 } as const,
  characterCard: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 14, marginBottom: 16 } as const,
  characterTabs: { flexDirection: 'row' as const, marginBottom: 14, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e' } as const,
  characterTab: { flex: 1, paddingVertical: 10, alignItems: 'center' as const } as const,
  characterTabActive: { backgroundColor: '#2d2d4e' } as const,
  characterTabText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7 } as const,
  characterTabTextActive: { color: '#e2b96f' } as const,
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
  recentList: { minHeight: 72 } as const,
  recentEmpty: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, lineHeight: 18, textAlign: 'center' as const, paddingVertical: 18 } as const,
  recentRow: { flexDirection: 'row' as const, alignItems: 'center' as const, borderTopWidth: 1, borderTopColor: '#2d2d4e', paddingVertical: 9 } as const,
  recentRowFirst: { borderTopWidth: 0 } as const,
  recentIcon: { width: 30, fontSize: 20, textAlign: 'center' as const, marginRight: 10 } as const,
  recentName: { flex: 1, fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, marginRight: 8 } as const,
  recentArrow: { color: '#e2b96f', fontSize: 10 } as const,
  empty: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 10, textAlign: 'center' as const, marginTop: 60, lineHeight: 24 },
  list: { flex: 1 } as const,
  cardWrapper: { marginBottom: 12 } as const,
  card: { borderWidth: 1, borderColor: '#2d2d4e', backgroundColor: '#16213e', padding: 16, position: 'relative' as const, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 } as const,
  cardFull: {
    borderColor: '#c8a84b',
    shadowColor: '#c8a84b',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  } as const,
  readyBadge: { position: 'absolute' as const, top: 8, right: 8, backgroundColor: '#c8a84b', paddingHorizontal: 6, paddingVertical: 3, zIndex: 1 } as const,
  readyText: { fontFamily: 'PressStart2P_400Regular', color: '#1a1a2e', fontSize: 6 } as const,
  recipeIconBox: { width: 52, height: 52, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', alignItems: 'center' as const, justifyContent: 'center' as const },
  recipeIconText: { fontSize: 32 } as const,
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
  cardTitle: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 10, flex: 1, marginRight: 8 } as const,
  cardArrow: { color: '#e2b96f', fontSize: 12 } as const,
  tagRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6, marginTop: 7 },
  languageTag: { alignSelf: 'flex-start' as const, borderWidth: 1, borderColor: '#e2b96f', color: '#e2b96f', fontFamily: 'PressStart2P_400Regular', fontSize: 6, paddingHorizontal: 6, paddingVertical: 3 },
  mealTypeTag: { alignSelf: 'flex-start' as const, borderWidth: 1, borderColor: '#4a4a6a', color: '#4a4a6a', fontFamily: 'PressStart2P_400Regular', fontSize: 6, paddingHorizontal: 6, paddingVertical: 3 },
  emojiRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginTop: 12, gap: 6 },
  emojiTile: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', width: 36, height: 36, alignItems: 'center' as const, justifyContent: 'center' as const },
  emojiText: { fontSize: 18 } as const,
  overflowText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7 } as const,
  recipeTabRow: { flexDirection: 'row' as const, borderBottomWidth: 1, borderBottomColor: '#2d2d4e', marginBottom: 14 },
  recipeTab: { flex: 1, alignItems: 'center' as const, paddingBottom: 10, position: 'relative' as const },
  recipeTabActive: {} as const,
  recipeTabText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7 } as const,
  recipeTabTextActive: { color: '#e2b96f' } as const,
  recipeTabUnderline: { position: 'absolute' as const, bottom: -1, height: 2, width: '80%' as const, backgroundColor: '#e2b96f' },
  search: { backgroundColor: '#16213e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 14, marginBottom: 12, fontFamily: 'PressStart2P_400Regular', fontSize: 9 } as const,
  filterWrap: {} as const,
  filterChip: { borderWidth: 1, borderColor: '#2d2d4e', paddingHorizontal: 10, paddingVertical: 8, marginRight: 6, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  filterChipActive: { borderColor: '#e2b96f' },
  filterIcon: { fontSize: 12 } as const,
  filterText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7 } as const,
  filterTextActive: { color: '#e2b96f' } as const,
  emptyCategory: { alignItems: 'center' as const, marginTop: 48, paddingHorizontal: 16 },
  emptyCategoryTitle: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, textAlign: 'center' as const, lineHeight: 20, marginBottom: 12 } as const,
  emptyCategoryHint: { fontFamily: 'PressStart2P_400Regular', color: '#2d2d4e', fontSize: 7, textAlign: 'center' as const, lineHeight: 18 } as const,
  newButton: { borderWidth: 2, borderColor: '#e2b96f', padding: 16, alignItems: 'center' as const, marginTop: 16 },
  newButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10 } as const,
};
