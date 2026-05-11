import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { useLanguage } from '../context/LanguageContext';
import { INGREDIENTS } from '../data/ingredients';
import {
  AnyMagicRecipe,
  CuratedRecipe,
  MatchedRecipe,
  fetchCuratedRecipes,
  fetchUserMagicRecipes,
  matchRecipesAgainstInventory,
} from '../services/magicOrb';
import { addItemsToShoppingList } from '../services/shoppingList';
import { playSFX } from '../services/audio';
import { normalizeRecipeLanguage, recipeLanguageLabel } from '../data/recipeLanguage';
import IngredientIcon from '../components/IngredientIcon';
import RecipeIconArt from '../components/RecipeIconArt';

type Tab = 'canCook' | 'discover';
type DiscoverFilter = 'all' | 'meat' | 'vegetarian' | 'quick';
type LangFilter = 'all' | 'en' | 'tr';

type Translator = ReturnType<typeof useLanguage>['t'];

function ingredientName(id: string, fallback: string, language: string) {
  const ingredient = INGREDIENTS.find(item => item.id === id);
  return ingredient ? (language === 'tr' ? ingredient.name_tr : ingredient.name) : fallback;
}

function filterLabel(filter: DiscoverFilter, t: Translator) {
  if (filter === 'all') return t('magic_orb_all');
  if (filter === 'meat') return t('magic_orb_meat');
  if (filter === 'vegetarian') return t('magic_orb_vegetarian');
  return t('magic_orb_quick');
}

function langFilterLabel(filter: LangFilter, t: Translator) {
  if (filter === 'all') return t('magic_orb_all');
  if (filter === 'en') return t('recipe_language_en');
  return t('recipe_language_tr');
}

function categoryLabel(category: string, t: Translator) {
  if (category === 'meat') return t('magic_orb_meat');
  if (category === 'vegetarian') return t('magic_orb_vegetarian');
  if (category === 'quick') return t('magic_orb_quick');
  return category.toUpperCase();
}

function encodeRecipe(recipe: CuratedRecipe | MatchedRecipe) {
  return encodeURIComponent(JSON.stringify(recipe));
}

function RecipeCard({
  recipe,
  mode,
  imported,
  onPress,
  onAddToList,
  t,
  language,
}: {
  recipe: CuratedRecipe | MatchedRecipe;
  mode: Tab;
  imported?: boolean;
  onPress: () => void;
  onAddToList?: (recipe: MatchedRecipe) => void;
  t: Translator;
  language: string;
}) {
  const matched = recipe as MatchedRecipe;
  const missing = matched.missingIngredients ?? [];
  const missingPreview = missing.slice(0, 4);
  const missingOverflow = Math.max(0, missing.length - missingPreview.length);
  const isUserRecipe = Boolean((recipe as MatchedRecipe).isUserRecipe);
  const recipeLanguage = normalizeRecipeLanguage(recipe.recipeLanguage);
  const badgeStyle = matched.matchScore === 1 ? styles.badgeReady : matched.matchScore >= 0.6 ? styles.badgeAlmost : styles.badgeMissing;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.cardTop}>
        <RecipeIconArt icon={recipe.icon} recipeId={recipe.id} size={30} style={styles.cardIcon} />
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle} numberOfLines={2}>{recipe.name.toUpperCase()}</Text>
          <Text style={styles.cardMeta}>
            {mode === 'canCook'
              ? `${matched.matchedCount}/${matched.totalIngredients} ${t('magic_orb_ingredients')}`
              : `${recipe.ingredients.length} ${t('magic_orb_ingredients')}  ·  ${recipe.estimatedMinutes} ${t('magic_orb_min')}`}
          </Text>
        </View>
      </View>

      <View style={styles.tagRow}>
        {mode === 'canCook' && <Text style={[styles.matchBadge, badgeStyle]}>{matched.matchScore === 1 ? t('magic_orb_ready') : matched.matchScore >= 0.6 ? t('magic_orb_almost') : t('magic_orb_missing')}</Text>}
        <Text style={styles.sourceTag}>{isUserRecipe ? t('magic_orb_my_recipe') : 'GRIMOR'}</Text>
        {mode === 'discover' && <Text style={styles.sourceTag}>{categoryLabel(recipe.category, t)}</Text>}
        {recipeLanguage && <Text style={styles.sourceTag}>{recipeLanguageLabel(recipeLanguage, t)}</Text>}
        {imported && <Text style={styles.importedTag}>{t('magic_orb_imported')}</Text>}
      </View>

      {mode === 'canCook' && missing.length > 0 && (
        <View style={styles.missingWrap}>
          {missingPreview.map(ingredient => (
            <View key={`${recipe.id}-${ingredient.id}`} style={styles.missingChip}>
              <IngredientIcon id={ingredient.id} emoji={ingredient.emoji} size={14} imageStyle={styles.missingIcon} textStyle={styles.missingIconText} />
              <Text style={styles.missingChipText}>{ingredientName(ingredient.id, ingredient.name, language)}</Text>
            </View>
          ))}
          {missingOverflow > 0 && <Text style={styles.missingChip}>+{missingOverflow} {t('magic_orb_more')}</Text>}
        </View>
      )}

      {mode === 'canCook' && missing.length > 0 && matched.matchScore < 1 && onAddToList && (
        <Pressable onPress={() => onAddToList(matched)} style={({ pressed }) => [styles.addToListButton, pressed && styles.cardPressed]}>
          <Text style={styles.addToListText}>{t('magic_orb_add_to_list')}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

function Section({
  title,
  data,
  onPress,
  onAddToList,
  t,
  language,
}: {
  title: string;
  data: MatchedRecipe[];
  onPress: (recipe: MatchedRecipe) => void;
  onAddToList: (recipe: MatchedRecipe) => void;
  t: Translator;
  language: string;
}) {
  if (data.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.map(recipe => (
        <RecipeCard
          key={`${recipe.isUserRecipe ? 'user' : 'curated'}-${recipe.id}`}
          recipe={recipe}
          mode="canCook"
          onPress={() => onPress(recipe)}
          onAddToList={onAddToList}
          t={t}
          language={language}
        />
      ))}
    </View>
  );
}

export default function MagicOrbScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { inventory } = useInventory();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('canCook');
  const [filter, setFilter] = useState<DiscoverFilter>('all');
  const [langFilter, setLangFilter] = useState<LangFilter>('all');
  const [curatedRecipes, setCuratedRecipes] = useState<CuratedRecipe[]>([]);
  const [userRecipes, setUserRecipes] = useState<AnyMagicRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecipes = useCallback(async () => {
    if (!user) return;
    const [curated, userOwned] = await Promise.all([
      fetchCuratedRecipes(),
      fetchUserMagicRecipes(user.uid),
    ]);
    setCuratedRecipes(curated);
    setUserRecipes(userOwned);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadRecipes().catch(console.warn).finally(() => setLoading(false));
    }, [loadRecipes])
  );

  const importedIds = useMemo(() => new Set(userRecipes.map(recipe => recipe.curatedRecipeId).filter(Boolean)), [userRecipes]);
  const matchedRecipes = useMemo(
    () => matchRecipesAgainstInventory([...curatedRecipes, ...userRecipes], inventory),
    [curatedRecipes, inventory, userRecipes]
  );
  const ready = matchedRecipes.filter(recipe => recipe.matchScore === 1);
  const almost = matchedRecipes.filter(recipe => recipe.matchScore >= 0.6 && recipe.matchScore < 1);
  const missing = matchedRecipes.filter(recipe => recipe.matchScore < 0.6);
  const filteredCurated = curatedRecipes.filter(recipe => {
    const categoryMatch = filter === 'all' || recipe.category === filter || (filter === 'quick' && recipe.estimatedMinutes < 30);
    const langMatch = langFilter === 'all' || recipe.recipeLanguage === langFilter;
    return categoryMatch && langMatch;
  });

  const refresh = async () => {
    setRefreshing(true);
    await loadRecipes().catch(console.warn);
    setRefreshing(false);
  };

  const openRecipe = (recipe: CuratedRecipe | MatchedRecipe, alreadyImported = false) => {
    playSFX('recipe_click');
    router.push({ pathname: '/magic-orb-detail', params: { recipe: encodeRecipe(recipe), imported: alreadyImported ? '1' : '0' } });
  };

  const addMissingToList = async (recipe: MatchedRecipe) => {
    if (!user || recipe.missingIngredients.length === 0) return;
    playSFX('button_click');
    try {
      const result = await addItemsToShoppingList(user.uid, recipe.missingIngredients.map(ingredient => ({
        name: ingredientName(ingredient.id, ingredient.name, language),
        emoji: ingredient.emoji || '🛒',
        recipeId: recipe.id,
        recipeName: recipe.name,
      })));
      ToastAndroid.show(result.added > 0 ? t('magic_orb_added_to_list') : t('magic_orb_already_list'), ToastAndroid.SHORT);
    } catch (error) {
      console.warn('Unable to update provisions list', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
          <Text style={styles.back}>{t('grimoire_back')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('magic_orb_title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabs}>
        <Pressable onPress={() => setActiveTab('canCook')} style={styles.tab}>
          <Text style={[styles.tabText, activeTab === 'canCook' && styles.tabTextActive]}>{t('magic_orb_can_cook')}</Text>
          {activeTab === 'canCook' && <View style={styles.tabUnderline} />}
        </Pressable>
        <Pressable onPress={() => setActiveTab('discover')} style={styles.tab}>
          <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>{t('magic_orb_discover')}</Text>
          {activeTab === 'discover' && <View style={styles.tabUnderline} />}
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#e2b96f" style={styles.loader} />
      ) : activeTab === 'canCook' ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#e2b96f" colors={['#e2b96f']} />}
        >
          {inventory.length === 0 ? (
            <Text style={styles.empty}>{t('magic_orb_empty_pantry')}</Text>
          ) : (
            <>
              <Section title={t('magic_orb_ready_section')} data={ready} onPress={recipe => openRecipe(recipe, !recipe.isUserRecipe && importedIds.has(recipe.id))} onAddToList={addMissingToList} t={t} language={language} />
              <Section title={t('magic_orb_almost_section')} data={almost} onPress={recipe => openRecipe(recipe, !recipe.isUserRecipe && importedIds.has(recipe.id))} onAddToList={addMissingToList} t={t} language={language} />
              <Section title={t('magic_orb_missing_section')} data={missing} onPress={recipe => openRecipe(recipe, !recipe.isUserRecipe && importedIds.has(recipe.id))} onAddToList={addMissingToList} t={t} language={language} />
            </>
          )}
        </ScrollView>
      ) : (
        <>
          <View style={styles.filterRow}>
            {(['all', 'meat', 'vegetarian', 'quick'] as DiscoverFilter[]).map(item => (
              <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filterChip, filter === item && styles.filterChipActive]}>
                <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{filterLabel(item, t)}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.filterRow}>
            {(['all', 'en', 'tr'] as LangFilter[]).map(item => (
              <Pressable key={item} onPress={() => setLangFilter(item)} style={[styles.filterChip, langFilter === item && styles.filterChipActive]}>
                <Text style={[styles.filterText, langFilter === item && styles.filterTextActive]}>{langFilterLabel(item, t)}</Text>
              </Pressable>
            ))}
          </View>
          <FlatList
            data={filteredCurated}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#e2b96f" colors={['#e2b96f']} />}
            renderItem={({ item }) => (
              <RecipeCard
                recipe={item}
                mode="discover"
                imported={importedIds.has(item.id)}
                onPress={() => openRecipe(item, importedIds.has(item.id))}
                t={t}
                language={language}
              />
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  back: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 16 },
  headerSpacer: { width: 44 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#2d2d4e', marginBottom: 18 },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 10 },
  tabText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },
  tabTextActive: { color: '#e2b96f' },
  tabUnderline: { position: 'absolute', bottom: -1, height: 2, width: '80%', backgroundColor: '#e2b96f' },
  loader: { marginTop: 60 },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 9, marginBottom: 10 },
  card: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 14, marginBottom: 10 },
  cardPressed: { backgroundColor: '#202447' },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardIcon: { marginRight: 12 },
  cardTitleWrap: { flex: 1 },
  cardTitle: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 9, lineHeight: 16, marginBottom: 5 },
  cardMeta: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  matchBadge: { fontFamily: 'PressStart2P_400Regular', color: '#1a1a2e', fontSize: 6, paddingHorizontal: 7, paddingVertical: 4 },
  badgeReady: { backgroundColor: '#4caf50' },
  badgeAlmost: { backgroundColor: '#ff9800' },
  badgeMissing: { backgroundColor: '#555' },
  sourceTag: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', borderWidth: 1, borderColor: '#e2b96f', fontSize: 6, paddingHorizontal: 7, paddingVertical: 3 },
  importedTag: { fontFamily: 'PressStart2P_400Regular', color: '#4caf50', borderWidth: 1, borderColor: '#4caf50', fontSize: 6, paddingHorizontal: 7, paddingVertical: 3 },
  missingWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  missingChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', paddingHorizontal: 7, paddingVertical: 5 },
  missingChipText: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 6 },
  missingIcon: { width: 14, height: 14 },
  missingIconText: { fontSize: 12 },
  addToListButton: { alignSelf: 'flex-start', marginTop: 10, borderWidth: 1, borderColor: '#e2b96f', paddingHorizontal: 10, paddingVertical: 8 },
  addToListText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 7 },
  empty: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 9, lineHeight: 22, textAlign: 'center', marginTop: 70 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  filterChip: { borderWidth: 1, borderColor: '#2d2d4e', paddingHorizontal: 10, paddingVertical: 8 },
  filterChipActive: { borderColor: '#e2b96f' },
  filterText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7 },
  filterTextActive: { color: '#e2b96f' },
});
