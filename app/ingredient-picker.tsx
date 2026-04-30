import { useMemo, useState, useEffect } from 'react';
import { Text, View, TextInput, FlatList, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { INGREDIENTS, CATEGORIES, CATEGORY_TRANSLATIONS, Ingredient } from '../src/data/ingredients';
import { INGREDIENT_BUFFS } from '../src/data/ingredientBuffs';
import { resolveIngredient } from '../src/store/ingredientSelection';
import { useLanguage } from '../src/context/LanguageContext';
import { calculateNutrition, formatNutritionValue, getAvailableUnits, getDefaultUnit } from '../src/utils/nutrition';
import * as Haptics from 'expo-haptics';
 
const CUSTOM_EMOJIS = ['🍽️','🥘','🫕','🥗','🍲','🧆','🥙','🌮','🍜','🥫','🧂','🫙','🌿','🍵','🥤','🧃','🫗','🍶','🧁','🍰','🎂','🍩','🍪','🍫','🍬','🍭','🥐','🍞','🥖','🥨','🧇','🥞','🧈','🍳','🥚','🧀','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🌯','🫔','🍱','🍛','🍝','🍠','🍢','🍣','🍤','🍙','🍚','🍘','🍥','🥮','🍡','🍦','🍧','🍨','🥧','🍮','🍯'];
const UNIT_OPTIONS = ['', 'g', 'kg', 'ml', 'L', 'tsp', 'tbsp', 'cup', 'pcs', 'pinch'];
const NUTRITION_STATS = [
  { key: 'calories', label: { en: 'CAL', tr: 'KAL' }, cap: 5000, color: '#e2b96f' },
  { key: 'protein', label: { en: 'PRO', tr: 'PRO' }, cap: 500, color: '#6fcf97' },
  { key: 'fat', label: { en: 'FAT', tr: 'YAG' }, cap: 500, color: '#bb86fc' },
  { key: 'carbs', label: { en: 'CARB', tr: 'KARB' }, cap: 1000, color: '#56ccf2' },
] as const;
const BUFF_TEXT = 'BUFFS: Effects unknown. This ingredient will later reveal what it supports, boosts, and restores.';

function parseQuantityString(qs: string): { amount: string; unit: string } {
  const parts = qs.trim().split(' ');
  if (parts.length >= 2) {
    const possibleUnit = parts[parts.length - 1];
    if (UNIT_OPTIONS.includes(possibleUnit)) {
      return { amount: parts.slice(0, -1).join(' '), unit: possibleUnit };
    }
  }
  return { amount: qs.trim(), unit: '' };
}

export default function IngredientPicker() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const iname = (ing: Ingredient) => language === 'tr' ? ing.name_tr : ing.name;
  const { editId, editQuantity } = useLocalSearchParams<{ editId?: string; editQuantity?: string }>();
  const isEditing = !!editId;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [quantity, setQuantity] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('🍽️');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (!editId) return;
    const ing = INGREDIENTS.find(i => i.id === editId);
    if (!ing) return;
    setSelectedIngredient(ing);
    if (editQuantity) {
      const { amount, unit } = parseQuantityString(editQuantity);
      setQuantity(amount);
      setSelectedUnit(unit);
    }
  }, []);
 
  const selectedUnitOptions = selectedIngredient ? getAvailableUnits(selectedIngredient.id) : UNIT_OPTIONS;
  const selectedNutrition = useMemo(() => (
    selectedIngredient
      ? calculateNutrition(selectedIngredient.id, quantity, selectedUnit || getDefaultUnit(selectedIngredient.id))
      : calculateNutrition('', '', '')
  ), [selectedIngredient, quantity, selectedUnit]);

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
    setSelectedUnit('');
    setShowUnitPicker(false);
  };

  const getQuantityText = () => [quantity.trim(), selectedUnit].filter(Boolean).join(' ');
 
  const handleConfirm = () => {
    if (!selectedIngredient) return;
    const result = { id: selectedIngredient.id, name: iname(selectedIngredient), emoji: selectedIngredient.emoji, quantity: getQuantityText() };
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resolveIngredient(result);
    router.back();
  };

  const handleCustomConfirm = () => {
    if (!customName.trim()) return;
    const result = { id: `custom_${Date.now()}`, name: customName.trim(), emoji: customEmoji, quantity: getQuantityText() };
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resolveIngredient(result);
    router.back();
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
          <Pressable style={({ pressed }) => [ipStyles.customButton, pressed && { backgroundColor: '#16213e' }]} onPress={() => { setCustomMode(true); setSelectedIngredient(null); setSelectedUnit(''); setShowUnitPicker(false); }}>
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
          <View style={[ipStyles.quantityUnitRow, { marginTop: 8 }]}>
            <TextInput style={[ipStyles.quantityInput, ipStyles.quantityInputWithUnit]} placeholder={t('picker_quantity')} placeholderTextColor="#94a3b8" value={quantity} onChangeText={setQuantity} />
            <Pressable style={({ pressed }) => [ipStyles.unitButton, pressed && { backgroundColor: '#2d2d4e' }]} onPress={() => setShowUnitPicker(!showUnitPicker)}>
              <Text style={ipStyles.unitButtonText}>{selectedUnit || 'UNIT'}</Text>
            </Pressable>
          </View>
          {showUnitPicker && (
            <View style={ipStyles.unitGrid}>
              {UNIT_OPTIONS.map(unit => (
                <Pressable key={unit || 'none'} style={[ipStyles.unitOption, selectedUnit === unit && ipStyles.unitOptionSelected]} onPress={() => { setSelectedUnit(unit); setShowUnitPicker(false); }}>
                  <Text style={ipStyles.unitOptionText}>{unit || '-'}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Pressable style={({ pressed }) => [ipStyles.confirmButton, pressed && { backgroundColor: '#2d2d4e' }]} onPress={handleCustomConfirm}>
            <Text style={ipStyles.confirmText}>{t('picker_add')}</Text>
          </Pressable>
        </View>
      )}
      {selectedIngredient && !customMode && (
        <View style={ipStyles.cardOverlay}>
          <Pressable style={ipStyles.cardBackdrop} onPress={() => setSelectedIngredient(null)} />
          <View style={ipStyles.quantityCard}>
            <Text style={ipStyles.quantityLabel}>{iname(selectedIngredient)}</Text>
            <View style={ipStyles.ingredientArtSlot} />
            <View style={ipStyles.statPanel}>
              {NUTRITION_STATS.map(stat => {
                const value = selectedNutrition[stat.key];
                return (
                <View key={stat.key} style={ipStyles.statRow}>
                  <Text style={ipStyles.statLabel}>{stat.label[language]}</Text>
                  <View style={ipStyles.statTrack}>
                    <View style={[ipStyles.statFill, { width: `${Math.min(100, value / stat.cap * 100)}%`, backgroundColor: stat.color }]} />
                  </View>
                  <Text style={ipStyles.statValue}>{formatNutritionValue(value)}</Text>
                </View>
                );
              })}
            </View>
            <Text style={ipStyles.sourceCredit}>{language === 'tr' ? 'Besin verisi: USDA FoodData Central' : 'Nutrition data: USDA FoodData Central'}</Text>
            <View style={ipStyles.buffPanel}>
              <Text style={ipStyles.buffText}>{language === 'tr' ? (INGREDIENT_BUFFS[selectedIngredient.id]?.textTr ?? BUFF_TEXT) : (INGREDIENT_BUFFS[selectedIngredient.id]?.text ?? BUFF_TEXT)}</Text>
            </View>
            <View style={ipStyles.quantityControls}>
              <View style={ipStyles.quantityUnitRow}>
                <TextInput style={[ipStyles.quantityInput, ipStyles.quantityInputWithUnit]} placeholder={t('picker_quantity')} placeholderTextColor="#94a3b8" value={quantity} onChangeText={setQuantity} />
                <Pressable style={({ pressed }) => [ipStyles.unitButton, pressed && { backgroundColor: '#2d2d4e' }]} onPress={() => setShowUnitPicker(!showUnitPicker)}>
                  <Text style={ipStyles.unitButtonText}>{selectedUnit || 'UNIT'}</Text>
                </Pressable>
              </View>
              {showUnitPicker && (
                <View style={ipStyles.unitGrid}>
                  {selectedUnitOptions.map(unit => (
                    <Pressable key={unit || 'none'} style={[ipStyles.unitOption, selectedUnit === unit && ipStyles.unitOptionSelected]} onPress={() => { setSelectedUnit(unit); setShowUnitPicker(false); }}>
                      <Text style={ipStyles.unitOptionText}>{unit || '-'}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              <Pressable style={({ pressed }) => [ipStyles.confirmButton, pressed && { backgroundColor: '#2d2d4e' }]} onPress={handleConfirm}>
                <Text style={ipStyles.confirmText}>{isEditing ? 'UPDATE' : t('picker_add')}</Text>
              </Pressable>
            </View>
          </View>
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
  cardOverlay: { position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center' as const, justifyContent: 'center' as const, padding: 24 },
  cardBackdrop: { position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(10, 10, 20, 0.58)' },
  quantityCard: { width: '100%' as const, maxWidth: 370, minHeight: 590, backgroundColor: '#16213e', borderWidth: 2, borderColor: '#e2b96f', padding: 20, justifyContent: 'space-between' as const },
  ingredientArtSlot: { height: 150, marginTop: 16, marginBottom: 12, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e' },
  statPanel: { marginBottom: 12, gap: 6 },
  statRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  statLabel: { width: 36, fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7 } as const,
  statTrack: { flex: 1, maxWidth: 250, height: 8, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e' },
  statFill: { height: '100%' as const },
  statValue: { width: 48, fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 7, textAlign: 'left' as const },
  sourceCredit: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 6, marginBottom: 8 } as const,
  buffPanel: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', padding: 10, marginBottom: 12 },
  buffText: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7, lineHeight: 14 } as const,
  quantityControls: { marginTop: 'auto' as const },
  quantityLabel: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10, marginBottom: 8 } as const,
  quantityInput: { backgroundColor: '#1a1a2e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 12, marginBottom: 8 } as const,
  quantityUnitRow: { flexDirection: 'row' as const, alignItems: 'stretch' as const, gap: 8 },
  quantityInputWithUnit: { flex: 1, marginBottom: 8 },
  unitButton: { width: 86, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#e2b96f', paddingHorizontal: 8, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 8 },
  unitButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 8 } as const,
  unitGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginBottom: 8, gap: 6 },
  unitOption: { minWidth: 52, borderWidth: 1, borderColor: '#2d2d4e', backgroundColor: '#1a1a2e', paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center' as const },
  unitOptionSelected: { borderColor: '#e2b96f', backgroundColor: '#2d2d4e' } as const,
  unitOptionText: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7 } as const,
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
 
 
