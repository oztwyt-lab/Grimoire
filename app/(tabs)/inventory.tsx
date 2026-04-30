import { useState, useMemo, useRef, useCallback } from 'react';
import {
  Text, View, FlatList, Pressable, TextInput, Alert, Modal,
  Animated, Dimensions, ScrollView, KeyboardAvoidingView,
  Platform, StyleSheet,
} from 'react-native';
import { useLanguage } from '../../src/context/LanguageContext';
import { useInventory } from '../../src/context/InventoryContext';
import { INGREDIENTS, CATEGORIES, CATEGORY_TRANSLATIONS, Ingredient } from '../../src/data/ingredients';
import { StringKey } from '../../src/i18n/strings';
import PressableScale from '../../src/components/PressableScale';

const { width: SW, height: SH } = Dimensions.get('window');
const COL_GAP = 8;
const MAIN_PAD = 24;
const CARD_W = (SW - MAIN_PAD * 2 - COL_GAP * 2) / 3;
const MODAL_PAD = 16;
const MODAL_CARD_W = (SW - MODAL_PAD * 2 - COL_GAP * 2) / 3;

const METRICS: { key: string; labelKey: StringKey }[] = [
  { key: 'piece', labelKey: 'metric_piece' },
  { key: 'kg',    labelKey: 'metric_kg' },
  { key: 'g',     labelKey: 'metric_g' },
  { key: 'lt',    labelKey: 'metric_lt' },
  { key: 'ml',    labelKey: 'metric_ml' },
  { key: 'cup',   labelKey: 'metric_cup' },
  { key: 'tbsp',  labelKey: 'metric_tbsp' },
  { key: 'tsp',   labelKey: 'metric_tsp' },
  { key: 'bunch', labelKey: 'metric_bunch' },
  { key: 'slice', labelKey: 'metric_slice' },
];

const NUTRITION_STATS = [
  { key: 'cal', label: 'CAL', value: 0, color: '#e2b96f' },
  { key: 'protein', label: 'PRO', value: 0, color: '#6fcf97' },
  { key: 'fat', label: 'FAT', value: 0, color: '#bb86fc' },
  { key: 'carb', label: 'CARB', value: 0, color: '#56ccf2' },
];

const BUFF_TEXT = 'BUFFS: Effects unknown. This ingredient will later reveal what it supports, boosts, and restores.';

export default function Inventory() {
  const { language, t } = useLanguage();
  const { inventory, addItem, removeItem } = useInventory();

  // ─── Main screen state ───────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState('All');

  // ─── Modal state ─────────────────────────────────────────────────────────
  const [sheetVisible, setSheetVisible] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [metric, setMetric] = useState('piece');
  const [search, setSearch] = useState('');
  const [modalCat, setModalCat] = useState('All');

  // ─── Slide animation ─────────────────────────────────────────────────────
  const slideY = useRef(new Animated.Value(SH)).current;

  const openSheet = useCallback(() => {
    setSheetVisible(true);
    slideY.setValue(SH);
    Animated.spring(slideY, { toValue: 0, useNativeDriver: true, friction: 14, tension: 90 }).start();
  }, [slideY]);

  const resetModal = useCallback(() => {
    setStep(1); setSelected(null); setQuantity('1');
    setMetric('piece'); setSearch(''); setModalCat('All');
  }, []);

  const closeSheet = useCallback(() => {
    Animated.timing(slideY, { toValue: SH, duration: 260, useNativeDriver: true }).start(() => {
      setSheetVisible(false);
      resetModal();
    });
  }, [slideY, resetModal]);

  // ─── Derived ─────────────────────────────────────────────────────────────
  const displayedItems = useMemo(() => {
    if (activeCategory === 'All') return inventory;
    return inventory.filter(item => {
      const ing = INGREDIENTS.find(i => i.id === item.id);
      return ing?.category === activeCategory;
    });
  }, [inventory, activeCategory]);

  const modalIngredients = useMemo(() => {
    let list: Ingredient[] = INGREDIENTS;
    if (modalCat !== 'All') list = list.filter(i => i.category === modalCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) || i.name_tr.toLowerCase().includes(q)
      );
    }
    return list;
  }, [modalCat, search]);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const catLabel = (cat: string) =>
    cat === 'All'
      ? t('picker_all')
      : language === 'tr' ? (CATEGORY_TRANSLATIONS[cat] ?? cat) : cat;

  const ingName = (id: string) => {
    const ing = INGREDIENTS.find(i => i.id === id);
    return ing ? (language === 'tr' ? ing.name_tr : ing.name) : id;
  };

  const handleRemove = useCallback((id: string) => {
    Alert.alert(t('inventory_remove_confirm'), undefined, [
      { text: t('account_cancel'), style: 'cancel' },
      { text: t('detail_delete_confirm'), style: 'destructive', onPress: () => removeItem(id) },
    ]);
  }, [t, removeItem]);

  const handleSelectIngredient = useCallback((ing: Ingredient) => {
    setSelected(ing);
    setStep(2);
    setQuantity('1');
    setMetric('piece');
  }, []);

  const handleAdd = useCallback(async () => {
    if (!selected) return;
    await addItem({ id: selected.id, quantity: parseFloat(quantity) || 1, metric });
    closeSheet();
  }, [selected, quantity, metric, addItem, closeSheet]);

  // ─── Render: inventory card ───────────────────────────────────────────────
  const renderInventoryCard = useCallback(({ item }: { item: typeof inventory[0] }) => {
    const ing = INGREDIENTS.find(i => i.id === item.id);
    return (
      <PressableScale
        onLongPress={() => handleRemove(item.id)}
        style={[s.card, { width: CARD_W }]}
      >
        <Text style={s.cardEmoji}>{ing?.emoji ?? '🥄'}</Text>
        <Text style={s.cardName} numberOfLines={2}>{ingName(item.id)}</Text>
        <Text style={s.cardQty}>{item.quantity} {item.metric}</Text>
      </PressableScale>
    );
  }, [language, handleRemove]);

  // ─── Render: ingredient pick card (modal step 1) ──────────────────────────
  const renderPickCard = useCallback(({ item }: { item: Ingredient }) => {
    const isLogged = !!inventory.find(i => i.id === item.id);
    return (
      <PressableScale
        onPress={() => handleSelectIngredient(item)}
        style={[s.pickCard, { width: MODAL_CARD_W }, isLogged && s.pickCardLogged]}
      >
        <Text style={s.pickEmoji}>{item.emoji}</Text>
        <Text style={s.pickName} numberOfLines={2}>
          {language === 'tr' ? item.name_tr : item.name}
        </Text>
        {isLogged && <View style={s.loggedDot} />}
      </PressableScale>
    );
  }, [language, inventory, handleSelectIngredient]);

  // ─── Category chip row (reused in main + modal) ───────────────────────────
  const CategoryChips = ({ active, onSelect }: { active: string; onSelect: (c: string) => void }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow} contentContainerStyle={s.chipRowContent}>
      {(['All', ...CATEGORIES] as string[]).map(cat => (
        <PressableScale key={cat} onPress={() => onSelect(cat)} style={[s.chip, active === cat && s.chipActive]}>
          <Text style={[s.chipText, active === cat && s.chipTextActive]}>{catLabel(cat)}</Text>
        </PressableScale>
      ))}
    </ScrollView>
  );

  // ─── Modal Step 1 ────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <View style={s.stepWrap}>
      <TextInput
        style={s.searchInput}
        placeholder={t('picker_search')}
        placeholderTextColor="#4a4a6a"
        value={search}
        onChangeText={setSearch}
      />
      <CategoryChips active={modalCat} onSelect={setModalCat} />
      <FlatList
        data={modalIngredients}
        keyExtractor={item => item.id}
        numColumns={3}
        columnWrapperStyle={s.row}
        contentContainerStyle={s.pickGrid}
        renderItem={renderPickCard}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );

  // ─── Modal Step 2 ────────────────────────────────────────────────────────
  const renderStep2 = () => (
    <ScrollView style={s.stepWrap} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => setStep(1)} style={s.backRow}>
        <Text style={s.backText}>◄ {t('detail_back')}</Text>
      </Pressable>

      {selected && (
        <View style={s.selectedPreview}>
          <Text style={s.selectedName}>
            {language === 'tr' ? selected.name_tr : selected.name}
          </Text>
          <View style={s.ingredientArtSlot}>
            <Text style={s.selectedEmoji}>{selected.emoji}</Text>
          </View>
          <View style={s.statPanel}>
            {NUTRITION_STATS.map(stat => (
              <View key={stat.key} style={s.statRow}>
                <Text style={s.statLabel}>{stat.label}</Text>
                <View style={s.statTrack}>
                  <View style={[s.statFill, { width: `${stat.value}%`, backgroundColor: stat.color }]} />
                </View>
                <Text style={s.statValue}>{stat.value}</Text>
              </View>
            ))}
          </View>
          <View style={s.buffPanel}>
            <Text style={s.buffText}>{BUFF_TEXT}</Text>
          </View>
        </View>
      )}

      <Text style={s.label}>{t('inventory_how_many')}</Text>
      <TextInput
        style={s.qtyInput}
        keyboardType="numeric"
        value={quantity}
        onChangeText={setQuantity}
        selectTextOnFocus
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow} contentContainerStyle={s.chipRowContent}>
        {METRICS.map(m => (
          <PressableScale key={m.key} onPress={() => setMetric(m.key)} style={[s.chip, metric === m.key && s.chipActive]}>
            <Text style={[s.chipText, metric === m.key && s.chipTextActive]}>{t(m.labelKey)}</Text>
          </PressableScale>
        ))}
      </ScrollView>

      <PressableScale onPress={handleAdd} style={s.addButton}>
        <Text style={s.addButtonText}>{t('inventory_add_to')}</Text>
      </PressableScale>
    </ScrollView>
  );

  // ─── Main render ─────────────────────────────────────────────────────────
  return (
    <View style={s.container}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>{t('inventory_title')}</Text>
        <PressableScale onPress={openSheet} style={s.logButton}>
          <Text style={s.logButtonText}>{t('inventory_add')}</Text>
        </PressableScale>
      </View>

      {/* Category filter */}
      <CategoryChips active={activeCategory} onSelect={setActiveCategory} />

      {/* Inventory grid / empty state */}
      {displayedItems.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyEmoji}>🎒</Text>
          <Text style={s.emptyText}>{t('inventory_empty')}</Text>
          <PressableScale onPress={openSheet} style={s.addButton}>
            <Text style={s.addButtonText}>{t('inventory_add')}</Text>
          </PressableScale>
        </View>
      ) : (
        <FlatList
          data={displayedItems}
          keyExtractor={item => item.id}
          numColumns={3}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.mainGrid}
          renderItem={renderInventoryCard}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom sheet modal */}
      <Modal visible={sheetVisible} transparent animationType="none" onRequestClose={closeSheet}>
        <View style={{ flex: 1 }}>
          {/* Backdrop */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          {/* Sheet */}
          <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <Animated.View style={[s.sheet, { transform: [{ translateY: slideY }] }]}>
                {/* Sheet handle + close */}
                <View style={s.sheetHeader}>
                  <View style={s.handle} />
                  <Pressable onPress={closeSheet} hitSlop={12}>
                    <Text style={s.closeX}>✕</Text>
                  </Pressable>
                </View>
                {step === 1 ? renderStep1() : renderStep2()}
              </Animated.View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#16213e', paddingTop: 60, paddingHorizontal: MAIN_PAD },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title:           { fontFamily: 'PressStart2P_400Regular', color: '#c8a84b', fontSize: 14 },
  logButton:       { borderWidth: 1, borderColor: '#c8a84b', paddingHorizontal: 10, paddingVertical: 8 },
  logButtonText:   { fontFamily: 'PressStart2P_400Regular', color: '#c8a84b', fontSize: 7 },

  // Category chips
  chipRow:         { flexGrow: 0, marginBottom: 16 },
  chipRowContent:  { gap: 8, paddingRight: 8 },
  chip:            { borderWidth: 1, borderColor: '#2d2d4e', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#1a1a2e' },
  chipActive:      { backgroundColor: '#c8a84b', borderColor: '#c8a84b' },
  chipText:        { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7 },
  chipTextActive:  { color: '#1a1a2e' },

  // Inventory grid
  row:             { gap: COL_GAP, marginBottom: COL_GAP, justifyContent: 'flex-start' },
  mainGrid:        { paddingBottom: 24 },
  card:            { backgroundColor: '#1a1a2e', borderRadius: 4, padding: 10, alignItems: 'center', minHeight: 90 },
  cardEmoji:       { fontSize: 28, marginBottom: 4 },
  cardName:        { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 6, textAlign: 'center', marginBottom: 4 },
  cardQty:         { fontFamily: 'PressStart2P_400Regular', color: '#c8a84b', fontSize: 6 },

  // Empty state
  emptyState:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyEmoji:      { fontSize: 72, marginBottom: 24 },
  emptyText:       { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, textAlign: 'center', lineHeight: 18, marginBottom: 32 },

  // Bottom sheet
  sheet:           { backgroundColor: '#1a1a2e', borderTopWidth: 2, borderTopColor: '#c8a84b', maxHeight: SH * 0.85, paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  sheetHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, paddingHorizontal: 16, marginBottom: 8 },
  handle:          { flex: 1, height: 3, backgroundColor: '#2d2d4e', borderRadius: 2, marginRight: 12 },
  closeX:          { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 10 },

  // Modal step wrapper
  stepWrap:        { paddingHorizontal: MODAL_PAD },

  // Search
  searchInput:     { backgroundColor: '#16213e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 12, marginBottom: 12, fontFamily: 'PressStart2P_400Regular', fontSize: 8 },

  // Pick grid (modal step 1)
  pickGrid:        { paddingBottom: 16 },
  pickCard:        { backgroundColor: '#16213e', borderRadius: 4, borderWidth: 1, borderColor: '#2d2d4e', padding: 8, alignItems: 'center', minHeight: 80 },
  pickCardLogged:  { borderColor: '#c8a84b' },
  pickEmoji:       { fontSize: 26, marginBottom: 4 },
  pickName:        { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 6, textAlign: 'center' },
  loggedDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c8a84b', position: 'absolute', top: 6, right: 6 },

  // Step 2
  backRow:         { marginBottom: 16 },
  backText:        { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },
  selectedPreview: { backgroundColor: '#16213e', borderWidth: 2, borderColor: '#c8a84b', padding: 16, marginBottom: 20 },
  selectedEmoji:   { fontSize: 62 },
  selectedName:    { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10, lineHeight: 18, textAlign: 'center', marginBottom: 12 },
  ingredientArtSlot:{ height: 124, marginBottom: 12, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', alignItems: 'center', justifyContent: 'center' },
  statPanel:        { marginBottom: 12, gap: 6 },
  statRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel:        { width: 36, fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7 },
  statTrack:        { flex: 1, height: 8, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e' },
  statFill:         { height: '100%' },
  statValue:        { width: 22, fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 7, textAlign: 'right' },
  buffPanel:        { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', padding: 10 },
  buffText:         { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7, lineHeight: 14 },
  label:           { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 8 },
  qtyInput:        { backgroundColor: '#16213e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 14, marginBottom: 16, fontFamily: 'PressStart2P_400Regular', fontSize: 14, textAlign: 'center' },
  addButton:       { borderWidth: 2, borderColor: '#c8a84b', padding: 16, alignItems: 'center', marginTop: 16 },
  addButtonText:   { fontFamily: 'PressStart2P_400Regular', color: '#c8a84b', fontSize: 9 },
});
