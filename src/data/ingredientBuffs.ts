import { INGREDIENTS } from './ingredients';

export type IngredientBuff = {
  id: string;
  text: string;
  textTr: string;
};

type LocalizedBuffText = {
  en: string;
  tr: string;
};

const CATEGORY_BUFFS: Record<string, LocalizedBuffText> = {
  Proteins: {
    en: 'BUFFS: Protein-heavy ingredient for muscle repair, satiety, and steady strength. Best when the meal needs a strong recovery core.',
    tr: 'ETKILER: Kas onarimi, tokluk ve guc icin protein agirlikli malzeme. Guclu toparlanma gereken yemeklerde iyi calisir.',
  },
  Vegetables: {
    en: 'BUFFS: Adds fiber, minerals, and plant compounds that support digestion, balance, and everyday vitality.',
    tr: 'ETKILER: Lif, mineral ve bitkisel bilesenler ekler. Sindirimi, dengeyi ve gunluk canliligi destekler.',
  },
  Dairy: {
    en: 'BUFFS: Brings calcium, protein, and richness. Good for bone support, fullness, and smoothing sharp flavors.',
    tr: 'ETKILER: Kalsiyum, protein ve yogunluk katar. Kemik destegi, tokluk ve keskin tatlari yumusatmak icin iyidir.',
  },
  Grains: {
    en: 'BUFFS: Reliable carb fuel for longer-lasting energy. Helps turn a light dish into a sustaining meal.',
    tr: 'ETKILER: Uzun sureli enerji icin guvenilir karbonhidrat kaynagi. Hafif yemekleri daha doyurucu yapar.',
  },
  Spices: {
    en: 'BUFFS: Small amount, big effect. Adds flavor intensity and supportive plant compounds without weighing the meal down.',
    tr: 'ETKILER: Az miktarda buyuk etki verir. Yemege agirlik katmadan aroma ve destekleyici bitkisel bilesenler ekler.',
  },
  Fruits: {
    en: 'BUFFS: Bright source of quick carbs, hydration, and antioxidants. Good for freshness, color, and fast energy.',
    tr: 'ETKILER: Hizli karbonhidrat, su ve antioksidan kaynagi. Ferahlik, renk ve hizli enerji icin iyidir.',
  },
  Nuts: {
    en: 'BUFFS: Dense source of healthy fats, minerals, and plant protein. Adds crunch, satiety, and long-burn energy.',
    tr: 'ETKILER: Saglikli yag, mineral ve bitkisel protein yogunlugu yuksektir. Citirlik, tokluk ve uzun sureli enerji katar.',
  },
  Legumes: {
    en: 'BUFFS: Fiber-rich plant protein for steady energy, fullness, and digestive support.',
    tr: 'ETKILER: Lifli bitkisel protein saglar. Dengeli enerji, tokluk ve sindirim destegi icin iyidir.',
  },
  Baking: {
    en: 'BUFFS: Structure and transformation ingredient. Helps texture, rise, sweetness, or body depending on the spell.',
    tr: 'ETKILER: Yapi ve donusum malzemesi. Doku, kabarma, tatlilik veya govde kazandirmaya yardim eder.',
  },
  Liquids: {
    en: 'BUFFS: Hydration and body for the recipe. Carries flavor, loosens texture, and helps ingredients combine.',
    tr: 'ETKILER: Tarife nem ve govde verir. Aromayi tasir, dokuyu acar ve malzemelerin birlesmesine yardim eder.',
  },
};

const BUFF_OVERRIDES: Record<string, LocalizedBuffText> = {
  beef: {
    en: 'BUFFS: High protein supports muscle repair and satiety. Iron and B12 help with energy, focus, and healthy blood. Best for strength-heavy meals.',
    tr: 'ETKILER: Yuksek protein kas onarimi ve toklugu destekler. Demir ve B12 enerji, odak ve saglikli kan icin yardimcidir. Guc odakli yemeklerde cok iyi calisir.',
  },
  ground_beef: {
    en: 'BUFFS: High protein supports muscle repair and satiety. Iron and B12 help with energy, focus, and healthy blood. Best for strength-heavy meals.',
    tr: 'ETKILER: Yuksek protein kas onarimi ve toklugu destekler. Demir ve B12 enerji, odak ve saglikli kan icin yardimcidir. Guc odakli yemeklerde cok iyi calisir.',
  },
  chicken: { en: 'BUFFS: Lean protein for clean recovery and steady fullness. Good when you want strength without too much fat.', tr: 'ETKILER: Yagsiz protein temiz toparlanma ve dengeli tokluk saglar. Fazla yag olmadan guc istendiginde iyidir.' },
  egg: { en: 'BUFFS: Compact protein with choline and healthy fats. Great for breakfast power, binding, and recovery meals.', tr: 'ETKILER: Kolin ve saglikli yaglarla kompakt protein kaynagi. Kahvalti gucu, baglayicilik ve toparlanma yemekleri icin iyidir.' },
  salmon: { en: 'BUFFS: Protein plus omega-3 fats for heart, brain, and anti-inflammatory support. A premium focus-and-recovery ingredient.', tr: 'ETKILER: Protein ve omega-3 yaglari kalp, beyin ve toparlanma destegi verir. Odak ve iyilesme icin guclu bir malzemedir.' },
  garlic: { en: 'BUFFS: Powerful aromatic with sulfur compounds. Supports heart-friendly meals and adds defensive flavor magic.', tr: 'ETKILER: Kükürtlü bilesenler tasiyan guclu aromatik. Kalp dostu yemekleri destekler ve koruyucu aroma buyusu katar.' },
  tomato: { en: 'BUFFS: Light, juicy, and rich in lycopene. Adds brightness, acidity, and antioxidant support.', tr: 'ETKILER: Hafif, sulu ve likopen acisindan zengindir. Canlilik, asidite ve antioksidan destegi katar.' },
  spinach: { en: 'BUFFS: Leafy green with iron, folate, and magnesium. Good for vitality, balance, and green power.', tr: 'ETKILER: Demir, folat ve magnezyum iceren yesil yaprakli guc. Canlilik, denge ve yesil enerji icin iyidir.' },
  olive_oil: { en: 'BUFFS: Monounsaturated fat for heart-friendly richness. Helps carry flavor and absorb fat-soluble nutrients.', tr: 'ETKILER: Kalp dostu zenginlik icin tekli doymamis yag kaynagi. Aromayi tasir ve yagda cozunen besinlerin emilimine yardim eder.' },
  lemon: { en: 'BUFFS: Bright acid and vitamin C. Sharpens flavor and helps heavy dishes feel lighter.', tr: 'ETKILER: Parlak asit ve C vitamini verir. Tadi keskinlestirir ve agir yemekleri hafifletir.' },
  ginger: { en: 'BUFFS: Warming spice with digestive support. Adds heat, brightness, and soothing energy.', tr: 'ETKILER: Sindirimi destekleyen isiticı baharat. Sicaklik, canlilik ve rahatlatan enerji katar.' },
  lentils: { en: 'BUFFS: Plant protein plus fiber and iron. Excellent for steady energy and hearty vegetarian strength.', tr: 'ETKILER: Bitkisel protein, lif ve demir saglar. Dengeli enerji ve doyurucu vejetaryen guc icin cok iyidir.' },
  water: { en: 'BUFFS: Pure hydration and texture control. The quiet base that lets every other ingredient work.', tr: 'ETKILER: Saf hidrasyon ve doku kontrolu saglar. Diger malzemelerin calismasini saglayan sessiz temeldir.' },
};

export const INGREDIENT_BUFFS = INGREDIENTS.reduce<Record<string, IngredientBuff>>((record, ingredient) => {
  const buff = BUFF_OVERRIDES[ingredient.id] ?? CATEGORY_BUFFS[ingredient.category] ?? {
    en: 'BUFFS: Adds flavor and useful nutrition to the recipe.',
    tr: 'ETKILER: Tarife aroma ve faydali besin destegi ekler.',
  };
  record[ingredient.id] = {
    id: ingredient.id,
    text: buff.en,
    textTr: buff.tr,
  };
  return record;
}, {});
