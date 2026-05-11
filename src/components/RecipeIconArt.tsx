import { Image, ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';
import { RECIPE_ICON_MAP } from './recipeIconMap';

const DEFAULT_RECIPE_SOURCE = require('../../assets/candidates/openart/rpg-icons-selected/I_C_Bread.png');

const f = (name: string): ImageSourcePropType =>
  require(`../../assets/candidates/openart/food-icons-license-check/${name}.png`);
const r = (name: string): ImageSourcePropType =>
  require(`../../assets/candidates/openart/rpg-icons-selected/${name}.png`);

const RECIPE_ICON_SOURCES: Record<string, ImageSourcePropType> = {
  // ── pasta & grains ──────────────────────────────────────────────────────────
  '🍝': f('macaroni'),
  '🍚': f('rice_ball'),
  '🌾': f('rice_cracker'),       // Bulgur Pilavı
  // ── meat ────────────────────────────────────────────────────────────────────
  '🥩': f('steak_grilled'),
  '🍢': f('steak_grilled'),      // Lamb Kofta / İzmir Köfte
  '🍡': f('dango'),              // Adana Kebabı (skewer)
  '🍖': r('I_C_Meat'),          // Pilav Üstü Tavuk
  // ── poultry ─────────────────────────────────────────────────────────────────
  '🍗': f('chicken_drumstick_cooked'),  // Chicken Stir Fry
  '🥘': f('chicken_nuggets'),    // Tavuk Sote
  // ── fish & seafood ──────────────────────────────────────────────────────────
  '🐟': f('fish_fillet'),        // Pan Seared Salmon
  '🐠': f('fish_sticks'),        // Hamsi Tava (fried fish)
  '🍤': f('shrimp'),
  // ── soups ───────────────────────────────────────────────────────────────────
  '🍲': f('soup_pea'),           // Chicken Soup
  '🥣': f('soup_mushroom'),      // Mercimek Çorbası
  '🍵': f('soup_pea'),           // Lentil Soup
  '🫖': f('soup_beet'),          // Tarhana Çorbası
  // ── eggs & breakfast ────────────────────────────────────────────────────────
  '🍳': f('egg_whole_brown'),    // Classic Omelette
  '🥚': f('egg_fried'),          // Menemen
  '🥞': f('pancakes'),
  // ── vegetables ──────────────────────────────────────────────────────────────
  '🥗': f('lettuce'),
  '🍅': f('tomato'),
  '🌽': f('corn'),
  '🥒': f('cucumber'),
  '🍆': f('eggplant'),           // Patlıcan Musakka
  '🥑': f('avocado_whole'),
  '🌿': f('broccoli'),           // Zeytinyağlı Enginar
  '🌶️': f('chili_pepper_red'), // Çiğ Köfte
  '🍛': f('bell_pepper_red'),    // Vegetable Curry
  '🍄': f('mushroom'),           // Mushroom Risotto
  '🧅': f('onion_brown'),        // French Onion Soup
  '🥔': f('potato'),             // Baked Potato
  '🧄': f('garlic'),             // Garlic Butter Pasta
  // ── legumes ─────────────────────────────────────────────────────────────────
  '🫘': f('garbanzo_beans'),     // Kuru Fasulye
  '🫛': f('pea_pod'),            // Zeytinyağlı Barbunya
  // ── bread & flatbread ───────────────────────────────────────────────────────
  '🍞': f('bread_loaf_brown'),
  '🫓': f('flatbread'),          // Lahmacun
  '🌮': f('taco'),               // Beef Tacos
  // ── dairy & cheese ──────────────────────────────────────────────────────────
  '🧀': f('cheese'),             // Mıhlama
  // ── olives ──────────────────────────────────────────────────────────────────
  '🫒': f('olives_green'),       // Caprese Salad
  // ── sweets & dessert ────────────────────────────────────────────────────────
  '🍮': f('flan'),               // Sütlaç
  '🍯': f('honey_pot'),          // Kadayıf
  // ── fruit & drinks ──────────────────────────────────────────────────────────
  '🍌': f('banana'),             // Banana Smoothie
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
