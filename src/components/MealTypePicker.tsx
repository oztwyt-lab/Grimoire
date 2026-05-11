import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { MEAL_TYPES, MealType } from '../data/mealTypes';
import { StringKey } from '../i18n/strings';

interface MealTypePickerProps {
  value: MealType | undefined;
  onChange: (value: MealType) => void;
  onClose: () => void;
  visible: boolean;
}

export default function MealTypePicker({ value, onChange, onClose, visible }: MealTypePickerProps) {
  const { t } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('mealType')}</Text>
            <Pressable onPress={onClose} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <ScrollView>
            {MEAL_TYPES.map(mt => {
              const isSelected = value === mt.value;
              return (
                <Pressable
                  key={mt.value}
                  style={({ pressed }) => [styles.row, isSelected && styles.rowActive, pressed && styles.rowPressed]}
                  onPress={() => { onChange(mt.value as MealType); onClose(); }}
                >
                  {isSelected && <View style={styles.activeLine} />}
                  <Text style={styles.rowIcon}>{mt.icon}</Text>
                  <Text style={[styles.rowLabel, isSelected && styles.rowLabelActive]}>
                    {t(mt.labelKey as StringKey)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10,10,20,0.72)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#16213e', borderWidth: 2, borderColor: '#2d2d4e', borderBottomWidth: 0, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2d2d4e' },
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 10 },
  close: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#2d2d4e', position: 'relative' },
  rowActive: { backgroundColor: '#1a1a2e' },
  rowPressed: { backgroundColor: '#1a1a2e' },
  activeLine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: '#e2b96f' },
  rowIcon: { fontSize: 22, marginRight: 16, width: 32 },
  rowLabel: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8 },
  rowLabelActive: { color: '#e2b96f' },
});
