import { Text, View, Pressable, Alert } from 'react-native';
import { useLanguage } from '../../src/context/LanguageContext';

export default function Inventory() {
  const { t } = useLanguage();

  return (
    <View style={invStyles.container}>
      <Text style={invStyles.title}>{t('inventory_title')}</Text>
      <View style={invStyles.emptyState}>
        <Text style={invStyles.emptyEmoji}>🎒</Text>
        <Text style={invStyles.emptyText}>{t('inventory_empty')}</Text>
        <Pressable
          style={({ pressed }) => [invStyles.button, pressed && { opacity: 0.7 }]}
          onPress={() => Alert.alert('Coming soon')}
        >
          <Text style={invStyles.buttonText}>{t('inventory_add')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const invStyles = {
  container: { flex: 1, backgroundColor: '#16213e', padding: 24, paddingTop: 60 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 16, marginBottom: 48 } as const,
  emptyState: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, paddingBottom: 80 },
  emptyEmoji: { fontSize: 72, marginBottom: 24 } as const,
  emptyText: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 9, textAlign: 'center' as const, lineHeight: 20, marginBottom: 32 } as const,
  button: { borderWidth: 2, borderColor: '#e2b96f', paddingVertical: 16, paddingHorizontal: 24 } as const,
  buttonText: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 9 } as const,
};
