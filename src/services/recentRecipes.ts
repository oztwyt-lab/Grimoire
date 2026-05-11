import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_RECENT_RECIPES = 5;

function getRecentRecipesKey(userId: string) {
  return `@grimor_recent_recipes:${userId}`;
}

export async function getRecentRecipeIds(userId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(getRecentRecipesKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch (error) {
    console.warn('Unable to read recent recipes', error);
    return [];
  }
}

export async function markRecipeRecent(userId: string, recipeId: string): Promise<void> {
  try {
    const current = await getRecentRecipeIds(userId);
    const next = [recipeId, ...current.filter(id => id !== recipeId)].slice(0, MAX_RECENT_RECIPES);
    await AsyncStorage.setItem(getRecentRecipesKey(userId), JSON.stringify(next));
  } catch (error) {
    console.warn('Unable to update recent recipes', error);
  }
}

export async function clearRecentRecipes(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(getRecentRecipesKey(userId));
  } catch (error) {
    console.warn('Unable to clear recent recipes', error);
  }
}

// ─── Cook session times ───────────────────────────────────────────────────────

function getCookTimesKey(userId: string) {
  return `@grimor_cook_times:${userId}`;
}

export async function getCookTimes(userId: string): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(getCookTimesKey(userId));
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export async function setCookTime(userId: string, recipeId: string, seconds: number): Promise<void> {
  try {
    const times = await getCookTimes(userId);
    times[recipeId] = seconds;
    await AsyncStorage.setItem(getCookTimesKey(userId), JSON.stringify(times));
  } catch (error) {
    console.warn('Unable to save cook time', error);
  }
}
