import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timestamp } from '@firebase/firestore';

export interface ShoppingListItem {
  id: string;
  name: string;
  emoji: string;
  recipeId: string | null;
  recipeName: string;
  checked: boolean;
  addedAt?: Timestamp;
}

export type ShoppingListInput = Omit<ShoppingListItem, 'id' | 'checked' | 'addedAt'>;

type Listener = (items: ShoppingListItem[]) => void;
type StoredShoppingListItem = Omit<ShoppingListItem, 'addedAt'> & { addedAtMs: number };

const listeners = new Map<string, Set<Listener>>();

function storageKey(uid: string) {
  return `@grimor_shopping_list:${uid}`;
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function nowId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function toStored(item: ShoppingListItem): StoredShoppingListItem {
  return {
    id: item.id,
    name: item.name,
    emoji: item.emoji,
    recipeId: item.recipeId,
    recipeName: item.recipeName,
    checked: item.checked,
    addedAtMs: item.addedAt?.toMillis() ?? Date.now(),
  };
}

function fromStored(item: StoredShoppingListItem): ShoppingListItem {
  return {
    id: item.id,
    name: item.name,
    emoji: item.emoji || '🛒',
    recipeId: item.recipeId ?? null,
    recipeName: item.recipeName || 'Manual',
    checked: Boolean(item.checked),
    addedAt: Timestamp.fromMillis(item.addedAtMs || Date.now()),
  };
}

function sortShoppingItems(items: ShoppingListItem[]) {
  return [...items].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    return (a.addedAt?.toMillis() ?? 0) - (b.addedAt?.toMillis() ?? 0);
  });
}

async function readItems(uid: string): Promise<ShoppingListItem[]> {
  const raw = await AsyncStorage.getItem(storageKey(uid));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredShoppingListItem[];
    return sortShoppingItems(Array.isArray(parsed) ? parsed.map(fromStored) : []);
  } catch {
    return [];
  }
}

async function writeItems(uid: string, items: ShoppingListItem[]) {
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify(items.map(toStored)));
  listeners.get(uid)?.forEach(listener => listener(sortShoppingItems(items)));
}

export async function addItemsToShoppingList(uid: string, items: ShoppingListInput[]): Promise<{ added: number; skipped: number }> {
  if (items.length === 0) return { added: 0, skipped: 0 };

  const existingItems = await readItems(uid);
  const existingNames = new Set(existingItems.map(item => normalizeName(item.name)));
  const nextItems = [...existingItems];
  let added = 0;
  let skipped = 0;

  for (const item of items) {
    const normalized = normalizeName(item.name);
    if (!normalized || existingNames.has(normalized)) {
      skipped += 1;
      continue;
    }

    existingNames.add(normalized);
    added += 1;
    nextItems.push({
      id: nowId(),
      name: item.name.trim(),
      emoji: item.emoji || '🛒',
      recipeId: item.recipeId ?? null,
      recipeName: item.recipeName || 'Manual',
      checked: false,
      addedAt: Timestamp.now(),
    });
  }

  if (added > 0) await writeItems(uid, nextItems);
  return { added, skipped };
}

export async function getShoppingList(uid: string): Promise<ShoppingListItem[]> {
  return readItems(uid);
}

export function subscribeShoppingList(uid: string, onItems: Listener, onError?: (error: Error) => void) {
  const bucket = listeners.get(uid) ?? new Set<Listener>();
  bucket.add(onItems);
  listeners.set(uid, bucket);

  readItems(uid).then(onItems).catch(error => {
    onError?.(error instanceof Error ? error : new Error(String(error)));
  });

  return () => {
    const current = listeners.get(uid);
    current?.delete(onItems);
    if (current?.size === 0) listeners.delete(uid);
  };
}

export async function toggleShoppingItem(uid: string, itemId: string, checked: boolean): Promise<void> {
  const items = await readItems(uid);
  await writeItems(uid, items.map(item => item.id === itemId ? { ...item, checked } : item));
}

export async function deleteShoppingItem(uid: string, itemId: string): Promise<void> {
  const items = await readItems(uid);
  await writeItems(uid, items.filter(item => item.id !== itemId));
}

export async function clearCheckedItems(uid: string): Promise<void> {
  const items = await readItems(uid);
  await writeItems(uid, items.filter(item => !item.checked));
}
