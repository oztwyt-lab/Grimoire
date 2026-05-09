import { useState, useCallback } from 'react';
import { Text, TextInput, View, Pressable, ScrollView, Alert, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import { useSubscription } from '../src/context/SubscriptionContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from '@firebase/firestore';
import { registerIngredientCallback } from '../src/store/ingredientSelection';
import * as Haptics from 'expo-haptics';
import StepBuilder, { LocalStep } from '../src/components/StepBuilder';
import IngredientIcon from '../src/components/IngredientIcon';
import RecipeIconPicker, { DEFAULT_RECIPE_ICON } from '../src/components/RecipeIconPicker';
import { RECIPE_LANGUAGE_OPTIONS, RecipeLanguageTag, recipeLanguageLabel } from '../src/data/recipeLanguage';
import { MEAL_TYPES, MealType } from '../src/data/mealTypes';
import MealTypePicker from '../src/components/MealTypePicker';

type SelectedIngredient = { id: string; name: string; emoji: string; quantity: string };

function serializeSteps(steps: LocalStep[]) {
  return steps.map(step => ({
    id: step.id,
    text: step.text,
    duration: step.duration,
    ...(step.emoji ? { emoji: step.emoji } : {}),
  }));
}

export default function CreateRecipe() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { canAddRecipe } = useSubscription();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(DEFAULT_RECIPE_ICON);
  const [recipeLanguage, setRecipeLanguage] = useState<RecipeLanguageTag | null>(null);
  const [mealType, setMealType] = useState<MealType | undefined>(undefined);
  const [mealPickerVisible, setMealPickerVisible] = useState(false);
  const [stepsArr, setStepsArr] = useState<LocalStep[]>([]);
  const [ingredients, setIngredients] = useState<SelectedIngredient[]>([]);
  const [saving, setSaving] = useState(false);
  const [limitVisible, setLimitVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      registerIngredientCallback((ingredient) => {
        setIngredients(prev => {
          const exists = prev.find(i => i.id === ingredient.id);
          if (exists) return prev;
          return [...prev, ingredient];
        });
      });
    }, [])
  );

  const handleEditIngredient = (ingredient: SelectedIngredient) => {
    if (ingredient.id.startsWith('custom_')) return;
    registerIngredientCallback((updated) => {
      setIngredients(prev => prev.map(i => i.id === ingredient.id ? updated : i));
    });
    router.push({ pathname: '/ingredient-picker', params: { editId: ingredient.id, editQuantity: ingredient.quantity } } as any);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('create_missing_name_title'), t('create_missing_name_msg'));
      return;
    }
    if (!recipeLanguage) {
      Alert.alert(t('create_missing_language_title'), t('create_missing_language_msg'));
      return;
    }
    if (!canAddRecipe()) {
      setLimitVisible(true);
      return;
    }
    setSaving(true);
    try {
      const serializedSteps = serializeSteps(stepsArr);
      await addDoc(collection(db, 'recipes'), {
        userId: user?.uid,
        name,
        icon,
        ...(recipeLanguage ? { recipeLanguage } : {}),
        ...(mealType ? { mealType } : {}),
        steps: serializedSteps,
        preparation: serializedSteps.map(s => s.text).join('\n'),
        ingredients,
        createdAt: serverTimestamp(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/grimoire');
    } catch (error) {
      Alert.alert(t('create_error_title'), String(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={crStyles.container} contentContainerStyle={[crStyles.content, { paddingBottom: insets.bottom + 56 }]}>
      <Text style={crStyles.title}>{t('create_title')}</Text>
      <RecipeIconPicker value={icon} onChange={setIcon} />
      <TextInput
        style={crStyles.input}
        placeholder={t('create_name_placeholder')}
        placeholderTextColor="#4a4a6a"
        value={name}
        onChangeText={setName}
      />
      <Text style={crStyles.label}>{t('mealType')}</Text>
      <Pressable
        style={({ pressed }) => [crStyles.mealTypeButton, pressed && { opacity: 0.75 }]}
        onPress={() => setMealPickerVisible(true)}
      >
        {mealType ? (
          <Text style={crStyles.mealTypeValue}>
            {MEAL_TYPES.find(mt => mt.value === mealType)?.icon} {t(MEAL_TYPES.find(mt => mt.value === mealType)?.labelKey as any)}
          </Text>
        ) : (
          <Text style={crStyles.mealTypePlaceholder}>{t('selectMealType')}</Text>
        )}
        <Text style={crStyles.mealTypeChevron}>▼</Text>
      </Pressable>
      <MealTypePicker
        visible={mealPickerVisible}
        value={mealType}
        onChange={setMealType}
        onClose={() => setMealPickerVisible(false)}
      />
      <Text style={crStyles.label}>{t('recipe_language_label')}</Text>
      <Text style={crStyles.optionalText}>{t('recipe_language_optional')}</Text>
      <View style={crStyles.languageRow}>
        {RECIPE_LANGUAGE_OPTIONS.map(option => (
          <Pressable
            key={option}
            style={({ pressed }) => [crStyles.languageChip, recipeLanguage === option && crStyles.languageChipActive, pressed && { opacity: 0.72 }]}
            onPress={() => setRecipeLanguage(option)}
          >
            <Text style={[crStyles.languageText, recipeLanguage === option && crStyles.languageTextActive]}>
              {recipeLanguageLabel(option, t)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={[crStyles.label, crStyles.ingredientsLabel]}>{t('create_ingredients_label')}</Text>
      <View style={crStyles.ingredientRow}>
        {ingredients.map(i => (
          <Pressable
            key={i.id}
            style={({ pressed }) => [crStyles.ingredientTile, pressed && { backgroundColor: '#2d2d4e' }]}
            onPress={() => handleEditIngredient(i)}
          >
            <IngredientIcon id={i.id} emoji={i.emoji} size={28} imageStyle={crStyles.tileIcon} textStyle={crStyles.tileEmoji} />
            <Text style={crStyles.tileName}>{i.name}</Text>
            {i.quantity ? <Text style={crStyles.tileQty}>{i.quantity}</Text> : null}
          </Pressable>
        ))}
        <Pressable
          style={({ pressed }) => [crStyles.addTile, pressed && { backgroundColor: '#2d2d4e' }]}
          onPress={() => router.push('/ingredient-picker')}
        >
          <Text style={crStyles.addTileText}>+</Text>
        </Pressable>
      </View>
      <Text style={crStyles.label}>{t('create_steps_label')}</Text>
      <StepBuilder steps={stepsArr} onChange={setStepsArr} />
      <Pressable
        style={({ pressed }) => [crStyles.button, pressed && { backgroundColor: '#2d2d4e' }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={crStyles.buttonText}>{saving ? t('create_saving') : t('create_save')}</Text>
      </Pressable>
      <Pressable style={({ pressed }) => [pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
        <Text style={crStyles.link}>{t('create_cancel')}</Text>
      </Pressable>
      <Modal visible={limitVisible} transparent animationType="fade" onRequestClose={() => setLimitVisible(false)}>
        <View style={crStyles.limitOverlay}>
          <View style={crStyles.limitCard}>
            <Text style={crStyles.limitTitle}>{t('sub_recipe_limit')}</Text>
            <Text style={crStyles.limitMessage}>{t('sub_limit_msg_recipe')}</Text>
            <Pressable
              style={({ pressed }) => [crStyles.limitUpgradeButton, pressed && { opacity: 0.72 }]}
              onPress={() => {
                setLimitVisible(false);
                router.push('/subscription');
              }}
            >
              <Text style={crStyles.limitUpgradeText}>{t('sub_upgrade_cta')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [crStyles.limitCloseButton, pressed && { opacity: 0.5 }]}
              onPress={() => setLimitVisible(false)}
            >
              <Text style={crStyles.limitCloseText}>{t('sub_close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const crStyles = {
  container: { flex: 1, backgroundColor: '#1a1a2e' } as const,
  content: { padding: 24, paddingTop: 60 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 16, marginBottom: 24 } as const,
  label: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 8, marginTop: 16 } as const,
  ingredientsLabel: { color: '#e2b96f', textShadowColor: '#c8a84b', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 } as const,
  optionalText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 6, marginBottom: 8 } as const,
  languageRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginBottom: 8 },
  languageChip: { borderWidth: 1, borderColor: '#2d2d4e', backgroundColor: '#16213e', paddingHorizontal: 10, paddingVertical: 8 },
  languageChipActive: { borderColor: '#e2b96f', backgroundColor: '#e2b96f' },
  languageText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7 },
  languageTextActive: { color: '#1a1a2e' },
  input: { backgroundColor: '#16213e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 16, marginBottom: 16, fontFamily: 'PressStart2P_400Regular', fontSize: 9 } as const,
  ingredientRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginBottom: 16 },
  ingredientTile: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 10, alignItems: 'center' as const, margin: 4, minWidth: 70 },
  tileEmoji: { fontSize: 24, marginBottom: 2 } as const,
  tileIcon: { marginBottom: 2 } as const,
  tileName: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, textAlign: 'center' as const },
  tileQty: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 8 } as const,
  addTile: { backgroundColor: '#16213e', borderWidth: 2, borderColor: '#e2b96f', padding: 10, alignItems: 'center' as const, justifyContent: 'center' as const, margin: 4, minWidth: 70, minHeight: 70 },
  addTileText: { color: '#e2b96f', fontSize: 28, fontWeight: '700' as const },
  button: { backgroundColor: '#16213e', borderWidth: 2, borderColor: '#e2b96f', padding: 16, alignItems: 'center' as const, marginTop: 24, marginBottom: 16 },
  buttonText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10 } as const,
  link: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', textAlign: 'center' as const, fontSize: 8 },
  limitOverlay: { flex: 1, backgroundColor: 'rgba(10, 10, 20, 0.78)', alignItems: 'center' as const, justifyContent: 'center' as const, padding: 24 },
  limitCard: { width: '100%' as const, maxWidth: 360, backgroundColor: '#1a1a2e', borderWidth: 2, borderColor: '#e2b96f', padding: 20 },
  limitTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 11, lineHeight: 18, textAlign: 'center' as const, marginBottom: 14 },
  limitMessage: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 16, textAlign: 'center' as const, marginBottom: 20 },
  limitUpgradeButton: { backgroundColor: '#e2b96f', padding: 14, alignItems: 'center' as const, marginBottom: 12 },
  limitUpgradeText: { fontFamily: 'PressStart2P_400Regular', color: '#1a1a2e', fontSize: 9 },
  limitCloseButton: { padding: 8, alignItems: 'center' as const },
  limitCloseText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },
  mealTypeButton: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 16, marginBottom: 4 },
  mealTypeValue: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 8 } as const,
  mealTypePlaceholder: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 } as const,
  mealTypeChevron: { color: '#4a4a6a', fontSize: 10 } as const,
};
