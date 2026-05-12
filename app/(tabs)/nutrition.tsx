import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNutritionLog, MacroTotals, getDateKey } from '../../src/context/NutritionLogContext';
import { registerIngredientCallback } from '../../src/store/ingredientSelection';
import { useLanguage } from '../../src/context/LanguageContext';
import * as Haptics from 'expo-haptics';

type Tab = 'daily' | 'weekly';

function fmt(val: number): string {
  if (val === 0) return '0';
  if (val >= 100) return Math.round(val).toString();
  return (Math.round(val * 10) / 10).toString();
}

export default function NutritionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { logFood, getTodayEntries, getTodayTotals, getWeekData, removeEntry } = useNutritionLog();
  const [tab, setTab] = useState<Tab>('daily');

  const macroStats = [
    { key: 'calories' as const, label: t('nutrition_cal'), color: '#e2b96f', unit: '' },
    { key: 'protein' as const, label: t('nutrition_pro'), color: '#6fcf97', unit: 'g' },
    { key: 'fat' as const, label: t('nutrition_fat'), color: '#bb86fc', unit: 'g' },
    { key: 'carbs' as const, label: t('nutrition_carb'), color: '#56ccf2', unit: 'g' },
  ];

  const todayKey = getDateKey();
  const todayEntries = getTodayEntries();
  const todayTotals = getTodayTotals();
  const weekData = getWeekData();

  function openPicker() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    registerIngredientCallback(async (result) => {
      await logFood(result.id, result.name, result.emoji, result.quantity);
    });
    router.push('/ingredient-picker');
  }

  return (
    <View style={[s.container, { paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>{t('nutrition_title')}</Text>
        <Pressable style={s.logBtn} onPress={openPicker}>
          <Text style={s.logBtnText}>{t('nutrition_log_food')}</Text>
        </Pressable>
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {(['daily', 'weekly'] as Tab[]).map(tabKey => (
          <Pressable
            key={tabKey}
            style={[s.tabBtn, tab === tabKey && s.tabBtnActive]}
            onPress={() => { Haptics.selectionAsync(); setTab(tabKey); }}
          >
            <Text style={[s.tabLabel, tab === tabKey && s.tabLabelActive]}>
              {tabKey === 'daily' ? t('nutrition_tab_daily') : t('nutrition_tab_weekly')}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'daily' ? (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.sectionLabel}>{t('nutrition_todays_totals')}</Text>
          <View style={s.totalsRow}>
            {macroStats.map(stat => (
              <View key={stat.key} style={s.totalCell}>
                <Text style={[s.totalValue, { color: stat.color }]}>
                  {fmt(todayTotals[stat.key])}{stat.unit}
                </Text>
                <Text style={s.totalLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <Text style={s.sectionLabel}>{t('nutrition_logged_food')}</Text>
          {todayEntries.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyTitle}>{t('nutrition_nothing_logged')}</Text>
              <Text style={s.emptyText}>{t('nutrition_tap_to_start')}</Text>
            </View>
          ) : (
            todayEntries.map(entry => (
              <View key={entry.id} style={s.entryRow}>
                <Text style={s.entryEmoji}>{entry.emoji}</Text>
                <View style={s.entryInfo}>
                  <Text style={s.entryName} numberOfLines={1}>{entry.name.toUpperCase()}</Text>
                  <Text style={s.entryQty}>{entry.quantity}</Text>
                </View>
                <View style={s.entryMacros}>
                  <Text style={[s.entryMacroVal, { color: '#e2b96f' }]}>{fmt(entry.calories)} {t('nutrition_cal')}</Text>
                  <Text style={s.entryMacroSub}>
                    P:{fmt(entry.protein)}g  F:{fmt(entry.fat)}g  C:{fmt(entry.carbs)}g
                  </Text>
                </View>
                <Pressable
                  style={s.deleteBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    removeEntry(todayKey, entry.id);
                  }}
                >
                  <Text style={s.deleteBtnText}>×</Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.sectionLabel}>{t('nutrition_this_week')}</Text>

          <View style={s.weekHeader}>
            <Text style={s.weekDayCell} />
            {macroStats.map(stat => (
              <Text key={stat.key} style={[s.weekMacroHead, { color: stat.color }]}>
                {stat.label}
              </Text>
            ))}
          </View>

          {weekData.map(day => (
            <View key={day.dateKey} style={[s.weekRow, day.isToday && s.weekRowToday]}>
              <Text style={[s.weekDayLabel, day.isToday && s.weekDayLabelToday]}>
                {day.label}
              </Text>
              {macroStats.map(stat => (
                <Text
                  key={stat.key}
                  style={[
                    s.weekMacroVal,
                    { color: day.totals[stat.key] > 0 ? stat.color : '#3a3a5a' },
                  ]}
                >
                  {day.totals[stat.key] > 0 ? fmt(day.totals[stat.key]) : '—'}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#e2b96f',
    fontSize: 14,
  },
  logBtn: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#c8a84b',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logBtnText: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#c8a84b',
    fontSize: 7,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2d2d4e',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  tabBtnActive: { backgroundColor: '#2d2d4e' },
  tabLabel: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 8,
  },
  tabLabelActive: { color: '#e2b96f' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  sectionLabel: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 7,
    marginBottom: 10,
    marginTop: 4,
  },
  totalsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  totalCell: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d4e',
    alignItems: 'center',
    paddingVertical: 10,
  },
  totalValue: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 9,
    marginBottom: 4,
  },
  totalLabel: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 6,
  },
  emptyBox: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d4e',
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 9,
  },
  emptyText: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#3a3a5a',
    fontSize: 7,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d4e',
    padding: 10,
    marginBottom: 6,
    gap: 8,
  },
  entryEmoji: { fontSize: 20, width: 26, textAlign: 'center' },
  entryInfo: { flex: 1, minWidth: 0 },
  entryName: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#c8c8e8',
    fontSize: 7,
    marginBottom: 4,
  },
  entryQty: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 6,
  },
  entryMacros: { alignItems: 'flex-end' },
  entryMacroVal: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 7,
    marginBottom: 3,
  },
  entryMacroSub: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 6,
  },
  deleteBtn: {
    width: 24,
    height: 24,
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#3a3a5a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#6a6a8a',
    fontSize: 10,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  weekRow: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2d2d4e',
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  weekRowToday: {
    borderColor: '#c8a84b',
  },
  weekDayCell: {
    width: 40,
  },
  weekDayLabel: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 7,
    width: 40,
  },
  weekDayLabelToday: { color: '#c8a84b' },
  weekMacroHead: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 6,
    flex: 1,
    textAlign: 'center',
  },
  weekMacroVal: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 7,
    flex: 1,
    textAlign: 'center',
  },
});
