# OpenArt Asset Salvage

Curated from `C:\Users\Oz\Desktop\OpenArt` on 2026-05-11.

These assets are candidates, not all active app assets. Anything in `assets/candidates/openart/` should be reviewed before wiring into screens.

## Currently Wired

### Ingredient icon polish
- File: `src/components/IngredientIcon.tsx`
- Rollback switch: set `USE_OPENART_INGREDIENT_POLISH` to `false`.
- Uses: selected icons from `assets/candidates/openart/food-icons-license-check/`.
- Scope: internal testing polish for ingredient cards and ingredient references that use `IngredientIcon`.
- Publish note: this folder still needs license/source verification. If unresolved before store submission, turn the rollback switch off or replace these icons with CC0 assets.

### Cook mode boss polish
- File: `app/cook/[id].tsx`
- Rollback switch: set `USE_OPENART_BOSS_POLISH` to `false`.
- Uses: CC0 copies in `assets/bosses/openart/`.
- Active bosses: arcane watcher, void watcher, iron champion, plus the original ghosts.
- Effects: per-boss aura, hit impact scale, and defeat ring tuning.
- Publish note: CC0 license and credit files are copied beside the active boss assets.

### Emoji replacement pass
- Files: `src/components/IngredientIcon.tsx`, `src/components/RankIcon.tsx`, `src/components/RecipeIconArt.tsx`, `src/components/CookingActionIcon.tsx`.
- Scope: ingredient displays, rank badges, level-up modal, recipe cards, Magic Orb recipe art, shopping list rows, and Cook Mode step/completion icons.
- Rollback: ingredient icons still use `USE_OPENART_INGREDIENT_POLISH`; rank/recipe/action components can be reverted by swapping those component usages back to text.
- Publish note: rank/action/recipe icons currently use `assets/candidates/openart/rpg-icons-selected/`, which still needs license/source verification before public release.

## High-Confidence Candidates

### `assets/candidates/openart/rpg-battle-cc0/`
- Source: `OpenArt\rpg-battle-system-part-2_1-31-17`
- License: CC0, copied with `LICENSE.txt` and `CREDIT.txt`
- Use for: future boss variants, alternate mage/wizard references, monster animation prototypes.
- Best picks: mimic, mushroom, giant, boar, ghost sheets.

### `assets/candidates/openart/kenney-rpg-cc0/`
- Source: `OpenArt\KenneyRPGpack`
- License: CC0, copied with `license.txt`
- Use for: UI props, map/world decorations, future onboarding illustrations, simple inventory/world polish.
- Best use: safe publish-facing fallback assets because credit is optional.

## Attribution / License-Tracked Candidates

### `assets/candidates/openart/shikashi-icons-attribution/`
- Source: `OpenArt\Shikashi's Fantasy Icons Pack v2`
- License notes copied as `license-notes.txt`.
- Commercial use allowed by pack notes, but many designs are based on CC BY 3.0 game-icons.net designs.
- Use for: status effects, action icons, recipe/cooking symbols, future shop/premium iconography.
- Before publish: add attribution in credits/legal notes if used in the app.

## Needs License Check Before Publish

### `assets/candidates/openart/rpg-icons-selected/`
- Source: `OpenArt\496_RPG_icons`
- Use for: shop cosmetics, staff icons, books, scrolls, potions, coins, crystals, fantasy food placeholders.
- Status: visually strong, but no license file found during quick pass.

### `assets/candidates/openart/food-icons-license-check/`
- Source: `OpenArt\food\food`
- Use for: polished ingredient icons if we decide to replace emojis or expand ingredient art.
- Status: visually clean and tiny, but no license file found during quick pass.

## Recommendation

For internal testing, keep these as candidates only. For publish-facing polish, prefer the CC0 folders first, then Shikashi with attribution, then only use unknown-license folders after license/source verification.
