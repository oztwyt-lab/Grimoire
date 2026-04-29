import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserInventory, saveUserInventory, InventoryItem } from '../../lib/firestore';

type InventoryContextType = {
  inventory: InventoryItem[];
  addItem: (item: InventoryItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, quantity: number, metric: string) => Promise<void>;
  bulkSetItems: (items: InventoryItem[]) => Promise<void>;
};

const InventoryContext = createContext<InventoryContextType>({
  inventory: [],
  addItem: async () => {},
  removeItem: async () => {},
  updateItem: async () => {},
  bulkSetItems: async () => {},
});

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const ref = useRef<InventoryItem[]>([]);

  useEffect(() => {
    if (!user) { setInventory([]); ref.current = []; return; }
    getUserInventory(user.uid).then(items => {
      ref.current = items;
      setInventory(items);
    }).catch(console.error);
  }, [user]);

  const persist = useCallback((next: InventoryItem[]) => {
    ref.current = next;
    setInventory(next);
    if (user) saveUserInventory(user.uid, next).catch(console.error);
  }, [user]);

  const addItem = useCallback(async (item: InventoryItem) => {
    const current = ref.current;
    const next = current.find(i => i.id === item.id)
      ? current.map(i => i.id === item.id ? item : i)
      : [...current, item];
    persist(next);
  }, [persist]);

  const removeItem = useCallback(async (id: string) => {
    persist(ref.current.filter(i => i.id !== id));
  }, [persist]);

  const updateItem = useCallback(async (id: string, quantity: number, metric: string) => {
    persist(ref.current.map(i => i.id === id ? { ...i, quantity, metric } : i));
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

  return (
    <InventoryContext.Provider value={{ inventory, addItem, removeItem, updateItem, bulkSetItems }}>
      {children}
    </InventoryContext.Provider>
  );
}

export const useInventory = () => useContext(InventoryContext);
