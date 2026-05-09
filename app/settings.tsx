import { useEffect, useState } from 'react';
import { Text, View, Pressable, TextInput, Alert, ScrollView, Modal, LayoutChangeEvent, GestureResponderEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from '@firebase/firestore';
import * as Haptics from 'expo-haptics';
import PressableScale from '../src/components/PressableScale';
import { submitFeedback } from '../lib/firestore';
import { isAdminEmail } from '../src/config/admin';
import {
  getMasterVolume,
  getMusicVolume,
  isMusicEnabled,
  isSFXEnabled,
  setMasterVolume,
  setMusicEnabled,
  setMusicVolume,
  setSFXEnabled,
  stopAllSounds,
} from '../src/services/audio';

function SoundSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [width, setWidth] = useState(1);
  const pct = Math.round(value * 100);

  const updateFromEvent = (event: GestureResponderEvent) => {
    onChange(Math.min(1, Math.max(0, event.nativeEvent.locationX / width)));
  };

  return (
    <PressableScale
      sound={false}
      onLayout={(event: LayoutChangeEvent) => setWidth(Math.max(1, event.nativeEvent.layout.width))}
      onPress={updateFromEvent}
      onPressIn={updateFromEvent}
      style={sStyles.slider}
    >
      <View style={sStyles.sliderTrack}>
        <View style={[sStyles.sliderFill, { width: `${pct}%` }]} />
        <View style={[sStyles.sliderThumb, { left: `${pct}%` }]} />
      </View>
    </PressableScale>
  );
}

export default function Settings() {
  const router = useRouter();
  const { user, deleteAccount, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackThanks, setFeedbackThanks] = useState(false);
  const [sfxOn, setSfxOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [masterVol, setMasterVol] = useState(1);
  const [musicVol, setMusicVolState] = useState(0.7);
  const isAdmin = isAdminEmail(user?.email);

  useEffect(() => {
    const syncAudioState = () => {
      setSfxOn(isSFXEnabled());
      setMusicOn(isMusicEnabled());
      setMasterVol(getMasterVolume());
      setMusicVolState(getMusicVolume());
    };

    syncAudioState();
    const timer = setTimeout(syncAudioState, 300);
    return () => clearTimeout(timer);
  }, []);

  const setSfx = (enabled: boolean) => {
    setSfxOn(enabled);
    setSFXEnabled(enabled);
  };

  const setMusic = (enabled: boolean) => {
    setMusicOn(enabled);
    setMusicEnabled(enabled);
  };

  const setAllMuted = (muted: boolean) => {
    if (muted) {
      setSfx(false);
      setMusic(false);
      stopAllSounds();
    } else {
      setSfx(true);
      setMusic(true);
    }
  };

  const setVolume = (value: number) => {
    setMasterVol(value);
    setMasterVolume(value);
  };

  const setMusicVol = (value: number) => {
    setMusicVolState(value);
    setMusicVolume(value);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleDelete = async () => {
    if (!password.trim()) return;
    setDeleting(true);
    try {
      const q = query(collection(db, 'recipes'), where('userId', '==', user?.uid));
      const snapshot = await getDocs(q);
      await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, 'recipes', d.id))));
      await deleteAccount(password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const msg = code === 'auth/wrong-password' || code === 'auth/invalid-credential'
        ? t('account_error_wrong_password')
        : t('account_error_generic');
      Alert.alert(t('account_error_title'), msg);
      setDeleting(false);
    }
  };

  const closeFeedback = () => {
    if (feedbackSending) return;
    setFeedbackOpen(false);
    setFeedbackMessage('');
    setFeedbackThanks(false);
  };

  const handleSendFeedback = async () => {
    const message = feedbackMessage.trim();
    if (!user || !message) return;
    setFeedbackSending(true);
    try {
      await submitFeedback(user.uid, message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFeedbackThanks(true);
      setTimeout(() => {
        setFeedbackOpen(false);
        setFeedbackMessage('');
        setFeedbackThanks(false);
        setFeedbackSending(false);
      }, 1500);
    } catch (error) {
      Alert.alert(t('account_error_title'), String(error));
      setFeedbackSending(false);
    }
  };

  return (
    <ScrollView style={sStyles.container} contentContainerStyle={sStyles.content}>

      <Pressable style={({ pressed }) => [pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
        <Text style={sStyles.back}>{t('settings_back')}</Text>
      </Pressable>

      <Text style={sStyles.title}>{t('settings_title')}</Text>

      {/* ─── Account ──────────────────────────────────────────────────────── */}
      <View style={sStyles.section}>
        <Text style={sStyles.sectionLabel}>{t('settings_account')}</Text>
        <Text style={sStyles.email}>{user?.email}</Text>
      </View>

      <View style={sStyles.divider} />

      {/* ─── Language ─────────────────────────────────────────────────────── */}
      <View style={sStyles.section}>
        <Text style={sStyles.sectionLabel}>{t('settings_language')}</Text>
        <View style={sStyles.langRow}>
          <Pressable
            style={[sStyles.langButton, language === 'en' && sStyles.langButtonActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[sStyles.langText, language === 'en' && sStyles.langTextActive]}>
              {t('lang_english')}
            </Text>
          </Pressable>
          <Pressable
            style={[sStyles.langButton, language === 'tr' && sStyles.langButtonActive]}
            onPress={() => setLanguage('tr')}
          >
            <Text style={[sStyles.langText, language === 'tr' && sStyles.langTextActive]}>
              {t('lang_turkish')}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={sStyles.divider} />

      {/* ─── Danger Zone ──────────────────────────────────────────────────── */}
      <PressableScale onPress={() => router.push('/subscription')} style={sStyles.subscriptionButtonWrap}>
        <View style={sStyles.subscriptionButton}>
          <Text style={sStyles.subscriptionButtonText}>{t('settings_subscription')}</Text>
        </View>
      </PressableScale>

      <View style={sStyles.divider} />

      <PressableScale onPress={() => setFeedbackOpen(true)} style={sStyles.feedbackButtonWrap}>
        <View style={sStyles.feedbackButton}>
          <Text style={sStyles.feedbackButtonText}>{t('settings_feedback')}</Text>
        </View>
      </PressableScale>

      <View style={sStyles.divider} />

      {isAdmin && (
        <>
          <PressableScale onPress={() => router.push('/admin-feedback')} style={sStyles.adminButtonWrap}>
            <View style={sStyles.adminButton}>
              <Text style={sStyles.adminButtonText}>{t('settings_feedback_inbox')}</Text>
            </View>
          </PressableScale>

          <View style={sStyles.divider} />
        </>
      )}

      <View style={sStyles.section}>
        <PressableScale onPress={() => setAllMuted(sfxOn || musicOn)} style={sStyles.soundRow}>
          <View style={[sStyles.checkbox, !sfxOn && !musicOn && sStyles.checkboxActive]}>
            <Text style={sStyles.checkboxText}>{!sfxOn && !musicOn ? '✓' : ''}</Text>
          </View>
          <Text style={sStyles.soundLabel}>{t('settings_mute')}</Text>
        </PressableScale>

        <PressableScale onPress={() => setSfx(!sfxOn)} style={sStyles.soundRow}>
          <View style={[sStyles.checkbox, sfxOn && sStyles.checkboxActive]}>
            <Text style={sStyles.checkboxText}>{sfxOn ? '✓' : ''}</Text>
          </View>
          <Text style={sStyles.soundLabel}>{t('settings_sfx')}</Text>
        </PressableScale>

        <PressableScale onPress={() => setMusic(!musicOn)} style={sStyles.soundRow}>
          <View style={[sStyles.checkbox, musicOn && sStyles.checkboxActive]}>
            <Text style={sStyles.checkboxText}>{musicOn ? '✓' : ''}</Text>
          </View>
          <Text style={sStyles.soundLabel}>{t('settings_music')}</Text>
        </PressableScale>

        <Text style={sStyles.soundLabel}>{t('settings_volume')} {Math.round(masterVol * 100)}%</Text>
        <SoundSlider value={masterVol} onChange={setVolume} />

        <Text style={sStyles.soundLabel}>{t('settings_music_volume')} {Math.round(musicVol * 100)}%</Text>
        <SoundSlider value={musicVol} onChange={setMusicVol} />
      </View>

      <View style={sStyles.divider} />

      <Text style={sStyles.dangerLabel}>{t('settings_danger')}</Text>
      <Pressable
        style={({ pressed }) => [sStyles.deleteButton, pressed && { opacity: 0.8 }]}
        onPress={handleLogout}
      >
        <Text style={sStyles.deleteButtonText}>{t('settings_logout')}</Text>
      </Pressable>
      {!confirming ? (
        <Pressable
          style={({ pressed }) => [sStyles.deleteButton, pressed && { opacity: 0.8 }]}
          onPress={() => setConfirming(true)}
        >
          <Text style={sStyles.deleteButtonText}>{t('settings_delete')}</Text>
        </Pressable>
      ) : (
        <View>
          <Text style={sStyles.confirmWarning}>{t('account_delete_warning')}</Text>
          <TextInput
            style={sStyles.input}
            placeholder={t('account_password_placeholder')}
            placeholderTextColor="#4a4a6a"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoFocus
          />
          <Pressable
            style={({ pressed }) => [sStyles.deleteButton, pressed && { opacity: 0.8 }]}
            onPress={handleDelete}
            disabled={deleting}
          >
            <Text style={sStyles.deleteButtonText}>
              {deleting ? t('account_deleting') : t('account_confirm_delete')}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.5 }]}
            onPress={() => { setConfirming(false); setPassword(''); }}
          >
            <Text style={sStyles.cancelText}>{t('account_cancel')}</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={feedbackOpen} transparent animationType="fade" onRequestClose={closeFeedback}>
        <View style={sStyles.modalOverlay}>
          <View style={sStyles.modalCard}>
            <Text style={sStyles.modalTitle}>{t('feedback_title')}</Text>
            <TextInput
              style={sStyles.feedbackInput}
              placeholder={t('feedback_placeholder')}
              placeholderTextColor="#4a4a6a"
              value={feedbackMessage}
              onChangeText={setFeedbackMessage}
              multiline
              textAlignVertical="top"
              editable={!feedbackSending && !feedbackThanks}
            />
            <PressableScale
              onPress={handleSendFeedback}
              disabled={feedbackSending || feedbackThanks || !feedbackMessage.trim()}
              style={sStyles.modalButtonWrap}
            >
              <View style={[sStyles.modalSendButton, (!feedbackMessage.trim() || feedbackSending) && sStyles.modalSendDisabled]}>
                <Text style={sStyles.modalSendText}>
                  {feedbackThanks ? t('feedback_thanks') : t('feedback_send')}
                </Text>
              </View>
            </PressableScale>
            <Pressable
              style={({ pressed }) => [pressed && { opacity: 0.5 }]}
              onPress={closeFeedback}
              disabled={feedbackSending}
            >
              <Text style={sStyles.modalCancelText}>{t('account_cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const sStyles = {
  container: { flex: 1, backgroundColor: '#1a1a2e' } as const,
  content: { padding: 24, paddingTop: 60, paddingBottom: 48 } as const,
  back: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 32 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 16, marginBottom: 32 } as const,
  section: { marginBottom: 24 } as const,
  sectionLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 12 } as const,
  email: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 16 } as const,
  divider: { height: 1, backgroundColor: '#2d2d4e', marginVertical: 24 } as const,
  langRow: { flexDirection: 'row' as const, gap: 12 },
  langButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2d2d4e',
    backgroundColor: '#16213e',
    padding: 14,
    alignItems: 'center' as const,
  },
  langButtonActive: { borderColor: '#e2b96f' } as const,
  langText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 } as const,
  langTextActive: { color: '#e2b96f' } as const,
  subscriptionButtonWrap: { width: '100%' as const },
  subscriptionButton: {
    borderWidth: 2,
    borderColor: '#e2b96f',
    padding: 16,
    alignItems: 'center' as const,
  },
  subscriptionButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 9, lineHeight: 15, textAlign: 'center' as const },
  feedbackButtonWrap: { width: '100%' as const },
  feedbackButton: {
    borderWidth: 2,
    borderColor: '#e2b96f',
    padding: 16,
    alignItems: 'center' as const,
  },
  feedbackButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 9 } as const,
  adminButtonWrap: { width: '100%' as const },
  adminButton: {
    borderWidth: 2,
    borderColor: '#8f8fb8',
    padding: 16,
    alignItems: 'center' as const,
  },
  adminButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 9, lineHeight: 15, textAlign: 'center' as const },
  soundRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 16, gap: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: '#2d2d4e',
    backgroundColor: '#16213e',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkboxActive: { borderColor: '#c8a84b' } as const,
  checkboxText: { fontFamily: 'PressStart2P_400Regular', color: '#c8a84b', fontSize: 10 } as const,
  soundLabel: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 16, marginBottom: 10 } as const,
  slider: { width: '100%' as const, marginBottom: 20 },
  sliderTrack: {
    height: 18,
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#2d2d4e',
    justifyContent: 'center' as const,
  },
  sliderFill: { position: 'absolute' as const, left: 0, top: 0, bottom: 0, backgroundColor: '#c8a84b' },
  sliderThumb: {
    position: 'absolute' as const,
    top: -5,
    width: 8,
    height: 28,
    marginLeft: -4,
    backgroundColor: '#c8c8e8',
    borderWidth: 1,
    borderColor: '#c8a84b',
  },
  dangerLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 16 } as const,
  deleteButton: {
    borderWidth: 2,
    borderColor: '#c0392b',
    padding: 16,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  deleteButtonText: { fontFamily: 'PressStart2P_400Regular', color: '#c0392b', fontSize: 9 } as const,
  confirmWarning: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 16, marginBottom: 16 } as const,
  input: { backgroundColor: '#16213e', color: '#c8c8e8', borderWidth: 1, borderColor: '#2d2d4e', padding: 14, marginBottom: 12, fontFamily: 'PressStart2P_400Regular', fontSize: 9 } as const,
  cancelText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', textAlign: 'center' as const, fontSize: 8, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 24,
  },
  modalCard: {
    width: '100%' as const,
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#e2b96f',
    padding: 20,
  },
  modalTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 12, textAlign: 'center' as const, marginBottom: 18 },
  feedbackInput: {
    minHeight: 112,
    backgroundColor: '#16213e',
    color: '#c8c8e8',
    borderWidth: 1,
    borderColor: '#2d2d4e',
    padding: 14,
    marginBottom: 16,
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    lineHeight: 18,
  } as const,
  modalButtonWrap: { width: '100%' as const },
  modalSendButton: {
    backgroundColor: '#c8a84b',
    padding: 16,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  modalSendDisabled: { opacity: 0.45 } as const,
  modalSendText: { fontFamily: 'PressStart2P_400Regular', color: '#1a1a2e', fontSize: 10 } as const,
  modalCancelText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', textAlign: 'center' as const, fontSize: 8 },
};
