import { useState, useCallback } from 'react';
import { Text, TextInput, View, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from '@firebase/firestore';
import { registerIngredientCallback } from '../src/store/ingredientSelection';
import * as Haptics from 'expo-haptics';
import StepBuilder, { LocalStep } from '../src/components/StepBuilder';

type SelectedIngredient = { id: string; name: string; emoji: string; quantity: string };

export default function CreateRecipe() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [stepsArr, setStepsArr] = useState<LocalStep[]>([]);
  const [ingredients, setIngredients] = useState<SelectedIngredient[]>([]);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('create_missing_name_title'), t('create_missing_name_msg'));
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'recipes'), {
        userId: user?.uid,
        name,
        steps: stepsArr,
        preparation: stepsArr.map(s => s.text).join('\n'),
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
    <ScrollView style={crStyles.container} contentContainerStyle={crStyles.content}>
      <Text style={crStyles.title}>{t('create_title')}</Text>
      <TextInput
        style={crStyles.input}
        placeholder={t('create_name_placeholder')}
        placeholderTextColor="#4a4a6a"
        value={name}
        onChangeText={setName}
      />
      <Text style={[crStyles.label, crStyles.ingredientsLabel]}>{t('create_ingredients_label')}</Text>
      <View style={crStyles.ingredientRow}>
        {ingredients.map(i => (
          <View key={i.id} style={crStyles.ingredientTile}>
            <Text style={crStyles.tileEmoji}>{i.emoji}</Text>
            <Text style={crStyles.tileName}>{i.name}</Text>
            {i.quantity ? <Text style={crStyles.tileQty}>{i.quantity}</Text> : null}
          </View>
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
    </ScrollView>
  );
}

const crStyles = {
  container: { flex: 1, backgroundColor: '#1a1a2e' } as const,
  content: { padding: 24, paddingTop: 60 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 16, marginBottom: 24 } as const,
  label: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 8, marginTop: 16 } as const,
  ingredientsLabel: { color: '#e2b96f', textShadowColor: '#c8a84b', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 } as const,
  input: { backgroundColor: '#16213e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 16, marginBottom: 16, fontFamily: 'PressStart2P_400Regular', fontSize: 9 } as const,
  ingredientRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginBottom: 16 },
  ingredientTile: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 10, alignItems: 'center' as const, margin: 4, minWidth: 70 },
  tileEmoji: { fontSize: 24, marginBottom: 2 } as const,
  tileName: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, textAlign: 'center' as const },
  tileQty: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 8 } as const,
  addTile: { backgroundColor: '#16213e', borderWidth: 2, borderColor: '#e2b96f', padding: 10, alignItems: 'center' as const, justifyContent: 'center' as const, margin: 4, minWidth: 70, minHeight: 70 },
  addTileText: { color: '#e2b96f', fontSize: 28, fontWeight: '700' as const },
  button: { backgroundColor: '#16213e', borderWidth: 2, borderColor: '#e2b96f', padding: 16, alignItems: 'center' as const, marginTop: 24, marginBottom: 16 },
  buttonText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10 } as const,
  link: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', textAlign: 'center' as const, fontSize: 8 },
};
