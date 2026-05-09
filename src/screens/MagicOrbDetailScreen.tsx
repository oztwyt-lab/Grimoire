import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CuratedRecipe, MatchedRecipe, importCuratedRecipe } from '../services/magicOrb';
import IngredientIcon from '../components/IngredientIcon';
import { playSFX } from '../services/audio';
import { INGREDIENTS } from '../data/ingredients';
import { normalizeRecipeLanguage, recipeLanguageLabel } from '../data/recipeLanguage';

type DetailRecipe = CuratedRecipe | MatchedRecipe;

function decodeRecipe(value?: string | string[]): DetailRecipe | null {
  try {
    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw)) as DetailRecipe;
  } catch {
    return null;
  }
}

function getStepLines(steps: string) {
  if (!steps.trim()) return [];
  return steps.includes('\n')
    ? steps.split('\n').map(line => line.trim()).filter(Boolean)
    : steps.split(/\.\s+/).map(line => line.trim()).filter(Boolean);
}

function ingredientName(id: string, fallback: string, language: string) {
  const ingredient = INGREDIENTS.find(item => item.id === id);
  return ingredient ? (language === 'tr' ? ingredient.name_tr : ingredient.name) : fallback;
}

function categoryLabel(category: string, t: ReturnType<typeof useLanguage>['t']) {
  if (category === 'meat') return t('magic_orb_meat');
  if (category === 'vegetarian') return t('magic_orb_vegetarian');
  if (category === 'quick') return t('magic_orb_quick');
  return category.toUpperCase();
}

export default function MagicOrbDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const params = useLocalSearchParams<{ recipe?: string; imported?: string }>();
  const recipe = useMemo(() => decodeRecipe(params.recipe), [params.recipe]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(params.imported === '1');

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>{t('magic_orb_recipe_not_found')}</Text>
      </View>
    );
  }

  const detailRecipe = recipe;
  const isUserRecipe = Boolean((detailRecipe as MatchedRecipe).isUserRecipe);
  const recipeLanguage = normalizeRecipeLanguage(detailRecipe.recipeLanguage);
  const stepLines = getStepLines(detailRecipe.steps);

  async function handleImport() {
    if (!user || imported || importing) return;
    setImporting(true);
    try {
      await importCuratedRecipe(user.uid, detailRecipe as CuratedRecipe);
      setImported(true);
      playSFX('grimor_click');
      ToastAndroid.show(t('magic_orb_added_grimoire'), ToastAndroid.SHORT);
    } catch (error) {
      Alert.alert(t('magic_orb_import_failed'), String(error));
    } finally {
      setImporting(false);
    }
  }

  function handleCook() {
    playSFX('button_click');
    router.push(`/cook/${detailRecipe.id}`);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 56 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
          <Text style={styles.back}>{t('grimoire_back')}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t('magic_orb_title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.icon}>{detailRecipe.icon || '🍲'}</Text>
      <Text style={styles.title}>{detailRecipe.name.toUpperCase()}</Text>
      <Text style={styles.meta}>{detailRecipe.estimatedMinutes} {t('magic_orb_min')}  ·  {categoryLabel(detailRecipe.category, t)}</Text>
      {recipeLanguage && <Text style={styles.languageTag}>{t('recipe_language_tag')}: {recipeLanguageLabel(recipeLanguage, t)}</Text>}

      <Text style={styles.sectionTitle}>{t('detail_ingredients')}</Text>
      <View style={styles.panel}>
        {detailRecipe.ingredients.map(ingredient => (
          <View key={`${detailRecipe.id}-${ingredient.id}`} style={styles.ingredientRow}>
            <IngredientIcon id={ingredient.id} emoji={ingredient.emoji} size={26} textStyle={styles.ingredientEmoji} />
            <Text style={styles.ingredientName}>{ingredientName(ingredient.id, ingredient.name, language)}</Text>
            <Text style={styles.ingredientQty}>{ingredient.quantity}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{t('magic_orb_preparation')}</Text>
      <View style={styles.panel}>
        {stepLines.length === 0 ? (
          <Text style={styles.stepText}>{t('magic_orb_no_steps')}</Text>
        ) : stepLines.map((step, index) => (
          <Text key={`${index}-${step}`} style={styles.stepText}>{index + 1}. {step.replace(/^\d+[.)]\s*/, '')}</Text>
        ))}
      </View>

      {isUserRecipe ? (
        <Pressable onPress={handleCook} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{t('magic_orb_cook_this')}</Text>
        </Pressable>
      ) : (
        <Pressable disabled={imported || importing} onPress={handleImport} style={[styles.primaryButton, (imported || importing) && styles.primaryButtonDisabled]}>
          {importing ? (
            <ActivityIndicator color="#1a1a2e" />
          ) : (
            <Text style={styles.primaryButtonText}>{imported ? t('magic_orb_in_grimor') : t('magic_orb_add_grimoire')}</Text>
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 34 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  back: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },
  headerTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 14 },
  headerSpacer: { width: 44 },
  icon: { fontSize: 46, textAlign: 'center', marginBottom: 12 },
  title: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 14, lineHeight: 24, textAlign: 'center', marginBottom: 10 },
  meta: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, textAlign: 'center', marginBottom: 24 },
  languageTag: { alignSelf: 'center', borderWidth: 1, borderColor: '#e2b96f', color: '#e2b96f', fontFamily: 'PressStart2P_400Regular', fontSize: 7, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 20 },
  sectionTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 9, marginBottom: 10 },
  panel: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 14, marginBottom: 22 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2d2d4e', paddingVertical: 8 },
  ingredientEmoji: { fontSize: 24 },
  ingredientName: { flex: 1, fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7, lineHeight: 14, marginLeft: 10 },
  ingredientQty: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 7, marginLeft: 8 },
  stepText: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 20, marginBottom: 10 },
  primaryButton: { backgroundColor: '#e2b96f', padding: 18, alignItems: 'center', marginTop: 4 },
  primaryButtonDisabled: { opacity: 0.65 },
  primaryButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#1a1a2e', fontSize: 9, textAlign: 'center' },
  empty: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 10, textAlign: 'center', marginTop: 120 },
});
