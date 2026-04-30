import { INGREDIENT_NUTRITION } from '../data/ingredientNutrition';

export type CalculatedNutrition = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  grams: number;
};

const FALLBACK_UNITS: Record<string, number> = {
  g: 1,
  kg: 1000,
};

function normalizeUnit(unit: string): string {
  const trimmed = unit.trim();
  if (trimmed === 'pcs') return 'piece';
  if (trimmed === 'lt') return 'l';
  return trimmed;
}

export function parseQuantity(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const mixed = trimmed.match(/^(\d+(?:\.\d+)?)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const numerator = Number(mixed[2]);
    const denominator = Number(mixed[3]);
    return denominator === 0 ? null : whole + numerator / denominator;
  }

  const fraction = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    return denominator === 0 ? null : numerator / denominator;
  }

  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

export function getAvailableUnits(ingredientId: string): string[] {
  const nutrition = INGREDIENT_NUTRITION[ingredientId];
  const unitSet = new Set<string>(['g', 'kg']);
  if (nutrition) {
    Object.keys(nutrition.units).forEach(unit => unitSet.add(unit));
  }
  return Array.from(unitSet);
}

export function getDefaultUnit(ingredientId: string): string {
  const units = getAvailableUnits(ingredientId);
  return units.includes('piece') ? 'piece' : units[0] ?? 'g';
}

export function quantityToGrams(quantityInput: string, unit: string, ingredientId: string): number {
  const quantity = parseQuantity(quantityInput) ?? 1;
  const normalizedUnit = normalizeUnit(unit || 'g');
  const nutrition = INGREDIENT_NUTRITION[ingredientId];
  const gramsPerUnit = nutrition?.units[normalizedUnit] ?? FALLBACK_UNITS[normalizedUnit] ?? 1;
  return quantity * gramsPerUnit;
}

export function calculateNutrition(
  ingredientId: string,
  quantityInput: string,
  unit: string
): CalculatedNutrition {
  const nutrition = INGREDIENT_NUTRITION[ingredientId];
  const selectedUnit = unit || getDefaultUnit(ingredientId);
  const grams = nutrition ? quantityToGrams(quantityInput, selectedUnit, ingredientId) : 0;
  const per100g = nutrition?.nutritionPer100g ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };

  return {
    calories: per100g.calories * grams / 100,
    protein: per100g.protein * grams / 100,
    fat: per100g.fat * grams / 100,
    carbs: per100g.carbs * grams / 100,
    grams,
  };
}

export function formatNutritionValue(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (value >= 100) return Math.round(value).toString();
  if (value >= 10) return value.toFixed(1).replace(/\.0$/, '');
  return value.toFixed(1).replace(/\.0$/, '');
}
