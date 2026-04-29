import { useState } from 'react';
import { View, Text, TextInput, Modal } from 'react-native';
import PressableScale from './PressableScale';
import { useLanguage } from '../context/LanguageContext';

export type LocalStep = { id: string; text: string; duration: number | null };

interface Props {
  steps: LocalStep[];
  onChange: (steps: LocalStep[]) => void;
}

export default function StepBuilder({ steps, onChange }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftDuration, setDraftDuration] = useState('');
  const { t } = useLanguage();

  function openModal() {
    setDraftText('');
    setDraftDuration('');
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
  }

  function addStep() {
    if (!draftText.trim()) return;
    const parsed = parseInt(draftDuration, 10);
    onChange([
      ...steps,
      {
        id: Date.now().toString(),
        text: draftText.trim(),
        duration: draftDuration.trim() && !isNaN(parsed) ? parsed : null,
      },
    ]);
    closeModal();
  }

  function removeStep(id: string) {
    onChange(steps.filter(s => s.id !== id));
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...steps];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  }

  function moveDown(idx: number) {
    if (idx === steps.length - 1) return;
    const next = [...steps];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  }

  return (
    <View>
      {steps.map((step, idx) => (
        <View key={step.id} style={sb.stepRow}>
          <Text style={sb.stepNum}>{idx + 1}</Text>
          <View style={sb.stepContent}>
            <Text style={sb.stepText}>{step.text}</Text>
            {step.duration ? (
              <Text style={sb.stepDuration}>⏱ {step.duration} min</Text>
            ) : null}
          </View>
          <View style={sb.stepActions}>
            <PressableScale onPress={() => moveUp(idx)} disabled={idx === 0}>
              <Text style={[sb.arrow, idx === 0 && sb.arrowDisabled]}>▲</Text>
            </PressableScale>
            <PressableScale onPress={() => moveDown(idx)} disabled={idx === steps.length - 1}>
              <Text style={[sb.arrow, idx === steps.length - 1 && sb.arrowDisabled]}>▼</Text>
            </PressableScale>
            <PressableScale onPress={() => removeStep(step.id)}>
              <Text style={sb.deleteBtn}>✕</Text>
            </PressableScale>
          </View>
        </View>
      ))}

      <PressableScale onPress={openModal} style={sb.addButtonWrapper}>
        <View style={sb.addButton}>
          <Text style={sb.addButtonText}>+ {t('recipe_add_step')}</Text>
        </View>
      </PressableScale>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={sb.modalOverlay}>
          <View style={sb.modalCard}>
            <TextInput
              style={[sb.modalInput, sb.modalInputMulti]}
              placeholder={t('recipe_step_placeholder')}
              placeholderTextColor="#4a4a6a"
              value={draftText}
              onChangeText={setDraftText}
              multiline
              autoFocus
            />
            <TextInput
              style={sb.modalInput}
              placeholder={t('recipe_step_duration')}
              placeholderTextColor="#4a4a6a"
              value={draftDuration}
              onChangeText={setDraftDuration}
              keyboardType="numeric"
            />
            <View style={sb.modalButtons}>
              <PressableScale onPress={closeModal} style={sb.modalBtnWrapper}>
                <View style={sb.modalCancelButton}>
                  <Text style={sb.modalCancelText}>{t('create_cancel')}</Text>
                </View>
              </PressableScale>
              <PressableScale onPress={addStep} style={sb.modalBtnWrapper}>
                <View style={sb.modalAddButton}>
                  <Text style={sb.modalAddText}>{t('recipe_step_add_btn')}</Text>
                </View>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const sb = {
  stepRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d4e',
    paddingVertical: 12,
    gap: 8,
  },
  stepNum: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 8,
    paddingTop: 2,
    minWidth: 16,
  },
  stepContent: { flex: 1, gap: 4 },
  stepText: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#c8c8e8',
    fontSize: 8,
    lineHeight: 18,
  },
  stepDuration: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 7,
  },
  stepActions: {
    flexDirection: 'row' as const,
    gap: 10,
    alignItems: 'center' as const,
  },
  arrow: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#e2b96f',
    fontSize: 10,
  },
  arrowDisabled: { color: '#2d2d4e' } as const,
  deleteBtn: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#c0392b',
    fontSize: 10,
  },
  addButtonWrapper: { width: '100%' as const, marginTop: 12 },
  addButton: {
    borderWidth: 1,
    borderColor: '#e2b96f',
    padding: 16,
    alignItems: 'center' as const,
  },
  addButtonText: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#e2b96f',
    fontSize: 9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#2d2d4e',
    padding: 24,
    width: '100%' as const,
    gap: 16,
  },
  modalInput: {
    backgroundColor: '#1a1a2e',
    color: '#c8c8e8',
    borderWidth: 1,
    borderColor: '#2d2d4e',
    padding: 14,
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
  },
  modalInputMulti: { lineHeight: 18, minHeight: 80, textAlignVertical: 'top' as const },
  modalButtons: { flexDirection: 'row' as const, gap: 12 },
  modalBtnWrapper: { flex: 1 },
  modalCancelButton: {
    borderWidth: 1,
    borderColor: '#4a4a6a',
    padding: 14,
    alignItems: 'center' as const,
  },
  modalCancelText: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#4a4a6a',
    fontSize: 8,
  },
  modalAddButton: {
    borderWidth: 1,
    borderColor: '#e2b96f',
    padding: 14,
    alignItems: 'center' as const,
  },
  modalAddText: {
    fontFamily: 'PressStart2P_400Regular',
    color: '#e2b96f',
    fontSize: 8,
  },
};
