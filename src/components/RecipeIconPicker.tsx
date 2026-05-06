import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { useLanguage } from '../context/LanguageContext';

export const DEFAULT_RECIPE_ICON = '📖';

const RECIPE_ICON_OPTIONS = [
  '🍳', '🥘', '🍲', '🥗',
  '🍜', '🍝', '🍛', '🍣',
  '🍱', '🍤', '🥩', '🍗',
  '🍖', '🌮', '🌯', '🥙',
  '🫔', '🥪', '🍔', '🌭',
  '🍕', '🥨', '🧆', '🥚',
  '🥞', '🧇', '🥓', '🫕',
  '🍙', '🍚', '🍘', '🍥',
  '🥮', '🍢', '🧁',
];

type RecipeIconPickerProps = {
  value: string;
  onChange: (icon: string) => void;
};

export default function RecipeIconPicker({ value, onChange }: RecipeIconPickerProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [draftIcon, setDraftIcon] = useState(value || DEFAULT_RECIPE_ICON);
  const selectedIcon = value || DEFAULT_RECIPE_ICON;

  const handleOpen = () => {
    setDraftIcon(selectedIcon);
    setOpen(true);
  };

  const handleConfirm = () => {
    onChange(draftIcon);
    setOpen(false);
  };

  return (
    <View>
      <Text style={styles.label}>{t('recipe_icon_label')}</Text>
      <PressableScale onPress={handleOpen} style={styles.iconBox}>
        <Text style={styles.iconText}>{selectedIcon}</Text>
      </PressableScale>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('recipe_choose_icon')}</Text>
            <ScrollView style={styles.gridScroll} contentContainerStyle={styles.grid}>
              {RECIPE_ICON_OPTIONS.map((icon, index) => {
                const selected = icon === draftIcon;
                return (
                  <Pressable
                    key={`${icon}-${index}`}
                    onPress={() => setDraftIcon(icon)}
                    style={({ pressed }) => [
                      styles.gridItem,
                      selected && styles.gridItemSelected,
                      pressed && { backgroundColor: '#2d2d4e' },
                    ]}
                  >
                    <Text style={styles.gridIcon}>{icon}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <PressableScale onPress={handleConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmText}>{t('recipe_icon_confirm')}</Text>
            </PressableScale>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = {
  label: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 8, marginTop: 16 } as const,
  iconBox: { width: 72, height: 72, backgroundColor: '#16213e', borderWidth: 2, borderColor: '#e2b96f', alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 16 },
  iconText: { fontSize: 48 } as const,
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center' as const, justifyContent: 'center' as const, padding: 24 },
  modal: { width: '100%' as const, maxWidth: 360, backgroundColor: '#1a1a2e', borderWidth: 2, borderColor: '#e2b96f', padding: 18 },
  modalTitle: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10, textAlign: 'center' as const, marginBottom: 18 },
  gridScroll: { maxHeight: 420, alignSelf: 'center' as const },
  grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, justifyContent: 'center' as const, gap: 8, maxWidth: 280 },
  gridItem: { width: 62, height: 52, backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', alignItems: 'center' as const, justifyContent: 'center' as const },
  gridItemSelected: { borderColor: '#e2b96f', borderWidth: 2 },
  gridIcon: { fontSize: 28 } as const,
  confirmButton: { borderWidth: 2, borderColor: '#e2b96f', padding: 16, alignItems: 'center' as const, marginTop: 18 },
  confirmText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10 } as const,
};
