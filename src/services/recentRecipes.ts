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
