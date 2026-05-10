import { useState } from 'react';
import { Text, View, TextInput, ScrollView, Alert, Image, ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import { createUserProfile } from '../lib/firestore';
import * as Haptics from 'expo-haptics';
import PressableScale from '../src/components/PressableScale';

type CharacterOption = { id: 'male' | 'female'; image: ImageSourcePropType; labelKey: 'setup_wizard' | 'setup_witch' };

const CHARACTERS: CharacterOption[] = [
  { id: 'male', image: require('../assets/characters/wizardicon.png'), labelKey: 'setup_wizard' },
  { id: 'female', image: require('../assets/characters/witchicon.png'), labelKey: 'setup_witch' },
];

export default function CharacterSetup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [nickname, setNickname] = useState('');
  const [selectedChar, setSelectedChar] = useState<'male' | 'female'>('male');
  const [saving, setSaving] = useState(false);

  const handleBegin = async () => {
    if (!nickname.trim()) {
      Alert.alert(t('setup_error_missing_name'), t('setup_error_missing_name_msg'));
      return;
    }
    if (nickname.trim().length > 14) {
      Alert.alert(t('setup_error_name_long'), t('setup_error_name_long_msg'));
      return;
    }
    setSaving(true);
    try {
      await createUserProfile(user!.uid, {
        nickname: nickname.trim(),
        character: selectedChar,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        router.replace('/home');
      }, 50);
    } catch (err) {
      Alert.alert(t('create_error_title'), String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 56 }]}>

      {/* ─── Title ─────────────────────────────────────────────────────────── */}
      <Text style={styles.title}>{t('setup_title')}</Text>
      <Text style={styles.subtitle}>{t('setup_subtitle')}</Text>

      {/* ─── Nickname ──────────────────────────────────────────────────────── */}
      <Text style={styles.label}>{t('setup_hero_name')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('setup_name_placeholder')}
        placeholderTextColor="#4a4a6a"
        value={nickname}
        onChangeText={setNickname}
        maxLength={14}
        autoFocus
      />

      {/* ─── Character selection ────────────────────────────────────────────── */}
      <Text style={styles.label}>{t('setup_choose_character')}</Text>
      <View style={styles.characterRow}>
        {CHARACTERS.map(ch => (
          <PressableScale
            key={ch.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedChar(ch.id);
            }}
            style={styles.cardPressable}
          >
            <View style={[
              styles.characterCard,
              selectedChar === ch.id && styles.characterCardSelected,
            ]}>
              <Image source={ch.image} style={styles.characterImage} resizeMode="contain" />
              <Text style={[
                styles.characterLabel,
                selectedChar === ch.id && styles.characterLabelSelected,
              ]}>
                {t(ch.labelKey)}
              </Text>
              {selectedChar === ch.id && (
                <Text style={styles.selectedBadge}>✦</Text>
              )}
            </View>
          </PressableScale>
        ))}
      </View>

      {/* ─── Begin ─────────────────────────────────────────────────────────── */}
      <PressableScale onPress={handleBegin} disabled={saving}>
        <View style={[styles.button, saving && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>
            {saving ? t('setup_summoning') : t('setup_begin')}
          </Text>
        </View>
      </PressableScale>

    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  container: { flex: 1, backgroundColor: '#1a1a2e' } as const,
  content: { padding: 24, paddingTop: 70, paddingBottom: 48 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 20, lineHeight: 36, marginBottom: 12 } as const,
  subtitle: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 40, lineHeight: 16 } as const,
  label: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 12 } as const,
  input: { backgroundColor: '#16213e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 16, marginBottom: 32, fontFamily: 'PressStart2P_400Regular', fontSize: 10 } as const,
  characterRow: { flexDirection: 'row' as const, gap: 12, marginBottom: 40 },
  cardPressable: { flex: 1 } as const,
  characterCard: {
    flex: 1,
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#2a2a4a',
    padding: 20,
    alignItems: 'center' as const,
    minHeight: 130,
    justifyContent: 'center' as const,
  },
  characterCardSelected: {
    borderColor: '#c8a84b',
    borderWidth: 2,
    backgroundColor: '#1c1c2e',
  },
  characterImage: { width: 80, height: 80, marginBottom: 12 } as const,
  characterLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 7, textAlign: 'center' as const },
  characterLabelSelected: { color: '#c8a84b' } as const,
  selectedBadge: { fontFamily: 'PressStart2P_400Regular', color: '#c8a84b', fontSize: 10, marginTop: 8 } as const,
  button: { backgroundColor: '#16213e', borderWidth: 2, borderColor: '#e2b96f', padding: 18, alignItems: 'center' as const },
  buttonDisabled: { opacity: 0.5 } as const,
  buttonText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 11 } as const,
};
