import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../src/context/LanguageContext';
import PressableScale from '../src/components/PressableScale';

const SHOP_ITEMS = [
  { icon: '🎩', titleKey: 'shop_item_hat', descKey: 'shop_item_hat_desc' },
  { icon: '🧥', titleKey: 'shop_item_cloak', descKey: 'shop_item_cloak_desc' },
  { icon: '🪄', titleKey: 'shop_item_staff', descKey: 'shop_item_staff_desc' },
  { icon: '🐾', titleKey: 'shop_item_pet', descKey: 'shop_item_pet_desc' },
] as const;

export default function Shop() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Pressable style={({ pressed }) => [pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
        <Text style={s.back}>{t('settings_back')}</Text>
      </Pressable>

      <Text style={s.title}>{t('shop_title')}</Text>
      <Text style={s.subtitle}>{t('shop_subtitle')}</Text>

      <View style={s.notice}>
        <Text style={s.noticeText}>{t('shop_coming_soon')}</Text>
      </View>

      <View style={s.grid}>
        {SHOP_ITEMS.map(item => (
          <View key={item.titleKey} style={s.card}>
            <View style={s.iconBox}>
              <Text style={s.icon}>{item.icon}</Text>
            </View>
            <Text style={s.itemTitle}>{t(item.titleKey)}</Text>
            <Text style={s.itemDesc}>{t(item.descKey)}</Text>
            <PressableScale disabled style={s.buttonWrap}>
              <View style={s.disabledButton}>
                <Text style={s.disabledButtonText}>{t('shop_locked')}</Text>
              </View>
            </PressableScale>
          </View>
        ))}
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
  notice: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#e2b96f', padding: 14, marginBottom: 18 },
  noticeText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 8, lineHeight: 16, textAlign: 'center' as const },
  grid: { gap: 12 },
  card: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 16 },
  iconBox: { height: 72, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d4e', alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 14 },
  icon: { fontSize: 42 },
  itemTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10, marginBottom: 10 },
  itemDesc: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7, lineHeight: 15, marginBottom: 14 },
  buttonWrap: { width: '100%' as const },
  disabledButton: { backgroundColor: '#4a4a6a', padding: 13, alignItems: 'center' as const, opacity: 0.65 },
  disabledButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#1a1a2e', fontSize: 8 },
};
