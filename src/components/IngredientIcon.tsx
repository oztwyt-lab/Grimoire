import { Image, ImageSourcePropType, ImageStyle, StyleProp, Text, TextStyle } from 'react-native';

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
  const source = id ? INGREDIENT_ICON_SOURCES[id] : undefined;

  if (source) {
    return <Image source={source} style={[{ width: size, height: size }, imageStyle]} resizeMode="contain" />;
  }

  return <Text style={[{ fontSize: size * 0.85 }, textStyle]}>{emoji ?? '🥄'}</Text>;
}
