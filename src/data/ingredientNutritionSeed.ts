import type { NutritionPer100g } from './ingredientNutrition';

/*
  Maintenance notes for future agents:
  - Every id in src/data/ingredients.ts must have exactly one entry in INGREDIENT_NUTRITION_SEED.
  - Do not invent ids here. Copy the id from INGREDIENTS exactly.
  - Prefer generic/raw USDA FoodData Central queries, not branded foods.
  - Keep g: 1 and kg: 1000 in every units object by spreading BASE_UNITS or a helper constant.
  - Add a short comment next to any average weight that is uncertain or region-dependent.
  - After adding ingredients, run:
      npm run nutrition:build
      npx.cmd tsc --noEmit
*/

export type IngredientNutritionSeed = {
  id: string;
  query: string;
  preferredFdcId?: number;
  units?: Record<string, number>;
  gramsPerUnit?: number; // grams per 1 piece/unit; used when unit is pcs/adet/none
  manualNutritionOverride?: NutritionPer100g;
};

const BASE_UNITS = { g: 1, kg: 1000 };
const LIQUID_UNITS = { ...BASE_UNITS, ml: 1, l: 1000, L: 1000, cup: 240, tbsp: 15, tsp: 5 };
const OIL_UNITS = { ...BASE_UNITS, tbsp: 13.5, tsp: 4.5, cup: 216 };
const SPICE_UNITS = { ...BASE_UNITS, tsp: 2.5, tbsp: 7, pinch: 0.36 };
const FLOUR_UNITS = { ...BASE_UNITS, cup: 120, tbsp: 8, tsp: 2.6 };
const SUGAR_UNITS = { ...BASE_UNITS, cup: 200, tbsp: 12.5, tsp: 4.2 };
const DRY_GRAIN_UNITS = { ...BASE_UNITS, cup: 185 };
const NUT_UNITS = { ...BASE_UNITS, cup: 120, tbsp: 9 };

export const INGREDIENT_NUTRITION_SEED: IngredientNutritionSeed[] = [
  { id: 'egg', query: 'egg whole raw fresh', units: { ...BASE_UNITS, piece: 50, cup: 243 }, gramsPerUnit: 50 },
  { id: 'chicken', query: 'chicken breast raw meat only', units: { ...BASE_UNITS, piece: 120, cup: 140 }, gramsPerUnit: 150 },
  { id: 'beef', query: 'beef raw lean meat', units: { ...BASE_UNITS, piece: 113 } },
  { id: 'salmon', query: 'fish salmon atlantic raw', units: { ...BASE_UNITS, piece: 170 } },
  { id: 'shrimp', query: 'crustaceans shrimp raw', units: { ...BASE_UNITS, piece: 6, cup: 145 } },
  { id: 'tuna', query: 'fish tuna fresh raw', units: { ...BASE_UNITS, piece: 170 } },
  { id: 'lamb', query: 'lamb raw meat', units: { ...BASE_UNITS, piece: 113 } },
  { id: 'turkey', query: 'turkey breast raw meat only', units: { ...BASE_UNITS, piece: 120 } },
  { id: 'pork', query: 'pork fresh loin raw', units: { ...BASE_UNITS, piece: 113 } },
  { id: 'bacon', query: 'pork cured bacon raw', units: { ...BASE_UNITS, slice: 8, piece: 8 } },
  { id: 'tofu', query: 'tofu raw regular prepared with calcium sulfate', units: { ...BASE_UNITS, piece: 85, cup: 248 } },
  { id: 'crab', query: 'crustaceans crab blue raw', units: { ...BASE_UNITS, piece: 85, cup: 135 } },
  { id: 'cod', query: 'fish cod atlantic raw', units: { ...BASE_UNITS, piece: 170 } },
  { id: 'sardine', query: 'fish sardine atlantic raw', units: { ...BASE_UNITS, piece: 38 } },
  { id: 'scallop', query: 'mollusks scallop raw', units: { ...BASE_UNITS, piece: 15, cup: 125 } },
  { id: 'octopus', query: 'mollusks octopus raw', units: { ...BASE_UNITS, piece: 85 } },
  { id: 'mussel', query: 'mollusks mussel blue raw', units: { ...BASE_UNITS, piece: 16, cup: 150 } },
  { id: 'duck', query: 'duck domesticated meat raw', units: { ...BASE_UNITS, piece: 120 } },
  { id: 'ground_beef', query: 'beef ground raw 85 lean 15 fat', units: { ...BASE_UNITS, piece: 113, cup: 225 } },
  { id: 'sausage', query: 'pork sausage fresh raw', units: { ...BASE_UNITS, piece: 50 } },

  { id: 'onion', query: 'onions raw', units: { ...BASE_UNITS, piece: 110, cup: 160, slice: 15 }, gramsPerUnit: 110 },
  { id: 'garlic', query: 'garlic raw', units: { ...BASE_UNITS, clove: 5, piece: 5, tsp: 2.8 }, gramsPerUnit: 5 },
  { id: 'tomato', query: 'tomatoes red ripe raw', units: { ...BASE_UNITS, piece: 123, cup: 180, slice: 20 }, gramsPerUnit: 120 },
  { id: 'potato', query: 'potatoes flesh and skin raw', units: { ...BASE_UNITS, piece: 173, cup: 150 }, gramsPerUnit: 150 },
  { id: 'carrot', query: 'carrots raw', units: { ...BASE_UNITS, piece: 61, cup: 128, slice: 10 }, gramsPerUnit: 80 },
  { id: 'spinach', query: 'spinach raw', units: { ...BASE_UNITS, cup: 30 } },
  { id: 'bell_pepper', query: 'peppers sweet bell raw', units: { ...BASE_UNITS, piece: 119, cup: 149, slice: 10 } },
  { id: 'mushroom', query: 'mushrooms white raw', units: { ...BASE_UNITS, piece: 18, cup: 70, slice: 6 } },
  { id: 'cucumber', query: 'cucumber with peel raw', units: { ...BASE_UNITS, piece: 300, cup: 104, slice: 7 } },
  { id: 'broccoli', query: 'broccoli raw', units: { ...BASE_UNITS, piece: 148, cup: 91 } },
  { id: 'corn', query: 'corn sweet yellow raw', units: { ...BASE_UNITS, piece: 90, cup: 145 } },
  { id: 'eggplant', query: 'eggplant raw', units: { ...BASE_UNITS, piece: 548, cup: 82 } },
  { id: 'sweet_potato', query: 'sweet potato raw', units: { ...BASE_UNITS, piece: 130, cup: 133 } },
  { id: 'peas', query: 'peas green raw', units: { ...BASE_UNITS, cup: 145 } },
  { id: 'zucchini', query: 'zucchini raw', units: { ...BASE_UNITS, piece: 196, cup: 124, slice: 9 } },
  { id: 'cauliflower', query: 'cauliflower raw', units: { ...BASE_UNITS, piece: 575, cup: 107 } },
  { id: 'celery', query: 'celery raw', units: { ...BASE_UNITS, piece: 40, cup: 101 } },
  { id: 'asparagus', query: 'asparagus raw', units: { ...BASE_UNITS, piece: 16, cup: 134 } },
  { id: 'cabbage', query: 'cabbage raw', units: { ...BASE_UNITS, piece: 908, cup: 89 } },
  { id: 'leek', query: 'leeks raw', units: { ...BASE_UNITS, piece: 89, cup: 89 } },
  { id: 'beetroot', query: 'beets raw', units: { ...BASE_UNITS, piece: 82, cup: 136 } },
  { id: 'green_beans', query: 'beans snap green raw', units: { ...BASE_UNITS, piece: 5, cup: 100 } },
  { id: 'artichoke', query: 'artichokes globe raw', units: { ...BASE_UNITS, piece: 128, cup: 168 } },
  { id: 'lettuce', query: 'lettuce green leaf raw', units: { ...BASE_UNITS, piece: 360, cup: 36 } },
  { id: 'radish', query: 'radishes raw', units: { ...BASE_UNITS, piece: 4.5, cup: 116 } },
  { id: 'spring_onion', query: 'onions spring or scallions raw', units: { ...BASE_UNITS, piece: 15, cup: 100 } },
  { id: 'parsley', query: 'parsley fresh raw', units: { ...BASE_UNITS, cup: 60, bunch: 60 } }, // Bunch weight varies by market.
  { id: 'dill', query: 'dill weed fresh raw', units: { ...BASE_UNITS, cup: 9, bunch: 28 } }, // Small herb bunch estimate.
  { id: 'mint', query: 'spearmint fresh raw', units: { ...BASE_UNITS, cup: 25, bunch: 30 } }, // Herb bunch estimate.

  { id: 'butter', query: 'butter salted', units: { ...BASE_UNITS, tbsp: 14, tsp: 4.7, cup: 227 } },
  { id: 'milk', query: 'milk whole 3.25% milkfat', units: { ...LIQUID_UNITS, ml: 1.03, l: 1030, L: 1030, cup: 244 } },
  { id: 'cheese', query: 'cheese cheddar', units: { ...BASE_UNITS, slice: 28, cup: 113 } },
  { id: 'yogurt', query: 'yogurt plain whole milk', units: { ...BASE_UNITS, cup: 245, tbsp: 15 } },
  { id: 'cream', query: 'cream fluid light', units: { ...LIQUID_UNITS, tbsp: 15, tsp: 5, cup: 240 } },
  { id: 'sour_cream', query: 'sour cream cultured', units: { ...BASE_UNITS, tbsp: 12, cup: 230 } },
  { id: 'cream_cheese', query: 'cream cheese', units: { ...BASE_UNITS, tbsp: 14.5, cup: 232 } },
  { id: 'mozzarella', query: 'cheese mozzarella whole milk', units: { ...BASE_UNITS, slice: 28, cup: 112 } },
  { id: 'parmesan', query: 'cheese parmesan hard', units: { ...BASE_UNITS, tbsp: 5, cup: 100 } },
  { id: 'heavy_cream', query: 'cream fluid heavy whipping', units: { ...LIQUID_UNITS, tbsp: 15, tsp: 5, cup: 238 } },
  { id: 'buttermilk', query: 'buttermilk lowfat fluid cultured', units: { ...LIQUID_UNITS, cup: 245 } },
  { id: 'feta', query: 'cheese feta', units: { ...BASE_UNITS, cup: 150 } },
  { id: 'ricotta', query: 'cheese ricotta whole milk', units: { ...BASE_UNITS, cup: 246 } },

  { id: 'rice', query: 'rice white long-grain regular raw unenriched', units: DRY_GRAIN_UNITS },
  { id: 'pasta', query: 'pasta dry enriched', units: { ...BASE_UNITS, cup: 100 } },
  { id: 'bread', query: 'bread white commercially prepared', units: { ...BASE_UNITS, slice: 28, piece: 38 } },
  { id: 'flour', query: 'wheat flour white all-purpose enriched', units: FLOUR_UNITS },
  { id: 'oats', query: 'oats raw', units: { ...BASE_UNITS, cup: 81 } },
  { id: 'quinoa', query: 'quinoa uncooked', units: { ...BASE_UNITS, cup: 170 } },
  { id: 'couscous', query: 'couscous dry', units: { ...BASE_UNITS, cup: 173 } },
  { id: 'tortilla', query: 'tortillas ready-to-bake or fry flour', units: { ...BASE_UNITS, piece: 49 } },
  { id: 'pita', query: 'bread pita white enriched', units: { ...BASE_UNITS, piece: 60 } },
  { id: 'barley', query: 'barley pearled raw', units: { ...BASE_UNITS, cup: 200 } },
  { id: 'noodles', query: 'noodles egg dry enriched', units: { ...BASE_UNITS, cup: 160 } },
  { id: 'bulgur', query: 'bulgur dry', units: { ...BASE_UNITS, cup: 140 } },
  { id: 'breadcrumbs', query: 'bread crumbs dry grated plain', units: { ...BASE_UNITS, cup: 108, tbsp: 7 } },
  { id: 'cornmeal', query: 'cornmeal whole-grain yellow', units: { ...BASE_UNITS, cup: 122, tbsp: 7.6 } },

  { id: 'salt', query: 'salt table', units: { ...BASE_UNITS, tsp: 6, tbsp: 18, pinch: 0.36 } },
  { id: 'black_pepper', query: 'spices pepper black', units: { ...SPICE_UNITS, tsp: 2.3, tbsp: 6.9 } },
  { id: 'chili_flake', query: 'spices pepper red or cayenne', units: SPICE_UNITS },
  { id: 'cumin', query: 'spices cumin seed', units: SPICE_UNITS },
  { id: 'paprika', query: 'spices paprika', units: SPICE_UNITS },
  { id: 'olive_oil', query: 'oil olive salad or cooking', units: OIL_UNITS },
  { id: 'sunflower_oil', query: 'oil sunflower linoleic', units: OIL_UNITS },
  { id: 'soy_sauce', query: 'soy sauce made from soy and wheat', units: { ...LIQUID_UNITS, tbsp: 16, tsp: 5.3 } },
  { id: 'honey', query: 'honey', units: { ...BASE_UNITS, tbsp: 21, tsp: 7, cup: 339 } },
  { id: 'lemon', query: 'lemons raw without peel', units: { ...BASE_UNITS, piece: 58, cup: 212, slice: 8 }, gramsPerUnit: 58 },
  { id: 'cinnamon', query: 'spices cinnamon ground', units: SPICE_UNITS },
  { id: 'turmeric', query: 'spices turmeric ground', units: SPICE_UNITS },
  { id: 'oregano', query: 'oregano fresh', units: { ...BASE_UNITS, tsp: 1, tbsp: 3, pinch: 0.2 } },
  { id: 'basil', query: 'basil fresh', units: { ...BASE_UNITS, cup: 24, bunch: 30 } }, // Herb bunch estimate.
  { id: 'thyme', query: 'thyme fresh', units: { ...BASE_UNITS, tsp: 0.8, tbsp: 2.4, bunch: 28 } }, // Herb bunch estimate.
  { id: 'rosemary', query: 'rosemary fresh', units: { ...BASE_UNITS, tsp: 0.7, tbsp: 2.1, bunch: 28 } }, // Herb bunch estimate.
  { id: 'ginger', query: 'ginger root raw', units: { ...BASE_UNITS, piece: 15, tbsp: 6, tsp: 2 } },
  { id: 'vinegar', query: 'vinegar cider', units: LIQUID_UNITS },
  { id: 'mustard', query: 'mustard prepared yellow', units: { ...BASE_UNITS, tbsp: 15, tsp: 5 } },
  { id: 'sriracha', query: 'hot chili sauce sriracha', units: { ...BASE_UNITS, tbsp: 15, tsp: 5 } },
  { id: 'sesame_oil', query: 'oil sesame salad or cooking', units: OIL_UNITS },
  { id: 'fish_sauce', query: 'fish sauce', units: { ...LIQUID_UNITS, tbsp: 18, tsp: 6 } },
  { id: 'vanilla', query: 'vanilla extract', units: { ...LIQUID_UNITS, tbsp: 13, tsp: 4.2 } },
  { id: 'ketchup', query: 'catsup', units: { ...BASE_UNITS, tbsp: 17, tsp: 5.7, cup: 272 } },
  { id: 'mayonnaise', query: 'mayonnaise regular', units: { ...BASE_UNITS, tbsp: 14, tsp: 4.7, cup: 220 } },
  { id: 'tomato_paste', query: 'tomato products canned paste', units: { ...BASE_UNITS, tbsp: 16, tsp: 5.3, cup: 262 } },
  { id: 'worcestershire', query: 'sauce worcestershire', units: { ...LIQUID_UNITS, tbsp: 17, tsp: 5.7 } },
  { id: 'bay_leaf', query: 'spices bay leaf', units: { ...BASE_UNITS, piece: 0.6, tsp: 0.6, pinch: 0.2 } }, // Bay leaves vary a lot by size.
  { id: 'allspice', query: 'spices allspice ground', units: SPICE_UNITS },
  { id: 'cardamom', query: 'spices cardamom', units: SPICE_UNITS },
  { id: 'cloves', query: 'spices cloves ground', units: SPICE_UNITS },
  { id: 'nutmeg', query: 'spices nutmeg ground', units: SPICE_UNITS },
  { id: 'tahini', query: 'sesame butter tahini', units: { ...BASE_UNITS, tbsp: 15, tsp: 5, cup: 240 } },

  { id: 'apple', query: 'apples raw with skin', units: { ...BASE_UNITS, piece: 182, cup: 125, slice: 20 }, gramsPerUnit: 182 },
  { id: 'banana', query: 'bananas raw', units: { ...BASE_UNITS, piece: 118, cup: 150, slice: 10 }, gramsPerUnit: 118 },
  { id: 'strawberry', query: 'strawberries raw', units: { ...BASE_UNITS, piece: 12, cup: 152 } },
  { id: 'avocado', query: 'avocados raw all commercial varieties', units: { ...BASE_UNITS, piece: 136, cup: 146, slice: 15 } },
  { id: 'mango', query: 'mangos raw', units: { ...BASE_UNITS, piece: 336, cup: 165 } },
  { id: 'blueberry', query: 'blueberries raw', units: { ...BASE_UNITS, cup: 148 } },
  { id: 'lime', query: 'limes raw', units: { ...BASE_UNITS, piece: 67, cup: 242, slice: 8 } },
  { id: 'orange', query: 'oranges raw all commercial varieties', units: { ...BASE_UNITS, piece: 140, cup: 180 } },
  { id: 'peach', query: 'peaches raw', units: { ...BASE_UNITS, piece: 150, cup: 154 } },
  { id: 'pineapple', query: 'pineapple raw all varieties', units: { ...BASE_UNITS, piece: 905, cup: 165 } },
  { id: 'cherry', query: 'cherries sweet raw', units: { ...BASE_UNITS, piece: 8, cup: 154 } },
  { id: 'coconut', query: 'coconut meat raw', units: { ...BASE_UNITS, piece: 45, cup: 80 } },
  { id: 'raspberry', query: 'raspberries raw', units: { ...BASE_UNITS, cup: 123 } },
  { id: 'grape', query: 'grapes red or green raw', units: { ...BASE_UNITS, piece: 5, cup: 151 } },
  { id: 'watermelon', query: 'watermelon raw', units: { ...BASE_UNITS, slice: 286, cup: 152 } },
  { id: 'pear', query: 'pears raw', units: { ...BASE_UNITS, piece: 178, cup: 140 } },
  { id: 'fig', query: 'figs raw', units: { ...BASE_UNITS, piece: 50, cup: 149 } },
  { id: 'pomegranate', query: 'pomegranates raw', units: { ...BASE_UNITS, piece: 282, cup: 174 } },
  { id: 'kiwi', query: 'kiwifruit green raw', units: { ...BASE_UNITS, piece: 69, cup: 180 } },
  { id: 'melon', query: 'melons cantaloupe raw', units: { ...BASE_UNITS, piece: 552, cup: 160 } },

  { id: 'almonds', query: 'nuts almonds', units: NUT_UNITS },
  { id: 'walnuts', query: 'nuts walnuts english', units: { ...BASE_UNITS, cup: 117, tbsp: 7 } },
  { id: 'cashews', query: 'nuts cashew nuts raw', units: NUT_UNITS },
  { id: 'peanuts', query: 'peanuts raw', units: { ...BASE_UNITS, cup: 146, tbsp: 9 } },
  { id: 'sesame_seeds', query: 'seeds sesame seeds whole dried', units: { ...BASE_UNITS, tbsp: 9, tsp: 3, cup: 144 } },
  { id: 'pine_nuts', query: 'nuts pine nuts dried', units: NUT_UNITS },
  { id: 'pumpkin_seeds', query: 'seeds pumpkin and squash seed kernels dried', units: { ...BASE_UNITS, cup: 129, tbsp: 8 } },
  { id: 'chia_seeds', query: 'seeds chia seeds dried', units: { ...BASE_UNITS, tbsp: 12, tsp: 4, cup: 168 } },
  { id: 'sunflower_seeds', query: 'seeds sunflower seed kernels dried', units: { ...BASE_UNITS, cup: 140, tbsp: 9 } },
  { id: 'pistachios', query: 'nuts pistachio nuts raw', units: NUT_UNITS },
  { id: 'hazelnuts', query: 'nuts hazelnuts or filberts', units: NUT_UNITS },

  { id: 'chickpeas', query: 'chickpeas garbanzo beans raw', units: { ...BASE_UNITS, cup: 200 } },
  { id: 'black_beans', query: 'beans black mature seeds raw', units: { ...BASE_UNITS, cup: 194 } },
  { id: 'lentils', query: 'lentils raw', units: { ...BASE_UNITS, cup: 192 } },
  { id: 'kidney_beans', query: 'beans kidney red mature seeds raw', units: { ...BASE_UNITS, cup: 184 } },
  { id: 'edamame', query: 'soybeans green raw', units: { ...BASE_UNITS, cup: 155 } },
  { id: 'white_beans', query: 'beans white mature seeds raw', units: { ...BASE_UNITS, cup: 202 } },
  { id: 'split_peas', query: 'peas split mature seeds raw', units: { ...BASE_UNITS, cup: 197 } },

  { id: 'sugar', query: 'sugars granulated', units: SUGAR_UNITS },
  { id: 'brown_sugar', query: 'sugars brown', units: { ...BASE_UNITS, cup: 220, tbsp: 13.8, tsp: 4.6 } },
  { id: 'baking_powder', query: 'leavening agents baking powder double-acting sodium aluminum sulfate', units: { ...BASE_UNITS, tsp: 4.6, tbsp: 13.8, pinch: 0.36 } },
  { id: 'baking_soda', query: 'leavening agents baking soda', units: { ...BASE_UNITS, tsp: 4.6, tbsp: 13.8, pinch: 0.36 } },
  { id: 'cocoa', query: 'cocoa dry powder unsweetened', units: { ...BASE_UNITS, cup: 86, tbsp: 5.4, tsp: 1.8 } },
  { id: 'chocolate', query: 'chocolate dark 70-85 cacao solids', units: { ...BASE_UNITS, piece: 10, cup: 170 } },
  { id: 'yeast', query: 'yeast baker active dry', units: { ...BASE_UNITS, tsp: 3.1, tbsp: 9.3 } },
  { id: 'cornstarch', query: 'cornstarch', units: { ...BASE_UNITS, cup: 128, tbsp: 8, tsp: 2.7 } },
  { id: 'powdered_sugar', query: 'sugars powdered', units: { ...BASE_UNITS, cup: 120, tbsp: 7.5, tsp: 2.5 } },
  { id: 'gelatin', query: 'gelatins dry powder unsweetened', units: { ...BASE_UNITS, tbsp: 9, tsp: 3 } },

  { id: 'water', query: 'water bottled', units: LIQUID_UNITS },
  { id: 'broth', query: 'chicken broth ready-to-serve', units: LIQUID_UNITS },
  { id: 'beef_broth', query: 'beef broth ready-to-serve', units: LIQUID_UNITS },
  { id: 'coconut_milk', query: 'coconut milk raw', units: { ...LIQUID_UNITS, cup: 240 } },
  { id: 'wine', query: 'wine table white', units: LIQUID_UNITS },
  { id: 'red_wine', query: 'wine table red', units: LIQUID_UNITS },
  { id: 'beer', query: 'beer regular all', units: { ...LIQUID_UNITS, bottle: 355, can: 355 } },
  { id: 'lemon_juice', query: 'lemon juice raw', units: { ...LIQUID_UNITS, tbsp: 15, tsp: 5 } },
  { id: 'orange_juice', query: 'orange juice raw', units: LIQUID_UNITS },
  { id: 'milk_liquid', query: 'milk whole 3.25% milkfat', units: { ...LIQUID_UNITS, ml: 1.03, l: 1030, L: 1030, cup: 244 } },
];
