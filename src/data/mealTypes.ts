export const MEAL_TYPES = [
  { value: 'breakfast', icon: '🌅', labelKey: 'mealTypeBreakfast' },
  { value: 'main',      icon: '🍽️', labelKey: 'mealTypeMain' },
  { value: 'light',     icon: '🥗', labelKey: 'mealTypeLight' },
  { value: 'dessert',   icon: '🍮', labelKey: 'mealTypeDessert' },
  { value: 'drink',     icon: '🥤', labelKey: 'mealTypeDrink' },
  { value: 'quick',     icon: '⚡', labelKey: 'mealTypeQuick' },
] as const;

export type MealType = typeof MEAL_TYPES[number]['value'];
