import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateNutrition } from '../utils/nutrition';
import { useAuth } from './AuthContext';

function storageKey(uid: string): string {
  return `grimor_nutrition_log_${uid}`;
}

export type FoodLogEntry = {
  id: string;
  ingredientId: string;
  name: string;
  emoji: string;
  quantity: string;
  grams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  loggedAt: number;
};

export type MacroTotals = { calories: number; protein: number; fat: number; carbs: number };

type LogStore = Record<string, FoodLogEntry[]>;

type NutritionLogContextValue = {
  logFood: (ingredientId: string, name: string, emoji: string, quantity: string) => Promise<void>;
  logRecipe: (name: string, emoji: string, totals: MacroTotals) => Promise<void>;
  removeEntry: (dateKey: string, entryId: string) => Promise<void>;
  getEntriesForDate: (dateKey: string) => FoodLogEntry[];
  getTodayEntries: () => FoodLogEntry[];
  getTodayTotals: () => MacroTotals;
  getWeekData: () => { dateKey: string; label: string; totals: MacroTotals; isToday: boolean }[];
};

const NutritionLogContext = createContext<NutritionLogContextValue | undefined>(undefined);

const UNIT_OPTIONS = ['g', 'kg', 'ml', 'L', 'tsp', 'tbsp', 'cup', 'pcs', 'pinch', 'adet', 'piece'];
const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const ZERO_TOTALS: MacroTotals = { calories: 0, protein: 0, fat: 0, carbs: 0 };

export function getDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseQuantityString(qs: string): { amount: string; unit: string } {
  const parts = qs.trim().split(' ');
  if (parts.length >= 2) {
    const possibleUnit = parts[parts.length - 1];
    if (UNIT_OPTIONS.includes(possibleUnit)) {
      return { amount: parts.slice(0, -1).join(' '), unit: possibleUnit };
    }
  }
  return { amount: qs.trim(), unit: 'g' };
}

function sumTotals(entries: FoodLogEntry[]): MacroTotals {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      fat: acc.fat + e.fat,
      carbs: acc.carbs + e.carbs,
    }),
    { ...ZERO_TOTALS }
  );
}

export function NutritionLogProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [store, setStore] = useState<LogStore>({});
  const storeRef = useRef<LogStore>({});

  useEffect(() => {
    if (!user) {
      storeRef.current = {};
      setStore({});
      return;
    }
    AsyncStorage.getItem(storageKey(user.uid)).then(raw => {
      if (!raw) {
        storeRef.current = {};
        setStore({});
        return;
      }
      try {
        const parsed: LogStore = JSON.parse(raw);
        storeRef.current = parsed;
        setStore(parsed);
      } catch { /* ignore corrupt data */ }
    });
  }, [user?.uid]);

  const save = useCallback(async (next: LogStore) => {
    if (!user) return;
    storeRef.current = next;
    setStore(next);
    await AsyncStorage.setItem(storageKey(user.uid), JSON.stringify(next));
  }, [user?.uid]);

  const logFood = useCallback(async (
    ingredientId: string,
    name: string,
    emoji: string,
    quantity: string
  ) => {
    const { amount, unit } = parseQuantityString(quantity);
    const calc = calculateNutrition(ingredientId, amount, unit);
    const entry: FoodLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ingredientId,
      name,
      emoji,
      quantity,
      grams: calc.grams,
      calories: Math.round(calc.calories),
      protein: Math.round(calc.protein * 10) / 10,
      fat: Math.round(calc.fat * 10) / 10,
      carbs: Math.round(calc.carbs * 10) / 10,
      loggedAt: Date.now(),
    };
    const dateKey = getDateKey();
    const current = storeRef.current;
    await save({ ...current, [dateKey]: [...(current[dateKey] ?? []), entry] });
  }, [save]);

  const logRecipe = useCallback(async (name: string, emoji: string, totals: MacroTotals) => {
    const entry: FoodLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ingredientId: 'recipe',
      name,
      emoji,
      quantity: '1 serving',
      grams: 0,
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      loggedAt: Date.now(),
    };
    const dateKey = getDateKey();
    const current = storeRef.current;
    await save({ ...current, [dateKey]: [...(current[dateKey] ?? []), entry] });
  }, [save]);

  const removeEntry = useCallback(async (dateKey: string, entryId: string) => {
    const current = storeRef.current;
    await save({
      ...current,
      [dateKey]: (current[dateKey] ?? []).filter(e => e.id !== entryId),
    });
  }, [save]);

  const value = useMemo<NutritionLogContextValue>(() => ({
    logFood,
    logRecipe,
    removeEntry,
    getEntriesForDate: (dateKey) => store[dateKey] ?? [],
    getTodayEntries: () => store[getDateKey()] ?? [],
    getTodayTotals: () => sumTotals(store[getDateKey()] ?? []),
    getWeekData: () => {
      const today = new Date();
      const todayKey = getDateKey(today);
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateKey = getDateKey(d);
        return {
          dateKey,
          label: DAY_LABELS[i],
          totals: sumTotals(store[dateKey] ?? []),
          isToday: dateKey === todayKey,
        };
      });
    },
  }), [store, logFood, logRecipe, removeEntry]);

  return (
    <NutritionLogContext.Provider value={value}>
      {children}
    </NutritionLogContext.Provider>
  );
}

export function useNutritionLog() {
  const ctx = useContext(NutritionLogContext);
  if (!ctx) throw new Error('useNutritionLog must be used within NutritionLogProvider');
  return ctx;
}
