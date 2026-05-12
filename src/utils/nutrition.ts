import { INGREDIENT_NUTRITION } from '../data/ingredientNutrition';

export type CalculatedNutrition = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  grams: number;
};

const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  tsp: 5,
  tbsp: 15,
  cup: 240,
  pinch: 0.5,
  // pcs / adet / none → 'piece' via normalizeUnit; gram weight comes from nutrition.units.piece
};

function normalizeUnit(unit: string): string {
  const trimmed = unit.trim();
  if (trimmed === 'pcs' || trimmed === 'adet' || trimmed === 'none') return 'piece';
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
  const gramsPerUnit = nutrition?.units[normalizedUnit] ?? UNIT_TO_GRAMS[normalizedUnit] ?? 1;
  return quantity * gramsPerUnit;
}

const INGREDIENT_ID_ALIASES: Record<string, string> = {
  // Turkish aliases
  kuzu_kiyma: 'lamb',
  kuyrukyagi: 'lamb',
  sogan: 'onion',
  taze_sogan: 'onion',
  kirmizi_sogan: 'onion',
  karabiber: 'black_pepper',
  tuz: 'salt',
  tereyagi: 'butter',
  yumurta: 'egg',
  pirinc: 'rice',
  arborio_rice: 'rice',
  sarimsak: 'garlic',
  tavuk_but: 'chicken',
  tavuk_gogus: 'chicken',
  tavuk_suyu: 'chicken_stock',
  zeytinyagi: 'olive_oil',
  sivi_yag: 'olive_oil',
  un: 'flour',
  misir_unu: 'flour',
  sut: 'milk',
  seker: 'sugar',
  kirmizi_pul_biber: 'red_pepper',
  biber_salcasi: 'red_pepper',
  yesil_biber: 'bell_pepper',
  maydanoz: 'parsley',
  dereotu: 'dill',
  limon: 'lemon',
  kimyon: 'cumin',
  domates: 'tomato',
  domates_salcasi: 'tomato',
  patates: 'potato',
  patlican: 'eggplant',
  kabak: 'zucchini',
  havuc: 'carrot',
  bezelye: 'peas',
  kiyma: 'ground_beef',
  kuru_fasulye: 'bean',
  barbunya: 'bean',
  kirmizi_mercimek: 'lentil',
  red_lentil: 'lentil',
  beyaz_peynir: 'cheese',
  kasar_peyniri: 'cheese',
  feta_cheese: 'cheese',
  enginar: 'artichoke',
  ceviz: 'walnut',
  hamsi: 'sardine',
  salmon_fillet: 'salmon',
  chicken_breast: 'chicken',
  chicken_thigh: 'chicken',
  ground_lamb: 'lamb',
  red_onion: 'onion',
  ince_bulgur: 'bulgur',
  tarhana: 'flour',
  nisasta: 'flour',
  kabartma_tozu: 'baking_powder',
  vanilya: 'vanilla',
  nar_eksisi: 'lemon',
  oat: 'oats',
  su: 'water',
  tel_kadayif: 'flour',
  beef_stock: 'chicken_stock',
  vegetable_stock: 'chicken_stock',
  spaghetti: 'pasta',
  taco_shell: 'flour',
  curry_powder: 'cumin',
};

function resolveIngredientId(id: string): string {
  return INGREDIENT_ID_ALIASES[id] ?? id;
}

export function calculateNutrition(
  ingredientId: string,
  quantityInput: string,
  unit: string
): CalculatedNutrition {
  const resolvedId = resolveIngredientId(ingredientId);
  const nutrition = INGREDIENT_NUTRITION[resolvedId];
  const selectedUnit = unit || getDefaultUnit(resolvedId);
  const grams = nutrition ? quantityToGrams(quantityInput, selectedUnit, resolvedId) : 0;
  const per100g = nutrition?.nutritionPer100g ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };

  return {
    calories: per100g.calories * grams / 100,
    protein: per100g.protein * grams / 100,
    fat: per100g.fat * grams / 100,
    carbs: per100g.carbs * grams / 100,
    grams,
  };
}

const EMBEDDED_UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pcs', 'pinch', 'piece', 'adet'];

export function calculateRecipeNutrition(
  ingredients: { id: string; quantity: string; metric?: string }[]
): CalculatedNutrition {
  return ingredients.reduce(
    (acc, ing) => {
      let amount = ing.quantity;
      let unit = ing.metric ?? '';

      // Extract unit from combined quantity string like "2 cups"
      if (!unit) {
        const parts = ing.quantity.trim().split(' ');
        if (parts.length >= 2 && EMBEDDED_UNITS.includes(parts[parts.length - 1].toLowerCase())) {
          amount = parts.slice(0, -1).join(' ');
          unit = parts[parts.length - 1];
        }
      }

      if (!unit) unit = getDefaultUnit(ing.id);

      const n = calculateNutrition(ing.id, amount, unit);
      return {
        calories: acc.calories + n.calories,
        protein: acc.protein + n.protein,
        fat: acc.fat + n.fat,
        carbs: acc.carbs + n.carbs,
        grams: acc.grams + n.grams,
      };
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0, grams: 0 }
  );
}

export function formatNutritionValue(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (value >= 100) return Math.round(value).toString();
  if (value >= 10) return value.toFixed(1).replace(/\.0$/, '');
  return value.toFixed(1).replace(/\.0$/, '');
}
