import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserInventory, saveUserInventory, InventoryItem } from '../../lib/firestore';

type InventoryContextType = {
  inventory: InventoryItem[];
  inventoryLoaded: boolean;
  addItem: (item: InventoryItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, quantity: number, metric: string, expiresAt?: InventoryItem['expiresAt']) => Promise<void>;
  bulkSetItems: (items: InventoryItem[]) => Promise<void>;
  consumeItems: (items: InventoryItem[]) => Promise<void>;
};

const InventoryContext = createContext<InventoryContextType>({
  inventory: [],
  inventoryLoaded: false,
  addItem: async () => {},
  removeItem: async () => {},
  updateItem: async () => {},
  bulkSetItems: async () => {},
  consumeItems: async () => {},
});

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const ref = useRef<InventoryItem[]>([]);

  useEffect(() => {
    if (!user) { setInventory([]); ref.current = []; setInventoryLoaded(true); return; }
    setInventoryLoaded(false);
    getUserInventory(user.uid).then(items => {
      ref.current = items;
      setInventory(items);
    }).catch(console.error).finally(() => setInventoryLoaded(true));
  }, [user]);

  const persist = useCallback((next: InventoryItem[]) => {
    ref.current = next;
    setInventory(next);
    setInventoryLoaded(true);
    if (user) saveUserInventory(user.uid, next).catch(console.error);
  }, [user]);

  const addItem = useCallback(async (item: InventoryItem) => {
    const current = ref.current;
    const next = current.find(i => i.id === item.id)
      ? current.map(i => i.id === item.id ? { ...i, ...item } : i)
      : [...current, item];
    persist(next);
  }, [persist]);

  const removeItem = useCallback(async (id: string) => {
    persist(ref.current.filter(i => i.id !== id));
  }, [persist]);

  const updateItem = useCallback(async (id: string, quantity: number, metric: string, expiresAt?: InventoryItem['expiresAt']) => {
    persist(ref.current.map(i => {
      if (i.id !== id) return i;
      const next = { ...i, quantity, metric };
      if (expiresAt) {
        return { ...next, expiresAt };
      }
      const { expiresAt: _removed, ...withoutExpiry } = next;
      return withoutExpiry;
    }));
  }, [persist]);

  const bulkSetItems = useCallback(async (items: InventoryItem[]) => {
    const merged = [...ref.current];
    for (const newItem of items) {
      const idx = merged.findIndex(i => i.id === newItem.id);
      if (idx >= 0) {
        merged[idx] = newItem;
      } else {
        merged.push(newItem);
      }
    }
    persist(merged);
  }, [persist]);

  const consumeItems = useCallback(async (items: InventoryItem[]) => {
    let next = [...ref.current];
    for (const consumed of items) {
      next = next
        .map(item => (
          item.id === consumed.id
            ? { ...item, quantity: Math.max(0, item.quantity - consumed.quantity) }
            : item
        ))
        .filter(item => item.quantity > 0);
    }
    persist(next);
  }, [persist]);

  return (
    <InventoryContext.Provider value={{ inventory, inventoryLoaded, addItem, removeItem, updateItem, bulkSetItems, consumeItems }}>
      {children}
    </InventoryContext.Provider>
  );
}

export const useInventory = () => useContext(InventoryContext);
