import { useState } from 'react';
import { Text, View, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import WizardSprite from '../src/components/WizardSprite';

// Character options — only male wizard available in this release
const CHARACTERS = [
  { id: 'male', label: 'WIZARD', unlocked: true },
  { id: 'female', label: 'COMING\nSOON', unlocked: false },
  { id: 'rogue', label: 'COMING\nSOON', unlocked: false },
];

export default function CharacterSetup() {
  const router = useRouter();
  const { user } = useAuth();
  const [nickname, setNickname] = useState('');
  const [selectedChar, setSelectedChar] = useState('male');
  const [saving, setSaving] = useState(false);

  const handleBegin = async () => {
    if (!nickname.trim()) {
      Alert.alert('Missing name', 'Enter a name for your hero.');
      return;
    }
    if (nickname.trim().length > 14) {
      Alert.alert('Name too long', 'Keep it under 14 characters.');
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, 'profiles', user!.uid), {
        nickname: nickname.trim(),
        character: selectedChar,
        createdAt: serverTimestamp(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/home');
    } catch (err) {
      Alert.alert('Error', String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ─── Title ─────────────────────────────────────────────────────────── */}
      <Text style={styles.title}>CREATE{'\n'}YOUR HERO</Text>
      <Text style={styles.subtitle}>Your legend begins here.</Text>

      {/* ─── Nickname ──────────────────────────────────────────────────────── */}
      <Text style={styles.label}>HERO NAME</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter a name..."
        placeholderTextColor="#4a4a6a"
        value={nickname}
        onChangeText={setNickname}
        maxLength={14}
        autoFocus
      />

      {/* ─── Character selection ────────────────────────────────────────────── */}
      <Text style={styles.label}>CHOOSE YOUR CLASS</Text>
      <View style={styles.characterRow}>
        {CHARACTERS.map(ch => (
          <Pressable
            key={ch.id}
            style={({ pressed }) => [
              styles.characterCard,
              selectedChar === ch.id && styles.characterCardSelected,
              !ch.unlocked && styles.characterCardLocked,
              pressed && ch.unlocked && { backgroundColor: '#2d2d4e' },
            ]}
            onPress={() => {
              if (!ch.unlocked) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedChar(ch.id);
            }}
          >
           {ch.id === 'male' ? (
  <View style={styles.characterPreview}>
    <WizardSprite/>
  </View>
) : (
  <View style={styles.characterPreview}>
    <Text style={styles.lockEmoji}>🔒</Text>
  </View>
)}
            <Text style={[styles.characterLabel, !ch.unlocked && styles.characterLabelMuted]}>
              {ch.label}
            </Text>
            {selectedChar === ch.id && <Text style={styles.selectedBadge}>✦</Text>}
          </Pressable>
        ))}
      </View>

      {/* ─── Begin ─────────────────────────────────────────────────────────── */}
      <Pressable
        style={({ pressed }) => [styles.button, pressed && { backgroundColor: '#2d2d4e' }]}
        onPress={handleBegin}
        disabled={saving}
      >
        <Text style={styles.buttonText}>{saving ? 'SUMMONING...' : 'BEGIN QUEST  ▶'}</Text>
      </Pressable>
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
  characterCard: {
    flex: 1,
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#2d2d4e',
    padding: 12,
    alignItems: 'center' as const,
  },
  characterCardSelected: { borderColor: '#e2b96f', borderWidth: 2 },
  characterCardLocked: { opacity: 0.4 },
  characterPreview: { width: 50, height: 70, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 8 },
  lockEmoji: { fontSize: 28 } as const,
  characterLabel: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 7, textAlign: 'center' as const, lineHeight: 13 },
  characterLabelMuted: { color: '#4a4a6a' } as const,
  selectedBadge: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10, marginTop: 6 } as const,
  button: { backgroundColor: '#16213e', borderWidth: 2, borderColor: '#e2b96f', padding: 18, alignItems: 'center' as const },
  buttonText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 11 } as const,
};
