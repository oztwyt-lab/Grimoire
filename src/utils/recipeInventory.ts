import { InventoryItem } from '../../lib/firestore';

type RecipeIngredientLike = {
  id: string;
  quantity?: string;
};

export function parseRecipeQuantity(quantity: string | undefined): number {
  if (!quantity) return 1;
  const frac = quantity.match(/^(\d+)\/(\d+)/);
  if (frac) return parseInt(frac[1], 10) / parseInt(frac[2], 10);
  const num = quantity.match(/[\d.]+/);
  return num ? parseFloat(num[0]) : 1;
}

export function hasRecipeIngredients(
  ingredients: RecipeIngredientLike[] | undefined,
  inventory: InventoryItem[]
): boolean {
  if (!ingredients?.length) return false;

  return ingredients.every(ingredient => {
    const required = parseRecipeQuantity(ingredient.quantity);
    const available = inventory
      .filter(item => item.id === ingredient.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    return available >= required;
  });
}
