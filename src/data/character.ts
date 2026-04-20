// ─── RPG character rank system ────────────────────────────────────────────────
// Rank is derived purely from recipe count — no separate Firestore doc needed.

export type CharacterRank = {
  level: number;
  title: string;
  emoji: string;
  flavorText: string;
  minRecipes: number;
  nextLevelRecipes: number | null; // null = max rank
  nextTitle: string | null;
};

export const RANKS: CharacterRank[] = [
  {
    level: 1,
    title: 'APPRENTICE',
    emoji: '🥄',
    flavorText: 'Still learning the sacred arts...',
    minRecipes: 0,
    nextLevelRecipes: 3,
    nextTitle: 'COOK',
  },
  {
    level: 2,
    title: 'COOK',
    emoji: '🍳',
    flavorText: 'The flame obeys your will.',
    minRecipes: 3,
    nextLevelRecipes: 8,
    nextTitle: 'CHEF',
  },
  {
    level: 3,
    title: 'CHEF',
    emoji: '🧑‍🍳',
    flavorText: 'Your name is spoken in kitchens.',
    minRecipes: 8,
    nextLevelRecipes: 20,
    nextTitle: 'SORCERER',
  },
  {
    level: 4,
    title: 'SORCERER',
    emoji: '🧙',
    flavorText: 'Ingredients bend to your magic.',
    minRecipes: 20,
    nextLevelRecipes: 40,
    nextTitle: 'ARCH-MAGE',
  },
  {
    level: 5,
    title: 'ARCH-MAGE',
    emoji: '⚗️',
    flavorText: 'A legend of the culinary arts.',
    minRecipes: 40,
    nextLevelRecipes: null,
    nextTitle: null,
  },
];

export function getCharacterRank(recipeCount: number): CharacterRank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (recipeCount >= RANKS[i].minRecipes) return RANKS[i];
  }
  return RANKS[0];
}

export function getLevelProgress(recipeCount: number, rank: CharacterRank): number {
  if (rank.nextLevelRecipes === null) return 1;
  const span = rank.nextLevelRecipes - rank.minRecipes;
  const progress = recipeCount - rank.minRecipes;
  return Math.min(progress / span, 1);
}
