import { Image, ImageStyle, StyleProp } from 'react-native';

const ACTION_ICON_SOURCES = {
  cut: require('../../assets/candidates/openart/rpg-icons-selected/W_Staff01.png'),
  heat: require('../../assets/candidates/openart/rpg-icons-selected/I_Bottle03.png'),
  mix: require('../../assets/candidates/openart/rpg-icons-selected/I_Bottle01.png'),
  season: require('../../assets/candidates/openart/rpg-icons-selected/I_Bottle04.png'),
  rest: require('../../assets/candidates/openart/rpg-icons-selected/I_Scroll02.png'),
  serve: require('../../assets/candidates/openart/rpg-icons-selected/C_Hat01.png'),
};

function getActionIconSource(text: string) {
  const lower = text.toLowerCase();
  if (/(cut|chop|fillet|mince|crush|peel)/.test(lower)) return ACTION_ICON_SOURCES.cut;
  if (/(boil|simmer|fry|saute|bake|roast|grill|steam)/.test(lower)) return ACTION_ICON_SOURCES.heat;
  if (/(mix|whisk|stir|marinate|drain)/.test(lower)) return ACTION_ICON_SOURCES.mix;
  if (/(season|salt|pepper|spice)/.test(lower)) return ACTION_ICON_SOURCES.season;
  if (/(rest|wait)/.test(lower)) return ACTION_ICON_SOURCES.rest;
  return ACTION_ICON_SOURCES.serve;
}

type Props = {
  text: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export default function CookingActionIcon({ text, size = 42, style }: Props) {
  return (
    <Image
      source={getActionIconSource(text)}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}
