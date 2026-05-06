import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, limit, onSnapshot, orderBy, query, Timestamp } from '@firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import { isAdminEmail } from '../src/config/admin';

type FeedbackItem = {
  id: string;
  uid: string;
  message: string;
  timestamp: Timestamp | null;
  appVersion: string;
  platform: string;
};

function formatTimestamp(timestamp: Timestamp | null) {
  if (!timestamp) return '';
  return timestamp.toDate().toLocaleString();
}

export default function AdminFeedback() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = isAdminEmail(user?.email);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      setItems([]);
      return;
    }

    const feedbackQuery = query(collection(db, 'feedback'), orderBy('timestamp', 'desc'), limit(100));
    return onSnapshot(feedbackQuery, (snap) => {
      setItems(snap.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          uid: typeof data.uid === 'string' ? data.uid : '',
          message: typeof data.message === 'string' ? data.message : '',
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp : null,
          appVersion: typeof data.appVersion === 'string' ? data.appVersion : '',
          platform: typeof data.platform === 'string' ? data.platform : '',
        };
      }));
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
  }, [isAdmin]);

  return (
    <View style={s.container}>
      <Pressable style={({ pressed }) => [pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
        <Text style={s.back}>{t('settings_back')}</Text>
      </Pressable>

      <Text style={s.title}>{t('admin_feedback_title')}</Text>

      {!isAdmin ? (
        <Text style={s.empty}>{t('admin_feedback_denied')}</Text>
      ) : loading ? (
        <ActivityIndicator color="#e2b96f" style={s.loader} />
      ) : items.length === 0 ? (
        <Text style={s.empty}>{t('admin_feedback_empty')}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.meta}>{formatTimestamp(item.timestamp)}</Text>
                <Text style={s.meta}>{item.platform} {item.appVersion}</Text>
              </View>
              <Text style={s.message}>{item.message}</Text>
              <Text style={s.uid}>{item.uid}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = {
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 24, paddingTop: 60 } as const,
  back: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 8, marginBottom: 32 } as const,
  title: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 16, marginBottom: 24 } as const,
  loader: { marginTop: 40 } as const,
  listContent: { paddingBottom: 32 },
  empty: { fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 9, lineHeight: 18, textAlign: 'center' as const, marginTop: 48 },
  card: { backgroundColor: '#16213e', borderWidth: 1, borderColor: '#2d2d4e', padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, gap: 10, marginBottom: 10 },
  meta: { flex: 1, fontFamily: 'PressStart2P_400Regular', color: '#4a4a6a', fontSize: 6, lineHeight: 12 },
  message: { fontFamily: 'PressStart2P_400Regular', color: '#c8c8e8', fontSize: 8, lineHeight: 17, marginBottom: 12 },
  uid: { fontFamily: 'PressStart2P_400Regular', color: '#e2b96f', fontSize: 6, lineHeight: 12 },
};
