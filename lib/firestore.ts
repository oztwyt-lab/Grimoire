import { db } from '../firebase';
import { doc, getDoc, setDoc } from '@firebase/firestore';

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
