import { Image, ImageSourcePropType, ImageStyle, StyleProp, Text, TextStyle } from 'react-native';

// Rollback switch for the OpenArt polish pass. Set false to restore the prior icon set.
const USE_OPENART_INGREDIENT_POLISH = true;

const INGREDIENT_ICON_SOURCES: Record<string, ImageSourcePropType> = {
  apple: require('../../assets/ingredient-icons/apple.png'),
  banana: require('../../assets/ingredient-icons/banana.png'),
  beef: require('../../assets/ingredient-icons/raw_meat.png'),
  ground_beef: require('../../assets/ingredient-icons/raw_meat.png'),
  lamb: require('../../assets/ingredient-icons/lamb.png'),
  chicken: require('../../assets/ingredient-icons/chicken.png'),
  turkey: require('../../assets/ingredient-icons/turkey.png'),
  sausage: require('../../assets/ingredient-icons/sausage.png'),
  salmon: require('../../assets/ingredient-icons/raw_fish.png'),
  tuna: require('../../assets/ingredient-icons/fish.png'),
  cod: require('../../assets/ingredient-icons/fish.png'),
  sardine: require('../../assets/ingredient-icons/fish.png'),
  fish_sauce: require('../../assets/ingredient-icons/fish.png'),
  bread: require('../../assets/ingredient-icons/bread.png'),
  breadcrumbs: require('../../assets/ingredient-icons/bread_alt.png'),
  cheese: require('../../assets/ingredient-icons/cheese.png'),
  feta: require('../../assets/ingredient-icons/feta.png'),
  parmesan: require('../../assets/ingredient-icons/cheese_alt.png'),
  carrot: require('../../assets/ingredient-icons/carrot.png'),
  beetroot: require('../../assets/ingredient-icons/beetroot.png'),
  radish: require('../../assets/ingredient-icons/radish.png'),
  eggplant: require('../../assets/ingredient-icons/eggplant.png'),
  corn: require('../../assets/ingredient-icons/corn.png'),
  cornmeal: require('../../assets/ingredient-icons/corn.png'),
  cornstarch: require('../../assets/ingredient-icons/corn.png'),
  mushroom: require('../../assets/ingredient-icons/mushroom.png'),
  lemon: require('../../assets/ingredient-icons/lemon.png'),
  lemon_juice: require('../../assets/ingredient-icons/lemon_alt.png'),
  orange: require('../../assets/ingredient-icons/orange.png'),
  orange_juice: require('../../assets/ingredient-icons/orange.png'),
  pear: require('../../assets/ingredient-icons/pear.png'),
  grape: require('../../assets/ingredient-icons/grape.png'),
  grapes: require('../../assets/ingredient-icons/grape.png'),
  strawberry: require('../../assets/ingredient-icons/strawberry.png'),
  raspberry: require('../../assets/ingredient-icons/strawberry_alt.png'),
  watermelon: require('../../assets/ingredient-icons/watermelon.png'),
};

const OPENART_INGREDIENT_ICON_SOURCES: Record<string, ImageSourcePropType> = {
  apple: require('../../assets/candidates/openart/food-icons-license-check/apple_red.png'),
  banana: require('../../assets/candidates/openart/food-icons-license-check/banana.png'),
  bell_pepper: require('../../assets/candidates/openart/food-icons-license-check/bell_pepper_red.png'),
  bread: require('../../assets/candidates/openart/food-icons-license-check/bread_loaf_brown.png'),
  breadcrumbs: require('../../assets/candidates/openart/food-icons-license-check/bread_loaf_brown.png'),
  broccoli: require('../../assets/candidates/openart/food-icons-license-check/broccoli.png'),
  butter: require('../../assets/candidates/openart/food-icons-license-check/butter.png'),
  carrot: require('../../assets/candidates/openart/food-icons-license-check/carrot.png'),
  cheese: require('../../assets/candidates/openart/food-icons-license-check/cheese.png'),
  feta: require('../../assets/candidates/openart/food-icons-license-check/cheese.png'),
  parmesan: require('../../assets/candidates/openart/food-icons-license-check/cheese.png'),
  chicken: require('../../assets/candidates/openart/food-icons-license-check/chicken_drumstick_cooked.png'),
  chicken_breast: require('../../assets/candidates/openart/food-icons-license-check/chicken_drumstick_cooked.png'),
  chili: require('../../assets/candidates/openart/food-icons-license-check/chili_pepper_red.png'),
  chili_pepper: require('../../assets/candidates/openart/food-icons-license-check/chili_pepper_red.png'),
  black_pepper: require('../../assets/candidates/openart/food-icons-license-check/chili_pepper_red.png'),
  paprika: require('../../assets/candidates/openart/food-icons-license-check/chili_pepper_red.png'),
  cayenne: require('../../assets/candidates/openart/food-icons-license-check/chili_pepper_red.png'),
  cayenne_pepper: require('../../assets/candidates/openart/food-icons-license-check/chili_pepper_red.png'),
  corn: require('../../assets/candidates/openart/food-icons-license-check/corn.png'),
  cornmeal: require('../../assets/candidates/openart/food-icons-license-check/corn.png'),
  cornstarch: require('../../assets/candidates/openart/food-icons-license-check/corn.png'),
  cucumber: require('../../assets/candidates/openart/food-icons-license-check/cucumber.png'),
  egg: require('../../assets/candidates/openart/food-icons-license-check/egg_whole_brown.png'),
  fish: require('../../assets/candidates/openart/food-icons-license-check/fish_fillet.png'),
  salmon: require('../../assets/candidates/openart/food-icons-license-check/fish_fillet.png'),
  tuna: require('../../assets/candidates/openart/food-icons-license-check/fish_fillet.png'),
  cod: require('../../assets/candidates/openart/food-icons-license-check/fish_fillet.png'),
  sardine: require('../../assets/candidates/openart/food-icons-license-check/fish_fillet.png'),
  fish_sauce: require('../../assets/candidates/openart/food-icons-license-check/fish_fillet.png'),
  garlic: require('../../assets/candidates/openart/food-icons-license-check/garlic.png'),
  grape: require('../../assets/candidates/openart/food-icons-license-check/grapes_purple.png'),
  grapes: require('../../assets/candidates/openart/food-icons-license-check/grapes_purple.png'),
  honey: require('../../assets/candidates/openart/food-icons-license-check/honey_pot.png'),
  mustard: require('../../assets/candidates/openart/food-icons-license-check/honey_pot.png'),
  tahini: require('../../assets/candidates/openart/food-icons-license-check/honey_pot.png'),
  pomegranate_molasses: require('../../assets/candidates/openart/food-icons-license-check/honey_pot.png'),
  gelatin: require('../../assets/candidates/openart/food-icons-license-check/honey_pot.png'),
  lemon: require('../../assets/candidates/openart/food-icons-license-check/lemon.png'),
  lemon_juice: require('../../assets/candidates/openart/food-icons-license-check/lemon.png'),
  lime: require('../../assets/candidates/openart/food-icons-license-check/lemon.png'),
  lettuce: require('../../assets/candidates/openart/food-icons-license-check/lettuce.png'),
  mushroom: require('../../assets/candidates/openart/food-icons-license-check/mushroom.png'),
  nutmeg: require('../../assets/candidates/openart/food-icons-license-check/mushroom.png'),
  lentils: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  green_lentils: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  black_lentils: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  split_peas: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  chickpeas: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  white_beans: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  black_beans: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  kidney_beans: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  red_kidney_beans: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  cannellini_beans: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  sesame_seeds: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  chia_seeds: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  sunflower_seeds: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  pumpkin_seeds: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  onion: require('../../assets/candidates/openart/food-icons-license-check/onion_brown.png'),
  potato: require('../../assets/candidates/openart/food-icons-license-check/potato.png'),
  rice: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  basmati_rice: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  jasmine_rice: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  brown_rice: require('../../assets/candidates/openart/food-icons-license-check/rice_ball.png'),
  shrimp: require('../../assets/candidates/openart/food-icons-license-check/shrimp.png'),
  steak: require('../../assets/candidates/openart/food-icons-license-check/steak_grilled.png'),
  beef: require('../../assets/candidates/openart/food-icons-license-check/steak_grilled.png'),
  ground_beef: require('../../assets/candidates/openart/food-icons-license-check/steak_grilled.png'),
  lamb: require('../../assets/candidates/openart/food-icons-license-check/steak_grilled.png'),
  ground_lamb: require('../../assets/candidates/openart/food-icons-license-check/steak_grilled.png'),
  strawberry: require('../../assets/candidates/openart/food-icons-license-check/strawberry.png'),
  raspberry: require('../../assets/candidates/openart/food-icons-license-check/strawberry.png'),
  tomato: require('../../assets/candidates/openart/food-icons-license-check/tomato.png'),
};

type IngredientIconProps = {
  id?: string;
  emoji?: string;
  size?: number;
  imageStyle?: StyleProp<ImageStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export default function IngredientIcon({
  id,
  emoji,
  size = 28,
  imageStyle,
  textStyle,
}: IngredientIconProps) {
  const source = id
    ? (USE_OPENART_INGREDIENT_POLISH ? OPENART_INGREDIENT_ICON_SOURCES[id] : undefined) ?? INGREDIENT_ICON_SOURCES[id]
    : undefined;

  if (source) {
    return <Image source={source} style={[{ width: size, height: size }, imageStyle]} resizeMode="contain" />;
  }

  return <Text style={[{ fontSize: size * 0.85 }, textStyle]}>{emoji ?? '🥄'}</Text>;
}
