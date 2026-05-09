import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from '@firebase/firestore';
import { db } from '../../firebase';
import { InventoryItem } from '../../lib/firestore';
import curatedRecipesSeed from '../data/curatedRecipesSeed.json';
import { RecipeLanguageTag, normalizeRecipeLanguage } from '../data/recipeLanguage';

export type MagicOrbIngredient = {
  id: string;
  name: string;
  emoji: string;
  quantity: string;
};

export type CuratedRecipe = {
  id: string;
  name: string;
  icon: string;
  category: 'meat' | 'vegetarian' | 'quick' | 'general';
  estimatedMinutes: number;
  recipeLanguage?: RecipeLanguageTag;
  ingredients: MagicOrbIngredient[];
  steps: string;
  source: 'grimor';
  curatedRecipeId?: string;
};

export type AnyMagicRecipe = CuratedRecipe & {
  userId?: string;
  isUserRecipe?: boolean;
};

export type MatchedRecipe = AnyMagicRecipe & {
  matchScore: number;
  matchedCount: number;
  totalIngredients: number;
  missingIngredients: { id: string; name: string; emoji: string }[];
};

let curatedCache: CuratedRecipe[] | null = null;
const LOCAL_CURATED_RECIPES = (curatedRecipesSeed as Record<string, unknown>[]).map(recipe =>
  asCuratedRecipe(String(recipe.id ?? recipe.name), recipe)
);

function normalize(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeSteps(raw: unknown): string {
  if (Array.isArray(raw)) {
    return raw
      .map((step, index) => `${index + 1}. ${typeof step === 'string' ? step : step?.text ?? ''}`)
      .join('\n');
  }
  return typeof raw === 'string' ? raw : '';
}

function normalizeIngredients(raw: unknown): MagicOrbIngredient[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((ingredient, index) => {
    const item = ingredient as Partial<MagicOrbIngredient>;
    const name = String(item.name ?? item.id ?? `Ingredient ${index + 1}`);
    return {
      id: String(item.id ?? name),
      name,
      emoji: String(item.emoji ?? '🍽️'),
      quantity: String(item.quantity ?? ''),
    };
  });
}

function asCuratedRecipe(id: string, data: Record<string, unknown>): CuratedRecipe {
  return {
    id,
    name: String(data.name ?? 'Untitled Recipe'),
    icon: String(data.icon ?? '🍲'),
    category: ['meat', 'vegetarian', 'quick', 'general'].includes(String(data.category))
      ? data.category as CuratedRecipe['category']
      : 'general',
    estimatedMinutes: typeof data.estimatedMinutes === 'number' ? data.estimatedMinutes : 30,
    recipeLanguage: normalizeRecipeLanguage(data.recipeLanguage ?? data.language),
    ingredients: normalizeIngredients(data.ingredients),
    steps: normalizeSteps(data.steps ?? data.preparation),
    source: 'grimor',
    curatedRecipeId: typeof data.curatedRecipeId === 'string' ? data.curatedRecipeId : undefined,
  };
}

export async function fetchCuratedRecipes(): Promise<CuratedRecipe[]> {
  if (curatedCache) return curatedCache;
  try {
    const snap = await getDocs(query(collection(db, 'curated_recipes'), orderBy('createdAt', 'desc')));
    curatedCache = snap.empty
      ? LOCAL_CURATED_RECIPES
      : snap.docs.map(docSnap => asCuratedRecipe(docSnap.id, docSnap.data()));
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code !== 'permission-denied') {
      console.warn('Unable to fetch curated recipes from Firestore; using local seed.', error);
    }
    curatedCache = LOCAL_CURATED_RECIPES;
  }
  return curatedCache;
}

export async function fetchUserMagicRecipes(uid: string): Promise<AnyMagicRecipe[]> {
  try {
    const snap = await getDocs(query(collection(db, 'recipes'), where('userId', '==', uid), orderBy('createdAt', 'desc')));
    return snap.docs.map(docSnap => ({
      ...asCuratedRecipe(docSnap.id, docSnap.data()),
      source: docSnap.data().source === 'grimor' ? 'grimor' : 'grimor',
      userId: uid,
      isUserRecipe: true,
    }));
  } catch {
    return [];
  }
}

export function matchRecipesAgainstInventory(recipes: AnyMagicRecipe[], inventory: InventoryItem[]): MatchedRecipe[] {
  const inventoryTerms = new Set(
    inventory.flatMap(item => [normalize(item.id), normalize((item as InventoryItem & { name?: string }).name)])
      .filter(Boolean)
  );

  return recipes
    .map(recipe => {
      const missingIngredients = recipe.ingredients
        .filter(ingredient => !inventoryTerms.has(normalize(ingredient.id)) && !inventoryTerms.has(normalize(ingredient.name)))
        .map(ingredient => ({ id: ingredient.id, name: ingredient.name, emoji: ingredient.emoji }));
      const totalIngredients = recipe.ingredients.length;
      const matchedCount = Math.max(0, totalIngredients - missingIngredients.length);
      const matchScore = totalIngredients > 0 ? matchedCount / totalIngredients : 0;
      return {
        ...recipe,
        matchScore,
        matchedCount,
        totalIngredients,
        missingIngredients,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name));
}

export async function importCuratedRecipe(uid: string, recipe: CuratedRecipe): Promise<string> {
  const docRef = await addDoc(collection(db, 'recipes'), {
    userId: uid,
    name: recipe.name,
    icon: recipe.icon,
    category: recipe.category,
    estimatedMinutes: recipe.estimatedMinutes,
    ...(recipe.recipeLanguage ? { recipeLanguage: recipe.recipeLanguage } : {}),
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    preparation: recipe.steps,
    source: 'grimor',
    curatedRecipeId: recipe.curatedRecipeId ?? recipe.id,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
