import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import PressableScale from '../src/components/PressableScale';
import { addUserOwnedItem, EquipmentItem, getUserOwnedItems, STARTER_ITEMS } from '../lib/firestore';

const SHOP_ITEMS = STARTER_ITEMS.filter(item => !item.isStarter);

function itemName(item: EquipmentItem, language: string) {
  return language === 'tr' ? item.name : item.nameEn;
}

function itemDescription(item: EquipmentItem, language: string) {
  return language === 'tr' ? item.description : item.descriptionEn;
}

export default function Shop() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>([]);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      getUserOwnedItems(user.uid)
        .then(setOwnedItemIds)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [user])
  );

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

  if (loading) {
    return <ActivityIndicator style={{ flex: 1, backgroundColor: '#1a1a2e' }} color="#e2b96f" />;
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Pressable style={({ pressed }) => [pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
        <Text style={s.back}>{t('settings_back')}</Text>
      </Pressable>

      <Text style={s.title}>{t('shop_title')}</Text>
      <Text style={s.subtitle}>{t('shop_subtitle')}</Text>

      <View style={s.grid}>
        {SHOP_ITEMS.map(item => {
          const owned = ownedItemIds.includes(item.id);
          const unlocking = unlockingId === item.id;

          return (
            <View key={item.id} style={[s.card, owned && s.cardOwned]}>
              <View style={s.iconBox}>
                {item.image ? (
                  <Image source={item.image as never} style={s.itemImage} resizeMode="contain" />
                ) : (
                  <Text style={s.icon}>{item.icon}</Text>
                )}
              </View>
              <Text style={s.itemTitle}>{itemName(item, language)}</Text>
              <Text style={s.itemDesc}>{itemDescription(item, language)}</Text>
              <PressableScale
                disabled={owned || unlocking}
                onPress={() => handleUnlock(item)}
                style={s.buttonWrap}
              >
                <View style={[s.button, owned && s.buttonOwned, unlocking && s.buttonMuted]}>
                  <Text style={[s.buttonText, owned && s.buttonOwnedText]}>
                    {owned ? t('shop_owned') : unlocking ? '...' : t('shop_unlock')}
                  </Text>
                </View>
              </PressableScale>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = {
  container: { flex: 1, backgroundColor: '#1a1a2e' } as const,
  content: { padding: 24, paddingTop: 60, paddingBottom: 48 } as const,
  back: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 32 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 18, marginBottom: 14 } as const,
  subtitle: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 17, marginBottom: 20 } as const,
  grid: { gap: 12 },
  card: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 16 },
  cardOwned: { borderColor: '#c8a84b' },
  iconBox: { height: 82, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 14 },
  icon: { fontSize: 42 },
  itemImage: { width: 68, height: 68 },
  itemTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10, marginBottom: 10 },
  itemDesc: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7, lineHeight: 15, marginBottom: 14 },
  buttonWrap: { width: '100%' as const },
  button: { borderWidth: 1, borderColor: '#c8a84b', padding: 13, alignItems: 'center' as const },
  buttonOwned: { backgroundColor: '#c8a84b' },
  buttonMuted: { opacity: 0.55 },
  buttonText: { fontFamily: 'PressStart2P_400Regular', color: '#c8a84b', fontSize: 8 },
  buttonOwnedText: { color: '#1a1a2e' },
};
