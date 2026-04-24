import { db } from '../firebase';
import { doc, getDoc, setDoc } from '@firebase/firestore';

// ─── Food inventory ───────────────────────────────────────────────────────────
export type InventoryItem = {
  id: string;
  quantity: number;
  metric: string;
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

// ─── Character equipment ──────────────────────────────────────────────────────
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
