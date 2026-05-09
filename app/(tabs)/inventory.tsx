import { useState, useMemo, useRef, useCallback } from 'react';
import {
  Text, View, FlatList, Pressable, TextInput, Alert, Modal,
  Animated, Dimensions, ScrollView, KeyboardAvoidingView,
  Platform, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../src/context/LanguageContext';
import { useInventory } from '../../src/context/InventoryContext';
import { useSubscription } from '../../src/context/SubscriptionContext';
import { INGREDIENTS, CATEGORIES, CATEGORY_ICONS, CATEGORY_TRANSLATIONS, Ingredient, getIngredientCategory } from '../../src/data/ingredients';
import { INGREDIENT_BUFFS } from '../../src/data/ingredientBuffs';
import { StringKey } from '../../src/i18n/strings';
import PressableScale from '../../src/components/PressableScale';
import IngredientIcon from '../../src/components/IngredientIcon';
import { calculateNutrition, formatNutritionValue, getAvailableUnits, getDefaultUnit } from '../../src/utils/nutrition';

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
  { key: 'calories', label: { en: 'CAL', tr: 'KAL' }, cap: 5000, color: '#e2b96f' },
  { key: 'protein', label: { en: 'PRO', tr: 'PRO' }, cap: 500, color: '#6fcf97' },
  { key: 'fat', label: { en: 'FAT', tr: 'YAG' }, cap: 500, color: '#bb86fc' },
  { key: 'carbs', label: { en: 'CARB', tr: 'KARB' }, cap: 1000, color: '#56ccf2' },
] as const;

const BUFF_TEXT = 'BUFFS: Effects unknown. This ingredient will later reveal what it supports, boosts, and restores.';

export default function Inventory() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { inventory, addItem, removeItem, updateItem } = useInventory();
  const { canAddInventoryItem } = useSubscription();

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
  const [detailIngredient, setDetailIngredient] = useState<Ingredient | null>(null);
  const [detailQuantity, setDetailQuantity] = useState('1');
  const [detailMetric, setDetailMetric] = useState('g');
  const [detailQuantityEditable, setDetailQuantityEditable] = useState(false);
  const [limitVisible, setLimitVisible] = useState(false);

  // ─── Slide animation ─────────────────────────────────────────────────────
  const slideY = useRef(new Animated.Value(SH)).current;

  const openSheet = useCallback(() => {
    if (!canAddInventoryItem()) {
      setLimitVisible(true);
      return;
    }
    setSheetVisible(true);
    slideY.setValue(SH);
    Animated.spring(slideY, { toValue: 0, useNativeDriver: true, friction: 14, tension: 90 }).start();
  }, [canAddInventoryItem, slideY]);

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
      return ing ? getIngredientCategory(ing) === activeCategory : activeCategory === 'Misc';
    });
  }, [inventory, activeCategory]);

  const modalIngredients = useMemo(() => {
    let list: Ingredient[] = INGREDIENTS;
    if (modalCat !== 'All') list = list.filter(i => getIngredientCategory(i) === modalCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) || i.name_tr.toLowerCase().includes(q)
      );
    }
    return list;
  }, [modalCat, search]);

  const selectedMetricOptions = useMemo(() => (
    selected ? getAvailableUnits(selected.id) : METRICS.map(metricOption => metricOption.key)
  ), [selected]);

  const selectedNutrition = useMemo(() => (
    selected
      ? calculateNutrition(selected.id, quantity, metric || getDefaultUnit(selected.id))
      : calculateNutrition('', '', '')
  ), [selected, quantity, metric]);

  const detailNutrition = useMemo(() => (
    detailIngredient
      ? calculateNutrition(detailIngredient.id, detailQuantity, detailMetric || getDefaultUnit(detailIngredient.id))
      : calculateNutrition('', '', '')
  ), [detailIngredient, detailQuantity, detailMetric]);

  const detailMetricOptions = useMemo(() => (
    detailIngredient ? getAvailableUnits(detailIngredient.id) : []
  ), [detailIngredient]);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const catLabel = (cat: string) =>
    cat === 'All'
      ? t('picker_all')
      : `${CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS]} ${language === 'tr' ? (CATEGORY_TRANSLATIONS[cat] ?? cat) : cat}`;

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
    setMetric(getDefaultUnit(ing.id));
  }, []);

  const handleOpenInventoryDetail = useCallback((id: string, itemQuantity: number, itemMetric: string) => {
    const ing = INGREDIENTS.find(i => i.id === id);
    if (!ing) return;
    setDetailIngredient(ing);
    setDetailQuantity(String(itemQuantity));
    setDetailMetric(itemMetric);
    setDetailQuantityEditable(false);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailIngredient(null);
    setDetailQuantityEditable(false);
  }, []);

  const handleAdd = useCallback(async () => {
    if (!selected) return;
    await addItem({ id: selected.id, quantity: parseFloat(quantity) || 1, metric });
    closeSheet();
  }, [selected, quantity, metric, addItem, closeSheet]);

  const handleSaveDetailQuantity = useCallback(async () => {
    if (!detailIngredient) return;
    const nextQuantity = parseFloat(detailQuantity) || 1;
    await updateItem(detailIngredient.id, nextQuantity, detailMetric || getDefaultUnit(detailIngredient.id));
    setDetailQuantity(String(nextQuantity));
    setDetailQuantityEditable(false);
  }, [detailIngredient, detailQuantity, detailMetric, updateItem]);

  // ─── Render: inventory card ───────────────────────────────────────────────
  const renderInventoryCard = useCallback(({ item }: { item: typeof inventory[0] }) => {
    const ing = INGREDIENTS.find(i => i.id === item.id);
    return (
      <PressableScale
        onPress={() => handleOpenInventoryDetail(item.id, item.quantity, item.metric)}
        onLongPress={() => handleRemove(item.id)}
        style={[s.card, { width: CARD_W }]}
      >
        <IngredientIcon id={ing?.id} emoji={ing?.emoji ?? '🥄'} size={32} imageStyle={s.cardIcon} textStyle={s.cardEmoji} />
        <Text style={s.cardName} numberOfLines={2}>{ingName(item.id)}</Text>
        <Text style={s.cardQty}>{item.quantity} {item.metric}</Text>
      </PressableScale>
    );
  }, [language, handleRemove, handleOpenInventoryDetail]);

  // ─── Render: ingredient pick card (modal step 1) ──────────────────────────
  const renderPickCard = useCallback(({ item }: { item: Ingredient }) => {
    const isLogged = !!inventory.find(i => i.id === item.id);
    return (
      <PressableScale
        onPress={() => handleSelectIngredient(item)}
        style={[s.pickCard, { width: MODAL_CARD_W }, isLogged && s.pickCardLogged]}
      >
        <IngredientIcon id={item.id} emoji={item.emoji} size={30} imageStyle={s.pickIcon} textStyle={s.pickEmoji} />
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
            <IngredientIcon id={selected.id} emoji={selected.emoji} size={86} imageStyle={s.selectedIcon} textStyle={s.selectedEmoji} />
          </View>
          <View style={s.statPanel}>
            {NUTRITION_STATS.map(stat => {
              const value = selectedNutrition[stat.key];
              return (
              <View key={stat.key} style={s.statRow}>
                <Text style={s.statLabel}>{stat.label[language]}</Text>
                <View style={s.statTrack}>
                  <View style={[s.statFill, { width: `${Math.min(100, value / stat.cap * 100)}%`, backgroundColor: stat.color }]} />
                </View>
                <Text style={s.statValue}>{formatNutritionValue(value)}</Text>
              </View>
              );
            })}
          </View>
          <Text style={s.sourceCredit}>{language === 'tr' ? 'Besin verisi: USDA FoodData Central' : 'Nutrition data: USDA FoodData Central'}</Text>
          <View style={s.buffPanel}>
            <Text style={s.buffText}>{language === 'tr' ? (INGREDIENT_BUFFS[selected.id]?.textTr ?? BUFF_TEXT) : (INGREDIENT_BUFFS[selected.id]?.text ?? BUFF_TEXT)}</Text>
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
        {selectedMetricOptions.map(unit => {
          const metricConfig = METRICS.find(item => item.key === unit);
          return (
          <PressableScale key={unit} onPress={() => setMetric(unit)} style={[s.chip, metric === unit && s.chipActive]}>
            <Text style={[s.chipText, metric === unit && s.chipTextActive]}>{metricConfig ? t(metricConfig.labelKey) : unit}</Text>
          </PressableScale>
          );
        })}
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

      <Modal visible={!!detailIngredient} transparent animationType="fade" onRequestClose={closeDetail}>
        <View style={s.detailOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDetail} />
          {detailIngredient && (
            <View style={s.detailCard}>
              <Text style={s.selectedName}>
                {language === 'tr' ? detailIngredient.name_tr : detailIngredient.name}
              </Text>
              <View style={s.ingredientArtSlot}>
                <IngredientIcon id={detailIngredient.id} emoji={detailIngredient.emoji} size={86} imageStyle={s.selectedIcon} textStyle={s.selectedEmoji} />
              </View>
              <View style={s.statPanel}>
                {NUTRITION_STATS.map(stat => {
                  const value = detailNutrition[stat.key];
                  return (
                    <View key={stat.key} style={s.statRow}>
                      <Text style={s.statLabel}>{stat.label[language]}</Text>
                      <View style={s.statTrack}>
                        <View style={[s.statFill, { width: `${Math.min(100, value / stat.cap * 100)}%`, backgroundColor: stat.color }]} />
                      </View>
                      <Text style={s.statValue}>{formatNutritionValue(value)}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={s.sourceCredit}>{language === 'tr' ? 'Besin verisi: USDA FoodData Central' : 'Nutrition data: USDA FoodData Central'}</Text>
              <View style={s.buffPanel}>
                <Text style={s.buffText}>{language === 'tr' ? (INGREDIENT_BUFFS[detailIngredient.id]?.textTr ?? BUFF_TEXT) : (INGREDIENT_BUFFS[detailIngredient.id]?.text ?? BUFF_TEXT)}</Text>
              </View>

              <Text style={s.label}>{t('inventory_how_many')}</Text>
              <View style={s.detailQuantityRow}>
                <TextInput
                  style={[s.qtyInput, s.detailQtyInput, !detailQuantityEditable && s.lockedInput]}
                  keyboardType="numeric"
                  value={detailQuantity}
                  onChangeText={setDetailQuantity}
                  editable={detailQuantityEditable}
                  selectTextOnFocus
                />
                <PressableScale
                  onPress={detailQuantityEditable ? handleSaveDetailQuantity : () => setDetailQuantityEditable(true)}
                  style={s.detailEditButton}
                >
                  <Text style={s.detailEditButtonText}>
                    {detailQuantityEditable
                      ? (language === 'tr' ? 'KAYDET' : 'SAVE')
                      : (language === 'tr' ? 'MIKTARI DUZENLE' : 'EDIT QUANTITY')}
                  </Text>
                </PressableScale>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.detailChipRow} contentContainerStyle={s.chipRowContent}>
                {detailMetricOptions.map(unit => {
                  const metricConfig = METRICS.find(item => item.key === unit);
                  return (
                    <PressableScale
                      key={unit}
                      disabled={!detailQuantityEditable}
                      onPress={() => setDetailMetric(unit)}
                      style={[s.chip, detailMetric === unit && s.chipActive, !detailQuantityEditable && s.lockedChip]}
                    >
                      <Text style={[s.chipText, detailMetric === unit && s.chipTextActive]}>{metricConfig ? t(metricConfig.labelKey) : unit}</Text>
                    </PressableScale>
                  );
                })}
              </ScrollView>

              <PressableScale onPress={closeDetail} style={s.detailCloseButton}>
                <Text style={s.addButtonText}>{t('account_cancel')}</Text>
              </PressableScale>
            </View>
          )}
        </View>
      </Modal>

      <Modal visible={limitVisible} transparent animationType="fade" onRequestClose={() => setLimitVisible(false)}>
        <View style={s.limitOverlay}>
          <View style={s.limitCard}>
            <Text style={s.limitTitle}>{t('sub_inventory_limit')}</Text>
            <Text style={s.limitMessage}>{t('sub_limit_msg_inventory')}</Text>
            <PressableScale
              onPress={() => {
                setLimitVisible(false);
                router.push('/subscription');
              }}
              style={s.limitUpgradeButton}
            >
              <Text style={s.limitUpgradeText}>{t('sub_upgrade_cta')}</Text>
            </PressableScale>
            <Pressable onPress={() => setLimitVisible(false)} style={s.limitCloseButton}>
              <Text style={s.limitCloseText}>{t('sub_close')}</Text>
            </Pressable>
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
  cardIcon:        { marginBottom: 4 },
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
  pickIcon:        { marginBottom: 4 },
  pickName:        { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 6, textAlign: 'center' },
  loggedDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c8a84b', position: 'absolute', top: 6, right: 6 },

  // Step 2
  backRow:         { marginBottom: 16 },
  backText:        { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },
  selectedPreview: { backgroundColor: '#16213e', borderWidth: 2, borderColor: '#c8a84b', padding: 16, marginBottom: 20 },
  selectedEmoji:   { fontSize: 62 },
  selectedIcon:    {},
  selectedName:    { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10, lineHeight: 18, textAlign: 'center', marginBottom: 12 },
  ingredientArtSlot:{ height: 124, marginBottom: 12, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', alignItems: 'center', justifyContent: 'center' },
  statPanel:        { marginBottom: 12, gap: 6 },
  statRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel:        { width: 36, fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7 },
  statTrack:        { flex: 1, maxWidth: 250, height: 8, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e' },
  statFill:         { height: '100%' },
  statValue:        { width: 48, fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 7, textAlign: 'left' },
  sourceCredit:     { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 6, marginBottom: 8 },
  buffPanel:        { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', padding: 10, marginBottom: 18 },
  buffText:         { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7, lineHeight: 14 },
  detailOverlay:    { flex: 1, backgroundColor: 'rgba(10, 10, 20, 0.72)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  detailCard:       { width: '100%', maxWidth: 390, backgroundColor: '#16213e', borderWidth: 2, borderColor: '#c8a84b', padding: 18 },
  detailQuantityRow:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  detailQtyInput:   { flex: 1, marginBottom: 0 },
  detailEditButton: { borderWidth: 1, borderColor: '#c8a84b', paddingHorizontal: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', minHeight: 50, maxWidth: 142 },
  detailEditButtonText:{ fontFamily: 'PressStart2P_400Regular', color: '#c8a84b', fontSize: 6, lineHeight: 12, textAlign: 'center' },
  detailChipRow:    { flexGrow: 0, marginBottom: 4 },
  lockedInput:      { opacity: 0.55, color: '#8f8fb8' },
  lockedChip:       { opacity: 0.55 },
  detailCloseButton:{ borderWidth: 2, borderColor: '#c8a84b', padding: 12, alignItems: 'center', marginTop: 16 },
  label:           { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 8 },
  qtyInput:        { backgroundColor: '#16213e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 14, marginBottom: 16, fontFamily: 'PressStart2P_400Regular', fontSize: 14, textAlign: 'center' },
  addButton:       { borderWidth: 2, borderColor: '#c8a84b', padding: 16, alignItems: 'center', marginTop: 16 },
  addButtonText:   { fontFamily: 'PressStart2P_400Regular', color: '#c8a84b', fontSize: 9 },
  limitOverlay:    { flex: 1, backgroundColor: 'rgba(10, 10, 20, 0.78)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  limitCard:       { width: '100%', maxWidth: 360, backgroundColor: '#1a1a2e', borderWidth: 2, borderColor: '#c8a84b', padding: 20 },
  limitTitle:      { fontFamily: 'PressStart2P_400Regular', color: '#c8a84b', fontSize: 11, lineHeight: 18, textAlign: 'center', marginBottom: 14 },
  limitMessage:    { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 16, textAlign: 'center', marginBottom: 20 },
  limitUpgradeButton:{ backgroundColor: '#c8a84b', padding: 14, alignItems: 'center', marginBottom: 12 },
  limitUpgradeText:{ fontFamily: 'PressStart2P_400Regular', color: '#1a1a2e', fontSize: 9 },
  limitCloseButton:{ padding: 8, alignItems: 'center' },
  limitCloseText:  { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },
});
