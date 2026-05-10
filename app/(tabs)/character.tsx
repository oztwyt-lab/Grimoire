import { useCallback, useState } from 'react';
import {
  Text, View, ScrollView, Modal, Pressable, Image,
  ActivityIndicator, FlatList,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { db } from '../../firebase';
import { collection, query, where, getCountFromServer } from '@firebase/firestore';
import { getCharacterRank, getLevelProgress, CharacterRank } from '../../src/data/character';
import { RANK_TITLE_KEY, RANK_FLAVOR_KEY, StringKey } from '../../src/i18n/strings';
import PressableScale from '../../src/components/PressableScale';
import {
  Equipment, EquipmentItem, EquipmentSlot,
  DEFAULT_EQUIPMENT, STARTER_ITEMS,
  addUserOwnedItem, getUserEquipment, saveUserEquipment, getUserOwnedItems, getUserProfile,
} from '../../lib/firestore';

const WIZARD_IDLE_SHEET = require('../../assets/characters/wizard_character/mage_idle.png');
const WIZARD_IDLE_FRAMES = 7;
const WIZARD_DISPLAY_W = 92;
const WIZARD_DISPLAY_H = 92;

// ─── Types ────────────────────────────────────────────────────────────────────
type Profile = { nickname: string; character: string };
type CharacterTab = 'character' | 'shop';

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
  pet: '🐢',
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

const SHOP_ITEMS = STARTER_ITEMS.filter(item => !item.isStarter);

function itemName(item: EquipmentItem, language: string) {
  return language === 'tr' ? item.name : item.nameEn;
}

function itemDescription(item: EquipmentItem, language: string) {
  return language === 'tr' ? item.description : item.descriptionEn;
}

function EquipmentVisual({ item, imageStyle }: { item: EquipmentItem; imageStyle?: object }) {
  return item.image ? (
    <Image source={item.image as never} style={[cStyles.itemImage, imageStyle]} resizeMode="contain" />
  ) : (
    <Text style={cStyles.slotIcon}>{item.icon}</Text>
  );
}

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
        {item ? (
          <EquipmentVisual item={item} />
        ) : (
          <Text style={[cStyles.slotIcon, cStyles.slotIconDim]}>{SLOT_PLACEHOLDER[slotKey]}</Text>
        )}
        <Text style={cStyles.slotLabel}>{t(SLOT_LABEL_KEY[slotKey])}</Text>
      </View>
    </PressableScale>
  );
}

// ─── Character screen ─────────────────────────────────────────────────────────
export default function Character() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [recipeCount, setRecipeCount] = useState(0);
  const [equipment, setEquipment] = useState<Equipment>({ ...DEFAULT_EQUIPMENT });
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [activeTab, setActiveTab] = useState<CharacterTab>('character');
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      const load = async () => {
        try {
          const [profileSnap, eq, owned, countSnap] = await Promise.all([
            getUserProfile(user.uid),
            getUserEquipment(user.uid),
            getUserOwnedItems(user.uid),
            getCountFromServer(query(collection(db, 'recipes'), where('userId', '==', user.uid))),
          ]);
          if (profileSnap) setProfile(profileSnap as Profile);
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
  const equippedHat = equipment.hat ? STARTER_ITEMS.find(i => i.id === equipment.hat) ?? null : null;
  const equippedStaff = equipment.staff ? STARTER_ITEMS.find(i => i.id === equipment.staff) ?? null : null;
  const equippedPet = equipment.pet ? STARTER_ITEMS.find(i => i.id === equipment.pet) ?? null : null;

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

  async function handleUnlock(item: EquipmentItem) {
    if (!user || ownedItemIds.includes(item.id) || unlockingId) return;
    setUnlockingId(item.id);
    try {
      await addUserOwnedItem(user.uid, item.id);
      setOwnedItemIds(current => current.includes(item.id) ? current : [...current, item.id]);
    } catch (error) {
      console.error(error);
    } finally {
      setUnlockingId(null);
    }
  }

  const isEquipped = modalState?.item
    ? equipment[modalState.slot] === modalState.item.id
    : false;

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: '#16213e' }} color="#e2b96f" />;

  const characterContent = (
    <>
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

      <View style={cStyles.equipSection}>
        <View style={cStyles.hatRow}>
          <SlotButton
            slotKey="hat"
            equippedId={equipment.hat}
            onPress={() => handleSlotPress('hat')}
          />
        </View>

        <View style={cStyles.midRow}>
          <View style={cStyles.slotCol}>
            <SlotButton slotKey="outfit" equippedId={equipment.outfit} onPress={() => handleSlotPress('outfit')} />
            <View style={cStyles.slotGap} />
            <SlotButton slotKey="staff" equippedId={equipment.staff} onPress={() => handleSlotPress('staff')} />
          </View>

          <View style={cStyles.spriteContainer}>
            <View style={cStyles.spriteFrame}>
              <Image source={WIZARD_IDLE_SHEET} style={cStyles.spriteImage} resizeMode="stretch" />
              {equippedHat?.image ? (
                <Image source={equippedHat.image as never} style={cStyles.spriteHat} resizeMode="contain" />
              ) : null}
              {equippedStaff?.image ? (
                <Image source={equippedStaff.image as never} style={cStyles.spriteStaff} resizeMode="contain" />
              ) : null}
            </View>
          </View>

          <View style={cStyles.slotCol}>
            <SlotButton slotKey="cloak" equippedId={equipment.cloak} onPress={() => handleSlotPress('cloak')} />
            <View style={cStyles.slotGap} />
            <SlotButton slotKey="accessory1" equippedId={equipment.accessory1} onPress={() => handleSlotPress('accessory1')} />
            <View style={cStyles.slotGap} />
            <SlotButton slotKey="accessory2" equippedId={equipment.accessory2} onPress={() => handleSlotPress('accessory2')} />
          </View>
        </View>

        <View style={cStyles.petRow}>
          <SlotButton slotKey="pet" equippedId={equipment.pet} onPress={() => handleSlotPress('pet')} />
          {equippedPet?.image ? (
            <View style={cStyles.petPreview}>
              <EquipmentVisual item={equippedPet} imageStyle={cStyles.petImage} />
            </View>
          ) : null}
        </View>
      </View>

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
                  <EquipmentVisual item={item} />
                  <Text style={cStyles.slotLabel}>
                    {language === 'tr' ? item.name.split(' ')[0] : item.nameEn.split(' ')[0]}
                  </Text>
                </View>
              </PressableScale>
            )}
          />
        </View>
      )}
    </>
  );

  const shopContent = (
    <View style={cStyles.shopSection}>
      <Text style={cStyles.shopTitle}>{t('shop_title')}</Text>
      <Text style={cStyles.shopSubtitle}>{t('shop_subtitle')}</Text>
      <View style={cStyles.shopGrid}>
        {SHOP_ITEMS.map(item => {
          const owned = ownedItemIds.includes(item.id);
          const unlocking = unlockingId === item.id;

          return (
            <View key={item.id} style={[cStyles.shopCard, owned && cStyles.shopCardOwned]}>
              <View style={cStyles.shopIconBox}>
                {item.image ? (
                  <Image source={item.image as never} style={cStyles.shopItemImage} resizeMode="contain" />
                ) : (
                  <Text style={cStyles.shopIcon}>{item.icon}</Text>
                )}
              </View>
              <Text style={cStyles.shopItemTitle}>{itemName(item, language)}</Text>
              <Text style={cStyles.shopItemDesc}>{itemDescription(item, language)}</Text>
              <PressableScale
                disabled={owned || unlocking}
                onPress={() => handleUnlock(item)}
                style={cStyles.shopButtonWrap}
              >
                <View style={[cStyles.shopButton, owned && cStyles.shopButtonOwned, unlocking && cStyles.shopButtonMuted]}>
                  <Text style={[cStyles.shopButtonText, owned && cStyles.shopButtonOwnedText]}>
                    {owned ? t('shop_owned') : unlocking ? '...' : t('shop_unlock')}
                  </Text>
                </View>
              </PressableScale>
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <ScrollView style={cStyles.container} contentContainerStyle={[cStyles.content, { paddingBottom: insets.bottom + 56 }]}>

      {/* ─── Player info ────────────────────────────────────────────────────── */}
      <Text style={cStyles.title}>{t('character_title')}</Text>
      <View style={cStyles.tabs}>
        <PressableScale onPress={() => setActiveTab('character')} style={[cStyles.tab, activeTab === 'character' && cStyles.tabActive]}>
          <Text style={[cStyles.tabText, activeTab === 'character' && cStyles.tabTextActive]}>{t('character_title')}</Text>
        </PressableScale>
        <PressableScale onPress={() => setActiveTab('shop')} style={[cStyles.tab, activeTab === 'shop' && cStyles.tabActive]}>
          <Text style={[cStyles.tabText, activeTab === 'shop' && cStyles.tabTextActive]}>{t('nav_shop')}</Text>
        </PressableScale>
      </View>

      {activeTab === 'shop' && shopContent}
      {activeTab === 'character' && (
      <>
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
              {equippedHat?.image ? (
                <Image source={equippedHat.image as never} style={cStyles.spriteHat} resizeMode="contain" />
              ) : null}
              {equippedStaff?.image ? (
                <Image source={equippedStaff.image as never} style={cStyles.spriteStaff} resizeMode="contain" />
              ) : null}
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
          <SlotButton slotKey="pet" equippedId={equipment.pet} onPress={() => handleSlotPress('pet')} />
          {equippedPet?.image ? (
            <View style={cStyles.petPreview}>
              <EquipmentVisual item={equippedPet} imageStyle={cStyles.petImage} />
            </View>
          ) : null}
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
                  <EquipmentVisual item={item} />
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
      </>
      )}

      <Modal
        visible={modalState !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModalState(null)}
      >
        <View style={cStyles.modalContainer}>
          <Pressable style={cStyles.modalBackdrop} onPress={() => setModalState(null)} />
          <View style={[cStyles.modalSheet, { paddingBottom: insets.bottom + 48 }]}>
            {modalState?.item ? (
              <>
                {modalState.item.image ? (
                  <Image source={modalState.item.image as never} style={cStyles.modalImage} resizeMode="contain" />
                ) : (
                  <Text style={cStyles.modalIcon}>{modalState.item.icon}</Text>
                )}
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
  tabs: { flexDirection: 'row' as const, borderWidth: 1, borderColor: '#2d2d4e', marginBottom: 18 },
  tab: { flex: 1, alignItems: 'center' as const, paddingVertical: 11, backgroundColor: '#1a1a2e' },
  tabActive: { backgroundColor: '#c8a84b' },
  tabText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },
  tabTextActive: { color: '#1a1a2e' },
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
    position: 'relative' as const,
  },
  spriteImage: {
    width: WIZARD_DISPLAY_W * WIZARD_IDLE_FRAMES,
    height: WIZARD_DISPLAY_H,
  } as const,
  spriteHat: { position: 'absolute' as const, top: 2, left: 31, width: 28, height: 24, zIndex: 3 },
  spriteStaff: { position: 'absolute' as const, right: 2, bottom: 13, width: 34, height: 44, zIndex: 3 },
  petRow: { marginTop: 8, alignItems: 'center' as const, gap: 8 } as const,
  petPreview: { width: 56, height: 36, alignItems: 'center' as const, justifyContent: 'center' as const },
  petImage: { width: 44, height: 32 },

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
  itemImage: { width: 30, height: 30, marginBottom: 2 },
  slotLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 5 } as const,

  // Owned items
  ownedSection: { marginBottom: 16 } as const,
  ownedLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, marginBottom: 12 } as const,
  ownedList: { gap: 10 } as const,

  // Shop
  shopSection: { marginBottom: 16 } as const,
  shopTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 14, marginBottom: 12 } as const,
  shopSubtitle: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 17, marginBottom: 16 } as const,
  shopGrid: { gap: 12 },
  shopCard: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', padding: 16 },
  shopCardOwned: { borderColor: '#c8a84b' },
  shopIconBox: { height: 82, backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 14 },
  shopIcon: { fontSize: 42 },
  shopItemImage: { width: 68, height: 68 },
  shopItemTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10, marginBottom: 10 },
  shopItemDesc: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7, lineHeight: 15, marginBottom: 14 },
  shopButtonWrap: { width: '100%' as const },
  shopButton: { borderWidth: 1, borderColor: '#c8a84b', padding: 13, alignItems: 'center' as const },
  shopButtonOwned: { backgroundColor: '#c8a84b' },
  shopButtonMuted: { opacity: 0.55 },
  shopButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#c8a84b', fontSize: 8 },
  shopButtonOwnedText: { color: '#1a1a2e' },

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
  modalImage: { width: 84, height: 84, marginBottom: 12 },
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
