import { Image, ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';

const DEFAULT_RECIPE_SOURCE = require('../../assets/candidates/openart/rpg-icons-selected/I_C_Bread.png');

const RECIPE_ICON_SOURCES: Record<string, ImageSourcePropType> = {
  '🍝': require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  '🍳': require('../../assets/candidates/openart/food-icons-license-check/egg_whole_brown.png'),
  '🍢': require('../../assets/candidates/openart/food-icons-license-check/steak_grilled.png'),
  '🍲': require('../../assets/candidates/openart/rpg-icons-selected/I_C_Meat.png'),
  '🥘': require('../../assets/candidates/openart/rpg-icons-selected/I_C_Meat.png'),
  '🥗': require('../../assets/candidates/openart/food-icons-license-check/lettuce.png'),
  '🍞': require('../../assets/candidates/openart/food-icons-license-check/bread_loaf_brown.png'),
  '🥩': require('../../assets/candidates/openart/food-icons-license-check/steak_grilled.png'),
  '🍗': require('../../assets/candidates/openart/food-icons-license-check/chicken_drumstick_cooked.png'),
  '🐟': require('../../assets/candidates/openart/food-icons-license-check/fish_fillet.png'),
  '🍤': require('../../assets/candidates/openart/food-icons-license-check/shrimp.png'),
  '🍚': require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  '🍅': require('../../assets/candidates/openart/food-icons-license-check/tomato.png'),
  // Turkish recipe emojis
  '🥣': require('../../assets/candidates/openart/food-icons-license-check/mushroom.png'),
  '🌿': require('../../assets/candidates/openart/food-icons-license-check/broccoli.png'),
  '🌽': require('../../assets/candidates/openart/food-icons-license-check/corn.png'),
  '🍡': require('../../assets/candidates/openart/food-icons-license-check/steak_grilled.png'),
  '🫘': require('../../assets/candidates/openart/food-icons-license-check/onion_brown.png'),
  '🥒': require('../../assets/candidates/openart/food-icons-license-check/cucumber.png'),
  '🫓': require('../../assets/candidates/openart/food-icons-license-check/bread_loaf_brown.png'),
  '🍮': require('../../assets/candidates/openart/rpg-icons-selected/I_C_Pie.png'),
  '🍆': require('../../assets/candidates/openart/food-icons-license-check/bell_pepper_red.png'),
  '🧀': require('../../assets/candidates/openart/food-icons-license-check/cheese.png'),
  '🌾': require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  '🍯': require('../../assets/candidates/openart/food-icons-license-check/honey_pot.png'),
};

type Props = {
  icon?: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export default function RecipeIconArt({ icon, size = 34, style }: Props) {
  return (
    <Image
      source={(icon && RECIPE_ICON_SOURCES[icon]) || DEFAULT_RECIPE_SOURCE}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}
