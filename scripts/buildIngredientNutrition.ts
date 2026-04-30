import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { INGREDIENTS } from '../src/data/ingredients';
import {
  INGREDIENT_NUTRITION_SEED,
  IngredientNutritionSeed,
} from '../src/data/ingredientNutritionSeed';
import type { IngredientNutrition, NutritionPer100g } from '../src/data/ingredientNutrition';

type JsonObject = Record<string, unknown>;

type SearchFood = {
  fdcId: number;
  description: string;
  dataType?: string;
};

type SearchResponse = {
  foods: SearchFood[];
};

type DetailNutrient = {
  amount?: number;
  nutrient?: {
    id?: number;
    number?: string;
    name?: string;
    unitName?: string;
  };
};

type DetailFood = {
  fdcId: number;
  description: string;
  foodNutrients?: DetailNutrient[];
};

const API_BASE = 'https://api.nal.usda.gov/fdc/v1';
const SOURCE = 'USDA FoodData Central';
const DATA_TYPE_ORDER = ['Foundation', 'SR Legacy', 'Survey (FNDDS)', 'Branded'];
const seedById = new Map<string, IngredientNutritionSeed>(
  INGREDIENT_NUTRITION_SEED.map(seed => [seed.id, seed])
);

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function parseSearchFood(value: unknown): SearchFood | null {
  if (!isObject(value)) return null;
  const fdcId = asNumber(value.fdcId);
  const description = asString(value.description);
  if (fdcId === undefined || description === undefined) return null;
  return {
    fdcId,
    description,
    dataType: asString(value.dataType),
  };
}

function parseSearchResponse(value: unknown): SearchResponse {
  if (!isObject(value) || !Array.isArray(value.foods)) return { foods: [] };
  return {
    foods: value.foods.map(parseSearchFood).filter(food => food !== null),
  };
}

function parseDetailNutrient(value: unknown): DetailNutrient | null {
  if (!isObject(value)) return null;
  const nutrient = isObject(value.nutrient) ? value.nutrient : undefined;
  return {
    amount: asNumber(value.amount),
    nutrient: nutrient
      ? {
          id: asNumber(nutrient.id),
          number: asString(nutrient.number),
          name: asString(nutrient.name),
          unitName: asString(nutrient.unitName),
        }
      : undefined,
  };
}

function parseDetailFood(value: unknown): DetailFood {
  if (!isObject(value)) {
    throw new Error('USDA detail response was not an object');
  }
  const fdcId = asNumber(value.fdcId);
  const description = asString(value.description);
  if (fdcId === undefined || description === undefined) {
    throw new Error('USDA detail response was missing fdcId or description');
  }

  return {
    fdcId,
    description,
    foodNutrients: Array.isArray(value.foodNutrients)
      ? value.foodNutrients.map(parseDetailNutrient).filter(nutrient => nutrient !== null)
      : [],
  };
}

async function fetchJson(url: URL): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`USDA request failed ${response.status}: ${body.slice(0, 180)}`);
  }
  return response.json() as Promise<unknown>;
}

async function postJson(url: URL, body: JsonObject): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`USDA request failed ${response.status}: ${responseBody.slice(0, 180)}`);
  }
  return response.json() as Promise<unknown>;
}

async function searchFood(query: string, apiKey: string): Promise<SearchFood[]> {
  const url = new URL(`${API_BASE}/foods/search`);
  url.searchParams.set('api_key', apiKey);

  const parsed = parseSearchResponse(await postJson(url, {
    query,
    pageSize: 10,
    dataType: DATA_TYPE_ORDER,
  }));
  return parsed.foods;
}

async function fetchFoodDetail(fdcId: number, apiKey: string): Promise<DetailFood> {
  const url = new URL(`${API_BASE}/food/${fdcId}`);
  url.searchParams.set('api_key', apiKey);
  return parseDetailFood(await fetchJson(url));
}

function scoreFood(food: SearchFood): number {
  const dataTypeRank = DATA_TYPE_ORDER.indexOf(food.dataType ?? 'Branded');
  const brandedPenalty = food.dataType === 'Branded' ? 100 : 0;
  const cookedPenalty = /cooked|prepared|restaurant|brand|upc/i.test(food.description) ? 15 : 0;
  const rawBonus = /raw|fresh|uncooked/i.test(food.description) ? -10 : 0;
  return (dataTypeRank === -1 ? 10 : dataTypeRank) * 20 + brandedPenalty + cookedPenalty + rawBonus;
}

function pickBestFood(foods: SearchFood[]): SearchFood | null {
  return [...foods].sort((a, b) => scoreFood(a) - scoreFood(b))[0] ?? null;
}

function nutrientAmount(food: DetailFood, nutrientNumber: string, fallbackName: RegExp, preferredUnit?: string): number {
  const nutrient = food.foodNutrients?.find(item => {
    const number = item.nutrient?.number;
    const id = item.nutrient?.id;
    const name = item.nutrient?.name ?? '';
    const unit = item.nutrient?.unitName ?? '';
    const matchesNutrient = number === nutrientNumber || String(id) === nutrientNumber || fallbackName.test(name);
    const matchesUnit = preferredUnit ? unit.toLowerCase() === preferredUnit.toLowerCase() : true;
    return matchesNutrient && matchesUnit;
  });
  return nutrient?.amount ?? 0;
}

function extractNutritionPer100g(food: DetailFood): NutritionPer100g {
  return {
    calories: nutrientAmount(food, '208', /^energy$/i, 'kcal') || nutrientAmount(food, '1008', /^energy$/i, 'kcal'),
    protein: nutrientAmount(food, '203', /protein/i),
    fat: nutrientAmount(food, '204', /total lipid|total fat|fat/i),
    carbs: nutrientAmount(food, '205', /carbohydrate/i),
  };
}

function roundNutrition(nutrition: NutritionPer100g): NutritionPer100g {
  return {
    calories: Math.round(nutrition.calories),
    protein: Math.round(nutrition.protein * 10) / 10,
    fat: Math.round(nutrition.fat * 10) / 10,
    carbs: Math.round(nutrition.carbs * 10) / 10,
  };
}

function isUsdaRateLimitError(message: string): boolean {
  return message.includes('429') || message.includes('OVER_RATE_LIMIT');
}

function validateSeedCoverage(): void {
  const ingredientIds = new Set(INGREDIENTS.map(ingredient => ingredient.id));
  const seenSeedIds = new Set<string>();
  const duplicateSeedIds = new Set<string>();

  for (const seed of INGREDIENT_NUTRITION_SEED) {
    if (seenSeedIds.has(seed.id)) {
      duplicateSeedIds.add(seed.id);
    }
    seenSeedIds.add(seed.id);
  }

  const missingSeeds = INGREDIENTS
    .filter(ingredient => !seedById.has(ingredient.id))
    .map(ingredient => ingredient.id);
  const unknownSeeds = INGREDIENT_NUTRITION_SEED
    .filter(seed => !ingredientIds.has(seed.id))
    .map(seed => seed.id);

  if (missingSeeds.length === 0 && unknownSeeds.length === 0 && duplicateSeedIds.size === 0) {
    return;
  }

  if (missingSeeds.length > 0) {
    console.error('Missing nutrition seed entries:');
    missingSeeds.forEach(id => console.error(`- ${id}`));
  }
  if (unknownSeeds.length > 0) {
    console.error('Nutrition seed entries with no matching ingredient id:');
    unknownSeeds.forEach(id => console.error(`- ${id}`));
  }
  if (duplicateSeedIds.size > 0) {
    console.error('Duplicate nutrition seed entries:');
    [...duplicateSeedIds].forEach(id => console.error(`- ${id}`));
  }

  throw new Error('Ingredient nutrition seed coverage is out of sync with src/data/ingredients.ts.');
}

function serializeRecord(record: Record<string, IngredientNutrition>): string {
  const lines = [
    'export type NutritionPer100g = {',
    '  calories: number;',
    '  protein: number;',
    '  fat: number;',
    '  carbs: number;',
    '};',
    '',
    'export type IngredientNutrition = {',
    '  id: string;',
    "  source: 'USDA FoodData Central';",
    '  sourceFood: string;',
    '  sourceFdcId: number;',
    '  sourceUrl: string;',
    '  nutritionPer100g: NutritionPer100g;',
    '  units: Record<string, number>;',
    '};',
    '',
    `export const INGREDIENT_NUTRITION: Record<string, IngredientNutrition> = ${JSON.stringify(record, null, 2)};`,
    '',
  ];
  return lines.join('\n');
}

async function buildIngredient(seed: IngredientNutritionSeed, apiKey: string): Promise<IngredientNutrition> {
  if (seed.manualNutritionOverride) {
    return {
      id: seed.id,
      source: SOURCE,
      sourceFood: `${seed.query} (manual override)`,
      sourceFdcId: seed.preferredFdcId ?? 0,
      sourceUrl: seed.preferredFdcId ? `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${seed.preferredFdcId}/nutrients` : '',
      nutritionPer100g: roundNutrition(seed.manualNutritionOverride),
      units: seed.units ?? { g: 1, kg: 1000 },
    };
  }

  const selectedFood = seed.preferredFdcId
    ? { fdcId: seed.preferredFdcId, description: seed.query }
    : pickBestFood(await searchFood(seed.query, apiKey));

  if (!selectedFood) {
    throw new Error(`No USDA match for ${seed.id} (${seed.query})`);
  }

  const detail = await fetchFoodDetail(selectedFood.fdcId, apiKey);
  return {
    id: seed.id,
    source: SOURCE,
    sourceFood: detail.description,
    sourceFdcId: detail.fdcId,
    sourceUrl: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${detail.fdcId}/nutrients`,
    nutritionPer100g: roundNutrition(extractNutritionPer100g(detail)),
    units: seed.units ?? { g: 1, kg: 1000 },
  };
}

async function main(): Promise<void> {
  validateSeedCoverage();

  const apiKey = process.env.FDC_API_KEY ?? 'DEMO_KEY';
  const records: Record<string, IngredientNutrition> = {};
  const missing: string[] = [];
  const questionable: string[] = [];

  for (const ingredient of INGREDIENTS) {
    const seed = seedById.get(ingredient.id) ?? {
      id: ingredient.id,
      query: `${ingredient.name.toLowerCase()} raw`,
      units: { g: 1, kg: 1000 },
    };

    try {
      const nutrition = await buildIngredient(seed, apiKey);
      records[ingredient.id] = nutrition;
      if (/branded|restaurant|prepared/i.test(nutrition.sourceFood)) {
        questionable.push(`${ingredient.id}: ${nutrition.sourceFood} (${nutrition.sourceFdcId})`);
      }
      console.log(`matched ${ingredient.id}: ${nutrition.sourceFood} (${nutrition.sourceFdcId})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      if (isUsdaRateLimitError(message)) {
        throw new Error(
          'USDA FoodData Central rate limit reached. Set FDC_API_KEY to a real key or try again later.'
        );
      }
      missing.push(`${ingredient.id}: ${message}`);
      console.warn(`missing ${ingredient.id}: ${message}`);
    }
  }

  const missingPercent = missing.length / INGREDIENTS.length;
  console.log(`\nMatched ${Object.keys(records).length}/${INGREDIENTS.length} ingredients.`);
  console.log(`Missing ${missing.length}:`);
  missing.forEach(item => console.log(`- ${item}`));
  console.log(`Questionable mappings ${questionable.length}:`);
  questionable.forEach(item => console.log(`- ${item}`));

  if (missingPercent > 0.1) {
    throw new Error(`Nutrition build failed: ${(missingPercent * 100).toFixed(1)}% missing exceeds 10% threshold.`);
  }

  const outputPath = path.resolve(process.cwd(), 'src/data/ingredientNutrition.ts');
  await writeFile(outputPath, serializeRecord(records), 'utf8');
}

main().catch(error => {
  const message = error instanceof Error ? error.message : 'unknown error';
  console.error(message);
  process.exitCode = 1;
});
