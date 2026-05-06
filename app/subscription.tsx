import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../src/context/LanguageContext';
import { useSubscription } from '../src/context/SubscriptionContext';
import PressableScale from '../src/components/PressableScale';

export default function Subscription() {
  const router = useRouter();
  const { t } = useLanguage();
  const { tier, recipeCount, inventoryCount } = useSubscription();

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Pressable style={({ pressed }) => [pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
        <Text style={s.back}>{t('settings_back')}</Text>
      </Pressable>

      <Text style={s.title}>{t('subscription_title')}</Text>

      <View style={s.currentPanel}>
        <Text style={s.sectionLabel}>{t('subscription_current_plan')}</Text>
        <Text style={s.currentTier}>{t(tier === 'free' ? 'subscription_free' : tier === 'monthly' ? 'subscription_monthly' : 'subscription_supporter')}</Text>
        <View style={s.usageRow}>
          <Text style={s.usageText}>{recipeCount}/5 {t('subscription_recipes')}</Text>
          <Text style={s.usageText}>{inventoryCount}/12 {t('subscription_items')}</Text>
        </View>
      </View>

      <Text style={s.sectionLabel}>{t('subscription_plans')}</Text>

      <View style={s.plan}>
        <View style={s.planHeader}>
          <Text style={s.planTitle}>{t('subscription_free')}</Text>
          <Text style={s.planPrice}>{t('subscription_free_price')}</Text>
        </View>
        <Text style={s.planLine}>{t('subscription_free_line_1')}</Text>
        <Text style={s.planLine}>{t('subscription_free_line_2')}</Text>
      </View>

      <View style={[s.plan, s.highlightPlan]}>
        <View style={s.planHeader}>
          <Text style={s.planTitle}>{t('subscription_monthly')}</Text>
          <Text style={s.planPrice}>{t('subscription_monthly_price')}</Text>
        </View>
        <Text style={s.planLine}>{t('subscription_paid_line_1')}</Text>
        <Text style={s.planLine}>{t('subscription_paid_line_2')}</Text>
        <PressableScale disabled style={s.disabledButtonWrap}>
          <View style={s.disabledButton}>
            <Text style={s.disabledButtonText}>{t('subscription_coming_soon')}</Text>
          </View>
        </PressableScale>
      </View>

      <View style={s.plan}>
        <View style={s.planHeader}>
          <Text style={s.planTitle}>{t('subscription_supporter')}</Text>
          <Text style={s.planPrice}>{t('subscription_supporter_price')}</Text>
        </View>
        <Text style={s.planLine}>{t('subscription_supporter_line_1')}</Text>
        <Text style={s.planLine}>{t('subscription_paid_line_2')}</Text>
        <PressableScale disabled style={s.disabledButtonWrap}>
          <View style={s.disabledButton}>
            <Text style={s.disabledButtonText}>{t('subscription_coming_soon')}</Text>
          </View>
        </PressableScale>
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
  currentPanel: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 16, marginBottom: 28 } as const,
  currentTier: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 12, marginBottom: 14 } as const,
  usageRow: { flexDirection: 'row' as const, gap: 10, flexWrap: 'wrap' as const },
  usageText: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7, lineHeight: 14 } as const,
  plan: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 16, marginBottom: 14 } as const,
  highlightPlan: { borderColor: '#e2b96f' } as const,
  planHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, gap: 12, marginBottom: 12 },
  planTitle: { flex: 1, fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10, lineHeight: 16 } as const,
  planPrice: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 16, textAlign: 'right' as const },
  planLine: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7, lineHeight: 15, marginBottom: 8 } as const,
  disabledButtonWrap: { width: '100%' as const, marginTop: 8 },
  disabledButton: { backgroundColor: '#4a4a6a', padding: 14, alignItems: 'center' as const, opacity: 0.65 },
  disabledButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#1a1a2e', fontSize: 8 } as const,
};
