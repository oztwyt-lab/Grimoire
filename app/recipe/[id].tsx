import { useState, useCallback } from 'react';
import { Text, View, ScrollView, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../firebase';
import { doc, getDoc, deleteDoc } from '@firebase/firestore';
import { useLanguage } from '../../src/context/LanguageContext';
import { useInventory } from '../../src/context/InventoryContext';
import PressableScale from '../../src/components/PressableScale';
import IngredientIcon from '../../src/components/IngredientIcon';
import { useAuth } from '../../src/context/AuthContext';
import { markRecipeRecent } from '../../src/services/recentRecipes';
import { RecipeLanguageTag, normalizeRecipeLanguage, recipeLanguageLabel } from '../../src/data/recipeLanguage';
import { hasRecipeIngredients, parseRecipeQuantity } from '../../src/utils/recipeInventory';

type Ingredient = { id: string; name: string; emoji: string; quantity: string; metric?: string };
type RecipeStep = { id: string; text: string; duration: number | null };
type Recipe = {
  id: string;
  name: string;
  icon?: string;
  steps: RecipeStep[] | string;
  preparation?: string;
  ingredients: Ingredient[];
  recipeLanguage?: RecipeLanguageTag;
  createdAt: unknown;
};

function fmtQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function getRecipeSteps(recipe: Recipe): RecipeStep[] {
  if (Array.isArray(recipe.steps)) return recipe.steps;

  const raw =
    (typeof recipe.preparation === 'string' ? recipe.preparation : '') ||
    (typeof recipe.steps === 'string' ? recipe.steps : '');

  if (!raw.trim()) return [];

  const lines = raw.includes('\n')
    ? raw.split('\n').map(line => line.trim()).filter(Boolean)
    : raw.split(/\.\s+/).map(line => line.trim()).filter(Boolean);

  return lines.map((text, index) => ({
    id: String(index),
    text: text.replace(/^\d+[.)]\s*/, '').trim(),
    duration: null,
  }));
}

function formatRecipeForShare(recipe: Recipe): string {
  const iconLine = recipe.icon ? `${recipe.icon}\n\n` : '';
  const ingredients = (recipe.ingredients ?? [])
    .map(ingredient => {
      const amount = [ingredient.quantity, ingredient.metric, ingredient.name]
        .filter(Boolean)
        .join(' ');
      return `- ${amount}`;
    })
    .join('\n');

  const preparation = getRecipeSteps(recipe)
    .map((step, index) => {
      const duration = step.duration ? ` (${step.duration} min)` : '';
      return `${index + 1}. ${step.text}${duration}`;
    })
    .join('\n');

  return `${recipe.name.toUpperCase()}
${iconLine}INGREDIENTS:
${ingredients || '-'}

PREPARATION:
${preparation || '-'}

---
Shared from Grimor - Your Recipe Spellbook`;
}

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { inventory, inventoryLoaded, bulkSetItems } = useInventory();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      const fetchRecipe = async () => {
        try {
          const docRef = doc(db, 'recipes', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setRecipe({ id: docSnap.id, ...docSnap.data() } as Recipe);
            if (user) markRecipeRecent(user.uid, docSnap.id).catch(console.warn);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchRecipe();
    }, [id, user])
  );

  const handleDelete = async () => {
    Alert.alert(t('detail_delete_title'), t('detail_delete_msg'), [
      { text: t('detail_delete_cancel'), style: 'cancel' },
      { text: t('detail_delete_confirm'), style: 'destructive', onPress: async () => { await deleteDoc(doc(db, 'recipes', id)); router.replace('/grimoire'); } },
    ]);
  };

  async function applyIngredientsReady() {
    if (!recipe || !recipe.ingredients?.length) return;
    const items = recipe.ingredients.map(ing => ({
      id: ing.id,
      quantity: parseRecipeQuantity(ing.quantity),
      metric: 'adet',
    }));
    await bulkSetItems(items);
  }

  function handleIngredientsReady() {
    if (!recipe || !recipe.ingredients?.length) return;
    Alert.alert(t('ingredients_ready_confirm_title'), t('ingredients_ready_confirm_msg'), [
      { text: t('ingredients_ready_cancel'), style: 'cancel' },
      { text: t('ingredients_ready_confirm'), onPress: applyIngredientsReady },
    ]);
  }

  async function handleShare() {
    if (!recipe) return;
    try {
      const Clipboard = require('expo-clipboard') as { setStringAsync: (text: string) => Promise<void> };
      await Clipboard.setStringAsync(formatRecipeForShare(recipe));
      Alert.alert(t('recipe_copied'));
    } catch {
      Alert.alert(t('recipe_share_unavailable'));
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#e2b96f" />;
  if (!recipe) return <Text style={{ color: '#c8c8e8', padding: 24, fontFamily: 'PressStart2P_400Regular', fontSize: 9 }}>{t('detail_not_found')}</Text>;

  const showMatch = inventory.length > 0;
  const recipeLanguage = normalizeRecipeLanguage(recipe.recipeLanguage);

  const prepDisplay =
    typeof recipe.preparation === 'string' && recipe.preparation.trim()
      ? recipe.preparation
      : Array.isArray(recipe.steps)
      ? recipe.steps.map((s, i) => `${i + 1}. ${s.text}`).join('\n')
      : typeof recipe.steps === 'string'
      ? recipe.steps
      : '';

  const hasSteps = Array.isArray(recipe.steps)
    ? recipe.steps.length > 0
    : Boolean((recipe.steps as string)?.trim() || recipe.preparation?.trim());
  const ingredientsReady = inventoryLoaded && hasRecipeIngredients(recipe.ingredients, inventory);
  const canStartCooking = hasSteps && ingredientsReady;
  const recipeId = recipe.id;

  function handleStartCooking() {
    if (!hasSteps) return;
    if (!ingredientsReady) {
      Alert.alert(t('recipe_missing_ingredients_title'), t('recipe_missing_ingredients_msg'));
      return;
    }
    router.push(`/cook/${recipeId}`);
  }

  return (
    <ScrollView style={rdStyles.container} contentContainerStyle={[rdStyles.content, { paddingBottom: insets.bottom + 64 }]}>
      <View style={rdStyles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
          <Text style={rdStyles.back}>{t('detail_back')}</Text>
        </Pressable>
        <View style={rdStyles.headerActions}>
          <Pressable onPress={handleShare} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
            <Text style={rdStyles.share}>{t('recipe_share')}</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/edit-recipe/${id}`)} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
            <Text style={rdStyles.edit}>{t('detail_edit')}</Text>
          </Pressable>
          <Pressable onPress={handleDelete} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
            <Text style={rdStyles.delete}>{t('detail_delete')}</Text>
          </Pressable>
        </View>
      </View>
      <Text style={rdStyles.title}>{recipe.name.toUpperCase()}</Text>
      {recipeLanguage && (
        <Text style={rdStyles.languageTag}>{t('recipe_language_tag')}: {recipeLanguageLabel(recipeLanguage, t)}</Text>
      )}
      {recipe.ingredients?.length > 0 && (
        <>
          <Text style={rdStyles.sectionLabel}>{t('detail_ingredients')}</Text>
          <View style={rdStyles.ingredientRow}>
            {recipe.ingredients.map(ing => {
              const invItem = showMatch ? inventory.find(i => i.id === ing.id) : undefined;
              const have = invItem?.quantity ?? 0;
              const need = parseRecipeQuantity(ing.quantity);
              const isSufficient = have >= need;

              return (
                <View
                  key={ing.id}
                  style={[
                    rdStyles.ingredientTile,
                    showMatch && isSufficient && rdStyles.tileSufficient,
                    showMatch && !invItem && rdStyles.tileMissing,
                  ]}
                >
                  <IngredientIcon id={ing.id} emoji={ing.emoji} size={28} imageStyle={rdStyles.tileIcon} textStyle={rdStyles.tileEmoji} />
                  <Text style={rdStyles.tileName}>{ing.name}</Text>
                  {showMatch ? (
                    <>
                      <Text style={[rdStyles.tileQty, !isSufficient && rdStyles.tileQtyMuted]}>
                        {have}/{fmtQty(need)}
                      </Text>
                      <Text style={isSufficient ? rdStyles.tileCheck : rdStyles.tileCross}>
                        {isSufficient ? '✓' : '✗'}
                      </Text>
                    </>
                  ) : (
                    ing.quantity ? <Text style={rdStyles.tileQty}>{ing.quantity}</Text> : null
                  )}
                </View>
              );
            })}
          </View>
        </>
      )}
      <Text style={rdStyles.sectionLabel}>{t('detail_preparation')}</Text>
      <Text style={rdStyles.steps}>{prepDisplay}</Text>

      {/* Cook buttons */}
      <View style={rdStyles.cookSection}>
        {/* Ingredients Ready */}
        <PressableScale
          onPress={recipe.ingredients?.length ? handleIngredientsReady : undefined}
          disabled={!recipe.ingredients?.length}
          style={rdStyles.cookButtonWrapper}
        >
          <View style={[rdStyles.ingButton, !recipe.ingredients?.length && rdStyles.cookButtonDisabled]}>
            <Image source={require('../../assets/icons/ui/bag.png')} style={rdStyles.ingButtonIcon} resizeMode="contain" />
            <Text style={[rdStyles.ingButtonText, !recipe.ingredients?.length && rdStyles.cookButtonTextDisabled]}>
              {t('recipe_ingredients_ready')}
            </Text>
          </View>
        </PressableScale>

        {/* Start Cooking */}
        <PressableScale
          onPress={hasSteps ? handleStartCooking : undefined}
          disabled={!canStartCooking}
          style={rdStyles.cookButtonWrapper}
        >
          <View style={[rdStyles.cookButton, !canStartCooking && rdStyles.cookButtonDisabled]}>
            <Text style={[rdStyles.cookButtonText, !canStartCooking && rdStyles.cookButtonTextDisabled]}>
              {t('detail_start_cooking')}
            </Text>
          </View>
        </PressableScale>
        {!hasSteps && (
          <Text style={rdStyles.cookNoSteps}>{t('cook_no_steps')}</Text>
        )}
        {hasSteps && inventoryLoaded && !ingredientsReady && (
          <Text style={rdStyles.cookNoSteps}>{t('recipe_missing_ingredients_msg')}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const rdStyles = {
  container: { flex: 1, backgroundColor: '#1a1a2e' } as const,
  content: { padding: 24, paddingTop: 60 } as const,
  header: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 24 },
  headerActions: { flexDirection: 'row' as const, gap: 16 },
  back: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 } as const,
  share: { fontFamily: 'PressStart2P_400Regular', color: '#6fcf97', fontSize: 8 } as const,
  edit: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 8 } as const,
  delete: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 14, marginBottom: 24, lineHeight: 26 } as const,
  languageTag: { alignSelf: 'flex-start' as const, borderWidth: 1, borderColor: '#e2b96f', color: '#e2b96f', fontFamily: 'PressStart2P_400Regular', fontSize: 7, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 18 },
  sectionLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 12, marginTop: 8 } as const,
  ingredientRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginBottom: 24 },
  ingredientTile: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 10, alignItems: 'center' as const, margin: 4, minWidth: 70 },
  tileSufficient: { borderColor: '#4a9e6b' } as const,
  tileMissing: { opacity: 0.5 } as const,
  tileEmoji: { fontSize: 24, marginBottom: 2 } as const,
  tileIcon: { marginBottom: 2 } as const,
  tileName: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, textAlign: 'center' as const },
  tileQty: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 8, marginTop: 2 } as const,
  tileQtyMuted: { color: '#7a6a3a' } as const,
  tileCheck: { fontFamily: 'PressStart2P_400Regular', color: '#4a9e6b', fontSize: 7, marginTop: 2 } as const,
  tileCross: { fontFamily: 'PressStart2P_400Regular', color: '#c0392b', fontSize: 7, marginTop: 2 } as const,
  steps: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 20 } as const,
  cookSection: { marginTop: 32, gap: 12 } as const,
  cookButtonWrapper: { width: '100%' } as const,
  ingButton: { borderWidth: 1, borderColor: '#c8a84b', padding: 20, alignItems: 'center' as const, justifyContent: 'center' as const, flexDirection: 'row' as const, gap: 10 },
  ingButtonIcon: { width: 22, height: 22 },
  ingButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#c8a84b', fontSize: 9 } as const,
  cookButton: { borderWidth: 1, borderColor: '#e2b96f', padding: 20, alignItems: 'center' as const },
  cookButtonDisabled: { borderColor: '#4a4a6a' } as const,
  cookButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10 } as const,
  cookButtonTextDisabled: { color: '#4a4a6a' } as const,
  cookNoSteps: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, textAlign: 'center' as const, lineHeight: 18 },
};
