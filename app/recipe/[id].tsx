import { useState, useCallback } from 'react';
import { Text, View, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { db } from '../../firebase';
import { doc, getDoc, deleteDoc } from '@firebase/firestore';
import { useLanguage } from '../../src/context/LanguageContext';
 
type Ingredient = { id: string; name: string; emoji: string; quantity: string };
type Recipe = { id: string; name: string; steps: string; ingredients: Ingredient[]; createdAt: any };
 
export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
 
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      const fetchRecipe = async () => {
        try {
          const docRef = doc(db, 'recipes', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) setRecipe({ id: docSnap.id, ...docSnap.data() } as Recipe);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchRecipe();
    }, [id])
  );
 
  const handleDelete = async () => {
    Alert.alert(t('detail_delete_title'), t('detail_delete_msg'), [
      { text: t('detail_delete_cancel'), style: 'cancel' },
      { text: t('detail_delete_confirm'), style: 'destructive', onPress: async () => { await deleteDoc(doc(db, 'recipes', id)); router.replace('/grimoire'); } },
    ]);
  };
 
  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#e2b96f" />;
  if (!recipe) return <Text style={{ color: '#c8c8e8', padding: 24, fontFamily: 'PressStart2P_400Regular', fontSize: 9 }}>{t('detail_not_found')}</Text>;
 
  return (
    <ScrollView style={rdStyles.container} contentContainerStyle={rdStyles.content}>
      <View style={rdStyles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
          <Text style={rdStyles.back}>{t('detail_back')}</Text>
        </Pressable>
        <View style={rdStyles.headerActions}>
          <Pressable onPress={() => router.push(`/edit-recipe/${id}`)} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
            <Text style={rdStyles.edit}>{t('detail_edit')}</Text>
          </Pressable>
          <Pressable onPress={handleDelete} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
            <Text style={rdStyles.delete}>{t('detail_delete')}</Text>
          </Pressable>
        </View>
      </View>
      <Text style={rdStyles.title}>{recipe.name.toUpperCase()}</Text>
      {recipe.ingredients?.length > 0 && (
        <>
          <Text style={rdStyles.sectionLabel}>{t('detail_ingredients')}</Text>
          <View style={rdStyles.ingredientRow}>
            {recipe.ingredients.map(i => (
              <View key={i.id} style={rdStyles.ingredientTile}>
                <Text style={rdStyles.tileEmoji}>{i.emoji}</Text>
                <Text style={rdStyles.tileName}>{i.name}</Text>
                {i.quantity ? <Text style={rdStyles.tileQty}>{i.quantity}</Text> : null}
              </View>
            ))}
          </View>
        </>
      )}
      <Text style={rdStyles.sectionLabel}>{t('detail_preparation')}</Text>
      <Text style={rdStyles.steps}>{recipe.steps}</Text>
    </ScrollView>
  );
}
 
const rdStyles = {
  container: { flex: 1, backgroundColor: '#1a1a2e' } as const,
  content: { padding: 24, paddingTop: 60 } as const,
  header: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 24 },
  headerActions: { flexDirection: 'row' as const, gap: 16 },
  back: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 } as const,
  edit: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 8 } as const,
  delete: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 14, marginBottom: 24, lineHeight: 26 } as const,
  sectionLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 12, marginTop: 8 } as const,
  ingredientRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginBottom: 24 },
  ingredientTile: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 10, alignItems: 'center' as const, margin: 4, minWidth: 70 },
  tileEmoji: { fontSize: 24, marginBottom: 2 } as const,
  tileName: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, textAlign: 'center' as const },
  tileQty: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 8 } as const,
  steps: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 20 } as const,
};