import { useCallback, useState } from 'react';
import {
  Text, View, ScrollView, Modal, Pressable, Image,
  ActivityIndicator, FlatList,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getCountFromServer } from '@firebase/firestore';
import { getCharacterRank, getLevelProgress, CharacterRank } from '../../src/data/character';
import { RANK_TITLE_KEY, RANK_FLAVOR_KEY, StringKey } from '../../src/i18n/strings';
import PressableScale from '../../src/components/PressableScale';
import {
  Equipment, EquipmentItem, EquipmentSlot,
  DEFAULT_EQUIPMENT, STARTER_ITEMS,
  getUserEquipment, saveUserEquipment, getUserOwnedItems,
} from '../../lib/firestore';

const WIZARD_IDLE_SHEET = require('../../assets/characters/wizard_character/mage_idle.png');
const WIZARD_IDLE_FRAMES = 7;
const WIZARD_DISPLAY_W = 92;
const WIZARD_DISPLAY_H = 92;

// ─── Types ────────────────────────────────────────────────────────────────────
type Profile = { nickname: string; character: string };

type ModalState = {
  item: EquipmentItem | null;
  slot: EquipmentSlot;
} | null;

// ─── Slot metadata ────────────────────────────────────────────────────────────
const SLOT_PLACEHOLDER: Record<EquipmentSlot, string> = {
  hat: '🎩',
  outfit: '🧥',
  cloak: '🌪️',
  staff: '🪄',
  accessory1: '💍',
  accessory2: '💍',
};

const SLOT_LABEL_KEY: Record<EquipmentSlot, StringKey> = {
  hat: 'slot_hat',
  outfit: 'slot_outfit',
  cloak: 'slot_cloak',
  staff: 'slot_staff',
  accessory1: 'slot_accessory',
  accessory2: 'slot_accessory',
};

// ─── SlotButton ───────────────────────────────────────────────────────────────
type SlotButtonProps = {
  slotKey: EquipmentSlot;
  equippedId: string | null;
  onPress: () => void;
};

function SlotButton({ slotKey, equippedId, onPress }: SlotButtonProps) {
  const { t } = useLanguage();
  const item = equippedId ? STARTER_ITEMS.find(i => i.id === equippedId) ?? null : null;
  return (
    <PressableScale onPress={onPress}>
      <View style={[cStyles.slot, item ? cStyles.slotEquipped : cStyles.slotEmpty]}>
        <Text style={[cStyles.slotIcon, !item && cStyles.slotIconDim]}>
          {item ? item.icon : SLOT_PLACEHOLDER[slotKey]}
        </Text>
        <Text style={cStyles.slotLabel}>{t(SLOT_LABEL_KEY[slotKey])}</Text>
      </View>
    </PressableScale>
  );
}

// ─── Locked pet slot ──────────────────────────────────────────────────────────
function PetSlot() {
  const { t } = useLanguage();
  return (
    <View style={[cStyles.slot, cStyles.slotLocked]}>
      <Text style={cStyles.slotIconDim}>🔒</Text>
      <Text style={cStyles.slotLabel}>{t('slot_pet')}</Text>
    </View>
  );
}

// ─── Character screen ─────────────────────────────────────────────────────────
export default function Character() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [recipeCount, setRecipeCount] = useState(0);
  const [equipment, setEquipment] = useState<Equipment>({ ...DEFAULT_EQUIPMENT });
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<ModalState>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      const load = async () => {
        try {
          const [profileSnap, eq, owned, countSnap] = await Promise.all([
            getDoc(doc(db, 'profiles', user.uid)),
            getUserEquipment(user.uid),
            getUserOwnedItems(user.uid),
            getCountFromServer(query(collection(db, 'recipes'), where('userId', '==', user.uid))),
          ]);
          if (profileSnap.exists()) setProfile(profileSnap.data() as Profile);
          setEquipment(eq);
          setOwnedItemIds(owned);
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

  // Items the user owns (from catalog, filtered by ownedItemIds)
  const ownedItems = STARTER_ITEMS.filter(i => ownedItemIds.includes(i.id));

  // Unequipped owned items (appear in bottom row)
  const unequippedItems = ownedItems.filter(item => equipment[item.slot] !== item.id);

  const handleSlotPress = (slot: EquipmentSlot) => {
    const equippedId = equipment[slot];
    if (equippedId) {
      const item = STARTER_ITEMS.find(i => i.id === equippedId) ?? null;
      setModalState({ item, slot });
    } else {
      const candidate = ownedItems.find(i => i.slot === slot && equipment[i.slot] !== i.id) ?? null;
      setModalState({ item: candidate, slot });
    }
  };

  const handleItemPress = (item: EquipmentItem) => {
    setModalState({ item, slot: item.slot });
  };

  const handleEquip = () => {
    if (!modalState?.item) return;
    const next: Equipment = { ...equipment, [modalState.slot]: modalState.item.id };
    setEquipment(next);
    setModalState(null);
    if (user) saveUserEquipment(user.uid, next).catch(console.error);
  };

  const handleUnequip = () => {
    if (!modalState) return;
    const next: Equipment = { ...equipment, [modalState.slot]: null };
    setEquipment(next);
    setModalState(null);
    if (user) saveUserEquipment(user.uid, next).catch(console.error);
  };

  const isEquipped = modalState?.item
    ? equipment[modalState.slot] === modalState.item.id
    : false;

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: '#16213e' }} color="#e2b96f" />;

  return (
    <ScrollView style={cStyles.container} contentContainerStyle={cStyles.content}>

      {/* ─── Player info ────────────────────────────────────────────────────── */}
      <Text style={cStyles.title}>{t('character_title')}</Text>
      <View style={cStyles.profileCard}>
        <Text style={cStyles.nickname}>{profile?.nickname ?? '—'}</Text>
        <Text style={cStyles.rankLabel}>
          {RANK_TITLE_KEY[rank.title] ? t(RANK_TITLE_KEY[rank.title] as StringKey) : rank.title}
          {'  '}LV.{rank.level}
        </Text>
        <View style={cStyles.xpTrack}>
          <View style={[cStyles.xpFill, { width: `${progressPct}%` as `${number}%` }]} />
        </View>
        <Text style={cStyles.xpLabel}>
          {recipeCount} {t('home_recipes')}
          {rank.nextTitle ? `  →  ${rank.nextLevelRecipes! - recipeCount} ${t('grimoire_to')} ${t(RANK_TITLE_KEY[rank.nextTitle] as StringKey)}` : ''}
        </Text>
      </View>

      {/* ─── Equipment grid ──────────────────────────────────────────────────── */}
      <View style={cStyles.equipSection}>

        {/* HAT — centered above */}
        <View style={cStyles.hatRow}>
          <SlotButton
            slotKey="hat"
            equippedId={equipment.hat}
            onPress={() => handleSlotPress('hat')}
          />
        </View>

        {/* Middle row: left slots | character | right slots */}
        <View style={cStyles.midRow}>

          {/* Left column: OUTFIT + STAFF */}
          <View style={cStyles.slotCol}>
            <SlotButton slotKey="outfit" equippedId={equipment.outfit} onPress={() => handleSlotPress('outfit')} />
            <View style={cStyles.slotGap} />
            <SlotButton slotKey="staff" equippedId={equipment.staff} onPress={() => handleSlotPress('staff')} />
          </View>

          {/* Character sprite */}
          <View style={cStyles.spriteContainer}>
            <View style={cStyles.spriteFrame}>
              <Image source={WIZARD_IDLE_SHEET} style={cStyles.spriteImage} resizeMode="stretch" />
            </View>
          </View>

          {/* Right column: CLOAK + ACC1 + ACC2 */}
          <View style={cStyles.slotCol}>
            <SlotButton slotKey="cloak" equippedId={equipment.cloak} onPress={() => handleSlotPress('cloak')} />
            <View style={cStyles.slotGap} />
            <SlotButton slotKey="accessory1" equippedId={equipment.accessory1} onPress={() => handleSlotPress('accessory1')} />
            <View style={cStyles.slotGap} />
            <SlotButton slotKey="accessory2" equippedId={equipment.accessory2} onPress={() => handleSlotPress('accessory2')} />
          </View>

        </View>

        {/* PET — locked, centered below */}
        <View style={cStyles.petRow}>
          <PetSlot />
        </View>

      </View>

      {/* ─── Owned / unequipped items ─────────────────────────────────────────── */}
      {unequippedItems.length > 0 && (
        <View style={cStyles.ownedSection}>
          <Text style={cStyles.ownedLabel}>{t('character_owned')}</Text>
          <FlatList
            horizontal
            data={unequippedItems}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={cStyles.ownedList}
            renderItem={({ item }) => (
              <PressableScale onPress={() => handleItemPress(item)}>
                <View style={[cStyles.slot, cStyles.slotEmpty]}>
                  <Text style={cStyles.slotIcon}>{item.icon}</Text>
                  <Text style={cStyles.slotLabel}>
                    {language === 'tr' ? item.name.split(' ')[0] : item.nameEn.split(' ')[0]}
                  </Text>
                </View>
              </PressableScale>
            )}
          />
        </View>
      )}

      {/* ─── Equip / unequip modal ────────────────────────────────────────────── */}
      <Modal
        visible={modalState !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModalState(null)}
      >
        <View style={cStyles.modalContainer}>
          <Pressable style={cStyles.modalBackdrop} onPress={() => setModalState(null)} />
          <View style={cStyles.modalSheet}>
            {modalState?.item ? (
              <>
                <Text style={cStyles.modalIcon}>{modalState.item.icon}</Text>
                <Text style={cStyles.modalItemName}>
                  {language === 'tr' ? modalState.item.name : modalState.item.nameEn}
                </Text>
                <Text style={cStyles.modalItemDesc}>
                  {language === 'tr' ? modalState.item.description : modalState.item.descriptionEn}
                </Text>
                {isEquipped ? (
                  <PressableScale onPress={handleUnequip}>
                    <View style={cStyles.unequipBtn}>
                      <Text style={cStyles.unequipBtnText}>{t('character_unequip')}</Text>
                    </View>
                  </PressableScale>
                ) : (
                  <PressableScale onPress={handleEquip}>
                    <View style={cStyles.equipBtn}>
                      <Text style={cStyles.equipBtnText}>{t('character_equip')}</Text>
                    </View>
                  </PressableScale>
                )}
              </>
            ) : (
              <Text style={cStyles.noItemsText}>{t('character_no_items')}</Text>
            )}
            <Pressable onPress={() => setModalState(null)} style={cStyles.modalClose}>
              <Text style={cStyles.modalCloseText}>✕</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const SLOT_SIZE = 56;

const cStyles = {
  container: { flex: 1, backgroundColor: '#16213e' } as const,
  content: { padding: 24, paddingTop: 60, paddingBottom: 48 } as const,

  // Profile
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 16, marginBottom: 20 } as const,
  profileCard: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', padding: 16, marginBottom: 24 } as const,
  nickname: { fontFamily: 'PressStart2P_400Regular', color: '#c8a84b', fontSize: 12, marginBottom: 8 } as const,
  rankLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, marginBottom: 12 } as const,
  xpTrack: { height: 6, backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', marginBottom: 6 } as const,
  xpFill: { height: '100%' as const, backgroundColor: '#e2b96f' },
  xpLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, lineHeight: 14 } as const,

  // Equipment grid
  equipSection: { alignItems: 'center' as const, marginBottom: 24 },
  hatRow: { marginBottom: 8 } as const,
  midRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 8 },
  slotCol: { flexDirection: 'column' as const },
  slotGap: { height: 8 } as const,
  spriteContainer: {
    width: 100,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 4,
  },
  spriteFrame: {
    width: WIZARD_DISPLAY_W,
    height: WIZARD_DISPLAY_H,
    overflow: 'hidden' as const,
  },
  spriteImage: {
    width: WIZARD_DISPLAY_W * WIZARD_IDLE_FRAMES,
    height: WIZARD_DISPLAY_H,
  } as const,
  petRow: { marginTop: 8 } as const,

  // Slot card
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE + 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 4,
    borderWidth: 1,
    padding: 4,
  },
  slotEmpty: { backgroundColor: '#1a1a2e', borderColor: '#2a2a4a' } as const,
  slotEquipped: { backgroundColor: '#1a1a2e', borderColor: '#c8a84b' } as const,
  slotLocked: { backgroundColor: '#141428', borderColor: '#1e1e38', opacity: 0.6 } as const,
  slotIcon: { fontSize: 22, marginBottom: 2 } as const,
  slotIconDim: { opacity: 0.3 } as const,
  slotLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 5 } as const,

  // Owned items
  ownedSection: { marginBottom: 16 } as const,
  ownedLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, marginBottom: 12 } as const,
  ownedList: { gap: 10 } as const,

  // Modal
  modalContainer: { flex: 1, justifyContent: 'flex-end' as const },
  modalBackdrop: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  modalSheet: {
    backgroundColor: '#16213e',
    borderTopWidth: 1,
    borderTopColor: '#2d2d4e',
    padding: 28,
    paddingBottom: 48,
    alignItems: 'center' as const,
  },
  modalIcon: { fontSize: 64, marginBottom: 12 } as const,
  modalItemName: { fontFamily: 'PressStart2P_400Regular', color: '#c8a84b', fontSize: 11, marginBottom: 8, textAlign: 'center' as const } as const,
  modalItemDesc: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, marginBottom: 24, textAlign: 'center' as const, lineHeight: 14 } as const,
  equipBtn: { borderWidth: 2, borderColor: '#c8a84b', paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12 } as const,
  equipBtnText: { fontFamily: 'PressStart2P_400Regular', color: '#c8a84b', fontSize: 10 } as const,
  unequipBtn: { borderWidth: 1, borderColor: '#4a4a6a', paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12 } as const,
  unequipBtnText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 10 } as const,
  noItemsText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 20, textAlign: 'center' as const } as const,
  modalClose: { marginTop: 4 } as const,
  modalCloseText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 10 } as const,
};
