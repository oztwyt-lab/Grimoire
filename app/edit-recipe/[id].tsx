import { useEffect, useState, useCallback } from 'react';
import { Text, TextInput, View, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from '@firebase/firestore';
import { registerIngredientCallback } from '../../src/store/ingredientSelection';
import { useLanguage } from '../../src/context/LanguageContext';
import * as Haptics from 'expo-haptics';
import StepBuilder, { LocalStep } from '../../src/components/StepBuilder';
import IngredientIcon from '../../src/components/IngredientIcon';

type Ingredient = { id: string; name: string; emoji: string; quantity: string };

function stepsFromData(data: Record<string, unknown>): LocalStep[] {
  if (Array.isArray(data.steps) && data.steps.length > 0) {
    return (data.steps as LocalStep[]).map((s, i) => ({
      id: s.id ?? String(i),
      text: s.text ?? '',
      duration: s.duration ?? null,
      emoji: s.emoji,
    }));
  }
  const raw =
    (typeof data.steps === 'string' ? data.steps : '') ||
    (typeof data.preparation === 'string' ? data.preparation : '');
  if (!raw.trim()) return [];
  const lines = raw.includes('\n')
    ? raw.split('\n').map((l: string) => l.trim()).filter(Boolean)
    : raw.split(/\.\s+/).map((l: string) => l.trim()).filter(Boolean);
  return lines.map((text: string, i: number) => ({
    id: String(i),
    text: text.replace(/^\d+[.)]\s*/, '').trim(),
    duration: null,
  }));
}

export default function EditRecipe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [stepsArr, setStepsArr] = useState<LocalStep[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const docRef = doc(db, 'recipes', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Record<string, unknown>;
          setName(typeof data.name === 'string' ? data.name : '');
          setStepsArr(stepsFromData(data));
          setIngredients(Array.isArray(data.ingredients) ? (data.ingredients as Ingredient[]) : []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

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

  const handleRemoveIngredient = (ingredientId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIngredients(prev => prev.filter(i => i.id !== ingredientId));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('edit_missing_name_title'), t('edit_missing_name_msg'));
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'recipes', id), {
        name,
        steps: stepsArr,
        preparation: stepsArr.map(s => s.text).join('\n'),
        ingredients,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Alert.alert(t('edit_error_title'), String(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#e2b96f" />;

  return (
    <ScrollView style={erStyles.container} contentContainerStyle={erStyles.content}>
      <Text style={erStyles.title}>{t('edit_title')}</Text>
      <TextInput
        style={erStyles.input}
        placeholder={t('edit_name_placeholder')}
        placeholderTextColor="#4a4a6a"
        value={name}
        onChangeText={setName}
      />
      <Text style={erStyles.label}>{t('edit_ingredients_label')}</Text>
      <View style={erStyles.ingredientRow}>
        {ingredients.map(i => (
          <Pressable
            key={i.id}
            style={({ pressed }) => [erStyles.ingredientTile, pressed && { backgroundColor: '#2d2d4e' }]}
            onLongPress={() => handleRemoveIngredient(i.id)}
          >
            <IngredientIcon id={i.id} emoji={i.emoji} size={28} imageStyle={erStyles.tileIcon} textStyle={erStyles.tileEmoji} />
            <Text style={erStyles.tileName}>{i.name}</Text>
            {i.quantity ? <Text style={erStyles.tileQty}>{i.quantity}</Text> : null}
          </Pressable>
        ))}
        <Pressable
          style={({ pressed }) => [erStyles.addTile, pressed && { backgroundColor: '#2d2d4e' }]}
          onPress={() => router.push('/ingredient-picker')}
        >
          <Text style={erStyles.addTileText}>+</Text>
        </Pressable>
      </View>
      <Text style={erStyles.hint}>{t('edit_hint')}</Text>
      <Text style={erStyles.label}>{t('edit_steps_label')}</Text>
      <StepBuilder steps={stepsArr} onChange={setStepsArr} />
      <Pressable
        style={({ pressed }) => [erStyles.button, pressed && { backgroundColor: '#2d2d4e' }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={erStyles.buttonText}>{saving ? t('edit_saving') : t('edit_save')}</Text>
      </Pressable>
      <Pressable style={({ pressed }) => [pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
        <Text style={erStyles.link}>{t('edit_cancel')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const erStyles = {
  container: { flex: 1, backgroundColor: '#1a1a2e' } as const,
  content: { padding: 24, paddingTop: 60 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 16, marginBottom: 24 } as const,
  label: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 8, marginTop: 16 } as const,
  hint: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, marginBottom: 8 } as const,
  input: { backgroundColor: '#16213e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 16, marginBottom: 16, fontFamily: 'PressStart2P_400Regular', fontSize: 9 } as const,
  ingredientRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginBottom: 8 },
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
};
