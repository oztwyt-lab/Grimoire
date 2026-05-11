import { Image, ImageStyle, StyleProp } from 'react-native';
import { CharacterRank } from '../data/character';

const RANK_ICON_SOURCES: Record<CharacterRank['title'], number> = {
  APPRENTICE: require('../../assets/candidates/openart/rpg-icons-selected/I_Scroll.png'),
  COOK: require('../../assets/candidates/openart/rpg-icons-selected/I_C_Bread.png'),
  CHEF: require('../../assets/candidates/openart/rpg-icons-selected/C_Hat01.png'),
  SORCERER: require('../../assets/candidates/openart/rpg-icons-selected/W_Staff04.png'),
  'ARCH-MAGE': require('../../assets/candidates/openart/rpg-icons-selected/W_Book07.png'),
};

type Props = {
  rank: CharacterRank;
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export default function RankIcon({ rank, size = 42, style }: Props) {
  return (
    <Image
      source={RANK_ICON_SOURCES[rank.title]}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}
