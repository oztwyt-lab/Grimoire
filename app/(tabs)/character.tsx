import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, getCountFromServer, query, where } from '@firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { getCharacterRank, getLevelProgress, CharacterRank } from '../../src/data/character';
import { RANK_TITLE_KEY, StringKey } from '../../src/i18n/strings';
import {
  DEFAULT_EQUIPMENT,
  Equipment,
  EquipmentItem,
  EquipmentSlot,
  STARTER_ITEMS,
  getUserEquipment,
  getUserProfile,
} from '../../lib/firestore';

const WIZARD_IDLE_SHEET = require('../../assets/characters/wizard_character/mage_idle.png');
const WIZARD_IDLE_FRAMES = 7;
const WIZARD_DISPLAY_W = 92;
const WIZARD_DISPLAY_H = 92;

type Profile = { nickname: string; character: string };

const SLOT_PLACEHOLDER: Record<EquipmentSlot, string> = {
  hat: 'HAT',
  outfit: 'OUT',
  cloak: 'CLK',
  staff: 'STF',
  accessory1: 'ACC',
  accessory2: 'ACC',
  pet: 'PET',
};

const SLOT_LABEL_KEY: Record<EquipmentSlot, StringKey> = {
  hat: 'slot_hat',
  outfit: 'slot_outfit',
  cloak: 'slot_cloak',
  staff: 'slot_staff',
  accessory1: 'slot_accessory',
  accessory2: 'slot_accessory',
  pet: 'slot_pet',
};

function EquipmentVisual({ item, imageStyle }: { item: EquipmentItem; imageStyle?: object }) {
  return item.image ? (
    <Image source={item.image as never} style={[s.itemImage, imageStyle]} resizeMode="contain" />
  ) : (
    <Text style={s.slotIcon}>{item.icon}</Text>
  );
}

function SlotButton({ slotKey, equippedId }: { slotKey: EquipmentSlot; equippedId: string | null }) {
  const { t } = useLanguage();
  const item = equippedId ? STARTER_ITEMS.find(row => row.id === equippedId) ?? null : null;

  return (
    <View style={[s.slot, item ? s.slotEquipped : s.slotEmpty]}>
      {item ? (
        <EquipmentVisual item={item} />
      ) : (
        <Text style={s.slotPlaceholder}>{SLOT_PLACEHOLDER[slotKey]}</Text>
      )}
      <Text style={s.slotLabel}>{t(SLOT_LABEL_KEY[slotKey])}</Text>
    </View>
  );
}

export default function Character() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recipeCount, setRecipeCount] = useState(0);
  const [equipment, setEquipment] = useState<Equipment>({ ...DEFAULT_EQUIPMENT });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);

      const load = async () => {
        try {
          const [profileSnap, eq, countSnap] = await Promise.all([
            getUserProfile(user.uid),
            getUserEquipment(user.uid),
            getCountFromServer(query(collection(db, 'recipes'), where('userId', '==', user.uid))),
          ]);
          if (profileSnap) setProfile(profileSnap as Profile);
          setEquipment(eq);
          setRecipeCount(countSnap.data().count);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      load();
    }, [user])
  );

  const rank: CharacterRank = getCharacterRank(recipeCount);
  const progress = getLevelProgress(recipeCount, rank);
  const progressPct = Math.round(progress * 100);
  const equippedHat = equipment.hat ? STARTER_ITEMS.find(item => item.id === equipment.hat) ?? null : null;
  const equippedStaff = equipment.staff ? STARTER_ITEMS.find(item => item.id === equipment.staff) ?? null : null;
  const equippedPet = equipment.pet ? STARTER_ITEMS.find(item => item.id === equipment.pet) ?? null : null;

  if (loading) {
    return <ActivityIndicator style={s.loader} color="#e2b96f" />;
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 56 }]}>
      <Text style={s.title}>{t('character_title')}</Text>

      <View style={s.archivedPanel}>
        <Text style={s.archivedTitle}>{t('character_coming_soon')}</Text>
        <Text style={s.archivedText}>
          {language === 'tr'
            ? 'Kozmetik dukkan ve ekipman degistirme ic test icin arsivlendi.'
            : 'Cosmetic shop and equipment changes are archived for internal testing.'}
        </Text>
      </View>

      <View style={s.profileCard}>
        <Text style={s.nickname}>{profile?.nickname ?? '-'}</Text>
        <Text style={s.rankLabel}>
          {RANK_TITLE_KEY[rank.title] ? t(RANK_TITLE_KEY[rank.title] as StringKey) : rank.title}
          {'  '}LV.{rank.level}
        </Text>
        <View style={s.xpTrack}>
          <View style={[s.xpFill, { width: `${progressPct}%` as `${number}%` }]} />
        </View>
        <Text style={s.xpLabel}>
          {recipeCount} {t('home_recipes')}
          {rank.nextTitle ? `  ->  ${rank.nextLevelRecipes! - recipeCount} ${t('grimoire_to')} ${t(RANK_TITLE_KEY[rank.nextTitle] as StringKey)}` : ''}
        </Text>
      </View>

      <View style={s.equipSection}>
        <View style={s.hatRow}>
          <SlotButton slotKey="hat" equippedId={equipment.hat} />
        </View>

        <View style={s.midRow}>
          <View style={s.slotCol}>
            <SlotButton slotKey="outfit" equippedId={equipment.outfit} />
            <View style={s.slotGap} />
            <SlotButton slotKey="staff" equippedId={equipment.staff} />
          </View>

          <View style={s.spriteContainer}>
            <View style={s.spriteFrame}>
              <Image source={WIZARD_IDLE_SHEET} style={s.spriteImage} resizeMode="stretch" />
              {equippedHat?.image ? <Image source={equippedHat.image as never} style={s.spriteHat} resizeMode="contain" /> : null}
              {equippedStaff?.image ? <Image source={equippedStaff.image as never} style={s.spriteStaff} resizeMode="contain" /> : null}
            </View>
          </View>

          <View style={s.slotCol}>
            <SlotButton slotKey="cloak" equippedId={equipment.cloak} />
            <View style={s.slotGap} />
            <SlotButton slotKey="accessory1" equippedId={equipment.accessory1} />
            <View style={s.slotGap} />
            <SlotButton slotKey="accessory2" equippedId={equipment.accessory2} />
          </View>
        </View>

        <View style={s.petRow}>
          <SlotButton slotKey="pet" equippedId={equipment.pet} />
          {equippedPet?.image ? (
            <View style={s.petPreview}>
              <EquipmentVisual item={equippedPet} imageStyle={s.petImage} />
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const SLOT_SIZE = 56;

const s = {
  loader: { flex: 1, backgroundColor: '#16213e' } as const,
  container: { flex: 1, backgroundColor: '#16213e' } as const,
  content: { padding: 24, paddingTop: 60, paddingBottom: 48 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 16, marginBottom: 20 } as const,
  archivedPanel: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#4a4a6a', padding: 14, marginBottom: 18 } as const,
  archivedTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 9, marginBottom: 10 } as const,
  archivedText: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7, lineHeight: 15 } as const,
  profileCard: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', padding: 16, marginBottom: 24 } as const,
  nickname: { fontFamily: 'PressStart2P_400Regular', color: '#c8a84b', fontSize: 12, marginBottom: 8 } as const,
  rankLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, marginBottom: 12 } as const,
  xpTrack: { height: 6, backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', marginBottom: 6 } as const,
  xpFill: { height: '100%' as const, backgroundColor: '#e2b96f' },
  xpLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, lineHeight: 14 } as const,
  equipSection: { alignItems: 'center' as const, marginBottom: 24 },
  hatRow: { marginBottom: 8 } as const,
  midRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 10 },
  slotCol: { alignItems: 'center' as const },
  slotGap: { height: 8 },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderWidth: 1,
    borderColor: '#2d2d4e',
    backgroundColor: '#1a1a2e',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 4,
    opacity: 0.55,
  },
  slotEmpty: { borderColor: '#2d2d4e' },
  slotEquipped: { borderColor: '#c8a84b' },
  slotIcon: { fontSize: 20 },
  slotPlaceholder: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 6, marginBottom: 4 },
  slotLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 5, textAlign: 'center' as const, marginTop: 3 },
  itemImage: { width: 30, height: 30 },
  spriteContainer: { alignItems: 'center' as const, justifyContent: 'center' as const },
  spriteFrame: {
    width: WIZARD_DISPLAY_W,
    height: WIZARD_DISPLAY_H,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  spriteImage: { width: WIZARD_DISPLAY_W * WIZARD_IDLE_FRAMES, height: WIZARD_DISPLAY_H },
  spriteHat: { position: 'absolute' as const, top: 2, left: 31, width: 28, height: 24, zIndex: 3 },
  spriteStaff: { position: 'absolute' as const, right: 2, bottom: 13, width: 34, height: 44, zIndex: 3 },
  petRow: { marginTop: 8, alignItems: 'center' as const },
  petPreview: { marginTop: 8, borderWidth: 1, borderColor: '#2d2d4e', padding: 8, backgroundColor: '#1a1a2e' },
  petImage: { width: 44, height: 44 },
};
