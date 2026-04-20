import { useState } from 'react';
import { Text, View, TextInput, FlatList, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { INGREDIENTS, CATEGORIES, CATEGORY_TRANSLATIONS, Ingredient } from '../src/data/ingredients';
import { resolveIngredient } from '../src/store/ingredientSelection';
import { useLanguage } from '../src/context/LanguageContext';
import * as Haptics from 'expo-haptics';
 
const CUSTOM_EMOJIS = ['🍽️','🥘','🫕','🥗','🍲','🧆','🥙','🌮','🍜','🥫','🧂','🫙','🌿','🍵','🥤','🧃','🫗','🍶','🧁','🍰','🎂','🍩','🍪','🍫','🍬','🍭','🥐','🍞','🥖','🥨','🧇','🥞','🧈','🍳','🥚','🧀','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🌯','🫔','🍱','🍛','🍝','🍠','🍢','🍣','🍤','🍙','🍚','🍘','🍥','🥮','🍡','🍦','🍧','🍨','🥧','🍮','🍯'];
 
export default function IngredientPicker() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const iname = (ing: Ingredient) => language === 'tr' ? ing.name_tr : ing.name;
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [quantity, setQuantity] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('🍽️');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
 
  const filtered = INGREDIENTS.filter(i => {
    const matchesSearch = iname(i).toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? i.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });
 
  const handleSelect = (ingredient: Ingredient) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIngredient(ingredient);
    setCustomMode(false);
    setQuantity('');
  };
 
  const handleConfirm = () => {
    if (!selectedIngredient) return;
    const result = { id: selectedIngredient.id, name: iname(selectedIngredient), emoji: selectedIngredient.emoji, quantity };
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
    setTimeout(() => resolveIngredient(result), 150);
  };
 
  const handleCustomConfirm = () => {
    if (!customName.trim()) return;
    const result = { id: `custom_${Date.now()}`, name: customName.trim(), emoji: customEmoji, quantity };
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
    setTimeout(() => resolveIngredient(result), 150);
  };
 
  return (
    <KeyboardAvoidingView style={ipStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={ipStyles.title}>{t('picker_title')}</Text>
      <TextInput style={ipStyles.search} placeholder={t('picker_search')} placeholderTextColor="#94a3b8" value={search} onChangeText={text => { setSearch(text); setSelectedCategory(null); setCustomMode(false); }} autoFocus />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ipStyles.categories}>
        <Pressable style={[ipStyles.categoryChip, !selectedCategory && ipStyles.categoryChipActive]} onPress={() => setSelectedCategory(null)}>
          <Text style={ipStyles.categoryChipText}>{t('picker_all')}</Text>
        </Pressable>
        {CATEGORIES.map(cat => (
          <Pressable key={cat} style={[ipStyles.categoryChip, selectedCategory === cat && ipStyles.categoryChipActive]} onPress={() => { setSelectedCategory(cat); setSearch(''); setCustomMode(false); }}>
            <Text style={ipStyles.categoryChipText}>{language === 'tr' ? CATEGORY_TRANSLATIONS[cat] : cat}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={4}
        style={ipStyles.grid}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [ipStyles.tile, selectedIngredient?.id === item.id && ipStyles.tileSelected, pressed && { opacity: 0.6 }]} onPress={() => handleSelect(item)}>
            <Text style={ipStyles.tileEmoji}>{item.emoji}</Text>
            <Text style={ipStyles.tileName} numberOfLines={1}>{iname(item)}</Text>
          </Pressable>
        )}
        ListFooterComponent={
          <Pressable style={({ pressed }) => [ipStyles.customButton, pressed && { backgroundColor: '#16213e' }]} onPress={() => { setCustomMode(true); setSelectedIngredient(null); }}>
            <Text style={ipStyles.customButtonText}>{t('picker_custom_button')}</Text>
          </Pressable>
        }
      />
      {customMode && (
        <View style={ipStyles.quantityBar}>
          <View style={ipStyles.customRow}>
            <Pressable style={ipStyles.emojiToggle} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
              <Text style={{ fontSize: 28 }}>{customEmoji}</Text>
              <Text style={ipStyles.emojiToggleLabel}>▼</Text>
            </Pressable>
            <TextInput style={[ipStyles.quantityInput, { flex: 1, marginBottom: 0 }]} placeholder={t('picker_ingredient_name')} placeholderTextColor="#94a3b8" value={customName} onChangeText={setCustomName} />
          </View>
          {showEmojiPicker && (
            <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
              <View style={ipStyles.emojiGrid}>
                {CUSTOM_EMOJIS.map(e => (
                  <Pressable key={e} style={[ipStyles.emojiOption, customEmoji === e && ipStyles.emojiOptionSelected]} onPress={() => { setCustomEmoji(e); setShowEmojiPicker(false); }}>
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
          <TextInput style={[ipStyles.quantityInput, { marginTop: 8 }]} placeholder={t('picker_quantity')} placeholderTextColor="#94a3b8" value={quantity} onChangeText={setQuantity} />
          <Pressable style={({ pressed }) => [ipStyles.confirmButton, pressed && { backgroundColor: '#2d2d4e' }]} onPress={handleCustomConfirm}>
            <Text style={ipStyles.confirmText}>{t('picker_add')}</Text>
          </Pressable>
        </View>
      )}
      {selectedIngredient && !customMode && (
        <View style={ipStyles.quantityBar}>
          <Text style={ipStyles.quantityLabel}>{iname(selectedIngredient)}</Text>
          <TextInput style={ipStyles.quantityInput} placeholder={t('picker_quantity')} placeholderTextColor="#94a3b8" value={quantity} onChangeText={setQuantity} />
          <Pressable style={({ pressed }) => [ipStyles.confirmButton, pressed && { backgroundColor: '#2d2d4e' }]} onPress={handleConfirm}>
            <Text style={ipStyles.confirmText}>{t('picker_add')}</Text>
          </Pressable>
        </View>
      )}
      <Pressable style={({ pressed }) => [pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
        <Text style={ipStyles.cancel}>{t('picker_cancel')}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
 
const ipStyles = {
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 24, paddingTop: 60 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 16, marginBottom: 16 } as const,
  search: { backgroundColor: '#16213e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 14, marginBottom: 12 } as const,
  categories: { flexGrow: 0, marginBottom: 12 } as const,
  categoryChip: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', borderRadius: 0, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 } as const,
  categoryChipActive: { borderColor: '#e2b96f' } as const,
  categoryChipText: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8 } as const,
  grid: { flex: 1 } as const,
  tile: { flex: 1, margin: 6, backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 10, alignItems: 'center' as const },
  tileSelected: { borderColor: '#e2b96f' } as const,
  tileEmoji: { fontSize: 28, marginBottom: 4 } as const,
  tileName: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7, textAlign: 'center' as const },
  customButton: { borderWidth: 1, borderColor: '#2d2d4e', padding: 16, alignItems: 'center' as const, marginVertical: 8 },
  customButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 } as const,
  quantityBar: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 16, marginBottom: 12 } as const,
  quantityLabel: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10, marginBottom: 8 } as const,
  quantityInput: { backgroundColor: '#1a1a2e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 12, marginBottom: 8 } as const,
  confirmButton: { borderWidth: 2, borderColor: '#e2b96f', padding: 12, alignItems: 'center' as const },
  confirmText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10 } as const,
  cancel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', textAlign: 'center' as const, marginTop: 8, fontSize: 8 },
  emojiGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginBottom: 8 },
  emojiOption: { padding: 8, borderWidth: 1, borderColor: '#2d2d4e', margin: 3 },
  emojiOptionSelected: { borderColor: '#e2b96f' } as const,
  emojiToggle: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', padding: 8, alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 8, minWidth: 52 },
  emojiToggleLabel: { color: '#4a4a6a', fontSize: 8, marginTop: 2 } as const,
  customRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 8 },
  emojiInput: { backgroundColor: '#1a1a2e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 12, fontSize: 20, width: 52, textAlign: 'center' as const },
};
 
 