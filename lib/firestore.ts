import { db } from '../firebase';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, Timestamp } from '@firebase/firestore';

// ─── Food inventory ───────────────────────────────────────────────────────────
export type InventoryItem = {
  id: string;
  quantity: number;
  metric: string;
};

export type RecipeRecord = {
  id?: string;
  userId?: string;
  name: string;
  icon?: string;
  steps?: unknown;
  preparation?: string;
  ingredients?: unknown[];
};

export async function getUserInventory(uid: string): Promise<InventoryItem[]> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data.inventory) ? (data.inventory as InventoryItem[]) : [];
  } catch {
    return [];
  }
}

export async function saveUserInventory(uid: string, inventory: InventoryItem[]): Promise<void> {
  await setDoc(doc(db, 'users', uid), { inventory }, { merge: true });
}

export async function submitFeedback(uid: string, message: string): Promise<void> {
  await addDoc(collection(db, 'feedback'), {
    uid,
    message,
    timestamp: serverTimestamp(),
    appVersion: '1.0.0',
    platform: 'android',
  });
}

// ─── Character equipment ──────────────────────────────────────────────────────
export type SubscriptionTier = 'free' | 'monthly' | 'supporter';

export type SubscriptionFields = {
  subscriptionTier: SubscriptionTier;
  orbImportsThisMonth: number;
  orbImportsResetDate: Timestamp;
  orbDailyCount: number;
  orbDailyResetDate: Timestamp;
};

export const MAX_RECIPES_FREE = 5;
export const MAX_INVENTORY_FREE = 12;
export const MAX_ORB_MONTHLY_FREE = 3;
export const MAX_ORB_DAILY_FREE = 3;

function firstDayOfNextMonth(from = new Date()) {
  return new Date(from.getFullYear(), from.getMonth() + 1, 1, 0, 0, 0, 0);
}

function tomorrowMidnight(from = new Date()) {
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1, 0, 0, 0, 0);
}

export function createDefaultSubscriptionFields(now = new Date()): SubscriptionFields {
  return {
    subscriptionTier: 'free',
    orbImportsThisMonth: 0,
    orbImportsResetDate: Timestamp.fromDate(firstDayOfNextMonth(now)),
    orbDailyCount: 0,
    orbDailyResetDate: Timestamp.fromDate(tomorrowMidnight(now)),
  };
}

export async function backfillSubscriptionFields(uid: string, data: Record<string, unknown>): Promise<void> {
  const defaults = createDefaultSubscriptionFields();
  const missing: Partial<SubscriptionFields> = {};

  if (!data.subscriptionTier) missing.subscriptionTier = defaults.subscriptionTier;
  if (typeof data.orbImportsThisMonth !== 'number') missing.orbImportsThisMonth = defaults.orbImportsThisMonth;
  if (!data.orbImportsResetDate) missing.orbImportsResetDate = defaults.orbImportsResetDate;
  if (typeof data.orbDailyCount !== 'number') missing.orbDailyCount = defaults.orbDailyCount;
  if (!data.orbDailyResetDate) missing.orbDailyResetDate = defaults.orbDailyResetDate;

  if (Object.keys(missing).length > 0) {
    await setDoc(doc(db, 'users', uid), missing, { merge: true });
  }
}

export type EquipmentSlot = 'hat' | 'outfit' | 'cloak' | 'staff' | 'accessory1' | 'accessory2';

export type Equipment = {
  hat: string | null;
  outfit: string | null;
  cloak: string | null;
  staff: string | null;
  accessory1: string | null;
  accessory2: string | null;
};

export type EquipmentItem = {
  id: string;
  name: string;
  nameEn: string;
  slot: EquipmentSlot;
  icon: string;
  description: string;
  descriptionEn: string;
  isStarter: boolean;
};

export const STARTER_ITEMS: EquipmentItem[] = [
  {
    id: 'starter_robe',
    name: 'Başlangıç Cüppesi',
    nameEn: 'Starter Robe',
    slot: 'outfit',
    icon: '🧥',
    description: 'Sıradan ama güvenilir bir cüppe.',
    descriptionEn: 'Plain but reliable.',
    isStarter: true,
  },
  {
    id: 'starter_staff',
    name: 'Başlangıç Asası',
    nameEn: 'Starter Staff',
    slot: 'staff',
    icon: '🪄',
    description: 'Her büyücünün ilk asası.',
    descriptionEn: "Every wizard's first staff.",
    isStarter: true,
  },
];

export const DEFAULT_EQUIPMENT: Equipment = {
  hat: null,
  outfit: 'starter_robe',
  cloak: null,
  staff: 'starter_staff',
  accessory1: null,
  accessory2: null,
};

export async function getUserEquipment(uid: string): Promise<Equipment> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return { ...DEFAULT_EQUIPMENT };
    const data = snap.data();
    return data.equipment ? (data.equipment as Equipment) : { ...DEFAULT_EQUIPMENT };
  } catch {
    return { ...DEFAULT_EQUIPMENT };
  }
}

export async function saveUserEquipment(uid: string, equipment: Equipment): Promise<void> {
  await setDoc(doc(db, 'users', uid), { equipment }, { merge: true });
}

export async function getUserOwnedItems(uid: string): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return ['starter_robe', 'starter_staff'];
    const data = snap.data();
    return Array.isArray(data.ownedItems)
      ? (data.ownedItems as string[])
      : ['starter_robe', 'starter_staff'];
  } catch {
    return ['starter_robe', 'starter_staff'];
  }
}
