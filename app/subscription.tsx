import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../src/context/LanguageContext';
import { useSubscription } from '../src/context/SubscriptionContext';

export default function Subscription() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { recipeCount, inventoryCount } = useSubscription();

  return (
    <ScrollView style={s.container} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 56 }]}>
      <Pressable style={({ pressed }) => [pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
        <Text style={s.back}>{t('settings_back')}</Text>
      </Pressable>

      <Text style={s.title}>{t('subscription_title')}</Text>

      <View style={s.currentPanel}>
        <Text style={s.sectionLabel}>{t('subscription_current_plan')}</Text>
        <Text style={s.currentTier}>{t('subscription_free')}</Text>
        <View style={s.usageRow}>
          <Text style={s.usageText}>{recipeCount} {t('subscription_recipes')}</Text>
          <Text style={s.usageText}>{inventoryCount} {t('subscription_items')}</Text>
        </View>
      </View>

      <View style={s.plan}>
        <Text style={s.planTitle}>{t('subscription_coming_soon')}</Text>
        <Text style={s.planLine}>
          {language === 'tr'
            ? 'Abonelikler, odemeler ve premium sinirlar ic test surumunde arsivlendi.'
            : 'Subscriptions, payments, and premium limits are archived for the internal testing build.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const s = {
  container: { flex: 1, backgroundColor: '#1a1a2e' } as const,
  content: { padding: 24, paddingTop: 60, paddingBottom: 48 } as const,
  back: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 32 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 16, marginBottom: 28 } as const,
  sectionLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 12 } as const,
  currentPanel: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 16, marginBottom: 18 } as const,
  currentTier: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 12, marginBottom: 14 } as const,
  usageRow: { flexDirection: 'row' as const, gap: 10, flexWrap: 'wrap' as const },
  usageText: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7, lineHeight: 14 } as const,
  plan: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 16, marginBottom: 14 } as const,
  planTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10, lineHeight: 16, marginBottom: 10 } as const,
  planLine: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7, lineHeight: 15 } as const,
};
