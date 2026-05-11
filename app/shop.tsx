import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../src/context/LanguageContext';

export default function Shop() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();

  return (
    <ScrollView style={s.container} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 56 }]}>
      <Pressable style={({ pressed }) => [pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
        <Text style={s.back}>{t('settings_back')}</Text>
      </Pressable>

      <Text style={s.title}>{t('shop_title')}</Text>
      <View style={s.panel}>
        <Text style={s.panelTitle}>{t('shop_coming_soon')}</Text>
        <Text style={s.panelText}>
          {language === 'tr'
            ? 'Kozmetik dukkan ic test surumunde arsivlendi. Satin alma, kilit acma ve ekipman akislari daha sonra geri gelecek.'
            : 'The cosmetic shop is archived for the internal testing build. Purchases, unlocks, and equipment flows will return later.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const s = {
  container: { flex: 1, backgroundColor: '#1a1a2e' } as const,
  content: { padding: 24, paddingTop: 60, paddingBottom: 48 } as const,
  back: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 32 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 18, marginBottom: 18 } as const,
  panel: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 16 },
  panelTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10, lineHeight: 18, marginBottom: 12 } as const,
  panelText: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 17 } as const,
};
