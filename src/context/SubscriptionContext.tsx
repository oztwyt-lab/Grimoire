import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, query, setDoc, where, Timestamp } from '@firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from './AuthContext';
import { useInventory } from './InventoryContext';
import {
  MAX_INVENTORY_FREE,
  MAX_ORB_DAILY_FREE,
  MAX_ORB_MONTHLY_FREE,
  MAX_RECIPES_FREE,
  SubscriptionTier,
  backfillSubscriptionFields,
  createDefaultSubscriptionFields,
} from '../../lib/firestore';
import { isAdminEmail } from '../config/admin';

type SubscriptionContextValue = {
  tier: SubscriptionTier;
  recipeCount: number;
  inventoryCount: number;
  canAddRecipe: () => boolean;
  canAddInventoryItem: () => boolean;
  canUseOrb: () => boolean;
};

const SubscriptionContext = createContext<SubscriptionContextValue>({
  tier: 'free',
  recipeCount: 0,
  inventoryCount: 0,
  canAddRecipe: () => true,
  canAddInventoryItem: () => true,
  canUseOrb: () => true,
});

function isTier(value: unknown): value is SubscriptionTier {
  return value === 'free' || value === 'monthly' || value === 'supporter';
}

function isExpired(value: unknown, now: Date) {
  return value instanceof Timestamp && value.toDate().getTime() <= now.getTime();
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { inventory } = useInventory();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [recipeCount, setRecipeCount] = useState(0);
  const [orbImportsThisMonth, setOrbImportsThisMonth] = useState(0);
  const [orbImportsResetDate, setOrbImportsResetDate] = useState<Timestamp | null>(null);
  const [orbDailyCount, setOrbDailyCount] = useState(0);
  const [orbDailyResetDate, setOrbDailyResetDate] = useState<Timestamp | null>(null);

  useEffect(() => {
    if (!user) {
      setTier('free');
      setRecipeCount(0);
      setOrbImportsThisMonth(0);
      setOrbImportsResetDate(null);
      setOrbDailyCount(0);
      setOrbDailyResetDate(null);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const isTestUnlimited = isAdminEmail(user.email);

    if (isTestUnlimited) {
      setDoc(userRef, { subscriptionTier: 'supporter' }, { merge: true }).catch(() => {});
    }

    const unsubUser = onSnapshot(userRef, (snap) => {
      const defaults = createDefaultSubscriptionFields();
      const data = snap.exists() ? snap.data() : {};

      setTier(isTestUnlimited ? 'supporter' : isTier(data.subscriptionTier) ? data.subscriptionTier : defaults.subscriptionTier);
      setOrbImportsThisMonth(typeof data.orbImportsThisMonth === 'number' ? data.orbImportsThisMonth : 0);
      setOrbImportsResetDate(data.orbImportsResetDate instanceof Timestamp ? data.orbImportsResetDate : defaults.orbImportsResetDate);
      setOrbDailyCount(typeof data.orbDailyCount === 'number' ? data.orbDailyCount : 0);
      setOrbDailyResetDate(data.orbDailyResetDate instanceof Timestamp ? data.orbDailyResetDate : defaults.orbDailyResetDate);

      backfillSubscriptionFields(user.uid, data).catch(() => {});
    }, () => {});

    const recipesQuery = query(collection(db, 'recipes'), where('userId', '==', user.uid));
    const unsubRecipes = onSnapshot(recipesQuery, (snap) => {
      setRecipeCount(snap.size);
    }, () => {});

    return () => {
      unsubUser();
      unsubRecipes();
    };
  }, [user]);

  const canAddRecipe = useCallback(() => {
    return tier !== 'free' || recipeCount < MAX_RECIPES_FREE;
  }, [tier, recipeCount]);

  const canAddInventoryItem = useCallback(() => {
    return tier !== 'free' || inventory.length < MAX_INVENTORY_FREE;
  }, [tier, inventory.length]);

  const canUseOrb = useCallback(() => {
    if (tier !== 'free') return true;
    const now = new Date();
    const monthlyCount = isExpired(orbImportsResetDate, now) ? 0 : orbImportsThisMonth;
    const dailyCount = isExpired(orbDailyResetDate, now) ? 0 : orbDailyCount;
    return monthlyCount < MAX_ORB_MONTHLY_FREE && dailyCount < MAX_ORB_DAILY_FREE;
  }, [tier, orbImportsThisMonth, orbImportsResetDate, orbDailyCount, orbDailyResetDate]);

  const value = useMemo(() => ({
    tier,
    recipeCount,
    inventoryCount: inventory.length,
    canAddRecipe,
    canAddInventoryItem,
    canUseOrb,
  }), [tier, recipeCount, inventory.length, canAddRecipe, canAddInventoryItem, canUseOrb]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
