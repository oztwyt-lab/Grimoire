export function getActionEmoji(actionType: string): string {
  const map: Record<string, string> = {
    cut: '🔪', chop: '🔪', fillet: '🔪',
    boil: '♨️', simmer: '♨️',
    fry: '🍳', saute: '🍳',
    bake: '🔥', roast: '🔥', grill: '🔥',
    steam: '💨',
    mix: '🥄', whisk: '🥄', stir: '🥄',
    season: '🧂',
    marinate: '🫙',
    peel: '🫚',
    drain: '🫗',
    rest: '⏱', wait: '⏱',
    mince: '🔪', crush: '🔪',
  };
  const lower = actionType?.toLowerCase() ?? '';
  if (map[lower]) return map[lower];
  for (const [key, emoji] of Object.entries(map)) {
    if (lower.includes(key)) return emoji;
  }
  return '🧑‍🍳';
}
