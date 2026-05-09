import { StringKey } from '../i18n/strings';

export type RecipeLanguageTag = 'en' | 'tr' | 'other';

export const RECIPE_LANGUAGE_OPTIONS: RecipeLanguageTag[] = ['en', 'tr', 'other'];

const LABEL_KEYS: Record<RecipeLanguageTag, StringKey> = {
  en: 'recipe_language_en',
  tr: 'recipe_language_tr',
  other: 'recipe_language_other',
};

export function normalizeRecipeLanguage(value: unknown): RecipeLanguageTag | undefined {
  return value === 'en' || value === 'tr' || value === 'other' ? value : undefined;
}

export function recipeLanguageLabel(tag: RecipeLanguageTag, t: (key: StringKey) => string) {
  return t(LABEL_KEYS[tag]);
}
