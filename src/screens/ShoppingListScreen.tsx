import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PressableScale from '../components/PressableScale';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { useLanguage } from '../context/LanguageContext';
import { INGREDIENTS } from '../data/ingredients';
import { registerIngredientCallback } from '../store/ingredientSelection';
import {
  ShoppingListInput,
  ShoppingListItem,
  addItemsToShoppingList,
  clearCheckedItems,
  deleteShoppingItem,
  subscribeShoppingList,
  toggleShoppingItem,
} from '../services/shoppingList';
import IngredientIcon from '../components/IngredientIcon';

const METRICS = ['piece', 'g', 'kg', 'ml', 'lt', 'tbsp', 'tsp', 'cup'];

export default function ShoppingListScreen({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { addItem } = useInventory();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [quantityItem, setQuantityItem] = useState<ShoppingListItem | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [metric, setMetric] = useState('piece');
  const userRef = useRef(user);
  const tRef = useRef(t);
  userRef.current = user;
  tRef.current = t;

  useEffect(() => {
    if (!user) return;
    return subscribeShoppingList(user.uid, setItems, console.warn);
  }, [user]);

  const toBuy = useMemo(() => items.filter(item => !item.checked), [items]);
  const inCart = useMemo(() => items.filter(item => item.checked), [items]);

  const requestDelete = (item: ShoppingListItem) => {
    if (!user) return;
    Alert.alert(t('list_delete_title'), item.name, [
      { text: t('account_cancel'), style: 'cancel' },
      { text: t('detail_delete_confirm'), style: 'destructive', onPress: () => deleteShoppingItem(user.uid, item.id).catch(console.warn) },
    ]);
  };

  const openQuantityPrompt = async (item: ShoppingListItem) => {
    if (!user) return;
    setItems(current => current.map(row => row.id === item.id ? { ...row, checked: true } : row));
    await toggleShoppingItem(user.uid, item.id, true).catch(console.warn);
    setQuantityItem(item);
    setQuantity('1');
    setMetric('piece');
  };

  const handleToggle = async (item: ShoppingListItem) => {
    if (!user) return;
    if (item.checked) {
      await toggleShoppingItem(user.uid, item.id, false).catch(console.warn);
      return;
    }
    await openQuantityPrompt(item);
  };

  const closeQuantityPrompt = () => setQuantityItem(null);

  const confirmAddToInventory = async () => {
    if (!quantityItem) return;
    const ingredient = INGREDIENTS.find(i => i.id === quantityItem.id || i.name.toLowerCase() === quantityItem.name.toLowerCase());
    await addItem({
      id: ingredient?.id ?? quantityItem.id,
      name: ingredient ? (language === 'tr' ? ingredient.name_tr : ingredient.name) : quantityItem.name,
      emoji: quantityItem.emoji || ingredient?.emoji || '🛒',
      category: ingredient?.category ?? 'Misc',
      quantity: parseFloat(quantity) || 1,
      metric,
    });
    ToastAndroid.show(t('list_added_inventory'), ToastAndroid.SHORT);
    closeQuantityPrompt();
  };

  const skipInventory = () => {
    closeQuantityPrompt();
  };

  const openIngredientPicker = () => {
    registerIngredientCallback(async (result) => {
      const uid = userRef.current?.uid;
      if (!uid) return;
      const ingredient = INGREDIENTS.find(i => i.id === result.id);
      const payload: ShoppingListInput = {
        name: result.name,
        emoji: ingredient?.emoji ?? result.emoji,
        recipeId: null,
        recipeName: tRef.current('list_manual'),
      };
      try {
        const res = await addItemsToShoppingList(uid, [payload]);
        ToastAndroid.show(
          res.added > 0 ? tRef.current('magic_orb_added_to_list') : tRef.current('magic_orb_already_list'),
          ToastAndroid.SHORT
        );
      } catch (error) {
        console.warn('Unable to update provisions list', error);
      }
    });
    router.push('/ingredient-picker');
  };

  const clearBought = () => {
    if (!user) return;
    Alert.alert(t('list_clear_title'), t('list_clear_msg'), [
      { text: t('account_cancel'), style: 'cancel' },
      { text: t('list_clear'), style: 'destructive', onPress: () => clearCheckedItems(user.uid).catch(console.warn) },
    ]);
  };

  const renderRow = (item: ShoppingListItem) => (
    <PressableScale
      key={item.id}
      onPress={() => handleToggle(item)}
      onLongPress={() => requestDelete(item)}
      style={[styles.row, item.checked && styles.rowChecked]}
    >
      <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
        {item.checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <IngredientIcon id={item.id} emoji={item.emoji} size={24} imageStyle={styles.itemIcon} textStyle={styles.emoji} />
      <View style={styles.rowTextWrap}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name.toUpperCase()}</Text>
        <Text style={styles.recipeName} numberOfLines={1}>
          {item.recipeName === 'Manual' || item.recipeName === t('list_manual') ? t('list_manual') : `${t('list_for')} ${item.recipeName.toUpperCase()}`}
        </Text>
      </View>
    </PressableScale>
  );

  return (
    <View style={[styles.container, embedded && styles.embeddedContainer]}>
      {!embedded && (
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>{t('grimoire_back')}</Text>
          </Pressable>
          <Text style={styles.title}>{t('list_title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
      )}

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{t('list_empty')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}>
          <Text style={styles.sectionTitle}>{t('list_to_buy')}</Text>
          {toBuy.length === 0 ? <Text style={styles.muted}>{t('list_nothing_left')}</Text> : toBuy.map(renderRow)}

          <PressableScale onPress={() => openIngredientPicker()} style={styles.addManualButton}>
            <Text style={styles.addManualText}>{t('list_add_item')}</Text>
          </PressableScale>

          {inCart.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('list_in_cart')}</Text>
              {inCart.map(renderRow)}
              <PressableScale onPress={clearBought} style={styles.clearButton}>
                <Text style={styles.clearText}>{t('list_clear_title')}</Text>
              </PressableScale>
            </>
          )}
        </ScrollView>
      )}

      {items.length === 0 && (
        <PressableScale onPress={() => openIngredientPicker()} style={[styles.bottomAddButton, embedded && styles.embeddedBottomAddButton, { bottom: insets.bottom + 24 }]}>
          <Text style={styles.addManualText}>{t('list_add_item')}</Text>
        </PressableScale>
      )}

      <Modal visible={!!quantityItem} transparent animationType="fade" onRequestClose={skipInventory}>
        <View style={[styles.overlay, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('list_quantity_title')}</Text>
            <View style={styles.modalItemRow}>
              <IngredientIcon id={quantityItem?.id} emoji={quantityItem?.emoji} size={24} imageStyle={styles.modalItemIcon} textStyle={styles.emoji} />
              <Text style={styles.modalItem}>{quantityItem?.name.toUpperCase()}</Text>
            </View>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
              selectTextOnFocus
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricRow}>
              {METRICS.map(option => (
                <PressableScale key={option} onPress={() => setMetric(option)} style={[styles.metricChip, metric === option && styles.metricChipActive]}>
                  <Text style={[styles.metricText, metric === option && styles.metricTextActive]}>{option === 'piece' ? t('metric_piece') : option}</Text>
                </PressableScale>
              ))}
            </ScrollView>
            <PressableScale onPress={confirmAddToInventory} style={styles.confirmButton}>
              <Text style={styles.confirmText}>{t('inventory_add_to')}</Text>
            </PressableScale>
            <Pressable onPress={skipInventory} style={styles.skipButton}>
              <Text style={styles.skipText}>{t('list_skip')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', paddingTop: 60, paddingHorizontal: 20 },
  embeddedContainer: { backgroundColor: 'transparent', paddingTop: 0, paddingHorizontal: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  back: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },
  title: { flex: 1, fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  headerSpacer: { width: 36 },
  content: { paddingBottom: 34 },
  sectionTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 9, marginBottom: 10, marginTop: 8 },
  muted: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, lineHeight: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 12, marginBottom: 8 },
  rowChecked: { opacity: 0.5 },
  checkbox: { width: 20, height: 20, borderWidth: 2, borderColor: '#e2b96f', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxChecked: { backgroundColor: '#e2b96f' },
  checkmark: { fontFamily: 'PressStart2P_400Regular', color: '#1a1a2e', fontSize: 10 },
  emoji: { fontSize: 22, marginRight: 10 },
  itemIcon: { marginRight: 10 },
  rowTextWrap: { flex: 1 },
  itemName: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, marginBottom: 6 },
  recipeName: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 6 },
  addManualButton: { borderWidth: 1, borderColor: '#e2b96f', padding: 12, alignItems: 'center', marginTop: 6, marginBottom: 20 },
  bottomAddButton: { position: 'absolute', left: 20, right: 20, bottom: 28, borderWidth: 1, borderColor: '#e2b96f', padding: 14, alignItems: 'center' },
  embeddedBottomAddButton: { left: 0, right: 0 },
  addManualText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 8 },
  clearButton: { borderWidth: 1, borderColor: '#4a4a6a', padding: 12, alignItems: 'center', marginTop: 8 },
  clearText: { fontFamily: 'PressStart2P_400Regular', color: '#8f8fb8', fontSize: 8 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 90 },
  emptyText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, lineHeight: 20, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(10, 10, 20, 0.78)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 380, backgroundColor: '#16213e', borderWidth: 2, borderColor: '#2d2d4e', padding: 18 },
  modalTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10, lineHeight: 18, textAlign: 'center', marginBottom: 14 },
  modalItem: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 16, textAlign: 'center' },
  modalItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  modalItemIcon: { marginBottom: 0 },
  input: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', color: '#c8c8e8', fontFamily: 'PressStart2P_400Regular', fontSize: 10, padding: 12, marginBottom: 12, textAlign: 'center' },
  pickerCard: { maxHeight: '82%' },
  categoryRow: { gap: 8, paddingBottom: 12 },
  categoryChip: { borderWidth: 1, borderColor: '#2d2d4e', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#1a1a2e' },
  categoryChipActive: { backgroundColor: '#e2b96f', borderColor: '#e2b96f' },
  categoryText: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7, lineHeight: 13 },
  categoryTextActive: { color: '#1a1a2e' },
  pickGrid: { paddingBottom: 12 },
  pickRow: { gap: 8, marginBottom: 8 },
  pickCard: { flex: 1, maxWidth: '31.8%', minHeight: 82, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', padding: 8, alignItems: 'center', justifyContent: 'center' },
  pickIcon: { marginBottom: 5 },
  pickEmoji: { fontSize: 26, marginBottom: 5 },
  pickName: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 6, lineHeight: 11, textAlign: 'center' },
  metricRow: { gap: 8, paddingBottom: 10 },
  metricChip: { borderWidth: 1, borderColor: '#2d2d4e', paddingHorizontal: 10, paddingVertical: 8 },
  metricChipActive: { borderColor: '#e2b96f', backgroundColor: '#e2b96f' },
  metricText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7 },
  metricTextActive: { color: '#1a1a2e' },
  confirmButton: { backgroundColor: '#e2b96f', padding: 14, alignItems: 'center', marginTop: 8 },
  confirmText: { fontFamily: 'PressStart2P_400Regular', color: '#1a1a2e', fontSize: 8 },
  skipButton: { padding: 12, alignItems: 'center' },
  skipText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },
});
