import { Image, ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';
import { RECIPE_ICON_MAP } from './recipeIconMap';

const DEFAULT_RECIPE_SOURCE = require('../../assets/candidates/openart/rpg-icons-selected/I_C_Bread.png');

const RECIPE_ICON_SOURCES: Record<string, ImageSourcePropType> = {
  // ── pasta & grains ──────────────────────────────────────────────────────────
  '🍝': require('../../assets/candidates/openart/food-icons-license-check/macaroni.png'),
  '🍚': require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  '🌾': require('../../assets/candidates/openart/food-icons-license-check/rice_cracker.png'),
  // ── meat ────────────────────────────────────────────────────────────────────
  '🥩': require('../../assets/candidates/openart/food-icons-license-check/meat_cooked_hot.png'),
  '🍢': require('../../assets/candidates/openart/food-icons-license-check/steak_grilled.png'),
  '🍡': require('../../assets/candidates/openart/food-icons-license-check/dango.png'),
  '🍖': require('../../assets/candidates/openart/rpg-icons-selected/I_C_Meat.png'),
  // ── poultry ─────────────────────────────────────────────────────────────────
  '🍗': require('../../assets/candidates/openart/food-icons-license-check/chicken_drumstick_cooked.png'),
  '🥘': require('../../assets/candidates/openart/food-icons-license-check/chicken_nuggets.png'),
  // ── fish & seafood ──────────────────────────────────────────────────────────
  '🐟': require('../../assets/candidates/openart/food-icons-license-check/fish_fillet.png'),
  '🐠': require('../../assets/candidates/openart/food-icons-license-check/fish_sticks.png'),
  '🍤': require('../../assets/candidates/openart/food-icons-license-check/shrimp.png'),
  // ── soups ───────────────────────────────────────────────────────────────────
  '🍲': require('../../assets/candidates/openart/food-icons-license-check/soup_miso.png'),
  '🥣': require('../../assets/candidates/openart/food-icons-license-check/soup_mushroom.png'),
  '🍵': require('../../assets/candidates/openart/food-icons-license-check/soup_pea.png'),
  '🫖': require('../../assets/candidates/openart/food-icons-license-check/soup_beet.png'),
  // ── eggs & breakfast ────────────────────────────────────────────────────────
  '🍳': require('../../assets/candidates/openart/food-icons-license-check/egg_whole_brown.png'),
  '🥚': require('../../assets/candidates/openart/food-icons-license-check/egg_fried.png'),
  '🥞': require('../../assets/candidates/openart/food-icons-license-check/pancakes.png'),
  // ── vegetables ──────────────────────────────────────────────────────────────
  '🥗': require('../../assets/candidates/openart/food-icons-license-check/lettuce.png'),
  '🍅': require('../../assets/candidates/openart/food-icons-license-check/tomato.png'),
  '🌽': require('../../assets/candidates/openart/food-icons-license-check/corn.png'),
  '🥒': require('../../assets/candidates/openart/food-icons-license-check/cucumber.png'),
  '🍆': require('../../assets/candidates/openart/food-icons-license-check/eggplant.png'),
  '🥑': require('../../assets/candidates/openart/food-icons-license-check/avocado_whole.png'),
  '🌿': require('../../assets/candidates/openart/food-icons-license-check/asparagus.png'),
  '🌶️': require('../../assets/candidates/openart/food-icons-license-check/chili_pepper_red.png'),
  '🍛': require('../../assets/candidates/openart/food-icons-license-check/cauliflower.png'),
  '🍄': require('../../assets/candidates/openart/discovered/food_icons/item_mushroom1.png'),
  '🧅': require('../../assets/candidates/openart/food-icons-license-check/onion_brown.png'),
  '🥔': require('../../assets/candidates/openart/food-icons-license-check/potato.png'),
  '🧄': require('../../assets/candidates/openart/food-icons-license-check/garlic.png'),
  // ── legumes ─────────────────────────────────────────────────────────────────
  '🫘': require('../../assets/candidates/openart/food-icons-license-check/garbanzo_beans.png'),
  '🫛': require('../../assets/candidates/openart/food-icons-license-check/pea_pod.png'),
  // ── bread & flatbread ───────────────────────────────────────────────────────
  '🍞': require('../../assets/candidates/openart/food-icons-license-check/bread_loaf_brown.png'),
  '🫓': require('../../assets/candidates/openart/food-icons-license-check/flatbread.png'),
  '🌮': require('../../assets/candidates/openart/food-icons-license-check/taco.png'),
  // ── dairy & cheese ──────────────────────────────────────────────────────────
  '🧀': require('../../assets/candidates/openart/food-icons-license-check/cheese.png'),
  // ── olives ──────────────────────────────────────────────────────────────────
  '🫒': require('../../assets/candidates/openart/food-icons-license-check/olives_green.png'),
  // ── sweets & dessert ────────────────────────────────────────────────────────
  '🍮': require('../../assets/candidates/openart/food-icons-license-check/flan.png'),
  '🍯': require('../../assets/candidates/openart/food-icons-license-check/honey_pot.png'),
  // ── fruit & drinks ──────────────────────────────────────────────────────────
  '🍌': require('../../assets/candidates/openart/food-icons-license-check/banana.png'),
};

type Props = {
  icon?: string;
  recipeId?: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export default function RecipeIconArt({ icon, recipeId, size = 34, style }: Props) {
  const source =
    (recipeId && RECIPE_ICON_MAP[recipeId]) ||
    (icon && RECIPE_ICON_SOURCES[icon]) ||
    DEFAULT_RECIPE_SOURCE;
  return (
    <Image
      source={source}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}
