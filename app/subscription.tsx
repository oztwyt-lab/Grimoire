import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../src/context/LanguageContext';
import { useSubscription } from '../src/context/SubscriptionContext';

export default function Subscription() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { recipeCount, inventoryCount } = useSubscription();

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 56 }]}
    >
      <Pressable style={({ pressed }) => [pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
        <Text style={s.back}>{t('settings_back')}</Text>
      </Pressable>

      <Text style={s.title}>{t('subscription_title')}</Text>

      <View style={s.panel}>
        <Text style={s.sectionLabel}>{t('subscription_current_plan')}</Text>
        <Text style={s.tier}>{t('subscription_free')}</Text>
        <View style={s.usageRow}>
          <Text style={s.usageText}>{recipeCount} {t('subscription_recipes')}</Text>
          <Text style={s.usageDivider}>·</Text>
          <Text style={s.usageText}>{inventoryCount} {t('subscription_items')}</Text>
        </View>
      </View>

      <View style={s.comingPanel}>
        <Text style={s.comingTitle}>PREMIUM — COMING SOON</Text>
        <Text style={s.comingLine}>▸  Unlimited recipes</Text>
        <Text style={s.comingLine}>▸  Unlimited inventory</Text>
        <Text style={s.comingLine}>▸  Unlimited Magic Orb imports</Text>
        <View style={s.divider} />
        <Text style={s.comingNote}>
          Subscriptions will be available at launch.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = {
  container: { flex: 1, backgroundColor: '#1a1a2e' } as const,
  content: { padding: 24, paddingTop: 60 } as const,
  back: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 32 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 16, marginBottom: 28 } as const,
  panel: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 18, marginBottom: 14 } as const,
  sectionLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, marginBottom: 10 } as const,
  tier: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 13, marginBottom: 14 } as const,
  usageRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  usageText: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7 } as const,
  usageDivider: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7 } as const,
  comingPanel: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 18 } as const,
  comingTitle: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 16 } as const,
  comingLine: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, lineHeight: 18, marginBottom: 2 } as const,
  divider: { height: 1, backgroundColor: '#2d2d4e', marginVertical: 16 } as const,
  comingNote: { fontFamily: 'PressStart2P_400Regular', color: '#3a3a5a', fontSize: 6, lineHeight: 14 } as const,
};
