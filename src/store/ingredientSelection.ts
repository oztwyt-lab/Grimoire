type IngredientResult = {
  id: string;
  name: string;
  emoji: string;
  quantity: string;
};

type Callback = (ingredient: IngredientResult) => void;

let callback: Callback | null = null;

export function registerIngredientCallback(cb: Callback) {
  callback = cb;
}

export function resolveIngredient(ingredient: IngredientResult) {
  if (callback) {
    callback(ingredient);
    callback = null;
  }
}